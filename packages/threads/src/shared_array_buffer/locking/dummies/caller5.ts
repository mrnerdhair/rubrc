import { NoListener } from "../caller";

export class DummyCaller5 {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;
  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    this.notify_view = notify_view;
  }

  call(_code: number, callback?: () => void): void {
    // notify done = code 2
    const old = Atomics.compareExchange(this.notify_view, 0, 0, 2);

    if (old !== 0) {
      throw new Error("what happened?");
    }

    callback?.();

    const num = Atomics.notify(this.notify_view, 0);

    if (num === 0) {
      Atomics.store(this.notify_view, 0, 0);
      throw new NoListener();
    }
  }
}
