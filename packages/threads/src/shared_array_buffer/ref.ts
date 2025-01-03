import { wasi } from "@bjorn3/browser_wasi_shim";
import { WASIFarmRef, type WASIFarmRefObject } from "../ref";
import type { FdCloseSender } from "../sender";
import {
  AllocatorUseArrayBuffer,
  type AllocatorUseArrayBufferObject,
} from "./allocator";
import {
  FdCloseSenderUseArrayBuffer,
  type FdCloseSenderUseArrayBufferObject,
} from "./fd_close_sender";
import { Locker } from "./locker";
import { fd_func_sig_bytes, fd_func_sig_u32_size } from "./park";

export type WASIFarmRefUseArrayBufferObject = {
  allocator: AllocatorUseArrayBufferObject;
  lock_fds: SharedArrayBuffer;
  fds_len_and_num: SharedArrayBuffer;
  fd_func_sig: SharedArrayBuffer;
  base_func_util: SharedArrayBuffer;
  fd_close_receiver: FdCloseSenderUseArrayBufferObject;
} & WASIFarmRefObject;

// Transmittable objects to communicate with Park
export class WASIFarmRefUseArrayBuffer extends WASIFarmRef {
  // For more information on member variables, see . See /park.ts
  allocator: AllocatorUseArrayBuffer;
  lock_fds: SharedArrayBuffer;
  // byte 1: fds_len
  // byte 2: all wasi_farm_ref num
  fds_len_and_num: SharedArrayBuffer;
  fd_func_sig: SharedArrayBuffer;
  base_func_util: SharedArrayBuffer;

  declare fd_close_receiver: FdCloseSenderUseArrayBuffer;

  protected locker: Locker;

  protected constructor(
    allocator: AllocatorUseArrayBuffer,
    lock_fds: SharedArrayBuffer,
    fds_len_and_num: SharedArrayBuffer,
    fd_func_sig: SharedArrayBuffer,
    base_func_util: SharedArrayBuffer,
    fd_close_receiver: FdCloseSender,
    stdin: number | undefined,
    stdout: number | undefined,
    stderr: number | undefined,
    default_fds: Array<number>,
  ) {
    super(stdin, stdout, stderr, fd_close_receiver, default_fds);
    this.allocator = allocator;
    this.lock_fds = lock_fds;
    this.fd_func_sig = fd_func_sig;
    this.base_func_util = base_func_util;
    this.fds_len_and_num = fds_len_and_num;
    this.locker = new Locker(this.base_func_util, 0);
  }

  get_fds_len(): number {
    const view = new Int32Array(this.fds_len_and_num);
    return Atomics.load(view, 0);
  }

  static async init(sl: WASIFarmRefUseArrayBufferObject): Promise<WASIFarmRef> {
    return new WASIFarmRefUseArrayBuffer(
      await AllocatorUseArrayBuffer.init(sl.allocator),
      sl.lock_fds,
      sl.fds_len_and_num,
      sl.fd_func_sig,
      sl.base_func_util,
      await FdCloseSenderUseArrayBuffer.init(sl.fd_close_receiver),
      sl.stdin,
      sl.stdout,
      sl.stderr,
      sl.default_fds,
    );
  }

  // allocate a new id on wasi_farm_ref and return it
  set_id(): number {
    const view = new Int32Array(this.fds_len_and_num);
    const id = Atomics.add(view, 1, 1);
    this.id = id;
    return id;
  }

