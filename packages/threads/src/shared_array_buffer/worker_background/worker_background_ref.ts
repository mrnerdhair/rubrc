import { AllocatorUseArrayBuffer } from "../allocator";
import { type AtomicTarget, Caller, Listener, Locker } from "../locking";
import * as Serializer from "../serialize_error";
import type { WorkerBackgroundRefObject, WorkerOptions } from "./worker_export";

export class WorkerBackgroundRef {
  private allocator: AllocatorUseArrayBuffer;
  private lock: SharedArrayBuffer;
  private locks: Record<"lock" | "call" | "done", AtomicTarget>;
  private signature_input: SharedArrayBuffer;
  private locker: Locker;
  private caller: Caller;

  constructor(
    allocator: AllocatorUseArrayBuffer,
    lock: SharedArrayBuffer,
    locks: Record<"lock" | "call" | "done", AtomicTarget>,
    signature_input: SharedArrayBuffer,
  ) {
    this.allocator = allocator;
    this.lock = lock;
    this.locks = locks;
    this.signature_input = signature_input;
    this.locker = new Locker(this.locks.lock);
    this.caller = new Caller(this.locks.call);
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
      await this.caller.call_and_wait();
    });
    return this.async_wait_done_or_error();
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
    return this.block_wait_done_or_error();
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

    new Caller(this.locks.done, null).call(2);
  }

  private async async_wait_done_or_error(): Promise<number> {
    const notify_view = new Int32Array(this.lock, 8);
    const listener = new Listener(this.locks.done, null);
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

  private block_wait_done_or_error(): number {
    const notify_view = new Int32Array(this.lock, 8);
    const listener = new Listener(this.locks.done, null);
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
