import type { Pointee } from "./pointer";

declare global {
  interface Uint8Array<TArrayBuffer>
    extends Pointee<Uint8Array<ArrayBufferLike>> {}
  interface Int8Array<TArrayBuffer>
    extends Pointee<Int8Array<ArrayBufferLike>> {}
  interface Uint16Array<TArrayBuffer>
    extends Pointee<Uint16Array<ArrayBufferLike>> {}
  interface Int16Array<TArrayBuffer>
    extends Pointee<Int16Array<ArrayBufferLike>> {}
  interface Uint32Array<TArrayBuffer>
    extends Pointee<Uint32Array<ArrayBufferLike>> {}
  interface Int32Array<TArrayBuffer>
    extends Pointee<Int32Array<ArrayBufferLike>> {}
  interface BigUint64Array<TArrayBuffer>
    extends Pointee<BigUint64Array<ArrayBufferLike>> {}
  interface BigInt64Array<TArrayBuffer>
    extends Pointee<BigInt64Array<ArrayBufferLike>> {}
}

// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var Uint8Array: Pointee<Uint8Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var Int8Array: Pointee<Int8Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var Uint16Array: Pointee<Uint16Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var Int16Array: Pointee<Int16Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var Uint32Array: Pointee<Uint32Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var Int32Array: Pointee<Int32Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var BigUint64Array: Pointee<BigUint64Array>;
// biome-ignore lint/style/noVar: <explanation>
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
declare var BigInt64Array: Pointee<BigInt64Array>;
