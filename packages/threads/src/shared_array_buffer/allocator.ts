import { Locker, type LockerTarget } from "./locking";

export type AllocatorUseArrayBufferObject = {
  share_arrays_memory: SharedArrayBuffer;
  share_arrays_memory_lock: LockerTarget;
};

export class AllocatorUseArrayBuffer {
  // Pass a !Sized type
  // The first 4 bytes are for a lock value: i32
  // The next 4 bytes are for the current number of arrays: m: i32
  // The next 4 bytes are for the length of the occupied space in share_arrays_memory: n: i32
  // Once it is no longer busy, it should become empty immediately, so reset only when it is empty.
  // Even if it becomes too long, it should be fine due to the browser's virtualization.
  // Using an algorithm even simpler than First-Fit
  // SharedArrayBuffer.grow is supported by all major browsers except Android WebView,
  // which does not support SharedArrayBuffer in the first place,
  // but es2024 and the type system does not support it,
  // so the size is fixed from the beginning

  // share_arrays_memory: SharedArrayBuffer = new SharedArrayBuffer(12, {
  //   // 10MB
  //   maxByteLength: 10 * 1024 * 1024,
  // });

  // Even if 100MB is allocated, due to browser virtualization,
  // the memory should not actually be used until it is needed.
  private readonly share_arrays_memory: SharedArrayBuffer;
  private readonly share_arrays_memory_lock: LockerTarget;

  private readonly locker: Locker;

  // Since postMessage makes the class an object,
  // it must be able to receive and assign a SharedArrayBuffer.
  protected constructor({
    share_arrays_memory,
    share_arrays_memory_lock,
  }: {
    share_arrays_memory: SharedArrayBuffer;
    share_arrays_memory_lock: LockerTarget;
  }) {
    this.share_arrays_memory = share_arrays_memory;
    this.share_arrays_memory_lock = share_arrays_memory_lock;
    const view = new Int32Array(this.share_arrays_memory);
    Atomics.store(view, 0, 0);
    Atomics.store(view, 1, 0);
    Atomics.store(view, 2, 12);
    this.locker = new Locker(this.share_arrays_memory_lock);
  }

  // Since postMessage converts classes to objects,
  // it must be able to convert objects to classes.
  static async init(
    sl: AllocatorUseArrayBufferObject,
  ): Promise<AllocatorUseArrayBuffer> {
    return new AllocatorUseArrayBuffer(sl);
  }

  get_ref(): AllocatorUseArrayBufferObject {
    return {
      share_arrays_memory: this.share_arrays_memory,
      share_arrays_memory_lock: this.share_arrays_memory_lock,
    };
  }

  // Writes without blocking threads when acquiring locks
  async async_write(
    data: Uint8Array | Uint32Array,
    memory: Uint32Array | Int32Array,
    // ptr, len
    // Pass I32Array ret_ptr
    ret_ptr: number,
  ): Promise<void> {
    await this.locker.lock(() => this.write_inner(data, memory, ret_ptr));
  }

  // Blocking threads for writing when acquiring locks
  block_write(
    data: Uint8Array | Uint32Array,
    memory: Uint32Array | Int32Array,
    // ptr, len
    ret_ptr: number,
  ): void {
    this.locker.lock_blocking(() => this.write_inner(data, memory, ret_ptr));
  }

  // Function to write after acquiring a lock
  private write_inner(
    data: Uint8Array | Uint32Array,
    memory: Uint32Array | Int32Array,
    // ptr, len
    ret_ptr: number,
  ): void {
    const view = new Int32Array(this.share_arrays_memory);
    const view8 = new Uint8Array(this.share_arrays_memory);

    // Indicates more users using memory
    const old_num = Atomics.add(view, 1, 1);
    let share_arrays_memory_kept: number;
    if (old_num === 0) {
      // Reset because there were no users.
      share_arrays_memory_kept = Atomics.store(view, 2, 12);
    } else {
      share_arrays_memory_kept = Atomics.load(view, 2);
    }

    const memory_len = this.share_arrays_memory.byteLength;
    const len = data.byteLength;
    const new_memory_len = share_arrays_memory_kept + len;
    if (memory_len < new_memory_len) {
      // extend memory
      // support from es2024
      // this.share_arrays_memory.grow(new_memory_len);
      throw new Error(
        "size is bigger than memory. \nTODO! fix memory limit. support big size another way.",
      );
    }

    let data8: Uint8Array;
    if (data instanceof Uint8Array) {
      data8 = data;
    } else if (data instanceof Uint32Array) {
      // data to uint8
      const tmp = new ArrayBuffer(data.byteLength);
      new Uint32Array(tmp).set(data);
      data8 = new Uint8Array(tmp);
    } else {
      throw new Error("data8 used before assignment");
    }

    view8.set(new Uint8Array(data8), share_arrays_memory_kept);
    Atomics.store(view, 2, new_memory_len);

    Atomics.store(memory, ret_ptr, share_arrays_memory_kept);
    Atomics.store(memory, ret_ptr + 1, len);
  }

  // free allocated memory
  free(_pointer: number, _len: number) {
    Atomics.sub(new Int32Array(this.share_arrays_memory), 1, 1);
  }

  // get memory from pointer and length
  get_memory(ptr: number, len: number): ArrayBuffer {
    return new Uint8Array(this.share_arrays_memory).slice(ptr, ptr + len).buffer;
  }
}
