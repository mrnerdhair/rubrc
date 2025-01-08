export class DummyListener3 {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;
  constructor(lock_view: Int32Array<SharedArrayBuffer>) {
    this.lock_view = lock_view;
  }
  reset() {
    Atomics.store(this.lock_view, 1, 0);
  }
  async listen(callback: () => Promise<void>): Promise<void> {
    const lock = await Atomics.waitAsync(this.lock_view, 1, 0).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }

    const locked_value = Atomics.load(this.lock_view, 1);
    if (locked_value !== 1) {
      throw new Error("locked");
    }

    await callback();

    const old_call_lock = Atomics.exchange(this.lock_view, 1, 0);
    if (old_call_lock !== 1) {
      throw new Error("Lock is already set");
    }
    const num = Atomics.notify(this.lock_view, 1, 1);
    if (num !== 1) {
      if (num === 0) {
        console.warn("notify failed, waiter is late");
        return;
      }
      throw new Error(`notify failed: ${num}`);
    }
  }
}
