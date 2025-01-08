import type { AllocatorUseArrayBufferObject } from "../allocator";
import { new_locker_target } from "../locking";

export type WorkerBackgroundRefObject = {
  allocator: AllocatorUseArrayBufferObject;
  lock: SharedArrayBuffer;
  signature_input: SharedArrayBuffer;
};

export const WorkerBackgroundRefObjectConstructor =
  (): WorkerBackgroundRefObject => {
    return {
      allocator: {
        share_arrays_memory: new SharedArrayBuffer(10 * 1024),
        share_arrays_memory_lock: new_locker_target(),
      },
      lock: new SharedArrayBuffer(20),
      signature_input: new SharedArrayBuffer(24),
    };
  };

export type WorkerOptions = {
  type: "module" | "";
};
