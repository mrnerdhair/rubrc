import type { SyncReadableStreamDefaultReader } from "./readable_stream";
import { SyncPromise } from "./sync_promise";

export interface SyncUnderlyingSinkAbortCallback extends UnderlyingSinkAbortCallback {
  (reason?: unknown): void | SyncPromise<void>;
}
export interface SyncUnderlyingSinkCloseCallback extends UnderlyingSinkCloseCallback {
  (): void | SyncPromise<void>;
}
export interface SyncUnderlyingSinkStartCallback extends UnderlyingSinkStartCallback{
  (controller: WritableStreamDefaultController): void | SyncPromise<void>;
}
export interface SyncUnderlyingSinkWriteCallback<W> extends UnderlyingSinkWriteCallback<W> {
  (chunk: W, controller: WritableStreamDefaultController): void | SyncPromise<void>;
}

export interface SyncUnderlyingSink<W> extends UnderlyingSink<W> {
  abort?: SyncUnderlyingSinkAbortCallback;
  close?: SyncUnderlyingSinkCloseCallback;
  start?: SyncUnderlyingSinkStartCallback;
  type?: undefined;
  write?: SyncUnderlyingSinkWriteCallback<W>;
}


class Foo<R> {
  

}






class SyncWritableStream<W> implements WritableStream<W> {
  readonly #sink: SyncUnderlyingSink<W>
  readonly #controller: WritableStreamDefaultController;
  readonly #queuingStrategy: QueuingStrategy<W>;
  #locked = false;

  get locked(): boolean {
    return this.#locked;
  }

  constructor(underlyingSink: SyncUnderlyingSink<W>, queuingStrategy?: QueuingStrategy<W>) {
    this.#sink = underlyingSink;
    this.#controller = new WritableStreamDefaultController();
    this.#queuingStrategy = queuingStrategy ?? { size: () => 1, highWaterMark: 1 };
  }

  abort(reason?: undefined): SyncPromise<undefined>;
  abort<T>(reason: T): SyncPromise<T>;
  abort<T>(reason: T): SyncPromise<T> {
    if (this.locked) throw new TypeError();
    this.#sink.abort?.(reason);
    return SyncPromise.resolve(reason);
  }

  close(): SyncPromise<void> {
    return this.getWriter().close();
  }

  getWriter(): SyncWritableStreamDefaultWriter<W> {
    throw new Error("Method not implemented.");
  } 
}

export interface SyncWritableStreamDefaultWriter<W> extends WritableStreamDefaultWriter<W> {
  readonly closed: SyncPromise<undefined>;
  readonly desiredSize: number | null;
  readonly ready: SyncPromise<undefined>;
  abort(reason?: unknown): SyncPromise<void>;
  close(): SyncPromise<void>;
  releaseLock(): void;
  write(chunk?: W): SyncPromise<void>;
}

export class SyncStreamDefaultQueue<T> implements Omit<SyncReadableStreamDefaultReader<T>, "releaseLock">, Omit<SyncWritableStreamDefaultWriter<T>, "releaseLock"> {
  readonly closed: SyncPromise<undefined>;
  readonly #resolve: () => void;
  readonly #reject: (reason?: unknown) => void;

  #closePending = false;
  #hasError = false;
  #error: unknown = undefined;
  readonly #queue: Array<T> = [];
  readonly #strategy: QueuingStrategy<T>;

