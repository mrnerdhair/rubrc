import { new_target as new_caller_target } from "./caller";
import { LockingBase } from "./locking_base";
import { ViewSet } from "./view_set";
import { type WaitOnGenBase, wait_on_gen } from "./waiter";

export enum ListenerState {
  UNLOCKED = 0,
  LISTENER_LOCKED = 1,
  CALLER_WORKING = 2,
  CALL_READY = 3,
  LISTENER_WORKING = 4,
  LISTENER_FINISHED = 5,
  CALLER_FINISHING = 6,
}

export class Listener extends LockingBase {
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
      throw new Error(`listener reset did something: ${old}`);
    }
  }

  protected listen_inner<T>(callback: (data: ViewSet<SharedArrayBuffer>) => T) {
    return wait_on_gen(
      function* (this: Listener): WaitOnGenBase<T> {
        yield this.relock(
          ListenerState.UNLOCKED,
          ListenerState.LISTENER_LOCKED,
        );
        yield this.relock(
          ListenerState.CALL_READY,
          ListenerState.LISTENER_WORKING,
        );

        try {
          return (yield callback(this.data)) as T;
        } finally {
          yield this.relock(
            ListenerState.LISTENER_WORKING,
            ListenerState.LISTENER_FINISHED,
            { immediate: true },
          );
        }
      }.call(this),
    );
  }

  async listen<T>(
    callback: (data: ViewSet<SharedArrayBuffer>) => T,
  ): Promise<T> {
    return await this.listen_inner(callback).waitAsync();
  }

  listen_blocking<T>(callback: (data: ViewSet<SharedArrayBuffer>) => T): T {
    return this.listen_inner(callback).wait();
  }
}

declare const targetBrand: unique symbol;
export type Target = SharedArrayBuffer & { [targetBrand]: never };
export function new_target(size = 0): Target {
  return new_caller_target(
    size,
  ) satisfies SharedArrayBuffer as unknown as Target;
}
