import { DummyCallerBase } from "./caller_base";
import type { WaitOnGen } from "./waiter_base";

export const UNLOCKED = 0;
export const LISTENER_LOCKED = 1;
export const CALLER_WORKING = 2;
export const CALL_READY = 3;
export const LISTENER_WORKING = 5;
export const CALL_FINISHED = 6;

export class DummyCaller2 extends DummyCallerBase {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;

  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    super();
    this.notify_view = new Int32Array(notify_view.buffer, 0, 3);
  }

  reset() {
    const old = Atomics.exchange(this.notify_view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(
        `caller reset did something: ${old}`,
      );
    }
  }

  protected call_and_wait_inner(code: number) {
    return function* (this: DummyCaller2): WaitOnGen<void> {
      const call_id = Math.floor(Math.random() * (2 ** 31 - 1));

      yield this.relock(this.notify_view, 0, LISTENER_LOCKED, CALLER_WORKING);

      Atomics.store(this.notify_view, 1, code);
      Atomics.store(this.notify_view, 2, call_id);

      console.log(`caller locked, sending call_id ${call_id}`);

      yield this.relock(this.notify_view, 0, CALLER_WORKING, CALL_READY, true);
      yield this.relock(this.notify_view, 0, CALL_FINISHED, UNLOCKED);

      console.log(`caller done with call_id ${call_id}`);
    }.call(this);
  }
}
