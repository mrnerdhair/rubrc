import { new_target as new_caller_target } from "./caller";
import { LockingBase } from "./locking_base";
import { ViewSet } from "./view_set";
import type { WaitOnGen } from "./waiter_base";

export enum ListenerState {
  UNLOCKED = 0,
  LISTENER_LOCKED = 1,
  CALLER_WORKING = 2,
  CALL_READY = 3,
  LISTENER_WORKING = 5,
  CALL_FINISHED = 6,
}

export class Listener extends LockingBase {
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
      throw new Error(`listener reset did something: ${old}`);
    }
  }

  protected listen_inner<T>(callback: (data: ViewSet<SharedArrayBuffer>) => T) {
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
        return (yield callback(this.data)) as Awaited<T>;
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

  async listen<T>(
    callback: (data: ViewSet<SharedArrayBuffer>) => T,
  ): Promise<T> {
    return await this.wait_on_async(this.listen_inner(callback));
  }

  listen_blocking<T>(callback: (data: ViewSet<SharedArrayBuffer>) => T): T {
    return this.wait_on(this.listen_inner(callback));
  }
}

declare const targetBrand: unique symbol;
export type Target = SharedArrayBuffer & { [targetBrand]: never };
export function new_target(size = 0): Target {
  return new_caller_target(
    size,
  ) satisfies SharedArrayBuffer as unknown as Target;
}
