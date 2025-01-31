import { ListenerState } from "./listener";
import { LockingBase } from "./locking_base";
import { ViewSet } from "./view_set";
import {
  type WaitOnGen,
  type WaitOnGenBase,
  type Waited,
  wait_on_gen,
} from "./waiter";

export class Caller extends LockingBase {
  private readonly data: ViewSet<SharedArrayBuffer>;

  constructor(target: Target) {
    const lock_view = new Int32Array(target, 0, 1);
    super(lock_view);
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
      chain: Waited<U>,
    ) => T,
  ): WaitOnGen<T> {
    return wait_on_gen(
      function* (this: Caller): WaitOnGenBase<T> {
        yield this.relock(
          ListenerState.LISTENER_LOCKED,
          ListenerState.CALLER_WORKING,
        );

        this.data.u64.fill(0n);
        const start_result = (yield start_callback?.(this.data)) as Waited<U>;

        yield this.relock(
          ListenerState.CALLER_WORKING,
          ListenerState.CALL_READY,
          { immediate: true },
        );

        if (!finished_callback) {
          yield this.relock(
            ListenerState.LISTENER_FINISHED,
            ListenerState.UNLOCKED,
          );
          // Overloads require that a missing finished_callback implies T is undefined.
          return undefined as T;
        }

        yield this.relock(
          ListenerState.LISTENER_FINISHED,
          ListenerState.CALLER_FINISHING,
        );

        try {
          return (yield finished_callback?.(this.data, start_result)) as T;
        } finally {
          yield this.relock(
            ListenerState.CALLER_FINISHING,
            ListenerState.UNLOCKED,
            { immediate: true },
          );
        }
      }.call(this),
    );
  }

  async call_and_wait(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => void,
  ): Promise<void>;
  async call_and_wait<T, U>(
    start_callback: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Waited<U>,
    ) => T,
  ): Promise<T>;
  async call_and_wait<T>(
    start_callback: undefined,
    finished_callback: (data: ViewSet<SharedArrayBuffer>) => T,
  ): Promise<T>;
  async call_and_wait<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Waited<U>,
    ) => T,
  ): Promise<Awaited<T>> {
    return await this.call_and_wait_inner(
      start_callback,
      finished_callback,
    ).waitAsync();
  }

  call_and_wait_blocking(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => void,
  ): void;
  call_and_wait_blocking<T, U>(
    start_callback: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Waited<U>,
    ) => T,
  ): T;
  call_and_wait_blocking<T>(
    start_callback: undefined,
    finished_callback: (data: ViewSet<SharedArrayBuffer>) => T,
  ): T;
  call_and_wait_blocking<T, U>(
    start_callback?: (data: ViewSet<SharedArrayBuffer>) => U,
    finished_callback?: (
      data: ViewSet<SharedArrayBuffer>,
      chain: Waited<U>,
    ) => T,
  ): T {
    return this.call_and_wait_inner(start_callback, finished_callback).wait();
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
