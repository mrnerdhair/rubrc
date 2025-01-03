export class Listener {
  protected readonly view: Int32Array;
  protected readonly locked_value: number | undefined;
  protected readonly unlocked_value: number;

  constructor(
    buf: SharedArrayBuffer,
    byteOffset: number,
    locked_value: number | null | undefined = 1,
    unlocked_value = 0,
  ) {
    this.view = new Int32Array(buf, byteOffset, 1);
    this.locked_value = locked_value ?? undefined;
    this.unlocked_value = unlocked_value;
  }

  async listen<T>(
    callback: (value?: number) => T | PromiseLike<T>,
  ): Promise<T> {
    const lock = await Atomics.waitAsync(this.view, 0, this.unlocked_value)
      .value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
    if (this.locked_value === undefined && lock === "not-equal") {
      throw new Error("not-equal");
    }

    const value = Atomics.load(this.view, 0);
    if (this.locked_value !== undefined && value !== this.locked_value) {
      throw new Error(`lock is already set: ${value}`);
    }

    try {
      return await callback(value);
    } finally {
      const new_value = Atomics.compareExchange(
        this.view,
        0,
        value,
        this.unlocked_value,
      );
      if (new_value !== value) {
        console.error(`lock is already set: ${new_value}`);
      }

      const n = Atomics.notify(this.view, 0, 1);
      if (n === 0) {
        console.warn("notify number is 0. ref is late?");
      }
    }
  }

  listen_blocking<T>(callback: (value?: number) => T): T {
    const lock = Atomics.wait(this.view, 0, this.unlocked_value);
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
    if (this.locked_value === undefined && lock === "not-equal") {
      throw new Error("not-equal");
    }

    const value = Atomics.load(this.view, 0);
    if (this.locked_value !== undefined && value !== this.locked_value) {
      throw new Error(`lock is already set: ${value}`);
    }

    try {
      return callback(value);
    } finally {
      const new_value = Atomics.compareExchange(
        this.view,
        0,
        value,
        this.unlocked_value,
      );
      if (new_value !== value) {
        console.error(`lock is already set: ${new_value}`);
      }

      const n = Atomics.notify(this.view, 0, 1);
      if (n === 0) {
        console.warn("notify number is 0. ref is late?");
      }
    }
  }
}
