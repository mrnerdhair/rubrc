import type { LittleEndianDataView } from "./endian_data_view";
import { type Int, type i64 as s64, u8, u16, u32, u64 } from "./integers";

export {
  i8 as s8,
  i16 as s16,
  i32 as s32,
  i64 as s64,
  u8,
  u16,
  u32,
  u64,
} from "./integers";

declare const type: unique symbol;
declare const alignment: unique symbol;
declare const flags: unique symbol;

type Subtype<T, U extends { readonly [type]: unknown }> = T & {
  readonly [type]?: U[typeof type];
};

export type Alignment<
  T extends number,
  U extends [...unknown[]],
  V extends { readonly [type]: unknown } = { readonly [type]: unknown },
> = Subtype<U & { readonly [alignment]?: T }, V>;

type ValueOf<
  T extends Int,
  U extends Record<string, T>,
  V extends { readonly [type]: unknown } = { readonly [type]: unknown },
> = {
  [K in keyof U]: Subtype<U[K] & T, V>;
}[keyof U];

type Flags<
  T extends Int,
  U extends Record<string, T>,
  V extends { readonly [type]: unknown } = { readonly [type]: unknown },
> = Subtype<T, V> & { readonly [flags]?: U };

export type Pointer<T> = Subtype<u32, { readonly [type]: Pointer<T> }>;
export type ConstPointer<T> = Subtype<
  u32,
  { readonly [type]: ConstPointer<T> }
>;

export type size = Subtype<u32, { readonly [type]: size }>;
export type filesize = Subtype<u32, { readonly [type]: filesize }>;
export type timestamp = Subtype<u64, { readonly [type]: timestamp }>;
export type clockid = ValueOf<
  u32,
  typeof clockid,
  { readonly [type]: clockid }
