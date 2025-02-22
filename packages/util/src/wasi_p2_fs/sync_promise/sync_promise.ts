import type { Bluebird, BluebirdConstructor } from "bluebird";
import BluebirdImport from "bluebird";
import type WasiIoStreams from "../../../../../output/interfaces/wasi-io-streams";
import { assume } from "rubrc-util";

export type Resolvable<R> = R | PromiseLike<R>;

declare module "bluebird" {
  interface Bluebird<R> extends WasiIoStreams.Pollable {}
  interface BluebirdConstructor {
    withResolvers<R = void>(): {
      promise: SyncPromise<R>;
      resolve: R extends undefined
        ? (value?: Resolvable<R>) => void
        : (value: Resolvable<R>) => void;
      reject: (reason?: unknown) => void;
    };
  
    poll(pollables: Array<WasiIoStreams.Pollable>): Uint32Array;
  
    synchronous<T, G extends () => Generator<SyncPromise<unknown>, T, unknown>>(
      gen: G,
    ): (...args: Parameters<G>) => T;
  }
}

export type SyncPromise<R> = Bluebird<R>;

export type SyncPromiseConstructor = BluebirdConstructor;

export const SyncPromise: SyncPromiseConstructor = getNewLibraryCopy();

function makeSyncScheduler(): ((fn: () => void) => void) & {
  tick: () => boolean;
} {
  const queue: Array<() => void> = [];
  const tick = () => {
    const fn = queue.shift();
    if (fn === undefined) return false;
    fn();
    return true;
  };
  const out = (fn: () => void) => {
    queue.push(fn);
  };
  out.tick = tick;
  return out;
}

function getNewLibraryCopy(): SyncPromiseConstructor {
  const scheduler = makeSyncScheduler();

  const SyncPromise: SyncPromiseConstructor & { prototype: SyncPromise<unknown> } = BluebirdImport.getNewLibraryCopy();
  SyncPromise.config({
    warnings: false,
    longStackTraces: false,
    cancellation: false,
    monitoring: false,
    asyncHooks: false,
  });
  SyncPromise.setScheduler(scheduler);

  SyncPromise.poll = (
    pollables: Array<WasiIoStreams.Pollable>,
  ): Uint32Array => {
    do {
      const readyIndicies = pollables.flatMap((x, i) => (x.ready() ? [i] : []));
      if (readyIndicies.length > 0) return new Uint32Array(readyIndicies);
    } while (scheduler.tick());
    throw new Error("no pollables are ready");
  };
  assume<{poll: object}>(SyncPromise);

  SyncPromise.prototype.ready = function (this: SyncPromise<unknown>) {
    return !this.isPending();
  };
  SyncPromise.prototype.block = function (this: SyncPromise<unknown>) {
    SyncPromise.poll([this]);
  };

  SyncPromise.withResolvers = <R>(): {
    promise: SyncPromise<R>;
    resolve: R extends undefined
      ? (value?: R | PromiseLike<R>) => void
      : (value: R | PromiseLike<R>) => void;
    reject: (reason?: unknown) => void;
  } => {
    let resolve: ((value?: Resolvable<R> | undefined) => void) | ((value: Resolvable<R>) => void) | undefined = undefined;
    let reject: ((reason?: unknown) => void) | undefined = undefined;
    const promise = new SyncPromise<R>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    if (resolve === undefined || reject === undefined) throw new TypeError();
    return { promise, resolve, reject };
  };

  SyncPromise.synchronous = <T, G extends () => Generator<SyncPromise<unknown>, T, unknown>>(
    gen: G,
  ): ((...args: Parameters<G>) => T) => {
    const co = SyncPromise.coroutine<T, G>(gen);
    return (...args: Parameters<G>) => {
      const out = co(...args);
      out.block();
      if (out.isRejected()) throw out.reason();
      return out.value();
    };
  };

  SyncPromise.getNewLibraryCopy = getNewLibraryCopy;

  return SyncPromise;
}
