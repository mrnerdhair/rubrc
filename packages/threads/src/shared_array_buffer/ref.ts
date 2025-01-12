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
  Caller,
  type CallerTarget,
  Locker,
  type LockerTarget,
  type ViewSet,
} from "./locking";
import { FuncNames, WASIFarmParkFuncNames } from "./util";

export type WASIFarmRefUseArrayBufferObject = {
  allocator: AllocatorUseArrayBufferObject;
  lock_fds: Array<{
    lock: LockerTarget;
    call: CallerTarget;
  }>;
  base_func_util_locks: {
    lock: LockerTarget;
    call: CallerTarget;
  };
  fd_close_receiver: FdCloseSenderUseArrayBufferObject;
} & WASIFarmRefObject;

// Transmittable objects to communicate with Park
abstract class WASIFarmRefUseArrayBufferBase extends WASIFarmRef {
  // For more information on member variables, see . See /park.ts
  protected readonly allocator: AllocatorUseArrayBuffer;
  private readonly lock_fds: Array<{
    lock: LockerTarget;
    call: CallerTarget;
  }>;
  private get_fd_locker(fd_n: number): Locker {
    return new Locker(this.lock_fds[fd_n].lock);
  }
  private get_fd_caller(fd_n: number): Caller {
    return new Caller(this.lock_fds[fd_n].call);
  }

  private readonly locker: Locker;
  private readonly caller: Caller;

  readonly id: number;

  protected constructor(
    id: number,
    allocator: AllocatorUseArrayBuffer,
    lock_fds: Array<{
      lock: LockerTarget;
      call: CallerTarget;
    }>,
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
    this.id = id;
    this.allocator = allocator;
    this.lock_fds = lock_fds;
    this.locker = new Locker(base_func_util_locks.lock);
    this.caller = new Caller(base_func_util_locks.call);
  }

  // set park_fds_map
  set_park_fds_map(fds: Array<number>): void {
    const fds_array = new Uint32Array(fds);
    this.locker.lock_blocking(() => {
      this.caller.call_and_wait_blocking((data) => {
        data.i32[0] = WASIFarmParkFuncNames.set_fds_map;
        data.i32[1] = this.id;
        [data.u32[2], data.u32[3]] = this.allocator.block_write(fds_array);
      });
    });
  }

  async set_park_fds_map_async(fds: Array<number>): Promise<void> {
    const fds_array = new Uint32Array(fds);
    await this.locker.lock(async () => {
      await this.caller.call_and_wait(async (data) => {
        data.i32[0] = WASIFarmParkFuncNames.set_fds_map;
        data.i32[1] = this.id;
        [data.u32[2], data.u32[3]] =
          await this.allocator.async_write(fds_array);
      });
    });
  }

  private lock_fd<T>(fd: number, callback: () => T): T {
    return this.get_fd_locker(fd).lock_blocking(callback);
  }

  private lock_double_fd<T>(fd1: number, fd2: number, callback: () => T): T {
    return Locker.dual_lock_blocking(
      this.get_fd_locker(fd1),
      this.get_fd_locker(fd2),
      callback,
      { early_backoff: fd1 < fd2 },
    );
  }

  protected call_fd(
    fd: number,
    start_callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback?: undefined,
  ): number;
  protected call_fd<T>(
    fd: number,
    start_callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback: (data: ViewSet<SharedArrayBuffer>, errno: number) => T,
  ): T;
  protected call_fd<T>(
    fd: number,
    start_callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback?: (data: ViewSet<SharedArrayBuffer>, errno: number) => T,
  ): T | number {
    return this.lock_fd(fd, () =>
      this.call_fd_func(fd, start_callback, finished_callback),
    );
  }

  protected call_double_fd(
    fd1: number,
    fd2: number,
    callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback?: undefined,
  ): number;
  protected call_double_fd<T>(
    fd1: number,
    fd2: number,
    callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback: (data: ViewSet<SharedArrayBuffer>, errno: number) => T,
  ): T;
  protected call_double_fd<T>(
    fd1: number,
    fd2: number,
    start_callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback?: (data: ViewSet<SharedArrayBuffer>, errno: number) => T,
  ): T | number {
    return this.lock_double_fd(fd1, fd2, () => {
      return this.call_fd_func(fd1, start_callback, finished_callback);
    });
  }