>;
export const clockid = {
  realtime: u32(0),
  monotonic: u32(1),
  process_cputime_id: u32(2),
  thread_cputime_id: u32(3),
} as const;
export type errno = ValueOf<u16, typeof errno, { readonly [type]: errno }>;
export const errno = {
  // No error occurred. System call completed successfully.
  success: u16(0),
  // Argument list too long.
  _2big: u16(1),
  // Permission denied.
  acces: u16(2),
  // Address in use.
  addrinuse: u16(3),
  // Address not available.
  addrnotavail: u16(4),
  // Address family not supported.
  afnosupport: u16(5),
  // Resource unavailable, or operation would block.
  again: u16(6),
  // Connection already in progress.
  already: u16(7),
  // Bad file descriptor.
  badf: u16(8),
  // Bad message.
  badmsg: u16(9),
  // Device or resource busy.
  busy: u16(10),
  // Operation canceled.
  canceled: u16(11),
  // No child processes.
  child: u16(12),
  // Connection aborted.
  connaborted: u16(13),
  // Connection refused.
  connrefused: u16(14),
  // Connection reset.
  connreset: u16(15),
  // Resource deadlock would occur.
  deadlk: u16(16),
  // Destination address required.
  destaddrreq: u16(17),
  // Mathematics argument out of domain of function.
  dom: u16(18),
  // Reserved.
  dquot: u16(19),
  // File exists.
  exist: u16(20),
  // Bad address.
  fault: u16(21),
  // File too large.
  fbig: u16(22),
  // Host is unreachable.
  hostunreach: u16(23),
  // Identifier removed.
  idrm: u16(24),
  // Illegal byte sequence.
  ilseq: u16(25),
  // Operation in progress.
  inprogress: u16(26),
  // Interrupted function.
  intr: u16(27),
  // Invalid argument.
  inval: u16(28),
  // I/O error.
  io: u16(29),
  // Socket is connected.
  isconn: u16(30),
  // Is a directory.
  isdir: u16(31),
  // Too many levels of symbolic links.
  loop: u16(32),
  // File descriptor value too large.
  mfile: u16(33),
  // Too many links.
  mlink: u16(34),
  // Message too large.
  msgsize: u16(35),
  // Reserved.
  multihop: u16(36),
  // Filename too long.
  nametoolong: u16(37),
  // Network is down.
  netdown: u16(38),
  // Connection aborted by network.
  netreset: u16(39),
  // Network unreachable.
  netunreach: u16(40),
  // Too many files open in system.
  nfile: u16(41),
  // No buffer space available.
  nobufs: u16(42),
  // No such device.
  nodev: u16(43),
  // No such file or directory.
  noent: u16(44),
  // Executable file format error.
  noexec: u16(45),
  // No locks available.
  nolck: u16(46),
  // Reserved.
  nolink: u16(47),
  // Not enough space.
  nomem: u16(48),
  // No message of the desired type.
  nomsg: u16(49),
  // Protocol not available.
  noprotoopt: u16(50),
  // No space left on device.
  nospc: u16(51),
  // Function not supported.
  nosys: u16(52),
  // The socket is not connected.
  notconn: u16(53),
  // Not a directory or a symbolic link to a directory.
  notdir: u16(54),
  // Directory not empty.
  notempty: u16(55),
  // State not recoverable.
  notrecoverable: u16(56),
  // Not a socket.
  notsock: u16(57),
  // Not supported, or operation not supported on socket.
  notsup: u16(58),
  // Inappropriate I/O control operation.
  notty: u16(59),
  // No such device or address.
  nxio: u16(60),
  // Value too large to be stored in data type.
  overflow: u16(61),
  // Previous owner died.
  ownerdead: u16(62),
  // Operation not permitted.
  perm: u16(63),
  // Broken pipe.
  pipe: u16(64),
  // Protocol error.
  proto: u16(65),
  // Protocol not supported.
  protonosupport: u16(66),
  // Protocol wrong type for socket.
  prototype: u16(67),
  // Result too large.
  range: u16(68),
  // Read-only file system.
  rofs: u16(69),
  // Invalid seek.
  spipe: u16(70),
  // No such process.
  srch: u16(71),
  // Reserved.
  stale: u16(72),
  // Connection timed out.
  timedout: u16(73),
  // Text file busy.
  txtbsy: u16(74),
  // Cross-device link.
  xdev: u16(75),
  // Extension: Capabilities insufficient.
  notcapable: u16(76),
} as const;
export type rights = Flags<u64, typeof rights, { readonly [type]: rights }>;
export const rights = {
  none: u64(0x0000000000000000n),
  fd_datasync: u64(0x0000000000000001n),
  fd_read: u64(0x0000000000000002n),
  fd_seek: u64(0x0000000000000004n),
  fd_fdstat_set_flags: u64(0x0000000000000008n),
  fd_sync: u64(0x0000000000000010n),
  fd_tell: u64(0x0000000000000020n),
  fd_write: u64(0x0000000000000040n),
  fd_advise: u64(0x0000000000000080n),
  fd_allocate: u64(0x0000000000000100n),
  path_create_directory: u64(0x0000000000000200n),
  path_create_file: u64(0x0000000000000400n),
  path_link_source: u64(0x0000000000000800n),
  path_link_target: u64(0x0000000000001000n),
  path_open: u64(0x0000000000002000n),
  fd_readdir: u64(0x0000000000004000n),
  path_readlink: u64(0x0000000000008000n),
  path_rename_source: u64(0x0000000000010000n),
  path_rename_target: u64(0x0000000000020000n),
  path_filestat_get: u64(0x0000000000040000n),
  path_filestat_set_size: u64(0x0000000000080000n),
  path_filestat_set_times: u64(0x0000000000100000n),
  fd_filestat_get: u64(0x0000000000200000n),
  fd_filestat_set_size: u64(0x0000000000400000n),
  fd_filestat_set_times: u64(0x0000000000800000n),
  path_symlink: u64(0x0000000001000000n),
  path_remove_directory: u64(0x0000000002000000n),
  path_unlink_file: u64(0x0000000004000000n),
  poll_fd_readwrite: u64(0x0000000008000000n),
  sock_shutdown: u64(0x0000000010000000n),
  sock_accept: u64(0x0000000020000000n),
} as const;
export type fd = Subtype<u32, { readonly [type]: fd }>;
export type iovec = Alignment<
  4,
  [buf: Pointer<u8>, buf_len: size],
  { readonly [type]: iovec }
>;
export namespace iovec {
  export const SIZE: size = (4 * 2) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<iovec>,
    value: iovec,
  ) {
    const iter = view.stride(byteOffset, 4, 2);
    iter.next().value.setUint32(0, value[0]);
    iter.next().value.setUint32(0, value[1]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<iovec>,
  ): iovec {
    const iter = view.stride(byteOffset, 4, 2);
    return [
      iter.next().value.getUint32(0) as Pointer<u8>,
      iter.next().value.getUint32(0) as size,
    ];
  }
}
export type ciovec = Alignment<
  4,
  [buf: ConstPointer<u8>, buf_len: size],
  { readonly [type]: ciovec }
