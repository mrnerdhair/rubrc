import { type Fd, wasi } from "@bjorn3/browser_wasi_shim";
import { WASIFarmPark } from "../park";
import { AllocatorUseArrayBuffer } from "./allocator";
import { FdCloseSenderUseArrayBuffer } from "./fd_close_sender";
import {
  type CallerTarget,
  Listener,
  type ListenerTarget,
  Locker,
  type LockerTarget,
  new_caller_listener_target,
  new_locker_target,
} from "./locking";
import type { ViewSet } from "./locking";
import type { WASIFarmRefUseArrayBufferObject } from "./ref";
import { FuncNames, WASIFarmParkFuncNames } from "./util";

// The largest size is u32 * 18 + 1
// Alignment is troublesome, so make it u32 * 18 + 4
// In other words, one size is 76 bytes
const FD_FUNC_SIG_U32_SIZE = 18;

const MAX_FDS_LEN = 128;

export class WASIFarmParkUseArrayBuffer extends WASIFarmPark {
  private readonly allocator: AllocatorUseArrayBuffer;

  // args and env do not change, so copying them is fine.
  // Functions that do not depend on fds are skipped.
  // Since it is wasm32, the pointer is u32.
  // errno is u8.
  // https://github.com/WebAssembly/WASI/blob/4feaf733e946c375b610cc5d39ea2e1a68046e62/legacy/preview1/docs.md
  // The first item is the function signature, and the second (if it exists) represents data that must be communicated in Park. If they are the same, it is not written.
  // From here, direct access to fd begins.
  // fd_advise: (fd: u32, offset: u64, len: u64, advice: u8) => errno;
  //    (fd: u32) => errno;
  // fd_allocate: (fd: u32, offset: u64, len: u64) => errno;
  // fd_close: (fd: u32) => errno;
  // fd_datasync: (fd: u32) => errno;
  // fd_fdstat_get: (fd: u32, fdstat_ptr: pointer) => errno;
  //    (fd: u32) => [wasi.Fdstat(u32 * 6)], errno];
  // fd_fdstat_set_flags: (fd: u32, flags: u16) => errno;
  // fd_fdstat_set_rights: (fd: u32, fs_rights_base: u64, fs_rights_inheriting: u64) => errno;
  // fd_filestat_get: (fd: u32, filestat_ptr: pointer) => errno;
  //    (fd: u32) => [wasi.Filestat(u32 * 16)], errno];
  // fd_filestat_set_size: (fd: u32, size: u64) => errno;
  // fd_filestat_set_times: (fd: u32, atim: u64, mtim: u64, fst_flags: u16) => errno;
  // fd_pread: (fd: u32, iovs_ptr: pointer, iovs_len: u32, offset: u64) => [u32, errno];
  //    use share_arrays_memory;
  //    (fd: u32, iovs_ptr: pointer, iovs_len: u32, offset: u64) => [u32, data_ptr, errno];
  // fd_prestat_get: (fd: u32, prestat_ptr: pointer) => errno;
  //    (fd: u32) => [wasi.Prestat(u32 * 2)], errno];
  // fd_prestat_dir_name: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
  //    (fd: u32, path_len: u32) => [path_ptr: pointer, path_len: u32, errno];
  // fd_pwrite: (fd: u32, iovs_ptr: pointer, iovs_len: u32, offset: u64) => [u32, errno];
  //    use share_arrays_memory;
  //    (fd: u32, write_data: pointer, write_data_len: u32, offset: u64) => [u32, errno];
  // fd_read: (fd: u32, iovs_ptr: pointer, iovs_len: u32) => [u32, errno];
  //    use share_arrays_memory;
  //    (fd: u32, iovs_ptr: pointer, iovs_len: u32) => [u32, data_ptr, errno];
  // fd_readdir: (fd: u32, buf_ptr: pointer, buf_len: u32, cookie: u64) => [u32, errno];
  //    use share_arrays_memory;
  //    (fd: u32, buf_len: u32, cookie: u64) => [buf_ptr: pointer, buf_len: u32, buf_used: u32, errno];
  // fd_renumber: (fd: u32, to: u32) => errno;
  // fd_seek: (fd: u32, offset: i64, whence: u8) => [u64, errno];
  // fd_sync: (fd: u32) => errno;
  // fd_tell: (fd: u32) => [u64, errno];
  // fd_write: (fd: u32, iovs_ptr: pointer, iovs_len: u32) => [u32, errno];
  //    use share_arrays_memory;
  //    (fd: u32, write_data: pointer, write_data_len: u32) => [u32, errno];
  // path_create_directory: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
  // path_filestat_get: (fd: u32, flags: u32, path_ptr: pointer, path_len: u32) => [wasi.Filestat(u32 * 16), errno];
  // path_filestat_set_times: (fd: u32, flags: u32, path_ptr: pointer, path_len: u32, atim: u64, mtim: u64, fst_flags: u16) => errno;
  // path_link: (old_fd: u32, old_flags: u32, old_path_ptr: pointer, old_path_len: u32, new_fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
  // path_open: (fd: u32, dirflags: u32, path_ptr: pointer, path_len: u32, oflags: u32, fs_rights_base: u64, fs_rights_inheriting: u64, fdflags: u16) => [u32, errno];
  // note: fdsにpushするが、既存のfdに影響しないので、競合しない。
  // path_readlink: (fd: u32, path_ptr: pointer, path_len: u32, buf_ptr: pointer, buf_len: u32) => [u32, errno];
  //    use share_arrays_memory;
  //    (fd: u32, path_ptr: pointer, path_len: u32, buf_len: u32) => [buf_len: u32, data_ptr: pointer, data_len: u32, errno];
  // path_remove_directory: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
  // path_rename: (old_fd: u32, old_path_ptr: pointer, old_path_len: u32, new_fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
  // path_symlink: (old_path_ptr: pointer, old_path_len: u32, fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
  // path_unlink_file: (fd: u32, path_ptr: pointer, path_len: u32) => errno;

