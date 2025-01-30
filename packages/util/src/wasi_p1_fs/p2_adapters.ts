import type {
  Advice,
  Datetime,
  DescriptorFlags,
  DescriptorStat,
  DescriptorType,
  ErrorCode,
  Filesize,
  NewTimestamp,
  OpenFlags,
  PathFlags,
} from "../../../../output/interfaces/wasi-filesystem-types";
import {
  advice,
  type device,
  errno,
  fdflags,
  type filesize,
  type filestat,
  filetype,
  fstflags,
  type inode,
  type linkcount,
  lookupflags,
  oflags,
  rights,
  type timestamp,
  u32,
} from "../wasi_p1_defs";
import { hasFlag } from "./util";

export function adviceToAdvice(x: advice): Advice {
  switch (x) {
    case advice.dontneed:
      return "dont-need";
    case advice.noreuse:
      return "no-reuse";
    case advice.normal:
      return "normal";
    case advice.random:
      return "random";
    case advice.sequential:
      return "sequential";
    case advice.willneed:
      return "will-need";
    default:
      throw new Error(`unexpected advice value ${x}`);
  }
}

export function errorCodeToErrno(x: ErrorCode): errno {
  switch (x) {
    case "access":
      return errno.acces;
    case "already":
      return errno.already;
    case "bad-descriptor":
      return errno.badf;
    case "busy":
      return errno.busy;
    case "cross-device":
      return errno.xdev;
    case "deadlock":
      return errno.deadlk;
    case "exist":
      return errno.exist;
    case "file-too-large":
      return errno._2big;
    case "illegal-byte-sequence":
      return errno.ilseq;
    case "in-progress":
      return errno.inprogress;
    case "insufficient-memory":
      return errno.nomem;
    case "insufficient-space":
      return errno.nospc;
    case "interrupted":
      return errno.intr;
    case "invalid":
      return errno.inval;
    case "invalid-seek":
      return errno.spipe;
    case "io":
      return errno.io;
    case "is-directory":
      return errno.isdir;
    case "loop":
      return errno.loop;
    case "message-size":
      return errno.msgsize;
    case "name-too-long":
      return errno.nametoolong;
    case "no-device":
      return errno.nodev;
    case "no-entry":
      return errno.noent;
    case "no-lock":
      return errno.nolck;
    case "no-such-device":
      return errno.nodev;
    case "no-tty":
      return errno.notty;
    case "not-directory":
      return errno.notdir;
    case "not-empty":
      return errno.notempty;
    case "not-permitted":
      return errno.notcapable;
    case "not-recoverable":
      return errno.notrecoverable;
    case "overflow":
      return errno.overflow;
    case "pipe":
      return errno.pipe;
    case "quota":
      return errno.dquot;
    case "read-only":
      return errno.rofs;
    case "text-file-busy":
      return errno.txtbsy;
    case "too-many-links":
      return errno.mlink;
    case "unsupported":
      return errno.notsup;
    case "would-block":
      return errno.again;
    default: {
      ((x: never) => {
        throw new Error(`unexpected ErrorCode value '${x}'`);
      })(x);
    }
  }
}

export function descriptorTypeToFiletype(x: DescriptorType): filetype {
  switch (x) {
    case "block-device":
      return filetype.block_device;
    case "character-device":
      return filetype.character_device;
    case "directory":
      return filetype.directory;
    case "fifo":
      return filetype.unknown;
    case "regular-file":
      return filetype.regular_file;
    case "socket":
      return filetype.unknown;
    case "symbolic-link":
      return filetype.symbolic_link;
    case "unknown":
      return filetype.unknown;
    default: {
      ((x: never) => {
        throw new Error(`unexpected DescriptorType value '${x}'`);
      })(x);
    }
  }
}

const NANOSECONDS_PER_SECOND = 1_000_000_000n;

export function datetimeToTimestamp(x: Datetime | undefined): timestamp {
  return ((x?.seconds ?? 0n) * NANOSECONDS_PER_SECOND +
    (x?.seconds ?? 0n)) as timestamp;
}

export function timestampToDatetime(x: timestamp): Datetime {
  return {
    seconds: x / NANOSECONDS_PER_SECOND,
    nanoseconds: Number(x % NANOSECONDS_PER_SECOND),
  };
}

export function p2FilesizeToFilesize(x: Filesize): filesize {
  try {
    return u32(Number(x)) as filesize;
  } catch (e) {
    if (!(e instanceof RangeError)) throw e;
    throw errno._2big;
  }
}

export function descriptorStatToFilestat(
  device: device,
  inode: inode,
  x: DescriptorStat,
): filestat {
  return [
    device,
    inode,
    descriptorTypeToFiletype(x.type),
    x.linkCount as linkcount,
    p2FilesizeToFilesize(x.size),
    datetimeToTimestamp(x.dataAccessTimestamp),
    datetimeToTimestamp(x.dataModificationTimestamp),
    datetimeToTimestamp(x.statusChangeTimestamp),
  ] as filestat;
}

export function lookupflagsToPathFlags(x: lookupflags): PathFlags {
  return {
    symlinkFollow: hasFlag(x, lookupflags.symlink_follow),
  };
}

export function oflagsToOpenFlags(x: oflags): OpenFlags {
  return {
    create: hasFlag(x, oflags.creat),
    directory: hasFlag(x, oflags.directory),
    exclusive: hasFlag(x, oflags.excl),
    truncate: hasFlag(x, oflags.trunc),
  };
}

export function p1TimesToP2Times(
  atim: timestamp,
  mtim: timestamp,
  fst_flags: fstflags,
): [NewTimestamp, NewTimestamp] {
  return [
    hasFlag(fst_flags, fstflags.atim | fstflags.atim_now)
      ? hasFlag(fst_flags, fstflags.atim_now)
        ? { tag: "now" }
        : { tag: "timestamp", val: timestampToDatetime(atim) }
      : { tag: "no-change" },
    hasFlag(fst_flags, fstflags.mtim | fstflags.mtim_now)
      ? hasFlag(fst_flags, fstflags.mtim_now)
        ? { tag: "now" }
        : { tag: "timestamp", val: timestampToDatetime(mtim) }
      : { tag: "no-change" },
  ];
}

export function rightsAndFdflagsToDescriptorFlags(
  x: rights,
  fdflags_: fdflags,
): DescriptorFlags {
  return {
    read: hasFlag(
      x,
      rights.fd_read |
        rights.fd_readdir |
        rights.path_filestat_get |
        rights.path_readlink,
    ),
    write: hasFlag(
      x,
      rights.fd_allocate |
        rights.fd_datasync |
        rights.fd_filestat_set_size |
        rights.fd_filestat_set_times |
        rights.fd_sync |
        rights.fd_write |
        rights.path_create_directory |
        rights.path_create_file |
        rights.path_filestat_set_size |
        rights.path_filestat_set_times |
        rights.path_link_target |
        rights.path_remove_directory |
        rights.path_rename_source |
        rights.path_symlink |
        rights.path_unlink_file,
    ),
    fileIntegritySync: hasFlag(fdflags_, fdflags.sync),
    dataIntegritySync: hasFlag(fdflags_, fdflags.dsync),
    requestedWriteSync: hasFlag(fdflags_, fdflags.rsync),
    mutateDirectory: hasFlag(
      x,
      rights.path_create_directory |
        rights.path_create_file |
        rights.path_filestat_set_size |
        rights.path_filestat_set_times |
        rights.path_link_target |
        rights.path_remove_directory |
        rights.path_rename_source |
        rights.path_rename_target |
        rights.path_symlink |
        rights.path_unlink_file,
    ),
  };
}
