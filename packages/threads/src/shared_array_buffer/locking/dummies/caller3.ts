export class DummyCaller3 {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;

  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    this.notify_view = notify_view;
  }

  call_and_wait_blocking(): void {
    const old = Atomics.exchange(this.notify_view, 0, 1);
    Atomics.notify(this.notify_view, 0, 1);
    if (old !== 0) {
      throw new Error("what happened?");
    }
    const lock = Atomics.wait(this.notify_view, 0, 1);
    if (lock === "timed-out") {
      throw new Error("timed-out lock");
    }
  }
}