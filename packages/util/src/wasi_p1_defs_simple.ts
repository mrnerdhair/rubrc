export type Flags<T> = T;
export type Alignment4<T> = T;
export type Alignment8<T> = T;

export type s8 = number;
export type s16 = number;
export type s32 = number;
export type s64 = bigint;

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type u64 = bigint;

export type Pointer<_T> = u32;
export type ConstPointer<_T> = u32;

export type size = u32;
export type filesize = u32;
export type timestamp = u64;
export type clockid = u32;
export const clockid = {
  realtime: 0,
  monotonic: 1,
  process_cputime_id: 2,
  thread_cputime_id: 3,
} as const satisfies Record<string, clockid>;
export type errno = u16;
export const errno = {
  // No error occurred. System call completed successfully.
  success: 0,
  // Argument list too long.
  _2big: 1,
  // Permission denied.
  acces: 2,
  // Address in use.
  addrinuse: 3,
  // Address not available.
  addrnotavail: 4,
  // Address family not supported.
  afnosupport: 5,
  // Resource unavailable, or operation would block.
  again: 6,
  // Connection already in progress.
  already: 7,
  // Bad file descriptor.
  badf: 8,
  // Bad message.
  badmsg: 9,
  // Device or resource busy.
  busy: 10,
  // Operation canceled.
  canceled: 11,
  // No child processes.
  child: 12,
  // Connection aborted.
  connaborted: 13,
  // Connection refused.
  connrefused: 14,
  // Connection reset.
  connreset: 15,
  // Resource deadlock would occur.
  deadlk: 16,
  // Destination address required.
  destaddrreq: 17,
  // Mathematics argument out of domain of function.
  dom: 18,
  // Reserved.
  dquot: 19,
  // File exists.
  exist: 20,
  // Bad address.
  fault: 21,
  // File too large.
  fbig: 22,
  // Host is unreachable.
  hostunreach: 23,
  // Identifier removed.
  idrm: 24,
  // Illegal byte sequence.
  ilseq: 25,
  // Operation in progress.
  inprogress: 26,
  // Interrupted function.
  intr: 27,
  // Invalid argument.
  inval: 28,
  // I/O error.
  io: 29,
  // Socket is connected.
  isconn: 30,
  // Is a directory.
  isdir: 31,
  // Too many levels of symbolic links.
  loop: 32,
  // File descriptor value too large.
  mfile: 33,
  // Too many links.
  mlink: 34,
  // Message too large.
  msgsize: 35,
  // Reserved.
  multihop: 36,
  // Filename too long.
  nametoolong: 37,
  // Network is down.
  netdown: 38,
  // Connection aborted by network.
  netreset: 39,
  // Network unreachable.
  netunreach: 40,
  // Too many files open in system.
  nfile: 41,
  // No buffer space available.
  nobufs: 42,
  // No such device.
  nodev: 43,
  // No such file or directory.
  noent: 44,
  // Executable file format error.
  noexec: 45,
  // No locks available.
  nolck: 46,
  // Reserved.
  nolink: 47,
  // Not enough space.
  nomem: 48,
  // No message of the desired type.
  nomsg: 49,
  // Protocol not available.
  noprotoopt: 50,
  // No space left on device.
  nospc: 51,
  // Function not supported.
  nosys: 52,
  // The socket is not connected.
  notconn: 53,
  // Not a directory or a symbolic link to a directory.
  notdir: 54,
  // Directory not empty.
  notempty: 55,
  // State not recoverable.
  notrecoverable: 56,
  // Not a socket.
  notsock: 57,
  // Not supported, or operation not supported on socket.
  notsup: 58,
  // Inappropriate I/O control operation.
  notty: 59,
  // No such device or address.
  nxio: 60,
  // Value too large to be stored in data type.
  overflow: 61,
  // Previous owner died.
  ownerdead: 62,
  // Operation not permitted.
  perm: 63,
  // Broken pipe.
  pipe: 64,
  // Protocol error.
  proto: 65,
  // Protocol not supported.
  protonosupport: 66,
  // Protocol wrong type for socket.
  prototype: 67,
  // Result too large.
  range: 68,
  // Read-only file system.
  rofs: 69,
  // Invalid seek.
  spipe: 70,
  // No such process.
  srch: 71,
  // Reserved.
  stale: 72,
  // Connection timed out.
  timedout: 73,
  // Text file busy.
  txtbsy: 74,
  // Cross-device link.
  xdev: 75,
  // Extension: Capabilities insufficient.
  notcapable: 76,
} as const satisfies Record<string, errno>;
export type rights = Flags<u64>;
export const rights = {
  none: 0x0000000000000000n,
  fd_datasync: 0x0000000000000001n,
  fd_read: 0x0000000000000002n,
  fd_seek: 0x0000000000000004n,
  fd_fdstat_set_flags: 0x0000000000000008n,
  fd_sync: 0x0000000000000010n,
  fd_tell: 0x0000000000000020n,
  fd_write: 0x0000000000000040n,
  fd_advise: 0x0000000000000080n,
  fd_allocate: 0x0000000000000100n,
  path_create_directory: 0x0000000000000200n,
  path_create_file: 0x0000000000000400n,
  path_link_source: 0x0000000000000800n,
  path_link_target: 0x0000000000001000n,
  path_open: 0x0000000000002000n,
  fd_readdir: 0x0000000000004000n,
  path_readlink: 0x0000000000008000n,
  path_rename_source: 0x0000000000010000n,
  path_rename_target: 0x0000000000020000n,
  path_filestat_get: 0x0000000000040000n,
  path_filestat_set_size: 0x0000000000080000n,
  path_filestat_set_times: 0x0000000000100000n,
  fd_filestat_get: 0x0000000000200000n,
  fd_filestat_set_size: 0x0000000000400000n,
  fd_filestat_set_times: 0x0000000000800000n,
  path_symlink: 0x0000000001000000n,
  path_remove_directory: 0x0000000002000000n,
  path_unlink_file: 0x0000000004000000n,
  poll_fd_readwrite: 0x0000000008000000n,
  sock_shutdown: 0x0000000010000000n,
  sock_accept: 0x0000000020000000n,
} as const satisfies Record<string, rights>;
export type fd = u32;
export type iovec = Alignment4<[buf: Pointer<u8>, buf_len: size]>;
export type ciovec = Alignment4<[buf: ConstPointer<u8>, buf_len: size]>;
export type filedelta = s64;
export type whence = u8;
export const whence = {
  set: 0,
  cur: 1,
  end: 2,
} as const satisfies Record<string, whence>;
export type dircookie = u64;
export type dirnamlen = u32;
export type inode = u64;
export type filetype = u8;
export const filetype = {
  // The type of the file descriptor or file is unknown or is different from any of the other types specified.
  unknown: 0,
  // The file descriptor or file refers to a block device inode.
  block_device: 1,
  // The file descriptor or file refers to a character device inode.
  character_device: 2,
  // The file descriptor or file refers to a directory inode.
  directory: 3,
  // The file descriptor or file refers to a regular file inode.
  regular_file: 4,
  // The file descriptor or file refers to a datagram socket.
  socket_dgram: 5,
  // The file descriptor or file refers to a byte-stream socket.
  socket_stream: 6,
  // The file refers to a symbolic link inode.
  symbolic_link: 7,
} as const satisfies Record<string, filetype>;
export type dirent = Alignment8<
  [d_next: dircookie, d_ino: inode, d_namlen: dirnamlen, d_type: filetype]
