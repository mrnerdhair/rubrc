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
    ): Generator<
      [Int32Array<SharedArrayBuffer>, number, number] | T,
      Awaited<T>,
      Awaited<T> | string
    > {
      try {
        const lock = yield [this.lock_view, 0, 0];
        if (lock === "timed-out") {
          throw new Error("timed-out");
        }

        const func_lock = Atomics.load(this.lock_view, 0);
        if (func_lock !== 1) {
          throw new Error(`func_lock is already set: ${func_lock}`);
        }

        const out = (yield callback()) as Awaited<T>;

        const old_call_lock = Atomics.compareExchange(this.lock_view, 0, 1, 0);
        if (old_call_lock !== 1) {
          throw new Error(
            `Call is already set: ${old_call_lock}\nfunc: \${func_name}\nfd: \${fd_n}`,
          );
        }

        const n = Atomics.notify(this.lock_view, 0, 1);
        if (n !== 1) {
          if (n === 0) {
            console.warn("notify number is 0. ref is late?");
          } else {
            throw new Error(`notify number is not 1: ${n}`);
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
