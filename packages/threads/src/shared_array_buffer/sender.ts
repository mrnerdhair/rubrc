export type ToRefSenderUseArrayBufferObject = {
  data_size: number;
  share_arrays_memory: SharedArrayBuffer;
};

// To ref sender abstract class
export abstract class ToRefSenderUseArrayBuffer {
  // The structure is similar to an allocator, but the mechanism is different

  // Example of fd management
  // This needs to be handled
  // 1. Start of path_open
  // 2. Removed by fd_close
  // 2.1 Sent by ToRefSender
  // 3. Reassigned by path_open
  // < Closed by ToRefSender
  // 3.1 The person who opened it can use it
  // < Closed by ToRefSender — this alone will cause a bug
  // Structurally, this shouldn't happen in the farm

  // In the end, when receiving from this function, it should be done on the first call of each function

  // The first 4 bytes are for lock value: i32
  // The next 4 bytes are the current number of data: m: i32
  // The next 4 bytes are the length of the area used by share_arrays_memory: n: i32
  // Data header
  // 4 bytes: remaining target count
  // 4 bytes: target count (n)
  // n * 4 bytes: target allocation numbers
  // Data
  // data_size bytes: data
  share_arrays_memory: SharedArrayBuffer;

  // The size of the data
  data_size: number;

  constructor(
    // data is Uint32Array
    // and data_size is data.length
    data_size: number,
    max_share_arrays_memory: number = 100 * 1024,
    share_arrays_memory?: SharedArrayBuffer,
  ) {
    this.data_size = data_size;
    if (share_arrays_memory) {
      this.share_arrays_memory = share_arrays_memory;
    } else {
      this.share_arrays_memory = new SharedArrayBuffer(max_share_arrays_memory);
    }
    const view = new Int32Array(this.share_arrays_memory);
    Atomics.store(view, 0, 0);
    Atomics.store(view, 1, 0);
    Atomics.store(view, 2, 12);
  }

  private async async_lock<T>(callback: () => T | PromiseLike<T>): Promise<T> {
    const view = new Int32Array(this.share_arrays_memory);
    while (true) {
      const lock = await Atomics.waitAsync(view, 0, 1).value;
      if (lock === "timed-out") {
        throw new Error("timed-out");
      }
      const old = Atomics.compareExchange(view, 0, 0, 1);
      if (old !== 0) {
        continue;
      }
      break;
    }
    try {
      return await callback();
    } finally {
      Atomics.store(view, 0, 0);
      Atomics.notify(view, 0, 1);
    }
  }

  private block_lock<T>(callback: () => T): T {
    const view = new Int32Array(this.share_arrays_memory);
    while (true) {
      const lock = Atomics.wait(view, 0, 1);
      if (lock === "timed-out") {
        throw new Error("timed-out");
      }
      const old = Atomics.compareExchange(view, 0, 0, 1);
      if (old !== 0) {
        continue;
      }
      break;
    }
    try {
      return callback();
    } finally {
      Atomics.store(view, 0, 0);
      Atomics.notify(view, 0, 1);
    }
  }

  protected async async_send(
    targets: Array<number>,
    data: Uint32Array,
  ): Promise<void> {
    return await this.async_lock(async () => {
      const view = new Int32Array(this.share_arrays_memory);
      const used_len = Atomics.load(view, 2);
      const data_len = data.byteLength;
      if (data_len !== this.data_size) {
        throw new Error(`invalid data size: ${data_len} !== ${this.data_size}`);
      }
      const new_used_len = used_len + data_len + 8 + targets.length * 4;
      if (new_used_len > this.share_arrays_memory.byteLength) {
        throw new Error("over memory");
      }

      Atomics.store(view, 2, new_used_len);

      const header = new Int32Array(this.share_arrays_memory, used_len);
      header[0] = targets.length;
      header[1] = targets.length;
      header.set(targets, 2);

      const data_view = new Uint32Array(
        this.share_arrays_memory,
        used_len + 8 + targets.length * 4,
      );
      data_view.set(data);

      Atomics.add(view, 1, 1);
    });
  }

  protected get_data(id: number): Array<Uint32Array> | undefined {
    const view = new Int32Array(this.share_arrays_memory);
    const data_num_tmp = Atomics.load(view, 1);
    if (data_num_tmp === 0) {
      return undefined;
    }

    return this.block_lock(() => {
      const data_num = Atomics.load(view, 1);

      const return_data: Array<Uint32Array> = [];

      let offset = 12;
      for (let i = 0; i < data_num; i++) {
        const header = new Int32Array(this.share_arrays_memory, offset);
        const target_num = header[1];
        const targets = new Int32Array(
          this.share_arrays_memory,
          offset + 8,
          target_num,
        );
        const data_len = this.data_size;
        if (targets.includes(id)) {
          const data = new Uint32Array(
            this.share_arrays_memory,
            offset + 8 + target_num * 4,
            data_len / 4,
          );

          // I don't know why, but the above doesn't work, but the following works:
          // return_data.push(new Uint32Array(data));
          return_data.push(new Uint32Array([...data]));

          const target_index = targets.indexOf(id);
          Atomics.store(targets, target_index, -1);
          const old_left_targets_num = Atomics.sub(header, 0, 1);
          if (old_left_targets_num === 1) {
            // rm data
            Atomics.sub(view, 1, 1);
            const used_len = Atomics.load(view, 2);
            const new_used_len = used_len - data_len - 8 - target_num * 4;
            Atomics.store(view, 2, new_used_len);
            const next_data_offset = offset + data_len + 8 + target_num * 4;
            const next_tail = new Int32Array(
              this.share_arrays_memory,
              next_data_offset,
            );
            const now_tail = new Int32Array(this.share_arrays_memory, offset);
            now_tail.set(next_tail);
          } else {
            offset += data_len + 8 + target_num * 4;
          }
        } else {
          offset += data_len + 8 + target_num * 4;
        }
      }

      if (offset !== Atomics.load(view, 2)) {
        throw new Error(
          `invalid offset: ${offset} !== ${Atomics.load(view, 2)}`,
        );
      }

      return return_data;
    });
  }
}
