import { autoincrement } from "../decorators/autoincrement";
import { validate } from "../decorators/validate";
import { LittleEndianDataView } from "../endian_data_view";
import {
  type Pointer,
  type WasiP1FilesystemImports,
  type advice,
  type ciovec,
  type device,
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
  fstflags,
  type inode,
  iovec,
  lookupflags,
  oflags,
  prestat,
  rights,
  type size,
  type timestamp,
  type u8,
  u32,
  u64,
  whence,
} from "../wasi_p1_defs";
import { FdRec, FdRecPreopen } from "./fd_rec";
import { wasiP1FsImport } from "./fs_export";
import { FsDir, type FsFile, FsNode, FsSymlink } from "./fs_node";
import { hasFlag } from "./util";

export namespace WasiP1Filesystem {
  type FdRecAsFirstArg<
    // biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
    T extends Record<Exclude<keyof T, TExcludeKeys>, (...args: any) => errno>,
    TExcludeKeys extends keyof T,
    TFileOnly extends keyof T,
    TDirOnly extends keyof T,
  > = {
    [K in Exclude<keyof T, TExcludeKeys>]: (
      fdRec: FdRec<
        K extends TFileOnly ? FsFile : K extends TDirOnly ? FsDir : FsNode
      >,
      ...args: Parameters<T[K]> extends [unknown, ...infer S] ? S : []
    ) => void;
  };

  type FileOnly =
    | "fd_filestat_set_size"
    | "fd_pread"
    | "fd_pwrite"
    | "fd_read"
    | "fd_seek"
    | "fd_tell"
    | "fd_write";

  type DirOnly =
    | "fd_readdir"
    | "path_create_directory"
    | "path_filestat_get"
    | "path_filestat_set_times"
    | "path_link"
    | "path_open"
    | "path_readlink"
    | "path_remove_directory"
    | "path_rename"
    | "path_symlink"
    | "path_unlink_file";

  type ExcludeKeys = "path_symlink";

