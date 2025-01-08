import { AllocatorUseArrayBuffer } from "../allocator";
import {
  type CallerTarget,
  DummyCaller3,
  DummyCaller4,
  DummyListener4,
  type ListenerTarget,
  Locker,
  type LockerTarget,
  NoListener,
} from "../locking";
import * as Serializer from "../serialize_error";
import type { WorkerBackgroundRefObject, WorkerOptions } from "./worker_export";

export class WorkerBackgroundRef {
  private allocator: AllocatorUseArrayBuffer;
  private lock: SharedArrayBuffer;
  private locks: {
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
    done_call: CallerTarget;
    done_listen: ListenerTarget;
  };
  private signature_input: SharedArrayBuffer;
  private locker: Locker;
  private caller: DummyCaller3;
  private done_caller: DummyCaller4;
  private done_listener: DummyListener4;

  constructor(
    allocator: AllocatorUseArrayBuffer,
    lock: SharedArrayBuffer,
    locks: {
      lock: LockerTarget;
      call: CallerTarget;
      listen: ListenerTarget;
      done_call: CallerTarget;
      done_listen: ListenerTarget;
    },
    signature_input: SharedArrayBuffer,
  ) {
    this.allocator = allocator;
    this.lock = lock;
    this.locks = locks;
    this.signature_input = signature_input;
    this.locker = new Locker(this.locks.lock);
    this.caller = new DummyCaller3(
      new Int32Array(this.locks.call.buf, this.locks.call.byteOffset, 1),
    );
    this.done_caller = new DummyCaller4(
      new Int32Array(
        this.locks.done_call.buf,
        this.locks.done_call.byteOffset,
        1,
      ),
    );
    this.done_listener = new DummyListener4(
      new Int32Array(
        this.locks.done_listen.buf,
        this.locks.done_listen.byteOffset,
        1,
      ),
    );
  }

  new_worker(
    url: string,
    options?: WorkerOptions,
    post_obj?: unknown,
  ): WorkerRef {
    return this.locker.lock_blocking(() => {
      const view = new Int32Array(this.signature_input);
      Atomics.store(view, 0, 1);
      const url_buffer = new TextEncoder().encode(url);
      this.allocator.block_write(url_buffer, view, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      this.allocator.block_write(obj_buffer, view, 4);
      this.caller.call_and_wait_blocking();

      const id = Atomics.load(view, 0);
      return new WorkerRef(id);
    });
  }

  async async_start_on_thread(
    url: string,
    options: WorkerOptions | undefined,
    post_obj: unknown,
  ) {
    await this.locker.lock(async () => {
      const view = new Int32Array(this.signature_input);
      Atomics.store(view, 0, 2);
      const url_buffer = new TextEncoder().encode(url);
      await this.allocator.async_write(url_buffer, view, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      await this.allocator.async_write(obj_buffer, view, 4);
      this.caller.call_and_wait_blocking();
    });
  }

  block_start_on_thread(
    url: string,
    options: WorkerOptions | undefined,
    post_obj: unknown,
  ) {
    this.locker.lock_blocking(() => {
      const view = new Int32Array(this.signature_input);
      Atomics.store(view, 0, 2);
      const url_buffer = new TextEncoder().encode(url);
      this.allocator.block_write(url_buffer, view, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      this.allocator.block_write(obj_buffer, view, 4);
      this.caller.call_and_wait_blocking();
    });
  }

  static async init(
    sl: WorkerBackgroundRefObject,
  ): Promise<WorkerBackgroundRef> {
    return new WorkerBackgroundRef(
      await AllocatorUseArrayBuffer.init(sl.allocator),
      sl.lock,
      sl.locks,
      sl.signature_input,
    );
  }

  done_notify(code: number): void {
    const notify_view = new Int32Array(this.lock, 8);
    Atomics.store(notify_view, 1, code);

    try {
      this.done_caller.call(2);
    } catch (e) {
      if (!(e instanceof NoListener)) throw e;
    }
  }

  async async_wait_done_or_error(): Promise<number> {
    const notify_view = new Int32Array(this.lock, 8);
    const listener = this.done_listener;
    listener.reset();

    return await listener.listen(async (code?: number) => {
      switch (code) {
        // completed, fetch and return errno
        case 2: {
          return Atomics.load(notify_view, 1);
        }
        // threw, fetch and rethrow error
        case 1: {
          const ptr = Atomics.load(notify_view, 1);
          const size = Atomics.load(notify_view, 2);
          const error_buffer = this.allocator.get_memory(ptr, size);
          const error_txt = new TextDecoder().decode(error_buffer);
          const error_serialized = JSON.parse(error_txt);
          if (!Serializer.isSerializedError(error_serialized))
            throw new Error("expected SerializedError");
          throw Serializer.deserialize(error_serialized);
        }
        default: {
          throw new Error("unknown code");
        }
      }
    });
  }

  block_wait_done_or_error(): number {
    const notify_view = new Int32Array(this.lock, 8);
    const listener = this.done_listener;
    listener.reset();

    return listener.listen_blocking((code?: number) => {
      switch (code) {
        // completed, fetch and return errno
        case 2: {
          return Atomics.load(notify_view, 1);
        }
        // threw, fetch and rethrow error
        case 1: {
          const ptr = Atomics.load(notify_view, 1);
          const size = Atomics.load(notify_view, 2);
          const error_buffer = this.allocator.get_memory(ptr, size);
          const error_txt = new TextDecoder().decode(error_buffer);
          const error_serialized = JSON.parse(error_txt);
          if (!Serializer.isSerializedError(error_serialized))
            throw new Error("expected SerializedError");
          throw Serializer.deserialize(error_serialized);
        }
        default: {
          throw new Error("unknown code");
        }
      }
    });
  }
}

export class WorkerRef {
  private id: number;

  constructor(id: number) {
    this.id = id;
  }

  get_id(): number {
    return this.id;
  }
}
