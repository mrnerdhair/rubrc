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
    this.view = new Int32Array(buf, byteOffset, 2);
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(`caller reset actually did something: ${old}`);
    }
  }

  call(code?: number, callback?: () => void): void {
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        LISTENER_LOCKED,
        CALLER_WORKING,
      );
      if (old === LISTENER_LOCKED) break;
      console.warn("caller waiting for listener lock");
      Atomics.wait(this.view, 0, old);
    }

    Atomics.store(this.view, 1, code ?? 0);
    try {
      callback?.();
    } catch (e) {
      if (
        Atomics.compareExchange(this.view, 0, CALLER_WORKING, UNLOCKED) !==
        CALLER_WORKING
      ) {
        throw new Error(
          "caller callback failed, but unlocking the caller lock also failed",
        );
      }
      throw e;
    }

    if (
      Atomics.compareExchange(this.view, 0, CALLER_WORKING, CALL_READY) !==
      CALLER_WORKING
    ) {
      throw new Error("caller couldn't set CALL_READY");
    }
    try {
      const n = Atomics.notify(this.view, 0, 1);
      if (n === 0) {
        if (
          Atomics.compareExchange(this.view, 0, CALL_READY, CALL_FINISHED) !==
          CALL_READY
        ) {
          throw new Error(
            "caller found no listeners and was unable to act as its own listener",
          );
        }
        throw new NoListener();
      }
      if (n !== 1) {
        throw new Error(
          "caller expected to notify at most 1 listener of CALL_READY",
        );
      }
    } finally {
      while (true) {
        const old = Atomics.compareExchange(
          this.view,
          0,
          CALL_FINISHED,
          UNLOCKED,
        );
        if (old === CALL_FINISHED) break;
        console.warn("caller waiting for CALL_FINISHED to unlock lock");
        Atomics.wait(this.view, 0, old);
      }
    }
  }

  call_and_wait_blocking(code?: number): void {
    this.call(code);
  }
}

export class NoListener {
  toString(): string {
    return "caller found no listeners";
  }
}

declare const callerTargetBrand: unique symbol;
export type CallerTarget = AtomicTarget & { [callerTargetBrand]: never };
export function new_caller_target(): CallerTarget {
  return new_atomic_target() as CallerTarget;
}
