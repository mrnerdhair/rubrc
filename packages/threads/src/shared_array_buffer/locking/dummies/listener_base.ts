import { LockingBase } from "./locking_base";
import type { WaitOnGen } from "./waiter_base";

export abstract class ListenerBase extends LockingBase {
  abstract reset(): void;

  protected abstract listen_inner<T>(
    callback: (data_view: DataView<SharedArrayBuffer>) => T,
  ): WaitOnGen<T>;

  async listen<T>(
    callback: (data_view: DataView<SharedArrayBuffer>) => T,
  ): Promise<T> {
    return await this.wait_on_async(this.listen_inner(callback));
  }

  listen_blocking<T>(
    callback: (data_view: DataView<SharedArrayBuffer>) => T,
  ): T {
    return this.wait_on(this.listen_inner(callback));
  }
}
