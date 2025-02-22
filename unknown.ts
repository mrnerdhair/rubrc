fd_allocate(fd: fd, offset: filesize, len: filesize): errno {
fd_close(fd: fd): errno {
fd_datasync(fd: fd): errno {
fd_fdstat_get(fd: fd, out_ptr: Pointer<fdstat>): errno {
fd_fdstat_set_flags(fd: fd, flags: fdflags): errno {
fd_fdstat_set_rights {
  fd: fd,
  fs_rights_base: rights,
  fs_rights_inheriting: rights,
): errno {
fd_filestat_get(fd: fd, out_ptr: Pointer<filestat>): errno {
fd_filestat_set_size(fd: fd, size: filesize): errno {
fd_filestat_set_times(
  fd: fd,
  atim: timestamp,
  mtim: timestamp,
  fst_flags: fstflags,
): errno {
fd_pread(
  fd: fd,
  iovs_ptr: Pointer<iovec>,
  iovs_len: size,
  offset: filesize,
  out_ptr: Pointer<size>,
): errno {
fd_prestat_get(fd: fd, out_ptr: Pointer<prestat>): errno {
fd_prestat_dir_name(
  fd: fd,
  path: Pointer<u8>,
  path_len: size,
): errno {
fd_pwrite(
  fd: fd,
  iovs_ptr: Pointer<ciovec>,
  iovs_len: size,
  offset: filesize,
  out_ptr: Pointer<size>,
): errno {
fd_read(
  fd: fd,
  iovs_ptr: Pointer<iovec>,
  iovs_len: size,
  out_ptr: Pointer<size>,
): errno {
fd_readdir(
  fd: fd,
  buf: Pointer<u8>,
  buf_len: size,
  cookie: dircookie,
  out_ptr: Pointer<size>,
): errno {
// fd_renumber(fd: fd, to: fd): errno {
fd_seek(
  fd: fd,
  offset: filedelta,
  whence: whence,
  out_ptr: Pointer<filesize>,
): errno {
fd_sync(fd: fd): errno {
fd_tell(fd: fd, out_ptr: Pointer<filesize>): errno {
fd_write(
  fd: fd,
  iovs_ptr: Pointer<ciovec>,
  iovs_len: size,
  out_ptr: Pointer<size>,
): errno {
path_create_directory(
  fd: fd,
  path_ptr: Pointer<u8>,
  path_len: size,
): errno {
path_filestat_get(
  fd: fd,
  flags: lookupflags,
  path_ptr: Pointer<u8>,
  path_len: size,
  out_ptr: Pointer<filestat>,
): errno {
path_filestat_set_times(
  fd: fd,
  flags: number,
  path_ptr: Pointer<u8>,
  path_len: size,
  atim: timestamp,
  mtim: timestamp,
  fst_flags: fstflags,
): errno {
path_link(
  old_fd: fd,
  old_flags: lookupflags,
  old_path_ptr: Pointer<u8>,
  old_path_len: size,
  new_fd: fd,
  new_path_ptr: Pointer<u8>,
  new_path_len: size,
): errno {
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
): errno {
path_readlink(
  fd: fd,
  path_ptr: Pointer<u8>,
  path_len: size,
  buf: Pointer<u8>,
  buf_len: size,
  out_ptr: Pointer<size>,
): errno {
path_remove_directory(
  fd: fd,
  path_ptr: Pointer<u8>,
  
  path_len: size,
): errno {
path_rename(
  fd: fd,
  old_path_ptr: Pointer<u8>,
  old_path_len: size,
  new_fd: fd,
  new_path_ptr: Pointer<u8>,
  new_path_len: size,
): errno {
path_symlink(
  old_path_ptr: Pointer<u8>,
  old_path_len: size,
  fd: fd,
  new_path_ptr: Pointer<u8>,
  new_path_len: size,
): errno {
path_unlink_file(
  fd: fd,
  path_ptr: Pointer<u8>,
  path_len: size,
): errno {// biome-ignore lint/suspicious/noExplicitAny: any is correct in generic type constraints
  export function wait_on_gen<T extends WaitOnGenBase<any>>(
    x: T,
  ): AsWaitOnGen<T> {
    return new WaitOnGen<WaitOnGenBaseType<T>>(x);
  }
  
  const wait: unique symbol = Symbol.for("WaitTarget.wait()");
  const waitAsync: unique symbol = Symbol.for("WaitTarget.waitAsync()");
  const waitCtor: unique symbol = Symbol.for("new Wait()");
  
  export class WaitTarget {
    static readonly BYTE_LENGTH = 1 * Int32Array.BYTES_PER_ELEMENT;
  
    private readonly view: Int32Array<SharedArrayBuffer>;
    private readonly index: number;
    // private 