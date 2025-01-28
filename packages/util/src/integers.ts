export type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | BigUint64Array
  | BigInt64Array;

export type TypedArrayConstructor<T extends TypedArray = TypedArray> =
  T extends Uint8Array
    ? typeof Uint8Array
    : T extends Int8Array
      ? typeof Int8Array
      : T extends Uint16Array
        ? typeof Uint16Array
        : T extends Int16Array
          ? typeof Int16Array
          : T extends Uint32Array
            ? typeof Uint32Array
            : T extends Int32Array
              ? typeof Int32Array
              : T extends BigUint64Array
                ? typeof BigUint64Array
                : T extends BigInt64Array
                  ? typeof BigInt64Array
                  : never;

export type TypedArrayElement<
  T extends TypedArray | TypedArrayConstructor = TypedArray,
> = T extends
  | BigUint64Array
  | typeof BigUint64Array
  | BigInt64Array
  | typeof BigInt64Array
  ? bigint
  : number;

class IntBase<
  TConstructor extends TypedArrayConstructor,
  TInt extends TypedArrayElement<TConstructor>,
  TIntUnsigned extends TypedArrayElement<TConstructor>,
  TCastable extends TypedArrayElement<TConstructor>,
> {
  readonly #div: (self: TInt, other: TInt | TCastable) => unknown;
  readonly #hasInstance: (x: unknown) => x is TInt;
  readonly typed_array: TConstructor;

  constructor(typed_array: TConstructor) {
    const signed = (
      [Int8Array, Int16Array, Int32Array, BigInt64Array] as unknown[]
    ).includes(typed_array);
    const uses_bigint = ([BigUint64Array, BigInt64Array] as unknown[]).includes(
      typed_array,
    );

    this.typed_array = typed_array;
    this.BITS = typed_array.BYTES_PER_ELEMENT * 8;
    if (!signed) {
      this.MIN = 0 as TInt;
      this.MAX = (2 ** this.BITS - 1) as TInt;
    } else {
      this.MIN = -(2 ** (this.BITS - 1)) as TInt;
      this.MAX = (2 ** (this.BITS - 1) - 1) as TInt;
    }

    if (!uses_bigint) {
      this.ZERO = 0 as TInt;
      this.ONE = 1 as TInt;
      this.#hasInstance = (x: unknown): x is TInt => {
        if (typeof x !== "number" || !Number.isSafeInteger(x)) return false;
        if (x < this.MIN || x > this.MAX) return false;
        return true;
      };
      this.#div = (self: TInt, other: TInt | TCastable) =>
        Math.trunc(self / other);
      if (signed) {
        this.cast = (x: number | bigint): TInt =>
          Number(BigInt.asIntN(this.BITS, BigInt(x))) as TInt;
      } else {
        this.cast = (x: number | bigint): TInt =>
          Number(BigInt.asUintN(this.BITS, BigInt(x))) as TInt;
      }
    } else {
      this.ZERO = 0n as TInt;
      this.ONE = 1n as TInt;
      this.#hasInstance = (x: unknown): x is TInt => {
        if (typeof x !== "bigint") return false;
        if (x < this.MIN || x > this.MAX) return false;
        return true;
      };
      this.#div = (self: TInt, other: TInt | TCastable) => self / other;
      if (signed) {
        this.cast = (x: number | bigint): TInt =>
          BigInt.asIntN(this.BITS, BigInt(x)) as TInt;
      } else {
        this.cast = (x: number | bigint): TInt =>
          BigInt.asUintN(this.BITS, BigInt(x)) as TInt;
      }
    }
  }

  readonly BITS: number;
  readonly ZERO: TInt;
  readonly ONE: TInt;
  readonly MIN: TInt;
  readonly MAX: TInt;

  [Symbol.hasInstance](x: unknown): x is TInt {
    return this.#hasInstance(x);
  }
  readonly cast: (x: number | bigint) => TInt;

  is_power_of_two(self: TInt): boolean {
    return self > this.ZERO && (self & (self - this.ONE)) === this.ZERO;
  }

  add(self: TInt, other: TInt): TInt;
  add(self: TInt, other: TCastable): TInt;
  add(self: TInt, other: TInt | TCastable): unknown {
    // @ts-expect-error Apparently TS doesn't realize this op is always number + number or bigint + bigint
    return self + other;
  }
  sub(self: TInt, other: TInt): TInt;
  sub(self: TInt, other: TCastable): TInt;
  sub(self: TInt, other: TInt | TCastable): unknown {
    return self - other;
  }
  mul(self: TInt, other: TInt): TInt;
  mul(self: TInt, other: TCastable): TInt;
  mul(self: TInt, other: TInt | TCastable): unknown {
    return self * other;
  }
  div(self: TInt, other: TInt): TInt;
  div(self: TInt, other: TCastable): TInt;
  div(self: TInt, other: TInt | TCastable): unknown {
    return this.#div(self, other);
  }
  rem(self: TInt, other: TInt): TInt;
  rem(self: TInt, other: TCastable): TInt;
  rem(self: TInt, other: TInt | TCastable): unknown {
    return self % other;
  }

  wrapping_add(self: TInt, other: TInt): TInt;
  wrapping_add(self: TInt, other: TCastable): TInt;
  wrapping_add(self: TInt, other: TInt | TCastable): unknown {
    return this.cast(BigInt(self) + BigInt(other));
  }
  wrapping_sub(self: TInt, other: TInt): TInt;
  wrapping_sub(self: TInt, other: TCastable): TInt;
  wrapping_sub(self: TInt, other: TInt | TCastable): unknown {
    return this.cast(BigInt(self) - BigInt(other));
  }
  wrapping_mul(self: TInt, other: TInt): TInt;
  wrapping_mul(self: TInt, other: TCastable): TInt;
  wrapping_mul(self: TInt, other: TInt | TCastable): unknown {
    return this.cast(BigInt(self) * BigInt(other));
  }
  wrapping_div(self: TInt, other: TInt): TInt;
  wrapping_div(self: TInt, other: TCastable): TInt;
  wrapping_div(self: TInt, other: TInt | TCastable): unknown {
    return this.cast(BigInt(self) / BigInt(other));
  }
  wrapping_rem(self: TInt, other: TInt): TInt;
  wrapping_rem(self: TInt, other: TCastable): TInt;
  wrapping_rem(self: TInt, other: TInt | TCastable): unknown {
    return this.cast(BigInt(self) % BigInt(other));
  }

  unsigned_abs(self: TInt): TIntUnsigned {
    return (self < this.ZERO ? -self : self) as TIntUnsigned;
  }
}

