class FooReadableStream<R> implements ReadableStream<R> {
  locked: boolean;
  cancel(reason?: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getReader(options?: unknown): ReadableStreamReader<R> {
    throw new Error("Method not implemented.");
  }
  pipeThrough<T>(transform: ReadableWritablePair<T, R>, options?: StreamPipeOptions): ReadableStream<T> {
    throw new Error("Method not implemented.");
  }
  pipeTo(destination: WritableStream<R>, options?: StreamPipeOptions): Promise<void> {
    throw new Error("Method not implemented.");
  }
  tee(): [ReadableStream<R>, ReadableStream<R>] {
    throw new Error("Method not implemented.");
  }
}

type FooReadableStreamReader<R> = FooReadableStreamBYOBReader | FooReadableStreamDefaultReader<R>

class FooReadableStreamBYOBReader implements ReadableStreamBYOBReader {
  read<T extends ArrayBufferView>(view: T): SyncPromise<ReadableStreamReadResult<T>> {
    throw new Error("Method not implemented.");
  }
  releaseLock(): void {
    throw new Error("Method not implemented.");
  }
  closed: Promise<undefined>;
  cancel(reason?: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class FooReadableStreamDefaultReader<R> implements ReadableStreamDefaultReader<R> {
  read(): SyncPromise<ReadableStreamReadResult<R>> {
    throw new Error("Method not implemented.");
  }
  releaseLock(): void {
    throw new Error("Method not implemented.");
  }
  closed: Promise<undefined>;
  cancel(reason?: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class SyncPromise<T> implements Promise<T> {
  static withResolvers<T>(): { promise: SyncPromise<T>; resolve: (result: T) => void; reject: (reason: unknown) => void } {
    let resolve: (w(result: T) => void) | undefined;
    let reject: (reason: unknown) => void;
    const promise = new SyncPromise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    })
    if (resolve === undefined || reject === undefined) throw new TypeError();
    return { promise, resolve, reject };
  }

  constructor(fn: (resolve: (result: T) => void, reject: (reason: unknown) => void) => void) {
    const resolve: (result: T) => void = () => {};
    const reject: (reason: unknown) => void = () => {};
    fn(resolve, reject);
  }

  // biome-ignore lint/suspicious/noThenProperty: <explanation>
  then(
    onfulfilled?: null | undefined,
    onrejected?: ((reason: unknown) => T | PromiseLike<T>) | null | undefined,
  ): SyncPromise<T>;
  // biome-ignore lint/suspicious/noThenProperty: <explanation>
  then<U>(
    onfulfilled: (value: T) => U | PromiseLike<U>,
    onrejected?: ((reason: unknown) => U | PromiseLike<U>) | null | undefined,
  ): SyncPromise<U>;
  // biome-ignore lint/suspicious/noThenProperty: <explanation>
  then<U>(
    onfulfilled?: ((value: T) => U | PromiseLike<U>) | null | undefined,
    onrejected?: ((reason: unknown) => U | PromiseLike<U>) | null | undefined,
  ): SyncPromise<T> | SyncPromise<U> {
    
  }

  catch(onrejected?: ((reason: unknown) => T | PromiseLike<T>) | null | undefined): SyncPromise<T> {
    return this.then(undefined, onrejected);
  }

  finally<U>(onfinally?: (() => U | PromiseLike<U>) | null | undefined): SyncPromise<T> {
    return new SyncPromise((resolve, reject) => {
      this.then(x => {
        onfinally?.();
        resolve(x);
      }, reason => {
        onfinally?.();
        reject(reason);
      });
    });
  }

  readonly [Symbol.toStringTag] = "SyncPromise";
}