>;
export type advice = u8;
export const advice = {
  // The application has no advice to give on its behavior with respect to the specified data.
  normal: 0,
  // The application expects to access the specified data sequentially from lower offsets to higher offsets.
  sequential: 1,
  // The application expects to access the specified data in a random order.
  random: 2,
  // The application expects to access the specified data in the near future.
  willneed: 3,
  // The application expects that it will not access the specified data in the near future.
  dontneed: 4,
  // The application expects to access the specified data once and then not reuse it thereafter.
  noreuse: 5,
} as const satisfies Record<string, advice>;
export type fdflags = Flags<u16>;
export const fdflags = {
  none: 0x0000,
  append: 0x0001,
  dsync: 0x0002,
  nonblock: 0x0004,
  rsync: 0x0008,
  sync: 0x0010,
} as const;
export type fdstat = Alignment8<
  [
    fs_filetype: filetype,
    fs_flags: fdflags,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
  ]
>;
export type device = u64;
export type fstflags = Flags<u16>;
export const fstflags = {
  none: 0x0000,
  atim: 0x0001,
  atim_now: 0x0002,
  mtim: 0x0004,
  mtim_now: 0x0008,
} as const satisfies Record<string, fstflags>;
export type lookupflags = Flags<u32>;
export const lookupflags = {
  none: 0x00000000,
  symlink_follow: 0x00000001,
} as const satisfies Record<string, lookupflags>;
export type oflags = Flags<u16>;
export const oflags = {
  none: 0x0000,
  creat: 0x0001,
  directory: 0x0002,
  excl: 0x0004,
  trunc: 0x0008,
} as const satisfies Record<string, oflags>;
export type linkcount = u64;
export type filestat = Alignment8<
  [
    dev: device,
    ino: inode,
    filetype: filetype,
    nlink: linkcount,
    size: filesize,
    atim: timestamp,
    mtim: timestamp,
    ctim: timestamp,
  ]
