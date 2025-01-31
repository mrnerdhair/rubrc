import { WASIProcExit, strace } from "@bjorn3/browser_wasi_shim";
import { wasi } from "@bjorn3/browser_wasi_shim";
import {
  type WasiP1Cmd,
  type WasiP1Reactor,
  type WasiP1Thread,
  as_wasi_p1_cmd,
  as_wasi_p1_reactor,
  as_wasi_p1_thread,
} from "rubrc-util";
import type { WASIFarmRef } from "./ref";
import { WASIFarmRefUseArrayBuffer } from "./shared_array_buffer";
import type {
  ThreadSpawner,
  WASIFarmRefUseArrayBufferObject,
} from "./shared_array_buffer";

export class WASIFarmAnimal {
  args: Array<string>;
  env: Array<string>;

  wasi_farm_refs: WASIFarmRef[];

  _inst: { exports: { memory: WebAssembly.Memory } } | undefined;
  get inst(): { exports: { memory: WebAssembly.Memory } } {
    const out = this._inst;
    if (!out) {
      throw new Error("expected this._inst to be set by now");
    }
    return out;
  }

  wasiImport: ReturnType<typeof WASIFarmAnimal.makeWasiImport>;
  wasiThreadImport: ReturnType<typeof WASIFarmAnimal.makeWasiThreadImport>;

  private thread_spawner?: ThreadSpawner;

  // Each process has a specific fd that it can access.
  // If it does not exist in the map, it cannot be accessed.
  // child process can access parent process's fd.
  // so, it is necessary to manage the fd on global scope.
  // [fd, wasi_ref_n]
  fd_map: Array<[number, number] | undefined> = [];

  get_fd_and_wasi_ref(fd: number): [number, WASIFarmRef] {
    const [mapped_fd, wasi_ref_n] = this.get_fd_and_wasi_ref_n(fd);
    return [mapped_fd, this.wasi_farm_refs[wasi_ref_n]];
  }

  get_fd_and_wasi_ref_n(fd: number): [number, number] {
    this.check_fds();
    const out = this.fd_map[fd];
    if (!out) throw wasi.ERRNO_BADF;
    return out;
  }

  /// Start a WASI command
  // FIXME v0.3: close opened Fds after execution
  async start(instance: WasiP1Cmd): Promise<number> {
    this._inst = instance;
    try {
      instance.exports._start();
      return 0;
    } catch (e) {
      if (!(e instanceof WASIProcExit)) throw e;
      return e.code;
    }
  }

  /// Start a WASI command on a thread
  /// If a module has child threads and a child thread throws an error,
  /// the main thread should also be stopped,
  /// but there is no way to stop it,
  /// so the entire worker is stopped.
  /// If it is not necessary, do not use it.
  /// Custom imports are not implemented,
  /// function because it cannot be passed to other threads.
  /// If the sharedObject library someday supports synchronization, it could be used to support this.
  async start_on_thread(): Promise<number> {
    if (!this.thread_spawner) {
      throw new Error("thread_spawn is not supported");
    }

    return await this.thread_spawner.start_on_thread(
      this.args,
      this.env,
      this.fd_map,
    );
  }

  async wasi_thread_start(
    instance: WasiP1Thread,
    thread_id: number,
    start_arg: number,
  ): Promise<number> {
    this._inst = instance;
    try {
      instance.exports.wasi_thread_start(thread_id, start_arg);
      return 0;
    } catch (e) {
      if (!(e instanceof WASIProcExit)) throw e;
      return e.code;
    }
  }

  /// Initialize a WASI reactor
  async initialize(instance: WasiP1Reactor): Promise<void> {
    this._inst = instance;
    instance.exports._initialize?.();
  }

