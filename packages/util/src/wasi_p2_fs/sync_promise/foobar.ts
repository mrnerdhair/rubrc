import { SyncPromise } from "./sync_promise";

export interface SyncUnderlyingDefaultSource<R>{
  readonly type?: undefined;
  start?: (controller: ReadableStreamDefaultController<R>) => void | SyncPromise<void>;
  pull?: (controller: ReadableStreamDefaultController<R>) => void | SyncPromise<void>;
  cancel?: (reason?: unknown) => void | SyncPromise<void>;
}

export interface SyncUnderlyingSink<W> extends UnderlyingSink<W> {
  readonly type?: undefined;
  start?: (controller: WritableStreamDefaultController) => void | SyncPromise<void>;
  write?: (chunk: W, controller: WritableStreamDefaultController) => void | SyncPromise<void>;
  close?: () => void | SyncPromise<void>;
  abort?: (reason?: unknown) => void | SyncPromise<void>;
}

class SyncWritableStreamDefaultController<T = unknown> implements WritableStreamDefaultController {
  readonly queue: Queue<T>;
  constructor(queue: Queue<T>) {
    this.queue = queue;
  }
  get signal() { return this.queue.aborter.signal; }
  error(e?: unknown): void {
    this.queue.aborter.abort(e);
  }
}

class SyncReadableStreamDefaultController<R> implements ReadableStreamDefaultController<R> {
  readonly queue: Queue<R>;
  constructor(queue: Queue<R>) {
    this.queue = queue;
  }

  readonly desiredSize: number | null;
  close(): void {}
  enqueue(chunk: R): void {
    this.queue.queue.push(chunk);
  }
  error(e?: unknown): void {
    this.queue.aborter.abort(e);
  }
}

class Stream<T> implements ReadableStreamDefaultController<T>, WritableStreamDefaultController {
  private readonly aborter = new AbortController();
  private readonly queue = new Iterators.Appendable<T>();
  private readonly queuingStrategy: QueuingStrategy;
  private weight = 0;

  constructor(queuingStrategy: QueuingStrategy) {
    this.queuingStrategy = queuingStrategy;
    this.aborter.signal.addEventListener("abort", () => {
      try {
        this.queue.throw(this.aborter.signal.reason);
      } catch {}
    }, { once: true });
  }

  get desiredSize(): number | null {
    if (this.aborter.signal.aborted) return null;
    if (this.queue.done) return 0;
    return (this.queuingStrategy.highWaterMark ?? 1) - this.weight;
  }

  get signal() { return this.aborter.signal; }

  close(): void {
    this.queue.return();
  }

  enqueue(chunk: T): void {
    this.weight += this.queuingStrategy.size?.(chunk) ?? 1;
    this.queue.append([chunk]);
  }

  dequeue(): T | undefined {
    const out = this.queue.next();
    if (out.done) return undefined;
    this.weight -= this.queuingStrategy.size?.(out.value) ?? 1;
    return out.value;
  }

  error(e?: unknown): void {
    this.aborter.abort(e);
    this.queue.throw(e);
  }
}

// function* once<T>(value: T): IterableIterator<T, undefined, undefined> {
//   yield value;
// }

// function* concat<T>(...args: Array<Iterator<T, undefined, undefined>>): Iterator<T, undefined, undefined> {
//   for (const arg of args) {
//     const iterable = { [Symbol.iterator]() { return arg; } };
//     for (const item of iterable) {
//       yield item;
//     }
//   }
// }

// export class AppendableIterator<T, TNext = undefined> implements IterableIterator<T, undefined, TNext> {
//   private futureIterators: Array<Iterable<T, T | undefined, TNext>> | undefined = [];
//   private currentIterator: Iterator<T, T | undefined, TNext> | undefined = undefined;

//   [Symbol.iterator]() {
//     return this;
//   }

//   next(...[value]: [] | [TNext]): IteratorResult<T, undefined> {
//     while (this.currentIterator !== undefined || this.futureIterators !== undefined) {
//       this.currentIterator ??= this.futureIterators?.shift?.()?.[Symbol.iterator]?.();
//       if (this.currentIterator === undefined) {
//         this.futureIterators = undefined;
//         break;
//       }

//       const iterResult = this.currentIterator.next(value as TNext);
//       if (!iterResult.done) return { done: false, value: iterResult.value };
//       this.currentIterator = undefined;
//       if (iterResult.value !== undefined) {
//         return { done: false, value: iterResult.value };
//       }
//     }
//     return { done: true, value: undefined };
//   }

//   return(): IteratorResult<T, undefined> {
//     this.currentIterator = undefined;
//     this.futureIterators = undefined;
//     return { done: true, value: undefined };
//   }

//   throw(e?: unknown): IteratorResult<T, undefined> {
//     this.currentIterator = undefined;
//     this.futureIterators = undefined;
//     throw e;
//   }

//   append(iter: Iterable<T, T | undefined, TNext>) {
//     if (!this.futureIterators) throw new TypeError();
//     this.futureIterators.push(iter);
//   }
// }

export interface SyncAsyncIterator<T, TReturn = unknown, TNext = undefined> extends AsyncIterator<T, TReturn, TNext> {
  next(...[value]: [] | [TNext]): SyncPromise<IteratorResult<T, TReturn>>;
  return?(
    value?: TReturn | PromiseLike<TReturn>,
  ): SyncPromise<IteratorResult<T, TReturn>>;
  throw?(e?: unknown): SyncPromise<IteratorResult<T, TReturn>>;
}

