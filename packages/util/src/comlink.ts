import * as Comlink from "comlink";

function assume<T>(_x: unknown): asserts _x is T {}

function isIndexable(x: unknown): x is Record<PropertyKey, unknown> {
  return x !== null && ["object", "function"].includes(typeof x);
}

// function isStructuredClonable(x: unknown): boolean {
//   if (!["object", "function"].includes(typeof x)) return true;
//   assume<Record<PropertyKey, unknown>>(x);
//   if (Array.isArray(x) || ArrayBuffer.isView(x)) return true;
//   for (const obj of [
//     Boolean,
//     String,
//     Date,
//     RegExp,
//     Blob,
//     File,
//     FileList,
//     ArrayBuffer,
//     ImageBitmap,
//     ImageData,
//     Map,
//     Set,
//   ]) {
//     if (x instanceof obj) return true;
//   }
//   if ([null, Object.prototype].includes(Reflect.getPrototypeOf(x))) {
//     for (const k of Reflect.ownKeys(x)) {
//       if (typeof k !== "string" || !isStructuredClonable(x[k])) return false;
//     }
//     return true;
//   }
//   return false;
// }

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
const webStructuredClonableTypes = [Blob, CryptoKey, File];
const structuredClonableTypes = [
  nativeStructuredClonableTypes,
  webStructuredClonableTypes,
]
  .flat(1)
  .filter((x) => !!x);

function isStructuredClonable(x: unknown): boolean {
  if (typeof x === "symbol" || typeof x === "function") return false;

  if (!isIndexable(x)) return true;

  if (ArrayBuffer.isView(x)) return true;
  for (const type of structuredClonableTypes) {
    if (x instanceof type) return true;
  }

  const prototype = Reflect.getPrototypeOf(x);
  if (
    !(
      prototype === Object.prototype ||
      prototype === Array.prototype ||
      prototype === null ||
      isStructuredClonable(prototype)
    )
  )
    return false;

  if (x instanceof Map || x instanceof Set) {
    for (const [key, value] of x.entries()) {
      if (!isStructuredClonable(key)) return false;
      if (key === value) continue;
      if (!isStructuredClonable(value)) return false;
    }
  }

  for (const key of Reflect.ownKeys(x)) {
    if (typeof key === "symbol") return false;
    if (!(key in x)) throw new TypeError();
    const value = x[key];
    if (!isStructuredClonable(value)) return false;
  }

  return true;
}

type Indexable = Record<PropertyKey, unknown>;

// class IteratorWrapper<T, TNext = unknown, TReturn = undefined>
//   implements Iterator<T, TNext, TReturn>
// {
//   readonly #iterator: Iterator<T, TNext, TReturn>;
//   readonly return?: (value?: TNext) => IteratorResult<T, TNext>;
//   // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//   readonly throw?: (e?: any) => IteratorResult<T, TNext>;
//   constructor(iterator: Iterator<T, TNext, TReturn>) {
//     this.#iterator = iterator;
//     const iterator_return = iterator.return?.bind(iterator);
//     if (iterator_return) {
//       this.return = (value?: TNext) => iterator_return(value);
//     }
//     const iterator_throw = iterator.throw?.bind(iterator);
//     if (iterator_throw) {
//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       this.return = (e?: any) => iterator_throw(e);
//     }
//   }
//   next(...[value]: [] | [TReturn]): IteratorResult<T, TNext> {
//     return this.#iterator.next(...(value ? [value] : []));
//   }
// }

