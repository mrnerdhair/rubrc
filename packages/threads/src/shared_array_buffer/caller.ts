export class Caller {
  protected readonly view: Int32Array;
  protected readonly locked_value: number;
  protected readonly unlocked_value: number;

  constructor(
    buf: SharedArrayBuffer,
    byteOffset: number,
    locked_value = 1,
    unlocked_value = 0,
  ) {
    this.view = new Int32Array(buf, byteOffset, 1);
    this.locked_value = locked_value;
    this.unlocked_value = unlocked_value;
  }

  protected invoke(): void {
    const old = Atomics.exchange(this.view, 0, this.locked_value);
    if (old !== this.unlocked_value) {
      throw new Error("what happened?");
    }
    const n = Atomics.notify(this.view, 0, 1);
    if (n === 0) {
      console.warn("invoked, but waiter is late");
    }
  }

  async call_and_wait(): Promise<void> {
    this.invoke();
    const lock = await Atomics.waitAsync(this.view, 0, this.locked_value).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }

  call_and_wait_blocking(): void {
    this.invoke();
    const lock = Atomics.wait(this.view, 0, this.locked_value);
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }
}
