// See: https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/witx/wasi_snapshot_preview1.witx
export interface SnapshotPreview1 {
  args_get(argv_ptr: number, argv_buf_ptr: number): number

  args_sizes_get(argc_ptr: number, argv_buf_size_ptr: number): number

  clock_res_get(id: number, retptr0: number): number

  clock_time_get(id: number, precision: bigint, retptr0: number): number

  environ_get(env_ptr_ptr: number, env_buf_ptr: number): number

  environ_sizes_get(env_ptr: number, env_buf_size_ptr: number): number

  fd_advise(fd: number, offset: bigint, length: bigint, advice: number): number

  fd_allocate(fd: number, offset: bigint, length: bigint): number

  fd_close(fd: number): number

  fd_datasync(fd: number): number

  fd_fdstat_get(fd: number, retptr0: number): number

  fd_fdstat_set_flags(fd: number, flags: number): number

  fd_fdstat_set_rights(
    fd: number,
    fs_rights_base: bigint,
    fs_rights_inheriting: bigint
  ): number

  fd_filestat_get(fd: number, retptr0: number): number

  fd_filestat_set_size(fd: number, size: bigint): number

  fd_filestat_set_times(
    fd: number,
    atim: bigint,
    mtim: bigint,
    fst_flags: number
  ): number

  fd_pread(
    fd: number,
    iovs_ptr: number,
    iovs_len: number,
    offset: bigint,
    retptr0: number
  ): number

  fd_prestat_dir_name(fd: number, path_ptr: number, path_len: number): number

  fd_prestat_get(fd: number, retptr0: number): number

  fd_pwrite(
    fd: number,
    ciovs_ptr: number,
    ciovs_len: number,
    offset: bigint,
    retptr0: number
  ): number

  fd_read(
    fd: number,
    iovs_ptr: number,
    iovs_len: number,
    retptr0: number
  ): number

  fd_readdir(
    fd: number,
    buf: number,
    buf_len: number,
    cookie: bigint,
    retptr0: number
  ): number

  fd_renumber(old_fd: number, new_fd: number): number

  fd_seek(fd: number, offset: bigint, whence: number, retptr0: number): number

  fd_sync(fd: number): number

  fd_tell(fd: number, retptr0: number): number

  fd_write(
    fd: number,
    ciovs_ptr: number,
    ciovs_len: number,
    retptr0: number
  ): number

  path_create_directory(fd: number, path_ptr: number, path_len: number): number

  path_filestat_get(
    fd: number,
    flags: number,
    path_ptr: number,
    path_len: number,
    retptr0: number
  ): number

  path_filestat_set_times(
    fd: number,
    flags: number,
    path_ptr: number,
    path_len: number,
    atim: bigint,
    mtime: bigint,
    fstFlags: number
  ): number

  path_link(
    old_fd: number,
    old_flags: number,
    old_path_ptr: number,
    old_path_len: number,
    new_fd: number,
    new_path_ptr: number,
    new_path_len: number
  ): number

  path_open(
    fd: number,
    dirFlags: number,
    pathOffset: number,
    pathLen: number,
    oflags: number,
    rightsBase: bigint,
    rightsInheriting: bigint,
    fdflags: number,
    retptr0: number
  ): number

  path_readlink(
    fd: number,
    path_ptr: number,
    path_len: number,
    buf_ptr: number,
    buf_len: number,
    retptr0: number
  ): number

  path_remove_directory(fd: number, path_ptr: number, path_len: number): number

  path_rename(
    old_fd: number,
    old_path_ptr: number,
    old_path_len: number,
    new_fd: number,
    new_path_ptr: number,
    new_path_len: number
  ): number

  path_symlink(
    old_path_ptr: number,
    old_path_len: number,
    fd: number,
    new_path_ptr: number,
    new_path_len: number
  ): number

  path_unlink_file(fd: number, path_ptr: number, path_len: number): number

  poll_oneoff(
    in_ptr: number,
    out_ptr: number,
    nsubscriptions: number,
    retptr0: number
  ): number

  proc_exit(code: number): void

  proc_raise(signal: number): number

  random_get(buffer_ptr: number, buffer_len: number): number

  sched_yield(): number

  sock_recv(
    fd: number,
    ri_data_ptr: number,
    ri_data_len: number,
    ri_flags: number,
    retptr0: number,
    retptr1: number
  ): number

  sock_send(
    fd: number,
    si_data_ptr: number,
    si_data_len: number,
    si_flags: number,
    retptr0: number
  ): number

  sock_shutdown(fd: number, how: number): number
}

export enum Result {
  SUCCESS = 0,
  EBADF = 8,
  EINVAL = 28,
  ENOENT = 44,
  ENOSYS = 52,
  ENOTSUP = 58,
}

export enum Clock {
  REALTIME = 0,
  MONOTONIC = 1,
  PROCESS_CPUTIME_ID = 2,
  THREAD_CPUTIME_ID = 3,
}

export const iovViews = (
  view: DataView,
  iovs_ptr: number,
  iovs_len: number
): Array<Uint8Array> => {
  let result = Array<Uint8Array>(iovs_len)

  for (let i = 0; i < iovs_len; i++) {
    const bufferPtr = view.getUint32(iovs_ptr, true)
    iovs_ptr += 4

    const bufferLen = view.getUint32(iovs_ptr, true)
    iovs_ptr += 4

    result[i] = new Uint8Array(view.buffer, bufferPtr, bufferLen)
  }
  return result
}
