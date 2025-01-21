import { Abortable } from "rubrc-util";
import type { Target as CallerTarget } from "./caller";
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
  readonly target: Target;
  private readonly data: ViewSet<SharedArrayBuffer>;

  protected constructor(target: Target) {
    super(target.wait_target);
    this.target = target;
    this.data = new ViewSet(
      target.data.buffer,
      target.data.byteOffset,
      target.data.byteLength,
    );
  }

  static async init(target: Target): Promise<Listener> {
    return new Listener(target);
  }

  reset() {
    const old = this.wait_target.exchange(ListenerState.UNLOCKED);
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
  ): Promise<Awaited<T>> {
    return await this.listen_inner(callback).waitAsync();
  }

  listen_blocking<T>(callback: (data: ViewSet<SharedArrayBuffer>) => T): T {
    return this.listen_inner(callback).wait();
  }

  listen_background(
    callback: (data: ViewSet<SharedArrayBuffer>) => void | Promise<void>,
  ): Abortable {
    return new Abortable(async (abortable: Abortable) => {
      while (!abortable.signal.aborted) {
        await this.listen(callback);
      }
    });
  }
}

declare const targetBrand: unique symbol;
export type Target = CallerTarget & {
  [targetBrand]: never;
};
export async function new_target(caller_target: CallerTarget): Promise<Target> {
  return caller_target as Target;
}
