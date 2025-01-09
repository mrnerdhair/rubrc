import { CallerBase } from "./caller_base";
import { ListenerState } from "./listener";
import type { WaitOnGen } from "./waiter_base";

export class Caller extends CallerBase {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;
  private readonly data_view: DataView<SharedArrayBuffer>;

  constructor(target: Target) {
    super();
    this.lock_view = new Int32Array(target, 0, 1);
    this.data_view = new DataView(
      target,
      1 * Int32Array.BYTES_PER_ELEMENT,
      target.byteLength - 1 * Int32Array.BYTES_PER_ELEMENT,
    );
  }

  reset() {
    const old = Atomics.exchange(this.lock_view, 0, ListenerState.UNLOCKED);
    if (old !== ListenerState.UNLOCKED) {
      throw new Error(`caller reset did something: ${old}`);
    }
  }

  protected call_and_wait_inner<T>(
    callback?: (view: DataView<SharedArrayBuffer>) => T,
  ) {
    return function* (this: Caller): WaitOnGen<T> {
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.LISTENER_LOCKED,
        ListenerState.CALLER_WORKING,
      );

      const out = (yield callback?.(this.data_view)) as Awaited<T>;

      yield this.relock(
        this.lock_view,
        0,
        ListenerState.CALLER_WORKING,
        ListenerState.CALL_READY,
        true,
      );
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.CALL_FINISHED,
        ListenerState.UNLOCKED,
      );

      return out;
    }.call(this);
  }
}

declare const targetBrand: unique symbol;
export type Target = SharedArrayBuffer & { [targetBrand]: never };
export function new_target(size = 0): Target {
  return new SharedArrayBuffer(
    size + 1 * Int32Array.BYTES_PER_ELEMENT,
  ) as Target;
}
