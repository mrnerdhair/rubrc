import { ListenerState } from "./listener";
import { LockingBase } from "./locking_base";
import { ViewSet } from "./view_set";
import type { WaitOnGen } from "./waiter_base";

export class Caller extends LockingBase {
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

  private call_and_wait_inner<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (data: ViewSet<SharedArrayBuffer>, chain: U) => T,
  ) {
    return function* (this: Caller): WaitOnGen<T, U> {
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.LISTENER_LOCKED,
        ListenerState.CALLER_WORKING,
      );

      this.data.u64.fill(0n);
      const start_result = (yield this.recursable(
        start_callback?.(this.data),
      )) as Awaited<U>;

      yield this.relock(
        this.lock_view,
        0,
        ListenerState.CALLER_WORKING,
        ListenerState.CALL_READY,
        true,
      );

      const out = (yield this.recursable(
        finished_callback?.(this.data, start_result),
      )) as Awaited<T>;
      yield this.relock(
        this.lock_view,
        0,
        ListenerState.CALL_FINISHED,
        ListenerState.UNLOCKED,
      );

      return out;
    }.call(this);
  }

  async call_and_wait<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (data: ViewSet<SharedArrayBuffer>, chain: U) => T,
  ): Promise<T> {
    return await this.wait_on_async(
      this.call_and_wait_inner(start_callback, finished_callback),
    );
  }

  call_and_wait_blocking<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (data: ViewSet<SharedArrayBuffer>, chain: U) => T,
  ): T {
    return this.wait_on(
      this.call_and_wait_inner(start_callback, finished_callback),
    );
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
