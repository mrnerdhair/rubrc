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
    id: clockid,
    out_ptr: Pointer<timestamp>,
  ): errno => {};
  readonly clock_time_get = (
    id: clockid,
    precision: timestamp,
    out_ptr: Pointer<timestamp>,
  ): errno => {};

  readonly fd_advise = (
    _fd: fd,
    _offset: filesize,
    _len: filesize,
    _advice: advice,
  ): errno => {
    return errno.success;
  };
  readonly fd_allocate = (fd: fd, offset: filesize, len: filesize): errno => {};
  readonly fd_close = (fd: fd): errno => {};
  readonly fd_datasync = (fd: fd): errno => {};
  readonly fd_fdstat_get = (fd: fd, out_ptr: Pointer<fdstat>): errno => {};
  readonly fd_fdstat_set_flags = (fd: fd, flags: fdflags): errno => {};
  readonly fd_fdstat_set_rights = (
    fd: fd,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
  ): errno => {};
  readonly fd_filestat_get = (fd: fd, out_ptr: Pointer<filestat>): errno => {};
  readonly fd_filestat_set_size = (fd: fd, size: filesize): errno => {};
  readonly fd_filestat_set_times = (
    fd: fd,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): errno => {};
  readonly fd_pread = (
    fd: fd,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): errno => {};
  readonly fd_prestat_get = (fd: fd, out_ptr: Pointer<prestat>): errno => {};
  readonly fd_prestat_dir_name = (
    fd: fd,
    path: Pointer<u8>,
    path_len: size,
  ): errno => {};
  readonly fd_pwrite = (
    fd: fd,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): errno => {};
  readonly fd_read = (
    fd: fd,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): errno => {};
  readonly fd_readdir = (
    fd: fd,
    buf: Pointer<u8>,
    buf_len: size,
    cookie: dircookie,
    out_ptr: Pointer<size>,
  ): errno => {};
  readonly fd_renumber = (fd: fd, to: fd): errno => {};
  readonly fd_seek = (
    fd: fd,
    offset: filedelta,
    whence: whence,
    out_ptr: Pointer<filesize>,
  ): errno => {};
  readonly fd_sync = (fd: fd): errno => {};
  readonly fd_tell = (fd: fd, out_ptr: Pointer<filesize>): errno => {};
  readonly fd_write = (
    fd: fd,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): errno => {};

  readonly path_create_directory = (
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): errno => {};
  readonly path_filestat_get = (
    fd: fd,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    out_ptr: Pointer<filestat>,
  ): errno => {};
  readonly path_filestat_set_times = (
    fd: fd,
    flags: number,
    path_ptr: Pointer<u8>,
    path_len: size,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): errno => {};
  readonly path_link = (
    old_fd: fd,
    old_flags: lookupflags,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno => {};
  readonly path_open = (
    fd: fd,
    dirflags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    oflags: oflags,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
    fdflags: fdflags,
    out_ptr: Pointer<fd>,
  ): errno => {};
  readonly path_readlink = (
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
    buf: Pointer<u8>,
    buf_len: size,
    out_ptr: Pointer<size>,
  ): errno => {};
  readonly path_remove_directory = (
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): errno => {};
  readonly path_rename = (
    fd: fd,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno => {};
  readonly path_symlink = (
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno => {};
  readonly path_unlink_file = (
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): errno => {};

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
