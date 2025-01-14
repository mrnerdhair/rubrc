export class ViewSet<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
  implements ArrayBufferView<TArrayBuffer>
{
  readonly buffer: TArrayBuffer;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly view: DataView<TArrayBuffer>;
  readonly i8: Int8Array<TArrayBuffer>;
  readonly i16: Int16Array<TArrayBuffer>;
  readonly i32: Int32Array<TArrayBuffer>;
  readonly i64: BigInt64Array<TArrayBuffer>;
  readonly u8: Uint8Array<TArrayBuffer>;
  readonly u16: Uint16Array<TArrayBuffer>;
  readonly u32: Uint32Array<TArrayBuffer>;
  readonly u64: BigUint64Array<TArrayBuffer>;

  constructor(buffer: TArrayBuffer, byteOffset: number, byteLength: number) {
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