  private static async mapping_fds(
    wasi_farm_refs: Array<WASIFarmRef>,
    override_fd_maps?: Array<number[]>,
  ): Promise<Array<[number, number] | undefined>> {
    const out_fd_map: Array<[number, number] | undefined> = [
      undefined,
      undefined,
      undefined,
    ];

    for (const [wasi_farm_ref, i] of wasi_farm_refs.map(
      (x, i) => [x, i] as const,
    )) {
      const override_fd_map =
        (override_fd_maps ? override_fd_maps[i] : wasi_farm_ref.default_fds) ??
        [];
      const this_stdin = wasi_farm_ref.stdin;
      const this_stdout = wasi_farm_ref.stdout;
      const this_stderr = wasi_farm_ref.stderr;
      if (this_stdin !== undefined && override_fd_map.includes(this_stdin)) {
        out_fd_map[0] ??= [this_stdin, i];
      }
      if (this_stdout !== undefined && override_fd_map.includes(this_stdout)) {
        out_fd_map[1] ??= [this_stdout, i];
      }
      if (this_stderr !== undefined && override_fd_map.includes(this_stderr)) {
        out_fd_map[2] ??= [this_stderr, i];
      }
      for (const j of override_fd_map) {
        if (j === this_stdin || j === this_stdout || j === this_stderr) {
          continue;
        }
        WASIFarmAnimal.map_new_fd(out_fd_map, j, i);
      }
      await wasi_farm_ref.set_park_fds_map_async(override_fd_map);
    }

    if (out_fd_map[0] === undefined) {
      throw new Error("stdin is not found");
    }
    if (out_fd_map[1] === undefined) {
      throw new Error("stdout is not found");
    }
    if (out_fd_map[2] === undefined) {
      throw new Error("stderr is not found");
    }

    return out_fd_map;
  }

  private static map_new_fd(
    fd_map: Array<[number, number] | undefined>,
    fd: number,
    wasi_ref_n: number,
  ): number {
    // 0, 1, 2 are reserved for stdin, stdout, stderr
    let n = fd_map.indexOf(undefined, 3);
    if (n === -1) {
      n = fd_map.push(undefined) - 1;
    }
    fd_map[n] = [fd, wasi_ref_n];
    return n;
  }

  map_new_fd_and_notify(fd: number, wasi_ref_n: number): number {
    const n = WASIFarmAnimal.map_new_fd(this.fd_map, fd, wasi_ref_n);
    this.wasi_farm_refs[wasi_ref_n].set_park_fds_map([fd]);
    return n;
  }

  private check_fds() {
    const rm_fds: Array<[number, number]> = [];
    for (let i = 0; i < this.wasi_farm_refs.length; i++) {
      const wasi_farm_ref = this.wasi_farm_refs[i];
      const removed_fds = wasi_farm_ref.fd_close_receiver.get(wasi_farm_ref.id);
      if (removed_fds) {
        for (const fd of removed_fds) {
          rm_fds.push([fd, i]);
        }
      }
    }

    if (rm_fds.length > 0) {
      for (let i = 0; i < this.fd_map.length; i++) {
        const fd_and_wasi_ref_n = this.fd_map[i];
        if (!fd_and_wasi_ref_n) {
          continue;
        }
        const [fd, wasi_ref_n] = fd_and_wasi_ref_n;
        for (const [rm_fd_fd, rm_fd_wasi_ref_n] of rm_fds) {
          if (fd === rm_fd_fd && wasi_ref_n === rm_fd_wasi_ref_n) {
            this.fd_map[i] = undefined;
            break;
          }
        }
      }
    }
  }

  grow_share_memory(delta: number) {
    const thread_spawner = this.thread_spawner;
    if (!thread_spawner) {
      throw new Error("thread_spawner is not defined");
    }

    return thread_spawner.share_memory.grow(delta);
  }

  static async init({
    wasi_farm_refs,
    args,
    env,
    override_fd_maps,
    thread_spawner,
  }: {
    wasi_farm_refs: WASIFarmRefUseArrayBufferObject[];
    args: Array<string>;
    env: Array<string>;
    override_fd_maps?: Array<number[]>;
    thread_spawner?: ThreadSpawner;
  }): Promise<WASIFarmAnimal> {
    try {
      new SharedArrayBuffer(4);
    } catch {
      throw new Error("Non SharedArrayBuffer is not supported yet");
    }

    const wasi_farm_refs_out = await Promise.all(
      wasi_farm_refs.map(async (x) => await WASIFarmRefUseArrayBuffer.init(x)),
    );

    return new WASIFarmAnimal({
      wasi_farm_refs: wasi_farm_refs_out,
      thread_spawner,
      mapping_fds: await WASIFarmAnimal.mapping_fds(
        wasi_farm_refs_out,
        override_fd_maps,
      ),
      args,
      env,
    });
  }

