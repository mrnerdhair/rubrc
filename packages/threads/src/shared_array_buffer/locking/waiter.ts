export abstract class Waitable<T> {
  abstract wait(): T;
  abstract waitAsync(): Promise<Awaited<T>>;

  static resolve<T>(x: T | Waitable<T>): Waitable<T> {
    if (x instanceof Waitable) return x;
    return new (class extends Waitable<T> {
      private readonly x: T;
      constructor(x: T) {
        super();
        this.x = x;
      }
      wait(): T {
        return this.x;
      }
      async waitAsync(): Promise<Awaited<T>> {
        return await this.x;
      }
    })(x);
  }
}

export type Waited<T> = Awaited<T extends Waitable<infer R> ? Waited<R> : T>;

export type WaitOnGenBase<T> = Generator<unknown, T | Waitable<T>, unknown>;

export class WaitOnGen<T> extends Waitable<T> {
  private readonly gen: WaitOnGenBase<T>;

  constructor(gen: WaitOnGenBase<T>) {
    if (
      !(
        (typeof gen === "object" || typeof gen === "function") &&
        gen !== null &&
        Symbol.iterator in gen &&
        typeof gen[Symbol.iterator] === "function" &&
        "next" in gen &&
        typeof gen.next === "function" &&
        "return" in gen &&
        typeof gen.return === "function" &&
        "throw" in gen &&
        typeof gen.throw === "function"
      )
    ) {
      throw new TypeError("expected a generator");
    }

    super();
    this.gen = gen;
  }

  wait(): T {
    let next = this.gen.next();
    while (true) {
      try {
        if (next.done) {
          return Waitable.resolve(next.value).wait();
        }
        next = this.gen.next(Waitable.resolve(next.value).wait());
      } catch (e) {
        next = this.gen.throw(e);
      }
    }
  }

  async waitAsync(): Promise<Awaited<T>> {
    let next = this.gen.next();
    while (true) {
      try {
        if (next.done) {
          return await Waitable.resolve(next.value).waitAsync();
        }
        next = this.gen.next(await Waitable.resolve(next.value).waitAsync());
      } catch (e) {
        next = this.gen.throw(e);
      }
    }
  }
}

type WaitOnGenBaseType<T extends WaitOnGenBase<unknown>> =
  T extends WaitOnGenBase<infer R> ? R : never;
type AsWaitOnGen<T extends WaitOnGenBase<unknown>> = WaitOnGen<
  WaitOnGenBaseType<T>
>;

// biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
export function wait_on_gen<T extends WaitOnGenBase<any>>(
  x: T,
): AsWaitOnGen<T> {
  return new WaitOnGen<WaitOnGenBaseType<T>>(x);
}

export class Wait extends Waitable<string> {
  readonly args:
    | [
        view: Int32Array<ArrayBufferLike>,
        index: number,
        value: number,
        timeout?: number,
      ]
    | [
        view: BigInt64Array<ArrayBufferLike>,
        index: number,
        value: bigint,
        timeout?: number,
      ];

  constructor(
    ...args:
      | [
          view: Int32Array<ArrayBufferLike>,
          index: number,
          value: number,
          timeout?: number,
        ]
      | [
          view: BigInt64Array<ArrayBufferLike>,
          index: number,
          value: bigint,
          timeout?: number,
        ]
  ) {
    super();
    this.args = args;
  }

  wait(): string {
    const args = this.args;
    if (args[0] instanceof Int32Array) {
      return Atomics.wait(
        ...(args as [
          view: Int32Array<ArrayBufferLike>,
          index: number,
          value: number,
          timeout?: number,
        ]),
      );
    }
    return Atomics.wait(
      ...(args as [
        view: BigInt64Array<ArrayBufferLike>,
        index: number,
        value: bigint,
        timeout?: number,
      ]),
    );
  }

  async waitAsync(): Promise<string> {
    const args = this.args;
    if (args[0] instanceof Int32Array) {
      return await Atomics.waitAsync(
        ...(args as [
          view: Int32Array<ArrayBufferLike>,
          index: number,
          value: number,
          timeout?: number,
        ]),
      ).value;
    }
    return await Atomics.waitAsync(
      ...(args as [
        view: BigInt64Array<ArrayBufferLike>,
        index: number,
        value: bigint,
        timeout?: number,
      ]),
    ).value;
  }
}

export class Spin extends Waitable<void> {
  wait(): void {}

  async waitAsync(): Promise<void> {
    new Promise((resolve) => setTimeout(resolve, 0));
  }
}
