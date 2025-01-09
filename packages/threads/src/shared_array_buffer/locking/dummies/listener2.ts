import type { WaitOnGen } from "./waiter_base";
import { DummyListenerBase } from "./listener_base";

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
    return function* (this: DummyListener2): WaitOnGen<T> {
      yield this.relock(this.lock_view, 0, UNLOCKED, LISTENER_LOCKED);
      yield this.relock(this.lock_view, 0, CALL_READY, LISTENER_WORKING);

      const value = Atomics.load(this.lock_view, 1);
      const call_id = Atomics.load(this.lock_view, 2);

      try {
        return (yield callback(value)) as Awaited<T>;
      } finally {
        console.log(
          `listener ${this.fd},${this.id} done with call_id ${call_id}`,
        );
        yield this.relock(this.lock_view, 0, LISTENER_WORKING, CALL_FINISHED, true);
      }
    }.call(this);
  }
}