  private call_fd_func<T>(
    fd: number,
    start_callback: (data: ViewSet<SharedArrayBuffer>) => void,
    finished_callback?: (data: ViewSet<SharedArrayBuffer>, errno: number) => T,
  ): T | number {
    return this.get_fd_caller(fd).call_and_wait_blocking(
      start_callback,
      (data) => {
        const errno = data.i32[data.i32.length - 1];
        return (finished_callback ?? ((_, x) => x))(data, errno);
      },
    );
  }
}

export class WASIFarmRefUseArrayBuffer extends WASIFarmRefUseArrayBufferBase {
  protected constructor(
    id: number,
    allocator: AllocatorUseArrayBuffer,
    lock_fds: Array<{
      lock: LockerTarget;
      call: CallerTarget;
    }>,
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
    super(
      id,
      allocator,
      lock_fds,
      base_func_util_locks,
      fd_close_receiver,
      stdin,
      stdout,
      stderr,
      default_fds,
    );
  }

  static async init(
    sl: WASIFarmRefUseArrayBufferObject,
  ): Promise<WASIFarmRefUseArrayBuffer> {
    return new WASIFarmRefUseArrayBuffer(
      await new Caller(sl.base_func_util_locks.call).call_and_wait(
        (data) => {
          data.i32[0] = WASIFarmParkFuncNames.get_new_id;
        },
        (data) => data.i32[0],
      ),
      await AllocatorUseArrayBuffer.init(sl.allocator),
      sl.lock_fds,
      sl.base_func_util_locks,
      await FdCloseSenderUseArrayBuffer.init(sl.fd_close_receiver),
      sl.stdin,
      sl.stdout,
      sl.stderr,
      sl.default_fds,
    );
  }

