import { DummyLockingBase, type WaitOnGen } from "./base";

export abstract class DummyListenerBase extends DummyLockingBase {
  abstract reset(): void;

  protected abstract listen_inner<T>(
    callback: (code?: number) => T,
  ): WaitOnGen<T>;

  async listen<T>(callback: (code?: number) => T): Promise<T> {
    return this.wait_on_async(this.listen_inner(callback));
  }

  listen_blocking<T>(callback: (code?: number) => T): T {
    return this.wait_on(this.listen_inner(callback));
  }
}
