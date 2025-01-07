import { type AtomicTarget, new_atomic_target } from "./target";
import "./polyfill";
import {
  CALLER_WORKING,
  CALL_FINISHED,
  CALL_READY,
  LISTENER_LOCKED,
  LISTENER_WORKING,
  UNLOCKED,
} from "./listener";

export class AsyncCaller {
  protected readonly view: Int32Array;
  protected readonly locked_value: number = 1;
  protected readonly unlocked_value: number = 0;

  constructor({ buf, byteOffset }: AsyncCallerTarget) {
    this.view = new Int32Array(buf, byteOffset, 2);
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(`async caller reset actually did something: ${old}`);
    }
  }

  async call_and_wait(code?: number): Promise<void> {
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        LISTENER_LOCKED,
        CALLER_WORKING,
      );
      if (old === LISTENER_LOCKED) break;
      console.warn("async caller waiting for listener lock");
      await Atomics.waitAsync(this.view, 0, old).value;
    }

    Atomics.store(this.view, 1, code ?? 0);
    if (
      Atomics.compareExchange(this.view, 0, CALLER_WORKING, CALL_READY) !==
      CALLER_WORKING
    ) {
      throw new Error("async caller couldn't set CALL_READY");
    }
    if (Atomics.notify(this.view, 0, 1) !== 1) {
      throw new Error(
        "async caller expected to notify exactly 1 listener of CALL_READY",
      );
    }

    await Atomics.waitAsync(this.view, 0, CALL_READY).value;
    await Atomics.waitAsync(this.view, 0, LISTENER_WORKING).value;
    if (
      Atomics.compareExchange(this.view, 0, CALL_FINISHED, UNLOCKED) !==
      CALL_FINISHED
    ) {
      throw new Error("async caller failed to unlock lock");
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
