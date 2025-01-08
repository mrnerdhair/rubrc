import { DummyListenerBase } from "./listenerbase";

export class DummyListener4 extends DummyListenerBase {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;

  constructor(notify_view: Int32Array<SharedArrayBuffer>) {
    super();
    this.notify_view = notify_view;
  }

  reset() {
    Atomics.store(this.notify_view, 0, 0);
  }

  protected listen_inner<T>(callback: (code?: number) => T) {
    return function* (
      this: DummyListener4,
      callback: (code?: number) => T,
    ): Generator<
      [Int32Array<SharedArrayBuffer>, number, number] | T,
      Awaited<T>,
      Awaited<T> | string
    > {
      const lock = yield [this.notify_view, 0, 0] as const;
      if (lock === "timed-out") {
        throw new Error("timed-out");
      }
      if (lock === "not-equal") {
        throw new Error("not-equal");
      }

      const code = Atomics.load(this.notify_view, 0);

      let out: Awaited<T>;
      try {
        out = (yield callback(code)) as Awaited<T>;
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
    }.call(this, callback);
  }
}