export type { IntBase };

function make_int_base<
  TConstructor extends TypedArrayConstructor,
  TInt extends TypedArrayElement<TConstructor> & {
    readonly [int]: symbol;
  },
  TIntUnsigned extends TypedArrayElement<TConstructor> & {
    readonly [int]: symbol;
  },
  TCastable extends TypedArrayElement<TConstructor> = never,
>(typed_array_constructor: TConstructor) {
  type TElement = TypedArrayElement<TConstructor>;
  const base = new IntBase<TConstructor, TInt, TIntUnsigned, TCastable>(
    typed_array_constructor,
  );
  const out = <T extends TElement = TElement>(x: T): T & TInt => {
    if (!(x instanceof base)) throw new RangeError();
    return x;
  };
  Object.assign(out, base);
  Object.freeze(out);
  return out as typeof out & typeof base;
}

declare const int: unique symbol;
export interface Int<T extends symbol = symbol> {
  readonly [int]: T;
}

export namespace Int {
  export declare const u8: unique symbol;
  export declare const u16: unique symbol;
  export declare const u32: unique symbol;
  export declare const u64: unique symbol;
  export declare const usize: unique symbol;
  export declare const i8: unique symbol;
  export declare const i16: unique symbol;
  export declare const i32: unique symbol;
  export declare const i64: unique symbol;
  export declare const isize: unique symbol;
}

export type u8 = TypedArrayElement<typeof Uint8Array> & Int<typeof Int.u8>;
export type u16 = TypedArrayElement<typeof Uint16Array> & Int<typeof Int.u16>;
export type u32 = TypedArrayElement<typeof Uint32Array> & Int<typeof Int.u32>;
export type u64 = TypedArrayElement<typeof BigUint64Array> &
  Int<typeof Int.u64>;
export type usize = TypedArrayElement<typeof Uint32Array> &
  Int<typeof Int.usize>;
export type i8 = TypedArrayElement<typeof Int8Array> & Int<typeof Int.i8>;
export type i16 = TypedArrayElement<typeof Int16Array> & Int<typeof Int.i16>;
export type i32 = TypedArrayElement<typeof Int32Array> & Int<typeof Int.i32>;
export type i64 = TypedArrayElement<typeof BigInt64Array> & Int<typeof Int.i64>;
export type isize = TypedArrayElement<typeof Int32Array> &
  Int<typeof Int.isize>;

export const u8 = make_int_base<typeof Uint8Array, u8, u8>(Uint8Array);
export const u16 = make_int_base<typeof Uint16Array, u16, u16, u8>(Uint16Array);

export const u32 = make_int_base<typeof Uint32Array, u32, u32, u8 | u16>(
  Uint32Array,
);
export const u64 = make_int_base<typeof BigUint64Array, u64, u64>(
  BigUint64Array,
);
export const usize = make_int_base<
  typeof Uint32Array,
  usize,
  usize,
  u8 | u16 | u32
>(Uint32Array);
export const i8 = make_int_base<typeof Int8Array, i8, u8>(Int8Array);
export const i16 = make_int_base<typeof Int16Array, i16, u16, i8 | u8>(
  Int16Array,
);
export const i32 = make_int_base<
  typeof Int32Array,
  i32,
  u32,
  i8 | u8 | i16 | u16
>(Int32Array);
export const i64 = make_int_base<typeof BigInt64Array, i64, u64>(BigInt64Array);
export const isize = make_int_base<
  typeof Int32Array,
  isize,
  usize,
  i8 | u8 | i16 | u16 | i32
>(Int32Array);