// class AsyncIteratorWrapper<
//   T,
//   TReturn = unknown,
//   TNext = undefined,
// > implements AsyncIterator<T, TReturn, TNext> {
//   readonly #next: Promise<(
//     ...[value]: [] | [TNext]
//   ) => Promise<IteratorResult<T, TReturn>>>;
//   readonly #return: Promise<(
//     value?: TReturn | PromiseLike<TReturn>,
//   ) => Promise<IteratorResult<T, TReturn>>>;
//   // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//   readonly #throw: Promise<(e?: any) => Promise<IteratorResult<T, TReturn>>>;
//   constructor(iterator: AsyncIterator<T, TReturn, TNext> | PromiseLike<AsyncIterator<T, TReturn, TNext>>) {
//     const resolved = Promise.resolve(iterator);
//     this.#next = resolved.then(x => x.next.bind(x));
//     this.#return = resolved.then(x => x.return ? x.return.bind(iterator) : () => { throw new TypeError("backing iterator missing return()") });
//     this.#throw = resolved.then(x => x.throw ? x.throw.bind(iterator) : () => { throw new TypeError("backing iterator missing throw()") });
//   }
//   async next(...[value]: [] | [TNext]): Promise<IteratorResult<T, TReturn>> {
//     return await (await this.#next)(...(value ? [value] : []));
//   }
//   async return(
//     value?: TReturn | PromiseLike<TReturn>,
//   ): Promise<IteratorResult<T, TReturn>> {
//     return await (await this.#return)(value);
//   }
//   // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//   async throw(e?: any): Promise<IteratorResult<T, TReturn>> {
//     return await (await this.#throw)(e);
//   }

//   static {
//     Comlink.transferHandlers.set("AsyncIteratorWrapper", {
//       canHandle(
//         obj: unknown,
//       ): obj is AsyncIteratorWrapper<
//         unknown,
//         unknown,
//         unknown
//       > {
//         return obj instanceof AsyncIteratorWrapper;
//       },
//       serialize(
//         obj: AsyncIteratorWrapper<unknown, unknown, unknown>,
//       ) {
//         const { port1, port2 } = new MessageChannel();
//         Comlink.expose(obj, port1);
//         return [port2, [port2]];
//       },
//       deserialize(
//         port: MessagePort,
//       ): AsyncIteratorWrapper<unknown, unknown, unknown> {
//         const proxy =
//           Comlink.wrap<
//           AsyncIteratorWrapper<unknown, unknown, unknown>
//           >(port);
//         return new AsyncIteratorWrapper(proxy);
//       },
//     });
//   }
// }

let transferHandlersSet = false;