export interface SyncAsyncIterable<T, TReturn = unknown, TNext = undefined> extends AsyncIterable<T, TReturn, TNext> {
  [Symbol.asyncIterator](): SyncAsyncIterator<T, TReturn, TNext>;
}

export interface SyncAsyncIterableIterator<T, TReturn = unknown, TNext = undefined>
  extends SyncAsyncIterator<T, TReturn, TNext> {
  [Symbol.asyncIterator](): SyncAsyncIterableIterator<T, TReturn, TNext>;
}

export class Empty implements SyncAsyncIterableIterator<never, undefined, undefined> {
  [Symbol.asyncIterator]() {
    return this;
  }
  next() {
    return SyncPromise.resolve({ done: true, value: undefined } as const);
  }
}

export namespace SyncAsyncIterator {
  export function asyncify<T, TReturn = unknown, TNext = undefined>(iter: Iterator<T | SyncPromise<T>, TReturn | SyncPromise<TReturn>, TNext | SyncPromise<TNext>>): SyncAsyncIterableIterator<T, TReturn, TNext> {
    let last: SyncPromise<unknown> = SyncPromise.resolve();
    return {
      [Symbol.asyncIterator]() { return this; },
      next(): SyncPromise<IteratorResult<T, TReturn>> {
        const out = last.then((): SyncPromise<IteratorResult<T, TReturn>> => {
          const result = iter.next();
          if (result.done) {
            return SyncPromise.resolve(result.value).then(value => ({ done: true, value }));
          }
          return SyncPromise.resolve(result.value).then(value => ({ done: false, value }));
        });
        last = out;
        return out;
      },
      ...(iter.return ? {
        return(value: TReturn | SyncPromise<TReturn>): SyncPromise<IteratorResult<T, TReturn>> {
          const out = SyncPromise.all([value, last]).then(([value]): SyncPromise<IteratorResult<T, TReturn>> => {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const result = iter.return!(value);
            if (result.done) {
              return SyncPromise.resolve(result.value).then(value => ({ done: true, value }));
            }
            return SyncPromise.resolve(result.value).then(value => ({ done: false, value }));
          });
          last = out;
          return out;
        }
      } : {}),
      ...(iter.throw ? {
        throw(e?: unknown): SyncPromise<IteratorResult<T, TReturn>> {
          const out = last.then((): SyncPromise<IteratorResult<T, TReturn>> => {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            const result = iter.throw!(e);
            if (result.done) {
              return SyncPromise.resolve(result.value).then(value => ({ done: true, value }));
            }
            return SyncPromise.resolve(result.value).then(value => ({ done: false, value }));
          });
          last = out;
          return out;
        }
      } : {}),
    };
  }

  class Empty implements AsyncIterableIterator<never, undefined, undefined> {
    [Symbol.asyncIterator]() {
      return this;
    }
    next() {
      return SyncPromise.resolve({ done: true, value: undefined } as const);
    }
  }

  export function empty() {
    return new Empty();
  }

  export function once<T>(value: T): SyncAsyncIterableIterator<T, undefined, undefined> {
    return asyncify<T, undefined, undefined>((function*() {
      yield value;
      return undefined;
    })());
  };

  export class Appendable<T> implements SyncAsyncIterableIterator<T, undefined, undefined> {
    [Symbol.asyncIterator]() {
      return this;
    }

    #iter: Iterator<T, undefined, undefined> | undefined = { next() { return { done: true, value: undefined } } };
    #stall: SyncPromise<void>;
    #unstall: (() => void) | undefined = undefined;

    get done(): boolean {
      return this.#iter === undefined;
    }

    next(): SyncPromise<IteratorResult<T, undefined>> {
      return this.#stall.then<IteratorResult<T, undefined>>(() => {
        if (!this.#iter) return { done: true, value: undefined };
        try {
          const out = this.#iter.next();
          if (out.done) this.#iter = undefined;
          return out;
        } catch (e) {
          this.#iter = undefined;
          throw e;
        }
      })
    }

    return(value?: undefined): SyncPromise<IteratorResult<T, undefined>> {
      const iter = this.#iter;
      this.#iter = undefined;

      return this.#stall
      if (iter?.return) return iter.return(value);
      return { done: true, value: undefined };
    }

    throw(e?: unknown): IteratorResult<T, undefined> {
      const iter = this.#iter;
      this.#iter = undefined;
      if (iter?.throw) return iter.throw(e);
      throw e;
    }

    append(next: Iterable<T, undefined, undefined>) {
      const prev = this.#iter;
      if (prev === undefined) throw new TypeError("can't append once an iterator has completed");
      this.#iter = (function* () {
        for (const iterable of [{ [Symbol.iterator]() { return prev; } }, next]) {
          const iterator = iterable[Symbol.iterator]();
          for (const item of { [Symbol.iterator]() { return iterator; } }) {
            let done = false;
            try {
              yield item;
              done = true;
            } catch (e) {
              if (!iterator.throw) throw e;
              iterator.throw(e);
            } finally {
              if (!done && iterator.return) iterator.return();
            }
          }
        }
        return undefined;
      })();
    }
  }
}
