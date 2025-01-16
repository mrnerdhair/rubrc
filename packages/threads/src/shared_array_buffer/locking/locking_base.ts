import {
  type WaitOnGen,
  type WaitOnGenBase,
  WaitTarget,
  wait_on_gen,
} from "./waiter";

export abstract class LockingBase {
  protected readonly wait_target: WaitTarget;

  constructor(wait_target: WaitTarget) {
    this.wait_target = wait_target;
  }

  abstract reset(): void;

  protected relock(
    expectedValue: number,
    replacementValue: number,
    opts: Partial<{
      immediate: boolean;
    }> = {},
  ): WaitOnGen<void> {
    const immediate = opts.immediate ?? false;
    return wait_on_gen(
      function* (this: LockingBase): WaitOnGenBase<void> {
        while (true) {
          const old = WaitTarget.compareExchange(
            this.wait_target,
            expectedValue,
            replacementValue,
          );
          if (old === expectedValue) {
            break;
          }
          if (immediate) throw new LockNotReady();
          yield WaitTarget.wait(this.wait_target, old);
        }
        WaitTarget.notify(this.wait_target, 1);
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
