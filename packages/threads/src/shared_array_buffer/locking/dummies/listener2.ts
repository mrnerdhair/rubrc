export class DummyListener2 {
  private readonly lock_view: Int32Array<SharedArrayBuffer>;
  private readonly lock_fds: SharedArrayBuffer;
  private readonly fd_func_sig: SharedArrayBuffer;
  constructor(
    lock_view: Int32Array<SharedArrayBuffer>,
    lock_fds: SharedArrayBuffer,
    fd_func_sig: SharedArrayBuffer,
  ) {
    this.lock_view = lock_view;
    this.lock_fds = lock_fds;
    this.fd_func_sig = fd_func_sig;
  }
  reset() {
    Atomics.store(this.lock_view, 1, 0);
  }
  async listen(callback: () => Promise<void>): Promise<void> {
    try {
      const lock = await Atomics.waitAsync(this.lock_view, 1, 0).value;
      if (lock === "timed-out") {
        throw new Error("timed-out");
      }

      const func_lock = Atomics.load(this.lock_view, 1);
      if (func_lock !== 1) {
        throw new Error(`func_lock is already set: ${func_lock}`);
      }

      await callback();

      const old_call_lock = Atomics.compareExchange(this.lock_view, 1, 1, 0);
      if (old_call_lock !== 1) {
        throw new Error(
          `Call is already set: ${old_call_lock}\nfunc: \${func_name}\nfd: \${fd_n}`,
        );
      }

      const n = Atomics.notify(this.lock_view, 1);
      if (n !== 1) {
        if (n === 0) {
          console.warn("notify number is 0. ref is late?");
        } else {
          console.warn(`notify number is not 1: ${n}`);
        }
      }
    } catch (e) {
      const lock_view = new Int32Array(this.lock_fds);
      Atomics.exchange(lock_view, 1, 0);
      const func_sig_view = new Int32Array(this.fd_func_sig);
      Atomics.exchange(func_sig_view, 16, -1);

      throw e;
    }
  }
}
