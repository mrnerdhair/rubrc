import { autoincrement } from "../decorators/autoincrement";
import { validate } from "../decorators/validate";
import { LittleEndianDataView } from "../endian_data_view";
import {
  type Pointer,
  type WasiP1FilesystemImports,
  type advice,
  type ciovec,
  type dircookie,
  dirent,
  type dirnamlen,
  errno,
  type fd,
  fdflags,
  fdstat,
  type filedelta,
  type filesize,
  filestat,
  filetype,
  type fstflags,
  iovec,
  lookupflags,
  oflags,
  prestat,
  rights,
  type size,
  type timestamp,
  type u8,
  u32,
  whence,
} from "../wasi_p1_defs";
import { FdRec, FdRecPreopen } from "./fd_rec";
import { wasiP1FsImport } from "./fs_export";
import {
  adviceToAdvice,
  descriptorStatToFilestat,
  descriptorTypeToFiletype,
  lookupflagsToPathFlags,
  oflagsToOpenFlags,
  p1TimesToP2Times,
  rightsAndFdflagsToDescriptorFlags,
} from "./p2_adapters";
import { hasFlag } from "./util";

export namespace WasiP1Filesystem {
  type FdRecAsFirstArg<
    // biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
    T extends Record<Exclude<keyof T, TExcludeKeys>, (...args: any) => errno>,
    TExcludeKeys extends keyof T,
  > = {
    [K in Exclude<keyof T, TExcludeKeys>]: (
      fdRec: FdRec,
      ...args: Parameters<T[K]> extends [unknown, ...infer S] ? S : []
    ) => void;
  };

  type ExcludeKeys = "path_symlink";

  export type Adapted = FdRecAsFirstArg<
    WasiP1FilesystemImports,
    ExcludeKeys
  > & {
    path_symlink: (
      old_path_ptr: Pointer<u8>,
      old_path_len: size,
      fdRec: FdRec,
      new_path_ptr: Pointer<u8>,
      new_path_len: size,
    ) => void;

    readonly imports: WasiP1FilesystemImports;
  };
}

export class WasiP1Filesystem implements WasiP1Filesystem.Adapted {
  @validate((value: number) => {
    if (value < 0) throw new Error("SYMLOOP_MAX must be nonnegative");
    if (value < 8) console.warn("POSIX wants a SYMLOOP_MAX of at least 8");
  })
  accessor SYMLOOP_MAX = Number.POSITIVE_INFINITY;

  protected readonly view: LittleEndianDataView;
  protected readonly fdRecs = new Map<fd, FdRec>();
  protected readonly preopens = new Map<string, FdRec>();

  @autoincrement(u32)
  accessor #nextFd: fd = 3 as fd;

  readonly now: () => timestamp;

  constructor(
    buffer: ArrayBufferLike,
    preopens: Array<FdRecPreopen>,
    now?: () => timestamp,
  ) {
    this.view = new LittleEndianDataView(buffer, 0, buffer.byteLength);
    this.now =
      now ??
      ((): timestamp => {
        return (BigInt(Date.now()) * 1000000n) as timestamp;
      });

    for (const preopen of preopens) {
      this.fdRecs.set(preopen.fd, preopen);
      this.preopens.set(preopen.name, preopen);
    }
  }

  get imports() {
    return this[wasiP1FsImport.IMPORTS] as WasiP1FilesystemImports;
  }

  declare readonly [wasiP1FsImport.IMPORTS]: Partial<WasiP1FilesystemImports>;
  [wasiP1FsImport.FD_LOOKUP](x: fd): FdRec | undefined {
    return this.fdRecs.get(x);
  }

  @wasiP1FsImport({ rights: rights.fd_advise })
  fd_advise(
    fdRec: FdRec,
    offset: filesize,
    len: filesize,
    advice: advice,
  ): void {
    fdRec.descriptor.advise(
      BigInt(offset),
      BigInt(len),
      adviceToAdvice(advice),
    );
  }

