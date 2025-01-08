import { AllocatorUseArrayBuffer } from "../allocator";
import {
  Caller,
  type CallerTarget,
  Listener,
  type ListenerTarget,
  Locker,
  type LockerTarget,
  // @ts-expect-error
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
  private caller: DummyCaller1;
  // @ts-expect-error
  private done_caller: Caller;
  // @ts-expect-error
  private done_listener: Listener;

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
    this.caller = new DummyCaller1(this.lock);
    this.done_caller = new Caller(this.locks.done_call);
    this.done_listener = new Listener(this.locks.done_listen);
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
      await this.caller.call_and_wait_blocking();
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

    // notify done = code 2
    const old = Atomics.compareExchange(notify_view, 0, 0, 2);

    if (old !== 0) {
      throw new Error("what happened?");
    }

    Atomics.store(notify_view, 1, code);

    const num = Atomics.notify(notify_view, 0);

    if (num === 0) {
      Atomics.store(notify_view, 0, 0);
    }
  }

  async async_wait_done_or_error(): Promise<number> {
    const notify_view = new Int32Array(this.lock, 8);

    Atomics.store(notify_view, 0, 0);

    const lock = await Atomics.waitAsync(notify_view, 0, 0).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
    if (lock === "not-equal") {
      throw new Error("not-equal");
    }

    const code = Atomics.load(notify_view, 0);
    try {
      switch (code) {
        // completed, fetch and return errno
        case 2: {
          const old = Atomics.compareExchange(notify_view, 0, 2, 0);
          if (old !== 2) {
            throw new Error("what happened?");
          }

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
          throw "unknown code";
        }
      }
    } catch (error) {
      if (typeof error === "string") throw new Error(error);
      const old = Atomics.compareExchange(notify_view, 0, 1, 0);

      if (old !== 1) {
        console.error("what happened?");
      }

      throw error;
    }
  }

  block_wait_done_or_error(): number {
    const notify_view = new Int32Array(this.lock, 8);

    Atomics.store(notify_view, 0, 0);

    const value = Atomics.wait(notify_view, 0, 0);
    if (value === "timed-out") {
      throw new Error("timed-out");
    }
    if (value === "not-equal") {
      throw new Error("not-equal");
    }

    const code = Atomics.load(notify_view, 0);
    try {
      switch (code) {
        // completed, fetch and return errno
        case 2: {
          const old = Atomics.compareExchange(notify_view, 0, 2, 0);
          if (old !== 2) {
            throw new Error("what happened?");
          }

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
          throw "unknown code";
        }
      }
    } catch (error) {
      if (typeof error === "string") throw new Error(error);
      const old = Atomics.compareExchange(notify_view, 0, 1, 0);

      if (old !== 1) {
        console.error("what happened?");
      }

      throw error;
    }
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

class DummyCaller1 {
  private readonly lock: SharedArrayBuffer;
  constructor(lock: SharedArrayBuffer) {
    this.lock = lock;
  }
  call_and_wait_blocking(): void {
    const view = new Int32Array(this.lock);
    const old = Atomics.exchange(view, 1, 1);
    Atomics.notify(view, 1, 1);
    if (old !== 0) {
      throw new Error("what happened?");
    }
    const lock = Atomics.wait(view, 1, 1);
    if (lock === "timed-out") {
      throw new Error("timed-out lock");
    }
  }

  async call_and_wait(): Promise<void> {
    const view = new Int32Array(this.lock);
    const old = Atomics.exchange(view, 1, 1);
    Atomics.notify(view, 1, 1);
    if (old !== 0) {
      throw new Error("what happened?");
    }
    const lock = await Atomics.waitAsync(view, 1, 1).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }
}
