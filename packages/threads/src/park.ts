import { type Fd as BaseFd, wasi } from "@bjorn3/browser_wasi_shim";
import type { WASIFarmRefUseArrayBufferObject } from "./shared_array_buffer/ref";

// Not sure why we're special-casing this possibly being async, but there was runtime
// code to handle it in place already, and it's better to have an explicit type definition
// than a bare type assertion.
export type Fd = Omit<BaseFd, "fd_write"> & {
  fd_write(
    ...args: Parameters<BaseFd["fd_write"]>
  ): ReturnType<BaseFd["fd_write"]> | Promise<ReturnType<BaseFd["fd_write"]>>;
};

export abstract class WASIFarmPark {
  abstract get_ref(): WASIFarmRefUseArrayBufferObject;
  abstract listen(): Promise<void>;
  protected abstract notify_set_fd(fd: number): void;
  protected abstract notify_rm_fd(fd: number): void;
  protected abstract can_set_new_fd(fd: number): void;

  protected readonly fds: Array<Fd | undefined>;
  protected readonly stdin: number | undefined;
  protected readonly stdout: number | undefined;
  protected readonly stderr: number | undefined;
  protected readonly default_allow_fds: Array<number>;

  constructor(
    fds: Array<Fd>,
    stdin: number | undefined,
    stdout: number | undefined,
    stderr: number | undefined,
    default_allow_fds: Array<number>,
  ) {
    this.fds = fds;
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;
    this.default_allow_fds = default_allow_fds;
    this.fds_map = new Array(fds.length);
    for (let i = 0; i < fds.length; i++) {
      this.fds_map[i] = [];
    }
  }

  private get_new_fd_lock = new Array<() => Promise<void>>();

  // For an fd, indicates whether id currently has access to that fd.
  protected readonly fds_map: Array<number[]>;

  // If the reassigned value is accessed after being closed,
  // it will be strange,
  // but the programmer should have written it
  // so that this does not happen in the first place.
  private async get_new_fd(fd_obj: Fd): Promise<[() => Promise<void>, number]> {
    const promise = new Promise<[() => Promise<void>, number]>((resolve) => {
      const len = this.get_new_fd_lock.push(async () => {
        let ret = this.fds.indexOf(undefined);
        if (ret === -1) {
          ret = this.fds.push(undefined) - 1;
          this.fds_map.push([]);
        }

        await this.can_set_new_fd(ret);

        // If it's assigned, it's resolved.
        resolve([
          async () => {
            this.fds[ret] = fd_obj;
            this.get_new_fd_lock.shift();
            const fn = this.get_new_fd_lock[0];
            if (fn !== undefined) {
              fn();
            }
            // assigned and notify
            await this.notify_set_fd(ret);
          },
          ret,
        ]);
      });
      if (len === 1) {
        this.get_new_fd_lock[0]();
      }
    });
    return promise;
  }

  protected fd_advise(fd: number): number {
    if (this.fds[fd] !== undefined) {
      return wasi.ERRNO_SUCCESS;
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_allocate(fd: number, offset: bigint, len: bigint): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_allocate(offset, len);
    }
    return wasi.ERRNO_BADF;
  }

  protected async fd_close(fd: number): Promise<number> {
    if (this.fds[fd] === undefined) {
      return wasi.ERRNO_BADF;
    }
    const ret = this.fds[fd].fd_close();
    this.fds[fd] = undefined;
    await this.notify_rm_fd(fd);
    return ret;
  }