  // Lock when you want to use fd
  private readonly lock_fds: Array<{
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
  }>;
  private get_fd_locker(fd_n: number): Locker {
    return new Locker(this.lock_fds[fd_n].lock);
  }
  private get_fd_listener(fd_n: number): Listener {
    return new Listener(this.lock_fds[fd_n].listen);
  }

  // 1 bytes: fds.length
  // 1 bytes: wasi_farm_ref num(id)
  // Actually, as long as it is working properly, fds.length is not used
  private readonly fds_len_and_num: SharedArrayBuffer;
  // listen promise keep
  private readonly listen_fds: Array<Promise<void> | undefined> = [];
  private readonly abort_fds: Array<AbortController | undefined> = [];

  private readonly base_func_util_locks: {
    lock: LockerTarget;
    call: CallerTarget;
    listen: ListenerTarget;
  };
  private readonly locker: Locker;
  private readonly listener: Listener;

  // tell other processes that the file descriptor has been closed
  private readonly fd_close_receiver: FdCloseSenderUseArrayBuffer;

  protected readonly fds: Array<Fd | undefined> = [];
  protected readonly fds_map: Array<number[]>;
  protected readonly stdin: number | undefined;
  protected readonly stdout: number | undefined;
  protected readonly stderr: number | undefined;
  protected readonly default_allow_fds: Array<number>;

