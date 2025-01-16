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

const waitInner: unique symbol = Symbol.for("WaitTarget.wait()");
const waitAsyncInner: unique symbol = Symbol.for("WaitTarget.waitAsync()");
const waitCtor: unique symbol = Symbol.for("new Wait()");

declare const waitTargetBrand: unique symbol;
export type WaitTarget = {
  view: Int32Array<SharedArrayBuffer>;
  index: number;
  [waitTargetBrand]: never;
};

export namespace WaitTarget {
  export const BYTE_LENGTH = 1 * Int32Array.BYTES_PER_ELEMENT;

  // private static readonly bc = new BroadcastChannel("waitAsync");
  // private readonly bc = WaitTarget.bc;

  export async function init(
    view: ArrayBufferView<SharedArrayBuffer>,
    index: number,
  ): Promise<WaitTarget> {
    const out: Omit<WaitTarget, typeof waitTargetBrand> = {
      view: new Int32Array(
        view.buffer,
        view.byteOffset,
        WaitTarget.BYTE_LENGTH / Int32Array.BYTES_PER_ELEMENT,
      ),
      index,
    };
    return out as WaitTarget;
  }

  export function equals(self: WaitTarget, other: WaitTarget): boolean {
    return (
      self.view.buffer === other.view.buffer &&
      self.view.byteOffset + self.index * Int32Array.BYTES_PER_ELEMENT ===
        other.view.byteOffset + other.index * Int32Array.BYTES_PER_ELEMENT &&
      self.view.byteLength === other.view.byteLength
    );
  }

  export function notify(self: WaitTarget, count?: number): void {
    Atomics.notify(self.view, self.index, count);
    // console.log(`Wait.bc.postMessage([${id}, ${args[1]}, ${args[2]}]`);
    // Wait.bc.postMessage([id, args[1], args[2]]);
  }

  export function exchange(self: WaitTarget, value: number): number {
    return Atomics.exchange(self.view, self.index, value);
  }

  export function compareExchange(
    self: WaitTarget,
    expectedValue: number,
    replacementValue: number,
  ): number {
    return Atomics.compareExchange(
      self.view,
      self.index,
      expectedValue,
      replacementValue,
    );
  }

  export function wait(
    self: WaitTarget,
    value: number,
    timeout?: number,
  ): Wait {
    return Wait[waitCtor](self, value, timeout);
  }

  export const _inner = {
    [waitInner]: (
      self: WaitTarget,
      value: number,
      timeout?: number,
    ): string => {
      return Atomics.wait(self.view, self.index, value, timeout);
    },
    [waitAsyncInner]: async (
      self: WaitTarget,
      value: number,
      timeout?: number,
    ): Promise<string> => {
      return await Atomics.waitAsync(self.view, self.index, value, timeout)
        .value;
      // if (this.args[0] instanceof Int32Array) {
      //   if (Atomics.load(this.args[0], this.args[1]) !== this.args[2])
      //     return "not-equal";
      // } else {
      //   if (Atomics.load(this.args[0], this.args[1]) !== this.args[2])
      //     return "not-equal";
      // }
      // while (true) {
      //   await new Promise((resolve) => {
      //     Wait.bc.addEventListener("message", () => resolve(), {
      //       once: true,
      //       passive: true,
      //     });
      //   });
      //   if (this.args[0] instanceof Int32Array) {
      //     if (Atomics.load(this.args[0], this.args[1]) !== this.args[2])
      //       return "ok";
      //   } else {
      //     if (Atomics.load(this.args[0], this.args[1]) !== this.args[2])
      //       return "ok";
      //   }
      // }

      // const aborter = new AbortController();
      // const foo = new Promise<string>((resolve) => {
      //   const eventListener = (_ev: MessageEvent) => {
      //     // console.log("eventListener", this.id, this.args, ev.data);
      //     // const [id, index, _count] = ev.data as [
      //     //   number,
      //     //   number,
      //     //   number | undefined,
      //     // ];
      //     // if (id !== this.id || index !== this.args[1]) return;
      //     // console.log("eventListener notified", this.id);
      //     if (this.args[0] instanceof Int32Array) {
      //       if (Atomics.load(this.args[0], this.args[1]) === this.args[2]) return;
      //     } else {
      //       if (Atomics.load(this.args[0], this.args[1]) === this.args[2]) return;
      //     }
      //     console.log("eventListener resolve", this.id);
      //     resolve("ok");
      //     Wait.bc.removeEventListener("message", eventListener);
      //     clearInterval(bar);
      //   };
      //   aborter.signal.addEventListener("abort", () => Wait.bc.removeEventListener("message", eventListener));
      //   Wait.bc.addEventListener("message", eventListener);
      //   const bar = setInterval(eventListener, 100);
      // });
      // if (this.args[0] instanceof Int32Array) {
      //   if (Atomics.load(this.args[0], this.args[1]) !== this.args[2]) {
      //     aborter.abort();
      //     return "not-equal";
      //   }
      // } else {
      //   if (Atomics.load(this.args[0], this.args[1]) !== this.args[2]) {
      //     aborter.abort();
      //     return "not-equal";
      //   }
      // }
      // return await foo;
    },
  };
}

export class Wait extends Waitable<string> {
  readonly target: WaitTarget;
  readonly value: number;
  readonly timeout?: number;

  protected constructor(target: WaitTarget, value: number, timeout?: number) {
    super();
    this.target = target;
    this.value = value;
    this.timeout = timeout;
  }

  static [waitCtor](target: WaitTarget, value: number, timeout?: number): Wait {
    return new Wait(target, value, timeout);
  }

  wait(): string {
    return WaitTarget._inner[waitInner](this.target, this.value, this.timeout);
  }

  async waitAsync(): Promise<string> {
    return await WaitTarget._inner[waitAsyncInner](
      this.target,
      this.value,
      this.timeout,
    );
  }
}

export class Spin extends Waitable<void> {
  wait(): void {}

  async waitAsync(): Promise<void> {
    new Promise((resolve) => setTimeout(resolve, 0));
  }
}