  export type Adapted = FdRecAsFirstArg<
    WasiP1FilesystemImports,
    ExcludeKeys,
    FileOnly,
    DirOnly
  > & {
    path_symlink: (
      old_path_ptr: Pointer<u8>,
      old_path_len: size,
      fdRec: FdRec<FsNode.Dir>,
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
  protected readonly preopens = new Map<string, FdRec<FsNode.Dir>>();
  protected readonly device: device = 0n as device;

  @autoincrement(u32)
  accessor #nextFd: fd = 3 as fd;

  @autoincrement(u64)
  accessor #nextInode: inode = 1n as inode;

  readonly now: () => timestamp;

  constructor(
    buffer: ArrayBufferLike,
    preopens: Array<[string, FsNode.Dir]>,
    now?: () => timestamp,
  ) {
    this.view = new LittleEndianDataView(buffer, 0, buffer.byteLength);
    this.now =
      now ??
      ((): timestamp => {
        return (BigInt(Date.now()) * 1000000n) as timestamp;
      });

    for (const [name, dir] of preopens) {
      const parent = new FsDir([[name, dir]]);
      const fdRec = new FdRecPreopen(this.#nextFd, parent, name);

      this.fdRecs.set(fdRec.fd, fdRec);
      this.preopens.set(name, fdRec);
    }
  }

  readonly inode: (x: FsNode) => inode = (() => {
    const inodes = new WeakMap<FsNode, inode>();
    return (x: FsNode): inode => {
      let out = inodes.get(x);
      if (!out) {
        out = this.#nextInode;
        inodes.set(x, out);
      }
      return out;
    };
  })();

  filestat(x: FsNode): filestat {
    return [
      this.device,
      this.inode(x),
      x.filetype,
      x.linkcount,
      FsNode.filesize(x),
      x.atim,
      x.mtim,
      x.ctim,
    ];
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
    fdRec.advise(offset, len, advice);
  }

  @wasiP1FsImport({ rights: rights.fd_allocate })
  fd_allocate(fdRec: FdRec, offset: filesize, len: filesize): void {
    if (!fdRec.isFile()) throw errno.nodev;

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
    FsNode.datasync(fdRec.node);
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
    fdRec.fs_rights_base = fs_rights_base;
    fdRec.fs_rights_inheriting = fs_rights_inheriting;
  }

  @wasiP1FsImport({ rights: rights.fd_filestat_get })
  fd_filestat_get(fdRec: FdRec, out_ptr: Pointer<filestat>): void {
    filestat.write(this.view, out_ptr, this.filestat(fdRec.node));
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_filestat_set_size })
  fd_filestat_set_size(fdRec: FdRec<FsNode.File>, size: filesize): void {
    fdRec.node.filesize = size;
  }

  @wasiP1FsImport({ rights: rights.fd_filestat_set_times })
  fd_filestat_set_times(
    fdRec: FdRec,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): void {
    const now = this.now();
    if (hasFlag(fst_flags, fstflags.atim | fstflags.atim_now)) {
      fdRec.atim = hasFlag(fst_flags, fstflags.atim_now) ? now : atim;
    }
    if (hasFlag(fst_flags, fstflags.mtim | fstflags.mtim_now)) {
      fdRec.mtim = hasFlag(fst_flags, fstflags.mtim_now) ? now : mtim;
    }
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_read })
  fd_pread(
    fdRec: FdRec<FsNode.File>,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): filesize {
    if (offset !== fdRec.offset) fdRec.checkRights(rights.fd_seek);

    let size: size = 0 as size;
    let node_buf = fdRec.node.subarray(offset);
    for (const iov of this.view.stride(
      iovs_ptr,
      iovec.SIZE,
      iovs_len / iovec.SIZE,
    )) {
      const [buf, buf_len] = iovec.read(iov, 0 as Pointer<iovec>);

      const len = Math.min(buf_len, node_buf.byteLength);
      this.view
        .subarray(buf)
        .subarray(0, buf_len)
        .set(node_buf.subarray(0, len));

      size = (size + len) as size;
      node_buf = node_buf.subarray(len);
      if (len < buf_len) break;
    }

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
    new TextEncoder().encodeInto(
      fdRec.name,
      this.view.subarray(path).subarray(0, path_len),
    );
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_write })
  fd_pwrite(
    fdRec: FdRec<FsNode.File>,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): filesize {
    if (offset !== fdRec.offset) fdRec.checkRights(rights.fd_seek);

    let size: size = 0 as size;
    let node_buf = fdRec.node.subarray(offset);
    for (const iov of this.view.stride(
      iovs_ptr,
      iovec.SIZE,
      iovs_len / iovec.SIZE,
    )) {
      const [buf, buf_len] = iovec.read(iov, 0 as Pointer<iovec>);

      const len = Math.min(buf_len, node_buf.byteLength);
      node_buf
        .subarray(0, len)
        .set(this.view.subarray(buf).subarray(0, buf_len));

      size = (size + len) as size;
      node_buf = node_buf.subarray(len);
      if (len < buf_len) break;
    }
    this.view.setUint32(out_ptr, size);

    fdRec.maybeDatasync();
    return size;
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_read })
  fd_read(
    fdRec: FdRec<FsNode.File>,
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
    fdRec: FdRec<FsNode.Dir>,
    buf: Pointer<u8>,
    buf_len: size,
    cookie: dircookie,
    out_ptr: Pointer<size>,
  ): void {
    const encoder = new TextEncoder();

    let d_next: dircookie = 0n as dircookie;
    let size: size = 0 as size;
    let buf_left = this.view.subarray(buf).subarray(0, buf_len);
    for (const [name, node] of (function* () {
      yield [".", fdRec.node] as const;
      yield ["..", fdRec.parent] as const;
      for (const [name, node] of fdRec.node) {
        yield [name, node] as const;
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
        this.inode(node),
        d_namlen,
        node.filetype,
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
    fdRec: FdRec<FsNode.File>,
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
    FsNode.sync(fdRec.node);
  }

  // fd_seek implies fd_tell
  @wasiP1FsImport.fileOnly({ rights: rights.fd_tell | rights.fd_seek })
  fd_tell(fdRec: FdRec<FsNode.File>, out_ptr: Pointer<filesize>): void {
    this.view.setUint32(out_ptr, fdRec.offset);
  }

  @wasiP1FsImport.fileOnly({ rights: rights.fd_write })
  fd_write(
    fdRec: FdRec<FsNode.File>,
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
    fdRec.offset = (fdRec.offset + size) as filesize;
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_create_directory })
  path_create_directory(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): void {
    const { parent, name } = this.#pathLookup(fdRec, path_ptr, path_len, true);
    const node = new FsDir();
    parent.set(name, node);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_filestat_get })
  path_filestat_get(
    fdRec: FdRec<FsNode.Dir>,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    out_ptr: Pointer<filestat>,
  ): void {
    const { node } = this.#pathLookup(fdRec, path_ptr, path_len, false, flags);
    filestat.write(this.view, out_ptr, this.filestat(node));
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_filestat_set_times })
  path_filestat_set_times(
    fdRec: FdRec<FsNode.Dir>,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): void {
    const { node } = this.#pathLookup(fdRec, path_ptr, path_len, false, flags);

    const now = this.now();
    if (hasFlag(fst_flags, fstflags.atim | fstflags.atim_now)) {
      node.atim = hasFlag(fst_flags, fstflags.atim_now) ? now : atim;
    }
    if (hasFlag(fst_flags, fstflags.mtim | fstflags.mtim_now)) {
      node.mtim = hasFlag(fst_flags, fstflags.mtim_now) ? now : mtim;
    }
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_link_source })
  path_link(
    oldFdRec: FdRec<FsNode.Dir>,
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

    // throw any path lookup errors
    const { node } = this.#pathLookup(
      oldFdRec,
      old_path_ptr,
      old_path_len,
      false,
      old_flags,
    );
    const { parent: newParent, name: newName } = this.#pathLookup(
      newFdRec,
      new_path_ptr,
      new_path_len,
      true,
    );

    // No directory hardlinks because that's the general default. Maybe revisit this later.
    if (FsNode.isDir(node)) throw errno.isdir;

    newParent.set(newName, node);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_open })
  path_open(
    fdRec: FdRec<FsNode.Dir>,
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

    const expect_missing = hasFlag(oflags_, oflags.creat)
      ? hasFlag(oflags_, oflags.excl)
        ? true
        : undefined
      : false;
    const { parent, name } = (() => {
      // otherwise useless if statement makes it typecheck (the return types of the two overloads don't match)
      if (expect_missing === false) {
        return this.#pathLookup(
          fdRec,
          path_ptr,
          path_len,
          expect_missing,
          dirflags,
        );
      }
      return this.#pathLookup(
        fdRec,
        path_ptr,
        path_len,
        expect_missing,
        dirflags,
      );
    })();

    if (hasFlag(oflags_, oflags.directory)) {
      if (!FsNode.isDir(parent.get(name))) throw errno.notdir;
    }

    const newFdRec = new FdRec(
      this.#nextFd,
      parent,
      name,
      fdRec.fs_rights_inheriting,
    );

    newFdRec.fs_flags = fdflags_;

    // the setters will check that these are strictly narrower rights
    newFdRec.fs_rights_base = fs_rights_base;
    newFdRec.fs_rights_inheriting = fs_rights_inheriting;

    if (hasFlag(oflags_, oflags.trunc)) {
      newFdRec.node.filesize = 0 as filesize;
    }

    this.fdRecs.set(newFdRec.fd, newFdRec);
    this.view.setUint32(out_ptr, newFdRec.fd);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_readlink })
  path_readlink(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
    buf: Pointer<u8>,
    buf_len: size,
    out_ptr: Pointer<size>,
  ): void {
    const { node } = this.#pathLookup(fdRec, path_ptr, path_len);

    if (!FsNode.isSymlink(node)) throw errno.inval;

    const out = new TextEncoder().encode(node.toString());
    const len = Math.min(out.byteLength, buf_len);

    this.view.subarray(buf).subarray(0, buf_len).set(out.subarray(0, len));
    this.view.setUint32(out_ptr, len);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_remove_directory })
  path_remove_directory(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): void {
    const { parent, name, node } = this.#pathLookup(fdRec, path_ptr, path_len);
    if (!FsNode.isDir(node)) throw errno.notdir;
    if (Object.keys(node).length > 0) throw errno.notempty;

    parent.delete(name);
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_rename_source })
  path_rename(
    fdRec: FdRec<FsNode.Dir>,
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

    const {
      parent: oldParent,
      name: oldName,
      node,
    } = this.#pathLookup(fdRec, old_path_ptr, old_path_len);
    const { parent: newParent, name: newName } = this.#pathLookup(
      newFdRec,
      new_path_ptr,
      new_path_len,
      true,
    );

    newParent.set(newName, node);
    oldParent.delete(oldName);

    fdRec.parent = newParent;
    fdRec.name = newName;
  }

  // path_symlink is the one odd duck in WASI P1 regarding parameter ordering.
  @wasiP1FsImport.dirOnly({ rights: rights.path_symlink, fdIndex: 2 })
  path_symlink(
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    fdRec: FdRec<FsNode.Dir>,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): void {
    const { parent, name } = this.#pathLookup(
      fdRec,
      new_path_ptr,
      new_path_len,
      true,
    );

    const contents = new TextDecoder().decode(
      this.view.subarray(old_path_ptr).subarray(0, old_path_len),
    );
    parent.set(name, new FsSymlink(contents));
  }

  @wasiP1FsImport.dirOnly({ rights: rights.path_unlink_file })
  path_unlink_file(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): void {
    const { parent, name, node } = this.#pathLookup(fdRec, path_ptr, path_len);
    if (FsNode.isDir(node)) throw errno.isdir;

    // TODO: this will break if there are any open fds
    parent.delete(name);
  }

  #pathLookup(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): { parent: FsNode.Dir; name: string; node: FsNode };
  #pathLookup(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
    expect_missing: false,
    flags?: lookupflags,
  ): { parent: FsNode.Dir; name: string; node: FsNode };
  #pathLookup(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
    expect_missing: true | undefined,
    flags?: lookupflags,
  ): { parent: FsNode.Dir; name: string };
  #pathLookup(
    fdRec: FdRec<FsNode.Dir>,
    path_ptr: Pointer<u8>,
    path_len: size,
    expect_missing: boolean | undefined = false,
    flags = lookupflags.none,
  ): { parent: FsNode.Dir; name: string; node?: FsNode } {
    // duplication makes typechecker happy (since overloads don't have the same return types)
    if (expect_missing === false) {
      return this.#pathLookupInner(
        fdRec,
        new TextDecoder().decode(
          this.view.subarray(path_ptr).subarray(0, path_len),
        ),
        expect_missing,
        flags,
      );
    }
    return this.#pathLookupInner(
      fdRec,
      new TextDecoder().decode(
        this.view.subarray(path_ptr).subarray(0, path_len),
      ),
      expect_missing,
      flags,
    );
  }

  static #normalizePath(path: string): string {
    // POSIX: a null pathname shall not be successfully resolved. WASI: relative paths only.
    if (path === "" || path.startsWith("/")) throw errno.inval;
    // POSIX: A pathname that contains at least one non-slash character and that ends with one
    // or more trailing slashes shall be resolved as if a single dot character ( '.' ) were
    // appended to the pathname.
    // biome-ignore lint/style/noParameterAssign:
    if (/[^\/]/.test(path) && path.endsWith("/")) path += ".";
    return path;
  }

  #pathLookupInner(
    fdRec: FdRec<FsNode.Dir>,
    path: string,
  ): { parent: FsNode.Dir; name: string; node: FsNode };
  #pathLookupInner(
    fdRec: FdRec<FsNode.Dir>,
    path: string,
    expect_missing: false,
    flags?: lookupflags,
  ): { parent: FsNode.Dir; name: string; node: FsNode };
  #pathLookupInner(
    fdRec: FdRec<FsNode.Dir>,
    path: string,
    expect_missing: true | undefined,
    flags?: lookupflags,
  ): { parent: FsNode.Dir; name: string };
  #pathLookupInner(
    fdRec: FdRec<FsNode.Dir>,
    path: string,
    expect_missing: boolean | undefined = false,
    flags = lookupflags.none,
  ): { parent: FsNode.Dir; name: string; node?: FsNode } {
    // biome-ignore lint/style/noParameterAssign:
    path = WasiP1Filesystem.#normalizePath(path);

    const segments = path.split("/");

    let symlinksFollowed = 0;
    const predecessors: [FsNode.Dir, string][] = [];
    let node: FsNode | undefined = fdRec.parent.get(fdRec.name);
    let name: string = fdRec.name;
    while (segments.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: just checked the array was non-empty
      const segment = segments.shift()!;
      if (!FsNode.isDir(node)) throw errno.notdir;
      switch (segment) {
        case "":
        case ".": {
          break;
        }
        case "..": {
          // can't pop the last predecessor, that's the fdRec we were passed!
          if (predecessors.length <= 1) throw errno.acces;
          // biome-ignore lint/style/noNonNullAssertion: just checked length > 0
          const [prevNode, prevName] = predecessors.pop()!;
          node = prevNode;
          name = prevName;
          break;
        }
        default: {
          predecessors.push([node, name]);
          name = segment;
          node = node.get(name);
          if (
            node === undefined &&
            (segments.length > 0 || expect_missing === false)
          )
            throw errno.noent;

          if (
            FsNode.isSymlink(node) &&
            (segments.length > 0 || hasFlag(flags, lookupflags.symlink_follow))
          ) {
            symlinksFollowed++;
            if (symlinksFollowed >= this.SYMLOOP_MAX) throw errno.loop;
            segments.push(
              ...WasiP1Filesystem.#normalizePath(node.toString()).split("/"),
            );
          }
        }
      }
    }

    if (node !== undefined && expect_missing === true) throw errno.exist;

    // biome-ignore lint/style/noNonNullAssertion: predecessors will always have at least one element, the only pop() is checked
    const [parent, _] = predecessors.pop()!;
    return { parent, name, node };
  }

  resolve(
    _path: string,
    _expect_missing: boolean | undefined = false,
    _flags = lookupflags.none,
  ): { parent: FsNode.Dir; name: string; node?: FsNode } {
    throw new Error("todo");
  }
}
