import { ListenerBase } from "./listener_base";
import type { WaitOnGen } from "./waiter_base";

export const UNLOCKED = 0;
export const LISTENER_LOCKED = 1;
export const CALLER_WORKING = 2;
export const CALL_READY = 3;
export const LISTENER_WORKING = 5;
export const CALL_FINISHED = 6;

export class DummyListener2 extends ListenerBase {
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
      throw new Error(`listener reset did something: ${old}`);
    }
  }

  protected listen_inner<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ) {
    return function* (this: DummyListener2): WaitOnGen<T> {
      yield this.relock(this.lock_view, 0, UNLOCKED, LISTENER_LOCKED);
      yield this.relock(this.lock_view, 0, CALL_READY, LISTENER_WORKING);

      try {
        return (yield callback(this.data_view)) as Awaited<T>;
      } finally {
        yield this.relock(
          this.lock_view,
          0,
          LISTENER_WORKING,
          CALL_FINISHED,
          true,
        );
      }
    }.call(this);
  }
}
