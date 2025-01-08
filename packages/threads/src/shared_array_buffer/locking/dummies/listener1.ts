import { DummyListenerBase } from "./listenerbase";

export class DummyListener1 extends DummyListenerBase {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;

  constructor(lock_view: Int32Array<SharedArrayBuffer>) {
    super();
    this.lock_view = lock_view;
  }

  reset() {
    Atomics.store(this.lock_view, 1, 0);
  }

  protected listen_inner<T>(callback: (code?: number) => T) {
    return function* (
      this: DummyListener1,
      callback: (code?: number) => T,
    ): Generator<
      [Int32Array<SharedArrayBuffer>, number, number] | T,
      Awaited<T>,
      Awaited<T> | string
    > {
      try {
        const lock = yield [this.lock_view, 1, 0];
        if (lock === "timed-out") {
          throw new Error("timed-out");
        }

        const out = (yield callback()) as Awaited<T>;

        const old_call_lock = Atomics.exchange(this.lock_view, 1, 0);
        if (old_call_lock !== 1) {
          throw new Error("Lock is already set");
        }
        const num = Atomics.notify(this.lock_view, 1, 1);
        if (num !== 1) {
          if (num === 0) {
            console.warn("notify failed, waiter is late");
            return out;
          }
          throw new Error(`notify failed: ${num}`);
        }
        return out;
      } catch (e) {
        Atomics.store(this.lock_view, 1, 0);
        Atomics.notify(this.lock_view, 1, 1);
        throw e;
      }
    }.call(this, callback);
  }
}