>;
export namespace ciovec {
  export const SIZE: size = (4 * 2) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<ciovec>,
    value: ciovec,
  ) {
    const iter = view.stride(byteOffset, 4, 2);
    iter.next().value.setUint32(0, value[0]);
    iter.next().value.setUint32(0, value[1]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<ciovec>,
  ): ciovec {
    const iter = view.stride(byteOffset, 4, 2);
    return [
      iter.next().value.getUint32(0) as ConstPointer<u8>,
      iter.next().value.getUint32(0) as size,
    ];
  }
}
export type filedelta = Subtype<s64, { readonly [type]: filedelta }>;
export type whence = ValueOf<u8, typeof whence, { readonly [type]: whence }>;
export const whence = {
  set: u8(0),
  cur: u8(1),
  end: u8(2),
} as const;
export type dircookie = Subtype<u64, { readonly [type]: dircookie }>;
export type dirnamlen = Subtype<u32, { readonly [type]: dirnamlen }>;
export type inode = Subtype<u64, { readonly [type]: inode }>;
export type filetype = ValueOf<
  u8,
  typeof filetype,
  { readonly [type]: filetype }
>;
export const filetype = {
  // The type of the file descriptor or file is unknown or is different from any of the other types specified.
  unknown: u8(0),
  // The file descriptor or file refers to a block device inode.
  block_device: u8(1),
  // The file descriptor or file refers to a character device inode.
  character_device: u8(2),
  // The file descriptor or file refers to a directory inode.
  directory: u8(3),
  // The file descriptor or file refers to a regular file inode.
  regular_file: u8(4),
  // The file descriptor or file refers to a datagram socket.
  socket_dgram: u8(5),
  // The file descriptor or file refers to a byte-stream socket.
  socket_stream: u8(6),
  // The file refers to a symbolic link inode.
  symbolic_link: u8(7),
} as const;
export type dirent = Alignment<
  8,
  [d_next: dircookie, d_ino: inode, d_namlen: dirnamlen, d_type: filetype],
  { readonly [type]: dirent }
>;
export namespace dirent {
  export const SIZE: size = (8 * 4) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<dirent>,
    value: dirent,
  ) {
    const iter = view.stride(byteOffset, 8, 4);
    iter.next().value.setBigUint64(0, value[0]);
    iter.next().value.setBigUint64(0, value[1]);
    iter.next().value.setUint32(0, value[2]);
    iter.next().value.setUint8(0, value[3]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<dirent>,
  ): dirent {
    const iter = view.stride(byteOffset, 8, 4);
    return [
      iter.next().value.getBigUint64(0) as dircookie,
      iter.next().value.getBigUint64(0) as inode,
      iter.next().value.getUint32(0) as dirnamlen,
      iter.next().value.getUint8(0) as filetype,
    ];
  }
}
export type advice = ValueOf<u8, typeof advice, { readonly [type]: advice }>;
export const advice = {
  // The application has no advice to give on its behavior with respect to the specified data.
  normal: u8(0),
  // The application expects to access the specified data sequentially from lower offsets to higher offsets.
  sequential: u8(1),
  // The application expects to access the specified data in a random order.
  random: u8(2),
  // The application expects to access the specified data in the near future.
  willneed: u8(3),
  // The application expects that it will not access the specified data in the near future.
  dontneed: u8(4),
  // The application expects to access the specified data once and then not reuse it thereafter.
  noreuse: u8(5),
} as const;
export type fdflags = Flags<u16, typeof fdflags, { readonly [type]: fdflags }>;
export const fdflags = {
  none: u16(0x0000),
  append: u16(0x0001),
  dsync: u16(0x0002),
  nonblock: u16(0x0004),
  rsync: u16(0x0008),
  sync: u16(0x0010),
} as const;
export type fdstat = Alignment<
  8,
  [
    fs_filetype: filetype,
    fs_flags: fdflags,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
  ],
  { readonly [type]: fdstat }
