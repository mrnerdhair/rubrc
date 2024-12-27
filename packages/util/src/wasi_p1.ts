import { errno } from "./wasi_p1_defs_simple";
import type {
  ConstPointer,
  Pointer,
  WasiP1Imports,
  advice,
  ciovec,
  clockid,
  dircookie,
  event,
  exitcode,
  fd,
  fdflags,
  fdstat,
  filedelta,
  filesize,
  filestat,
  fstflags,
  iovec,
  lookupflags,
  oflags,
  prestat,
  riflags,
  rights,
  roflags,
  sdflags,
  siflags,
  signal,
  size,
  subscription,
  timestamp,
  u8,
  whence,
} from "./wasi_p1_defs_simple";

export class WasiP1ProcExit {
  readonly rval: exitcode;
  constructor(rval: exitcode) {
    this.rval = rval;
  }
}

export class WasiP1 implements WasiP1Imports {
  protected readonly memory: WebAssembly.Memory;
  protected readonly view: DataView;
  protected readonly args: readonly Uint8Array[];
  protected readonly environ: readonly Uint8Array[];

  constructor(
    memory: WebAssembly.Memory,
    args: string[],
    environ: Record<string, string>,
  ) {
    this.memory = memory;
    this.view = new DataView(this.memory.buffer);
    this.args = Array.from(args)
      .map((x) => {
        if (x.includes("\0")) throw new Error("args can't include NUL");
        return x;
      })
      .map((x) => `${x}\0`)
      .map((x) => new TextEncoder().encode(x));
    this.environ = Object.entries(environ)
      .map(([key, value]) => {
        if (key.includes("\0") || value.includes("\0"))
          throw new Error("environ can't include NUL");
        if (key.includes("=")) throw new Error("environ keys can't include =");
        return [key, value];
      })
      .map(([key, value]) => `${key}=${value}\0`)
      .map((x) => new TextEncoder().encode(x));
  }

  protected memcpy(ptr: Pointer<u8>, source: Uint8Array) {
    new Uint8Array(this.memory.buffer, ptr, source.byteLength).set(source);
  }

  readonly args_get = (
    argv: Pointer<Pointer<u8>>,
    argv_buf: Pointer<u8>,
  ): errno => {
    for (const arg of this.args) {
      this.view.setUint32(argv, argv_buf);
      this.memcpy(argv_buf, arg);
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      argv += 4;
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      argv_buf += arg.byteLength;
    }
    return errno.success;
  };
  readonly args_sizes_get = (
    out_ptr_arg_count: Pointer<size>,
    out_ptr_argv_buf_size: Pointer<size>,
  ): errno => {
    this.view.setUint32(out_ptr_arg_count, this.args.length);
    this.view.setUint32(
      out_ptr_argv_buf_size,
      this.args.reduce((a, x) => a + x.byteLength, 0),
    );
    return errno.success;
  };

  readonly environ_get = (
    environ: Pointer<Pointer<u8>>,
    environ_buf: Pointer<u8>,
  ): errno => {
    for (const this_environ of this.environ) {
      this.view.setUint32(environ, environ_buf);
      this.memcpy(environ_buf, this_environ);
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      environ += 4;
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      environ_buf += this_environ.byteLength;
    }
    return errno.success;
  };
  readonly environ_sizes_get = (
    out_ptr_environ_count: Pointer<size>,
    out_ptr_environ_buf_size: Pointer<size>,
  ): errno => {
    this.view.setUint32(out_ptr_environ_count, this.environ.length);
    this.view.setUint32(
      out_ptr_environ_buf_size,
      this.environ.reduce((a, x) => a + x.byteLength, 0),
    );
    return errno.success;
  };

  readonly clock_res_get = (
    _id: clockid,
    _out_ptr: Pointer<timestamp>,
  ): errno => {
    throw new Error("todo");
  };
  readonly clock_time_get = (
    _id: clockid,
    _precision: timestamp,
    _out_ptr: Pointer<timestamp>,
  ): errno => {
    throw new Error("todo");
  };

