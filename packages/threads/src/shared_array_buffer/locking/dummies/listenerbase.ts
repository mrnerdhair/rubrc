export abstract class DummyListenerBase {
  abstract reset(): void;

  protected abstract listen_inner<T>(
    callback: (code?: number) => T,
  ): Generator<Wait | T, Awaited<T>, T | Awaited<T> | string>;

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

  async listen<T>(callback: (code?: number) => PromiseLike<T>): Promise<T> {
    const gen = this.listen_inner(callback);
    let next = gen.next();
    while (!next.done) {
      const value = next.value;
      let out: [true, Awaited<T> | string] | [false, unknown];
      try {
        out = [
          true,
          await (() => {
            if (value instanceof Wait) return value.waitAsync();
            return value;
          })(),
        ];
      } catch (e) {
        out = [false, e];
      }
      if (out[0]) {
        next = gen.next(out[1]);
      } else {
        next = gen.throw(out[1]);
      }
    }
    return next.value;
  }

  listen_blocking<T>(callback: (code?: number) => T): T {
    const gen = this.listen_inner(callback);
    let next = gen.next();
    while (!next.done) {
      const value = next.value;
      let out: [true, T | string] | [false, unknown];
      try {
        out = [
          true,
          (() => {
            if (value instanceof Wait) return value.wait();
            return value;
          })(),
        ];
      } catch (e) {
        out = [false, e];
      }
      if (out[0]) {
        next = gen.next(out[1]);
      } else {
        next = gen.throw(out[1]);
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