>;
export namespace fdstat {
  export const SIZE: size = (8 * 4) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<fdstat>,
    value: fdstat,
  ) {
    const iter = view.stride(byteOffset, 8, 4);
    iter.next().value.setUint8(0, value[0]);
    iter.next().value.setUint16(0, value[1]);
    iter.next().value.setBigUint64(0, value[2]);
    iter.next().value.setBigUint64(0, value[3]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<fdstat>,
  ): fdstat {
    const iter = view.stride(byteOffset, 8, 4);
    return [
      iter.next().value.getUint8(0) as filetype,
      iter.next().value.getUint16(0) as fdflags,
      iter.next().value.getBigUint64(0) as rights,
      iter.next().value.getBigUint64(0) as rights,
    ];
  }
}
export type device = Subtype<u64, { readonly [type]: device }>;
export type fstflags = Flags<
  u16,
  typeof fstflags,
  { readonly [type]: fstflags }
>;
export const fstflags = {
  none: u16(0x0000),
  atim: u16(0x0001),
  atim_now: u16(0x0002),
  mtim: u16(0x0004),
  mtim_now: u16(0x0008),
} as const;
export type lookupflags = Flags<
  u32,
  typeof lookupflags,
  { readonly [type]: lookupflags }
>;
export const lookupflags = {
  none: u32(0x00000000),
  symlink_follow: u32(0x00000001),
} as const;
export type oflags = Flags<u16, typeof oflags, { readonly [type]: oflags }>;
export const oflags = {
  none: u16(0x0000),
  creat: u16(0x0001),
  directory: u16(0x0002),
  excl: u16(0x0004),
  trunc: u16(0x0008),
} as const;
export type linkcount = Subtype<u64, { readonly [type]: linkcount }>;
export type filestat = Alignment<
  8,
  [
    dev: device,
    ino: inode,
    filetype: filetype,
    nlink: linkcount,
    size: filesize,
    atim: timestamp,
    mtim: timestamp,
    ctim: timestamp,
  ],
  { readonly [type]: filestat }
>;
export namespace filestat {
  export const SIZE: size = (8 * 8) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<filestat>,
    value: filestat,
  ) {
    const iter = view.stride(byteOffset, 8, 8);
    iter.next().value.setBigUint64(0, value[0]);
    iter.next().value.setBigUint64(0, value[1]);
    iter.next().value.setUint8(0, value[2]);
    iter.next().value.setBigUint64(0, value[3]);
    iter.next().value.setUint32(0, value[4]);
    iter.next().value.setBigUint64(0, value[5]);
    iter.next().value.setBigUint64(0, value[6]);
    iter.next().value.setBigUint64(0, value[7]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<filestat>,
  ): filestat {
    const iter = view.stride(byteOffset, 8, 8);
    return [
      iter.next().value.getBigUint64(0) as device,
      iter.next().value.getBigUint64(0) as inode,
      iter.next().value.getUint8(0) as filetype,
      iter.next().value.getBigUint64(0) as linkcount,
      iter.next().value.getUint32(0) as filesize,
      iter.next().value.getBigUint64(0) as timestamp,
      iter.next().value.getBigUint64(0) as timestamp,
      iter.next().value.getBigUint64(0) as timestamp,
    ];
  }
}
export type userdata = Subtype<u64, { readonly [type]: userdata }>;
export type eventtype = ValueOf<
  u8,
  typeof eventtype,
  { readonly [type]: eventtype }
>;
export const eventtype = {
  clock: u8(0),
  fd_read: u8(1),
  fd_write: u8(2),
} as const;
export type eventrwflags = Flags<
  u16,
  typeof eventrwflags,
  { readonly [type]: eventrwflags }
>;
export const eventrwflags = {
  none: u16(0x0000),
  fd_readwrite_hangup: u16(0x0001),
} as const;
export type event_fd_readwrite = Alignment<
  8,
  [nbytes: filesize, flags: eventrwflags],
  { readonly [type]: event_fd_readwrite }
>;
export namespace event_fd_readwrite {
  export const SIZE: size = (8 * 2) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<event_fd_readwrite>,
    value: event_fd_readwrite,
  ) {
    const iter = view.stride(byteOffset, 8, 2);
    iter.next().value.setUint32(0, value[0]);
    iter.next().value.setUint16(0, value[1]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<event_fd_readwrite>,
  ): event_fd_readwrite {
    const iter = view.stride(byteOffset, 8, 2);
    return [
      iter.next().value.getUint32(0) as filesize,
      iter.next().value.getUint16(0) as eventrwflags,
    ];
  }
}
export type event = Alignment<
  8,
  [
    userdata: userdata,
    error: errno,
    type: eventtype,
    fd_readwrite: event_fd_readwrite,
  ],
  { readonly [type]: event }
