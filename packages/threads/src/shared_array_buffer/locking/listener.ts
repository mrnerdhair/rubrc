import { ListenerBase } from "./listener_base";
import type { WaitOnGen } from "./waiter_base";

export enum ListenerState {
  UNLOCKED = 0,
  LISTENER_LOCKED = 1,
  CALLER_WORKING = 2,
  CALL_READY = 3,
  LISTENER_WORKING = 5,
  CALL_FINISHED = 6,
}

export class Listener extends ListenerBase {
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
      throw new Error(`listener reset did something: ${old}`);
    }
  }

  protected listen_inner<T>(
    callback: (view: DataView<SharedArrayBuffer>) => T,
  ) {
    return function* (this: Listener): WaitOnGen<T> {
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.UNLOCKED,
        ListenerState.LISTENER_LOCKED,
      );
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.CALL_READY,
        ListenerState.LISTENER_WORKING,
      );

      try {
        return (yield callback(this.data_view)) as Awaited<T>;
      } finally {
        yield this.relock(
          this.lock_view,
          0,
          ListenerState.LISTENER_WORKING,
          ListenerState.CALL_FINISHED,
          true,
        );
      }
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