  // this is not send by postMessage,
  // so it is not necessary to keep shared_array_buffer
  // this class is not used by user,
  // to avoid mistakes, all constructors are now required to be passed in.
  static async init(
    fds: Array<Fd>,
    // stdin fd number
    stdin: number | undefined,
    // stdout fd number
    stdout: number | undefined,
    // stderr fd number
    stderr: number | undefined,
    // wasi_farm_ref default allow fds
    default_allow_fds: Array<number>,
    allocator_size?: number,
  ): Promise<WASIFarmParkUseArrayBuffer> {
    const fds_map = fds.map(() => []);

    const allocator = await AllocatorUseArrayBuffer.init({
      share_arrays_memory: new SharedArrayBuffer(
        allocator_size ?? 10 * 1024 * 1024,
      ),
      share_arrays_memory_lock: new_locker_target(),
    });
    const lock_fds = new Array(MAX_FDS_LEN).fill(undefined).map(() => {
      const [call, listen] = new_caller_listener_target(
        FD_FUNC_SIG_U32_SIZE * Uint32Array.BYTES_PER_ELEMENT,
      );
      return {
        lock: new_locker_target(),
        call,
        listen,
      };
    });
    const fds_len_and_num = new SharedArrayBuffer(
      2 * Uint32Array.BYTES_PER_ELEMENT,
    );

    const view = new Int32Array(fds_len_and_num);
    Atomics.store(view, 0, fds.length);
    Atomics.store(view, 1, 0);

    const fd_close_receiver = await FdCloseSenderUseArrayBuffer.init();

    const [call, listen] = new_caller_listener_target(
      4 * Int32Array.BYTES_PER_ELEMENT,
    );
    const base_func_util_locks = {
      lock: new_locker_target(),
      call,
      listen,
    };
    const locker = new Locker(base_func_util_locks.lock);
    const listener = new Listener(base_func_util_locks.listen);

    return new WASIFarmParkUseArrayBuffer({
      fds,
      stdin,
      stdout,
      stderr,
      default_allow_fds,
      allocator_size,
      fds_map,
      allocator,
      lock_fds,
      fds_len_and_num,
      fd_close_receiver,
      base_func_util_locks,
      locker,
      listener,
    });
  }

  protected constructor({
    fds,
    stdin,
    stdout,
    stderr,
    default_allow_fds,
    fds_map,
    allocator,
    lock_fds,
    fds_len_and_num,
    fd_close_receiver,
    base_func_util_locks,
    locker,
    listener,
  }: {
    fds: Array<Fd>;
    // stdin fd number
    stdin: number | undefined;
    // stdout fd number
    stdout: number | undefined;
    // stderr fd number
    stderr: number | undefined;
    // wasi_farm_ref default allow fds
    default_allow_fds: Array<number>;
    allocator_size?: number;
    fds_map: Array<number[]>;
    allocator: AllocatorUseArrayBuffer;
    lock_fds: Array<{
      lock: LockerTarget;
      call: CallerTarget;
      listen: ListenerTarget;
    }>;
    fds_len_and_num: SharedArrayBuffer;
    fd_close_receiver: FdCloseSenderUseArrayBuffer;
    base_func_util_locks: {
      lock: LockerTarget;
      call: CallerTarget;
      listen: ListenerTarget;
    };
    locker: Locker;
    listener: Listener;
  }) {
    super();
    this.fds = fds;
    this.fds_map = fds.map(() => []);
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;
    this.default_allow_fds = default_allow_fds;
    this.fds_map = fds_map;
    this.allocator = allocator;
    this.lock_fds = lock_fds;
    this.fds_len_and_num = fds_len_and_num;
    this.fd_close_receiver = fd_close_receiver;
    this.base_func_util_locks = base_func_util_locks;
    this.locker = locker;
    this.listener = listener;
  }

  /// Send this return by postMessage.
  get_ref(): WASIFarmRefUseArrayBufferObject {
    return {
      allocator: this.allocator.get_ref(),
      lock_fds: this.lock_fds,
      fds_len_and_num: this.fds_len_and_num,
      base_func_util_locks: this.base_func_util_locks,
      fd_close_receiver: this.fd_close_receiver.get_ref(),
      stdin: this.stdin,
      stdout: this.stdout,
      stderr: this.stderr,
      default_fds: this.default_allow_fds,
    };
  }

