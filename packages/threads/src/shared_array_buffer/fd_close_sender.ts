import type { FdCloseSender } from "../sender";
import type { LockerTarget } from "./locking";
import {
  ToRefSenderUseArrayBuffer,
  type ToRefSenderUseArrayBufferObject,
} from "./sender";

export type FdCloseSenderUseArrayBufferObject = {
  max_share_arrays_memory?: number;
} & ToRefSenderUseArrayBufferObject;

// Object to tell other processes,
// such as child processes,
// that the file descriptor has been closed
export class FdCloseSenderUseArrayBuffer
  extends ToRefSenderUseArrayBuffer
  implements FdCloseSender, FdCloseSenderUseArrayBufferObject
{
  // Should be able to change the size of memory as it accumulates more and more on memory
  constructor(
    max_share_arrays_memory?: number,
    share_arrays_memory?: SharedArrayBuffer,
    share_arrays_memory_lock?: LockerTarget,
  ) {
    super(
      4,
      max_share_arrays_memory,
      share_arrays_memory,
      share_arrays_memory_lock,
    );
  }

  // Send the closed file descriptor to the target process
  async send(targets: Array<number>, fd: number): Promise<void> {
    if (targets === undefined || targets.length === 0) {
      throw new Error("targets is empty");
    }
    await this.async_send(targets, new Uint32Array([fd]));
  }

  // Get the closed file descriptor from the target process
  get(id: number): Array<number> | undefined {
    return this.get_data(id)?.map((x) => x[0]);
  }

  get_ref(): FdCloseSenderUseArrayBufferObject {
    return {
      data_size: this.data_size,
      share_arrays_memory: this.share_arrays_memory,
      share_arrays_memory_lock: this.share_arrays_memory_lock,
    };
  }

  // Initialize the class from object
  static async init(
    sl: FdCloseSenderUseArrayBufferObject,
  ): Promise<FdCloseSender> {
    return new FdCloseSenderUseArrayBuffer(
      sl.share_arrays_memory.byteLength,
      sl.share_arrays_memory,
      sl.share_arrays_memory_lock,
    );
  }
}
