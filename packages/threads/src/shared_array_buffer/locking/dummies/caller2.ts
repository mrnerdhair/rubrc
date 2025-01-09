// import { NoListener } from "../caller";

export const UNLOCKED = 0;
export const LISTENER_LOCKED = 1;
export const CALLER_WORKING = 2;
export const CALL_READY = 3;
export const LISTENER_WORKING = 5;
export const CALL_FINISHED = 6;

export class DummyCaller2 {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;

  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    this.notify_view = new Int32Array(notify_view.buffer, 0, 3);
  }

  reset() {
    Atomics.store(this.notify_view, 0, 0);
  }

  call_and_wait_blocking(code: number): void {
    const call_id = Math.floor(Math.random() * (2 ** 31 - 1));

    while (true) {
      const old = Atomics.compareExchange(
        this.notify_view,
        0,
        LISTENER_LOCKED,
        CALLER_WORKING,
      );
      if (old === LISTENER_LOCKED) break;
      console.warn(`caller waiting for listener lock (${call_id})`);
      Atomics.wait(this.notify_view, 0, old);
    }

    Atomics.store(this.notify_view, 1, code);
    Atomics.store(this.notify_view, 2, call_id);

    console.log(`caller locked, sending call_id ${call_id}`);

    if (
      Atomics.compareExchange(
        this.notify_view,
        0,
        CALLER_WORKING,
        CALL_READY,
      ) !== CALLER_WORKING
    ) {
      throw new Error(`caller couldn't set CALL_READY (${call_id})`);
    }

    Atomics.notify(this.notify_view, 0, 1);

    while (true) {
      const old = Atomics.compareExchange(
        this.notify_view,
        0,
        CALL_FINISHED,
        UNLOCKED,
      );
      if (old === CALL_FINISHED) break;
      console.warn(
        `caller waiting for CALL_FINISHED to unlock lock (${call_id})`,
      );
      Atomics.wait(this.notify_view, 0, old);
    }
    console.log(`caller done with call_id ${call_id}`);
    Atomics.notify(this.notify_view, 0, 1);
  }
}
