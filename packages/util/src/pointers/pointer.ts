import { i64, isize, usize } from "../integers";
import { Metadata } from "./metadata";
import type { Sized } from "./sized";

export interface Pointee<T = void> {
  readonly [Pointer.metadata]?: T extends unknown ? Metadata<T> : never;
}

declare global {
  interface Uint8Array<TArrayBuffer>
    extends Pointee<Uint8Array<ArrayBufferLike>> {}
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
// biome-ignore lint/style/noVar: <explanation>
declare var Uint8Array: Uint8ArrayConstructor &
  Pointee<Uint8Array<ArrayBufferLike>>;

export type Provenance = ArrayBufferView;

export class Pointer<
    T extends Pointee<T> | unknown = unknown,
    TProvenance extends Provenance | null | unknown = unknown,
  >
  extends Number
  implements Iterable<T, never, never>
{
  static readonly metadata: unique symbol = Symbol("Pointer.metadata");
  readonly metadata: Metadata<T>;
  readonly provenance: TProvenance;

  private constructor(
    addr: usize,
    metadata: Metadata<T>,
    provenance: TProvenance,
  ) {
    if (!Number.isSafeInteger(addr)) throw new RangeError();
    if (addr % metadata.align_of !== 0) throw new RangeError();
    super(addr);
    this.metadata = metadata;
    this.provenance = provenance;
  }

  is_null(): boolean {
    return this.addr === 0;
  }

  cast(): Pointer<unknown, TProvenance>;
  cast(pointee: undefined): Pointer<unknown, TProvenance>;
  cast<U extends Pointee<U>, V extends Pointee<U> = U>(
    pointee: NoInfer<V>,
  ): Pointer<U, TProvenance>;
  cast<U extends Pointee<U>, V extends Pointee<U> = U>(
    pointee?: NoInfer<V>,
  ): Pointer<unknown, TProvenance> | Pointer<U, TProvenance> {
    if (pointee === undefined) {
      return new Pointer<unknown, TProvenance>(
        this.addr,
        Metadata.NONE,
        this.provenance,
      );
    }
    return new Pointer<U, TProvenance>(
      this.addr,
      Metadata.get(pointee),
      this.provenance,
    );
  }

  get addr(): usize {
    return usize(this.valueOf());
  }
  with_addr(addr: usize): Pointer<T, TProvenance> {
    return new Pointer(addr, this.metadata, this.provenance);
  }
  map_addr(f: (addr: usize) => usize): Pointer<T, TProvenance> {
    return this.with_addr(f(this.addr));
  }

  wrapping_offset(
    count: isize,
  ): T extends Sized ? Pointer<T, TProvenance> : never;
  wrapping_offset(count: isize): Pointer<T, TProvenance> {
    if (this.metadata.size_of === undefined) throw new TypeError();
    return this.wrapping_byte_offset(
      isize.cast(i64.mul(i64.cast(count), i64.cast(this.metadata.size_of))),
    );
  }
  wrapping_byte_offset(count: isize): Pointer<T, TProvenance> {
    return new Pointer(
      usize[count >= isize.ZERO ? "wrapping_add" : "wrapping_sub"](
        this.addr,
        isize.unsigned_abs(count),
      ),
      this.metadata,
      this.provenance,
    );
  }

  offset_from(
    origin: Pointer<unknown, unknown>,
  ): T extends Sized ? isize : never;
  offset_from(origin: Pointer<unknown, unknown>): isize {
    if (this.metadata.size_of === undefined) throw new TypeError();
    return isize.div(
      this.byte_offset_from(origin),
      isize(this.metadata.size_of),
    );
  }

  byte_offset_from(origin: Pointer<unknown, unknown>): isize {
    if (this.addr !== origin.addr && this.provenance !== origin.provenance)
      throw new RangeError();
    return isize.sub(isize(this.addr), isize(origin.addr));
  }

  wrapping_add(count: usize): T extends Sized ? Pointer<T, TProvenance> : never;

  wrapping_add(count: usize): Pointer<T, TProvenance> {
    if (this.metadata.size_of === undefined) throw new TypeError();
    return this.wrapping_byte_add(usize.mul(count, this.metadata.size_of));
  }
  wrapping_byte_add(count: usize): Pointer<T, TProvenance> {
    return new Pointer(
      usize.wrapping_add(this.addr, count),
      this.metadata,
      this.provenance,
    );
  }

  wrapping_sub(count: usize): T extends Sized ? Pointer<T, TProvenance> : never;
  wrapping_sub(count: usize): Pointer<T, TProvenance> {
    if (this.metadata.size_of === undefined) throw new TypeError();
    return this.wrapping_byte_sub(usize.mul(count, this.metadata.size_of));
  }
  wrapping_byte_sub(count: usize): Pointer<T, TProvenance> {
    return new Pointer(
      usize.wrapping_sub(this.addr, count),
      this.metadata,
      this.provenance,
    );
  }

  [Symbol.iterator](
    this: Pointer<T, Provenance>,
  ): Generator<T extends void ? never : T, never, undefined>;
  *[Symbol.iterator](
    this: Pointer<T, Provenance>,
  ): Generator<T, never, undefined> {
    let self = this;
    while (true) {
      const { item, size } = this.metadata.read(
        new Uint8Array(
          this.provenance.buffer,
          this.provenance.byteOffset + this.addr,
          this.metadata.size_of ?? undefined,
        ),
      );
      yield item;

      self = self.wrapping_byte_add(size);
    }
  }

  read(this: Pointer<T, Provenance>): T extends void ? never : T;
  read(this: Pointer<T, Provenance>): T {
    for (const item of this) {
      return item;
    }
    throw undefined;
  }

  write(this: Pointer<T, Provenance>, x: T): T extends void ? never : void;
  write(
    this: Pointer<T, Provenance>,
    x: Generator<T, unknown, unknown>,
  ): T extends void ? never : T extends Sized ? void : never;
  write(
    this: Pointer<T, Provenance>,
    x: T | Generator<T, unknown, unknown>,
  ): void {
    if (
      // Check whether x is a generator
      ((x: unknown): x is Generator<T, unknown, unknown> =>
        (typeof x === "object" || typeof x === "function") &&
        x !== null &&
        "next" in x &&
        typeof x.next === "function")(x)
    ) {
      if (this.metadata.size_of === undefined) throw new TypeError();
      let self = this;
      for (const item of x) {
        self.write(item);
        self = self.wrapping_add(usize.ONE);
      }
    } else {
      const buf2 = this.cast<Uint8Array<ArrayBufferLike>, typeof Uint8Array>(
        Uint8Array,
      );
      const buf = buf2.read();
      this.metadata.write?.(buf, x);
    }
  }

  align_offset(align: usize): T extends Sized ? usize : never;
  align_offset(align: usize): usize {
    if (!usize.is_power_of_two(align)) throw new RangeError();
    if (this.metadata.size_of === undefined) throw new TypeError();
    const byteOffset = usize.rem(this.addr, align);
    if (
      this.metadata.size_of === 0 ||
      usize.rem(byteOffset, this.metadata.size_of)
    )
      return usize.MAX;
    return usize.div(byteOffset, this.metadata.size_of);
  }
  is_aligned(): boolean {
    return this.addr % this.metadata.align_of === 0;
  }

  static addr_eq<T extends Pointer, U extends Pointer>(p: T, q: U): boolean {
    return p.addr === q.addr;
  }
  static eq<T extends Pointer>(a: T, b: T): boolean {
    return a.addr === b.addr;
  }

  static null(): Pointer<unknown, null>;
  static null<T extends Pointee<T>>(pointee: T): Pointer<T, null>;
  static null<T extends Pointee<T>>(
    pointee?: T,
  ): Pointer<unknown, null> | Pointer<T, null> {
    if (pointee === undefined) {
      return Pointer.without_provenance(usize.ZERO);
    }
    return Pointer.without_provenance(usize.ZERO, pointee);
  }
  static without_provenance(addr: usize): Pointer<unknown, null>;
  static without_provenance<T extends Pointee<T>>(
    addr: usize,
    pointee: T,
  ): Pointer<T, null>;
  static without_provenance<T extends Pointee<T>>(
    addr: usize,
    pointee?: T,
  ): Pointer<unknown, null> | Pointer<T, null> {
    if (pointee === undefined) {
      return new Pointer<unknown, null>(addr, Metadata.NONE, null);
    }
    return new Pointer<T, null>(addr, Metadata.get(pointee), null);
  }

  static with_provenance<U extends Provenance>(
    provenance: U,
    addr: usize,
  ): Pointer<unknown, U>;
  static with_provenance<U extends Provenance, V extends Pointee<V> = never>(
    provenance: U,
    addr: usize,
    pointee: V,
  ): Pointer<V, U>;
  static with_provenance<U extends Provenance, V extends Pointee<V> = never>(
    provenance: U,
    addr: usize,
    pointee?: V,
  ): Pointer<V, U> | Pointer<unknown, U> {
    if (pointee === undefined) {
      return new Pointer<unknown, U>(addr, Metadata.NONE, provenance);
    }
    return new Pointer<V, U>(addr, Metadata.get(pointee), provenance);
  }
}
