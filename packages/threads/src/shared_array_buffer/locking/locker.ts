import { LockNotReady, LockingBase } from "./locking_base";
import "./polyfill";
import {
  Spin,
  type WaitOnGen,
  type WaitOnGenBase,
  wait_on_gen,
} from "./waiter";

enum LockerState {
  UNLOCKED = 0,
  LOCKED = 1,
  DUAL_LOCKED = 2,
}

export class Locker extends LockingBase {
  protected constructor(target: Target) {
    const lock_view = new Int32Array(target, 0, 2);
    super(lock_view);
  }

  static async init(target: Target): Promise<Locker> {
    return new Locker(target);
  }

  get target() {
    return this.lock_view.buffer as Target;
  }

  reset(): void {
    const old = Atomics.exchange(this.lock_view, 0, LockerState.UNLOCKED);
    if (old !== LockerState.UNLOCKED) {
      throw new Error(`locker reset actually did something: ${old}`);
    }
  }

  async lock<T>(callback: () => T): Promise<Awaited<T>> {
    return await this.lock_inner(callback).waitAsync();
  }

  lock_blocking<T>(callback: () => T): T {
    return this.lock_inner(callback).wait();
  }

  protected lock_inner<T>(callback: () => T): WaitOnGen<T> {
    return wait_on_gen(
      function* (this: Locker): WaitOnGenBase<T> {
        yield this.relock(LockerState.UNLOCKED, LockerState.LOCKED);

        try {
          return (yield callback()) as T;
        } finally {
          yield this.relock(LockerState.LOCKED, LockerState.UNLOCKED, {
            immediate: true,
          });
        }
      }.call(this),
    );
  }

  private equals(other: Locker): boolean {
    return (
      this.lock_view.buffer === other.lock_view.buffer &&
      this.lock_view.byteOffset === other.lock_view.byteOffset &&
      this.lock_view.byteLength === other.lock_view.byteOffset
    );
  }

  static async dual_lock<T>(
    first: Locker,
    second: Locker,
    callback: () => T,
    opts: Partial<{ early_backoff: boolean }> = {},
  ): Promise<T> {
    return await Locker.dual_lock_inner(
      first,
      second,
      callback,
      opts,
    ).waitAsync();
  }

  static dual_lock_blocking<T>(
    first: Locker,
    second: Locker,
    callback: () => T,
    opts: Partial<{ early_backoff: boolean }> = {},
  ): T {
    return Locker.dual_lock_inner(first, second, callback, opts).wait();
  }

  private dual_lock_inner<T>(
    callback: () => T,
    opts: Partial<{ immediate: boolean }> = {},
  ) {
    const immediate = opts.immediate ?? false;
    return wait_on_gen(
      function* (this: Locker): WaitOnGenBase<T> {
        yield this.relock(LockerState.UNLOCKED, LockerState.DUAL_LOCKED, {
          immediate,
        });

        try {
          return (yield callback()) as T;
        } finally {
          yield this.relock(LockerState.DUAL_LOCKED, LockerState.UNLOCKED, {
            immediate: true,
          });
        }
      }.call(this),
    );
  }

  static dual_lock_inner<T>(
    first: Locker,
    second: Locker,
    callback: () => T,
    opts: Partial<{ early_backoff: boolean }> = {},
  ) {
    const early_backoff = opts.early_backoff ?? false;
    return wait_on_gen(
      function* (this: typeof Locker): WaitOnGenBase<T> {
        if (first.equals(second)) {
          return (yield first.lock_inner(callback).wait()) as T;
        }

        while (true) {
          try {
            return (yield first.dual_lock_inner(() =>
              wait_on_gen(
                function* (this: typeof Locker): WaitOnGenBase<T> {
                  return (yield second.dual_lock_inner(callback, {
                    immediate: early_backoff,
                  })) as T;
                }.call(Locker),
              ),
            )) as T;
          } catch (e) {
            if (!(e instanceof LockNotReady)) throw e;
            console.warn("spinning async for deadlock avoidance");
            yield new Spin();
          }
        }
      }.call(Locker),
    );
  }
}

declare const targetBrand: unique symbol;
export type Target = SharedArrayBuffer & { [targetBrand]: never };
export function new_locker_target(): Target {
  return new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT) as Target;
}
