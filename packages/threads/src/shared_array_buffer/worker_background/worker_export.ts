import type { AllocatorUseArrayBufferObject } from "../allocator";
import { type AtomicTarget, new_atomic_target } from "../locker";

export type WorkerBackgroundRefObject = {
  allocator: AllocatorUseArrayBufferObject;
  lock: SharedArrayBuffer;
  locks: Record<"lock" | "call" | "done", AtomicTarget>;
  signature_input: SharedArrayBuffer;
};

export const WorkerBackgroundRefObjectConstructor =
  (): WorkerBackgroundRefObject => {
    return {
      allocator: {
        share_arrays_memory: new SharedArrayBuffer(10 * 1024),
        share_arrays_memory_lock: new_atomic_target(),
      },
      lock: new SharedArrayBuffer(20),
      locks: {
        lock: new_atomic_target(),
        call: new_atomic_target(),
        done: new_atomic_target(),
      },
      signature_input: new SharedArrayBuffer(24),
    };
  };

export type WorkerOptions = {
  type: "module" | "";
};
