import { DummyListenerBase, type Wait } from "./listenerbase";

export const UNLOCKED = 0;
export const LISTENER_LOCKED = 1;
export const CALLER_WORKING = 2;
export const CALL_READY = 3;
export const LISTENER_WORKING = 5;
export const CALL_FINISHED = 6;

export class DummyListener2 extends DummyListenerBase {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;
  readonly id: number;
  readonly fd: number;

  constructor(lock_view: Int32Array<SharedArrayBuffer>, fd: number) {
    super();
    this.lock_view = new Int32Array(lock_view.buffer, 0, 4);
    this.id = Atomics.add(this.lock_view, 3, 1);
    this.fd = fd;
    console.log(`listener ${this.fd},${this.id} constructed`);
  }

  reset() {
    const old = Atomics.exchange(this.lock_view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(
        `listener ${this.fd},${this.id} reset did something: ${old}`,
      );
    }
    console.log(`reset listener ${this.fd},${this.id}`);
  }

  protected listen_inner<T>(callback: (code?: number) => T) {
    return function* (
      this: DummyListener2,
      callback: (code?: number) => T,
    ): Generator<T | Wait, Awaited<T>, Awaited<T> | string> {
      console.log(
        `listener ${this.fd},${this.id} taking listener lock`,
      );
      while (true) {
        const old = Atomics.compareExchange(
          this.lock_view,
          0,
          UNLOCKED,
          LISTENER_LOCKED,
        );
        if (old === UNLOCKED) break;
        console.log(
          `listener ${this.fd},${this.id} not unlocked (${old}), waiting`,
        );
        yield this.wait(this.lock_view, 0, old);
      }
      console.log(
        `listener ${this.fd},${this.id} took listener lock`,
      );
      Atomics.notify(this.lock_view, 0, 1);

      while (true) {
        const current = Atomics.load(this.lock_view, 0);
        if (current === CALL_READY) break;
        yield this.wait(this.lock_view, 0, current);
      }
      if (
        Atomics.compareExchange(
          this.lock_view,
          0,
          CALL_READY,
          LISTENER_WORKING,
        ) !== CALL_READY
      ) {
        throw new Error(`listener ${this.fd},${this.id} expected CALL_READY`);
      }

      const value = Atomics.load(this.lock_view, 1);
      const call_id = Atomics.load(this.lock_view, 2);

      try {
        return (yield callback(value)) as Awaited<T>;
      } finally {
        if (
          Atomics.compareExchange(
            this.lock_view,
            0,
            LISTENER_WORKING,
            CALL_FINISHED,
          ) !== LISTENER_WORKING
        ) {
          // biome-ignore lint/correctness/noUnsafeFinally: a lock failure is a higher-priority error
          throw new Error(
            `listener ${this.fd},${this.id} failed to release listener lock for call ${call_id}`,
          );
        }
        console.log(
          `listener ${this.fd},${this.id} done with call_id ${call_id}`,
        );
        Atomics.notify(this.lock_view, 0, 1);
      }
    }.call(this, callback);
  }
}
