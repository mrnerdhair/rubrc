import {
  Wait,
  type WaitOnGen,
  type WaitOnGenBase,
  wait_on_gen,
} from "./waiter";

export abstract class LockingBase {
  protected readonly lock_view: Int32Array<SharedArrayBuffer>;

  constructor(lock_view: Int32Array<SharedArrayBuffer>) {
    this.lock_view = lock_view;
  }

  abstract reset(): void;

  protected relock(
    expectedValue: number,
    replacementValue: number,
    opts: Partial<{
      immediate: boolean;
      index: number;
    }> = {},
  ): WaitOnGen<void> {
    const immediate = opts.immediate ?? false;
    const index = opts.index ?? 0;
    return wait_on_gen(
      function* (this: LockingBase): WaitOnGenBase<void> {
        while (true) {
          const old = Atomics.compareExchange(
            this.lock_view,
            index,
            expectedValue,
            replacementValue,
          );
          if (old === expectedValue) {
            break;
          }
          if (immediate) throw new LockNotReady();
          yield new Wait(this.lock_view, index, old);
        }
        Atomics.notify(this.lock_view, index, 1);
        return undefined;
      }.call(this),
    );
  }
}

export class LockNotReady {
  toString(): string {
    return "lock not ready";
  }
}
