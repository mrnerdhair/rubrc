declare module "bluebird" {
  export type Resolvable<R> = R | PromiseLike<R>;

  export interface PromiseInspection<R> {
    reason(): unknown;
    value(): R;
    isPending(): boolean;
    isRejected(): boolean;
    isFulfilled(): boolean;
    isCancelled(): boolean;
  }

  export interface Bluebird<R>
    extends PromiseLike<R>, PromiseInspection<R>
  {
    then(
      onfulfilled?: null | undefined,
      onrejected?: ((reason: unknown) => Resolvable<R>) | null | undefined,
    ): Bluebird<R>;
    then<U>(
      onfulfilled: (value: R) => Resolvable<U>,
      onrejected?: ((reason: unknown) => Resolvable<U>) | null | undefined,
    ): Bluebird<U>;

    catch<U>(
      onrejected?: ((reason: unknown) => Resolvable<U>) | null | undefined,
    ): Bluebird<R | U>;

    finally<U>(
      onfinally?: (() => Resolvable<U>) | null | undefined,
    ): Bluebird<R>;

    readonly [Symbol.toStringTag]: string;
  }

  export interface BluebirdConstructor {
    new<R>(
      executor: (
        resolve: undefined extends R
          ? (value?: Resolvable<R>) => void
          : (value: Resolvable<R>) => void,
        reject: (reason?: unknown) => void,
      ) => void,
    ): Bluebird<R>;

    prototype: Bluebird<unknown>;

    all<T extends readonly unknown[] | []>(
      values: T,
    ): Bluebird<{ -readonly [P in keyof T]: Awaited<T[P]> }>;

    allSettled<T>(
      values: Iterable<T>,
    ): Promise<PromiseSettledResult<Awaited<T>>[]>;

    race<T extends readonly unknown[] | []>(
      values: T,
    ): Bluebird<Awaited<T[number]>>;

    reject<T = never>(reason?: unknown): Bluebird<T>;

    resolve(): Bluebird<void>;
    resolve<T>(value: T): Bluebird<Awaited<T>>;
    resolve<T>(value: T | PromiseLike<T>): Bluebird<Awaited<T>>;

    coroutine<
      T,
      G extends () => Generator<Bluebird<unknown>, T, undefined>,
    >(generatorFunction: G): (...args: Parameters<G>) => Bluebird<T>;

    config(
      options: Partial<
        Record<
          | "warnings"
          | "longStackTraces"
          | "cancellation"
          | "monitoring"
          | "asyncHooks",
          boolean
        >
      >,
    ): void;
    setScheduler(
      scheduler: (fn: () => void) => void,
    ): (fn: () => void) => void;
    getNewLibraryCopy(): typeof Bluebird;
  }

  const BluebirdConstructor: BluebirdConstructor;
  export default BluebirdConstructor;
}