>;
export namespace event {
  export const SIZE: size = (8 * 3 +
    Math.ceil(event_fd_readwrite.SIZE / 8) * 8) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<event>,
    value: event,
  ) {
    const iter = view.stride(byteOffset, 8, 3);
    iter.next().value.setBigUint64(0, value[0]);
    iter.next().value.setUint16(0, value[1]);
    iter.next().value.setUint8(0, value[2]);
    event_fd_readwrite.write(
      iter.next().value,
      0 as Pointer<event_fd_readwrite>,
      value[3],
    );
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<event>,
  ): event {
    const iter = view.stride(byteOffset, 8, 3);
    return [
      iter.next().value.getBigUint64(0) as userdata,
      iter.next().value.getUint16(0) as errno,
      iter.next().value.getUint8(0) as eventtype,
      event_fd_readwrite.read(
        iter.next().value,
        0 as Pointer<event_fd_readwrite>,
      ),
    ];
  }
}
export type subclockflags = Flags<
  u16,
  typeof subclockflags,
  { readonly [type]: subclockflags }
>;
export const subclockflags = {
  none: u16(0x0000),
  subscription_clock_abstime: u16(0x0001),
} as const;
export type subscription_clock = Alignment<
  8,
  [id: clockid, timeout: timestamp, precision: timestamp, flags: subclockflags],
  { readonly [type]: subscription_clock }
>;
export namespace subscription_clock {
  export const SIZE: size = (8 * 4) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription_clock>,
    value: subscription_clock,
  ) {
    const iter = view.stride(byteOffset, 8, 4);
    iter.next().value.setUint32(0, value[0]);
    iter.next().value.setBigUint64(0, value[1]);
    iter.next().value.setBigUint64(0, value[2]);
    iter.next().value.setUint16(0, value[3]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription_clock>,
  ): subscription_clock {
    const iter = view.stride(byteOffset, 8, 4);
    return [
      iter.next().value.getUint32(0) as clockid,
      iter.next().value.getBigUint64(0) as timestamp,
      iter.next().value.getBigUint64(0) as timestamp,
      iter.next().value.getUint16(0) as subclockflags,
    ];
  }
}
export type subscription_fd_readwrite = Alignment<
  4,
  [file_descriptor: fd],
  { readonly [type]: subscription_fd_readwrite }
>;
export namespace subscription_fd_readwrite {
  export const SIZE: size = (4 * 1) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription_fd_readwrite>,
    value: subscription_fd_readwrite,
  ) {
    const iter = view.stride(byteOffset, 4, 1);
    iter.next().value.setUint32(0, value[0]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription_fd_readwrite>,
  ): subscription_fd_readwrite {
    const iter = view.stride(byteOffset, 4, 1);
    return [iter.next().value.getUint32(0) as fd];
  }
}
export type subscription_u_discriminator = ValueOf<
  u8,
  typeof subscription_u_discriminator,
  { readonly [type]: unique symbol }
>;
export const subscription_u_discriminator = {
  clock: u8(0),
  fd_read: u8(1),
  fd_write: u8(2),
} as const;
export type subscription_u = Alignment<
  8,
  | [typeof subscription_u_discriminator.clock, subscription_clock]
  | [typeof subscription_u_discriminator.fd_read, subscription_fd_readwrite]
  | [typeof subscription_u_discriminator.fd_write, subscription_fd_readwrite],
  { readonly [type]: subscription_u }