  // abstract methods implementation
  // from fd set ex) path_open
  // received and listen the fd
  // and set fds.length
  protected async notify_set_fd(fd: number): Promise<void> {
    if (this.fds[fd] === undefined) {
      throw new Error("fd is not defined");
    }
    if (fd >= MAX_FDS_LEN) {
      throw new Error("fd is too big. expand is not supported yet");
    }
    if (this.listen_fds[fd] !== undefined) {
      console.warn("fd is already set yet");
      this.abort_fds[fd]?.abort();
      await this.listen_fds[fd];
    }
    const aborter = new AbortController();
    this.abort_fds[fd] = aborter;
    this.listen_fds[fd] = this.listen_fd(fd, aborter.signal);

    const view = new Int32Array(this.fds_len_and_num);
    Atomics.store(view, 0, this.fds.length);
  }

  // abstract methods implementation
  // called by fd close ex) fd_close
  protected async notify_rm_fd(fd: number): Promise<void> {
    this.can_set_new_fd(fd).then(() => {
      this.abort_fds[fd] = undefined;
      this.listen_fds[fd] = undefined;
    });

    await this.fd_close_receiver.send(this.fds_map[fd], fd);

    this.fds_map[fd] = [];
  }

  // abstract methods implementation
  // wait to close old listener
  protected async can_set_new_fd(fd: number): Promise<void> {
    this.abort_fds[fd]?.abort();
    await this.listen_fds[fd];
  }

  // listen all fds and base
  // Must be called before was_ref_id is instantiated
  listen(aborter: AbortSignal) {
    this.abort_fds.length = 0;
    this.listen_fds.length = 0;
    for (let i = 0; i < this.fds.length; i++) {
      const fd_aborter = new AbortController();
      aborter.addEventListener("abort", () => fd_aborter.abort());
      this.abort_fds.push(fd_aborter);
      this.listen_fds.push(this.listen_fd(i, fd_aborter.signal));
    }
    return this.listen_base(aborter);
  }

  // listen base
  // ex) set_fds_map
  // if close fd and send to other process,
  // it need targets wasi_farm_ref id
  // so, set fds_map
  async listen_base(aborter: AbortSignal) {
    this.locker.reset();

    const listener = this.listener;
    listener.reset();
    while (!aborter.aborted) {
      await listener.listen(async (data) => {
        const func_number = data.i32[0];
        switch (func_number) {
          case WASIFarmParkFuncNames.set_fds_map: {
            const wasi_farm_ref_id = data.i32[1];
            const ptr = data.i32[2];
            const len = data.i32[3];
            const fd_buf = new Uint32Array(this.allocator.get_memory(ptr, len));
            try {
              this.set_fds_map(wasi_farm_ref_id, fd_buf);
            } finally {
              this.allocator.free(ptr, len);
            }
            break;
          }
          default: {
            throw new Error(`unexpected func_number ${func_number}`);
          }
        }
      });
    }
  }

  private set_fds_map(wasi_farm_ref_id: number, fd_buf: Uint32Array) {
    for (const fd of fd_buf) {
      if (this.fds_map[fd] === undefined) {
        this.fds_map[fd] = [];
        throw new Error("listen_base fd is not defined");
      }
      this.fds_map[fd].push(wasi_farm_ref_id);
    }
  }

