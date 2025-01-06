import { type AtomicTarget, new_atomic_target } from "./target";
import "./polyfill";

export class AsyncCaller {
  protected readonly view: Int32Array;
  protected readonly locked_value: number = 1;
  protected readonly unlocked_value: number = 0;

  constructor({ buf, byteOffset }: AsyncCallerTarget) {
    this.view = new Int32Array(buf, byteOffset, 1);
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, this.unlocked_value);
    if (old !== this.unlocked_value) {
      throw new Error(`async caller reset actually did something: ${old}`);
    }
  }

  call(): void {
    const old = Atomics.exchange(this.view, 0, this.locked_value);
    if (old !== this.unlocked_value) {
      throw new Error("what happened?");
    }
    const n = Atomics.notify(this.view, 0, 1);
    if (n === 0) {
      throw new Error("invoked on async, but waiter is late");
    }
  }

  async call_and_wait(): Promise<void> {
    this.call();
    const lock = await Atomics.waitAsync(this.view, 0, this.locked_value).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }
}

declare const asyncCallerTargetBrand: unique symbol;
export type AsyncCallerTarget = AtomicTarget & {
  [asyncCallerTargetBrand]: never;
};
export function new_async_caller_target(): AsyncCallerTarget {
  return new_atomic_target() as AsyncCallerTarget;
}