export function setTransferHandlers() {
  if (transferHandlersSet) return;
  transferHandlersSet = true;

  Comlink.transferHandlers.set("AbortController", {
    canHandle(obj: unknown): obj is AbortController {
      return obj instanceof AbortController;
    },
    serialize(obj: AbortController) {
      const { port1, port2 } = new MessageChannel();
      const signal = obj.signal;
      signal.addEventListener("abort", () => port1.postMessage(signal.reason));
      port1.addEventListener("message", (ev) => obj.abort(ev.data));
      return [port2, [port2]];
    },
    deserialize(port: MessagePort) {
      const out = new AbortController();
      const signal = out.signal;
      signal.addEventListener("abort", () => port.postMessage(signal.reason));
      port.addEventListener("message", (ev) => out.abort(ev.data));
      port.start();
      return out;
    },
  });

  Comlink.transferHandlers.set("AbortSignal", {
    canHandle(obj: unknown): obj is AbortSignal {
      return obj instanceof AbortSignal;
    },
    serialize(obj: AbortSignal) {
      const { port1, port2 } = new MessageChannel();
      obj.addEventListener("abort", () => port1.postMessage(obj.reason));
      return [port2, [port2]];
    },
    deserialize(port: MessagePort) {
      const out = new AbortController();
      port.addEventListener("message", (ev) => out.abort(ev.data));
      port.start();
      return out.signal;
    },
  });

  // Comlink.transferHandlers.set("AsyncIterable", {
  //   canHandle(obj: unknown): obj is AsyncIterable<unknown, unknown, unknown> {
  //     return (
  //       isIndexable(obj) &&
  //       Symbol.asyncIterator in obj &&
  //       typeof obj[Symbol.asyncIterator] === "function"
  //     );
  //   },
  //   serialize(obj: AsyncIterable<unknown, unknown, unknown>) {
  //     const { port1, port2 } = new MessageChannel();
  //     Comlink.expose(obj, port1);
  //     const { port1: port3, port2: port4 } = new MessageChannel();
  //     Comlink.expose({
  //       asyncIterator() {
  //         return new AsyncIteratorWrapper(obj[Symbol.asyncIterator]());
  //       },
  //     }, port3);
  //     return [[port2, port4], [port2, port4]];
  //   },
  //   deserialize([port2, port4]: [MessagePort, MessagePort]): AsyncIterable<unknown, unknown, unknown> {
  //     port2.start();
  //     port4.start();
  //     const out = new Proxy(Comlink.wrap<unknown>(port2), {
  //       get(target, p, receiver) {
  //         if (p !== Symbol.asyncIterator) {
  //           return Reflect.get(target, p, receiver);
  //         }
  //         const out: AsyncIterator<unknown, unknown, unknown> = new AsyncIteratorWrapper(Comlink.wrap<{asyncIterator(): Promise<AsyncIteratorWrapper<unknown, unknown, unknown>>}>(port4).asyncIterator());
  //         return out;
  //       },
  //       ownKeys(target) {
  //         const out = Array.from(Reflect.ownKeys(target));
  //         if (!out.includes(Symbol.asyncIterator)) out.push(Symbol.asyncIterator);
  //         return out;
  //       }
  //     });
  //     return out as typeof out & AsyncIterable<unknown, unknown, unknown>;
  //   },
  // });

  Comlink.transferHandlers.set(
    "recursive",
    new RecursiveHandler(Comlink.transferHandlers),
  );

  Comlink.transferHandlers.set("fallback", {
    canHandle(obj: unknown): obj is Indexable {
      return (
        !isStructuredClonable(obj) &&
        (typeof obj === "function" ||
          (isIndexable(obj) &&
            ![null, Object.prototype, Function.prototype].includes(
              Reflect.getPrototypeOf(obj),
            )))
      );
    },
    serialize(obj: Indexable) {
      const { port1, port2 } = new MessageChannel();
      Comlink.expose(obj, port1);
      return [port2, [port2]];
    },
    deserialize(port: MessagePort): Indexable {
      port.start();
      return Comlink.wrap<Indexable>(port);
    },
  });
}

const terminateWrappedWorkerMarker: unique symbol = Symbol("terminateWorker");
declare const terminateWrappedWorkerBrand: unique symbol;

export type WrappedWorker<T> = T & { [terminateWrappedWorkerBrand]: never };

export function wrappedWorkerInit<
  // biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
  T extends (...args: any) => Promise<any>,
>(workerCtor: { new (options?: { name?: string }): Worker }): (
  ...args: Parameters<T>
) => Promise<WrappedWorker<Awaited<ReturnType<T>>>> {
  setTransferHandlers();
  return async (...args: Parameters<T>) => {
    const worker = new workerCtor();
    const out: Awaited<ReturnType<T>> = await Comlink.wrap<T>(worker)(...args);
    out[terminateWrappedWorkerMarker] = () => worker.terminate();
    assume<WrappedWorker<typeof out>>(out);
    return out;
  };
}

export function wrappedWorkerTerminate(
  worker: WrappedWorker<unknown> | null | undefined,
) {
  if (!worker) return;
  assume<
    { readonly [terminateWrappedWorkerMarker]: () => void } | null | undefined
  >(worker);
  worker[terminateWrappedWorkerMarker]();
}

class CloneError extends Error {}

