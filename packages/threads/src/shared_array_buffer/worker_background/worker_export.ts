import type { AtomicTarget } from "../locking/target";
import type { AllocatorUseArrayBufferObject } from "../allocator";
import {
  type AsyncCallerTarget,
  type CallerTarget,
  type ListenerTarget,
  type LockerTarget,
  new_async_caller_listener_target,
  new_caller_listener_target,
  new_locker_target,
} from "../locking";

declare const workerBackgroundRefObjectBrand: unique symbol;
export type WorkerBackgroundRefObject = {
  allocator: AllocatorUseArrayBufferObject;
  lock: SharedArrayBuffer;
  locks: {
    lock: LockerTarget;
    call: AsyncCallerTarget;
    listen: ListenerTarget;
    done_listen: ListenerTarget;
    done_call: CallerTarget;
  };
  signature_input: SharedArrayBuffer;
  next_worker_id: SharedArrayBuffer;
  [workerBackgroundRefObjectBrand]: never;
};

let n = 1;

export const WorkerBackgroundRefObjectConstructor =
  (): WorkerBackgroundRefObject => {
    const [call, listen] = new_async_caller_listener_target();
    const [done_call, done_listen] = new_caller_listener_target();
    const next_worker_id = new SharedArrayBuffer(4);
    // worker_id starts from 1
    Atomics.store(new Uint32Array(next_worker_id, 0, 1), 0, 1);
    const out = {
      allocator: {
        share_arrays_memory: new SharedArrayBuffer(10 * 1024),
        share_arrays_memory_lock: new_locker_target(),
      },
      lock: new SharedArrayBuffer(20),
      locks: {
        lock: new_locker_target(),
        call,
        listen,
        done_call,
        done_listen,
      },
      signature_input: new SharedArrayBuffer(7 * Int32Array.BYTES_PER_ELEMENT),
      next_worker_id,
    } as WorkerBackgroundRefObject;

    const foo = (target: AtomicTarget) => {
      const view = new Int32Array(target.buf, target.byteOffset)
      Atomics.store(view, 3, 1000 * n++);
      Atomics.store(view, 4, 1000 * n++);
    }

    foo(out.allocator.share_arrays_memory_lock);
    foo(out.locks.lock);
    foo(out.locks.call);
    foo(out.locks.listen);
    foo(out.locks.done_call);
    foo(out.locks.done_listen);

    return out;
  };

export type WorkerOptions = {
  type: "module" | "";
};
