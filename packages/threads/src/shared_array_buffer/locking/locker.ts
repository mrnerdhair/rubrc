import { type AtomicTarget, new_atomic_target } from "./target";
import "./polyfill";

export class Locker {
  protected readonly view: Int32Array<SharedArrayBuffer>;
  protected readonly locked_value: number;
  protected readonly unlocked_value: number;

  constructor(
    { buf, byteOffset }: LockerTarget,
    locked_value = 1,
    unlocked_value = 0,
  ) {
    this.view = new Int32Array(buf, byteOffset, 1);
    this.locked_value = locked_value;
    this.unlocked_value = unlocked_value;
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, this.unlocked_value);
    if (old !== this.unlocked_value) {
      throw new Error(`reset actually did something: ${old}`);
    }
  }

  async lock<T>(callback: () => T | PromiseLike<T>): Promise<T> {
    while (true) {
      const [success, out] = await this.try_lock(callback);
      if (success) return out;
      console.warn("spinning");
    }
  }

  lock_blocking<T>(callback: () => T): T {
    while (true) {
      const [success, out] = this.try_lock_blocking(callback);
      if (success) return out;
      console.warn("spinning");
    }
  }

  async try_lock<T>(
    callback: () => T | PromiseLike<T>,
  ): Promise<[true, T] | [false, undefined]> {
    if (!(await this.try_take_lock())) return [false, undefined];
    try {
      return [true, await callback()];
    } finally {
      this.release_lock();
    }
  }

  try_lock_blocking<T>(callback: () => T): [true, T] | [false, undefined] {
    if (!this.try_take_lock_blocking()) return [false, undefined];
    try {
      return [true, callback()];
    } finally {
      this.release_lock();
    }
  }

  protected async try_take_lock(): Promise<boolean> {
    const current = Atomics.load(this.view, 0);
    if (current !== this.unlocked_value) {
      if (current === this.locked_value) return false;
      const lock = await Atomics.waitAsync(this.view, 0, current).value;
      if (lock === "timed-out") {
        throw new Error("timed-out");
      }
    }
    const old = Atomics.compareExchange(
      this.view,
      0,
      this.unlocked_value,
      this.locked_value,
    );
    return old === this.unlocked_value;
  }

  protected try_take_lock_blocking(): boolean {
    const current = Atomics.load(this.view, 0);
    if (current !== this.unlocked_value) {
      if (current === this.locked_value) return false;
      const lock = Atomics.wait(this.view, 0, current);
      if (lock === "timed-out") {
        throw new Error("timed-out");
      }
    }
    const old = Atomics.compareExchange(
      this.view,
      0,
      this.unlocked_value,
      this.locked_value,
    );
    return old === this.unlocked_value;
  }

  protected release_lock() {
    const old = Atomics.exchange(this.view, 0, this.unlocked_value);
    Atomics.notify(this.view, 0, 1);
    if (old !== this.locked_value) {
      throw new Error("lock was not locked when released");
    }
  }

  protected equals(other: Locker): boolean {
    return (
      this.view.buffer === other.view.buffer &&
      this.view.byteOffset === other.view.byteOffset &&
      this.view.byteLength === other.view.byteOffset
    );
  }

  static async dual_lock<T>(
    first: Locker,
    second: Locker,
    callback: () => T | PromiseLike<T>,
    early_backoff = false,
  ): Promise<T> {
    if (first.equals(second)) {
      return await first.lock(callback);
    }

    while (true) {
      const [success, out] = await first.lock(async () => {
        if (early_backoff) {
          return await second.try_lock(callback);
        }
        return [true, await second.lock(callback)];
      });
      if (success) return out;
      console.warn("spinning with deadlock avoidance");
    }
  }

  static dual_lock_blocking<T>(
    first: Locker,
    second: Locker,
    callback: () => T,
    early_backoff = false,
  ): T {
    if (first.equals(second)) {
      return first.lock_blocking(callback);
    }

    while (true) {
      const [success, out] = first.lock_blocking(() => {
        if (early_backoff) {
          return second.try_lock_blocking(callback);
        }
        return [true, second.lock_blocking(callback)];
      });
      if (success) return out;
      console.warn("spinning with deadlock avoidance");
    }
  }
}

declare const lockerTargetBrand: unique symbol;
export type LockerTarget = AtomicTarget & { [lockerTargetBrand]: never };
export function new_locker_target(): LockerTarget {
  return new_atomic_target() as LockerTarget;
}
