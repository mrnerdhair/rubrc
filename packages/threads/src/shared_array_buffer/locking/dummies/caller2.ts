export class DummyCaller2 {
  private readonly view: Int32Array<SharedArrayBuffer>;
  private readonly fd: number;
  private readonly fds_len: number;
  constructor(
    view: Int32Array<SharedArrayBuffer>,
    fd: number,
    fds_len: number,
  ) {
    this.view = view;
    this.fd = fd;
    this.fds_len = fds_len;
  }
  private get_fds_len() {
    return this.fds_len;
  }
  call_and_wait_blocking(): void {
    const invoke_fd_func = () => {
      const old = Atomics.exchange(this.view, 0, 1);
      if (old === 1) {
        throw new Error(`invoke_fd_func already invoked\nfd: ${this.fd}`);
      }
      const n = Atomics.notify(this.view, 0);
      if (n !== 1) {
        if (n !== 0) {
          throw new Error(`invoke_fd_func notify failed: ${n}`);
        }
        const len = this.get_fds_len();
        if (len <= this.fd) {
          const lock = Atomics.exchange(this.view, 0, 0);
          if (lock !== 1) {
            throw new Error("what happened?");
          }
          Atomics.notify(this.view, 0, 1);
          throw new Error(`what happened?: len ${len} fd ${this.fd}`);
        }
        console.warn("invoke_func_loop is late");
      }
    };

    const wait_fd_func = () => {
      const value = Atomics.wait(this.view, 0, 1);
      if (value === "timed-out") {
        throw new Error("wait call park_fd_func timed-out");
      }
    };

    invoke_fd_func();
    wait_fd_func();
  }
}
