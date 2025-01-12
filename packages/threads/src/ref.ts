import type { wasi } from "@bjorn3/browser_wasi_shim";
import type { FdCloseSender } from "./sender";
import type { FdCloseSenderUseArrayBufferObject } from "./shared_array_buffer/fd_close_sender";

export type WASIFarmRefObject = {
  stdin: number | undefined;
  stdout: number | undefined;
  stderr: number | undefined;
  fd_close_receiver: FdCloseSenderUseArrayBufferObject;
  default_fds: Array<number>;
};

export abstract class WASIFarmRef {
  // please implement this method
  // static async init(sl: WASIFarmRef): Promise<WASIFarmRef>;

  abstract readonly stdin?: number;
  abstract readonly stdout?: number;
  abstract readonly stderr?: number;

  abstract readonly id: number;

  abstract readonly fd_close_receiver: FdCloseSender;

  abstract readonly default_fds: Array<number>;

  abstract set_park_fds_map(fds: Array<number>): void;
  abstract set_park_fds_map_async(fds: Array<number>): Promise<void>;

  abstract fd_advise(fd: number | undefined): number;
  abstract fd_allocate(
    fd: number | undefined,
    offset: bigint,
    len: bigint,
  ): number;
  abstract fd_close(fd: number | undefined): number;
  abstract fd_datasync(fd: number | undefined): number;
  abstract fd_fdstat_get(
    fd: number | undefined,
  ): [wasi.Fdstat, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_fdstat_set_flags(fd: number | undefined, flags: number): number;
  abstract fd_fdstat_set_rights(
    fd: number | undefined,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
  ): number;
  abstract fd_filestat_get(
    fd: number | undefined,
  ): [wasi.Filestat, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_filestat_set_size(fd: number | undefined, size: bigint): number;
  abstract fd_filestat_set_times(
    fd: number | undefined,
    atim: bigint,
    mtim: bigint,
    fst_flags: number,
  ): number;
  abstract fd_pread(
    fd: number | undefined,
    iovs: Uint32Array,
    offset: bigint,
  ): [[number, Uint8Array], typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_prestat_get(
    fd: number | undefined,
  ): [[number, number], typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_prestat_dir_name(
    fd: number | undefined,
    path_len: number,
  ):
    | [Uint8Array, typeof wasi.ERRNO_SUCCESS | typeof wasi.ERRNO_NAMETOOLONG]
    | [undefined, number];
  abstract fd_pwrite(
    fd: number | undefined,
    iovs: Uint8Array,
    offset: bigint,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_read(
    fd: number | undefined,
    iovs: Uint32Array,
  ): [[number, Uint8Array], typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_readdir(
    fd: number | undefined,
    limit_buf_len: number,
    cookie: bigint,
  ): [[Uint8Array, number], typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  // abstract fd_renumber(fd: number | undefined, to: number): number;
  abstract fd_seek(
    fd: number | undefined,
    offset: bigint,
    whence: number,
  ): [bigint, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_sync(fd: number | undefined): number;
  abstract fd_tell(
    fd: number | undefined,
  ): [bigint, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract fd_write(
    fd: number | undefined,
    iovs: Uint8Array,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract path_create_directory(
    fd: number | undefined,
    path: Uint8Array,
  ): number;
  abstract path_filestat_get(
    fd: number | undefined,
    flags: number,
    path: Uint8Array,
  ): [wasi.Filestat, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract path_filestat_set_times(
    fd: number | undefined,
    flags: number,
    path: Uint8Array,
    st_atim: bigint,
    st_mtim: bigint,
    fst_flags: number,
  ): number;
  abstract path_link(
    old_fd: number | undefined,
    old_flags: number,
    old_path: Uint8Array,
    new_fd: number | undefined,
    new_path: Uint8Array,
  ): number;
  abstract path_open(
    fd: number,
    dirflags: number,
    path: Uint8Array,
    oflags: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint,
    fs_flags: number,
  ): [number, typeof wasi.ERRNO_SUCCESS] | [undefined, number];
  abstract path_readlink(
    fd: number | undefined,
    path: Uint8Array,
    buf_len: number,
  ):
    | [Uint8Array, typeof wasi.ERRNO_SUCCESS | typeof wasi.ERRNO_NAMETOOLONG]
    | [undefined, number];
  abstract path_remove_directory(
    fd: number | undefined,
    path: Uint8Array,
  ): number;
  abstract path_rename(
    old_fd: number | undefined,
    old_path: Uint8Array,
    new_fd: number | undefined,
    new_path: Uint8Array,
  ): number;
  abstract path_symlink(
    old_path: Uint8Array,
    fd: number | undefined,
    new_path: Uint8Array,
  ): number;
  abstract path_unlink_file(fd: number | undefined, path: Uint8Array): number;
}
