export class DummyListener4 {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;
  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    this.notify_view = notify_view;
  }
  reset() {
    Atomics.store(this.notify_view, 0, 0);
  }
  async listen(callback: (code?: number) => Promise<number>): Promise<number> {
    const lock = await Atomics.waitAsync(this.notify_view, 0, 0).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
    if (lock === "not-equal") {
      throw new Error("not-equal");
    }

    const code = Atomics.load(this.notify_view, 0);

    let out: number;
    try {
      out = await callback(code);
    } catch (error) {
      if (!(error instanceof Error && error.message === "unknown code")) {
        const old = Atomics.compareExchange(this.notify_view, 0, 1, 0);

        if (old !== 1) {
          console.error("what happened?");
        }
      }

      throw error;
    }

    const old = Atomics.compareExchange(this.notify_view, 0, 2, 0);
    if (old !== 2) {
      throw new Error("what happened?");
    }

    return out;
  }
  listen_blocking(callback: (code?: number) => number): number {
    const value = Atomics.wait(this.notify_view, 0, 0);
    if (value === "timed-out") {
      throw new Error("timed-out");
    }
    if (value === "not-equal") {
      throw new Error("not-equal");
    }

    const code = Atomics.load(this.notify_view, 0);

    let out: number;
    try {
      out = callback(code);
    } catch (error) {
      if (!(error instanceof Error && error.message === "unknown code")) {
        const old = Atomics.compareExchange(this.notify_view, 0, 1, 0);

        if (old !== 1) {
          console.error("what happened?");
        }
      }

      throw error;
    }

    const old = Atomics.compareExchange(this.notify_view, 0, 2, 0);
    if (old !== 2) {
      throw new Error("what happened?");
    }

    return out;
  }
}
