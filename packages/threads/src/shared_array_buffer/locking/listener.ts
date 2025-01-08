import { type AtomicTarget, new_atomic_target } from "./target";
import "./polyfill";

export const UNLOCKED = 0;
export const LISTENER_LOCKED = 1;
export const CALLER_WORKING = 2;
export const CALL_READY = 3;
export const LISTENER_WORKING = 5;
export const CALL_FINISHED = 6;

export class Listener {
  protected readonly view: Int32Array;

  constructor({ buf, byteOffset }: ListenerTarget) {
    this.view = new Int32Array(buf, byteOffset, 2);
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(`listener reset actually did something: ${old}`);
    }
  }

  async listen<T>(
    callback: (value?: number) => T | PromiseLike<T>,
  ): Promise<T> {
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        UNLOCKED,
        LISTENER_LOCKED,
      );
      if (old === UNLOCKED) break;
      console.log("listener locked, waiting");
      await Atomics.waitAsync(this.view, 0, old).value;
    }
    Atomics.notify(this.view, 0, 1);

    while (true) {
      const current = Atomics.load(this.view, 0);
      if (current === CALL_READY) break;
      await Atomics.waitAsync(this.view, 0, current).value;
    }
    if (
      Atomics.compareExchange(this.view, 0, CALL_READY, LISTENER_WORKING) !==
      CALL_READY
    ) {
      throw new Error("listener expected CALL_READY");
    }
    const value = Atomics.load(this.view, 1);

    try {
      return await callback(value);
    } finally {
      if (
        Atomics.compareExchange(
          this.view,
          0,
          LISTENER_WORKING,
          CALL_FINISHED,
        ) !== LISTENER_WORKING
      ) {
        // biome-ignore lint/correctness/noUnsafeFinally: a lock failure is a higher-priority error
        throw new Error("failed to release listener lock");
      }
      if (Atomics.notify(this.view, 0, 1) !== 1) {
        // biome-ignore lint/correctness/noUnsafeFinally: a caller failure is a higher-priority error
        throw new Error("listener expected to notify exactly 1 caller");
      }
    }
  }

  listen_blocking<T>(callback: (value?: number) => T): T {
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        UNLOCKED,
        LISTENER_LOCKED,
      );
      if (old === UNLOCKED) break;
      console.warn("listener locked, waiting");
      Atomics.wait(this.view, 0, old);
    }
    Atomics.notify(this.view, 0, 1);

    while (true) {
      const current = Atomics.load(this.view, 0);
      if (current === CALL_READY) break;
      Atomics.wait(this.view, 0, current);
    }
    if (
      Atomics.compareExchange(this.view, 0, CALL_READY, LISTENER_WORKING) !==
      CALL_READY
    ) {
      throw new Error("listener expected CALL_READY");
    }
    const value = Atomics.load(this.view, 1);

    try {
      return callback(value);
    } finally {
      if (
        Atomics.compareExchange(
          this.view,
          0,
          LISTENER_WORKING,
          CALL_FINISHED,
        ) !== LISTENER_WORKING
      ) {
        // biome-ignore lint/correctness/noUnsafeFinally: a lock failure is a higher-priority error
        throw new Error("failed to release listener lock");
      }
      if (Atomics.notify(this.view, 0, 1) !== 1) {
        // biome-ignore lint/correctness/noUnsafeFinally: a caller failure is a higher-priority error
        throw new Error("listener expected to notify exactly 1 caller");
      }
    }
  }
}

declare const listenerTargetBrand: unique symbol;
export type ListenerTarget = AtomicTarget & { [listenerTargetBrand]: never };
export function new_listener_target(): ListenerTarget {
  return new_atomic_target() as ListenerTarget;
}
