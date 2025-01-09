import { DummyLockingBase } from "./locking_base";
import type { WaitOnGen } from "./waiter_base";

export abstract class DummyCallerBase extends DummyLockingBase {
  abstract reset(): void;

  protected abstract call_and_wait_inner(code: number): WaitOnGen<void>;

  async call_and_wait(code: number): Promise<void> {
    await this.wait_on_async(this.call_and_wait_inner(code));
  }

  call_and_wait_blocking(code: number): void {
    this.wait_on(this.call_and_wait_inner(code));
  }
}
