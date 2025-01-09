import { CallerBase } from "./caller_base";
import type { WaitOnGen } from "./waiter_base";

export const UNLOCKED = 0;
export const LISTENER_LOCKED = 1;
export const CALLER_WORKING = 2;
export const CALL_READY = 3;
export const LISTENER_WORKING = 5;
export const CALL_FINISHED = 6;

export class DummyCaller2 extends CallerBase {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;
  private readonly data_view: DataView<SharedArrayBuffer>;

  constructor(view: Int32Array<SharedArrayBuffer>) {
    super();
    this.lock_view = new Int32Array(view.buffer, view.byteOffset, 1);
    this.data_view = new DataView(
      view.buffer,
      view.byteOffset + 1 * Int32Array.BYTES_PER_ELEMENT,
    );
  }

  reset() {
    const old = Atomics.exchange(this.lock_view, 0, UNLOCKED);
    if (old !== UNLOCKED) {
      throw new Error(`caller reset did something: ${old}`);
    }
  }

  protected call_and_wait_inner<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ) {
    return function* (this: DummyCaller2): WaitOnGen<T> {
      yield this.relock(this.lock_view, 0, LISTENER_LOCKED, CALLER_WORKING);

      const out = (yield callback(this.data_view)) as Awaited<T>;

      yield this.relock(this.lock_view, 0, CALLER_WORKING, CALL_READY, true);
      yield this.relock(this.lock_view, 0, CALL_FINISHED, UNLOCKED);

      return out;
    }.call(this);
  }
}
