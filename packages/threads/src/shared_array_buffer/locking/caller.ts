import {
  CALLER_WORKING,
  CALL_FINISHED,
  CALL_READY,
  LISTENER_LOCKED,
  UNLOCKED,
} from "./listener";

import { type AtomicTarget, new_atomic_target } from "./target";
import "./polyfill";

export class Caller {
  protected readonly view: Int32Array;

  constructor({ buf, byteOffset }: CallerTarget) {
    this.view = new Int32Array(buf, byteOffset, 5);
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(`caller reset actually did something: ${old}`);
    }
  }

  call(foo: string, code?: number): void {
    const call_id = Atomics.add(this.view, 4, 1);
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        LISTENER_LOCKED,
        CALLER_WORKING,
      );
      if (old === LISTENER_LOCKED) break;
      console.warn(`caller ${foo} waiting for listener lock / ${call_id}`);
      Atomics.wait(this.view, 0, old);
    }

    Atomics.store(this.view, 1, code ?? 0);
    Atomics.store(this.view, 2, call_id);

    if (
      Atomics.compareExchange(this.view, 0, CALLER_WORKING, CALL_READY) !==
      CALLER_WORKING
    ) {
      throw new Error(`caller ${foo} couldn't set CALL_READY / ${call_id}`);
    }
    if (Atomics.notify(this.view, 0, 1) !== 1) {
      throw new Error(
        `caller ${foo} expected to notify exactly 1 listener of CALL_READY / ${call_id}`,
      );
    }

    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        CALL_FINISHED,
        UNLOCKED,
      );
      if (old === CALL_FINISHED) break;
      console.warn(`caller ${foo} waiting for CALL_FINISHED to unlock lock / ${call_id}`);
      Atomics.wait(this.view, 0, old);
    }

    console.warn(`caller ${foo} unlocked lock / ${call_id}`);
  }

  call_and_wait_blocking(foo: string, code?: number): void {
    this.call(`call_and_wait_blocking ${foo}`, code);
  }
}

declare const callerTargetBrand: unique symbol;
export type CallerTarget = AtomicTarget & { [callerTargetBrand]: never };
export function new_caller_target(): CallerTarget {
  return new_atomic_target() as CallerTarget;
}