  protected fd_datasync(fd: number): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_sync();
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_fdstat_get(fd: number): [wasi.Fdstat | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, fdstat } = this.fds[fd].fd_fdstat_get();
      if (fdstat != null) {
        return [fdstat, ret];
      }
      return [undefined, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_fdstat_set_flags(fd: number, flags: number): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_fdstat_set_flags(flags);
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_fdstat_set_rights(
    fd: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
  ): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_fdstat_set_rights(
        fs_rights_base,
        fs_rights_inheriting,
      );
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_filestat_get(fd: number): [wasi.Filestat | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, filestat } = this.fds[fd].fd_filestat_get();
      if (filestat != null) {
        return [filestat, ret];
      }
      return [undefined, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_filestat_set_size(fd: number, size: bigint): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_filestat_set_size(size);
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_filestat_set_times(
    fd: number,
    atim: bigint,
    mtim: bigint,
    fst_flags: number,
  ): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_filestat_set_times(atim, mtim, fst_flags);
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_pread(
    fd: number,
    iovecs: Array<wasi.Iovec>,
    offset: bigint,
  ): [[number, Uint8Array] | undefined, number] {
    if (this.fds[fd] !== undefined) {
      let nread = 0;

      let buffer8 = new Uint8Array(0);
      for (const iovec of iovecs) {
        const { ret, data } = this.fds[fd].fd_pread(iovec.buf_len, offset);
        if (ret !== wasi.ERRNO_SUCCESS) {
          return [[nread, buffer8], ret];
        }
        const new_buffer = new Uint8Array(buffer8.byteLength + data.byteLength);
        new_buffer.set(buffer8);
        new_buffer.set(data, buffer8.byteLength);
        buffer8 = new_buffer;
        nread += data.byteLength;
        if (data.byteLength !== iovec.buf_len) {
          break;
        }
      }
      return [[nread, buffer8], wasi.ERRNO_SUCCESS];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_prestat_get(fd: number): [wasi.Prestat | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, prestat } = this.fds[fd].fd_prestat_get();
      if (prestat != null) {
        return [prestat, ret];
      }
      return [undefined, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_prestat_dir_name(
    fd: number,
    path_len: number,
  ): [Uint8Array | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, prestat } = this.fds[fd].fd_prestat_get();
      if (prestat) {
        const prestat_dir_name = prestat.inner.pr_name;

        if (prestat_dir_name.length <= path_len) {
          return [prestat_dir_name, ret];
        }

        return [prestat_dir_name.slice(0, path_len), wasi.ERRNO_NAMETOOLONG];
      }
      return [undefined, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_pwrite(
    fd: number,
    write_data: Uint8Array,
    offset: bigint,
  ): [number | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, nwritten } = this.fds[fd].fd_pwrite(write_data, offset);
      return [nwritten, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_read(
    fd: number,
    iovecs: Array<wasi.Iovec>,
  ): [[number, Uint8Array] | undefined, number] {
    if (this.fds[fd] !== undefined) {
      let nread = 0;

      let buffer8 = new Uint8Array(0);
      for (const iovec of iovecs) {
        const { ret, data } = this.fds[fd].fd_read(iovec.buf_len);
        if (ret !== wasi.ERRNO_SUCCESS) {
          return [[nread, buffer8], ret];
        }
        const new_buffer = new Uint8Array(buffer8.byteLength + data.byteLength);
        new_buffer.set(buffer8);
        new_buffer.set(data, buffer8.byteLength);
        buffer8 = new_buffer;
        nread += data.byteLength;
        if (data.byteLength !== iovec.buf_len) {
          break;
        }
      }

      return [[nread, buffer8], wasi.ERRNO_SUCCESS];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_readdir(
    fd: number,
    buf_len: number,
    cookie: bigint,
  ): [[Uint8Array, number] | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const array = new Uint8Array(buf_len);

      let buf_used = 0;
      let offset = 0;

      let current_cookie = cookie;
      while (true) {
        const { ret, dirent } = this.fds[fd].fd_readdir_single(current_cookie);
        if (ret !== wasi.ERRNO_SUCCESS) {
          return [[array, buf_used], ret];
        }
        if (dirent == null) {
          break;
        }
        if (buf_len - buf_used < dirent.head_length()) {
          buf_used = buf_len;
          break;
        }

        const head_bytes = new ArrayBuffer(dirent.head_length());
        dirent.write_head_bytes(new DataView(head_bytes), 0);
        array.set(
          new Uint8Array(head_bytes).slice(
            0,
            Math.min(head_bytes.byteLength, buf_len - buf_used),
          ),
          offset,
        );
        offset += head_bytes.byteLength;
        buf_used += head_bytes.byteLength;

        if (buf_len - buf_used < dirent.name_length()) {
          buf_used = buf_len;
          break;
        }

        dirent.write_name_bytes(array, offset, buf_len - buf_used);
        offset += dirent.name_length();
        buf_used += dirent.name_length();

        current_cookie = dirent.d_next;
      }

      return [[array, buf_used], wasi.ERRNO_SUCCESS];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_seek(
    fd: number,
    offset: bigint,
    whence: number,
  ): [bigint | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, offset: new_offset } = this.fds[fd].fd_seek(offset, whence);
      return [new_offset, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected fd_sync(fd: number): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].fd_sync();
    }
    return wasi.ERRNO_BADF;
  }

  protected fd_tell(fd: number): [bigint | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, offset } = this.fds[fd].fd_tell();
      return [offset, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected async fd_write(
    fd: number,
    write_data: Uint8Array,
  ): Promise<[number | undefined, number]> {
    if (this.fds[fd] !== undefined) {
      const fd_ret = this.fds[fd].fd_write(write_data);
      let ret: number;
      let nwritten: number;
      if (fd_ret instanceof Promise) {
        ({ ret, nwritten } = await fd_ret);
      } else {
        ({ ret, nwritten } = fd_ret);
      }
      return [nwritten, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected path_create_directory(fd: number, path: string): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].path_create_directory(path);
    }
    return wasi.ERRNO_BADF;
  }

  protected path_filestat_get(
    fd: number,
    flags: number,
    path: string,
  ): [wasi.Filestat | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, filestat } = this.fds[fd].path_filestat_get(flags, path);
      if (filestat != null) {
        return [filestat, ret];
      }
      return [undefined, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected path_filestat_set_times(
    fd: number,
    flags: number,
    path: string,
    atim: bigint,
    mtim: bigint,
    fst_flags: number,
  ): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].path_filestat_set_times(
        flags,
        path,
        atim,
        mtim,
        fst_flags,
      );
    }
    return wasi.ERRNO_BADF;
  }

  protected path_link(
    old_fd: number,
    old_flags: number,
    old_path: string,
    new_fd: number,
    new_path: string,
  ): number {
    if (this.fds[old_fd] !== undefined && this.fds[new_fd] !== undefined) {
      const { ret, inode_obj } = this.fds[old_fd].path_lookup(
        old_path,
        old_flags,
      );
      if (inode_obj == null) {
        return ret;
      }
      return this.fds[new_fd].path_link(new_path, inode_obj, false);
    }
    return wasi.ERRNO_BADF;
  }

  protected async path_open(
    fd: number,
    dirflags: number,
    path: string,
    oflags: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
    fs_flags: number,
  ): Promise<[number | undefined, number]> {
    console.log(
      "path_open",
      {
        fd,
        dirflags,
        path,
        oflags,
        fs_rights_base,
        fs_rights_inheriting,
        fs_flags,
      },
      this.fds[fd],
    );
    if (this.fds[fd] !== undefined) {
      const { ret, fd_obj } = this.fds[fd].path_open(
        dirflags,
        path,
        oflags,
        fs_rights_base,
        fs_rights_inheriting,
        fs_flags,
      );
      if (ret !== wasi.ERRNO_SUCCESS) {
        return [undefined, ret];
      }

      if (!fd_obj) {
        throw new Error("fd_obj should not be null");
      }

      const [resolve, opened_fd] = await this.get_new_fd(fd_obj);

      await resolve();

      return [opened_fd, wasi.ERRNO_SUCCESS];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected path_readlink(
    fd: number,
    path: string,
    buf_len: number,
  ): [Uint8Array | undefined, number] {
    if (this.fds[fd] !== undefined) {
      const { ret, data } = this.fds[fd].path_readlink(path);
      if (data != null) {
        const data_buf = new TextEncoder().encode(data);
        if (data_buf.byteLength > buf_len) {
          // wasi.ts use ERRNO_BADF. I think it should be ERRNO_OVERFLOW.
          return [data_buf.slice(0, buf_len), wasi.ERRNO_OVERFLOW];
        }
        return [data_buf, ret];
      }
      return [undefined, ret];
    }
    return [undefined, wasi.ERRNO_BADF];
  }

  protected path_remove_directory(fd: number, path: string): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].path_remove_directory(path);
    }
    return wasi.ERRNO_BADF;
  }

  protected path_rename(
    old_fd: number,
    old_path: string,
    new_fd: number,
    new_path: string,
  ): number {
    if (this.fds[old_fd] !== undefined && this.fds[new_fd] !== undefined) {
      let { ret, inode_obj } = this.fds[old_fd].path_unlink(old_path);
      if (inode_obj == null) {
        return ret;
      }
      ret = this.fds[new_fd].path_link(new_path, inode_obj, true);
      if (ret !== wasi.ERRNO_SUCCESS) {
        if (
          this.fds[old_fd].path_link(old_path, inode_obj, true) !==
          wasi.ERRNO_SUCCESS
        ) {
          throw "path_link should always return success when relinking an inode back to the original place";
        }
      }
      return ret;
    }
    return wasi.ERRNO_BADF;
  }

  protected path_symlink(
    _old_path: string,
    fd: number,
    _new_path: string,
  ): number {
    if (this.fds[fd] !== undefined) {
      return wasi.ERRNO_NOTSUP;
    }
    return wasi.ERRNO_BADF;
  }

  protected path_unlink_file(fd: number, path: string): number {
    if (this.fds[fd] !== undefined) {
      return this.fds[fd].path_unlink_file(path);
    }
    return wasi.ERRNO_BADF;
  }
}