  private make_listen_fd_handlers(
    data: ViewSet,
  ): Partial<Record<keyof typeof FuncNames, () => Promise<number>>> {
    return {
      // fd_advise: (fd: u32) => errno;
      fd_advise: async () => {
        const fd = data.u32[1];

        return this.fd_advise(fd);
      },
      // fd_allocate: (fd: u32, offset: u64, len: u64) => errno;
      fd_allocate: async () => {
        const fd = data.u32[1];
        const offset = data.u64[1];
        const len = data.u64[2];

        return this.fd_allocate(fd, offset, len);
      },
      // fd_close: (fd: u32) => errno;
      fd_close: async () => {
        const fd = data.u32[1];

        return await this.fd_close(fd);
      },
      // fd_datasync: (fd: u32) => errno;
      fd_datasync: async () => {
        const fd = data.u32[1];

        return this.fd_datasync(fd);
      },
      // fd_fdstat_get: (fd: u32) => [wasi.Fdstat(u32 * 6)], errno];
      fd_fdstat_get: async () => {
        const fd = data.u32[1];

        const [fdstat, ret] = this.fd_fdstat_get(fd);
        if (fdstat) {
          data.u8[0] = fdstat.fs_filetype;
          data.u16[2] = fdstat.fs_flags;
          data.u64[1] = fdstat.fs_rights_base;
          data.u64[2] = fdstat.fs_rights_inherited;
        }
        return ret;
      },
      // fd_fdstat_set_flags: (fd: u32, flags: u16) => errno;
      fd_fdstat_set_flags: async () => {
        const fd = data.u32[1];
        const flags = data.u16[4];

        return this.fd_fdstat_set_flags(fd, flags);
      },
      // fd_fdstat_set_rights: (fd: u32, fs_rights_base: u64, fs_rights_inheriting: u64) => errno;
      fd_fdstat_set_rights: async () => {
        const fd = data.u32[1];
        const fs_rights_base = data.u64[1];
        const fs_rights_inheriting = data.u64[2];

        return this.fd_fdstat_set_rights(
          fd,
          fs_rights_base,
          fs_rights_inheriting,
        );
      },
      // fd_filestat_get: (fd: u32) => [wasi.Filestat(u32 * 16)], errno];
      fd_filestat_get: async () => {
        const fd = data.u32[1];

        const [filestat, ret] = this.fd_filestat_get(fd);
        if (filestat) {
          data.u64[0] = filestat.dev;
          data.u64[1] = filestat.ino;
          data.u8[16] = filestat.filetype;
          data.u64[3] = filestat.nlink;
          data.u64[4] = filestat.size;
          data.u64[5] = filestat.atim;
          data.u64[6] = filestat.mtim;
          data.u64[7] = filestat.ctim;
        }
        return ret;
      },
      // fd_filestat_set_size: (fd: u32, size: u64) => errno;
      fd_filestat_set_size: async () => {
        const fd = data.u32[1];
        const size = data.u64[1];

        return this.fd_filestat_set_size(fd, size);
      },
      // fd_filestat_set_times: (fd: u32, atim: u64, mtim: u64, fst_flags: u16) => errno;
      fd_filestat_set_times: async () => {
        const fd = data.u32[1];
        const atim = data.u64[1];
        const mtim = data.u64[2];
        const fst_flags = data.u16[12];

        return this.fd_filestat_set_times(fd, atim, mtim, fst_flags);
      },
      // fd_pread: (fd: u32, iovs_ptr: pointer, iovs_len: u32, offset: u64) => [u32, data_ptr, errno];
      fd_pread: async () => {
        const fd = data.u32[1];
        const iovs_ptr = data.u32[2];
        const iovs_ptr_len = data.u32[3];
        const offset = data.u64[2];

        const iovs = new Uint32Array(
          this.allocator.get_memory(iovs_ptr, iovs_ptr_len),
        );
        this.allocator.free(iovs_ptr, iovs_ptr_len);

        const iovecs = new Array<wasi.Iovec>();
        for (let i = 0; i < iovs_ptr_len; i += 8) {
          const iovec = new wasi.Iovec();
          iovec.buf = iovs[i * 2];
          iovec.buf_len = iovs[i * 2 + 1];
          iovecs.push(iovec);
        }

        const [nread_and_buffer, error] = this.fd_pread(fd, iovecs, offset);
        if (nread_and_buffer !== undefined) {
          const [nread, buffer8] = nread_and_buffer;
          data.u32[0] = nread;
          await this.allocator.async_write(buffer8, data.i32, 1);
        }
        return error;
      },
      // fd_prestat_get: (fd: u32) => [wasi.Prestat(u32 * 2)], errno];
      fd_prestat_get: async () => {
        const fd = data.u32[1];

        const [prestat, ret] = this.fd_prestat_get(fd);
        if (prestat) {
          data.u32[0] = prestat.tag;
          data.u32[1] = prestat.inner.pr_name.byteLength;
        }
        return ret;
      },
      // fd_prestat_dir_name: (fd: u32, path_len: u32) => [path_ptr: pointer, path_len: u32, errno];
      fd_prestat_dir_name: async () => {
        const fd = data.u32[1];
        const path_len = data.u32[2];

        const [prestat_dir_name, ret] = this.fd_prestat_dir_name(fd, path_len);
        if (
          prestat_dir_name &&
          (ret === wasi.ERRNO_SUCCESS || ret === wasi.ERRNO_NAMETOOLONG)
        ) {
          await this.allocator.async_write(prestat_dir_name, data.i32, 0);
        }
        return ret;
      },
      // fd_pwrite: (fd: u32, write_data: pointer, write_data_len: u32, offset: u64) => [u32, errno];
      fd_pwrite: async () => {
        const fd = data.u32[1];
        const write_data_ptr = data.u32[2];
        const write_data_len = data.u32[3];
        const offset = data.u64[2];

        const write_data = new Uint8Array(
          this.allocator.get_memory(write_data_ptr, write_data_len),
        );
        this.allocator.free(write_data_ptr, write_data_len);

        const [nwritten, error] = this.fd_pwrite(fd, write_data, offset);
        if (nwritten !== undefined) {
          data.u32[0] = nwritten;
        }
        return error;
      },
      // fd_read: (fd: u32, iovs_ptr: pointer, iovs_len: u32) => [u32, data_ptr, errno];
      fd_read: async () => {
        const fd = data.u32[1];
        const iovs_ptr = data.u32[2];
        const iovs_ptr_len = data.u32[3];
        const iovs = new Uint32Array(
          this.allocator.get_memory(iovs_ptr, iovs_ptr_len),
        );
        this.allocator.free(iovs_ptr, iovs_ptr_len);

        const iovecs = new Array<wasi.Iovec>();
        for (let i = 0; i < iovs_ptr_len; i += 8) {
          const iovec = new wasi.Iovec();
          iovec.buf = iovs[i * 2];
          iovec.buf_len = iovs[i * 2 + 1];
          iovecs.push(iovec);
        }

        const [nread_and_buffer, error] = this.fd_read(fd, iovecs);

        if (nread_and_buffer !== undefined) {
          const [nread, buffer8] = nread_and_buffer;
          data.u32[0] = nread;
          await this.allocator.async_write(buffer8, data.i32, 1);
        }
        return error;
      },
      // fd_readdir: (fd: u32, buf_len: u32, cookie: u64) => [buf_ptr: pointer, buf_len: u32, buf_used: u32, errno];
      fd_readdir: async () => {
        const fd = data.u32[1];
        const buf_len = data.u32[2];
        const cookie = data.u64[2];

        const [array_and_buf_used, error] = this.fd_readdir(
          fd,
          buf_len,
          cookie,
        );
        if (array_and_buf_used) {
          const [array, buf_used] = array_and_buf_used;
          await this.allocator.async_write(array, data.i32, 0);
          data.u32[2] = buf_used;
        }
        return error;
      },
      // fd_seek: (fd: u32, offset: i64, whence: u8) => [u64, errno];
      fd_seek: async () => {
        const fd = data.u32[1];
        const offset = data.u64[1];
        const whence = data.u8[16];

        const [new_offset, error] = this.fd_seek(fd, offset, whence);
        if (new_offset !== undefined) {
          data.u64[0] = new_offset;
        }
        return error;
      },
      // fd_sync: (fd: u32) => errno;
      fd_sync: async () => {
        const fd = data.u32[1];

        return this.fd_sync(fd);
      },
      // fd_tell: (fd: u32) => [u64, errno];
      fd_tell: async () => {
        const fd = data.u32[1];

        const [offset, error] = this.fd_tell(fd);
        if (offset !== undefined) {
          data.u64[0] = offset;
        }
        return error;
      },
      // fd_write: (fd: u32, write_data: pointer, write_data_len: u32) => [u32, errno];
      fd_write: async () => {
        const fd = data.u32[1];
        const write_data_ptr = data.u32[2];
        const write_data_len = data.u32[3];

        const write_data = new Uint8Array(
          this.allocator.get_memory(write_data_ptr, write_data_len),
        );
        this.allocator.free(write_data_ptr, write_data_len);

        const [nwritten, error] = await this.fd_write(fd, write_data);
        if (nwritten !== undefined) {
          data.u32[0] = nwritten;
        }
        return error;
      },
      // path_create_directory: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
      path_create_directory: async () => {
        const fd = data.u32[1];
        const path_ptr = data.u32[2];
        const path_len = data.u32[3];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_create_directory(fd, path_str);
      },
      // path_filestat_get: (fd: u32, flags: u32, path_ptr: pointer, path_len: u32) => [wasi.Filestat(u32 * 16), errno];
      path_filestat_get: async () => {
        const fd = data.u32[1];
        const flags = data.u32[2];
        const path_ptr = data.u32[3];
        const path_len = data.u32[4];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        const [filestat, ret] = this.path_filestat_get(fd, flags, path_str);
        if (filestat) {
          data.u64[0] = filestat.dev;
          data.u64[1] = filestat.ino;
          data.u8[16] = filestat.filetype;
          data.u64[3] = filestat.nlink;
          data.u64[4] = filestat.size;
          data.u64[5] = filestat.atim;
          data.u64[6] = filestat.mtim;
          data.u64[7] = filestat.ctim;
        }
        return ret;
      },
      // path_filestat_set_times: (fd: u32, flags: u32, path_ptr: pointer, path_len: u32, atim: u64, mtim: u64, fst_flags: u16) => errno;
      path_filestat_set_times: async () => {
        const fd = data.u32[1];
        const flags = data.u32[2];
        const path_ptr = data.u32[3];
        const path_len = data.u32[4];
        const atim = data.u64[3];
        const mtim = data.u64[4];
        const fst_flags = data.u16[12];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_filestat_set_times(
          fd,
          flags,
          path_str,
          atim,
          mtim,
          fst_flags,
        );
      },
      // path_link: (old_fd: u32, old_flags: u32, old_path_ptr: pointer, old_path_len: u32, new_fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
      path_link: async () => {
        const old_fd = data.u32[1];
        const old_flags = data.u32[2];
        const old_path_ptr = data.u32[3];
        const old_path_len = data.u32[4];
        const new_fd = data.u32[5];
        const new_path_ptr = data.u32[6];
        const new_path_len = data.u32[7];

        const old_path = new Uint8Array(
          this.allocator.get_memory(old_path_ptr, old_path_len),
        );
        const old_path_str = new TextDecoder().decode(old_path);
        this.allocator.free(old_path_ptr, old_path_len);
        const new_path = new Uint8Array(
          this.allocator.get_memory(new_path_ptr, new_path_len),
        );
        const new_path_str = new TextDecoder().decode(new_path);
        this.allocator.free(new_path_ptr, new_path_len);

        return this.path_link(
          old_fd,
          old_flags,
          old_path_str,
          new_fd,
          new_path_str,
        );
      },
      // path_open: (fd: u32, dirflags: u32, path_ptr: pointer, path_len: u32, oflags: u32, fs_rights_base: u64, fs_rights_inheriting: u64, fdflags: u16) => [u32, errno];
      path_open: async () => {
        const fd = data.u32[1];
        const dirflags = data.u32[2];
        const path_ptr = data.u32[3];
        const path_len = data.u32[4];
        const oflags = data.u32[5];
        const fs_rights_base = data.u64[3];
        const fs_rights_inheriting = data.u64[4];
        const fd_flags = data.u16[20];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        const [opened_fd, error] = await this.path_open(
          fd,
          dirflags,
          path_str,
          oflags,
          fs_rights_base,
          fs_rights_inheriting,
          fd_flags,
        );
        if (opened_fd !== undefined) {
          data.u32[0] = opened_fd;
        }
        return error;
      },
      // path_readlink: (fd: u32, path_ptr: pointer, path_len: u32, buf_len: u32) => [buf_len: u32, data_ptr: pointer, data_len: u32, errno];
      path_readlink: async () => {
        const fd = data.u32[1];
        const path_ptr = data.u32[2];
        const path_len = data.u32[3];
        const buf_len = data.u32[4];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        const [buf, error] = this.path_readlink(fd, path_str, buf_len);
        if (buf) {
          await this.allocator.async_write(buf, data.i32, 1);
          data.u32[0] = buf.byteLength;
        }
        return error;
      },
      // path_remove_directory: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
      path_remove_directory: async () => {
        const fd = data.u32[1];
        const path_ptr = data.u32[2];
        const path_len = data.u32[3];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_remove_directory(fd, path_str);
      },
      // path_rename: (old_fd: u32, old_path_ptr: pointer, old_path_len: u32, new_fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
      path_rename: async () => {
        const fd = data.u32[1];
        const old_path_ptr = data.u32[2];
        const old_path_len = data.u32[3];
        const new_fd = data.u32[4];
        const new_path_ptr = data.u32[5];
        const new_path_len = data.u32[6];

        const old_path = new Uint8Array(
          this.allocator.get_memory(old_path_ptr, old_path_len),
        );
        const old_path_str = new TextDecoder().decode(old_path);
        this.allocator.free(old_path_ptr, old_path_len);
        const new_path = new Uint8Array(
          this.allocator.get_memory(new_path_ptr, new_path_len),
        );
        const new_path_str = new TextDecoder().decode(new_path);
        this.allocator.free(new_path_ptr, new_path_len);

        return this.path_rename(fd, old_path_str, new_fd, new_path_str);
      },
      // path_symlink: (old_path_ptr: pointer, old_path_len: u32, fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
      path_symlink: async () => {
        const old_path_ptr = data.u32[1];
        const old_path_len = data.u32[2];
        const fd = data.u32[3];
        const new_path_ptr = data.u32[4];
        const new_path_len = data.u32[5];

        const old_path = new Uint8Array(
          this.allocator.get_memory(old_path_ptr, old_path_len),
        );
        const old_path_str = new TextDecoder().decode(old_path);
        this.allocator.free(old_path_ptr, old_path_len);
        const new_path = new Uint8Array(
          this.allocator.get_memory(new_path_ptr, new_path_len),
        );
        const new_path_str = new TextDecoder().decode(new_path);
        this.allocator.free(new_path_ptr, new_path_len);

        return this.path_symlink(old_path_str, fd, new_path_str);
      },
      // path_unlink_file: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
      path_unlink_file: async () => {
        const fd = data.u32[1];
        const path_ptr = data.u32[2];
        const path_len = data.u32[3];

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_unlink_file(fd, path_str);
      },
    } as const;
  }

  // listen fd
  async listen_fd(fd_n: number, aborter: AbortSignal) {
    this.get_fd_locker(fd_n).reset();

    const listener = this.get_fd_listener(fd_n);
    listener.reset();
    while (!aborter.aborted && this.fds[fd_n] !== undefined) {
      await listener.listen(async (data) => {
        try {
          const handlers = this.make_listen_fd_handlers(data);
          const func_number = data.u32[0];
          const func_name = FuncNames[func_number] as keyof typeof FuncNames;
          const handler =
            handlers[func_name] ??
            (() => {
              throw new Error(`Unknown function number: ${func_number}`);
            });
          data.i32[data.i32.length - 1] = await handler();
        } catch (e) {
          data.i32[16] = -1;

          throw e;
        }
      });
    }
  }
}