  protected constructor({
    wasi_farm_refs,
    thread_spawner,
    mapping_fds,
    args,
    env,
  }: {
    wasi_farm_refs: WASIFarmRef[];
    thread_spawner: ThreadSpawner | undefined;
    mapping_fds: Array<[number, number] | undefined>;
    args: Array<string>;
    env: Array<string>;
  }) {
    this.wasi_farm_refs = wasi_farm_refs;
    this.thread_spawner = thread_spawner;
    this.fd_map = mapping_fds;
    this.args = args;
    this.env = env;
    this.wasiImport = WASIFarmAnimal.makeWasiImport(this);
    this.wasiThreadImport = WASIFarmAnimal.makeWasiThreadImport(this);
  }

  async instantiate_cmd(
    wasm: WebAssembly.Module,
    use_strace?: boolean,
  ): Promise<WasiP1Cmd> {
    return as_wasi_p1_cmd(await this.instantiate(wasm, use_strace));
  }

  async instantiate_reactor(
    wasm: WebAssembly.Module,
    use_strace?: boolean,
  ): Promise<WasiP1Reactor> {
    return as_wasi_p1_reactor(await this.instantiate(wasm, use_strace));
  }

  async instantiate_thread(
    wasm: WebAssembly.Module,
    use_strace?: boolean,
  ): Promise<WasiP1Thread> {
    return as_wasi_p1_thread(await this.instantiate(wasm, use_strace));
  }

  protected async instantiate(wasm: WebAssembly.Module, use_strace?: boolean) {
    return await WebAssembly.instantiate(wasm, {
      ...(this.thread_spawner
        ? {
            env: {
              memory: this.thread_spawner?.share_memory,
            },

            wasi: use_strace
              ? strace(this.wasiThreadImport, [])
              : this.wasiThreadImport,
          }
        : {}),
      wasi_snapshot_preview1: use_strace
        ? strace(this.wasiImport, [])
        : this.wasiImport,
    });
  }

