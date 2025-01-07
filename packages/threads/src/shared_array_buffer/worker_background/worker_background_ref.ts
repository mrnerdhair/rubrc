import { AllocatorUseArrayBuffer } from "../allocator";
import {
  Caller,
  type CallerTarget,
  Listener,
  type ListenerTarget,
  Locker,
  type LockerTarget,
} from "../locking";
import * as Serializer from "../serialize_error";
import {
  WorkerBackgroundFuncNames,
  WorkerBackgroundReturnCodes,
} from "../util";
import type { WorkerBackgroundRefObject, WorkerOptions } from "./worker_export";

export class WorkerBackgroundRef {
  private readonly allocator: AllocatorUseArrayBuffer;
  private readonly lock: SharedArrayBuffer;
  private readonly locks: {
    lock: LockerTarget;
    call: CallerTarget;
    done_call: CallerTarget;
    done_listen: ListenerTarget;
  };
  private readonly signature_input: SharedArrayBuffer;
  private readonly next_worker_id: SharedArrayBuffer;
  private readonly locker: Locker;
  private readonly caller: Caller;
  private readonly done_caller: Caller;
  private readonly done_listener: Listener;

  protected constructor(
    allocator: AllocatorUseArrayBuffer,
    lock: SharedArrayBuffer,
    locks: {
      lock: LockerTarget;
      call: CallerTarget;
      done_call: CallerTarget;
      done_listen: ListenerTarget;
    },
    signature_input: SharedArrayBuffer,
    next_worker_id: SharedArrayBuffer,
  ) {
    this.allocator = allocator;
    this.lock = lock;
    this.locks = locks;
    this.signature_input = signature_input;
    this.next_worker_id = next_worker_id;
    this.locker = new Locker(this.locks.lock);
    this.caller = new Caller(this.locks.call);
    this.done_caller = new Caller(this.locks.done_call, null);
    this.done_listener = new Listener(this.locks.done_listen, null);
  }

  new_worker(
    url: string,
    options?: WorkerOptions,
    post_obj?: unknown,
  ): WorkerRef {
    return this.locker.lock_blocking(() => {
      const view = new Int32Array(this.signature_input);
      Atomics.store(view, 0, WorkerBackgroundFuncNames.create_new_worker);

      const id = Atomics.add(new Uint32Array(this.next_worker_id, 0, 1), 0, 1);
      Atomics.store(view, 6, id);

      const url_buffer = new TextEncoder().encode(url);
      this.allocator.block_write(url_buffer, view, 1);
      Atomics.store(view, 3, options?.type === "module" ? 1 : 0);
      const obj_json = JSON.stringify(post_obj);
      const obj_buffer = new TextEncoder().encode(obj_json);
      this.allocator.block_write(obj_buffer, view, 4);
      this.caller.call();

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
      Atomics.store(view, 0, WorkerBackgroundFuncNames.create_start);
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

  static async init(
    sl: WorkerBackgroundRefObject,
  ): Promise<WorkerBackgroundRef> {
    return new WorkerBackgroundRef(
      await AllocatorUseArrayBuffer.init(sl.allocator),
      sl.lock,
      sl.locks,
      sl.signature_input,
      sl.next_worker_id,
    );
  }

  done_notify(code: number): void {
    const notify_view = new Int32Array(this.lock, 8);

    Atomics.store(notify_view, 1, code);

    this.done_caller.call(WorkerBackgroundReturnCodes.completed);
  }

  private async async_wait_done_or_error(): Promise<number> {
    const notify_view = new Int32Array(this.lock, 8);
    const listener = this.done_listener;
    listener.reset();

    return await listener.listen(async (code?: number) => {
      switch (code) {
        // completed, fetch and return errno
        case WorkerBackgroundReturnCodes.completed: {
          return Atomics.load(notify_view, 1);
        }
        // threw, fetch and rethrow error
        case WorkerBackgroundReturnCodes.threw: {
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
