import { LockingBase } from "./locking_base";
import type { WaitOnGen } from "./waiter_base";

export abstract class CallerBase extends LockingBase {
  abstract reset(): void;

  protected abstract call_and_wait_inner<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ): WaitOnGen<T>;

  async call_and_wait<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ): Promise<T> {
    return await this.wait_on_async(this.call_and_wait_inner(callback));
  }

  call_and_wait_blocking<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ): T {
    return this.wait_on(this.call_and_wait_inner(callback));
  }
}
