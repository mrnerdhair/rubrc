import { ListenerState } from "./listener";
import { LockingBase } from "./locking_base";
import { ViewSet } from "./view_set";
import {
  type WaitOnGen,
  type WaitOnGenBase,
  WaitTarget,
  type Waited,
  wait_on_gen,
} from "./waiter";

export class Caller extends LockingBase {
  readonly target: Target;
  private readonly data: ViewSet<SharedArrayBuffer>;

  protected constructor(
    wait_target: WaitTarget,
    target: Target,
    data: ViewSet<SharedArrayBuffer>,
  ) {
    super(wait_target);
    this.target = target;
    this.data = data;
  }

  static async init(target: Target): Promise<Caller> {
    const offset =
      Math.ceil(WaitTarget.BYTE_LENGTH / BigInt64Array.BYTES_PER_ELEMENT) *
      BigInt64Array.BYTES_PER_ELEMENT;
    const data = new ViewSet(
      target.buffer,
      target.byteOffset + offset,
      target.byteLength - offset,
    );
    return new Caller(await WaitTarget.init(target, 0), target, data);
  }

  reset() {
    const old = this.wait_target.exchange(ListenerState.UNLOCKED);
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
export type Target = ArrayBufferView<SharedArrayBuffer> & {
  [targetBrand]: never;
};
export function new_target(size = 0): Target {
  const headerLenPadded =
    Math.ceil(WaitTarget.BYTE_LENGTH / BigInt64Array.BYTES_PER_ELEMENT) *
    BigInt64Array.BYTES_PER_ELEMENT;
  const sizePadded =
    Math.ceil(size / BigInt64Array.BYTES_PER_ELEMENT) *
    BigInt64Array.BYTES_PER_ELEMENT;
  return new Int32Array(
    new SharedArrayBuffer(headerLenPadded + sizePadded),
  ) as ArrayBufferView<SharedArrayBuffer> as Target;
}
