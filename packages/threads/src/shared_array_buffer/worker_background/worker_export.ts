import type { AllocatorUseArrayBufferObject } from "../allocator";
import {
  type CallerTarget,
  type ListenerTarget,
  type LockerTarget,
  new_caller_listener_target,
  new_locker_target,
} from "../locking";

declare const workerBackgroundRefObjectBrand: unique symbol;
export type WorkerBackgroundRefObject = {
  allocator: AllocatorUseArrayBufferObject;
  locks: {
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
    done_call: CallerTarget;
    done_listen: ListenerTarget;
  };
  [workerBackgroundRefObjectBrand]: never;
};

export const WorkerBackgroundRefObjectConstructor =
  (): WorkerBackgroundRefObject => {
    const [call, listen] = new_caller_listener_target(
      3 * Int32Array.BYTES_PER_ELEMENT,
    );
    const [done_call, done_listen] = new_caller_listener_target(
      3 * Int32Array.BYTES_PER_ELEMENT,
    );
    return {
      allocator: {
        share_arrays_memory: new SharedArrayBuffer(10 * 1024),
        share_arrays_memory_lock: new_locker_target(),
      },
      locks: {
        lock: new_locker_target(),
        call,
        listen,
        done_call,
        done_listen,
      },
    } as WorkerBackgroundRefObject;
  };

export type WorkerOptions = {
  type: "module" | "";
};