>;
export type userdata = u64;
export type eventtype = u8;
export const eventtype = {
  clock: 0,
  fd_read: 1,
  fd_write: 2,
} as const satisfies Record<string, eventtype>;
export type eventrwflags = Flags<u16>;
export const eventrwflags = {
  none: 0x0000,
  fd_readwrite_hangup: 0x0001,
} as const satisfies Record<string, eventrwflags>;
export type event_fd_readwrite = Alignment8<
  [nbytes: filesize, flags: eventrwflags]
>;
export type event = Alignment8<
  [
    userdata: userdata,
    error: errno,
    type: eventtype,
    fd_readwrite: event_fd_readwrite,
  ]
>;
export type subclockflags = Flags<u16>;
export const subclockflags = {
  none: 0x0000,
  subscription_clock_abstime: 0x0001,
} as const satisfies Record<string, subclockflags>;
export type subscription_clock = Alignment8<
  [id: clockid, timeout: timestamp, precision: timestamp, flags: subclockflags]
>;
export type subscription_fd_readwrite = Alignment4<[file_descriptor: fd]>;
export type subscription_u_discriminator = u8;
export const subscription_u_discriminator = {
  clock: 0,
  fd_read: 1,
  fd_write: 2,
} as const satisfies Record<string, subscription_u_discriminator>;
export type subscription_u = Alignment8<
  | [typeof subscription_u_discriminator.clock, subscription_clock]
  | [typeof subscription_u_discriminator.fd_read, subscription_fd_readwrite]
  | [typeof subscription_u_discriminator.fd_write, subscription_fd_readwrite]