>;
export namespace subscription_u {
  export const SIZE: size = (8 * 1 +
    Math.max(
      Math.ceil(subscription_clock.SIZE / 8) * 8,
      Math.ceil(subscription_fd_readwrite.SIZE / 8) * 8,
    )) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription_u>,
    value: subscription_u,
  ) {
    const iter = view.stride(byteOffset, 8, 1);
    iter.next().value.setUint8(0, value[0]);
    switch (value[0]) {
      case subscription_u_discriminator.clock: {
        subscription_clock.write(
          iter.next().value,
          0 as Pointer<subscription_clock>,
          value[1] as subscription_clock,
        );
        break;
      }
      case subscription_u_discriminator.fd_read:
      case subscription_u_discriminator.fd_write: {
        subscription_fd_readwrite.write(
          iter.next().value,
          0 as Pointer<subscription_fd_readwrite>,
          value[1] as subscription_fd_readwrite,
        );
        break;
      }
      default:
        throw new RangeError();
    }
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription_u>,
  ): subscription_u {
    const iter = view.stride(byteOffset, 8, 1);
    const discriminator = iter
      .next()
      .value.getUint32(0) as subscription_u_discriminator;
    switch (discriminator) {
      case subscription_u_discriminator.clock:
        return [
          discriminator,
          subscription_clock.read(
            iter.next().value,
            0 as Pointer<subscription_clock>,
          ),
        ];
      case subscription_u_discriminator.fd_read:
        return [
          discriminator,
          subscription_fd_readwrite.read(
            iter.next().value,
            0 as Pointer<subscription_fd_readwrite>,
          ),
        ];
      case subscription_u_discriminator.fd_write:
        return [
          discriminator,
          subscription_fd_readwrite.read(
            iter.next().value,
            0 as Pointer<subscription_fd_readwrite>,
          ),
        ];
      default:
        throw new RangeError();
    }
  }
}
export type subscription = Alignment<
  8,
  [userdata: userdata, u: subscription_u],
  { readonly [type]: unique symbol }
>;
export namespace subscription {
  export const SIZE: size = (8 * 1 + subscription_u.SIZE) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription>,
    value: subscription,
  ) {
    const iter = view.stride(byteOffset, 8, 1);
    iter.next().value.setBigUint64(0, value[0]);
    subscription_u.write(
      iter.next().value,
      0 as Pointer<subscription_u>,
      value[1],
    );
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<subscription>,
  ): subscription {
    const iter = view.stride(byteOffset, 8, 1);
    return [
      iter.next().value.getBigUint64(0) as userdata,
      subscription_u.read(iter.next().value, 0 as Pointer<subscription_u>),
    ];
  }
}
export type exitcode = Subtype<u32, { readonly [type]: exitcode }>;
export type signal = ValueOf<
  u8,
  typeof signal,
  { readonly [type]: unique symbol }
>;
export const signal = {
  // No signal. Note that POSIX has special semantics for kill(pid, 0), so this value is reserved.
  none: u8(0),
  // Hangup. Action: Terminates the process.
  hup: u8(1),
  // Terminate interrupt signal. Action: Terminates the process.
  int: u8(2),
  // Terminal quit signal. Action: Terminates the process.
  quit: u8(3),
  // Illegal instruction. Action: Terminates the process.
  ill: u8(4),
  // Trace/breakpoint trap. Action: Terminates the process.
  trap: u8(5),
  // Process abort signal. Action: Terminates the process.
  abrt: u8(6),
  // Access to an undefined portion of a memory object. Action: Terminates the process.
  bus: u8(7),
  // Erroneous arithmetic operation. Action: Terminates the process.
  fpe: u8(8),
  // Kill. Action: Terminates the process.
  kill: u8(9),
  // User-defined signal 1. Action: Terminates the process.
  usr1: u8(10),
  // Invalid memory reference. Action: Terminates the process.
  segv: u8(11),
  // User-defined signal 2. Action: Terminates the process.
  usr2: u8(12),
  // Write on a pipe with no one to read it. Action: Ignored.
  pipe: u8(13),
  // Alarm clock. Action: Terminates the process.
  alrm: u8(14),
  // Termination signal. Action: Terminates the process.
  term: u8(15),
  // Child process terminated, stopped, or continued. Action: Ignored.
  chld: u8(16),
  // Continue executing, if stopped. Action: Continues executing, if stopped.
  cont: u8(17),
  // Stop executing. Action: Stops executing.
  stop: u8(18),
  // Terminal stop signal. Action: Stops executing.
  tstp: u8(19),
  // Background process attempting read. Action: Stops executing.
  ttin: u8(20),
  // Background process attempting write. Action: Stops executing.
  ttou: u8(21),
  // High bandwidth data is available at a socket. Action: Ignored.
  urg: u8(22),
  // CPU time limit exceeded. Action: Terminates the process.
  xcpu: u8(23),
  // File size limit exceeded. Action: Terminates the process.
  xfsz: u8(24),
  // Virtual timer expired. Action: Terminates the process.
  vtalrm: u8(25),
  // Profiling timer expired. Action: Terminates the process.
  prof: u8(26),
  // Window changed. Action: Ignored.
  winch: u8(27),
  // I/O possible. Action: Terminates the process.
  poll: u8(28),
  // Power failure. Action: Terminates the process.
  pwr: u8(29),
  // Bad system call. Action: Terminates the process.
  sys: u8(30),
} as const;
export type riflags = Flags<u16, typeof riflags, { readonly [type]: riflags }>;
export const riflags = {
  none: u16(0x0000),
  recv_peek: u16(0x0001),
  recv_waitall: u16(0x0002),
} as const;
export type roflags = Flags<u16, typeof roflags, { readonly [type]: roflags }>;
export const roflags = {
  none: u16(0x0000),
  recv_data_truncated: u16(0x0001),
} as const;
export type siflags = Flags<u16, typeof siflags, { readonly [type]: siflags }>;
export const siflags = {
  none: u16(0x0000),
} as const;
export type sdflags = Flags<u8, typeof sdflags, { readonly [type]: sdflags }>;
export const sdflags = {
  none: u8(0x00),
  rd: u8(0x01),
  wr: u8(0x02),
} as const;
export type preopentype = ValueOf<
  u8,
  typeof preopentype,
  { readonly [type]: preopentype }
