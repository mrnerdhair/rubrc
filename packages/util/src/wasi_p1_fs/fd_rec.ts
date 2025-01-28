import { type Lazy, lazy } from "../decorators/lazy";
import { validate } from "../decorators/validate";
import {
  type advice,
  errno,
  type fd,
  fdflags,
  type fdstat,
  type filesize,
  type prestat,
  prestat_discriminator,
  rights,
  type size,
  type timestamp,
} from "../wasi_p1_defs";
import { FsFile, FsNode } from "./fs_node";
import { hasFlag } from "./util";

const allRights = (rights.fd_datasync |
  rights.fd_read |
  rights.fd_seek |
  rights.fd_fdstat_set_flags |
  rights.fd_sync |
  rights.fd_tell |
  rights.fd_write |
  rights.fd_advise |
  rights.fd_allocate |
  rights.path_create_directory |
  rights.path_create_file |
  rights.path_link_source |
  rights.path_link_target |
  rights.path_open |
  rights.fd_readdir |
  rights.path_readlink |
  rights.path_rename_source |
  rights.path_rename_target |
  rights.path_filestat_get |
  rights.path_filestat_set_size |
  rights.path_filestat_set_times |
  rights.fd_filestat_get |
  rights.fd_filestat_set_size |
  rights.fd_filestat_set_times |
  rights.path_symlink |
  rights.path_remove_directory |
  rights.path_unlink_file |
  rights.poll_fd_readwrite |
  rights.sock_shutdown |
  rights.sock_accept) as rights;

export class FdRec<TFsNode extends FsNode = FsNode> {
  fd: fd;

  fs_flags: fdflags = fdflags.none;

  @validate(function (this: FdRec<TFsNode>, value: rights) {
    if (hasFlag(value, ~this.fs_rights_base)) throw errno.notcapable;
  })
  accessor fs_rights_base: rights = allRights;

  @validate(function (this: FdRec<TFsNode>, value: rights) {
    if (hasFlag(value, ~this.fs_rights_inheriting)) throw errno.notcapable;
    if (hasFlag(value, ~this.fs_rights_base)) throw errno.notcapable;
  })
  accessor fs_rights_inheriting: rights = this.fs_rights_base;

  offset: filesize = 0 as filesize;

  parent: FsNode.Dir;
  name: string;

  constructor(
    fd: fd,
    parent: FsNode.Dir,
    name: string,
    fs_rights_base?: rights,
    fs_rights_inheriting?: rights,
  ) {
    this.fd = fd;
    this.parent = parent;
    this.name = name;

    this.fs_rights_base = fs_rights_base ?? allRights;
    this.fs_rights_inheriting = fs_rights_inheriting ?? this.fs_rights_base;

    if (!parent.has(name)) {
      parent.set(name, new FsFile());
    }
  }

  fdstat(): fdstat {
    return [
      this.node.filetype,
      this.fs_flags,
      this.fs_rights_base,
      this.fs_rights_inheriting,
    ];
  }

  get node(): TFsNode {
    const out = this.parent.get(this.name) as TFsNode;
    if (out === undefined) throw new Error("node missing");
    return out;
  }
  set node(value: TFsNode) {
    this.parent.set(this.name, value);
  }

  get size(): filesize {
    return FsNode.filesize(this.node);
  }
  set size(value: filesize) {
    FsNode.set_filesize(this.node, value);
    this.maybeSync();
  }

  isFile(): this is FdRec<FsNode.File> {
    return FsNode.isFile(this.node);
  }

  isDir(): this is FdRec<FsNode.Dir> {
    return FsNode.isDir(this.node);
  }

  checkRights(rights_: rights): void {
    if (!hasFlag(this.fs_rights_base, rights_)) throw errno.notcapable;
  }

  maybeSync(): void {
    if (hasFlag(this.fs_flags, fdflags.sync)) {
      FsNode.sync(this.node);
    }
  }

  maybeDatasync(): void {
    if (hasFlag(this.fs_flags, fdflags.sync)) {
      FsNode.sync(this.node);
    } else if (hasFlag(this.fs_flags, fdflags.dsync)) {
      FsNode.datasync(this.node);
    }
  }

  get atim(): timestamp {
    return this.node.atim;
  }
  set atim(value: timestamp) {
    this.node.atim = value;
    this.maybeSync();
  }

  get mtim(): timestamp {
    return this.node.mtim;
  }
  set mtim(value: timestamp) {
    this.node.mtim = value;
    this.maybeSync();
  }

  get ctim(): timestamp {
    return this.node.ctim;
  }
  set ctim(value: timestamp) {
    this.node.ctim = value;
    this.maybeSync();
  }

  advise(_offset: filesize, _len: filesize, _advice: advice): void {
    // no-op
  }
}

export class FdRecPreopen extends FdRec<FsNode.Dir> {
  @lazy
  accessor #nameByteLength: Lazy<size> = lazy(() => {
    return new TextEncoder().encode(this.name).byteLength as size;
  });

  prestat(): prestat {
    if (!this.isDir()) throw errno.notdir;

    return [prestat_discriminator.dir, [this.#nameByteLength]];
  }
}
