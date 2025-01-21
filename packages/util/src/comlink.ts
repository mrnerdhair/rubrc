import * as Comlink from "comlink";

function assume<T>(_x: unknown): asserts _x is T {}

function isIndexable(x: unknown): x is Record<PropertyKey, unknown> {
  return x !== null && ["object", "function"].includes(typeof x);
}

function isStructuredClonable(x: unknown): boolean {
  if (!["object", "function"].includes(typeof x)) return true;
  assume<Record<PropertyKey, unknown>>(x);
  if (Array.isArray(x) || ArrayBuffer.isView(x)) return true;
  for (const obj of [
    Boolean,
    String,
    Date,
    RegExp,
    Blob,
    File,
    FileList,
    ArrayBuffer,
    ImageBitmap,
    ImageData,
    Map,
    Set,
  ]) {
    if (x instanceof obj) return true;
  }
  if ([null, Object.prototype].includes(Reflect.getPrototypeOf(x))) {
    for (const k of Reflect.ownKeys(x)) {
      if (typeof k !== "string" || !isStructuredClonable(x[k])) return false;
    }
    return true;
  }
  return false;
}

type Indexable = Record<PropertyKey, unknown>;

let transferHandlersSet = false;

export function setTransferHandlers() {
  if (transferHandlersSet) return;
  transferHandlersSet = true;

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