>;
export const preopentype = {
  dir: u8(0),
} as const;
export type prestat_dir = Alignment<
  4,
  [pr_name_len: size],
  { readonly [type]: prestat_dir }
>;
export namespace prestat_dir {
  export const SIZE: size = (4 * 1) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<prestat_dir>,
    value: prestat_dir,
  ) {
    const iter = view.stride(byteOffset, 4, 1);
    iter.next().value.setUint32(0, value[0]);
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<prestat_dir>,
  ): prestat_dir {
    const iter = view.stride(byteOffset, 4, 1);
    return [iter.next().value.getUint32(0) as size];
  }
}
export type prestat_discriminator = ValueOf<
  u8,
  typeof prestat_discriminator,
  { readonly [type]: prestat_discriminator }
>;
export const prestat_discriminator = {
  dir: u8(0),
} as const;
export type prestat = Alignment<
  4,
  [typeof prestat_discriminator.dir, prestat_dir],
  { readonly [type]: prestat }
>;
export namespace prestat {
  export const SIZE: size = (4 * 1 +
    Math.max(Math.ceil(prestat_dir.SIZE / 4) * 4)) as size;
  export function write(
    view: LittleEndianDataView,
    byteOffset: Pointer<prestat>,
    value: prestat,
  ) {
    const iter = view.stride(byteOffset, 4, 1);
    iter.next().value.setUint8(0, value[0]);
    switch (value[0]) {
      case prestat_discriminator.dir: {
        prestat_dir.write(
          iter.next().value,
          0 as Pointer<prestat_dir>,
          value[1] as prestat_dir,
        );
        break;
      }
      default:
        throw new RangeError();
    }
  }
  export function read(
    view: LittleEndianDataView,
    byteOffset: Pointer<prestat>,
  ): prestat {
    const iter = view.stride(byteOffset, 4, 1);
    const discriminator = iter
      .next()
      .value.getUint8(0) as prestat_discriminator;
    switch (discriminator) {
      case prestat_discriminator.dir:
        return [
          discriminator,
          prestat_dir.read(iter.next().value, 0 as Pointer<prestat_dir>),
        ];
      default:
        throw new RangeError();
    }
  }
}

export interface WasiP1Imports
  extends WasiP1FilesystemImports,
    WasiP1SocketImports {
  args_get(
    this: void,
    argv: Pointer<Pointer<u8>>,
    argv_buf: Pointer<u8>,
  ): errno;
  args_sizes_get(
    this: void,
    out_ptr_arg_count: Pointer<size>,
    out_ptr_argv_buf_size: Pointer<size>,
  ): errno;
  environ_get(
    this: void,
    environ: Pointer<Pointer<u8>>,
    environ_buf: Pointer<u8>,
  ): errno;
  environ_sizes_get(
    this: void,
    out_ptr_environ_count: Pointer<size>,
    out_ptr_environ_buf_size: Pointer<size>,
  ): errno;
  clock_res_get(this: void, id: clockid, out_ptr: Pointer<timestamp>): errno;
  clock_time_get(
    this: void,
    id: clockid,
    precision: timestamp,
    out_ptr: Pointer<timestamp>,
  ): errno;

  poll_oneoff(
    this: void,
    in_: ConstPointer<subscription>,
    out: Pointer<event>,
    nsubscriptions: size,
    out_ptr: Pointer<size>,
  ): errno;
  proc_exit(this: void, rval: exitcode): never;
  proc_raise(this: void, sig: signal): errno;
  sched_yield(this: void): errno;
  random_get(this: void, buf: Pointer<u8>, buf_len: size): errno;
}