  fd_advise(fd: number): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_advise;
      data.u32[1] = fd;
    });
  }

  fd_allocate(fd: number, offset: bigint, len: bigint): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_allocate;
      data.u32[1] = fd;
      data.u64[1] = offset;
      data.u64[2] = len;
    });
  }

  fd_close(fd: number): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_close;
      data.u32[1] = fd;
    });
  }

  fd_datasync(fd: number): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_datasync;
      data.u32[1] = fd;
    });
  }

  fd_fdstat_get(
    fd: number,
  ): [wasi.Fdstat, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_fdstat_get;
        data.u32[1] = fd;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const fs_filetype = data.u8[0];
        const fs_flags = data.u16[2];
        const fs_rights_base = data.u64[1];
        const fs_rights_inheriting = data.u64[2];

        const fd_stat = new wasi.Fdstat(fs_filetype, fs_flags);
        fd_stat.fs_rights_base = fs_rights_base;
        fd_stat.fs_rights_inherited = fs_rights_inheriting;

        return [fd_stat, error];
      },
    );
  }

  fd_fdstat_set_flags(fd: number, flags: number): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_fdstat_set_flags;
      data.u32[1] = fd;
      data.u16[4] = flags;
    });
  }

  fd_fdstat_set_rights(
    fd: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
  ): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_fdstat_set_rights;
      data.u32[1] = fd;
      data.u64[1] = fs_rights_base;
      data.u64[2] = fs_rights_inheriting;
    });
  }

  fd_filestat_get(
    fd: number,
  ): [wasi.Filestat, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_filestat_get;
        data.u32[1] = fd;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const fs_dev = data.u64[0];
        const fs_ino = data.u64[1];
        const fs_filetype = data.u8[16];
        const fs_nlink = data.u64[3];
        const fs_size = data.u64[4];
        const fs_atim = data.u64[5];
        const fs_mtim = data.u64[6];
        const fs_ctim = data.u64[7];

        const file_stat = new wasi.Filestat(fs_filetype, fs_size);
        file_stat.dev = fs_dev;
        file_stat.ino = fs_ino;
        file_stat.nlink = fs_nlink;
        file_stat.atim = fs_atim;
        file_stat.mtim = fs_mtim;
        file_stat.ctim = fs_ctim;

        return [file_stat, error];
      },
    );
  }

  fd_filestat_set_size(fd: number, size: bigint): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_filestat_set_size;
      data.u32[1] = fd;
      data.u64[1] = size;
    });
  }

  fd_filestat_set_times(
    fd: number,
    st_atim: bigint,
    st_mtim: bigint,
    fst_flags: number,
  ): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_filestat_set_times;
      data.u32[1] = fd;
      data.u64[1] = st_atim;
      data.u64[2] = st_mtim;
      data.u16[12] = fst_flags;
    });
  }

  fd_pread(
    fd: number,
    iovs: Uint32Array,
    offset: bigint,
  ): [[number, Uint8Array], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_pread;
        data.u32[1] = fd;
        [data.u32[2], data.u32[3]] = this.allocator.block_write(iovs);
        data.u64[2] = offset;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const nread = data.u32[0];
        const buf = this.allocator.get_memory(data.u32[1], data.u32[2]).u8;

        if (nread !== buf.byteLength) {
          throw new Error("pread nread !== buf_len");
        }

        return [[nread, buf], error];
      },
    );
  }

  fd_prestat_get(
    fd: number,
  ): [[number, number], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_prestat_get;
        data.u32[1] = fd;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const pr_tag = data.u32[0];
        const pr_name_len = data.u32[1];

        return [[pr_tag, pr_name_len], error];
      },
    );
  }

  fd_prestat_dir_name(
    fd: number,
    path_len: number,
  ):
    | [Uint8Array, typeof wasi.ERRNO_SUCCESS | typeof wasi.ERRNO_NAMETOOLONG]
    | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_prestat_dir_name;
        data.u32[1] = fd;
        data.u32[2] = path_len;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS && error !== wasi.ERRNO_NAMETOOLONG) {
          return [undefined, error];
        }

        const ret_path = this.allocator.get_memory(data.u32[0], data.u32[1]).u8;
        return [ret_path, error];
      },
    );
  }

  fd_pwrite(
    fd: number,
    write_data: Uint8Array,
    offset: bigint,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_pwrite;
        data.u32[1] = fd;
        [data.u32[2], data.u32[3]] = this.allocator.block_write(write_data);
        data.u64[2] = offset;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const nwritten = data.u32[0];

        return [nwritten, error];
      },
    );
  }

  fd_read(
    fd: number,
    iovs: Uint32Array,
  ): [[number, Uint8Array], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_read;
        data.u32[1] = fd;
        [data.u32[2], data.u32[3]] = this.allocator.block_write(iovs);
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const nread = data.u32[0];
        const buf = this.allocator.get_memory(data.u32[1], data.u32[2]).u8;

        if (nread !== buf.byteLength) {
          throw new Error("read nread !== buf_len");
        }

        return [[nread, buf], error];
      },
    );
  }

  fd_readdir(
    fd: number,
    limit_buf_len: number,
    cookie: bigint,
  ): [[Uint8Array, number], typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_readdir;
        data.u32[1] = fd;
        data.u32[2] = limit_buf_len;
        data.u64[2] = cookie;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const buf = this.allocator.get_memory(data.u32[0], data.u32[1]).u8;
        const buf_used = data.u32[2];

        return [[buf, buf_used], error];
      },
    );
  }

  // fd_renumber(
  //   fd: number,
  //   to: number,
  // ): number {
  //   return this.call_double_fd(fd, to, data => {
  //     data.u32[0] = FuncNames.fd_renumber;
  //     data.u32[1] = fd;
  //     data.u32[2] = to;
  //   });
  // }

  fd_seek(
    fd: number,
    offset: bigint,
    whence: number,
  ): [bigint, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_seek;
        data.u32[1] = fd;
        data.u64[1] = offset;
        data.u8[16] = whence;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const new_offset = data.u64[0];

        return [new_offset, error];
      },
    );
  }

  fd_sync(fd: number): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.fd_sync;
      data.u32[1] = fd;
    });
  }

  fd_tell(
    fd: number,
  ): [bigint, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_tell;
        data.u32[1] = fd;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const offset = data.u64[0];

        return [offset, error];
      },
    );
  }

  fd_write(
    fd: number,
    write_data: Uint8Array,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.fd_write;
        data.u32[1] = fd;
        [data.u32[2], data.u32[3]] = this.allocator.block_write(write_data);
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const nwritten = data.u32[0];

        return [nwritten, error];
      },
    );
  }

  path_create_directory(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.path_create_directory;
      data.u32[1] = fd;
      [data.u32[2], data.u32[3]] = this.allocator.block_write(path);
    });
  }

  path_filestat_get(
    fd: number,
    flags: number,
    path: Uint8Array,
  ): [wasi.Filestat, typeof wasi.ERRNO_SUCCESS] | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.path_filestat_get;
        data.u32[1] = fd;
        data.u32[2] = flags;
        [data.u32[3], data.u32[4]] = this.allocator.block_write(path);
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const fs_filetype = data.u8[16];
        const fs_size = data.u64[4];

        const file_stat = new wasi.Filestat(fs_filetype, fs_size);
        file_stat.dev = data.u64[0];
        file_stat.ino = data.u64[1];
        file_stat.nlink = data.u64[3];
        file_stat.atim = data.u64[5];
        file_stat.mtim = data.u64[6];
        file_stat.ctim = data.u64[7];

        return [file_stat, error];
      },
    );
  }

  path_filestat_set_times(
    fd: number,
    flags: number,
    path: Uint8Array,
    st_atim: bigint,
    st_mtim: bigint,
    fst_flags: number,
  ): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.path_filestat_set_times;
      data.u32[1] = fd;
      data.u32[2] = flags;
      [data.u32[3], data.u32[4]] = this.allocator.block_write(path);
      data.u64[3] = st_atim;
      data.u64[4] = st_mtim;
      data.u16[12] = fst_flags;
    });
  }

  path_link(
    old_fd: number,
    old_flags: number,
    old_path: Uint8Array,
    new_fd: number,
    new_path: Uint8Array,
  ): number {
    return this.call_double_fd(old_fd, new_fd, (data) => {
      data.u32[0] = FuncNames.path_link;
      data.u32[1] = old_fd;
      data.u32[2] = old_flags;
      [data.u32[3], data.u32[4]] = this.allocator.block_write(old_path);
      data.u32[5] = new_fd;
      [data.u32[6], data.u32[7]] = this.allocator.block_write(new_path);
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
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.path_open;
        data.u32[1] = fd;
        data.u32[2] = dirflags;
        [data.u32[3], data.u32[4]] = this.allocator.block_write(path);
        data.u32[5] = oflags;
        data.u64[3] = fs_rights_base;
        data.u64[4] = fs_rights_inheriting;
        data.u16[20] = fs_flags;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS) {
          return [undefined, error];
        }

        const new_fd = data.u32[0];
        return [new_fd, error];
      },
    );
  }

  path_readlink(
    fd: number,
    path: Uint8Array,
    buf_len: number,
  ):
    | [Uint8Array, typeof wasi.ERRNO_SUCCESS | typeof wasi.ERRNO_NAMETOOLONG]
    | [undefined, number] {
    return this.call_fd(
      fd,
      (data) => {
        data.u32[0] = FuncNames.path_readlink;
        data.u32[1] = fd;
        [data.u32[2], data.u32[3]] = this.allocator.block_write(path);
        data.u32[4] = buf_len;
      },
      (data, error) => {
        if (error !== wasi.ERRNO_SUCCESS && error !== wasi.ERRNO_NAMETOOLONG) {
          return [undefined, error];
        }

        const nread = data.u32[0];
        const ret_path = this.allocator.get_memory(data.u32[1], data.u32[2]).u8;

        const ret_path_slice = ret_path.slice(0, nread);
        return [ret_path_slice, error];
      },
    );
  }

  path_remove_directory(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.path_remove_directory;
      data.u32[1] = fd;
      [data.u32[2], data.u32[3]] = this.allocator.block_write(path);
    });
  }

  path_rename(
    old_fd: number,
    old_path: Uint8Array,
    new_fd: number,
    new_path: Uint8Array,
  ): number {
    return this.call_double_fd(old_fd, new_fd, (data) => {
      data.u32[0] = FuncNames.path_rename;
      data.u32[1] = old_fd;
      [data.u32[2], data.u32[3]] = this.allocator.block_write(old_path);
      data.u32[4] = new_fd;
      [data.u32[5], data.u32[6]] = this.allocator.block_write(new_path);
    });
  }

  path_symlink(old_path: Uint8Array, fd: number, new_path: Uint8Array): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.path_symlink;
      [data.u32[1], data.u32[2]] = this.allocator.block_write(old_path);
      data.u32[3] = fd;
      [data.u32[4], data.u32[5]] = this.allocator.block_write(new_path);
    });
  }

  path_unlink_file(fd: number, path: Uint8Array): number {
    return this.call_fd(fd, (data) => {
      data.u32[0] = FuncNames.path_unlink_file;
      data.u32[1] = fd;
      [data.u32[2], data.u32[3]] = this.allocator.block_write(path);
    });
  }
}
