import { type Fd, wasi } from "@bjorn3/browser_wasi_shim";
import { WASIFarmPark } from "../park";
import { AllocatorUseArrayBuffer } from "./allocator";
import { FdCloseSenderUseArrayBuffer } from "./fd_close_sender";
import { type AtomicTarget, Locker, new_atomic_target } from "./locking";
import { Listener } from "./locking/listener";
import type { WASIFarmRefUseArrayBufferObject } from "./ref";
import { FuncNames } from "./util";

export const fd_func_sig_u32_size: number = 18;
export const fd_func_sig_bytes: number = fd_func_sig_u32_size * 4;

export class WASIFarmParkUseArrayBuffer extends WASIFarmPark {
  private allocator: AllocatorUseArrayBuffer;

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
  private lock_fds: Array<{
    lock: AtomicTarget;
    call_func: AtomicTarget;
  }>;

  // 1 bytes: fds.length
  // 1 bytes: wasi_farm_ref num(id)
  // Actually, as long as it is working properly, fds.length is not used
  private fds_len_and_num: SharedArrayBuffer;

  // listen promise keep
  private listen_fds: Array<Promise<void> | undefined> = [];

  // The largest size is u32 * 18 + 1
  // Alignment is troublesome, so make it u32 * 18 + 4
  // In other words, one size is 76 bytes
  private fd_func_sig: SharedArrayBuffer;

  // listen base lock and call etc
  private base_func_util: SharedArrayBuffer;
  private base_func_util_locks: Record<"lock" | "call", AtomicTarget>;

  // tell other processes that the file descriptor has been closed
  private fd_close_receiver: FdCloseSenderUseArrayBuffer;

  // this is not send by postMessage,
  // so it is not necessary to keep shared_array_buffer
  // this class is not used by user,
  // to avoid mistakes, all constructors are now required to be passed in.
  constructor(
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
  ) {
    super(fds, stdin, stdout, stderr, default_allow_fds);

    if (allocator_size === undefined) {
      this.allocator = new AllocatorUseArrayBuffer();
    } else {
      this.allocator = new AllocatorUseArrayBuffer({
        share_arrays_memory: new SharedArrayBuffer(allocator_size),
      });
    }
    const max_fds_len = 128;
    this.lock_fds = new Array(max_fds_len).fill(undefined).map(() => ({
      lock: new_atomic_target(),
      call_func: new_atomic_target(),
    }));
    this.fd_func_sig = new SharedArrayBuffer(
      fd_func_sig_u32_size * 4 * max_fds_len,
    );
    this.fds_len_and_num = new SharedArrayBuffer(8);

    const view = new Int32Array(this.fds_len_and_num);
    Atomics.store(view, 0, fds.length);
    Atomics.store(view, 1, 0);

    this.fd_close_receiver = new FdCloseSenderUseArrayBuffer();
    this.base_func_util = new SharedArrayBuffer(24);
    this.base_func_util_locks = {
      lock: new_atomic_target(),
      call: new_atomic_target(),
    };
  }