export interface WasiP1FilesystemImports {
  fd_advise(
    this: void,
    fd: fd,
    offset: filesize,
    len: filesize,
    advice: advice,
  ): errno;
  fd_allocate(this: void, fd: fd, offset: filesize, len: filesize): errno;
  fd_close(this: void, fd: fd): errno;
  fd_datasync(this: void, fd: fd): errno;
  fd_fdstat_get(this: void, fd: fd, out_ptr: Pointer<fdstat>): errno;
  fd_fdstat_set_flags(this: void, fd: fd, flags: fdflags): errno;
  fd_fdstat_set_rights(
    this: void,
    fd: fd,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
  ): errno;
  fd_filestat_get(this: void, fd: fd, out_ptr: Pointer<filestat>): errno;
  fd_filestat_set_size(this: void, fd: fd, size: filesize): errno;
  fd_filestat_set_times(
    this: void,
    fd: fd,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): errno;
  fd_pread(
    this: void,
    fd: fd,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): errno;
  fd_prestat_get(this: void, fd: fd, out_ptr: Pointer<prestat>): errno;
  fd_prestat_dir_name(
    this: void,
    fd: fd,
    path: Pointer<u8>,
    path_len: size,
  ): errno;
  fd_pwrite(
    this: void,
    fd: fd,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): errno;
  fd_read(
    this: void,
    fd: fd,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): errno;
  fd_readdir(
    this: void,
    fd: fd,
    buf: Pointer<u8>,
    buf_len: size,
    cookie: dircookie,
    out_ptr: Pointer<size>,
  ): errno;
  fd_renumber(this: void, fd: fd, to: fd): errno;
  fd_seek(
    this: void,
    fd: fd,
    offset: filedelta,
    whence: whence,
    out_ptr: Pointer<filesize>,
  ): errno;
  fd_sync(this: void, fd: fd): errno;
  fd_tell(this: void, fd: fd, out_ptr: Pointer<filesize>): errno;
  fd_write(
    this: void,
    fd: fd,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): errno;
  path_create_directory(
    this: void,
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): errno;
  path_filestat_get(
    this: void,
    fd: fd,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    out_ptr: Pointer<filestat>,
  ): errno;
  path_filestat_set_times(
    this: void,
    fd: fd,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): errno;
  path_link(
    this: void,
    old_fd: fd,
    old_flags: lookupflags,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno;
  path_open(
    this: void,
    fd: fd,
    dirflags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    oflags: oflags,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
    fdflags: fdflags,
    out_ptr: Pointer<fd>,
  ): errno;
  path_readlink(
    this: void,
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
    buf: Pointer<u8>,
    buf_len: size,
    out_ptr: Pointer<size>,
  ): errno;
  path_remove_directory(
    this: void,
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): errno;
  path_rename(
    this: void,
    fd: fd,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno;
  path_symlink(
    this: void,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno;
  path_unlink_file(
    this: void,
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
  ): errno;
}

export interface WasiP1SocketImports {
  sock_accept(this: void, fd: fd, flags: fdflags, out_ptr: Pointer<fd>): errno;
  sock_recv(
    this: void,
    fd: fd,
    ri_data_ptr: Pointer<iovec>,
    ri_data_len: size,
    ri_flags: riflags,
    out_ptr_size: Pointer<size>,
    out_ptr_roflags: Pointer<roflags>,
  ): errno;
  sock_send(
    this: void,
    fd: fd,
    si_data_ptr: Pointer<ciovec>,
    si_data_len: size,
    si_flags: siflags,
    out_ptr: Pointer<size>,
  ): errno;
  sock_shutdown(this: void, fd: fd, how: sdflags): errno;
}
