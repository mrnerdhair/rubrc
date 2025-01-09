import "./polyfill";

export class Locker {
  protected readonly view: Int32Array<SharedArrayBuffer>;
  protected readonly locked_value: number;
  protected readonly unlocked_value: number;
  protected readonly dual_locked_value: number;

  constructor(
    target: LockerTarget,
    locked_value = 1,
    unlocked_value = 0,
    dual_locked_value = 2,
  ) {
    this.view = new Int32Array(target, 0, 1);
    this.locked_value = locked_value;
    this.unlocked_value = unlocked_value;
    this.dual_locked_value = dual_locked_value;
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, this.unlocked_value);
    if (old !== this.unlocked_value) {
      throw new Error(`locker reset actually did something: ${old}`);
    }
  }

  async lock<T>(callback: () => T | PromiseLike<T>, wait = true): Promise<T> {
    let spinning = false;
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        this.unlocked_value,
        this.locked_value,
      );
      if (old === this.unlocked_value) break;
      if (!wait) throw new LockNotReady();
      if (spinning) console.warn("spinning async");
      spinning = true;
      await Atomics.waitAsync(this.view, 0, old).value;
    }
    try {
      return await callback();
    } finally {
      if (
        Atomics.compareExchange(
          this.view,
          0,
          this.locked_value,
          this.unlocked_value,
        ) !== this.locked_value
      ) {
        // biome-ignore lint/correctness/noUnsafeFinally: lock failure is a higher-priority error
        throw new Error("lock was not locked when released");
      }
      Atomics.notify(this.view, 0, 1);
    }
  }

  lock_blocking<T>(callback: () => T, wait = true): T {
    let spinning = false;
    while (true) {
      const old = Atomics.compareExchange(
        this.view,
        0,
        this.unlocked_value,
        this.locked_value,
      );
      if (old === this.unlocked_value) break;
      if (!wait) throw new LockNotReady();
      if (spinning) console.warn("spinning");
      spinning = true;
      Atomics.wait(this.view, 0, old);
    }
    try {
      return callback();
    } finally {
      if (
        Atomics.compareExchange(
          this.view,
          0,
          this.locked_value,
          this.unlocked_value,
        ) !== this.locked_value
      ) {
        // biome-ignore lint/correctness/noUnsafeFinally: lock failure is a higher-priority error
        throw new Error("lock was not locked when released");
      }
      Atomics.notify(this.view, 0, 1);
    }
  }

  private equals(other: Locker): boolean {
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

    // biome-ignore lint/style/noParameterAssign:
    first = new Locker(
      first.view.buffer as LockerTarget,
      first.dual_locked_value,
      first.unlocked_value,
      first.dual_locked_value,
    );
    // biome-ignore lint/style/noParameterAssign:
    second = new Locker(
      second.view.buffer as LockerTarget,
      second.dual_locked_value,
      second.unlocked_value,
      second.dual_locked_value,
    );

    while (true) {
      try {
        return await first.lock(async () => {
          return await second.lock(callback, !early_backoff);
        });
      } catch (e) {
        if (!(e instanceof LockNotReady)) throw e;
        console.warn("spinning async for deadlock avoidance");
        await async_yield();
      }
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

    // biome-ignore lint/style/noParameterAssign:
    first = new Locker(
      first.view.buffer as LockerTarget,
      first.dual_locked_value,
      first.unlocked_value,
      first.dual_locked_value,
    );
    // biome-ignore lint/style/noParameterAssign:
    second = new Locker(
      second.view.buffer as LockerTarget,
      second.dual_locked_value,
      second.unlocked_value,
      second.dual_locked_value,
    );

    while (true) {
      try {
        return first.lock_blocking(() => {
          return second.lock_blocking(callback, !early_backoff);
        });
      } catch (e) {
        if (!(e instanceof LockNotReady)) throw e;
        console.warn("spinning for deadlock avoidance");
      }
    }
  }
}

export class LockNotReady {
  toString(): string {
    return "lock not ready";
  }
}

declare const targetBrand: unique symbol;
export type LockerTarget = SharedArrayBuffer & { [targetBrand]: never };
export function new_locker_target(): LockerTarget {
  return new SharedArrayBuffer(
    1 * Int32Array.BYTES_PER_ELEMENT,
  ) as LockerTarget;
}

// kludgy but cross-platform replacement for setImmediate
function async_yield(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100));
  // const { port1, port2 } = new MessageChannel();
  // const { promise, resolve } = Promise.withResolvers<void>();
  // port2.onmessage = () => resolve();
  // port1.postMessage(undefined);
  // return promise;
}
