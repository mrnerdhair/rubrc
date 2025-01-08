import { NoListener } from "../caller";

export class DummyCaller4 {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;

  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    this.notify_view = notify_view;
  }

  reset() {
    Atomics.store(this.notify_view, 0, 0);
  }

  call(code: number): void {
    const old = Atomics.compareExchange(this.notify_view, 0, 0, code);

    if (old !== 0) {
      throw new Error("what happened?");
    }

    const num = Atomics.notify(this.notify_view, 0);

    if (num === 0) {
      Atomics.store(this.notify_view, 0, 0);
      throw new NoListener();
    }
  }
}
