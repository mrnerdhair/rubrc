import { CallerBase, ViewSet } from "./caller_base";
import { ListenerState } from "./listener";
import type { WaitOnGen } from "./waiter_base";

export class Caller extends CallerBase {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;
  private readonly data: ViewSet<SharedArrayBuffer>;

  constructor(target: Target) {
    super();
    this.lock_view = new Int32Array(target, 0, 1);
    const offset =
      Math.ceil(
        (1 * Int32Array.BYTES_PER_ELEMENT) / BigInt64Array.BYTES_PER_ELEMENT,
      ) * BigInt64Array.BYTES_PER_ELEMENT;
    this.data = new ViewSet(target, offset, target.byteLength - offset);
  }

  reset() {
    const old = Atomics.exchange(this.lock_view, 0, ListenerState.UNLOCKED);
    if (old !== ListenerState.UNLOCKED) {
      throw new Error(`caller reset did something: ${old}`);
    }
  }

  protected call_and_wait_inner<T>(
    callback?: (data: ViewSet<SharedArrayBuffer>) => T,
  ) {
    return function* (this: Caller): WaitOnGen<T> {
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.LISTENER_LOCKED,
        ListenerState.CALLER_WORKING,
      );

      this.data.u64.fill(0n);
      const out = (yield callback?.(this.data)) as Awaited<T>;

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
  const headerLen = 1 * Int32Array.BYTES_PER_ELEMENT;
  const headerLenPadded =
    Math.ceil(headerLen / BigInt64Array.BYTES_PER_ELEMENT) *
    BigInt64Array.BYTES_PER_ELEMENT;
  const sizePadded =
    Math.ceil(size / BigInt64Array.BYTES_PER_ELEMENT) *
    BigInt64Array.BYTES_PER_ELEMENT;
  return new SharedArrayBuffer(headerLenPadded + sizePadded) as Target;
}