>;
export type subscription = Alignment8<[userdata: userdata, u: subscription_u]>;
export type exitcode = u32;
export type signal = u8;
export const signal = {
  // No signal. Note that POSIX has special semantics for kill(pid, 0), so this value is reserved.
  none: 0,
  // Hangup. Action: Terminates the process.
  hup: 1,
  // Terminate interrupt signal. Action: Terminates the process.
  int: 2,
  // Terminal quit signal. Action: Terminates the process.
  quit: 3,
  // Illegal instruction. Action: Terminates the process.
  ill: 4,
  // Trace/breakpoint trap. Action: Terminates the process.
  trap: 5,
  // Process abort signal. Action: Terminates the process.
  abrt: 6,
  // Access to an undefined portion of a memory object. Action: Terminates the process.
  bus: 7,
  // Erroneous arithmetic operation. Action: Terminates the process.
  fpe: 8,
  // Kill. Action: Terminates the process.
  kill: 9,
  // User-defined signal 1. Action: Terminates the process.
  usr1: 10,
  // Invalid memory reference. Action: Terminates the process.
  segv: 11,
  // User-defined signal 2. Action: Terminates the process.
  usr2: 12,
  // Write on a pipe with no one to read it. Action: Ignored.
  pipe: 13,
  // Alarm clock. Action: Terminates the process.
  alrm: 14,
  // Termination signal. Action: Terminates the process.
  term: 15,
  // Child process terminated, stopped, or continued. Action: Ignored.
  chld: 16,
  // Continue executing, if stopped. Action: Continues executing, if stopped.
  cont: 17,
  // Stop executing. Action: Stops executing.
  stop: 18,
  // Terminal stop signal. Action: Stops executing.
  tstp: 19,
  // Background process attempting read. Action: Stops executing.
  ttin: 20,
  // Background process attempting write. Action: Stops executing.
  ttou: 21,
  // High bandwidth data is available at a socket. Action: Ignored.
  urg: 22,
  // CPU time limit exceeded. Action: Terminates the process.
  xcpu: 23,
  // File size limit exceeded. Action: Terminates the process.
  xfsz: 24,
  // Virtual timer expired. Action: Terminates the process.
  vtalrm: 25,
  // Profiling timer expired. Action: Terminates the process.
  prof: 26,
  // Window changed. Action: Ignored.
  winch: 27,
  // I/O possible. Action: Terminates the process.
  poll: 28,
  // Power failure. Action: Terminates the process.
  pwr: 29,
  // Bad system call. Action: Terminates the process.
  sys: 30,
} as const satisfies Record<string, signal>;
export type riflags = Flags<u16>;
export const riflags = {
  none: 0x0000,
  recv_peek: 0x0001,
  recv_waitall: 0x0002,
} as const satisfies Record<string, riflags>;
export type roflags = Flags<u16>;
export const roflags = {
  none: 0x0000,
  recv_data_truncated: 0x0001,
} as const satisfies Record<string, roflags>;
export type siflags = Flags<u16>;
export const siflags = {
  none: 0x0000,
} as const satisfies Record<string, siflags>;
export type sdflags = Flags<u8>;
export const sdflags = {
  none: 0x00,
  rd: 0x01,
  wr: 0x02,
} as const satisfies Record<string, sdflags>;
export type preopentype = u8;
export const preopentype = {
  dir: 0,
} as const satisfies Record<string, preopentype>;
export type prestat_dir = Alignment4<[pr_name_len: size]>;
export type prestat_discriminator = u8;
export const prestat_discriminator = {
  dir: 0,
} as const satisfies Record<string, prestat_discriminator>;
export type prestat = Alignment4<
  [typeof prestat_discriminator.dir, prestat_dir]
>;

