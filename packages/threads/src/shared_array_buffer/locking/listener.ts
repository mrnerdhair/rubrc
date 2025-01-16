import { Abortable } from "rubrc-util";
import { LockingBase } from "./locking_base";
import { ViewSet } from "./view_set";
import { type WaitOnGenBase, WaitTarget, wait_on_gen } from "./waiter";

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

  protected constructor(
    wait_target: WaitTarget,
    target: Target,
    data: ViewSet<SharedArrayBuffer>,
  ) {
    super(wait_target);
    this.target = target;
    this.data = data;
  }

  static async init(target: Target): Promise<Listener> {
    const offset =
      Math.ceil(WaitTarget.BYTE_LENGTH / BigInt64Array.BYTES_PER_ELEMENT) *
      BigInt64Array.BYTES_PER_ELEMENT;
    const data = new ViewSet(
      target.buffer,
      target.byteOffset + offset,
      target.byteLength - offset,
    );
    return new Listener(await WaitTarget.init(target, 0), target, data);
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
export type Target = ArrayBufferView<SharedArrayBuffer> & {
  [targetBrand]: never;
};
