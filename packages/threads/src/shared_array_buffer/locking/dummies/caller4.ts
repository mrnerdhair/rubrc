export class DummyCaller4 {
  private readonly lock: SharedArrayBuffer;
  constructor(lock: SharedArrayBuffer) {
    this.lock = lock;
  }
  call_and_wait_blocking(): void {
    const view = new Int32Array(this.lock);
    const old = Atomics.exchange(view, 1, 1);
    Atomics.notify(view, 1, 1);
    if (old !== 0) {
      throw new Error("what happened?");
    }
    const lock = Atomics.wait(view, 1, 1);
    if (lock === "timed-out") {
      throw new Error("timed-out lock");
    }
  }

  async call_and_wait(): Promise<void> {
    const view = new Int32Array(this.lock);
    const old = Atomics.exchange(view, 1, 1);
    Atomics.notify(view, 1, 1);
    if (old !== 0) {
      throw new Error("what happened?");
    }
    const lock = await Atomics.waitAsync(view, 1, 1).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }
}