export interface WasiP1Imports {
  args_get(argv: Pointer<Pointer<u8>>, argv_buf: Pointer<u8>): errno;
  args_sizes_get(
    out_ptr_arg_count: Pointer<size>,
    out_ptr_argv_buf_size: Pointer<size>,
  ): errno;
  environ_get(environ: Pointer<Pointer<u8>>, environ_buf: Pointer<u8>): errno;
  environ_sizes_get(
    out_ptr_environ_count: Pointer<size>,
    out_ptr_environ_buf_size: Pointer<size>,
  ): errno;
  clock_res_get(id: clockid, out_ptr: Pointer<timestamp>): errno;
  clock_time_get(
    id: clockid,
    precision: timestamp,
    out_ptr: Pointer<timestamp>,
  ): errno;
  fd_advise(fd: fd, offset: filesize, len: filesize, advice: advice): errno;
  fd_allocate(fd: fd, offset: filesize, len: filesize): errno;
  fd_close(fd: fd): errno;
  fd_datasync(fd: fd): errno;
  fd_fdstat_get(fd: fd, out_ptr: Pointer<fdstat>): errno;
  fd_fdstat_set_flags(fd: fd, flags: fdflags): errno;
  fd_fdstat_set_rights(
    fd: fd,
    fs_rights_base: rights,
    fs_rights_inheriting: rights,
  ): errno;
  fd_filestat_get(fd: fd, out_ptr: Pointer<filestat>): errno;
  fd_filestat_set_size(fd: fd, size: filesize): errno;
  fd_filestat_set_times(
    fd: fd,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): errno;
  fd_pread(
    fd: fd,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): errno;
  fd_prestat_get(fd: fd, out_ptr: Pointer<prestat>): errno;
  fd_prestat_dir_name(fd: fd, path: Pointer<u8>, path_len: size): errno;
  fd_pwrite(
    fd: fd,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    offset: filesize,
    out_ptr: Pointer<size>,
  ): errno;
  fd_read(
    fd: fd,
    iovs_ptr: Pointer<iovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): errno;
  fd_readdir(
    fd: fd,
    buf: Pointer<u8>,
    buf_len: size,
    cookie: dircookie,
    out_ptr: Pointer<size>,
  ): errno;
  fd_renumber(fd: fd, to: fd): errno;
  fd_seek(
    fd: fd,
    offset: filedelta,
    whence: whence,
    out_ptr: Pointer<filesize>,
  ): errno;
  fd_sync(fd: fd): errno;
  fd_tell(fd: fd, out_ptr: Pointer<filesize>): errno;
  fd_write(
    fd: fd,
    iovs_ptr: Pointer<ciovec>,
    iovs_len: size,
    out_ptr: Pointer<size>,
  ): errno;
  path_create_directory(fd: fd, path_ptr: Pointer<u8>, path_len: size): errno;
  path_filestat_get(
    fd: fd,
    flags: lookupflags,
    path_ptr: Pointer<u8>,
    path_len: size,
    out_ptr: Pointer<filestat>,
  ): errno;
  path_filestat_set_times(
    fd: fd,
    flags: number,
    path_ptr: Pointer<u8>,
    path_len: size,
    atim: timestamp,
    mtim: timestamp,
    fst_flags: fstflags,
  ): errno;
  path_link(
    old_fd: fd,
    old_flags: lookupflags,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno;
  path_open(
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
    fd: fd,
    path_ptr: Pointer<u8>,
    path_len: size,
    buf: Pointer<u8>,
    buf_len: size,
    out_ptr: Pointer<size>,
  ): errno;
  path_remove_directory(fd: fd, path_ptr: Pointer<u8>, path_len: size): errno;
  path_rename(
    fd: fd,
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    new_fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno;
  path_symlink(
    old_path_ptr: Pointer<u8>,
    old_path_len: size,
    fd: fd,
    new_path_ptr: Pointer<u8>,
    new_path_len: size,
  ): errno;
  path_unlink_file(fd: fd, path_ptr: Pointer<u8>, path_len: size): errno;
  poll_oneoff(
    in_: ConstPointer<subscription>,
    out: Pointer<event>,
    nsubscriptions: size,
    out_ptr: Pointer<size>,
  ): errno;
  proc_exit(rval: exitcode): never;
  proc_raise(sig: signal): errno;
  sched_yield(): errno;
  random_get(buf: Pointer<u8>, buf_len: size): errno;
  sock_accept(fd: fd, flags: fdflags, out_ptr: Pointer<fd>): errno;
  sock_recv(
    fd: fd,
    ri_data_ptr: Pointer<iovec>,
    ri_data_len: size,
    ri_flags: riflags,
    out_ptr_size: Pointer<size>,
    out_ptr_roflags: Pointer<roflags>,
  ): errno;
  sock_send(
    fd: fd,
    si_data_ptr: Pointer<ciovec>,
    si_data_len: size,
    si_flags: siflags,
    out_ptr: Pointer<size>,
  ): errno;
  sock_shutdown(fd: fd, how: sdflags): errno;
}