  readonly fd_advise = (
    _fd: fd,
    _offset: filesize,
    _len: filesize,
    _advice: advice,
  ): errno => {
    return errno.success;
  };
  readonly fd_allocate = (
    _fd: fd,
    _offset: filesize,
    _len: filesize,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_close = (_fd: fd): errno => {
    throw new Error("todo");
  };
  readonly fd_datasync = (_fd: fd): errno => {
    throw new Error("todo");
  };
  readonly fd_fdstat_get = (_fd: fd, _out_ptr: Pointer<fdstat>): errno => {
    throw new Error("todo");
  };
  readonly fd_fdstat_set_flags = (_fd: fd, _flags: fdflags): errno => {
    throw new Error("todo");
  };
  readonly fd_fdstat_set_rights = (
    _fd: fd,
    _fs_rights_base: rights,
    _fs_rights_inheriting: rights,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_filestat_get = (_fd: fd, _out_ptr: Pointer<filestat>): errno => {
    throw new Error("todo");
  };
  readonly fd_filestat_set_size = (_fd: fd, _size: filesize): errno => {
    throw new Error("todo");
  };
  readonly fd_filestat_set_times = (
    _fd: fd,
    _atim: timestamp,
    _mtim: timestamp,
    _fst_flags: fstflags,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_pread = (
    _fd: fd,
    _iovs_ptr: Pointer<iovec>,
    _iovs_len: size,
    _offset: filesize,
    _out_ptr: Pointer<size>,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_prestat_get = (_fd: fd, _out_ptr: Pointer<prestat>): errno => {
    throw new Error("todo");
  };
  readonly fd_prestat_dir_name = (
    _fd: fd,
    _path: Pointer<u8>,
    _path_len: size,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_pwrite = (
    _fd: fd,
    _iovs_ptr: Pointer<ciovec>,
    _iovs_len: size,
    _offset: filesize,
    _out_ptr: Pointer<size>,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_read = (
    _fd: fd,
    _iovs_ptr: Pointer<iovec>,
    _iovs_len: size,
    _out_ptr: Pointer<size>,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_readdir = (
    _fd: fd,
    _buf: Pointer<u8>,
    _buf_len: size,
    _cookie: dircookie,
    _out_ptr: Pointer<size>,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_renumber = (_fd: fd, _to: fd): errno => {
    throw new Error("todo");
  };
  readonly fd_seek = (
    _fd: fd,
    _offset: filedelta,
    _whence: whence,
    _out_ptr: Pointer<filesize>,
  ): errno => {
    throw new Error("todo");
  };
  readonly fd_sync = (_fd: fd): errno => {
    throw new Error("todo");
  };
  readonly fd_tell = (_fd: fd, _out_ptr: Pointer<filesize>): errno => {
    throw new Error("todo");
  };
  readonly fd_write = (
    _fd: fd,
    _iovs_ptr: Pointer<ciovec>,
    _iovs_len: size,
    _out_ptr: Pointer<size>,
  ): errno => {
    throw new Error("todo");
  };

  readonly path_create_directory = (
    _fd: fd,
    _path_ptr: Pointer<u8>,
    _path_len: size,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_filestat_get = (
    _fd: fd,
    _flags: lookupflags,
    _path_ptr: Pointer<u8>,
    _path_len: size,
    _out_ptr: Pointer<filestat>,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_filestat_set_times = (
    _fd: fd,
    _flags: number,
    _path_ptr: Pointer<u8>,
    _path_len: size,
    _atim: timestamp,
    _mtim: timestamp,
    _fst_flags: fstflags,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_link = (
    _old_fd: fd,
    _old_flags: lookupflags,
    _old_path_ptr: Pointer<u8>,
    _old_path_len: size,
    _new_fd: fd,
    _new_path_ptr: Pointer<u8>,
    _new_path_len: size,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_open = (
    _fd: fd,
    _dirflags: lookupflags,
    _path_ptr: Pointer<u8>,
    _path_len: size,
    _oflags: oflags,
    _fs_rights_base: rights,
    _fs_rights_inheriting: rights,
    _fdflags: fdflags,
    _out_ptr: Pointer<fd>,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_readlink = (
    _fd: fd,
    _path_ptr: Pointer<u8>,
    _path_len: size,
    _buf: Pointer<u8>,
    _buf_len: size,
    _out_ptr: Pointer<size>,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_remove_directory = (
    _fd: fd,
    _path_ptr: Pointer<u8>,
    _path_len: size,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_rename = (
    _fd: fd,
    _old_path_ptr: Pointer<u8>,
    _old_path_len: size,
    _new_fd: fd,
    _new_path_ptr: Pointer<u8>,
    _new_path_len: size,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_symlink = (
    _old_path_ptr: Pointer<u8>,
    _old_path_len: size,
    _fd: fd,
    _new_path_ptr: Pointer<u8>,
    _new_path_len: size,
  ): errno => {
    throw new Error("todo");
  };
  readonly path_unlink_file = (
    _fd: fd,
    _path_ptr: Pointer<u8>,
    _path_len: size,
  ): errno => {
    throw new Error("todo");
  };

  readonly poll_oneoff = (
    _in_: ConstPointer<subscription>,
    _out: Pointer<event>,
    _nsubscriptions: size,
    _out_ptr: Pointer<size>,
  ): errno => {
    return errno.notsup;
  };
  readonly proc_exit = (rval: exitcode): never => {
    throw new WasiP1ProcExit(rval);
  };
  readonly proc_raise = (_sig: signal): errno => {
    return errno.notsup;
  };
  readonly sched_yield = (): errno => {
    return errno.success;
  };
  readonly random_get = (buf: Pointer<u8>, buf_len: size): errno => {
    crypto.getRandomValues(new Uint8Array(this.memory.buffer, buf, buf_len));
    return errno.success;
  };

  readonly sock_accept = (
    _fd: fd,
    _flags: fdflags,
    _out_ptr: Pointer<fd>,
  ): errno => {
    return errno.notsup;
  };
  readonly sock_recv = (
    _fd: fd,
    _ri_data_ptr: Pointer<iovec>,
    _ri_data_len: size,
    _ri_flags: riflags,
    _out_ptr_size: Pointer<size>,
    _out_ptr_roflags: Pointer<roflags>,
  ): errno => {
    return errno.notsup;
  };
  readonly sock_send = (
    _fd: fd,
    _si_data_ptr: Pointer<ciovec>,
    _si_data_len: size,
    _si_flags: siflags,
    _out_ptr: Pointer<size>,
  ): errno => {
    return errno.notsup;
  };
  readonly sock_shutdown = (_fd: fd, _how: sdflags): errno => {
    return errno.notsup;
  };
}
