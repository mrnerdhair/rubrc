import { AllocatorUseArrayBuffer } from "../allocator";
import { Caller, Listener, Locker } from "../locking";
import * as Serializer from "../serialize_error";
import {
  WorkerBackgroundFuncNames,
  WorkerBackgroundReturnCodes,
} from "../util";
import type { WorkerBackgroundRefObject } from "./worker_export";

export class WorkerBackgroundRef {
  private readonly allocator: AllocatorUseArrayBuffer;
  private readonly locker: Locker;
  private readonly caller: Caller;
  private readonly done_listener: Listener;

  protected constructor(
    allocator: AllocatorUseArrayBuffer,
    locker: Locker,
    caller: Caller,
    done_listener: Listener,
  ) {
    this.allocator = allocator;
    this.locker = locker;
    this.caller = caller;
    this.done_listener = done_listener;
  }

  new_worker(post_obj: {
    start_arg: number;
    args: Array<string>;
    env: Array<string>;
    fd_map: Array<[number, number] | undefined>;
  }): number {
    return this.locker.lock_blocking(() => {
      const id = this.caller.call_and_wait_blocking(
        (data) => {
          data.i32[0] = WorkerBackgroundFuncNames.create_new_worker;
          [data.i32[1], data.i32[2]] = this.allocator.block_write(
            JSON.stringify(post_obj),
          );
        },
        (data) => data.i32[0],
      );
      return id;
    });
  }

  async start_on_thread(post_obj: {
    args: Array<string>;
    env: Array<string>;
    fd_map: Array<[number, number] | undefined>;
  }) {
    await this.locker.lock(async () => {
      await this.caller.call_and_wait((data) => {
        data.i32[0] = WorkerBackgroundFuncNames.create_start;
        [data.i32[1], data.i32[2]] = this.allocator.block_write(
          JSON.stringify(post_obj),
        );
      });
    });
    return await this.async_wait_done_or_error();
  }

  static async init(
    sl: WorkerBackgroundRefObject,
  ): Promise<WorkerBackgroundRef> {
    const [allocator, locker, caller, done_listener] = await Promise.all([
      AllocatorUseArrayBuffer.init(sl.allocator),
      Locker.init(sl.lock),
      Caller.init(sl.call),
      Listener.init(sl.done_listen),
    ]);
    return new WorkerBackgroundRef(allocator, locker, caller, done_listener);
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
          const error_serialized = JSON.parse(
            this.allocator.get_string(ptr, size),
          );
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
