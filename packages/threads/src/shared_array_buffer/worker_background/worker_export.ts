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
  next_worker_id: SharedArrayBuffer;
  [workerBackgroundRefObjectBrand]: never;
};

export const WorkerBackgroundRefObjectConstructor =
  (): WorkerBackgroundRefObject => {
    const [call, listen] = new_caller_listener_target(
      5 * Int32Array.BYTES_PER_ELEMENT,
    );
    const [done_call, done_listen] = new_caller_listener_target(
      3 * Int32Array.BYTES_PER_ELEMENT,
    );
    const next_worker_id = new SharedArrayBuffer(4);
    // worker_id starts from 1
    Atomics.store(new Uint32Array(next_worker_id, 0, 1), 0, 1);
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
      next_worker_id,
    } as WorkerBackgroundRefObject;
  };

export type WorkerOptions = {
  type: "module" | "";
};
