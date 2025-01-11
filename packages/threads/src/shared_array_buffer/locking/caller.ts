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

  get target() {
    return this.lock_view.buffer as Target;
  }

  reset() {
    const old = Atomics.exchange(this.lock_view, 0, ListenerState.UNLOCKED);
    if (old !== ListenerState.UNLOCKED) {
      throw new Error(`caller reset did something: ${old}`);
    }
  }

  private call_and_wait_inner<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Awaited<U>,
    ) => T,
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

      if (!finished_callback) {
        yield this.relock(
          this.lock_view,
          0,
          ListenerState.LISTENER_FINISHED,
          ListenerState.UNLOCKED,
        );
        return undefined as Awaited<T>;
      }

      yield this.relock(
        this.lock_view,
        0,
        ListenerState.LISTENER_FINISHED,
        ListenerState.CALLER_FINISHING,
      );

      try {
        return (yield this.recursable(
          finished_callback?.(this.data, start_result),
        )) as Awaited<T>;
      } finally {
        yield this.relock(
          this.lock_view,
          0,
          ListenerState.CALLER_FINISHING,
          ListenerState.UNLOCKED,
        );
      }
    }.call(this);
  }

  async call_and_wait(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => void,
  ): Promise<void>;
  async call_and_wait<T, U>(
    start_callback: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Awaited<U>,
    ) => T,
  ): Promise<Awaited<T>>;
  async call_and_wait<T>(
    start_callback: undefined,
    finished_callback: (data: ViewSet<SharedArrayBuffer>) => T,
  ): Promise<Awaited<T>>;
  async call_and_wait<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Awaited<U>,
    ) => T,
  ): Promise<Awaited<T>> {
    return await this.wait_on_async(
      this.call_and_wait_inner(start_callback, finished_callback),
    );
  }

  call_and_wait_blocking(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => void,
  ): void;
  call_and_wait_blocking<T, U>(
    start_callback: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback: (data: ViewSet<SharedArrayBuffer>, chain: U) => T,
  ): T;
  call_and_wait_blocking<T>(
    start_callback: undefined,
    finished_callback: (data: ViewSet<SharedArrayBuffer>) => T,
  ): T;
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
