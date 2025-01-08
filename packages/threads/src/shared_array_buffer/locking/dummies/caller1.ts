export class DummyCaller1 {
  private readonly base_func_util: SharedArrayBuffer;
  constructor(base_func_util: SharedArrayBuffer) {
    this.base_func_util = base_func_util;
  }
  call_and_wait_blocking(): void {
    const invoke_base_func = () => {
      const view = new Int32Array(this.base_func_util);
      const old = Atomics.exchange(view, 1, 1);
      Atomics.notify(view, 1, 1);
      if (old !== 0) {
        throw new Error("what happened?");
      }
    };

    const wait_base_func = () => {
      const view = new Int32Array(this.base_func_util);
      const lock = Atomics.wait(view, 1, 1);
      if (lock === "timed-out") {
        throw new Error("timed-out lock");
      }
    };

    invoke_base_func();
    wait_base_func();
  }
}
