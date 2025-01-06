import { type AtomicTarget, new_atomic_target } from "./target";
import "./polyfill";

export class Caller {
  protected readonly view: Int32Array;
  protected readonly locked_value: number | undefined;
  protected readonly unlocked_value: number;

  constructor(
    { buf, byteOffset }: CallerTarget,
    locked_value: number | null = 1,
    unlocked_value = 0,
  ) {
    this.view = new Int32Array(buf, byteOffset, 1);
    this.locked_value = locked_value ?? undefined;
    this.unlocked_value = unlocked_value;
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, this.unlocked_value);
    if (old !== this.unlocked_value) {
      throw new Error(`caller reset actually did something: ${old}`);
    }
  }

  call(code = this.locked_value): void {
    if (code === undefined) throw new Error("must provide a code");
    if (code === this.unlocked_value) {
      throw new Error("code can't be the unlocked value");
    }
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        this.unlocked_value,
        code,
      );
      if (old === this.unlocked_value) break;
      console.warn("caller already locked, waiting");
      Atomics.wait(this.view, 0, old);
    }
    const n = Atomics.notify(this.view, 0, 1);
    if (n === 0) {
      throw new Error("invoked, but waiter is late");
    }
  }

  async call_and_wait(code = this.locked_value): Promise<void> {
    if (code === undefined) throw new Error("must provide a code");
    this.call(code);
    const lock = await Atomics.waitAsync(this.view, 0, code).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }

  call_and_wait_blocking(code = this.locked_value): void {
    if (code === undefined) throw new Error("must provide a code");
    this.call(code);
    const lock = Atomics.wait(this.view, 0, code);
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }
}

declare const callerTargetBrand: unique symbol;
export type CallerTarget = AtomicTarget & { [callerTargetBrand]: never };
export function new_caller_target(): CallerTarget {
  return new_atomic_target() as CallerTarget;
}
