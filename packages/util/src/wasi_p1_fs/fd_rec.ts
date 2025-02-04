import type { Descriptor } from "../../../../output/interfaces/wasi-filesystem-types";
import { type Lazy, lazy } from "../decorators/lazy";
import {
  type device,
  errno,
  type fd,
  fdflags,
  type fdstat,
  type filesize,
  filetype,
  type inode,
  lookupflags,
  type prestat,
  prestat_discriminator,
  rights,
  type size,
} from "../wasi_p1_defs";
import { cyrb64 } from "./cyrb";
import { descriptorTypeToFiletype, p2FilesizeToFilesize } from "./p2_adapters";
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

export class FdRec {
  fd: fd;

  fs_flags: fdflags;
  readonly #descriptorSync: boolean;
  readonly #descriptorDsync: boolean;

  fs_rights_base: rights;
  fs_rights_inheriting: rights;

  offset: filesize = 0 as filesize;

  readonly descriptor: Descriptor;
  readonly device: device;
  readonly inode: inode;

  @lazy
  accessor type: Lazy<filetype> = lazy(() =>
    descriptorTypeToFiletype(this.descriptor.getType()),
  );

  constructor(
    fd: fd,
    device: device,
    inode: inode,
    descriptor: Descriptor,
    fs_rights_base?: rights,
    fs_rights_inheriting?: rights,
    fs_flags: fdflags = fdflags.none,
  ) {
    this.fd = fd;
    this.device = device;
    this.inode = inode;
    this.descriptor = descriptor;
    this.fs_flags = fs_flags;
    const { fileIntegritySync, dataIntegritySync } = this.descriptor.getFlags();
    this.#descriptorSync = fileIntegritySync ?? false;
    this.#descriptorDsync = dataIntegritySync ?? false;

    this.fs_rights_base = fs_rights_base ?? allRights;
    this.fs_rights_inheriting = fs_rights_inheriting ?? this.fs_rights_base;

    if (hasFlag(this.fs_rights_inheriting, ~this.fs_rights_base)) {
      throw errno.inval;
    }
  }

  // Calculate synthetic path-based inodes
  inodeForPath(flags: lookupflags, path: string): inode {
    const normalized = [];

    let expandedPath: string | undefined = path;
    if (hasFlag(flags, lookupflags.symlink_follow)) {
      while (
        this.descriptor.statAt({}, expandedPath).type === "symbolic-link"
      ) {
        const contents = this.descriptor.readlinkAt(expandedPath);
        // absolute symlinks can't be resolved in WASI. that makes this a broken link, which we won't resolve further.
        if (contents.startsWith("/")) break;
        expandedPath += `/${contents}`;
      }
    }

    for (const segment of expandedPath.split("/")) {
      switch (segment) {
        case "":
        case ".": {
          break;
        }
        case "..": {
          normalized.pop();
          break;
        }
        default: {
          normalized.push(segment);
        }
      }
    }

    let out: bigint = this.inode;
    for (const segment of normalized) {
      out = cyrb64(segment, out);
    }

    return out as inode;
  }

  fdstat(): fdstat {
    return [
      this.type,
      this.fs_flags,
      this.fs_rights_base,
      this.fs_rights_inheriting,
    ];
  }

  get size(): filesize {
    return p2FilesizeToFilesize(this.descriptor.stat().size);
  }
  set size(value: filesize) {
    this.descriptor.setSize(BigInt(value));
    this.maybeSync();
  }

  isFile(): boolean {
    return this.type === filetype.regular_file;
  }

  isDir(): boolean {
    return this.type === filetype.directory;
  }

  checkRights(rights_: rights): void {
    if (!hasFlag(this.fs_rights_base, rights_)) throw errno.notcapable;
  }

  maybeSync(): void {
    if (this.#descriptorSync) return;
    if (hasFlag(this.fs_flags, fdflags.sync)) {
      this.descriptor.sync();
    }
  }

  maybeDatasync(): void {
    if (this.#descriptorSync || this.#descriptorDsync) return;
    if (hasFlag(this.fs_flags, fdflags.sync)) {
      this.descriptor.sync();
    } else if (hasFlag(this.fs_flags, fdflags.dsync)) {
      this.descriptor.syncData();
    }
  }
}

export class FdRecPreopen extends FdRec {
  readonly name: string;
  readonly nameBuf: Uint8Array;

  constructor(
    name: string,
    fd: fd,
    descriptor: Descriptor,
    fs_rights_base?: rights,
    fs_rights_inheriting?: rights,
    fs_flags: fdflags = fdflags.none,
  ) {
    const device = cyrb64(name) as device;
    const inode = 1n as inode;
    super(
      fd,
      device,
      inode,
      descriptor,
      fs_rights_base,
      fs_rights_inheriting,
      fs_flags,
    );
    this.name = name;
    this.nameBuf = new TextEncoder().encode(this.name);
  }

  prestat(): prestat {
    if (!this.isDir()) throw errno.notdir;

    return [prestat_discriminator.dir, [this.nameBuf.byteLength as size]];
  }
}