  get ready() { return this.#ready; }
  #ready: SyncPromise<undefined> = SyncPromise.resolve(undefined);
  #ready_resolve: () => void = () => {};
  #ready_reject: (reason?: unknown) => void = () => {};
  #setReady() {
    const oldResolve = this.#ready_resolve;
    const { promise, resolve, reject } = SyncPromise.withResolvers<undefined>();
    this.#ready_resolve = resolve;
    this.#ready_reject = reject;
    this.#ready.then(() => {
      this.#ready = this.#ready.then(() => promise);
    });
    oldResolve();
  }

  constructor() {
    this.#setReady();
  }

  get desiredSize(): number | null {
    if (this.#hasError || this.#closePending) return null;
    if (!this.#strategy.highWaterMark) return null;
    return this.#strategy.highWaterMark - this.#queue.length;
  }

  abort(reason?: unknown): SyncPromise<void> {
    throw new Error("Method not implemented.");
  }
  close(): SyncPromise<void> {
    if (this.#closePending || this.#hasError) throw new TypeError();
    this.#closePending = true;
  }
  write(chunk?: T | undefined): SyncPromise<void> {
    throw new Error("Method not implemented.");
  }

  read(): SyncPromise<ReadableStreamReadResult<T>>;
  read(): SyncPromise<ReadableStreamReadResult<T>>;
  read(): SyncPromise<ReadableStreamReadResult<T>> {
    throw new Error("Method not implemented.");
  }

  cancel(reason?: undefined): SyncPromise<undefined>;
  cancel<T>(reason: T): SyncPromise<T>;
  cancel<T>(reason?: T): SyncPromise<T | undefined> {
    throw new Error("Method not implemented.");
  }
}



class Bar{
  #closePending = false;
  #hasError = false;
  #error: unknown = undefined;
  #queue: R[] = [];
  readonly #strategy: QueuingStrategy<R>;

  readonly closed: SyncPromise<undefined>;
  readonly #closed_resolve: () => void;
  readonly #closed_reject: (reason?: unknown) => void;

  #queueReady: SyncPromise<void>;
  #queueReady_resolve: () => void;
  #queueReady_reject: (reason?: unknown) => void;

  #setQueueReady() {
    const oldResolve = this.#queueReady_resolve;
    const { promise, resolve, reject } = SyncPromise.withResolvers<undefined>();
    this.#queueReady_resolve = resolve;
    this.#queueReady_reject = reject;
    this.#queueReady.then(() => {
      this.#queueReady = this.#queueReady.then(() => promise);
    });
    oldResolve();
  }

  constructor(strategy: QueuingStrategy<R>) {
    this.#strategy = strategy;

    const { promise, resolve, reject } =
    SyncPromise.withResolvers<undefined>();
    this.closed = promise;
    this.#closed_resolve = resolve;
    this.#closed_reject = reject;

    this.#queueReady = SyncPromise.resolve();
    this.#queueReady_resolve = () => {};
    this.#queueReady_reject = () => { throw new Error("unreachable"); };
    this.#setQueueReady();
  }

  get desiredSize(): number | null {
    if (!this.#strategy.highWaterMark) return null;
    return this.#strategy.highWaterMark - this.#queue.length;
  }

  close(): void {
    if (this.#closePending || this.#hasError) throw new TypeError();
    this.#closePending = true;
  }

  enqueue(chunk: R): void {
    if (this.#closePending || this.#hasError) throw new TypeError();
    this.#queue.push(chunk);
    this.#setQueueReady();
  }

  error(e?: unknown): void {
    this.#hasError = true;
    this.#error = e;
    this.#queue = [];
    this.#closed_reject(e);
    this.#queueReady_reject(e);
  }

  read(): SyncPromise<ReadableStreamReadResult<R>> {
    if (this.#hasError) throw this.#error;
    if (this.#queue.length === 0) return this.#queueReady.then(() => this.read())
    const value = this.#queue.shift() as R;
    if (this.#queue.length === 0 && this.#closePending) {
      this.#closed_resolve();
      return SyncPromise.resolve({ done: true, value });
    }
    return SyncPromise.resolve({ done: false, value });
  }
}




class Foo<T> implements SyncWritableStreamDefaultWriter<T>, SyncReadableStreamDefaultReader<T> {

  readonly closed: SyncPromise<undefined>;
  readonly #resolve: () => void;
  readonly #reject: (reason?: unknown) => void;

  #source: UnderlyingSource<R> | undefined;
  #controller: SyncReadableStreamDefaultController<R> | undefined;
  #unlocker: (() => void) | undefined;

  #unlock(e?: unknown): void {
    const unlocker = this.#unlocker;
    this.#reject(e);
    this.#source = undefined;
    this.#controller = undefined;
    this.#unlocker = undefined;
    unlocker?.();
  }

  constructor(source: UnderlyingSource<R>, controller: SyncReadableStreamDefaultController<R>, unlocker: () => void) {
    this.#source = source;
    this.#controller = controller;
    this.#unlocker = unlocker;

    const { promise, resolve, reject } =
      SyncPromise.withResolvers<undefined>();
    this.closed = promise;
    this.#resolve = resolve;
    this.#reject = reject;

    promise.catch(e => this.#unlock(e));
  }

  releaseLock(): void {
    this.#unlock();
  }

  cancel(reason?: undefined): SyncPromise<undefined>;
  cancel<T>(reason: T): SyncPromise<T>;
  cancel<T>(reason?: T): SyncPromise<T | undefined> {
    if (!this.#source) throw new TypeError();
    const source = this.#source;
    const out = SyncPromise.resolve(source.cancel?.(reason)).catch(() => undefined).then(() => reason);
    this.#unlock(reason);
    return out;
  }

  protected _read(): SyncPromise<ReadableStreamReadResult<R>> {
    if (this.#controller === undefined) {
      throw new TypeError();
    }

    const out = this.#controller.read().then(next => {
      if (next.done) this.#resolve();
      return next.done ? { done: true as const, value: next.value } : { done: false as const, value: next.value };
    }, e => {
      this.#reject(e);
      throw e;
    })

    return SyncPromise.race([
      out,
      this.closed.finally(
        () => {
          throw new TypeError();
        }
      ) as SyncPromise<never>,
    ]);
  }

  read(): SyncPromise<ReadableStreamReadResult<R>> {
    return this._read();
  }
}