  /// Send this return by postMessage.
  get_ref(): WASIFarmRefUseArrayBufferObject {
    return {
      allocator: this.allocator.get_ref(),
      lock_fds: this.lock_fds,
      fds_len_and_num: this.fds_len_and_num,
      fd_func_sig: this.fd_func_sig,
      base_func_util: this.base_func_util,
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
  async notify_set_fd(fd: number) {
    if (this.fds[fd] === undefined) {
      throw new Error("fd is not defined");
    }
    if (fd >= 128) {
      throw new Error("fd is too big. expand is not supported yet");
    }
    if (this.listen_fds[fd] !== undefined) {
      if (this.listen_fds[fd] instanceof Promise) {
        console.warn("fd is already set yet");
        await this.listen_fds[fd];
      }
    }
    this.listen_fds[fd] = this.listen_fd(fd);

    const view = new Int32Array(this.fds_len_and_num);
    Atomics.store(view, 0, this.fds.length);
  }

  // abstract methods implementation
  // called by fd close ex) fd_close
  async notify_rm_fd(fd: number) {
    (async () => {
      await this.listen_fds[fd];
      this.listen_fds[fd] = undefined;
    })();

    await this.fd_close_receiver.send(this.fds_map[fd], fd);

    this.fds_map[fd] = [];
  }

  // abstract methods implementation
  // wait to close old listener
  can_set_new_fd(fd: number): [boolean, Promise<void> | undefined] {
    if (this.listen_fds[fd] instanceof Promise) {
      return [false, this.listen_fds[fd]];
    }
    return [true, undefined];
  }

  // listen all fds and base
  // Must be called before was_ref_id is instantiated
  listen() {
    this.listen_fds = [];
    for (let n = 0; n < this.fds.length; n++) {
      this.listen_fds.push(this.listen_fd(n));
    }
    return this.listen_base();
  }

  // listen base
  // ex) set_fds_map
  // if close fd and send to other process,
  // it need targets wasi_farm_ref id
  // so, set fds_map
  async listen_base() {
    const lock_view = new Int32Array(this.base_func_util);
    new Locker(this.base_func_util_locks.lock).reset();

    const listener = new Listener(this.base_func_util_locks.call);
    listener.reset();
    while (true) {
      await listener.listen(async () => {
        const func_number = Atomics.load(lock_view, 2);
        switch (func_number) {
          // set_fds_map: (fds_ptr: u32, fds_len: u32);
          case 0: {
            const ptr = Atomics.load(lock_view, 3);
            const len = Atomics.load(lock_view, 4);
            const data = new Uint32Array(this.allocator.get_memory(ptr, len));
            this.allocator.free(ptr, len);
            const wasi_farm_ref_id = Atomics.load(lock_view, 5);

            for (let i = 0; i < len / 4; i++) {
              const fd = data[i];
              if (this.fds_map[fd] === undefined) {
                this.fds_map[fd] = [];
                throw new Error("listen_base fd is not defined");
              }
              this.fds_map[fd].push(wasi_farm_ref_id);
            }

            break;
          }
          default: {
            console.warn(`unexpected func_number ${func_number}`);
            break;
          }
        }
      });
    }
  }

  // listen fd
  async listen_fd(fd_n: number) {
    const bytes_offset = fd_n * fd_func_sig_bytes;
    const func_sig_view_u8 = new Uint8Array(this.fd_func_sig, bytes_offset);
    const func_sig_view_u16 = new Uint16Array(this.fd_func_sig, bytes_offset);
    const func_sig_view_i32 = new Int32Array(this.fd_func_sig, bytes_offset);
    const func_sig_view_u32 = new Int32Array(this.fd_func_sig, bytes_offset);
    const func_sig_view_u64 = new BigUint64Array(
      this.fd_func_sig,
      bytes_offset,
    );
    const errno_offset = fd_func_sig_u32_size - 1;
    new Locker(this.lock_fds[fd_n].lock).reset();
    Atomics.store(func_sig_view_i32, errno_offset, -1);

    const handlers: Partial<
      Record<keyof typeof FuncNames, () => Promise<number>>
    > = {
      // fd_advise: (fd: u32) => errno;
      fd_advise: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        return this.fd_advise(fd);
      },
      // fd_allocate: (fd: u32, offset: u64, len: u64) => errno;
      fd_allocate: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const offset = Atomics.load(func_sig_view_u64, 1);
        const len = Atomics.load(func_sig_view_u64, 2);

        return this.fd_allocate(fd, offset, len);
      },
      // fd_close: (fd: u32) => errno;
      fd_close: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        return await this.fd_close(fd);
      },
      // fd_datasync: (fd: u32) => errno;
      fd_datasync: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        return this.fd_datasync(fd);
      },
      // fd_fdstat_get: (fd: u32) => [wasi.Fdstat(u32 * 6)], errno];
      fd_fdstat_get: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        const [fdstat, ret] = this.fd_fdstat_get(fd);
        if (fdstat) {
          Atomics.store(func_sig_view_u8, 0, fdstat.fs_filetype);
          Atomics.store(func_sig_view_u16, 2, fdstat.fs_flags);
          Atomics.store(func_sig_view_u64, 1, fdstat.fs_rights_base);
          Atomics.store(func_sig_view_u64, 2, fdstat.fs_rights_inherited);
        }
        return ret;
      },
      // fd_fdstat_set_flags: (fd: u32, flags: u16) => errno;
      fd_fdstat_set_flags: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const flags = Atomics.load(func_sig_view_u16, 4);

        return this.fd_fdstat_set_flags(fd, flags);
      },
      // fd_fdstat_set_rights: (fd: u32, fs_rights_base: u64, fs_rights_inheriting: u64) => errno;
      fd_fdstat_set_rights: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const fs_rights_base = Atomics.load(func_sig_view_u64, 1);
        const fs_rights_inheriting = Atomics.load(func_sig_view_u64, 2);

        return this.fd_fdstat_set_rights(
          fd,
          fs_rights_base,
          fs_rights_inheriting,
        );
      },
      // fd_filestat_get: (fd: u32) => [wasi.Filestat(u32 * 16)], errno];
      fd_filestat_get: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        const [filestat, ret] = this.fd_filestat_get(fd);
        if (filestat) {
          Atomics.store(func_sig_view_u64, 0, filestat.dev);
          Atomics.store(func_sig_view_u64, 1, filestat.ino);
          Atomics.store(func_sig_view_u8, 16, filestat.filetype);
          Atomics.store(func_sig_view_u64, 3, filestat.nlink);
          Atomics.store(func_sig_view_u64, 4, filestat.size);
          Atomics.store(func_sig_view_u64, 5, filestat.atim);
          Atomics.store(func_sig_view_u64, 6, filestat.mtim);
          Atomics.store(func_sig_view_u64, 7, filestat.ctim);
        }
        return ret;
      },
      // fd_filestat_set_size: (fd: u32, size: u64) => errno;
      fd_filestat_set_size: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const size = Atomics.load(func_sig_view_u64, 1);

        return this.fd_filestat_set_size(fd, size);
      },
      // fd_filestat_set_times: (fd: u32, atim: u64, mtim: u64, fst_flags: u16) => errno;
      fd_filestat_set_times: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const atim = Atomics.load(func_sig_view_u64, 1);
        const mtim = Atomics.load(func_sig_view_u64, 2);
        const fst_flags = Atomics.load(func_sig_view_u16, 12);

        return this.fd_filestat_set_times(fd, atim, mtim, fst_flags);
      },
      // fd_pread: (fd: u32, iovs_ptr: pointer, iovs_len: u32, offset: u64) => [u32, data_ptr, errno];
      fd_pread: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const iovs_ptr = Atomics.load(func_sig_view_u32, 2);
        const iovs_ptr_len = Atomics.load(func_sig_view_u32, 3);
        const offset = Atomics.load(func_sig_view_u64, 2);
        const data = new Uint32Array(
          this.allocator.get_memory(iovs_ptr, iovs_ptr_len),
        );
        this.allocator.free(iovs_ptr, iovs_ptr_len);

        const iovecs = new Array<wasi.Iovec>();
        for (let i = 0; i < iovs_ptr_len; i += 8) {
          const iovec = new wasi.Iovec();
          iovec.buf = data[i * 2];
          iovec.buf_len = data[i * 2 + 1];
          iovecs.push(iovec);
        }

        const [nread_and_buffer, error] = this.fd_pread(fd, iovecs, offset);
        if (nread_and_buffer !== undefined) {
          const [nread, buffer8] = nread_and_buffer;
          Atomics.store(func_sig_view_u32, 0, nread);
          await this.allocator.async_write(
            buffer8,
            new Int32Array(this.fd_func_sig),
            fd * fd_func_sig_u32_size + 1,
          );
        }
        return error;
      },
      // fd_prestat_get: (fd: u32) => [wasi.Prestat(u32 * 2)], errno];
      fd_prestat_get: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        const [prestat, ret] = this.fd_prestat_get(fd);
        if (prestat) {
          Atomics.store(func_sig_view_u32, 0, prestat.tag);
          Atomics.store(func_sig_view_u32, 1, prestat.inner.pr_name.byteLength);
        }
        return ret;
      },
      // fd_prestat_dir_name: (fd: u32, path_len: u32) => [path_ptr: pointer, path_len: u32, errno];
      fd_prestat_dir_name: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const path_len = Atomics.load(func_sig_view_u32, 2);

        const [prestat_dir_name, ret] = this.fd_prestat_dir_name(fd, path_len);
        if (
          prestat_dir_name &&
          (ret === wasi.ERRNO_SUCCESS || ret === wasi.ERRNO_NAMETOOLONG)
        ) {
          await this.allocator.async_write(
            prestat_dir_name,
            new Int32Array(this.fd_func_sig),
            fd * fd_func_sig_u32_size,
          );
        }
        return ret;
      },
      // fd_pwrite: (fd: u32, write_data: pointer, write_data_len: u32, offset: u64) => [u32, errno];
      fd_pwrite: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const write_data_ptr = Atomics.load(func_sig_view_u32, 2);
        const write_data_len = Atomics.load(func_sig_view_u32, 3);
        const offset = Atomics.load(func_sig_view_u64, 2);

        const data = new Uint8Array(
          this.allocator.get_memory(write_data_ptr, write_data_len),
        );
        this.allocator.free(write_data_ptr, write_data_len);

        const [nwritten, error] = this.fd_pwrite(fd, data, offset);
        if (nwritten !== undefined) {
          Atomics.store(func_sig_view_u32, 0, nwritten);
        }
        return error;
      },
      // fd_read: (fd: u32, iovs_ptr: pointer, iovs_len: u32) => [u32, data_ptr, errno];
      fd_read: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const iovs_ptr = Atomics.load(func_sig_view_u32, 2);
        const iovs_ptr_len = Atomics.load(func_sig_view_u32, 3);
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
          Atomics.store(func_sig_view_u32, 0, nread);
          await this.allocator.async_write(
            buffer8,
            new Int32Array(this.fd_func_sig),
            fd * fd_func_sig_u32_size + 1,
          );
        }
        return error;
      },
      // fd_readdir: (fd: u32, buf_len: u32, cookie: u64) => [buf_ptr: pointer, buf_len: u32, buf_used: u32, errno];
      fd_readdir: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const buf_len = Atomics.load(func_sig_view_u32, 2);
        const cookie = Atomics.load(func_sig_view_u64, 2);

        const [array_and_buf_used, error] = this.fd_readdir(
          fd,
          buf_len,
          cookie,
        );
        if (array_and_buf_used) {
          const [array, buf_used] = array_and_buf_used;
          await this.allocator.async_write(
            array,
            new Int32Array(this.fd_func_sig),
            fd * fd_func_sig_u32_size,
          );
          Atomics.store(func_sig_view_u32, 2, buf_used);
        }
        return error;
      },
      // fd_seek: (fd: u32, offset: i64, whence: u8) => [u64, errno];
      fd_seek: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const offset = Atomics.load(func_sig_view_u64, 1);
        const whence = Atomics.load(func_sig_view_u8, 16);

        const [new_offset, error] = this.fd_seek(fd, offset, whence);
        if (new_offset !== undefined) {
          Atomics.store(func_sig_view_u64, 0, new_offset);
        }
        return error;
      },
      // fd_sync: (fd: u32) => errno;
      fd_sync: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        return this.fd_sync(fd);
      },
      // fd_tell: (fd: u32) => [u64, errno];
      fd_tell: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);

        const [offset, error] = this.fd_tell(fd);
        if (offset !== undefined) {
          Atomics.store(func_sig_view_u64, 0, offset);
        }
        return error;
      },
      // fd_write: (fd: u32, write_data: pointer, write_data_len: u32) => [u32, errno];
      fd_write: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const write_data_ptr = Atomics.load(func_sig_view_u32, 2);
        const write_data_len = Atomics.load(func_sig_view_u32, 3);

        const data = new Uint8Array(
          this.allocator.get_memory(write_data_ptr, write_data_len),
        );
        this.allocator.free(write_data_ptr, write_data_len);

        const [nwritten, error] = await this.fd_write(fd, data);
        if (nwritten !== undefined) {
          Atomics.store(func_sig_view_u32, 0, nwritten);
        }
        return error;
      },
      // path_create_directory: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
      path_create_directory: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const path_ptr = Atomics.load(func_sig_view_u32, 2);
        const path_len = Atomics.load(func_sig_view_u32, 3);

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_create_directory(fd, path_str);
      },
      // path_filestat_get: (fd: u32, flags: u32, path_ptr: pointer, path_len: u32) => [wasi.Filestat(u32 * 16), errno];
      path_filestat_get: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const flags = Atomics.load(func_sig_view_u32, 2);
        const path_ptr = Atomics.load(func_sig_view_u32, 3);
        const path_len = Atomics.load(func_sig_view_u32, 4);

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        const [filestat, ret] = this.path_filestat_get(fd, flags, path_str);
        if (filestat) {
          Atomics.store(func_sig_view_u64, 0, filestat.dev);
          Atomics.store(func_sig_view_u64, 1, filestat.ino);
          Atomics.store(func_sig_view_u8, 16, filestat.filetype);
          Atomics.store(func_sig_view_u64, 3, filestat.nlink);
          Atomics.store(func_sig_view_u64, 4, filestat.size);
          Atomics.store(func_sig_view_u64, 5, filestat.atim);
          Atomics.store(func_sig_view_u64, 6, filestat.mtim);
          Atomics.store(func_sig_view_u64, 7, filestat.ctim);
        }
        return ret;
      },
      // path_filestat_set_times: (fd: u32, flags: u32, path_ptr: pointer, path_len: u32, atim: u64, mtim: u64, fst_flags: u16) => errno;
      path_filestat_set_times: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const flags = Atomics.load(func_sig_view_u32, 2);
        const path_ptr = Atomics.load(func_sig_view_u32, 3);
        const path_len = Atomics.load(func_sig_view_u32, 4);
        const atim = Atomics.load(func_sig_view_u64, 3);
        const mtim = Atomics.load(func_sig_view_u64, 4);
        const fst_flags = Atomics.load(func_sig_view_u16, 12);

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
        const old_fd = Atomics.load(func_sig_view_u32, 1);
        const old_flags = Atomics.load(func_sig_view_u32, 2);
        const old_path_ptr = Atomics.load(func_sig_view_u32, 3);
        const old_path_len = Atomics.load(func_sig_view_u32, 4);
        const new_fd = Atomics.load(func_sig_view_u32, 5);
        const new_path_ptr = Atomics.load(func_sig_view_u32, 6);
        const new_path_len = Atomics.load(func_sig_view_u32, 7);

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
        const fd = Atomics.load(func_sig_view_u32, 1);
        const dirflags = Atomics.load(func_sig_view_u32, 2);
        const path_ptr = Atomics.load(func_sig_view_u32, 3);
        const path_len = Atomics.load(func_sig_view_u32, 4);
        const oflags = Atomics.load(func_sig_view_u32, 5);
        const fs_rights_base = Atomics.load(func_sig_view_u64, 3);
        const fs_rights_inheriting = Atomics.load(func_sig_view_u64, 4);
        const fd_flags = Atomics.load(func_sig_view_u16, 20);

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
          Atomics.store(func_sig_view_u32, 0, opened_fd);
        }
        return error;
      },
      // path_readlink: (fd: u32, path_ptr: pointer, path_len: u32, buf_len: u32) => [buf_len: u32, data_ptr: pointer, data_len: u32, errno];
      path_readlink: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const path_ptr = Atomics.load(func_sig_view_u32, 2);
        const path_len = Atomics.load(func_sig_view_u32, 3);
        const buf_len = Atomics.load(func_sig_view_u32, 4);

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        const [buf, error] = this.path_readlink(fd, path_str, buf_len);
        if (buf) {
          await this.allocator.async_write(
            buf,
            new Int32Array(this.fd_func_sig),
            fd * fd_func_sig_u32_size + 1,
          );
          Atomics.store(func_sig_view_u32, 0, buf.byteLength);
        }
        return error;
      },
      // path_remove_directory: (fd: u32, path_ptr: pointer, path_len: u32) => errno;
      path_remove_directory: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const path_ptr = Atomics.load(func_sig_view_u32, 2);
        const path_len = Atomics.load(func_sig_view_u32, 3);

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_remove_directory(fd, path_str);
      },
      // path_rename: (old_fd: u32, old_path_ptr: pointer, old_path_len: u32, new_fd: u32, new_path_ptr: pointer, new_path_len: u32) => errno;
      path_rename: async () => {
        const fd = Atomics.load(func_sig_view_u32, 1);
        const old_path_ptr = Atomics.load(func_sig_view_u32, 2);
        const old_path_len = Atomics.load(func_sig_view_u32, 3);
        const new_fd = Atomics.load(func_sig_view_u32, 4);
        const new_path_ptr = Atomics.load(func_sig_view_u32, 5);
        const new_path_len = Atomics.load(func_sig_view_u32, 6);

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
        const old_path_ptr = Atomics.load(func_sig_view_u32, 1);
        const old_path_len = Atomics.load(func_sig_view_u32, 2);
        const fd = Atomics.load(func_sig_view_u32, 3);
        const new_path_ptr = Atomics.load(func_sig_view_u32, 4);
        const new_path_len = Atomics.load(func_sig_view_u32, 5);

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
        const fd = Atomics.load(func_sig_view_u32, 1);
        const path_ptr = Atomics.load(func_sig_view_u32, 2);
        const path_len = Atomics.load(func_sig_view_u32, 3);

        const path = new Uint8Array(
          this.allocator.get_memory(path_ptr, path_len),
        );
        const path_str = new TextDecoder().decode(path);
        this.allocator.free(path_ptr, path_len);

        return this.path_unlink_file(fd, path_str);
      },
    };

    const listener = new Listener(this.lock_fds[fd_n].call_func);
    listener.reset();
    do {
      await listener.listen(async () => {
        try {
          const func_number = Atomics.load(func_sig_view_u32, 0);
          const func_name = FuncNames[func_number] as keyof typeof FuncNames;
          const handler =
            handlers[func_name] ??
            (() => {
              throw new Error(`Unknown function number: ${func_number}`);
            });
          const errno = await handler();
          Atomics.store(func_sig_view_i32, errno_offset, errno);
        } catch (e) {
          const func_sig_view = new Int32Array(this.fd_func_sig);
          Atomics.exchange(func_sig_view, 16, -1);

          throw e;
        }
      });
    } while (this.fds[fd_n] !== undefined);
  }
}
