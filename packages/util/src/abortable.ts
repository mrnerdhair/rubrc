export class Abortable implements AbortController {
  private readonly abortController: AbortController;
  readonly promise: Promise<void>;
  protected readonly resolve: (
    // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    value: void | Abortable | PromiseLike<void | Abortable>,
  ) => void;

  constructor(
    callback?: (
      abortable: Abortable,
      // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    ) => void | Abortable | PromiseLike<void | Abortable>,
  ) {
    this.abortController = new AbortController();
    const { promise, resolve } = Promise.withResolvers<
      // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
      void | Abortable | PromiseLike<void | Abortable>
    >();

    this.promise = promise.then(async (x) => {
      const y = await x;
      return y instanceof Abortable ? y.promise : y;
    });
    this.resolve = resolve;
    if (callback) {
      resolve(callback(this));
    }
  }

  readonly [Symbol.toStringTag] = "Abortable";

  get signal() {
    return this.abortController.signal;
  }

  async abort(reason?: unknown): Promise<void> {
    this.abortController.abort(reason);
    await this.promise;
  }

  chain(
    onAbort: (
      reason?: unknown,
      // biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
    ) => void | Abortable | Promise<void | Abortable>,
  ): Abortable {
    const out = new Abortable(async (abortable) => {
      try {
        return await this.promise;
      } finally {
        if (abortable.signal.aborted) {
          const out = await onAbort(abortable.signal.reason);
          // biome-ignore lint/correctness/noUnsafeFinally: return value overwrite is expected here
          return await (out instanceof Abortable ? out.promise : out);
        }
      }
    });
    this.signal.addEventListener("abort", () => {
      out.abort(this.signal.reason);
    });
    return out;
  }
}
