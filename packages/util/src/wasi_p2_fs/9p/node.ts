type u8 = number;
type u16 = number;
type u32 = number;
type u64 = bigint;

export type QidType = u8;
export namespace QidType {
  export const QTDIR = 0x80;
  export const QTAPPEND = 0x40;
  export const QTEXCL = 0x20;
  export const QTMOUNT = 0x10;
  export const QTAUTH = 0x08;
  export const QTTMP = 0x04;
  export const QTLINK = 0x02;
  export const QTFILE = 0x00;
}

export type Qid = {
  type: QidType;
  version: u32;
  path: u64;
};

export namespace NineP2000 {
  export type Error = { ename: string };

  export type Perm = u32;
  export namespace Perm {
    export const DMDIR = 0x80000000;
    export const DMAPPEND = 0x40000000;
    export const DMEXCL = 0x20000000;
    export const DMMOUNT = 0x10000000;
    export const DMAUTH = 0x08000000;
    export const DMTMP = 0x04000000;
    export const DMSYMLINK = 0x02000000;
  }

  export type Stat = {
    type: u16;
    dev: u32;
    qid: Qid;
    mode: u32;
    atime: u32;
    mtime: u32;
    length: u64;
    name: string;
    uid: string;
    gid: string;
    muid: string;
  };

  export interface Fid {
    walk(nwname: Iterable<string, undefined, undefined>): Fid;
    open(mode: u8): { qid: Qid; iounit: u32 };
    create(name: string, perm: Perm, mode: u8): { qid: Qid; iounit: u32 };
    read(offset: u64, count: u32): Uint8Array;
    write(offset: u64, data: Uint8Array): u32;
    remove(): void;
    stat(): Stat;
    wstat(stat: Stat): void;
    clunk(): void;
  }

  export interface Fs {
    version(msize: u32, version: string): { msize: u32; version: string };
    auth(uname: string, aname: string): { afid: Fid; aqid: Qid };
    attach(
      afid: Fid | undefined,
      uname: string,
      aname: string,
    ): { fid: Fid; qid: Qid };
  }
}

export namespace NineP2000U {
  export type Error = { ename: string; errno?: u32 };

  export type Perm = u32;
  export namespace Perm {
    export const DMDIR = NineP2000.Perm.DMDIR;
    export const DMAPPEND = NineP2000.Perm.DMAPPEND;
    export const DMEXCL = NineP2000.Perm.DMEXCL;
    export const DMMOUNT = NineP2000.Perm.DMMOUNT;
    export const DMAUTH = NineP2000.Perm.DMAUTH;
    export const DMTMP = NineP2000.Perm.DMTMP;
    export const DMSYMLINK = NineP2000.Perm.DMSYMLINK;
    export const DMDEVICE = 0x00800000;
    export const DMNAMEDPIPE = 0x00200000;
    export const DMSOCKET = 0x00100000;
    export const DMSETUID = 0x00080000;
    export const DMSETGID = 0x00040000;
  }

  export type Stat = NineP2000.Stat & {
    extension?: string;
    n_uid?: u32;
    n_gid?: u32;
    n_muid?: u32;
  };

  export interface Fid extends NineP2000.Fid {
    walk(nwname: Iterable<string, undefined, undefined>): Fid;
    create(
      name: string,
      perm: u32,
      mode: u8,
      extension?: string,
    ): { qid: Qid; iounit: u32 };
    stat(): Stat;
    wstat(stat: Stat): void;
  }

  export interface Fs extends NineP2000.Fs {
    auth(uname: string, aname: string, n_uname?: u32): { afid: Fid; aqid: Qid };
    attach(
      afid: Fid | undefined,
      uname: string,
      aname: string,
      n_uname?: u32,
    ): { fid: Fid; qid: Qid };
  }
}

export namespace NineP2000L {
  export enum LockType {
    RDLCK = 0,
    WRLCK = 1,
    UNLCK = 2,
  }
  export enum LockStatus {
    SUCCESS = 0,
    BLOCKED = 1,
    ERROR = 2,
    GRACE = 3,
  }
  export interface Fid
    extends Pick<
      NineP2000.Fid,
      "walk" | "read" | "write" | "clunk" | "remove"
    > {
    statfs(): {
      type: u32;
      bsize: u32;
      blocks: u64;
      bfree: u64;
      bavail: u64;
      files: u64;
      ffree: u64;
      fsid: u64;
      namelen: u32;
    };
    lopen(flags: u32): { qid: Qid; iounit: u32 };
    lcreate(
      name: string,
      flags: u32,
      mode: u32,
      gid: u32,
    ): { qid: Qid; iounit: u32 };
    symlink(name: string, symtgt: string, gid: u32): Qid;
    mknod(name: string, mode: u32, major: u32, minor: u32, gid: u32): Qid;
    rename(dfid: Fid, name: string): void;
    readlink(): string;
    getattr(request_mask: u64): Partial<{
      qid: Qid;
      mode: u32;
      uid: u32;
      gid: u32;
      nlink: u64;
      rdev: u64;
      size: u64;
      blksize: u64;
      blocks: u64;
      atime_sec: u64;
      atime_nsec: u64;
      mtime_sec: u64;
      mtime_nsec: u64;
      ctime_sec: u64;
      ctime_nsec: u64;
      btime_sec: u64;
      btime_nsec: u64;
      gen: u64;
      data_version: u64;
    }>;
    setattr(
      attr: Partial<{
        mode: u32;
        uid: u32;
        gid: u32;
        size: u64;
        atime_sec: u64;
        atime_nsec: u64;
        mtime_sec: u64;
        mtime_nsec: u64;
      }>,
    ): void;
    xattrwalk(name: string): {
      fid: Fid;
      size: u64;
    };
    xattrcreate(name: string, attr_size: u64, flags: u32): void;
    readdir(
      offset: u64,
      count: u32,
    ): Iterator<
      {
        qid: Qid;
        offset: u64;
        type: u8;
        name: string;
      },
      undefined,
      undefined
    >;
    fsync(datasync: u32): void;
    lock(
      type: LockType,
      flags: u32,
      start: u64,
      length: u64,
      proc_id: u32,
      client_id: string,
    ): LockStatus;
    getlock(
      type: LockType,
      start: u64,
      length: u64,
      proc_id: u32,
      client_id: string,
    ): {
      type: LockType;
      start: u64;
      length: u64;
      proc_id: u32;
      client_id: string;
    };
    link(fid: Fid, name: string): void;
    mkdir(name: string, mode: u32, gid: u32): Qid;
    renameat(oldname: string, newdirfid: Fid, newname: string): void;
    unlinkat(name: string, flags: u32): void;
  }

  export interface Fs {
    version(msize: u32, version: string): { msize: u32; version: string };
    auth(uname: string, aname: string, n_uname?: u32): { afid: Fid; aqid: Qid };
    attach(
      afid: Fid | undefined,
      uname: string,
      aname: string,
      n_uname?: u32,
    ): { fid: Fid; qid: Qid };
  }
}
