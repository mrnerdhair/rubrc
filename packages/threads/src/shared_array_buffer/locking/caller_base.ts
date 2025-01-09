import { LockingBase } from "./locking_base";
import type { WaitOnGen } from "./waiter_base";

export class ViewSet<T extends ArrayBufferLike = ArrayBufferLike> {
  readonly buffer: T;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly view: DataView<T>;
  readonly i8: Int8Array<T>;
  readonly i16: Int16Array<T>;
  readonly i32: Int32Array<T>;
  readonly i64: BigInt64Array<T>;
  readonly u8: Uint8Array<T>;
  readonly u16: Uint16Array<T>;
  readonly u32: Uint32Array<T>;
  readonly u64: BigUint64Array<T>;

  constructor(buffer: T, byteOffset: number, byteLength: number) {
    this.buffer = buffer;
    this.byteOffset = byteOffset;
    this.byteLength = byteLength;
    this.view = new DataView(buffer, byteOffset, byteLength);
    this.i8 = new Int8Array(
      buffer,
      byteOffset,
      byteLength / Int8Array.BYTES_PER_ELEMENT,
    );
    this.i16 = new Int16Array(
      buffer,
      byteOffset,
      byteLength / Int16Array.BYTES_PER_ELEMENT,
    );
    this.i32 = new Int32Array(
      buffer,
      byteOffset,
      byteLength / Int32Array.BYTES_PER_ELEMENT,
    );
    this.i64 = new BigInt64Array(
      buffer,
      byteOffset,
      byteLength / BigInt64Array.BYTES_PER_ELEMENT,
    );
    this.u8 = new Uint8Array(
      buffer,
      byteOffset,
      byteLength / Uint8Array.BYTES_PER_ELEMENT,
    );
    this.u16 = new Uint16Array(
      buffer,
      byteOffset,
      byteLength / Uint16Array.BYTES_PER_ELEMENT,
    );
    this.u32 = new Uint32Array(
      buffer,
      byteOffset,
      byteLength / Uint32Array.BYTES_PER_ELEMENT,
    );
    this.u64 = new BigUint64Array(
      buffer,
      byteOffset,
      byteLength / BigUint64Array.BYTES_PER_ELEMENT,
    );
  }
}

export abstract class CallerBase extends LockingBase {
  abstract reset(): void;

  protected abstract call_and_wait_inner<T>(
    callback?: (data: ViewSet<SharedArrayBuffer>) => T,
  ): WaitOnGen<T>;

  async call_and_wait<T>(
    callback?: (data: ViewSet<SharedArrayBuffer>) => T,
  ): Promise<T> {
    return await this.wait_on_async(this.call_and_wait_inner(callback));
  }

  call_and_wait_blocking<T>(
    callback?: (data: ViewSet<SharedArrayBuffer>) => T,
  ): T {
    return this.wait_on(this.call_and_wait_inner(callback));
  }
}
