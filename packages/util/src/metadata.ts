import {
  type TypedArrayConstructor,
  i8,
  i16,
  i32,
  i64,
  isize,
  u8,
  u16,
  u32,
  u64,
  usize,
} from "./integers";
import type { Pointee } from "./pointers";
import type { Sized, ZeroSized } from "./sized";

export interface Metadata<T extends object | unknown> {
  // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
  readonly size_of: T extends Sized ? usize : void;
  readonly align_of: usize;
  readonly read: [T] extends [ZeroSized]
    ? () => { item: T; size: 0 & usize }
    : (buf: Uint8Array) => { item: T; size: usize };
  readonly write: [T] extends [ZeroSized]
    ? undefined
    : (buf: Uint8Array, x: T) => usize;
}

export namespace Metadata {
  export const NONE: Metadata<unknown> = {
    size_of: undefined,
    align_of: usize.ONE,
    read() {
      throw new TypeError();
    },
    write() {
      throw new TypeError();
    },
  };

  const map = new WeakMap<WeakKey, Metadata<unknown>>();

  export function has(pointee: WeakKey): pointee is Pointee<unknown> {
    return map.has(pointee);
  }

  export function get<T extends Pointee<T>, U extends Pointee<T> = T>(
    pointee: U,
  ): Metadata<T> {
    const out = map.get(pointee);
    if (out === undefined) throw new Error("no pointer metadata for pointee");
    return out as Metadata<T>;
  }

  export function set<T>(
    pointee: Pointee<T>,
    metadata: NoInfer<Metadata<T>>,
  ): void {
    if (map.has(pointee)) throw new Error("metadata already set for pointee");
    Object.freeze(metadata);
    map.set(pointee, metadata as Metadata<unknown>);
  }
}

function fromArrayBufferView<
  T extends TypedArrayConstructor,
  TArrayBuffer extends ArrayBufferLike,
>(ctor: T, buf: ArrayBufferView<TArrayBuffer>): InstanceType<T> {
  if (buf instanceof ctor) return buf as InstanceType<T>;
  return new (
    ctor as unknown as {
      new (
        buffer: TArrayBuffer,
        byteOffset?: number,
        length?: number,
      ): InstanceType<T>;
    }
  )(
    buf.buffer,
    buf.byteOffset,
    Math.floor(buf.byteLength / ctor.BYTES_PER_ELEMENT),
  ) as InstanceType<T>;
}

for (const ctor of [
  Uint8Array,
  Uint16Array,
  Uint32Array,
  BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  BigInt64Array,
] as const satisfies Array<TypedArrayConstructor>) {
  type T = InstanceType<typeof ctor>;
  const metadata: Metadata<T> = {
    size_of: undefined,
    align_of: usize(ctor.BYTES_PER_ELEMENT),
    read(buf: Uint8Array) {
      const item = fromArrayBufferView(ctor, buf);
      return { item, size: item.byteLength as usize };
    },
    write(buf: Uint8Array, x: T) {
      buf.set(fromArrayBufferView(Uint8Array, x));
      return x.byteLength as usize;
    },
  };
  Metadata.set(ctor as Pointee<T>, metadata);
}

declare module "./integers" {
  interface IntBase<TConstructor, TInt, TIntUnsigned, TCastable>
    extends Pointee<TInt>,
      Sized {}

  interface Int<T> extends Sized {}
}

for (const int of [
  u8,
  u16,
  u32,
  u64,
  usize,
  i8,
  i16,
  i32,
  i64,
  isize,
] as const satisfies Array<Sized>) {
  type T = typeof int;
  type TInstance = ReturnType<T>;

  const size_of = usize(int.BITS / 8);
  const metadata: Metadata<TInstance> = {
    size_of: size_of,
    align_of: size_of,
    read(buf: Uint8Array) {
      const item = new (
        int.typed_array as {
          new (
            buffer: ArrayBufferLike,
            byteOffset?: number,
            length?: number,
          ): InstanceType<T["typed_array"]>;
        }
      )(buf.buffer, buf.byteOffset, 1)[0] as TInstance;
      return { item, size: int.typed_array.BYTES_PER_ELEMENT as usize };
    },
    write(buf: Uint8Array, x: TInstance) {
      fromArrayBufferView(int.typed_array, buf)[0] = x;
      return int.typed_array.BYTES_PER_ELEMENT as usize;
    },
  };
  Metadata.set<TInstance>(int, metadata);
}
