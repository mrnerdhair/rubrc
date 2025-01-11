import { Locker, type LockerTarget, ViewSet } from "./locking";

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
  private readonly data: ViewSet<SharedArrayBuffer>;
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
    this.data = new ViewSet(
      share_arrays_memory,
      0,
      share_arrays_memory.byteLength,
    );
    this.locker = new Locker(share_arrays_memory_lock);
    this.data.i32[0] = 0;
    this.data.i32[1] = 0;
    this.data.i32[2] = 12;
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
      share_arrays_memory: this.data.buffer,
      share_arrays_memory_lock: this.locker.target,
    };
  }

  // Writes without blocking threads when acquiring locks
  async async_write(
    data: Uint8Array | Uint32Array | string,
  ): Promise<[ptr: number, len: number]> {
    return await this.locker.lock(() => this.write_inner(data));
  }

  // Blocking threads for writing when acquiring locks
  block_write(
    data: Uint8Array | Uint32Array | string,
  ): [ptr: number, len: number] {
    return this.locker.lock_blocking(() => this.write_inner(data));
  }

  // Function to write after acquiring a lock
  private write_inner(
    data: Uint8Array | Uint32Array | string,
  ): [ptr: number, len: number] {
    // Indicates more users using memory
    const old_num = Atomics.add(this.data.i32, 1, 1);
    let ptr: number;
    if (old_num === 0) {
      // Reset because there were no users.
      ptr = Atomics.store(this.data.i32, 2, 12);
    } else {
      ptr = Atomics.load(this.data.i32, 2);
    }

    const data8 = (() => {
      if (typeof data === "string") {
        return new TextEncoder().encode(data);
      }
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    })();

    const memory_len = this.data.byteLength;
    const len = data8.byteLength;
    const new_memory_len = ptr + len;
    if (memory_len < new_memory_len) {
      // extend memory
      // support from es2024
      // this.share_arrays_memory.grow(new_memory_len);
      throw new Error(
        "size is bigger than memory. \nTODO! fix memory limit. support big size another way.",
      );
    }

    this.data.u8.set(data8, ptr);
    Atomics.store(this.data.i32, 2, new_memory_len);

    return [ptr, len];
  }

  // free allocated memory
  private free(_pointer: number, _len: number) {
    Atomics.sub(this.data.i32, 1, 1);
  }

  // get memory from pointer and length
  get_memory(ptr: number, len: number): ViewSet {
    const buf = this.data.u8.slice(ptr, ptr + len).buffer;
    const out = new ViewSet(buf, 0, buf.byteLength);
    this.free(ptr, len);
    return out;
  }

  get_string(ptr: number, len: number): string {
    return new TextDecoder().decode(this.get_memory(ptr, len).u8);
  }
}
