import * as Comlink from "comlink";

function notPrimitiveCoercable(x: unknown): x is object {
  if (x === null || !(typeof x === "object" || typeof x === "function")) return true;
  if (Symbol.toPrimitive in x && typeof x[Symbol.toPrimitive] === "function") return true;
  if ("valueOf" in x && typeof x.valueOf === "function") return true;
  if ("toString" in x && typeof x.toString === "function") return true;
  return false;
}

const nativeStructuredClonableTypes = [
  ArrayBuffer,
  Boolean,
  Date,
  Error,
  Number,
  RegExp,
  "SharedArrayBuffer" in globalThis ? globalThis.SharedArrayBuffer : undefined,
  String,
];
const webStructuredClonableTypes = [
  Blob,
  CryptoKey,
  File,
  FileList,
];
const structuredClonableTypes = [nativeStructuredClonableTypes, webStructuredClonableTypes].flat(1).filter(x => !!x);

function isStructuredClonable(x/*: unknown*/)/*: boolean*/ {
  if (typeof x === "symbol" || typeof x === "function") return false;

  if (x === null || !(typeof x === "object" || typeof x === "function")) return true;
  const x2 = x/* as Record<PropertyKey, unknown>*/;

  if (ArrayBuffer.isView(x2)) return true;
  for (const type of structuredClonableTypes) {
    if (x2 instanceof type) return true;
  }

  const prototype = Reflect.getPrototypeOf(x2);
  if (!(prototype === Object.prototype || prototype === Array.prototype || prototype === null || isStructuredClonable(prototype))) return false;

  if (x2 instanceof Map || x2 instanceof Set) {
    for (const [key, value] of x2.entries()) {
      if (!isStructuredClonable(key)) return false;
      if (key === value) continue;
      if (!isStructuredClonable(value)) return false;
    }
  }

  for (const key of Reflect.ownKeys(x2)) {
    if (typeof key === "symbol") return false;
    if (!(key in x2)) throw new TypeError();
    const value = x2[key];
    if (!isStructuredClonable(value)) return false;
  }

  return true;
}

class CloneError extends Error {}

class Cloner {
  protected readonly handlers: Set<Comlink.TransferHandler>;
  protected replacer: (this: unknown, key: unknown, value: unknown) => unknown;

  clone(x: unknown): unknown {
    switch (typeof x) {
      case "function":
        break;
      case "object": {
        if (x === null) return x;
        if (ArrayBuffer.isView(x)) return x;
        try {
          switch (Reflect.getPrototypeOf(x)) {
            case ArrayBuffer.prototype:
            case Boolean.prototype:
            case Date.prototype:
            case Error.prototype:
            case Number.prototype:
            case RegExp.prototype:
            case ("SharedArrayBuffer" in globalThis ? globalThis.SharedArrayBuffer : undefined):
            case String.prototype:
              return x;
            case Set.prototype: return new Set(Array.from((x as Set<unknown>).values()).map((v) => clone(replacer, replacer.call(v, "", v))));
            case Map.prototype: return new Map(Array.from((x as Map<unknown, unknown>).entries()).map(([k, v]) => [clone(replacer, replacer.call(k, , k)), clone(replacer, replacer.call(x, k, v))]));
            case Array.prototype: return (x as Array<unknown>).map((v, i) => clone(replacer, replacer.call(x, i, v)));
            case Object.prototype:
            case null:
              return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, clone(replacer, replacer.call(x, k, v))]));
          }
        } catch (e) {
          if (!(e instanceof CloneError)) throw e;
        }
        break;
      }
      default:
        return x;
    }

    throw new CloneError();
  }
}