import { NoListener } from "../caller";
import { CallerBase } from "./caller_base";
import type { WaitOnGen } from "./waiter_base";

export class DummyCaller1 extends CallerBase {
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
    Atomics.store(this.lock_view, 0, 0);
  }

  protected call_and_wait_inner<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ) {
    return function* (this: DummyCaller1): WaitOnGen<T> {
      const out = (yield callback(this.data_view)) as Awaited<T>;
      const old = Atomics.compareExchange(this.lock_view, 0, 0, 1);
      if (old !== 0) {
        throw new Error("what happened?");
      }

      const n = Atomics.notify(this.lock_view, 0, 1);
      if (n !== 1) {
        if (n !== 0) {
          throw new Error(`invoke_fd_func notify failed: ${n}`);
        }
        console.warn("invoke_func_loop is late");
        throw new NoListener();
      }

      const lock = yield this.wait(this.lock_view, 0, 1);
      if (lock === "timed-out") {
        throw new Error("timed-out lock");
      }
      return out;
    }.call(this);
  }
}
