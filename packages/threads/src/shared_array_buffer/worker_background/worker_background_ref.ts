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
  private readonly locks: {
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
    done_call: CallerTarget;
    done_listen: ListenerTarget;
  };
  private readonly next_worker_id: SharedArrayBuffer;
  private readonly locker: Locker;
  private readonly caller: Caller;
  private readonly done_caller: Caller;
  private readonly done_listener: Listener;

  protected constructor(
    allocator: AllocatorUseArrayBuffer,
    locks: {
      lock: LockerTarget;
      call: CallerTarget;
      listen: ListenerTarget;
      done_call: CallerTarget;
      done_listen: ListenerTarget;
    },
    next_worker_id: SharedArrayBuffer,
  ) {
    this.allocator = allocator;
    this.locks = locks;
    this.next_worker_id = next_worker_id;
    this.locker = new Locker(this.locks.lock);
    this.caller = new Caller(this.locks.call);
    this.done_caller = new Caller(this.locks.done_call);
    this.done_listener = new Listener(this.locks.done_listen);
  }

  new_worker(options: WorkerOptions, post_obj: unknown): WorkerRef {
    const id = Atomics.add(new Uint32Array(this.next_worker_id, 0, 1), 0, 1);
    return this.locker.lock_blocking(() => {
      this.caller.call_and_wait_blocking(
        (data) => {
          data.i32[0] = WorkerBackgroundFuncNames.create_new_worker;
          data.i32[1] = options.type === "module" ? 1 : 0;

          const ptr_buff = new Uint32Array(2);
          const obj_json = JSON.stringify(post_obj);
          const obj_buffer = new TextEncoder().encode(obj_json);
          this.allocator.block_write(obj_buffer, ptr_buff, 0);

          data.i32[2] = ptr_buff[0];
          data.i32[3] = ptr_buff[1];

          data.i32[4] = id;
        },
      );
      return new WorkerRef(id);
    });
  }

  async async_start_on_thread(options: WorkerOptions, post_obj: unknown) {
    await this.locker.lock(async () => {
      await this.caller.call_and_wait((data) => {
        data.i32[0] = WorkerBackgroundFuncNames.create_start;
        data.i32[1] = options.type === "module" ? 1 : 0;

        const ptr_buff = new Uint32Array(2);
        const obj_json = JSON.stringify(post_obj);
        const obj_buffer = new TextEncoder().encode(obj_json);
        this.allocator.block_write(obj_buffer, ptr_buff, 0);

        data.i32[2] = ptr_buff[0];
        data.i32[3] = ptr_buff[1];
      });
    });
    return await this.async_wait_done_or_error();
  }

  static async init(
    sl: WorkerBackgroundRefObject,
  ): Promise<WorkerBackgroundRef> {
    return new WorkerBackgroundRef(
      await AllocatorUseArrayBuffer.init(sl.allocator),
      sl.locks,
      sl.next_worker_id,
    );
  }

  done_notify(code: number): void {
    this.done_caller.call_and_wait_blocking((data) => {
      data.i32[0] = WorkerBackgroundReturnCodes.completed;
      data.i32[1] = code;
    });
  }

  private async async_wait_done_or_error(): Promise<number> {
    const listener = this.done_listener;
    listener.reset();

    return await listener.listen((data) => {
      const code = data.i32[0];
      switch (code) {
        // completed, fetch and return errno
        case WorkerBackgroundReturnCodes.completed: {
          return data.i32[1];
        }
        // threw, fetch and rethrow error
        case WorkerBackgroundReturnCodes.threw: {
          const ptr = data.i32[1];
          const size = data.i32[2];
          const error_buffer = this.allocator.get_memory(ptr, size);
          const error_txt = new TextDecoder().decode(error_buffer);
          const error_serialized = JSON.parse(error_txt);
          if (!Serializer.isSerializedError(error_serialized))
            throw new Error("expected SerializedError");
          throw Serializer.deserialize(error_serialized);
        }
        default: {
          throw new Error(`unknown code ${code}`);
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
