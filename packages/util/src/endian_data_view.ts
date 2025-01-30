export abstract class EndianDataView<
    TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
  >
  extends Uint8Array<TArrayBuffer>
  implements DataView<TArrayBuffer>
{
  abstract readonly littleEndian: boolean;
  readonly #view: DataView;

  constructor(length: number);
  constructor(buffer: TArrayBuffer, byteOffset?: number, byteLength?: number);
  constructor(...args: ConstructorParameters<typeof Uint8Array>) {
    // @ts-expect-error the multiple overloads of the Uint8Array constructor, some
    // of which are generic, confuse typechecking. Workarounds are possible but ugly.
    super(...args);
    this.#view = new DataView(this.buffer, this.byteOffset, this.byteLength);
  }

  subarray(...args: Parameters<Uint8Array<TArrayBuffer>["subarray"]>): this {
    return super.subarray(...args) as unknown as this;
  }

  *stride(
    byteOffset: number,
    strideSize: number,
    maxNumStrides = Number.POSITIVE_INFINITY,
  ): Generator<this, this, undefined> {
    let self = this.subarray(byteOffset);
    for (let i = 0; i < maxNumStrides; i++) {
      if (self.byteLength < strideSize) break;
      const out = self.subarray(0, strideSize);
      self = self.subarray(strideSize);
      yield out;
    }
    return self;
  }

  split(byteOffset: number): [this, this] {
    return [this.subarray(0, byteOffset), this.subarray(byteOffset)];
  }

  getBigInt64(byteOffset: number, littleEndian?: boolean): bigint {
    return this.#view.getBigInt64(
      byteOffset,
      littleEndian ?? this.littleEndian,
    );
  }
  getBigUint64(byteOffset: number, littleEndian?: boolean): bigint {
    return this.#view.getBigUint64(
      byteOffset,
      littleEndian ?? this.littleEndian,
    );
  }
  getFloat32(byteOffset: number, littleEndian?: boolean): number {
    return this.#view.getFloat32(byteOffset, littleEndian ?? this.littleEndian);
  }
  getFloat64(byteOffset: number, littleEndian?: boolean): number {
    return this.#view.getFloat64(byteOffset, littleEndian ?? this.littleEndian);
  }
  getInt8(byteOffset: number, _littleEndian?: boolean): number {
    return this.#view.getInt8(byteOffset);
  }
  getInt16(byteOffset: number, littleEndian?: boolean): number {
    return this.#view.getInt16(byteOffset, littleEndian ?? this.littleEndian);
  }
  getInt32(byteOffset: number, littleEndian?: boolean): number {
    return this.#view.getInt32(byteOffset, littleEndian ?? this.littleEndian);
  }
  getUint8(byteOffset: number, _littleEndian?: boolean): number {
    return this.#view.getUint8(byteOffset);
  }
  getUint16(byteOffset: number, littleEndian?: boolean): number {
    return this.#view.getUint16(byteOffset, littleEndian ?? this.littleEndian);
  }
  getUint32(byteOffset: number, littleEndian?: boolean): number {
    return this.#view.getUint32(byteOffset, littleEndian ?? this.littleEndian);
  }

  setBigInt64(byteOffset: number, value: bigint, littleEndian?: boolean): void {
    this.#view.setBigInt64(
      byteOffset,
      value,
      littleEndian ?? this.littleEndian,
    );
  }
  setBigUint64(
    byteOffset: number,
    value: bigint,
    littleEndian?: boolean,
  ): void {
    this.#view.setBigUint64(
      byteOffset,
      value,
      littleEndian ?? this.littleEndian,
    );
  }
  setFloat32(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.#view.setFloat32(byteOffset, value, littleEndian ?? this.littleEndian);
  }
  setFloat64(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.#view.setFloat64(byteOffset, value, littleEndian ?? this.littleEndian);
  }
  setInt8(byteOffset: number, value: number, _littleEndian?: boolean): void {
    this.#view.setInt8(byteOffset, value);
  }
  setInt16(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.#view.setInt16(byteOffset, value, littleEndian ?? this.littleEndian);
  }
  setInt32(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.#view.setInt32(byteOffset, value, littleEndian ?? this.littleEndian);
  }
  setUint8(byteOffset: number, value: number, _littleEndian?: boolean): void {
    this.#view.setUint8(byteOffset, value);
  }
  setUint16(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.#view.setUint16(byteOffset, value, littleEndian ?? this.littleEndian);
  }
  setUint32(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.#view.setUint32(byteOffset, value, littleEndian ?? this.littleEndian);
  }

  setBytes(array: Uint8Array<TArrayBuffer>, offset?: number): this {
    super.set(array, offset);
    return this.subarray((offset ?? 0) + array.byteLength);
  }
}

export class LittleEndianDataView<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> extends EndianDataView<TArrayBuffer> {
  readonly littleEndian = true;
}

export class BigEndianDataView<
  TArrayBuffer extends ArrayBufferLike = ArrayBufferLike,
> extends EndianDataView<TArrayBuffer> {
  readonly littleEndian = false;
}
