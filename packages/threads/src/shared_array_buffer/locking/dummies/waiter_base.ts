export type WaitOnGen<T, U = never> = Generator<T | U | Wait | WaitOnGen<T | U | undefined>, Awaited<T>, T | U | string | undefined>;

export class WaiterBase {
  static readonly RECURSABLE: unique symbol = Symbol("WaiterBase::recursable");

  protected wait(
    view: Int32Array<ArrayBufferLike>,
    index: number,
    value: number,
    timeout?: number,
  ): Wait;
  protected wait(
    view: BigInt64Array<ArrayBufferLike>,
    index: number,
    value: bigint,
    timeout?: number,
  ): Wait;
  protected wait(
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
  ): Wait {
    return new Wait(...args);
  }

  protected recursable<T extends WaitOnGen<void, void> & Partial<Record<typeof WaiterBase.RECURSABLE, unknown>>>(value: T): T {
    value[WaiterBase.RECURSABLE] = true;
    return value;
  }

  private static is_recursable<T, U = never>(x: unknown): x is WaitOnGen<T, U> {
    return (typeof x === "object" || typeof x === "function") && x !== null && WaiterBase.RECURSABLE in x && !!x[WaiterBase.RECURSABLE];
  }

  async wait_on_async<T, U = never>(gen: WaitOnGen<T, U>): Promise<T> {
    let next = gen.next();
    while (!next.done) {
      const value = next.value;
      try {
        if (value instanceof Wait) {
          next = gen.next(await value.waitAsync());
        } else if (WaiterBase.is_recursable<T | U | undefined, U>(value)) {
          next = gen.next(await this.wait_on_async(value));
        } else {
          next = gen.next(await value);
        }
      } catch (e) {
        next = gen.throw(e);
      }
    }
    return next.value;
  }

  wait_on<T, U = never>(gen: WaitOnGen<T, U>): T {
    let next = gen.next();
    while (!next.done) {
      const value = next.value;
      try {
        if (value instanceof Wait) {
          next = gen.next(value.wait());
        } else if (WaiterBase.is_recursable<T | U | undefined, U>(value)) {
          next = gen.next(this.wait_on(value));
        } else {
          next = gen.next(value);
        }
      } catch (e) {
        next = gen.throw(e);
      }
    }
    return next.value;
  }
}

export class Wait {
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
