import { AllocatorUseArrayBuffer } from "../allocator";
import { Caller } from "../caller";
import { Locker } from "../locker";
import * as Serializer from "../serialize_error";
import type { WorkerBackgroundRefObject, WorkerOptions } from "./worker_export";

export class WorkerBackgroundRef {
  private allocator: AllocatorUseArrayBuffer;
  private lock: SharedArrayBuffer;
  private signature_input: SharedArrayBuffer;
  private locker: Locker;
  private caller: Caller;

  constructor(
    allocator: AllocatorUseArrayBuffer,
    lock: SharedArrayBuffer,
    signature_input: SharedArrayBuffer,
  ) {
    this.allocator = allocator;
    this.lock = lock;
    this.signature_input = signature_input;
    this.locker = new Locker(this.lock, 0);
    this.caller = new Caller(this.lock, 4);
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
      this.allocator.block_write(url_buffer, this.signature_input, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      this.allocator.block_write(obj_buffer, this.signature_input, 4);
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
      await this.allocator.async_write(url_buffer, this.signature_input, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      await this.allocator.async_write(obj_buffer, this.signature_input, 4);
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
      this.allocator.block_write(url_buffer, this.signature_input, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      this.allocator.block_write(obj_buffer, this.signature_input, 4);
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

  private async async_wait_done_or_error(): Promise<number> {
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

    if (code === 2) {
      const old = Atomics.compareExchange(notify_view, 0, 2, 0);

      const code = Atomics.load(notify_view, 1);

      if (old !== 2) {
        throw new Error("what happened?");
      }

      return code;
    }

    if (code !== 1) {
      throw new Error("unknown code");
    }

    // get error
    const ptr = Atomics.load(notify_view, 1);
    const size = Atomics.load(notify_view, 2);
    const error_buffer = this.allocator.get_memory(ptr, size);
    const error_txt = new TextDecoder().decode(error_buffer);
    const error_serialized = JSON.parse(error_txt);
    if (!Serializer.isSerializedError(error_serialized))
      throw new Error("expected SerializedError");
    const error = Serializer.deserialize(error_serialized);

    const old = Atomics.compareExchange(notify_view, 0, 1, 0);

    if (old !== 1) {
      console.error("what happened?");
    }

    throw error;
  }

  private block_wait_done_or_error(): number {
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

    if (code === 2) {
      const old = Atomics.compareExchange(notify_view, 0, 2, 0);

      const code = Atomics.load(notify_view, 1);

      if (old !== 2) {
        throw new Error("what happened?");
      }

      return code;
    }

    if (code !== 1) {
      throw new Error("unknown code");
    }

    // get error
    const ptr = Atomics.load(notify_view, 1);
    const size = Atomics.load(notify_view, 2);
    const error_buffer = this.allocator.get_memory(ptr, size);
    const error_txt = new TextDecoder().decode(error_buffer);
    const error_serialized = JSON.parse(error_txt);
    if (!Serializer.isSerializedError(error_serialized))
      throw new Error("expected SerializedError");
    const error = Serializer.deserialize(error_serialized);

    const old = Atomics.compareExchange(notify_view, 0, 1, 0);

    if (old !== 1) {
      console.error("what happened?");
    }

    throw error;
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