  private call_base_func(): void {
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

  // set park_fds_map
  set_park_fds_map(fds: Array<number>): void {
    this.locker.lock_blocking(() => {
      const view = new Int32Array(this.base_func_util);
      Atomics.store(view, 2, 0);
      const fds_array = new Uint32Array(fds);
      this.allocator.block_write(fds_array, this.base_func_util, 3);
      Atomics.store(view, 5, this.id);
      this.call_base_func();
    });
  }

  protected lock_fd<T>(fd: number, callback: () => T): T {
    return new Locker(this.lock_fds, fd * 12).lock_blocking(callback);
  }

  protected lock_double_fd<T>(fd1: number, fd2: number, callback: () => T): T {
    const fd1_locker = new Locker(this.lock_fds, fd1 * 12, 2);
    const fd2_locker = new Locker(this.lock_fds, fd2 * 12, 2);

    return Locker.dual_lock_blocking(
      fd1_locker,
      fd2_locker,
      callback,
      fd1 < fd2,
    );
  }

  protected call_fd(fd: number, callback: () => void): number {
    return this.lock_fd(fd, () => {
      callback();
      return this.call_fd_func(fd);
    });
  }

  protected call_double_fd(
    fd1: number,
    fd2: number,
    callback: () => void,
  ): number {
    return this.lock_double_fd(fd1, fd2, () => {
      callback();
      return this.call_fd_func(fd1);
    });
  }

  private call_fd_func(fd: number): number {
    const view = new Int32Array(this.lock_fds, fd * 12 + 4);

    const invoke_fd_func = () => {
      const old = Atomics.exchange(view, 0, 1);
      if (old === 1) {
        throw new Error(`invoke_fd_func already invoked\nfd: ${fd}`);
      }
      const n = Atomics.notify(view, 0);
      if (n !== 1) {
        if (n !== 0) {
          throw new Error(`invoke_fd_func notify failed: ${n}`);
        }
        const len = this.get_fds_len();
        if (len <= fd) {
          const lock = Atomics.exchange(view, 0, 0);
          if (lock !== 1) {
            throw new Error("what happened?");
          }
          Atomics.notify(view, 0, 1);
          throw new Error(`what happened?: len ${len} fd ${fd}`);
        }
        console.warn("invoke_func_loop is late");
      }
    };

    const wait_fd_func = () => {
      const value = Atomics.wait(view, 0, 1);
      if (value === "timed-out") {
        throw new Error("wait call park_fd_func timed-out");
      }
    };

    invoke_fd_func();
    wait_fd_func();
    return this.get_error(fd);
  }

  private get_error(fd: number): number {
    const func_sig_view_i32 = new Int32Array(
      this.fd_func_sig,
      fd * fd_func_sig_bytes,
    );
    const errno_offset = fd_func_sig_u32_size - 1;
    return Atomics.load(func_sig_view_i32, errno_offset);
  }

  fd_advise(fd: number): number {
    return this.call_fd(fd, () => {
      const func_sig_view_u32 = new Uint32Array(
        this.fd_func_sig,
        fd * fd_func_sig_bytes,
      );

      Atomics.store(func_sig_view_u32, 0, 7);
      Atomics.store(func_sig_view_u32, 1, fd);
    });
  }

  fd_allocate(fd: number, offset: bigint, len: bigint): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 8);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u64, 1, offset);
      Atomics.store(func_sig_view_u64, 2, len);
    });
  }

  fd_close(fd: number): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 9);
      Atomics.store(func_sig_view_u32, 1, fd);
    });
  }

  fd_datasync(fd: number): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 10);
      Atomics.store(func_sig_view_u32, 1, fd);
    });
  }

  fd_fdstat_get(
    fd: number,
  ): [wasi.Fdstat, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u8 = new Uint8Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u16 = new Uint16Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 11);
      Atomics.store(func_sig_view_u32, 1, fd);

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const fs_filetype = Atomics.load(func_sig_view_u8, 0);
      const fs_flags = Atomics.load(func_sig_view_u16, 2);
      const fs_rights_base = Atomics.load(func_sig_view_u64, 1);
      const fs_rights_inheriting = Atomics.load(func_sig_view_u64, 2);

      const fd_stat = new wasi.Fdstat(fs_filetype, fs_flags);
      fd_stat.fs_rights_base = fs_rights_base;
      fd_stat.fs_rights_inherited = fs_rights_inheriting;

      return [fd_stat, error];
    });
  }

  fd_fdstat_set_flags(fd: number, flags: number): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u16 = new Uint16Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 12);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u16, 4, flags);
    });
  }

  fd_fdstat_set_rights(
    fd: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
  ): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 13);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u64, 1, fs_rights_base);
      Atomics.store(func_sig_view_u64, 2, fs_rights_inheriting);
    });
  }

  fd_filestat_get(
    fd: number,
  ): [wasi.Filestat, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u8 = new Uint8Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 14);
      Atomics.store(func_sig_view_u32, 1, fd);

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const fs_dev = Atomics.load(func_sig_view_u64, 0);
      const fs_ino = Atomics.load(func_sig_view_u64, 1);
      const fs_filetype = Atomics.load(func_sig_view_u8, 16);
      const fs_nlink = Atomics.load(func_sig_view_u64, 3);
      const fs_size = Atomics.load(func_sig_view_u64, 4);
      const fs_atim = Atomics.load(func_sig_view_u64, 5);
      const fs_mtim = Atomics.load(func_sig_view_u64, 6);
      const fs_ctim = Atomics.load(func_sig_view_u64, 7);

      const file_stat = new wasi.Filestat(fs_filetype, fs_size);
      file_stat.dev = fs_dev;
      file_stat.ino = fs_ino;
      file_stat.nlink = fs_nlink;
      file_stat.atim = fs_atim;
      file_stat.mtim = fs_mtim;
      file_stat.ctim = fs_ctim;

      return [file_stat, error];
    });
  }

  fd_filestat_set_size(fd: number, size: bigint): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 15);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u64, 1, size);
    });
  }

  fd_filestat_set_times(
    fd: number,
    st_atim: bigint,
    st_mtim: bigint,
    fst_flags: number,
  ): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u16 = new Uint16Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 16);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u64, 1, st_atim);
      Atomics.store(func_sig_view_u64, 2, st_mtim);
      Atomics.store(func_sig_view_u16, 12, fst_flags);
    });
  }

  fd_pread(
    fd: number,
    iovs: Uint32Array,
    offset: bigint,
  ): [[number, Uint8Array], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    const { error, nread, buf_ptr, buf_len } = this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 17);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        iovs,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );
      Atomics.store(func_sig_view_u64, 2, offset);

      const error = this.call_fd_func(fd);

      const nread = Atomics.load(func_sig_view_u32, 0);
      const buf_ptr = Atomics.load(func_sig_view_u32, 1);
      const buf_len = Atomics.load(func_sig_view_u32, 2);

      return { error, nread, buf_ptr, buf_len };
    });

    if (error !== wasi.ERRNO_SUCCESS) {
      this.allocator.free(buf_ptr, buf_len);
      return [undefined, error];
    }

    const buf = new Uint8Array(this.allocator.get_memory(buf_ptr, buf_len));

    this.allocator.free(buf_ptr, buf_len);

    if (nread !== buf_len) {
      throw new Error("pread nread !== buf_len");
    }

    return [[nread, buf], error];
  }

  fd_prestat_get(
    fd: number,
  ): [[number, number], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 18);
      Atomics.store(func_sig_view_u32, 1, fd);

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const pr_tag = Atomics.load(func_sig_view_u32, 0);
      const pr_name_len = Atomics.load(func_sig_view_u32, 1);

      return [[pr_tag, pr_name_len], error];
    });
  }

  fd_prestat_dir_name(
    fd: number,
    path_len: number,
  ):
    | [Uint8Array, typeof wasi.ERRNO_SUCCESS | typeof wasi.ERRNO_NAMETOOLONG]
    | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 19);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, path_len);

      const error = this.call_fd_func(fd);

      const ret_path_ptr = Atomics.load(func_sig_view_u32, 0);
      const ret_path_len = Atomics.load(func_sig_view_u32, 1);

      if (error !== wasi.ERRNO_SUCCESS && error !== wasi.ERRNO_NAMETOOLONG) {
        this.allocator.free(ret_path_ptr, ret_path_len);
        return [undefined, error];
      }

      const ret_path = new Uint8Array(
        this.allocator.get_memory(ret_path_ptr, ret_path_len),
      );
      this.allocator.free(ret_path_ptr, ret_path_len);

      return [ret_path, error];
    });
  }

  fd_pwrite(
    fd: number,
    write_data: Uint8Array,
    offset: bigint,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 20);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        write_data,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );
      Atomics.store(func_sig_view_u64, 2, offset);

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const nwritten = Atomics.load(func_sig_view_u32, 0);

      return [nwritten, error];
    });
  }

  fd_read(
    fd: number,
    iovs: Uint32Array,
  ): [[number, Uint8Array], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 21);
      Atomics.store(func_sig_view_u32, 1, fd);

      this.allocator.block_write(
        iovs,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );

      const error = this.call_fd_func(fd);

      const nread = Atomics.load(func_sig_view_u32, 0);
      const buf_ptr = Atomics.load(func_sig_view_u32, 1);
      const buf_len = Atomics.load(func_sig_view_u32, 2);

      if (error !== wasi.ERRNO_SUCCESS) {
        this.allocator.free(buf_ptr, buf_len);
        return [undefined, error];
      }

      // fd_read: ref:  14 30 14
      // animals.ts:325 fd_read: nread 14 Hello, world!
      // fd_read: ref:  21 52 32
      // ref.ts:655 fd_read: ref:  21
      const buf = new Uint8Array(this.allocator.get_memory(buf_ptr, buf_len));

      this.allocator.free(buf_ptr, buf_len);

      if (nread !== buf_len) {
        throw new Error("read nread !== buf_len");
      }

      return [[nread, buf], error];
    });
  }

  fd_readdir(
    fd: number,
    limit_buf_len: number,
    cookie: bigint,
  ): [[Uint8Array, number], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 22);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, limit_buf_len);
      Atomics.store(func_sig_view_u64, 2, cookie);

      const error = this.call_fd_func(fd);

      const buf_ptr = Atomics.load(func_sig_view_u32, 0);
      const buf_len = Atomics.load(func_sig_view_u32, 1);
      const buf_used = Atomics.load(func_sig_view_u32, 2);

      if (error !== wasi.ERRNO_SUCCESS) {
        this.allocator.free(buf_ptr, buf_len);
        return [undefined, error];
      }

      const buf = new Uint8Array(this.allocator.get_memory(buf_ptr, buf_len));

      this.allocator.free(buf_ptr, buf_len);

      return [[buf, buf_used], error];
    });
  }

  // fd_renumber(
  //   fd: number,
  //   to: number,
  // ): number {
  //   return this.lock_double_fd(fd, to, () => {
  //     const bytes_offset = fd * fd_func_sig_bytes;
  //     const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

  //     // fd
  //     Atomics.store(func_sig_view_u32, 0, 23);
  //     Atomics.store(func_sig_view_u32, 1, fd);
  //     Atomics.store(func_sig_view_u32, 2, to);

  //     return this.call_fd_func(fd);
  //   });
  // }

  fd_seek(
    fd: number,
    offset: bigint,
    whence: number,
  ): [bigint, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u8 = new Uint8Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 24);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u64, 1, offset);
      Atomics.store(func_sig_view_u8, 16, whence);

      const error = this.call_fd_func(fd);

      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const new_offset = Atomics.load(func_sig_view_u64, 0);

      return [new_offset, error];
    });
  }

  fd_sync(fd: number): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 25);
      Atomics.store(func_sig_view_u32, 1, fd);
    });
  }

  fd_tell(
    fd: number,
  ): [bigint, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 26);
      Atomics.store(func_sig_view_u32, 1, fd);

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const offset = Atomics.load(func_sig_view_u64, 0);
      return [offset, error];
    });
  }

  fd_write(
    fd: number,
    write_data: Uint8Array,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 27);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        write_data,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const nwritten = Atomics.load(func_sig_view_u32, 0);
      return [nwritten, error];
    });
  }

  path_create_directory(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 28);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );
    });
  }

  path_filestat_get(
    fd: number,
    flags: number,
    path: Uint8Array,
  ): [wasi.Filestat, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u8 = new Uint8Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 29);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, flags);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 3,
      );

      const error = this.call_fd_func(fd);
      if (error !== wasi.ERRNO_SUCCESS) {
        return [undefined, error];
      }

      const fs_dev = Atomics.load(func_sig_view_u64, 0);
      const fs_ino = Atomics.load(func_sig_view_u64, 1);
      const fs_filetype = Atomics.load(func_sig_view_u8, 16);
      const fs_nlink = Atomics.load(func_sig_view_u64, 3);
      const fs_size = Atomics.load(func_sig_view_u64, 4);
      const fs_atim = Atomics.load(func_sig_view_u64, 5);
      const fs_mtim = Atomics.load(func_sig_view_u64, 6);
      const fs_ctim = Atomics.load(func_sig_view_u64, 7);

      const file_stat = new wasi.Filestat(fs_filetype, fs_size);
      file_stat.dev = fs_dev;
      file_stat.ino = fs_ino;
      file_stat.nlink = fs_nlink;
      file_stat.atim = fs_atim;
      file_stat.mtim = fs_mtim;
      file_stat.ctim = fs_ctim;

      return [file_stat, error];
    });
  }

  path_filestat_set_times(
    fd: number,
    flags: number,
    path: Uint8Array,
    st_atim: bigint,
    st_mtim: bigint,
    fst_flags: number,
  ): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u16 = new Uint16Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 30);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, flags);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 3,
      );
      Atomics.store(func_sig_view_u64, 3, st_atim);
      Atomics.store(func_sig_view_u64, 4, st_mtim);
      Atomics.store(func_sig_view_u16, 12, fst_flags);
    });
  }

  path_link(
    old_fd: number,
    old_flags: number,
    old_path: Uint8Array,
    new_fd: number,
    new_path: Uint8Array,
  ): number {
    return this.call_double_fd(old_fd, new_fd, () => {
      const bytes_offset = old_fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 31);
      Atomics.store(func_sig_view_u32, 1, old_fd);
      Atomics.store(func_sig_view_u32, 2, old_flags);
      this.allocator.block_write(
        old_path,
        this.fd_func_sig,
        old_fd * fd_func_sig_u32_size + 3,
      );
      Atomics.store(func_sig_view_u32, 5, new_fd);
      this.allocator.block_write(
        new_path,
        this.fd_func_sig,
        old_fd * fd_func_sig_u32_size + 6,
      );
    });
  }

  path_open(
    fd: number,
    dirflags: number,
    path: Uint8Array,
    oflags: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
    fs_flags: number,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u16 = new Uint16Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);
      const func_sig_view_u64 = new BigUint64Array(
        this.fd_func_sig,
        bytes_offset,
      );

      Atomics.store(func_sig_view_u32, 0, 32);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, dirflags);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 3,
      );
      Atomics.store(func_sig_view_u32, 5, oflags);
      Atomics.store(func_sig_view_u64, 3, fs_rights_base);
      Atomics.store(func_sig_view_u64, 4, fs_rights_inheriting);
      Atomics.store(func_sig_view_u16, 20, fs_flags);

      const error = this.call_fd_func(fd);

      if (error === wasi.ERRNO_SUCCESS) {
        const new_fd = Atomics.load(func_sig_view_u32, 0);
        return [new_fd, error];
      }

      return [undefined, error];
    });
  }

  path_readlink(
    fd: number,
    path: Uint8Array,
    buf_len: number,
  ):
    | [Uint8Array, typeof wasi.ERRNO_SUCCESS | typeof wasi.ERRNO_NAMETOOLONG]
    | [undefined, number] {
    return this.lock_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 33);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );
      Atomics.store(func_sig_view_u32, 4, buf_len);

      const error = this.call_fd_func(fd);

      const nread = Atomics.load(func_sig_view_u32, 0);
      const ret_path_ptr = Atomics.load(func_sig_view_u32, 1);
      const ret_path_len = Atomics.load(func_sig_view_u32, 2);

      if (error !== wasi.ERRNO_SUCCESS && error !== wasi.ERRNO_NAMETOOLONG) {
        this.allocator.free(ret_path_ptr, ret_path_len);
        return [undefined, error];
      }

      const ret_path = new Uint8Array(
        this.allocator.get_memory(ret_path_ptr, ret_path_len),
      );
      const ret_path_slice = ret_path.slice(0, nread);

      return [ret_path_slice, error];
    });
  }

  path_remove_directory(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 34);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );
    });
  }

  path_rename(
    old_fd: number,
    old_path: Uint8Array,
    new_fd: number,
    new_path: Uint8Array,
  ): number {
    return this.call_double_fd(old_fd, new_fd, () => {
      const bytes_offset = old_fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 35);
      Atomics.store(func_sig_view_u32, 1, old_fd);
      this.allocator.block_write(
        old_path,
        this.fd_func_sig,
        old_fd * fd_func_sig_u32_size + 2,
      );
      Atomics.store(func_sig_view_u32, 4, new_fd);
      this.allocator.block_write(
        new_path,
        this.fd_func_sig,
        old_fd * fd_func_sig_u32_size + 5,
      );
    });
  }

  path_symlink(old_path: Uint8Array, fd: number, new_path: Uint8Array): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 36);
      this.allocator.block_write(
        old_path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 1,
      );
      Atomics.store(func_sig_view_u32, 3, fd);
      this.allocator.block_write(
        new_path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 4,
      );
    });
  }

  path_unlink_file(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, 37);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        this.fd_func_sig,
        fd * fd_func_sig_u32_size + 2,
      );
    });
  }
}