  @wasiP1FsImport({ rights: rights.fd_allocate })
  fd_allocate(fdRec: FdRec, offset: filesize, len: filesize): void {
    // odd errno, but that's what POSIX does...
    if (fdRec.type !== filetype.regular_file) throw errno.nodev;

    const newSize: filesize = (offset + len) as filesize;
    if (fdRec.size < newSize) {
      fdRec.size = newSize;
    }
  }

  @wasiP1FsImport()
  fd_close(fdRec: FdRec): void {
    this.fdRecs.delete(fdRec.fd);
  }

  @wasiP1FsImport({ rights: rights.fd_datasync })
  fd_datasync(fdRec: FdRec): void {
    fdRec.descriptor.syncData();
  }

  @wasiP1FsImport()
  fd_fdstat_get(fdRec: FdRec, out_ptr: Pointer<fdstat>): void {
    fdstat.write(this.view, out_ptr, fdRec.fdstat());
  }

  @wasiP1FsImport({ rights: rights.fd_fdstat_set_flags })
  fd_fdstat_set_flags(fdRec: FdRec, flags: fdflags): void {
    fdRec.fs_flags = flags;
  }

  @wasiP1FsImport()
  fd_fdstat_set_rights(
    fdRec: FdRec,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
  ): void {
    if (hasFlag(fs_rights_base, ~fdRec.fs_rights_base)) throw errno.notcapable;
    if (hasFlag(fs_rights_inheriting, ~fdRec.fs_rights_inheriting))
      throw errno.notcapable;
    if (hasFlag(fs_rights_inheriting, ~fs_rights_base)) throw errno.inval;

    fdRec.fs_rights_base = fs_rights_base;
    fdRec.fs_rights_inheriting = fs_rights_inheriting;
  }

