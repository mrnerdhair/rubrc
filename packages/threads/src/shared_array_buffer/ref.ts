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
import {
  type CallerTarget,
  DummyCaller1,
  DummyCaller2,
  type ListenerTarget,
  Locker,
  type LockerTarget,
} from "./locking";
import { fd_func_sig_bytes, fd_func_sig_u32_size } from "./park";
import { FuncNames } from "./util";

export type WASIFarmRefUseArrayBufferObject = {
  allocator: AllocatorUseArrayBufferObject;
  lock_fds: SharedArrayBuffer;
  lock_fds_new: Array<{
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
  }>;
  fds_len_and_num: SharedArrayBuffer;
  fd_func_sig: SharedArrayBuffer;
  base_func_util: SharedArrayBuffer;
  base_func_util_locks: {
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
  };
  fd_close_receiver: FdCloseSenderUseArrayBufferObject;
} & WASIFarmRefObject;

// Transmittable objects to communicate with Park
export class WASIFarmRefUseArrayBuffer extends WASIFarmRef {
  // For more information on member variables, see . See /park.ts
  allocator: AllocatorUseArrayBuffer;
  lock_fds: SharedArrayBuffer;
  readonly lock_fds_new: Array<{
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
  }>;
  // byte 1: fds_len
  // byte 2: all wasi_farm_ref num
  fds_len_and_num: SharedArrayBuffer;
  fd_func_sig: SharedArrayBuffer;
  base_func_util: SharedArrayBuffer;

  declare fd_close_receiver: FdCloseSenderUseArrayBuffer;

  protected locker: Locker;
  protected caller: DummyCaller1;

  protected constructor(
    allocator: AllocatorUseArrayBuffer,
    lock_fds: SharedArrayBuffer,
    lock_fds_new: Array<{
      lock: LockerTarget;
      call: CallerTarget;
      listen: ListenerTarget;
    }>,
    fds_len_and_num: SharedArrayBuffer,
    fd_func_sig: SharedArrayBuffer,
    base_func_util: SharedArrayBuffer,
    base_func_util_locks: {
      lock: LockerTarget;
      call: CallerTarget;
    },
    fd_close_receiver: FdCloseSender,
    stdin: number | undefined,
    stdout: number | undefined,
    stderr: number | undefined,
    default_fds: Array<number>,
  ) {
    super(stdin, stdout, stderr, fd_close_receiver, default_fds);
    this.allocator = allocator;
    this.lock_fds = lock_fds;
    this.lock_fds_new = lock_fds_new;
    this.fd_func_sig = fd_func_sig;
    this.base_func_util = base_func_util;
    this.fds_len_and_num = fds_len_and_num;
    this.locker = new Locker(base_func_util_locks.lock);
    this.caller = new DummyCaller1(new Int32Array(base_func_util, 4));
  }

  get_fds_len(): number {
    const view = new Int32Array(this.fds_len_and_num);
    return Atomics.load(view, 0);
  }

  static async init(sl: WASIFarmRefUseArrayBufferObject): Promise<WASIFarmRef> {
    return new WASIFarmRefUseArrayBuffer(
      await AllocatorUseArrayBuffer.init(sl.allocator),
      sl.lock_fds,
      sl.lock_fds_new,
      sl.fds_len_and_num,
      sl.fd_func_sig,
      sl.base_func_util,
      sl.base_func_util_locks,
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

  // set park_fds_map
  set_park_fds_map(fds: Array<number>): void {
    this.locker.lock_blocking(() => {
      const view = new Int32Array(this.base_func_util);
      Atomics.store(view, 2, 0);
      const fds_array = new Uint32Array(fds);
      this.allocator.block_write(fds_array, view, 3);
      Atomics.store(view, 5, this.id);
      this.caller.call_and_wait_blocking();
    });
  }

  protected lock_fd<T>(fd: number, callback: () => T): T {
    return new Locker(this.lock_fds_new[fd].lock).lock_blocking(callback);
  }

  protected lock_double_fd<T>(fd1: number, fd2: number, callback: () => T): T {
    const fd1_locker = new Locker(this.lock_fds_new[fd1].lock);
    const fd2_locker = new Locker(this.lock_fds_new[fd2].lock);

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
    const caller = new DummyCaller2(
      new Int32Array(this.lock_fds, fd * 12 + 4),
      fd,
      this.get_fds_len(),
    );
    caller.call_and_wait_blocking();
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_advise);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_allocate);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u64, 1, offset);
      Atomics.store(func_sig_view_u64, 2, len);
    });
  }

  fd_close(fd: number): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_close);
      Atomics.store(func_sig_view_u32, 1, fd);
    });
  }

  fd_datasync(fd: number): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_datasync);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_fdstat_get);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_fdstat_set_flags);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_fdstat_set_rights);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_filestat_get);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_filestat_set_size);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_filestat_set_times);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_pread);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        iovs,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_prestat_get);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_prestat_dir_name);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_pwrite);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        write_data,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_read);
      Atomics.store(func_sig_view_u32, 1, fd);

      this.allocator.block_write(
        iovs,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_readdir);
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
  //     Atomics.store(func_sig_view_u32, 0, FuncNames.fd_renumber);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_seek);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_sync);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_tell);
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.fd_write);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        write_data,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_create_directory);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_filestat_get);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, flags);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_filestat_set_times);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, flags);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_link);
      Atomics.store(func_sig_view_u32, 1, old_fd);
      Atomics.store(func_sig_view_u32, 2, old_flags);
      this.allocator.block_write(
        old_path,
        new Int32Array(this.fd_func_sig),
        old_fd * fd_func_sig_u32_size + 3,
      );
      Atomics.store(func_sig_view_u32, 5, new_fd);
      this.allocator.block_write(
        new_path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_open);
      Atomics.store(func_sig_view_u32, 1, fd);
      Atomics.store(func_sig_view_u32, 2, dirflags);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_readlink);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_remove_directory);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
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

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_rename);
      Atomics.store(func_sig_view_u32, 1, old_fd);
      this.allocator.block_write(
        old_path,
        new Int32Array(this.fd_func_sig),
        old_fd * fd_func_sig_u32_size + 2,
      );
      Atomics.store(func_sig_view_u32, 4, new_fd);
      this.allocator.block_write(
        new_path,
        new Int32Array(this.fd_func_sig),
        old_fd * fd_func_sig_u32_size + 5,
      );
    });
  }

  path_symlink(old_path: Uint8Array, fd: number, new_path: Uint8Array): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_symlink);
      this.allocator.block_write(
        old_path,
        new Int32Array(this.fd_func_sig),
        fd * fd_func_sig_u32_size + 1,
      );
      Atomics.store(func_sig_view_u32, 3, fd);
      this.allocator.block_write(
        new_path,
        new Int32Array(this.fd_func_sig),
        fd * fd_func_sig_u32_size + 4,
      );
    });
  }

  path_unlink_file(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, () => {
      const bytes_offset = fd * fd_func_sig_bytes;
      const func_sig_view_u32 = new Uint32Array(this.fd_func_sig, bytes_offset);

      Atomics.store(func_sig_view_u32, 0, FuncNames.path_unlink_file);
      Atomics.store(func_sig_view_u32, 1, fd);
      this.allocator.block_write(
        path,
        new Int32Array(this.fd_func_sig),
        fd * fd_func_sig_u32_size + 2,
      );
    });
  }
}
