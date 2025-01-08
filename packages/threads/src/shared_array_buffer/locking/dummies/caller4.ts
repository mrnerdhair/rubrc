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

    const n = Atomics.notify(this.notify_view, 0, 1);
    if (n !== 1) {
      if (n !== 0) {
        throw new Error(`invoke_fd_func notify failed: ${n}`);
      }
      throw new NoListener();
    }
  }
}