  @wasiP1FsImport({ rights: rights.fd_filestat_get })
  fd_filestat_get(fdRec: FdRec, out_ptr: Pointer<filestat>): void {
    filestat.write(
      this.view,
      out_ptr,
      descriptorStatToFilestat(
        fdRec.device,
        fdRec.inode,
        fdRec.descriptor.stat(),
      ),
    );
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_filestat_set_size })
  fd_filestat_set_size(fdRec: FdRec, size: filesize): void {
    fdRec.size = size;
  }

  @wasiP1FsImport({ rights: rights.fd_filestat_set_times })
  fd_filestat_set_times(
    fdRec: FdRec,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): void {
    fdRec.descriptor.setTimes(...p1TimesToP2Times(atim, mtim, fst_flags));
    fdRec.maybeSync();
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_read })
  fd_pread(
    fdRec: FdRec,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): filesize {
    if (offset !== fdRec.offset) fdRec.checkRights(rights.fd_seek);

    let currentOffset = BigInt(offset);
    for (const iov of this.view.stride(
      iovs_ptr,
      iovec.SIZE,
      iovs_len / iovec.SIZE,
    )) {
      const [buf_ptr, buf_len] = iovec.read(iov, 0 as Pointer<iovec>);
      const buf = this.view.subarray(buf_ptr).subarray(0, buf_len);

      const [data, eof] = fdRec.descriptor.read(BigInt(buf_len), currentOffset);
      buf.set(data);

      currentOffset += BigInt(Math.min(buf_len, data.byteLength));
      if (eof) break;
    }

    const size = (() => {
      try {
        return u32(Number(currentOffset - BigInt(offset))) as filesize;
      } catch (e) {
        if (!(e instanceof RangeError)) throw e;
        throw errno._2big;
      }
    })();
    this.view.setUint32(out_ptr, size);
    return size;
  }

  @wasiP1FsImport()
  fd_prestat_get(fdRec: FdRec, out_ptr: Pointer<prestat>): void {
    if (!(fdRec instanceof FdRecPreopen)) throw errno.badf;
    prestat.write(this.view, out_ptr, fdRec.prestat());
  }

  @wasiP1FsImport()
  fd_prestat_dir_name(fdRec: FdRec, path: Pointer<u8>, path_len: size): void {
    if (!(fdRec instanceof FdRecPreopen)) throw errno.badf;
    this.view.subarray(path).subarray(0, path_len).set(fdRec.nameBuf);
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_write })
  fd_pwrite(
    fdRec: FdRec,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): filesize {
    const stream = (() => {
      if (hasFlag(fdRec.fs_flags, fdflags.append))
        return fdRec.descriptor.appendViaStream();
      if (offset !== fdRec.offset) fdRec.checkRights(rights.fd_seek);
      return fdRec.descriptor.writeViaStream(BigInt(offset));
    })();
    const pollable = stream.subscribe();

    let currentOffset = BigInt(offset);
    for (const iov of this.view.stride(
      iovs_ptr,
      iovec.SIZE,
      iovs_len / iovec.SIZE,
    )) {
      const [buf_ptr, buf_len] = iovec.read(iov, 0 as Pointer<ciovec>);
      let buf = this.view.subarray(buf_ptr).subarray(0, buf_len);

      while (true) {
        pollable.block();
        let n = stream.checkWrite();
        if (n === 0n) continue;
        if (n > u32.MAX) n = BigInt(u32.MAX);

        const [chunk, newBuf] = buf.split(Number(n));
        buf = newBuf;

        stream.write(chunk);
        currentOffset += BigInt(chunk.byteLength);
      }
    }
    stream.flush();
    pollable.block();

    // surface any errors
    stream.checkWrite();

    const size = (() => {
      try {
        return u32(Number(currentOffset - BigInt(offset))) as filesize;
      } catch (e) {
        if (!(e instanceof RangeError)) throw e;
        throw errno._2big;
      }
    })();
    this.view.setUint32(out_ptr, size);
    fdRec.maybeDatasync();
    return size;
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_read })
  fd_read(
    fdRec: FdRec,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): void {
    const size = this.fd_pread(
      fdRec,
      iovs_ptr,
      iovs_len,
      fdRec.offset,
      out_ptr,
    );
    fdRec.offset = (fdRec.offset + size) as filesize;
  }

  @wasiP1FsImport.dirOnly({ rights: rights.fd_readdir })
  fd_readdir(
    fdRec: FdRec,
    buf: Pointer<u8>,
    buf_len: size,
    cookie: dircookie,
    out_ptr: Pointer<size>,
  ): void {
    const encoder = new TextEncoder();

    let d_next: dircookie = 0n as dircookie;
    let size: size = 0 as size;
    let buf_left = this.view.subarray(buf).subarray(0, buf_len);
    for (const { type, name } of (function* () {
      const stream = fdRec.descriptor.readDirectory();
      while (true) {
        const entry = stream.readDirectoryEntry();
        if (entry === undefined) break;
        yield entry;
      }
    })()) {
      if (d_next++ < cookie) continue;

      const direntBuf = new LittleEndianDataView(8 * 4);

      // This could be optimized with encodeInto() but would have to be somewhat
      // more complex to handle truncation properly.
      const nameBuf = encoder.encode(name);
      const d_namlen: dirnamlen = nameBuf.byteLength as dirnamlen;

      dirent.write(direntBuf, 0 as Pointer<dirent>, [
        d_next,
        fdRec.inodeForPath(lookupflags.none, name),
        d_namlen,
        descriptorTypeToFiletype(type),
      ]);

      const direntBufTrunc = direntBuf.subarray(
        0,
        Math.min(direntBuf.byteLength, buf_left.byteLength),
      );
      buf_left = buf_left.setBytes(direntBufTrunc);
      size = (size + direntBufTrunc.byteLength) as size;
      if (direntBufTrunc.byteLength < direntBuf.byteLength) break;

      const nameBufTrunc = nameBuf.subarray(
        0,
        Math.min(nameBuf.byteLength, buf_left.byteLength),
      );
      buf_left = buf_left.setBytes(nameBufTrunc);
      size = (size + nameBufTrunc.byteLength) as size;
      if (nameBufTrunc.byteLength < nameBuf.byteLength) break;
    }

    this.view.setUint32(out_ptr, size);
  }

  @wasiP1FsImport()
  fd_renumber(fdRec: FdRec, to: fd): void {
    const toFdRec = this.fdRecs.get(to);
    if (!toFdRec) throw errno.badf;

    this.fd_close(toFdRec);
    this.fdRecs.delete(fdRec.fd);

    fdRec.fd = to;
    this.fdRecs.set(to, fdRec);
  }

  // fd_tell is also allowed to do a no-op fd_seek
  @wasiP1FsImport.fileOnly({ rights: rights.fd_seek | rights.fd_tell })
  fd_seek(
    fdRec: FdRec,
    offset: filedelta,
    whence_: whence,
    out_ptr: Pointer<filesize>,
  ): void {
    if (!(whence_ === whence.cur && offset === 0n)) {
      fdRec.checkRights(rights.fd_seek);
    }

    const new_offset: filesize = (() => {
      switch (whence_) {
        case whence.set:
          return u32(Number(offset)) as filesize;
        case whence.cur:
          return u32(Number(BigInt(fdRec.offset) + offset)) as filesize;
        case whence.end:
          return u32(Number(BigInt(fdRec.size) + offset)) as filesize;
        default:
          throw errno.inval;
      }
    })();
    if (new_offset > fdRec.size) throw errno.inval;
    fdRec.offset = new_offset;

    this.view.setUint32(out_ptr, fdRec.offset);
  }

  @wasiP1FsImport({ rights: rights.fd_sync })
  fd_sync(fdRec: FdRec): void {
    fdRec.descriptor.sync();
  }

  // fd_seek implies fd_tell
  @wasiP1FsImport.fileOnly({ rights: rights.fd_tell | rights.fd_seek })
  fd_tell(fdRec: FdRec, out_ptr: Pointer<filesize>): void {
    this.view.setUint32(out_ptr, fdRec.offset);
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_write })
  fd_write(
    fdRec: FdRec,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): void {
    const size = this.fd_pwrite(
      fdRec,
      iovs_ptr,
      iovs_len,
      fdRec.offset,
      out_ptr,
    );
    if (!hasFlag(fdRec.fs_flags, fdflags.append)) {
      fdRec.offset = (fdRec.offset + size) as filesize;
    }
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_create_directory })
  path_create_directory(
    fdRec: FdRec,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): void {
    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );
    fdRec.descriptor.createDirectoryAt(path);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_filestat_get })
  path_filestat_get(
    fdRec: FdRec,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    out_ptr: Pointer<filestat>,
  ): void {
    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );
    const pathFlags = lookupflagsToPathFlags(flags);
    filestat.write(
      this.view,
      out_ptr,
      descriptorStatToFilestat(
        fdRec.device,
        fdRec.inodeForPath(flags, path),
        fdRec.descriptor.statAt(pathFlags, path),
      ),
    );
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_filestat_set_times })
  path_filestat_set_times(
    fdRec: FdRec,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): void {
    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );

    fdRec.descriptor.setTimesAt(
      lookupflagsToPathFlags(flags),
      path,
      ...p1TimesToP2Times(atim, mtim, fst_flags),
    );
    fdRec.maybeSync();
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_link_source })
  path_link(
    oldFdRec: FdRec,
    old_flags: lookupflags,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): void {
    const newFdRec = this.fdRecs.get(new_fd);
    if (newFdRec === undefined) throw errno.badf;
    newFdRec.checkRights(rights.path_link_target);
    if (!newFdRec.isDir()) throw errno.notdir;

    const old_path = new TextDecoder().decode(
      this.view.subarray(old_path_ptr).subarray(0, old_path_len),
    );
    const new_path = new TextDecoder().decode(
      this.view.subarray(new_path_ptr).subarray(0, new_path_len),
    );

    oldFdRec.descriptor.linkAt(
      lookupflagsToPathFlags(old_flags),
      old_path,
      newFdRec.descriptor,
      new_path,
    );
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_open })
  path_open(
    fdRec: FdRec,
    dirflags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    oflags_: oflags,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
    fdflags_: fdflags,
    out_ptr: Pointer<fd>,
  ): void {
    if (hasFlag(oflags_, oflags.creat)) {
      fdRec.checkRights(rights.path_create_file);
    }
    if (hasFlag(oflags_, oflags.trunc)) {
      fdRec.checkRights(rights.path_filestat_set_size);
    }

    if (hasFlag(fdflags_, fdflags.dsync)) {
      fdRec.checkRights((rights.fd_datasync | rights.fd_sync) as rights);
    }
    if (hasFlag(fdflags_, fdflags.rsync)) {
      fdRec.checkRights(rights.fd_sync);
    }
    if (hasFlag(fdflags_, fdflags.sync)) {
      fdRec.checkRights(rights.fd_sync);
    }

    if (hasFlag(fdRec.fs_rights_inheriting, ~fs_rights_base))
      throw errno.notcapable;
    if (hasFlag(fs_rights_base, ~fs_rights_inheriting)) throw errno.inval;

    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );
    const newDescriptor = fdRec.descriptor.openAt(
      lookupflagsToPathFlags(dirflags),
      path,
      oflagsToOpenFlags(oflags_),
      rightsAndFdflagsToDescriptorFlags(fs_rights_base, fdflags_),
    );

    const newFdRec = new FdRec(
      this.#nextFd,
      fdRec.device,
      fdRec.inodeForPath(dirflags, path),
      newDescriptor,
      fs_rights_base,
      fs_rights_inheriting,
      fdflags_,
    );

    this.fdRecs.set(newFdRec.fd, newFdRec);
    this.view.setUint32(out_ptr, newFdRec.fd);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_readlink })
  path_readlink(
    fdRec: FdRec,
    path_ptr: Pointer<u8>,
    path_len: size,
    buf: Pointer<u8>,
    buf_len: size,
    out_ptr: Pointer<size>,
  ): void {
    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );

    const out = fdRec.descriptor.readlinkAt(path);
    const outBuf = new TextEncoder().encode(out);
    const len = Math.min(outBuf.byteLength, buf_len);

    this.view.subarray(buf).subarray(0, buf_len).set(outBuf.subarray(0, len));
    this.view.setUint32(out_ptr, len);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_remove_directory })
  path_remove_directory(
    fdRec: FdRec,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): void {
    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );

    fdRec.descriptor.removeDirectoryAt(path);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_rename_source })
  path_rename(
    fdRec: FdRec,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): void {
    const newFdRec = this.fdRecs.get(new_fd);
    if (newFdRec === undefined) throw errno.badf;
    newFdRec.checkRights(rights.path_rename_target);
    if (!newFdRec.isDir()) throw errno.notdir;

    const old_path = new TextDecoder().decode(
      this.view.subarray(old_path_ptr).subarray(0, old_path_len),
    );
    const new_path = new TextDecoder().decode(
      this.view.subarray(new_path_ptr).subarray(0, new_path_len),
    );

    fdRec.descriptor.renameAt(old_path, newFdRec.descriptor, new_path);
  }

  // path_symlink is the one odd duck in WASI P1 regarding parameter ordering.
  @wasiP1FsImport.dirOnly({ rights: rights.path_symlink, fdIndex: 2 })
  path_symlink(
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    fdRec: FdRec,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): void {
    const old_path = new TextDecoder().decode(
      this.view.subarray(old_path_ptr).subarray(0, old_path_len),
    );
    const new_path = new TextDecoder().decode(
      this.view.subarray(new_path_ptr).subarray(0, new_path_len),
    );

    fdRec.descriptor.symlinkAt(old_path, new_path);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_unlink_file })
  path_unlink_file(fdRec: FdRec, path_ptr: Pointer<u8>, path_len: size): void {
    const path = new TextDecoder().decode(
      this.view.subarray(path_ptr).subarray(0, path_len),
    );

    fdRec.descriptor.unlinkFileAt(path);
  }
}
