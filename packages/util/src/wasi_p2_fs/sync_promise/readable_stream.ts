import { SyncPromise } from "./sync_promise";

export interface SyncAsyncIterator<T, TReturn = unknown, TNext = undefined> extends AsyncIterator<T, TReturn, TNext> {
  next(...[value]: [] | [TNext]): SyncPromise<IteratorResult<T, TReturn>>;
  return?(
    value?: TReturn | PromiseLike<TReturn>,
  ): SyncPromise<IteratorResult<T, TReturn>>;
  throw?(e?: unknown): SyncPromise<IteratorResult<T, TReturn>>;
}

export type SyncAsyncGenerator<T, TReturn = unknown, TNext = undefined> = SyncAsyncIterator<T, TReturn, TNext> & Required<Pick<SyncAsyncIterator<T, TReturn, TNext>, "return" | "throw">>;

export interface SyncReadableWritablePair<R, W> {
  readable: SyncReadableStream<R>;
  /**
   * Provides a convenient, chainable way of piping this readable stream through a transform stream (or any other { writable, readable } pair). It simply pipes the stream into the writable side of the supplied pair, and returns the readable side for further use.
   *
   * Piping a stream will lock it for the duration of the pipe, preventing any other consumer from acquiring a reader.
   */
  writable: WritableStream<W>;
}

export interface SyncUnderlyingSourceCancelCallback extends UnderlyingSourceCancelCallback {
  (reason?: unknown): void | SyncPromise<void>;
}
export interface SyncUnderlyingSourcePullCallback<R> extends UnderlyingSourcePullCallback<R> {
  (controller: ReadableStreamController<R>): void | SyncPromise<void>;
}
export interface SyncUnderlyingSourceStartCallback<R> extends UnderlyingSourceStartCallback<R> {
  (controller: ReadableStreamController<R>): unknown;
}

export interface SyncUnderlyingSource<R> extends UnderlyingSource<R> {
  autoAllocateChunkSize?: number;
  cancel?: SyncUnderlyingSourceCancelCallback;
  pull?: SyncUnderlyingSourcePullCallback<R>;
  start?: SyncUnderlyingSourceStartCallback<R>;
  type?: ReadableStreamType;
}

export interface SyncUnderlyingByteSource {
  autoAllocateChunkSize?: number;
  cancel?: UnderlyingSourceCancelCallback;
  pull?: (controller: ReadableByteStreamController) => void | SyncPromise<void>;
  start?: (controller: ReadableByteStreamController) => void | SyncPromise<void>;
  type: "bytes";
}

export interface SyncUnderlyingDefaultSource<R> {
  cancel?: SyncUnderlyingSourceCancelCallback;
  pull?: (
    controller: ReadableStreamDefaultController<R>,
  ) => void | SyncPromise<void>;
  start?: (controller: ReadableStreamDefaultController<R>) => void | SyncPromise<void>;
  type?: undefined;
}

export class SyncReadableStream<R> implements ReadableStream<R> {
  #source: SyncUnderlyingSource<R> | undefined;
  #controller: SyncReadableStreamDefaultController<R>;
  #locked = false;

  get locked(): boolean {
    return this.#locked;
  }

  constructor(underlyingSource: SyncUnderlyingSource<R>, queuingStrategy?: QueuingStrategy<R>) {
    this.#source = underlyingSource;
    this.#controller = new SyncReadableStreamDefaultController(queuingStrategy ?? { size: () => 1, highWaterMark: 1 });
  }

  cancel(reason?: unknown): SyncPromise<undefined> {
    if (!this.#source) throw new TypeError();
    const source = this.#source;
    this.#source = undefined;
    return (source.cancel?.(reason) ?? SyncPromise.resolve()).catch(() => undefined).then(() => undefined);
  }

  getReader(options: { mode: "byob" }): never;
  getReader(): SyncReadableStreamDefaultReader<R>;
  getReader(
    options?: Record<PropertyKey, unknown>,
  ): SyncReadableStreamDefaultReader<R> {
    if (this.locked || !this.#source) throw new TypeError();
  
    const unlock = (() => {
      let once = false;
      return () => {
        if (!once) this.#locked = false;
        once = true;
      }
    })();

    switch (options?.mode) {
      case undefined: {
        const out = new SyncReadableStreamDefaultReader<R>(this.#source, this.#controller, unlock);
        return out;
      }
      case "byob": {
        throw new Error("not implemented");
      }
      default: {
        throw new RangeError();
      }
    }
  }

  pipeThrough<T>(
    _transform: ReadableWritablePair<T, R>,
    _options?: StreamPipeOptions,
  ): SyncReadableStream<T> {
    throw new Error("Method not implemented.");
  }

  pipeTo(
    _destination: WritableStream<R>,
    _options?: StreamPipeOptions,
  ): SyncPromise<void> {
    throw new Error("Method not implemented.");
  }

  tee(): [SyncReadableStream<R>, SyncReadableStream<R>] {
    throw new Error("Method not implemented.");
  }
}

export interface SyncReadableStreamGenericReader extends ReadableStreamGenericReader {
  readonly closed: SyncPromise<undefined>;
  cancel(reason?: unknown): SyncPromise<void>;
}

export interface SyncReadableStreamDefaultReader<R> extends SyncReadableStreamGenericReader, ReadableStreamDefaultReader<R> {
  read(): SyncPromise<ReadableStreamReadResult<R>>;
  releaseLock(): void;
}

export class SyncReadableStreamDefaultReader<R>
  implements SyncReadableStreamGenericReader, ReadableStreamDefaultReader<R>
{
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

export class SyncReadableStreamDefaultController<R> implements ReadableStreamDefaultController<R> {
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