  private static makeWasiImport(self: WASIFarmAnimal) {
    const out = {
      args_sizes_get(argc: number, argv_buf_size: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        buffer.setUint32(argc, self.args.length, true);
        let buf_size = 0;
        for (const arg of self.args) {
          buf_size += arg.length + 1;
        }
        buffer.setUint32(argv_buf_size, buf_size, true);
        return 0;
      },
      args_get(argv: number, argv_buf: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        let current_argv = argv;
        let current_argv_buf = argv_buf;
        for (let i = 0; i < self.args.length; i++) {
          buffer.setUint32(current_argv, current_argv_buf, true);
          current_argv += 4;
          const arg = new TextEncoder().encode(self.args[i]);
          buffer8.set(arg, current_argv_buf);
          buffer.setUint8(current_argv_buf + arg.length, 0);
          current_argv_buf += arg.length + 1;
        }
        return 0;
      },
      environ_sizes_get(environ_count: number, environ_size: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        buffer.setUint32(environ_count, self.env.length, true);
        let buf_size = 0;
        for (const environ of self.env) {
          buf_size += environ.length + 1;
        }
        buffer.setUint32(environ_size, buf_size, true);
        return 0;
      },
      environ_get(environ: number, environ_buf: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        let current_environ = environ;
        let current_environ_buf = environ_buf;
        for (let i = 0; i < self.env.length; i++) {
          buffer.setUint32(current_environ, current_environ_buf, true);
          current_environ += 4;
          const e = new TextEncoder().encode(self.env[i]);
          buffer8.set(e, current_environ_buf);
          buffer.setUint8(current_environ_buf + e.length, 0);
          current_environ_buf += e.length + 1;
        }
        return 0;
      },
      clock_res_get(id: number, res_ptr: number): number {
        let resolutionValue: bigint;
        switch (id) {
          case wasi.CLOCKID_MONOTONIC: {
            // https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
            // > Resolution in isolated contexts: 5 microseconds
            resolutionValue = 5_000n; // 5 microseconds
            break;
          }
          case wasi.CLOCKID_REALTIME: {
            resolutionValue = 1_000_000n; // 1 millisecond?
            break;
          }
          default:
            return wasi.ERRNO_NOSYS;
        }
        const view = new DataView(self.inst.exports.memory.buffer);
        view.setBigUint64(res_ptr, resolutionValue, true);
        return wasi.ERRNO_SUCCESS;
      },
      clock_time_get(id: number, _precision: bigint, time: number): number {
        const buffer = new DataView(self.inst.exports.memory.buffer);
        if (id === wasi.CLOCKID_REALTIME) {
          buffer.setBigUint64(
            time,
            BigInt(new Date().getTime()) * 1_000_000n,
            true,
          );
        } else if (id === wasi.CLOCKID_MONOTONIC) {
          let monotonic_time: bigint;
          try {
            monotonic_time = BigInt(Math.round(performance.now() * 1000000));
          } catch (e) {
            // performance.now() is only available in browsers.
            // TODO use the perf_hooks builtin module for NodeJS
            monotonic_time = 0n;
          }
          buffer.setBigUint64(time, monotonic_time, true);
        } else {
          // TODO
          buffer.setBigUint64(time, 0n, true);
        }
        return 0;
      },
      fd_advise(
        fd: number,
        _offset: bigint,
        _len: bigint,
        _advice: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_advise(mapped_fd);
      },
      fd_allocate(fd: number, offset: bigint, len: bigint): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_allocate(mapped_fd, offset, len);
      },
      fd_close(fd: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const ret = wasi_farm_ref.fd_close(mapped_fd);
        self.check_fds();
        return ret;
      },
      fd_datasync(fd: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_datasync(mapped_fd);
      },
      fd_fdstat_get(fd: number, fdstat_ptr: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const [fdstat, ret] = wasi_farm_ref.fd_fdstat_get(mapped_fd);
        if (fdstat) {
          fdstat.write_bytes(
            new DataView(self.inst.exports.memory.buffer),
            fdstat_ptr,
          );
        }
        return ret;
      },
      fd_fdstat_set_flags(fd: number, flags: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_fdstat_set_flags(mapped_fd, flags);
      },
      fd_fdstat_set_rights(
        fd: number,
        fs_rights_base: bigint,
        fs_rights_inheriting: bigint,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_fdstat_set_rights(
          mapped_fd,
          fs_rights_base,
          fs_rights_inheriting,
        );
      },
      fd_filestat_get(fd: number, filestat_ptr: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const [filestat, ret] = wasi_farm_ref.fd_filestat_get(mapped_fd);
        if (!filestat) return ret;
        filestat.write_bytes(
          new DataView(self.inst.exports.memory.buffer),
          filestat_ptr,
        );
        return wasi.ERRNO_SUCCESS;
      },
      fd_filestat_set_size(fd: number, size: bigint): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_filestat_set_size(mapped_fd, size);
      },
      fd_filestat_set_times(
        fd: number,
        atim: bigint,
        mtim: bigint,
        fst_flags: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_filestat_set_times(
          mapped_fd,
          atim,
          mtim,
          fst_flags,
        );
      },
      fd_pread(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        offset: bigint,
        nread_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const iovs_view = new Uint32Array(
          buffer.buffer,
          iovs_ptr,
          iovs_len * 2,
        );
        const [nerad_and_read_data, ret] = wasi_farm_ref.fd_pread(
          mapped_fd,
          iovs_view,
          offset,
        );
        if (nerad_and_read_data) {
          const iovecs = wasi.Iovec.read_bytes_array(
            buffer,
            iovs_ptr,
            iovs_len,
          );
          const [nread, read_data] = nerad_and_read_data;
          buffer.setUint32(nread_ptr, nread, true);
          let nreaded = 0;
          for (const iovec of iovecs) {
            if (nreaded + iovec.buf_len >= read_data.length) {
              buffer8.set(read_data, iovec.buf);
              break;
            }
            buffer8.set(
              read_data.slice(nreaded, nreaded + iovec.buf_len),
              iovec.buf,
            );
            nreaded += iovec.buf_len;
          }
        }
        return ret;
      },
      fd_prestat_get(fd: number, prestat_ptr: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const [prestat, ret] = wasi_farm_ref.fd_prestat_get(mapped_fd);
        if (prestat) {
          const [tag, name_len] = prestat;
          const buffer = new DataView(self.inst.exports.memory.buffer);
          buffer.setUint32(prestat_ptr, tag, true);
          buffer.setUint32(prestat_ptr + 4, name_len, true);
        }
        return ret;
      },
      fd_prestat_dir_name(
        fd: number,
        path_ptr: number,
        path_len: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const [path, ret] = wasi_farm_ref.fd_prestat_dir_name(
          mapped_fd,
          path_len,
        );
        if (path) {
          const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
          buffer8.set(path, path_ptr);
        }
        return ret;
      },
      fd_pwrite(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        offset: bigint,
        nwritten_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const iovecs = wasi.Ciovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
        const data = new Uint8Array(
          iovecs.reduce((acc, iovec) => acc + iovec.buf_len, 0),
        );
        let nwritten = 0;
        for (const iovec of iovecs) {
          data.set(
            buffer8.slice(iovec.buf, iovec.buf + iovec.buf_len),
            nwritten,
          );
          nwritten += iovec.buf_len;
        }
        const [written, ret] = wasi_farm_ref.fd_pwrite(mapped_fd, data, offset);
        if (written) {
          buffer.setUint32(nwritten_ptr, written, true);
        }
        return ret;
      },
      fd_read(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        nread_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const iovs_view = new Uint32Array(
          buffer.buffer,
          iovs_ptr,
          iovs_len * 2,
        );

        const [nerad_and_read_data, ret] = wasi_farm_ref.fd_read(
          mapped_fd,
          iovs_view,
        );
        if (nerad_and_read_data) {
          const iovecs = wasi.Iovec.read_bytes_array(
            buffer,
            iovs_ptr,
            iovs_len,
          );
          const [nread, read_data] = nerad_and_read_data;

          buffer.setUint32(nread_ptr, nread, true);
          let nreaded = 0;
          for (const iovec of iovecs) {
            if (nreaded + iovec.buf_len >= read_data.length) {
              buffer8.set(read_data, iovec.buf);
              break;
            }
            buffer8.set(
              read_data.slice(nreaded, nreaded + iovec.buf_len),
              iovec.buf,
            );
            nreaded += iovec.buf_len;
          }
        }
        return ret;
      },
      fd_readdir(
        fd: number,
        buf_ptr: number,
        buf_len: number,
        cookie: bigint,
        buf_used_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        if (mapped_fd === undefined || wasi_farm_ref === undefined) {
          return wasi.ERRNO_BADF;
        }
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const [nerad_and_read_data, ret] = wasi_farm_ref.fd_readdir(
          mapped_fd,
          buf_len,
          cookie,
        );
        if (nerad_and_read_data) {
          const [read_data, buf_used] = nerad_and_read_data;
          buffer.setUint32(buf_used_ptr, buf_used, true);
          buffer8.set(read_data, buf_ptr);
        }
        return ret;
      },
      fd_renumber(fd: number, to: number): number {
        try {
          const [mapped_to, wasi_farm_ref_to] = self.get_fd_and_wasi_ref(to);
          const ret = wasi_farm_ref_to.fd_close(mapped_to);
          self.check_fds();
          if (ret !== wasi.ERRNO_SUCCESS) {
            return ret;
          }
        } catch (e) {
          if (e !== wasi.ERRNO_BADF) throw e;
        }

        if (self.fd_map[to]) {
          throw new Error("fd is already mapped");
        }

        self.fd_map[to] = self.fd_map[fd];
        self.fd_map[fd] = undefined;

        return wasi.ERRNO_SUCCESS;
      },
      fd_seek(
        fd: number,
        offset: bigint,
        whence: number,
        newoffset_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const [newoffset, ret] = wasi_farm_ref.fd_seek(
          mapped_fd,
          offset,
          whence,
        );
        if (newoffset) {
          const buffer = new DataView(self.inst.exports.memory.buffer);

          // wasi.ts use BigInt for offset, but API use Uint64
          buffer.setBigUint64(newoffset_ptr, newoffset, true);
        }
        return ret;
      },
      fd_sync(fd: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        return wasi_farm_ref.fd_sync(mapped_fd);
      },
      fd_tell(fd: number, newoffset_ptr: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        if (mapped_fd === undefined || wasi_farm_ref === undefined) {
          return wasi.ERRNO_BADF;
        }
        const [newoffset, ret] = wasi_farm_ref.fd_tell(mapped_fd);
        if (newoffset) {
          const buffer = new DataView(self.inst.exports.memory.buffer);
          buffer.setBigUint64(newoffset_ptr, newoffset, true);
        }
        return ret;
      },
      fd_write(
        fd: number,
        iovs_ptr: number,
        iovs_len: number,
        nwritten_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);

        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const iovecs = wasi.Ciovec.read_bytes_array(buffer, iovs_ptr, iovs_len);
        const data = new Uint8Array(
          iovecs.reduce((acc, iovec) => acc + iovec.buf_len, 0),
        );
        let nwritten = 0;
        for (const iovec of iovecs) {
          data.set(
            buffer8.slice(iovec.buf, iovec.buf + iovec.buf_len),
            nwritten,
          );
          nwritten += iovec.buf_len;
        }
        const [written, ret] = wasi_farm_ref.fd_write(mapped_fd, data);
        if (written) {
          buffer.setUint32(nwritten_ptr, written, true);
        }
        return ret;
      },
      path_create_directory(
        fd: number,
        path_ptr: number,
        path_len: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        return wasi_farm_ref.path_create_directory(mapped_fd, path);
      },
      path_filestat_get(
        fd: number,
        flags: number,
        path_ptr: number,
        path_len: number,
        filestat_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer = new DataView(self.inst.exports.memory.buffer);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        const [filestat, ret] = wasi_farm_ref.path_filestat_get(
          mapped_fd,
          flags,
          path,
        );
        if (filestat) {
          filestat.write_bytes(buffer, filestat_ptr);
        }
        return ret;
      },
      path_filestat_set_times(
        fd: number,
        flags: number,
        path_ptr: number,
        path_len: number,
        atim: bigint,
        mtim: bigint,
        fst_flags: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        return wasi_farm_ref.path_filestat_set_times(
          mapped_fd,
          flags,
          path,
          atim,
          mtim,
          fst_flags,
        );
      },
      path_link(
        old_fd: number,
        old_flags: number,
        old_path_ptr: number,
        old_path_len: number,
        new_fd: number,
        new_path_ptr: number,
        new_path_len: number,
      ): number {
        const [mapped_old_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(old_fd);
        const [mapped_new_fd, wasi_farm_ref_new] =
          self.get_fd_and_wasi_ref(new_fd);
        // TODO! Make it work with different wasi_farm_ref
        if (wasi_farm_ref !== wasi_farm_ref_new) {
          return wasi.ERRNO_BADF;
        }
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const old_path = buffer8.slice(
          old_path_ptr,
          old_path_ptr + old_path_len,
        );
        const new_path = buffer8.slice(
          new_path_ptr,
          new_path_ptr + new_path_len,
        );
        return wasi_farm_ref.path_link(
          mapped_old_fd,
          old_flags,
          old_path,
          mapped_new_fd,
          new_path,
        );
      },
      path_open(
        fd: number,
        dirflags: number,
        path_ptr: number,
        path_len: number,
        oflags: number,
        fs_rights_base: bigint,
        fs_rights_inheriting: bigint,
        fs_flags: number,
        opened_fd_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref_n] = self.get_fd_and_wasi_ref_n(fd);
        const wasi_farm_ref = self.wasi_farm_refs[wasi_farm_ref_n];
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        const [opened_fd, ret] = wasi_farm_ref.path_open(
          mapped_fd,
          dirflags,
          path,
          oflags,
          fs_rights_base,
          fs_rights_inheriting,
          fs_flags,
        );
        if (opened_fd) {
          if (self.fd_map.includes([opened_fd, wasi_farm_ref_n])) {
            throw new Error("opened_fd already exists");
          }
          const mapped_opened_fd = self.map_new_fd_and_notify(
            opened_fd,
            wasi_farm_ref_n,
          );
          const buffer = new DataView(self.inst.exports.memory.buffer);
          buffer.setUint32(opened_fd_ptr, mapped_opened_fd, true);
        }
        return ret;
      },
      path_readlink(
        fd: number,
        path_ptr: number,
        path_len: number,
        buf_ptr: number,
        buf_len: number,
        buf_used_ptr: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        const [buf, ret] = wasi_farm_ref.path_readlink(
          mapped_fd,
          path,
          buf_len,
        );
        if (buf) {
          const buffer = new DataView(self.inst.exports.memory.buffer);
          buffer.setUint32(buf_used_ptr, buf.length, true);
          buffer8.set(buf, buf_ptr);
        }
        return ret;
      },
      path_remove_directory(
        fd: number,
        path_ptr: number,
        path_len: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        return wasi_farm_ref.path_remove_directory(mapped_fd, path);
      },
      path_rename(
        old_fd: number,
        old_path_ptr: number,
        old_path_len: number,
        new_fd: number,
        new_path_ptr: number,
        new_path_len: number,
      ): number {
        if (old_fd === new_fd) {
          return wasi.ERRNO_SUCCESS;
        }
        const [mapped_old_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(old_fd);
        const [mapped_new_fd, wasi_farm_ref_new] =
          self.get_fd_and_wasi_ref(new_fd);
        // TODO! Make it work with different wasi_farm_ref
        if (wasi_farm_ref !== wasi_farm_ref_new) {
          return wasi.ERRNO_BADF;
        }
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const old_path = buffer8.slice(
          old_path_ptr,
          old_path_ptr + old_path_len,
        );
        const new_path = buffer8.slice(
          new_path_ptr,
          new_path_ptr + new_path_len,
        );
        return wasi_farm_ref.path_rename(
          mapped_old_fd,
          old_path,
          mapped_new_fd,
          new_path,
        );
      },
      path_symlink(
        old_path_ptr: number,
        old_path_len: number,
        fd: number,
        new_path_ptr: number,
        new_path_len: number,
      ): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const old_path = buffer8.slice(
          old_path_ptr,
          old_path_ptr + old_path_len,
        );
        const new_path = buffer8.slice(
          new_path_ptr,
          new_path_ptr + new_path_len,
        );
        return wasi_farm_ref.path_symlink(old_path, mapped_fd, new_path);
      },
      path_unlink_file(fd: number, path_ptr: number, path_len: number): number {
        const [mapped_fd, wasi_farm_ref] = self.get_fd_and_wasi_ref(fd);
        const buffer8 = new Uint8Array(self.inst.exports.memory.buffer);
        const path = buffer8.slice(path_ptr, path_ptr + path_len);
        return wasi_farm_ref.path_unlink_file(mapped_fd, path);
      },
      poll_oneoff(
        _in_: unknown,
        _out: unknown,
        _nsubscriptions: unknown,
      ): number {
        throw new Error("async io not supported");
      },
      proc_exit(exit_code: number): never {
        throw new WASIProcExit(exit_code);
      },
      proc_raise(sig: number): number {
        throw new Error(`raised signal ${sig}`);
      },
      sched_yield(): number {
        return wasi.ERRNO_SUCCESS;
      },
      random_get(buf: number, buf_len: number): number {
        const buffer8 = new Uint8Array(
          self.inst.exports.memory.buffer,
        ).subarray(buf, buf + buf_len);

        if (
          "crypto" in globalThis &&
          !(self.inst.exports.memory.buffer instanceof SharedArrayBuffer)
        ) {
          for (let i = 0; i < buf_len; i += 65536) {
            crypto.getRandomValues(buffer8.subarray(i, i + 65536));
          }
        } else {
          for (let i = 0; i < buf_len; i++) {
            buffer8[i] = (Math.random() * 256) | 0;
          }
        }
        return wasi.ERRNO_SUCCESS;
      },
      sock_recv(_fd: number, _ri_data: unknown, _ri_flags: unknown): number {
        throw new Error("sockets not supported");
      },
      sock_send(_fd: number, _si_data: unknown, _si_flags: unknown): number {
        throw new Error("sockets not supported");
      },
      sock_shutdown(_fd: number, _how: unknown): number {
        throw new Error("sockets not supported");
      },
      sock_accept(_fd: number, _flags: unknown): number {
        throw new Error("sockets not supported");
      },
    } as const;

    for (const key_ in out) {
      // biome-ignore lint/suspicious/noExplicitAny: tighten up later
      const key: keyof typeof out = key_ as any;
      // biome-ignore lint/suspicious/noExplicitAny: tighten up later
      const prev = out[key] as any;
      (out as Writable<typeof out>)[key] = ((...args: unknown[]) => {
        try {
          return prev(...args);
        } catch (e) {
          if (e === wasi.ERRNO_BADF) return e;
          throw e;
        }
        // biome-ignore lint/suspicious/noExplicitAny: tighten up later
      }) as any;
    }

    return out;
  }

  private static makeWasiThreadImport(self: WASIFarmAnimal) {
    return {
      "thread-spawn": (start_arg: number) => {
        if (self.thread_spawner === undefined) {
          throw new Error("thread_spawn is not allowed");
        }

        const thread_id = self.thread_spawner.thread_spawn(
          start_arg,
          self.args,
          self.env,
          self.fd_map,
        );

        return thread_id;
      },
    } as const;
  }
}
