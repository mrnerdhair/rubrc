export type ViewSet<
  T extends ArrayBufferLike = ArrayBufferLike,
  U extends 8 | 16 | 32 | 64 = 64,
> = U extends 64
  ? ViewSet64<T>
  : U extends 32
    ? ViewSet32<T>
    : U extends 16
      ? ViewSet16<T>
      : ViewSet8<T>;

export class ViewSet8<T extends ArrayBufferLike = ArrayBufferLike> {
  readonly buffer: T;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly view: DataView<T>;
  readonly i8: Int8Array<T>;
  readonly u8: Uint8Array<T>;

  constructor(buffer: T, byteOffset: number, byteLength: number) {
    this.buffer = buffer;
    this.byteOffset = byteOffset;
    this.byteLength = byteLength;
    this.view = new DataView(buffer, byteOffset, byteLength);
    this.i8 = new Int8Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / Int8Array.BYTES_PER_ELEMENT),
    );
    this.u8 = new Uint8Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / Uint8Array.BYTES_PER_ELEMENT),
    );
  }

  zeroize() {
    this.u8.fill(0);
  }

  slice(byteOffset: number, byteLength: number): ViewSet8<T> {
    return this.slice8(byteOffset, byteLength);
  }

  slice8(byteOffset: number, byteLength: number): ViewSet8<T> {
    return new ViewSet8<T>(
      this.buffer,
      this.byteOffset + byteOffset,
      byteLength,
    );
  }

  slice16(byteOffset: number, byteLength: number): ViewSet16<T> {
    return new ViewSet16<T>(
      this.buffer,
      this.byteOffset + byteOffset,
      byteLength,
    );
  }

  slice32(byteOffset: number, byteLength: number): ViewSet32<T> {
    return new ViewSet32<T>(
      this.buffer,
      this.byteOffset + byteOffset,
      byteLength,
    );
  }

  slice64(byteOffset: number, byteLength: number): ViewSet64<T> {
    return new ViewSet64<T>(
      this.buffer,
      this.byteOffset + byteOffset,
      byteLength,
    );
  }
}

export class ViewSet16<
  T extends ArrayBufferLike = ArrayBufferLike,
> extends ViewSet8<T> {
  readonly i16: Int16Array<T>;
  readonly u16: Uint16Array<T>;

  constructor(buffer: T, byteOffset: number, byteLength: number) {
    super(buffer, byteOffset, byteLength);
    this.i16 = new Int16Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / Int16Array.BYTES_PER_ELEMENT),
    );
    this.u16 = new Uint16Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / Uint16Array.BYTES_PER_ELEMENT),
    );
  }

  zeroize() {
    this.u16.fill(0);
  }

  slice(byteOffset: number, byteLength: number): ViewSet16<T> {
    return this.slice16(byteOffset, byteLength);
  }
}

export class ViewSet32<
  T extends ArrayBufferLike = ArrayBufferLike,
> extends ViewSet16<T> {
  readonly i32: Int32Array<T>;
  readonly u32: Uint32Array<T>;

  constructor(buffer: T, byteOffset: number, byteLength: number) {
    super(buffer, byteOffset, byteLength);
    this.i32 = new Int32Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / Int32Array.BYTES_PER_ELEMENT),
    );
    this.u32 = new Uint32Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / Uint32Array.BYTES_PER_ELEMENT),
    );
  }

  zeroize() {
    this.u32.fill(0);
  }

  slice(byteOffset: number, byteLength: number): ViewSet32<T> {
    return this.slice32(byteOffset, byteLength);
  }
}

export class ViewSet64<
  T extends ArrayBufferLike = ArrayBufferLike,
> extends ViewSet32<T> {
  readonly i64: BigInt64Array<T>;
  readonly u64: BigUint64Array<T>;

  constructor(buffer: T, byteOffset: number, byteLength: number) {
    super(buffer, byteOffset, byteLength);
    this.i64 = new BigInt64Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / BigInt64Array.BYTES_PER_ELEMENT),
    );
    this.u64 = new BigUint64Array(
      buffer,
      byteOffset,
      Math.floor(byteLength / BigUint64Array.BYTES_PER_ELEMENT),
    );
  }

  zeroize() {
    this.u64.fill(0n);
  }

  slice(byteOffset: number, byteLength: number): ViewSet64<T> {
    return this.slice64(byteOffset, byteLength);
  }
}
