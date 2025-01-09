import { type WaitOnGen, WaiterBase } from "./waiter_base";

export class LockingBase extends WaiterBase {
  protected relock(
    view: Int32Array<SharedArrayBuffer>,
    index: number,
    expectedValue: number,
    replacementValue: number,
    immediate = false,
  ): WaitOnGen<undefined> {
    return this.recursable(
      function* (this: LockingBase) {
        while (true) {
          const old = Atomics.compareExchange(
            view,
            index,
            expectedValue,
            replacementValue,
          );
          if (old === expectedValue) {
            break;
          }
          if (immediate)
            throw new Error(
              `immediate relock expected ${expectedValue}, got ${old}`,
            );
          yield this.wait(view, index, old);
        }
        Atomics.notify(view, index, 1);
        return undefined;
      }.call(this),
    );
  }
}
