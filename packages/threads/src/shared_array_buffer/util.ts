export enum FuncNames {
  fd_advise = 7,
  fd_allocate = 8,
  fd_close = 9,
  fd_datasync = 10,
  fd_fdstat_get = 11,
  fd_fdstat_set_flags = 12,
  fd_fdstat_set_rights = 13,
  fd_filestat_get = 14,
  fd_filestat_set_size = 15,
  fd_filestat_set_times = 16,
  fd_pread = 17,
  fd_prestat_get = 18,
  fd_prestat_dir_name = 19,
  fd_pwrite = 20,
  fd_read = 21,
  fd_readdir = 22,
  fd_renumber = 23,
  fd_seek = 24,
  fd_sync = 25,
  fd_tell = 26,
  fd_write = 27,
  path_create_directory = 28,
  path_filestat_get = 29,
  path_filestat_set_times = 30,
  path_link = 31,
  path_open = 32,
  path_readlink = 33,
  path_remove_directory = 34,
  path_rename = 35,
  path_symlink = 36,
  path_unlink_file = 37,
}

export enum WASIFarmParkFuncNames {
  set_fds_map = 0,
}

export enum WorkerBackgroundFuncNames {
  create_new_worker = 1,
  create_start = 2,
}

export enum WorkerBackgroundReturnCodes {
  threw = 1,
  completed = 2,
}