class RecursiveHandler
  implements Comlink.TransferHandler<WeakKey, { uuid: string; value: unknown }>
{
  protected readonly handlers: Map<
    string,
    Comlink.TransferHandler<unknown, unknown>
  >;
  protected cache = new WeakMap<WeakKey, [unknown, string, Transferable[]]>();

  constructor(
    handlers: Map<string, Comlink.TransferHandler<unknown, unknown>>,
  ) {
    this.handlers = handlers;
  }

  private static generateUUID(): string {
    return new Array(4)
      .fill(0)
      .map(() =>
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16),
      )
      .join("-");
  }

  canHandle(x: unknown): x is WeakKey {
    if (typeof x !== "object" || x === null) return false;
    try {
      const transferables: Transferable[] = [];
      const uuid = RecursiveHandler.generateUUID();
      this.cache.set(x, [
        this.serializeInner(transferables, uuid, x),
        uuid,
        transferables,
      ]);
      return true;
    } catch (e) {
      if (!(e instanceof CloneError)) throw e;
      return false;
    }
  }

  serialize(x: WeakKey): [{ uuid: string; value: unknown }, Transferable[]] {
    const out = this.cache.get(x);
    if (!out) throw new CloneError();
    const [value, uuid, transferables] = out;
    return [{ uuid, value }, transferables];
  }

  deserialize({ uuid, value }: { uuid: string; value: unknown }): WeakKey {
    return this.deserializeInner(uuid, value) as WeakKey;
  }

  protected serializeInner(
    transferables: Transferable[],
    uuid: string,
    x: unknown,
  ): unknown {
    for (const [name, handler] of this.handlers.entries()) {
      if (handler === this) continue;
      if (handler.canHandle(x)) {
        const [value, newTransferables] = handler.serialize(x);
        transferables.push(...newTransferables);
        return {
          type: uuid,
          name,
          value,
        };
      }
    }

    try {
      switch (typeof x) {
        case "symbol":
        case "function":
          throw new CloneError();
        case "object": {
          if (x === null) throw undefined;
          if (ArrayBuffer.isView(x)) throw undefined;
          const serialize = this.serializeInner.bind(this, transferables, uuid);
          switch (Reflect.getPrototypeOf(x)) {
            case ArrayBuffer.prototype:
            case Boolean.prototype:
            case Date.prototype:
            case Error.prototype:
            case Number.prototype:
            case RegExp.prototype:
            case "SharedArrayBuffer" in globalThis
              ? globalThis.SharedArrayBuffer.prototype
              : undefined:
            case String.prototype:
              throw undefined;
            case Set.prototype:
              return new Set(
                Array.from((x as Set<unknown>).values()).map(serialize),
              );
            case Map.prototype:
              return new Map(
                Array.from((x as Map<unknown, unknown>).entries()).map(
                  ([k, v]) => [serialize(k), serialize(v)],
                ),
              );
            case Array.prototype:
              return (x as Array<unknown>).map(serialize);
            case Object.prototype:
            case null:
              return Object.fromEntries(
                Object.entries(x).map(([k, v]) => [k, serialize(v)]),
              );
          }
          throw new CloneError();
        }
        default:
          throw undefined;
      }
    } catch (e) {
      if (e !== undefined) throw e;
      return structuredClone(x);
    }
  }

  protected deserializeInner(uuid: string, x: unknown): unknown {
    if (!(typeof x === "object" || typeof x === "function") || x === null)
      return x;
    if (typeof x === "object" && "type" in x && x.type === uuid) {
      const { name, value } = x as {
        type: string;
        name: string;
        value: unknown;
      };
      const handler = this.handlers.get(name);
      if (!handler) throw new CloneError();
      return handler.deserialize(value);
    }
    const deserialize = this.deserializeInner.bind(this, uuid);
    if (x instanceof Set) {
      return new Set(Array.from(x.values()).map(deserialize));
    }
    if (x instanceof Map) {
      return new Map(
        Array.from(x.entries()).map(([k, v]) => [
          deserialize(k),
          deserialize(v),
        ]),
      );
    }
    const x2 = x as Record<PropertyKey, unknown>;
    for (const key in x2) {
      x2[key] = deserialize(x2[key]);
    }
    return x2;
  }
}
