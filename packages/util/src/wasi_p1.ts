import {
  type ConstPointer,
  type Pointer,
  type WasiP1FilesystemImports,
  type WasiP1Imports,
  type ciovec,
  clockid,
  errno,
  type event,
  type exitcode,
  type fd,
  type fdflags,
  type iovec,
  type riflags,
  type roflags,
  type sdflags,
  type siflags,
  type signal,
  type size,
  type subscription,
  type timestamp,
  type u8,
  u32,
} from "./wasi_p1_defs";

export class WasiP1ProcExit {
  readonly rval: exitcode;
  constructor(rval: exitcode) {
    this.rval = rval;
  }
}

export class WasiP1 implements WasiP1Imports {
  protected readonly view: DataView;
  protected readonly args: readonly Uint8Array[];
  protected readonly environ: readonly Uint8Array[];
  protected readonly fs: WasiP1FilesystemImports;

  constructor(
    view: ArrayBufferView,
    args: string[],
    environ: Record<string, string>,
    fs: WasiP1FilesystemImports,
  ) {
    this.view = new DataView(view.buffer, view.byteOffset, view.byteLength);
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
    this.fs = fs;
  }

  protected memcpy(ptr: Pointer<u8>, source: Uint8Array) {
    new Uint8Array(this.view.buffer, ptr, source.byteLength).set(source);
  }

  readonly args_get = (
    argv: Pointer<Pointer<u8>>,
    argv_buf: Pointer<u8>,
  ): errno => {
    for (const arg of this.args) {
      this.view.setUint32(argv, argv_buf, true);
      this.memcpy(argv_buf, arg);
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      argv = u32.add(argv, u32(4));
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      argv_buf = u32.add(argv_buf, u32(arg.byteLength));
    }
    return errno.success;
  };
  readonly args_sizes_get = (
    out_ptr_arg_count: Pointer<size>,
    out_ptr_argv_buf_size: Pointer<size>,
  ): errno => {
    this.view.setUint32(out_ptr_arg_count, this.args.length, true);
    this.view.setUint32(
      out_ptr_argv_buf_size,
      this.args.reduce((a, x) => a + x.byteLength, 0),
      true,
    );
    return errno.success;
  };

  readonly environ_get = (
    environ: Pointer<Pointer<u8>>,
    environ_buf: Pointer<u8>,
  ): errno => {
    for (const this_environ of this.environ) {
      this.view.setUint32(environ, environ_buf, true);
      this.memcpy(environ_buf, this_environ);
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      environ = u32.add(environ, u32(4));
      // biome-ignore lint/style/noParameterAssign: more confusing the other way
      environ_buf = u32.add(environ_buf, u32(this_environ.byteLength));
    }
    return errno.success;
  };
  readonly environ_sizes_get = (
    out_ptr_environ_count: Pointer<size>,
    out_ptr_environ_buf_size: Pointer<size>,
  ): errno => {
    this.view.setUint32(out_ptr_environ_count, this.environ.length, true);
    this.view.setUint32(
      out_ptr_environ_buf_size,
      this.environ.reduce((a, x) => a + x.byteLength, 0),
      true,
    );
    return errno.success;
  };

  readonly clock_res_get = (
    id: clockid,
    out_ptr: Pointer<timestamp>,
  ): errno => {
    switch (id) {
      case clockid.realtime: {
        // There are a million nanoseconds in a millisecond, which is the resolution of Date.now()
        this.view.setBigUint64(out_ptr, 1000000n, true);
        return errno.success;
      }
      default: {
        return errno.inval;
      }
    }
  };
  readonly clock_time_get = (
    id: clockid,
    precision: timestamp,
    out_ptr: Pointer<timestamp>,
  ): errno => {
    switch (id) {
      case clockid.realtime: {
        // There are a million nanoseconds in a millisecond, which is the resolution of Date.now()
        if (precision < 1000000n) return errno.inval;
        const now = BigInt(Date.now()) * 1000000n;
        this.view.setBigUint64(out_ptr, now, true);
        return errno.success;
      }
      default: {
        return errno.inval;
      }
    }
  };

  get fd_advise() {
    return this.fs.fd_advise;
  }
  get fd_allocate() {
    return this.fs.fd_allocate;
  }
  get fd_close() {
    return this.fs.fd_close;
  }
  get fd_datasync() {
    return this.fs.fd_datasync;
  }
  get fd_fdstat_get() {
    return this.fs.fd_fdstat_get;
  }
  get fd_fdstat_set_flags() {
    return this.fs.fd_fdstat_set_flags;
  }
  get fd_fdstat_set_rights() {
    return this.fs.fd_fdstat_set_rights;
  }
  get fd_filestat_get() {
    return this.fs.fd_filestat_get;
  }
  get fd_filestat_set_size() {
    return this.fs.fd_filestat_set_size;
  }
  get fd_filestat_set_times() {
    return this.fs.fd_filestat_set_times;
  }
  get fd_pread() {
    return this.fs.fd_pread;
  }
  get fd_prestat_get() {
    return this.fs.fd_prestat_get;
  }
  get fd_prestat_dir_name() {
    return this.fs.fd_prestat_dir_name;
  }
  get fd_pwrite() {
    return this.fs.fd_pwrite;
  }
  get fd_read() {
    return this.fs.fd_read;
  }
  get fd_readdir() {
    return this.fs.fd_readdir;
  }
  get fd_renumber() {
    return this.fs.fd_renumber;
  }
  get fd_seek() {
    return this.fs.fd_seek;
  }
  get fd_sync() {
    return this.fs.fd_sync;
  }
  get fd_tell() {
    return this.fs.fd_tell;
  }
  get fd_write() {
    return this.fs.fd_write;
  }
  get path_create_directory() {
    return this.fs.path_create_directory;
  }
  get path_filestat_get() {
    return this.fs.path_filestat_get;
  }
  get path_filestat_set_times() {
    return this.fs.path_filestat_set_times;
  }
  get path_link() {
    return this.fs.path_link;
  }
  get path_open() {
    return this.fs.path_open;
  }
  get path_readlink() {
    return this.fs.path_readlink;
  }
  get path_remove_directory() {
    return this.fs.path_remove_directory;
  }
  get path_rename() {
    return this.fs.path_rename;
  }
  get path_symlink() {
    return this.fs.path_symlink;
  }
  get path_unlink_file() {
    return this.fs.path_unlink_file;
  }

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
    crypto.getRandomValues(new Uint8Array(this.view.buffer, buf, buf_len));
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
