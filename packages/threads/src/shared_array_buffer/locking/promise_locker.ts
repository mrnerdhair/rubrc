export class PromiseLocker {
  private promise: Promise<unknown> = Promise.resolve();

  async lock<T>(callback: () => PromiseLike<T> | T): Promise<T> {
    const new_lock = (async () => {
      await this.promise;
      return callback();
    })();
    this.promise = new_lock;
    return new_lock;
  }
}
