export abstract class DummyListenerBase {
  abstract reset(): void;

  protected abstract listen_inner<T>(
    callback: (code?: number) => T,
  ): Generator<
    [Int32Array<SharedArrayBuffer>, number, number] | T,
    Awaited<T>,
    Awaited<T> | string
  >;

  async listen<T>(callback: (code?: number) => Promise<T>): Promise<T> {
    const gen = this.listen_inner(callback);
    let next = gen.next();
    while (!next.done) {
      const value = next.value;
      if (Array.isArray(value)) {
        next = gen.next(await Atomics.waitAsync(...value).value);
      } else {
        next = gen.next(await value);
      }
    }
    return next.value;
  }

  listen_blocking<T>(callback: (code?: number) => T): T {
    const gen = this.listen_inner(callback);
    let next = gen.next();
    while (!next.done) {
      const value = next.value;
      if (Array.isArray(value)) {
        next = gen.next(Atomics.wait(...value));
      } else {
        next = gen.next(value as Awaited<T>);
      }
    }
    return next.value;
  }
}
