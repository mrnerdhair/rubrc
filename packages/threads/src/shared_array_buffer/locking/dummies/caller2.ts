export class DummyCaller2 {
  private readonly notify_view: Int32Array<SharedArrayBuffer>;
  private readonly fd: number;
  private readonly fds_len: number;

  constructor(
    notify_view: Int32Array<SharedArrayBuffer>,
    fd: number,
    fds_len: number,
  ) {
    this.notify_view = notify_view;
    this.fd = fd;
    this.fds_len = fds_len;
  }

  private get_fds_len() {
    return this.fds_len;
  }

  call_and_wait_blocking(): void {
    const old = Atomics.exchange(this.notify_view, 0, 1);
    if (old === 1) {
      throw new Error("what happened?");
    }

    const n = Atomics.notify(this.notify_view, 0, 1);
    if (n !== 1) {
      if (n !== 0) {
        throw new Error(`invoke_fd_func notify failed: ${n}`);
      }
      // const len = this.get_fds_len();
      // if (len <= this.fd) {
      //   const lock = Atomics.exchange(this.notify_view, 0, 0);
      //   if (lock !== 1) {
      //     throw new Error("what happened?");
      //   }
      //   Atomics.notify(this.notify_view, 0, 1);
      //   throw new Error(`what happened?: len ${len} fd ${this.fd}`);
      // }
      console.warn("invoke_func_loop is late");
    }

    const lock = Atomics.wait(this.notify_view, 0, 1);
    if (lock === "timed-out") {
      throw new Error("timed-out lock");
    }
  }
}
