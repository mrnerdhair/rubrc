import type { AtomicTarget } from "./target";

export class Caller {
  protected readonly view: Int32Array;
  protected readonly locked_value: number | undefined;
  protected readonly unlocked_value: number;

  constructor(
    { buf, byteOffset }: AtomicTarget,
    locked_value: number | null = 1,
    unlocked_value = 0,
  ) {
    this.view = new Int32Array(buf, byteOffset, 1);
    this.locked_value = locked_value ?? undefined;
    this.unlocked_value = unlocked_value;
  }

  reset(): void {
    const old = Atomics.exchange(this.view, 0, this.unlocked_value);
    if (old !== this.unlocked_value) {
      throw new Error(`reset actually did something: ${old}`);
    }
  }

  call(code = this.locked_value): void {
    if (code === undefined) throw new Error("must provide a code");
    const old = Atomics.exchange(this.view, 0, code);
    if (old !== this.unlocked_value) {
      throw new Error("what happened?");
    }
    const n = Atomics.notify(this.view, 0, 1);
    if (n === 0) {
      throw new Error("invoked, but waiter is late");
    }
  }

  async call_and_wait(code = this.locked_value): Promise<void> {
    if (code === undefined) throw new Error("must provide a code");
    this.call(code);
    const lock = await Atomics.waitAsync(this.view, 0, code).value;
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }

  call_and_wait_blocking(code = this.locked_value): void {
    if (code === undefined) throw new Error("must provide a code");
    this.call(code);
    const lock = Atomics.wait(this.view, 0, code);
    if (lock === "timed-out") {
      throw new Error("timed-out");
    }
  }
}
