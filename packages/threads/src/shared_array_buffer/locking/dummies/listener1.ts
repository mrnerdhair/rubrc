import type { WaitOnGen } from "./base";
import { DummyListenerBase } from "./listenerbase";

export class DummyListener1 extends DummyListenerBase {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;

  constructor(lock_view: Int32Array<SharedArrayBuffer>) {
    super();
    this.lock_view = lock_view;
  }

  reset() {
    Atomics.store(this.lock_view, 0, 0);
  }

  protected listen_inner<T>(callback: (code?: number) => T) {
    return function* (
      this: DummyListener1,
      callback: (code?: number) => T,
    ): WaitOnGen<T> {
      try {
        const lock = yield this.wait(this.lock_view, 0, 0);
        if (lock === "timed-out") {
          throw new Error("timed-out");
        }
        // if (lock === "not-equal") {
        //   throw new Error("not-equal");
        // }

        const func_lock = Atomics.load(this.lock_view, 0);
        if (func_lock !== 1) {
          throw new Error(`func_lock is already set: ${func_lock}`);
        }

        let out: Awaited<T>;
        try {
          out = (yield callback(func_lock)) as Awaited<T>;
        } catch (error) {
          if (!(error instanceof Error && error.message === "unknown code")) {
            const old = Atomics.compareExchange(
              this.lock_view,
              0,
              func_lock,
              0,
            );
            if (old !== 1) {
              console.error("what happened?");
            }
          }
          throw error;
        }

        const old_call_lock = Atomics.compareExchange(
          this.lock_view,
          0,
          func_lock,
          0,
        );
        if (old_call_lock !== 1) {
          throw new Error(
            `Call is already set: ${old_call_lock}\nfunc: \${func_name}\nfd: \${fd_n}`,
          );
        }

        const n = Atomics.notify(this.lock_view, 0, 1);
        if (n !== 1) {
          if (n === 0) {
            console.warn("notify failed, waiter is late");
          } else {
            throw new Error(`notify failed: ${n}`);
          }
        }

        return out;
      } catch (e) {
        Atomics.store(this.lock_view, 0, 0);
        Atomics.notify(this.lock_view, 0, 1);
        throw e;
      }
    }.call(this, callback);
  }
}
