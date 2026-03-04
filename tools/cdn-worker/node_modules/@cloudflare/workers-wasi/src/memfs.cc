#include <libgen.h>
#include <rapidjson/document.h>
#include <stdarg.h>
#include <wasi/api.h>

#include <string>
#include <unordered_map>
#include <vector>

#include "bd/lfs_rambd.h"
#include "config.h"
#include "lfs.h"
#include "util.h"

void wasi_trace(int error, const char* fmt, ...) {
  char* line;
  va_list ap;
  va_start(ap, fmt);
  vasprintf(&line, fmt, ap);
  va_end(ap);
  trace(error, reinterpret_cast<int32_t>(line), strlen(line));
  free(line);
}

__wasi_filetype_t from_lfs_type(int type) {
  switch (type) {
    case LFS_TYPE_DIR:
      return __WASI_FILETYPE_DIRECTORY;
    case LFS_TYPE_REG:
      break;
  }
  return __WASI_FILETYPE_REGULAR_FILE;
}

int to_lfs_open_flags(const __wasi_oflags_t flags,
                      const __wasi_rights_t rights) {
  int result = 0;

  if (rights & __WASI_RIGHTS_FD_READ) {
    result |= LFS_O_RDONLY;
  }

  if (rights & __WASI_RIGHTS_FD_WRITE) {
    result |= LFS_O_WRONLY;
  }

  if (flags & __WASI_OFLAGS_CREAT) {
    result |= LFS_O_CREAT;
  }

  if (flags & __WASI_OFLAGS_EXCL) {
    result |= LFS_O_EXCL;
  }

  if (flags & __WASI_OFLAGS_TRUNC) {
    result |= LFS_O_TRUNC;
  }
  return result;
}

__wasi_errno_t from_lfs_error(int error) {
  switch (error) {
    case LFS_ERR_NOENT:
      return __WASI_ERRNO_NOENT;
    case LFS_ERR_EXIST:
      return __WASI_ERRNO_EXIST;
    case LFS_ERR_ISDIR:
      return __WASI_ERRNO_ISDIR;
    case LFS_ERR_NOTEMPTY:
      return __WASI_ERRNO_NOTEMPTY;
    case LFS_ERR_NOTDIR:
      return __WASI_ERRNO_NOTDIR;
    case LFS_ERR_INVAL:
      return __WASI_ERRNO_INVAL;
  }
  REQUIRE(false);
  return __WASI_ERRNO_SUCCESS;
}

struct FileMetadata {
  // 100 required for wastime tests
  __wasi_timestamp_t mtim = 100;
  __wasi_timestamp_t atim = 100;
};

#define RETURN_IF_LFS_ERR(x)       \
  ({                               \
    const auto __rc = (x);         \
    if (__rc < 0) {                \
      return from_lfs_error(__rc); \
    }                              \
    __rc;                          \
  })

#define RETURN_IF_WASI_ERR(x)           \
  ({                                    \
    const auto __rc = (x);              \
    if (__rc != __WASI_ERRNO_SUCCESS) { \
      return __rc;                      \
    }                                   \
    __rc;                               \
  })

#define REQUIRE_TYPED_FD(__fd, __type, __rights, __allow_stream)     \
  (*({                                                               \
    FileDescriptor* __desc;                                          \
    RETURN_IF_WASI_ERR(                                              \
        lookup_fd(__fd, __type, __rights, __allow_stream, &__desc)); \
    __desc;                                                          \
  }))

#define REQUIRE_FD(fd, rights) REQUIRE_TYPED_FD(fd, 0, rights, false)
#define REQUIRE_FD_OR_STREAM(fd, rights) REQUIRE_TYPED_FD(fd, 0, rights, true)

struct FileDescriptor {
  std::string path;
  __wasi_rights_t rights_base = 0;
  __wasi_rights_t rights_inheriting = 0;
  __wasi_fdflags_t fd_flags = 0;
  lfs_type type{};
  bool stream = false;

  union State {
    lfs_file_t file;
    lfs_dir_t dir;
  } state;

  lfs_file_t& file() {
    REQUIRE(type == LFS_TYPE_REG);
    REQUIRE(!stream);
    return state.file;
  }
  lfs_dir_t& dir() {
    REQUIRE(type == LFS_TYPE_DIR);
    REQUIRE(!stream);
    return state.dir;
  }
};

// clang-format off
constexpr const __wasi_rights_t WASI_PATH_RIGHTS =
    __WASI_RIGHTS_PATH_CREATE_DIRECTORY |
    __WASI_RIGHTS_PATH_CREATE_FILE |
    __WASI_RIGHTS_PATH_LINK_SOURCE |
    __WASI_RIGHTS_PATH_LINK_TARGET |
    __WASI_RIGHTS_PATH_OPEN |
    __WASI_RIGHTS_PATH_RENAME_SOURCE |
    __WASI_RIGHTS_PATH_RENAME_TARGET |
    __WASI_RIGHTS_PATH_FILESTAT_GET |
    __WASI_RIGHTS_PATH_FILESTAT_SET_SIZE |
    __WASI_RIGHTS_PATH_FILESTAT_SET_TIMES |
    __WASI_RIGHTS_PATH_SYMLINK |
    __WASI_RIGHTS_PATH_REMOVE_DIRECTORY |
    __WASI_RIGHTS_PATH_UNLINK_FILE;
// clang-format on

// clang-format off
constexpr const __wasi_rights_t WASI_FD_RIGHTS =
    __WASI_RIGHTS_FD_DATASYNC |
    __WASI_RIGHTS_FD_READ |
    __WASI_RIGHTS_FD_SEEK |
    __WASI_RIGHTS_FD_FDSTAT_SET_FLAGS |
    __WASI_RIGHTS_FD_SYNC |
    __WASI_RIGHTS_FD_TELL |
    __WASI_RIGHTS_FD_WRITE |
    __WASI_RIGHTS_FD_ADVISE |
    __WASI_RIGHTS_FD_ALLOCATE |
    __WASI_RIGHTS_FD_READDIR |
    __WASI_RIGHTS_FD_FILESTAT_GET |
    __WASI_RIGHTS_FD_FILESTAT_SET_SIZE |
    __WASI_RIGHTS_FD_FILESTAT_SET_TIMES;
// clang-format on

struct Context {
  lfs_t lfs;
  int next_fd = 2147483647;
  std::vector<std::string> preopens;
  std::unordered_map<__wasi_fd_t, std::unique_ptr<FileDescriptor>> fds;

  struct lfs_rambd rambd {};

  const struct lfs_config cfg = {
      .context = &rambd,
      .read = lfs_rambd_read,
      .prog = lfs_rambd_prog,
      .erase = lfs_rambd_erase,
      .sync = lfs_rambd_sync,
      .read_size = 16,
      .prog_size = 16,
      .block_size = 4096,
      .block_count = 128,
      .block_cycles = 500,
      .cache_size = 16,
      .lookahead_size = 16,
  };

  __wasi_fd_t allocate_fd() {
    for (;;) {
      const auto fd = next_fd--;
      if (next_fd < preopens.size()) {
        next_fd = std::numeric_limits<int32_t>::max();
      }

      if (fds.find(fd) != fds.end()) {
        continue;
      }

      return fd;
    }
  }

  __wasi_errno_t filestat_get(const char* path, __wasi_filestat_t* result) {
    lfs_info info{};
    RETURN_IF_LFS_ERR(lfs_stat(&lfs, path, &info));

    const auto m = get_metadata(path);
    *result = {.dev = 0,
               .ino = 0,
               .filetype = from_lfs_type(info.type),
               .nlink = 1,
               .size = info.size,
               .atim = m.atim,
               .mtim = m.mtim};
    return __WASI_ERRNO_SUCCESS;
  }

  FileMetadata get_metadata(const char* path) {
    FileMetadata m = {};
    if (lfs_getattr(&lfs, path, 1, (void*)&m, sizeof(m)) > 0) {
      return m;
    }
    return {};
  }

  void set_metadata(const char* path, const FileMetadata& m) {
    lfs_setattr(&lfs, path, 1, (const void*)&m, sizeof(m));
  }

  __wasi_errno_t lookup_fd(const __wasi_fd_t fd, const int type,
                           const __wasi_rights_t rights,
                           const bool allow_streams, FileDescriptor** result) {
    auto iter = fds.find(fd);
    if (iter == fds.end()) {
      return __WASI_ERRNO_BADF;
    }

    auto& desc = *iter->second;
    if (desc.stream && !allow_streams) {
      return __WASI_ERRNO_NOTSUP;
    }

    if (type == LFS_TYPE_REG && desc.type != type) {
      return __WASI_ERRNO_BADF;
    } else if (type == LFS_TYPE_DIR && desc.type != type) {
      return __WASI_ERRNO_NOTDIR;
    }

    if ((rights & desc.rights_base) != rights) {
      return __WASI_ERRNO_NOTCAPABLE;
    }

    *result = &desc;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t require_not_preopen(__wasi_fd_t fd) {
    if (fd < 3) {
      return __WASI_ERRNO_SUCCESS;
    }
    const auto index = fd - 3;
    if (index < preopens.size()) {
      return __WASI_ERRNO_NOTSUP;
    }
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_advise(__wasi_fd_t fd, __wasi_filesize_t, __wasi_filesize_t,
                           __wasi_advice_t) {
    REQUIRE_FD(fd, __WASI_RIGHTS_FD_ADVISE);
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_allocate(__wasi_fd_t fd, __wasi_filesize_t offset,
                             __wasi_filesize_t len) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_ALLOCATE);
    const auto required_size = offset + len;

    const auto current_size = lfs_file_size(&lfs, &desc.file());
    if (current_size < required_size) {
      RETURN_IF_LFS_ERR(lfs_file_truncate(&lfs, &desc.file(), required_size));
      RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &desc.file()));
    }

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_close(__wasi_fd_t fd) {
    RETURN_IF_WASI_ERR(require_not_preopen(fd));

    // TODO: We should flush here vs after execution ends and error on multiple close
    if (fd < 3) {
      return __WASI_ERRNO_SUCCESS;
    }

    auto& desc = REQUIRE_FD(fd, __wasi_rights_t{0});

    if (desc.type == LFS_TYPE_DIR) {
      RETURN_IF_LFS_ERR(lfs_dir_close(&lfs, &desc.dir()));
    } else {
      RETURN_IF_LFS_ERR(lfs_file_close(&lfs, &desc.file()));
    }
    fds.erase(fd);
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_datasync(__wasi_fd_t fd) {
    REQUIRE_FD(fd, __WASI_RIGHTS_FD_DATASYNC);
    // we currenty flush on all writes so this is a noop
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_fdstat_get(const __wasi_fd_t fd, __wasi_fdstat_t* retptr0) {
    auto& desc = REQUIRE_FD_OR_STREAM(fd, __wasi_rights_t{0});
    *retptr0 = {.fs_filetype = from_lfs_type(desc.type),
                .fs_flags = desc.fd_flags,
                .fs_rights_base = desc.rights_base,
                .fs_rights_inheriting = desc.rights_inheriting};
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_fdstat_set_flags(__wasi_fd_t fd, __wasi_fdflags_t flags) {
    auto& desc = REQUIRE_FD_OR_STREAM(fd, __WASI_RIGHTS_FD_FDSTAT_SET_FLAGS);
    desc.fd_flags = flags;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_fdstat_set_rights(__wasi_fd_t fd,
                                      __wasi_rights_t fs_rights_base,
                                      __wasi_rights_t fs_rights_inheriting) {
    auto& desc = REQUIRE_FD_OR_STREAM(fd, __wasi_rights_t{0});

    const auto new_rights_base = desc.rights_base & fs_rights_base;
    if (new_rights_base != fs_rights_base) {
      return __WASI_ERRNO_NOTCAPABLE;
    }
    const auto new_rights_inheriting =
        desc.rights_inheriting & fs_rights_inheriting;
    if (new_rights_inheriting != fs_rights_inheriting) {
      return __WASI_ERRNO_NOTCAPABLE;
    }

    desc.rights_base = new_rights_base;
    desc.rights_inheriting = new_rights_inheriting;

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_filestat_get(__wasi_fd_t fd, __wasi_filestat_t* retptr0) {
    auto& desc = REQUIRE_FD_OR_STREAM(fd, __WASI_RIGHTS_FD_FILESTAT_GET);
    if (desc.stream) {
      *retptr0 = {.dev = 0,
                  .ino = 0,
                  .filetype = __WASI_FILETYPE_SOCKET_STREAM,
                  .nlink = 1};
      return __WASI_ERRNO_SUCCESS;
    }
    RETURN_IF_WASI_ERR(filestat_get(desc.path.c_str(), retptr0));
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_filestat_set_size(__wasi_fd_t fd, __wasi_filesize_t size) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_FILESTAT_SET_SIZE);
    RETURN_IF_LFS_ERR(lfs_file_truncate(&lfs, &desc.file(), size));
    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &desc.file()));
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_filestat_set_times(__wasi_fd_t fd, __wasi_timestamp_t atim,
                                       __wasi_timestamp_t mtim,
                                       __wasi_fstflags_t fst_flags) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_FILESTAT_SET_TIMES);
    return set_file_times(desc.path.c_str(), atim, mtim, fst_flags);
  }

  __wasi_errno_t fd_pread(__wasi_fd_t fd, const __wasi_iovec_t* iovs,
                          size_t iovs_len, __wasi_filesize_t offset,
                          __wasi_size_t* retptr0) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_READ);

    const auto previous_offset = desc.file().pos;
    RETURN_IF_LFS_ERR(lfs_file_seek(&lfs, &desc.file(), offset, LFS_SEEK_SET));
    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &desc.file()));

    lfs_ssize_t read = 0;
    for (size_t i = 0; i < iovs_len; ++i) {
      read += RETURN_IF_LFS_ERR(
          lfs_file_read(&lfs, &desc.file(), iovs[i].buf, iovs[i].buf_len));
    }

    RETURN_IF_LFS_ERR(
        lfs_file_seek(&lfs, &desc.file(), previous_offset, LFS_SEEK_SET));
    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &desc.file()));

    *retptr0 = read;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_prestat_dir_name(__wasi_fd_t fd,
                                     const std::span<char>& result) {
    const auto table_offset = 3;
    if (fd < table_offset) {
      return __WASI_ERRNO_NOTSUP;
    }
    const auto index = fd - table_offset;
    if (index >= preopens.size()) {
      return __WASI_ERRNO_BADF;
    }

    auto& path = preopens[index];
    REQUIRE(path.size() == result.size());
    std::copy(path.begin(), path.end(), result.begin());

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_prestat_get(__wasi_fd_t fd, __wasi_prestat_t* retptr0) {
    const auto table_offset = 3;
    if (fd < table_offset) {
      return __WASI_ERRNO_NOTSUP;
    }
    const auto index = fd - table_offset;
    if (index >= preopens.size()) {
      return __WASI_ERRNO_BADF;
    }
    *retptr0 = __wasi_prestat_t{
        .tag = __WASI_PREOPENTYPE_DIR,
        .u = __wasi_prestat_dir_t{.pr_name_len = preopens[index].size()}};
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_pwrite(__wasi_fd_t fd, const __wasi_ciovec_t* iovs,
                           size_t iovs_len, __wasi_filesize_t offset,
                           __wasi_size_t* retptr0) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_WRITE);

    const auto previous_offset = desc.file().pos;
    RETURN_IF_LFS_ERR(lfs_file_seek(&lfs, &desc.file(), offset, LFS_SEEK_SET));

    lfs_ssize_t written = 0;
    for (size_t i = 0; i < iovs_len; ++i) {
      written += RETURN_IF_LFS_ERR(
          lfs_file_write(&lfs, &desc.file(), iovs[i].buf, iovs[i].buf_len));
    }

    RETURN_IF_LFS_ERR(
        lfs_file_seek(&lfs, &desc.file(), previous_offset, LFS_SEEK_SET));
    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &desc.file()));

    *retptr0 = written;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_read(__wasi_fd_t fd, const __wasi_iovec_t* iovs,
                         size_t iovs_len, __wasi_size_t* retptr0) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_READ);

    lfs_ssize_t read = 0;
    for (size_t i = 0; i < iovs_len; ++i) {
      read += RETURN_IF_LFS_ERR(
          lfs_file_read(&lfs, &desc.file(), iovs[i].buf, iovs[i].buf_len));
    }
    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &desc.file()));

    *retptr0 = read;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_readdir(__wasi_fd_t fd, MutableView<uint8_t>& buffer,
                            __wasi_dircookie_t cookie, __wasi_size_t* retptr0) {
    return __WASI_ERRNO_NOSYS;
  }

  __wasi_errno_t fd_renumber(__wasi_fd_t fd, __wasi_fd_t to) {
    RETURN_IF_WASI_ERR(require_not_preopen(fd));
    const auto iter = fds.find(fd);
    if (iter == fds.end()) {
      return __WASI_ERRNO_BADF;
    }
    if (fds.find(to) != fds.end()) {
      RETURN_IF_WASI_ERR(fd_close(to));
    }

    REQUIRE(fds.emplace(to, std::move(iter->second)).second);
    fds.erase(fd);
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_seek(__wasi_fd_t fd, __wasi_filedelta_t offset,
                         __wasi_whence_t whence, __wasi_filesize_t* retptr0) {
    const auto is_read_only = whence == __WASI_WHENCE_CUR && offset == 0;
    const auto required_rights =
        is_read_only ? (__WASI_RIGHTS_FD_SEEK | __WASI_RIGHTS_FD_TELL)
                     : __WASI_RIGHTS_FD_SEEK;
    auto& desc = REQUIRE_TYPED_FD(fd, LFS_TYPE_REG, required_rights, true);
    if (desc.stream) {
      return __WASI_ERRNO_SPIPE;
    }

    auto& file = desc.file();
    switch (whence) {
      case __WASI_WHENCE_SET:
        *retptr0 =
            RETURN_IF_LFS_ERR(lfs_file_seek(&lfs, &file, offset, LFS_SEEK_SET));
        break;
      case __WASI_WHENCE_CUR:
        *retptr0 =
            RETURN_IF_LFS_ERR(lfs_file_seek(&lfs, &file, offset, LFS_SEEK_CUR));
        break;
      case __WASI_WHENCE_END:
        *retptr0 =
            RETURN_IF_LFS_ERR(lfs_file_seek(&lfs, &file, offset, LFS_SEEK_END));
        break;
      default:
        return __WASI_ERRNO_INVAL;
    }

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_sync(__wasi_fd_t fd) {
    REQUIRE_FD(fd, __WASI_RIGHTS_FD_SYNC);
    // we currenty flush on all writes so this is a noop
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t fd_tell(__wasi_fd_t fd, __wasi_filesize_t* retptr0) {
    return fd_seek(fd, 0, __WASI_WHENCE_CUR, retptr0);
  }

  __wasi_errno_t fd_write(__wasi_fd_t fd, const __wasi_ciovec_t* iovs,
                          size_t iovs_len, __wasi_size_t* retptr0) {
    auto& desc = REQUIRE_FD(fd, __WASI_RIGHTS_FD_WRITE);

    lfs_ssize_t written = 0;

    auto& file = desc.file();
    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &file));

    const auto previous_offset = file.pos;
    const bool append = desc.fd_flags & __WASI_FDFLAGS_APPEND;
    if (append) {
      file.flags |= LFS_O_APPEND;
    }

    for (size_t i = 0; i < iovs_len; ++i) {
      written += RETURN_IF_LFS_ERR(
          lfs_file_write(&lfs, &file, iovs[i].buf, iovs[i].buf_len));
    }

    if (append) {
      // reset file position
      file.flags &= ~LFS_O_APPEND;
      RETURN_IF_LFS_ERR(
          lfs_file_seek(&lfs, &file, previous_offset, LFS_SEEK_SET));
    }

    RETURN_IF_LFS_ERR(lfs_file_sync(&lfs, &file));

    *retptr0 = written;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t path_create_directory(
      CallFrame& frame, __wasi_fd_t fd,
      const std::string_view& unresolved_path) {
    const char* path;
    RETURN_IF_WASI_ERR(resolve_path(frame, fd, unresolved_path,
                                    __WASI_RIGHTS_PATH_CREATE_DIRECTORY,
                                    &path));
    RETURN_IF_LFS_ERR(lfs_mkdir(&lfs, path));
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t path_filestat_get(CallFrame& frame, __wasi_fd_t fd,
                                   __wasi_lookupflags_t flags,
                                   const std::string_view& unresolved_path,
                                   __wasi_filestat_t* retptr0) {
    const char* path;
    RETURN_IF_WASI_ERR(resolve_path(frame, fd, unresolved_path,
                                    __WASI_RIGHTS_PATH_FILESTAT_GET, &path));

    RETURN_IF_WASI_ERR(filestat_get(path, retptr0));

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t path_filestat_set_times(
      CallFrame& frame, __wasi_fd_t fd, __wasi_lookupflags_t flags,
      const std::string_view& unresolved_path, __wasi_timestamp_t atim,
      __wasi_timestamp_t mtim, __wasi_fstflags_t fst_flags) {
    const char* path;
    RETURN_IF_WASI_ERR(resolve_path(frame, fd, unresolved_path,
                                    __WASI_RIGHTS_PATH_FILESTAT_SET_TIMES,
                                    &path));
    return set_file_times(path, atim, mtim, fst_flags);
  }

  __wasi_errno_t path_link(__wasi_fd_t old_fd, __wasi_lookupflags_t old_flags,
                           const std::string_view& old_path, __wasi_fd_t new_fd,
                           const std::string_view& new_path) {
    return __WASI_ERRNO_NOSYS;
  }

  __wasi_errno_t path_open(CallFrame& frame, const __wasi_fd_t fd,
                           const __wasi_lookupflags_t dirflags,
                           const std::string_view& unresolved_path,
                           const __wasi_oflags_t oflags,
                           const __wasi_rights_t fs_rights_base,
                           const __wasi_rights_t fs_rights_inheriting,
                           const __wasi_fdflags_t fd_flags,
                           __wasi_fd_t* retptr0) {
    __wasi_rights_t required_rights = __WASI_RIGHTS_PATH_OPEN;
    if (oflags & __WASI_OFLAGS_CREAT) {
      required_rights |= __WASI_RIGHTS_PATH_CREATE_FILE;
    }
    if (oflags & __WASI_OFLAGS_TRUNC) {
      required_rights |= __WASI_RIGHTS_PATH_FILESTAT_SET_SIZE;
    }

    const auto& dir =
        REQUIRE_TYPED_FD(fd, LFS_TYPE_DIR, required_rights, false);

    const char* path;
    RETURN_IF_WASI_ERR(resolve_path(frame, dir.path, unresolved_path, &path));

    auto desc = std::make_unique<FileDescriptor>();
    desc->path = path;
    desc->rights_inheriting = fs_rights_inheriting;
    desc->fd_flags = fd_flags;
    desc->rights_base = fs_rights_base & dir.rights_inheriting;
    if (oflags & __WASI_OFLAGS_DIRECTORY) {
      desc->type = LFS_TYPE_DIR;
      desc->rights_base &= ~WASI_FD_RIGHTS;
      RETURN_IF_LFS_ERR(lfs_dir_open(&lfs, &desc->dir(), path));
    } else {
      desc->type = LFS_TYPE_REG;
      desc->rights_base &= ~WASI_PATH_RIGHTS;
      RETURN_IF_LFS_ERR(
          lfs_file_open(&lfs, &desc->file(), path,
                        to_lfs_open_flags(oflags, desc->rights_base)));
    }

    const auto new_fd = allocate_fd();
    REQUIRE(fds.emplace(new_fd, std::move(desc)).second);

    auto m = get_metadata(path);
    set_metadata(path, m);

    *retptr0 = new_fd;
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t path_readlink(__wasi_fd_t fd,
                               const std::string_view& unresolved_path,
                               std::span<uint8_t> result,
                               __wasi_size_t* retptr0) {
    return __WASI_ERRNO_NOSYS;
  }

  __wasi_errno_t path_remove_directory(
      CallFrame& frame, __wasi_fd_t fd,
      const std::string_view& unresolved_path) {
    const char* path;
    RETURN_IF_WASI_ERR(resolve_path(frame, fd, unresolved_path,
                                    __WASI_RIGHTS_PATH_REMOVE_DIRECTORY,
                                    &path));

    lfs_info info{};
    const auto rc = lfs_stat(&lfs, path, &info);
    if (rc == LFS_ERR_OK && info.type != LFS_TYPE_DIR) {
      return __WASI_ERRNO_NOTDIR;
    }

    RETURN_IF_LFS_ERR(lfs_remove(&lfs, path));
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t path_rename(CallFrame& frame, __wasi_fd_t old_fd,
                             const std::string_view& old_unresolved_path,
                             __wasi_fd_t new_fd,
                             const std::string_view& new_unresolved_path) {
    // TODO: update state for open FDS

    const char* old_path;
    RETURN_IF_WASI_ERR(resolve_path(frame, old_fd, old_unresolved_path,
                                    __WASI_RIGHTS_PATH_RENAME_SOURCE,
                                    &old_path));
    const auto is_old_file = is_regular_file(old_path);
    if (is_old_file) {
      RETURN_IF_WASI_ERR(verify_is_valid_file_path(old_path));
    }

    const char* new_path;
    RETURN_IF_WASI_ERR(resolve_path(frame, new_fd, new_unresolved_path,
                                    __WASI_RIGHTS_PATH_RENAME_TARGET,
                                    &new_path));
    if (is_old_file) {
      RETURN_IF_WASI_ERR(verify_is_valid_file_path(new_path));
    } else {
      // trailing '/' is valid for directory but not for lfs destination path
      const auto len = strlen(new_path);
      if (new_path[len - 1] == '/') {
        ((char*)new_path)[len - 1] = 0;
      }
    }

    const auto result = lfs_rename(&lfs, old_path, new_path);
    if (result == LFS_ERR_ISDIR) {
      // for type mismatches use error code based on destination file type
      const auto is_new_file = is_regular_file(new_path);
      return is_new_file ? __WASI_ERRNO_NOTDIR : __WASI_ERRNO_ISDIR;
    }
    RETURN_IF_LFS_ERR(result);

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t path_symlink(const std::string_view& old_unresolved_path,
                              __wasi_fd_t fd,
                              const std::string_view& new_unresolved_path) {
    return __WASI_ERRNO_NOSYS;
  }

  __wasi_errno_t path_unlink_file(CallFrame& frame, __wasi_fd_t fd,
                                  const std::string_view& unresolved_path) {
    const char* path;
    RETURN_IF_WASI_ERR(resolve_path(frame, fd, unresolved_path,
                                    __WASI_RIGHTS_PATH_UNLINK_FILE, &path));

    lfs_info info{};
    const auto rc = lfs_stat(&lfs, path, &info);
    if (rc == LFS_ERR_OK && info.type == LFS_TYPE_DIR) {
      return __WASI_ERRNO_ISDIR;
    }

    const auto len = strlen(path);
    if (path[len - 1] == '/') {
      return __WASI_ERRNO_NOTDIR;
    }

    RETURN_IF_LFS_ERR(lfs_remove(&lfs, path));
    return __WASI_ERRNO_SUCCESS;
  }

 private:
  __wasi_errno_t set_file_times(const char* path, const __wasi_timestamp_t atim,
                                const __wasi_timestamp_t mtim,
                                const __wasi_fstflags_t fst_flags) {
    auto m = get_metadata(path);
    if ((fst_flags & __WASI_FSTFLAGS_ATIM) &&
        (fst_flags & __WASI_FSTFLAGS_ATIM_NOW)) {
      return __WASI_ERRNO_INVAL;
    }

    if ((fst_flags & __WASI_FSTFLAGS_MTIM) &&
        (fst_flags & __WASI_FSTFLAGS_MTIM_NOW)) {
      return __WASI_ERRNO_INVAL;
    }

    if (fst_flags & __WASI_FSTFLAGS_ATIM) {
      m.atim = atim;
    }
    if (fst_flags & __WASI_FSTFLAGS_MTIM) {
      m.mtim = mtim;
    }

    if (fst_flags & __WASI_FSTFLAGS_ATIM_NOW) {
      m.atim = now_ms() * 10000000;
    }
    if (fst_flags & __WASI_FSTFLAGS_MTIM_NOW) {
      m.mtim = now_ms() * 10000000;
    }

    set_metadata(path, m);
    return __WASI_ERRNO_SUCCESS;
  }

  bool is_regular_file(const char* path) {
    lfs_info info{};
    return lfs_stat(&lfs, path, &info) == LFS_ERR_OK &&
           info.type == LFS_TYPE_REG;
  }

  __wasi_errno_t verify_is_valid_file_path(const char* path) {
    const auto len = strlen(path);
    if (path[len - 1] == '/') {
      return __WASI_ERRNO_NOTDIR;
    }
    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t resolve_path(CallFrame& frame, const std::string_view& dir,
                              const std::string_view& unresolved_path,
                              const char** result) {
    // TODO: proper canonicalize
    const auto new_path_size = dir.size() + unresolved_path.size() + 2;
    auto resolved_path = frame.alloc_uninitialized<char>(new_path_size);

    char* iter = resolved_path.data();
    memcpy(iter, dir.begin(), dir.size());
    iter += dir.size();

    if (unresolved_path == ".") {
      *iter = 0;
    } else {
      *iter = '/';
      ++iter;
      memcpy(iter, &unresolved_path[0], unresolved_path.size());
      iter += unresolved_path.size();
      *iter = 0;
    }

    *result = resolved_path.data();

    return __WASI_ERRNO_SUCCESS;
  }

  __wasi_errno_t resolve_path(CallFrame& frame, __wasi_fd_t fd,
                              const std::string_view& unresolved_path,
                              __wasi_rights_t rights, const char** result) {
    return resolve_path(frame,
                        REQUIRE_TYPED_FD(fd, LFS_TYPE_DIR, rights, false).path,
                        unresolved_path, result);
  }
} state;

template <class T>
auto with_external_ciovs(CallFrame& frame, int32_t iovs_ptr, int32_t iovs_len,
                         T&& callback) {
  auto iovs = frame.ref_array<__wasi_ciovec_t>(iovs_ptr, iovs_len);
  for (auto& iov : iovs) {
    iov.buf = frame.ref_array<uint8_t>(iov.buf, iov.buf_len).data();
  }
  return callback(iovs.data());
}

template <class T>
auto with_external_iovs(CallFrame& frame, int32_t iovs_ptr, int32_t iovs_len,
                        T&& callback) {
  auto iovs = frame.ref_array<__wasi_iovec_t>(iovs_ptr, iovs_len);

  std::vector<MutableView<uint8_t>> rw_buffers;
  rw_buffers.reserve(iovs_len);

  for (auto& iov : iovs) {
    rw_buffers.emplace_back(frame, reinterpret_cast<int32_t>(iov.buf),
                            iov.buf_len);
    iov.buf = rw_buffers.back().value.data();
  }
  return callback(iovs.data());
}

#define EXPORT(x) __attribute__((__export_name__(#x))) x

int32_t EXPORT(fd_advise)(int32_t arg0, int64_t arg1, int64_t arg2,
                          int32_t arg3) {
  return state.fd_advise(arg0, arg1, arg2, arg3);
}

int32_t EXPORT(fd_allocate)(int32_t arg0, int64_t arg1, int64_t arg2) {
  return state.fd_allocate(arg0, arg1, arg2);
}

int32_t EXPORT(fd_close)(int32_t arg0) { return state.fd_close(arg0); }

int32_t EXPORT(fd_datasync)(int32_t arg0) { return state.fd_datasync(arg0); }

int32_t EXPORT(fd_fdstat_get)(int32_t arg0, int32_t arg1) {
  CallFrame frame;
  MutableView<__wasi_fdstat_t> out(frame, arg1);
  return state.fd_fdstat_get(arg0, &out.get());
}

int32_t EXPORT(fd_fdstat_set_flags)(int32_t arg0, int32_t arg1) {
  return state.fd_fdstat_set_flags(arg0, arg1);
}

int32_t EXPORT(fd_fdstat_set_rights)(int32_t arg0, int64_t arg1, int64_t arg2) {
  return state.fd_fdstat_set_rights(arg0, arg1, arg2);
}

int32_t EXPORT(fd_filestat_get)(int32_t arg0, int32_t arg1) {
  CallFrame frame;
  MutableView<__wasi_filestat_t> out(frame, arg1);
  return state.fd_filestat_get(arg0, &out.get());
}

int32_t EXPORT(fd_filestat_set_size)(int32_t arg0, int64_t arg1) {
  return state.fd_filestat_set_size(arg0, arg1);
}

int32_t EXPORT(fd_filestat_set_times)(int32_t arg0, int64_t arg1, int64_t arg2,
                                      int32_t arg3) {
  return state.fd_filestat_set_times(arg0, arg1, arg2, arg3);
}

int32_t EXPORT(fd_pread)(int32_t arg0, int32_t arg1, int32_t arg2, int64_t arg3,
                         int32_t arg4) {
  CallFrame frame;
  MutableView<__wasi_size_t> out(frame, arg4);
  return with_external_iovs(frame, arg1, arg2, [&](__wasi_iovec_t* iovs) {
    return state.fd_pread(arg0, iovs, arg2, arg3, &out.get());
  });
}

int32_t EXPORT(fd_prestat_get)(int32_t arg0, int32_t arg1) {
  CallFrame frame;
  MutableView<__wasi_prestat_t> out(frame, arg1);
  return state.fd_prestat_get(arg0, &out.get());
}

int32_t EXPORT(fd_prestat_dir_name)(int32_t arg0, int32_t arg1, int32_t arg2) {
  CallFrame frame;
  MutableView<char> out(frame, arg1, arg2);
  return state.fd_prestat_dir_name(arg0, out.value);
}

int32_t EXPORT(fd_pwrite)(int32_t arg0, int32_t arg1, int32_t arg2,
                          int64_t arg3, int32_t arg4) {
  CallFrame frame;
  MutableView<__wasi_size_t> out(frame, arg4);

  return with_external_ciovs(frame, arg1, arg2, [&](__wasi_ciovec_t* iovs) {
    return state.fd_pwrite(arg0, iovs, arg2, arg3, &out.get());
  });
}

int32_t EXPORT(fd_read)(int32_t arg0, int32_t arg1, int32_t arg2,
                        int32_t arg3) {
  CallFrame frame;
  MutableView<__wasi_size_t> out(frame, arg3);
  return with_external_iovs(frame, arg1, arg2, [&](__wasi_iovec_t* iovs) {
    return state.fd_read(arg0, iovs, arg2, &out.get());
  });
}

int32_t EXPORT(fd_readdir)(int32_t arg0, int32_t arg1, int32_t arg2,
                           int64_t arg3, int32_t arg4) {
  CallFrame frame;
  MutableView<uint8_t> out1(frame, arg1, arg2);
  MutableView<__wasi_size_t> out2(frame, arg4);
  return state.fd_readdir(arg0, out1, arg3, &out2.get());
}

int32_t EXPORT(fd_renumber)(int32_t arg0, int32_t arg1) {
  return state.fd_renumber(arg0, arg1);
}

int32_t EXPORT(fd_seek)(int32_t arg0, int64_t arg1, int32_t arg2,
                        int32_t arg3) {
  CallFrame frame;
  MutableView<__wasi_filesize_t> out(frame, arg3);
  return state.fd_seek(arg0, arg1, arg2, &out.get());
}

int32_t EXPORT(fd_sync)(int32_t arg0) { return state.fd_sync(arg0); }

int32_t EXPORT(fd_tell)(int32_t arg0, int32_t arg1) {
  CallFrame frame;
  MutableView<__wasi_filesize_t> out(frame, arg1);
  return state.fd_tell(arg0, &out.get());
}

int32_t EXPORT(fd_write)(int32_t arg0, int32_t arg1, int32_t arg2,
                         int32_t arg3) {
  CallFrame frame;
  MutableView<__wasi_size_t> out(frame, arg3);
  return with_external_ciovs(frame, arg1, arg2, [&](__wasi_ciovec_t* iovs) {
    return state.fd_write(arg0, iovs, arg2, &out.get());
  });
}

int32_t EXPORT(path_create_directory)(int32_t arg0, int32_t arg1,
                                      int32_t arg2) {
  CallFrame frame;
  return state.path_create_directory(frame, arg0, frame.ref_string(arg1, arg2));
}

int32_t EXPORT(path_filestat_get)(int32_t arg0, int32_t arg1, int32_t arg2,
                                  int32_t arg3, int32_t arg4) {
  CallFrame frame;
  MutableView<__wasi_filestat_t> out(frame, arg4);
  return state.path_filestat_get(frame, arg0, arg1,
                                 frame.ref_string(arg2, arg3), &out.get());
}

int32_t EXPORT(path_filestat_set_times)(int32_t arg0, int32_t arg1,
                                        int32_t arg2, int32_t arg3,
                                        int64_t arg4, int64_t arg5,
                                        int32_t arg6) {
  CallFrame frame;
  return state.path_filestat_set_times(
      frame, arg0, arg1, frame.ref_string(arg2, arg3), arg4, arg5, arg6);
}

int32_t EXPORT(path_link)(int32_t arg0, int32_t arg1, int32_t arg2,
                          int32_t arg3, int32_t arg4, int32_t arg5,
                          int32_t arg6) {
  CallFrame frame;
  return state.path_link(arg0, arg1, frame.ref_string(arg2, arg3), arg4,
                         frame.ref_string(arg5, arg6));
}

int32_t EXPORT(path_open)(int32_t arg0, int32_t arg1, int32_t arg2,
                          int32_t arg3, int32_t arg4, int64_t arg5,
                          int64_t arg6, int32_t arg7, int32_t arg8) {
  CallFrame frame;
  MutableView<__wasi_fd_t> out(frame, arg8);
  return state.path_open(frame, arg0, arg1, frame.ref_string(arg2, arg3), arg4,
                         arg5, arg6, arg7, &out.get());
}

int32_t EXPORT(path_readlink)(int32_t arg0, int32_t arg1, int32_t arg2,
                              int32_t arg3, int32_t arg4, int32_t arg5) {
  CallFrame frame;
  MutableView<uint8_t> out1(frame, arg3, arg4);
  MutableView<__wasi_size_t> out2(frame, arg5);
  return state.path_readlink(arg0, frame.ref_string(arg1, arg2), out1.value,
                             &out2.get());
}

int32_t EXPORT(path_remove_directory)(int32_t arg0, int32_t arg1,
                                      int32_t arg2) {
  CallFrame frame;
  return state.path_remove_directory(frame, arg0, frame.ref_string(arg1, arg2));
}

int32_t EXPORT(path_rename)(int32_t arg0, int32_t arg1, int32_t arg2,
                            int32_t arg3, int32_t arg4, int32_t arg5) {
  CallFrame frame;
  return state.path_rename(frame, arg0, frame.ref_string(arg1, arg2), arg3,
                           frame.ref_string(arg4, arg5));
}

int32_t EXPORT(path_symlink)(int32_t arg0, int32_t arg1, int32_t arg2,
                             int32_t arg3, int32_t arg4) {
  CallFrame frame;
  return state.path_symlink(frame.ref_string(arg0, arg1), arg2,
                            frame.ref_string(arg3, arg4));
}

int32_t EXPORT(path_unlink_file)(int32_t arg0, int32_t arg1, int32_t arg2) {
  CallFrame frame;
  return state.path_unlink_file(frame, arg0, frame.ref_string(arg1, arg2));
}

namespace {
std::unique_ptr<FileDescriptor> make_preopen_fd(const std::string_view& path) {
  auto desc = std::make_unique<FileDescriptor>();
  desc->path = path;
  desc->type = LFS_TYPE_DIR;
  desc->rights_base = WASI_PATH_RIGHTS;
  desc->rights_inheriting = ~(__wasi_rights_t{});
  return desc;
}

std::unique_ptr<FileDescriptor> make_stream_fd(const __wasi_rights_t rights) {
  auto desc = std::make_unique<FileDescriptor>();
  desc->type = LFS_TYPE_REG;
  desc->rights_base = __WASI_RIGHTS_POLL_FD_READWRITE | rights;
  desc->rights_inheriting = ~(__wasi_rights_t{});
  desc->stream = true;
  return desc;
}

void mkdirp(const char* path) {
  auto* copy = strdup(path);
  const char* parent = dirname(copy);
  if (!strcmp(parent, path)) {
    lfs_mkdir(&state.lfs, parent);
    return;
  }

  mkdirp(parent);
  lfs_mkdir(&state.lfs, parent);
  free(copy);
}

std::string_view to_string_view(int32_t ptr, int32_t len) {
  return std::string_view{reinterpret_cast<const char*>(ptr),
                          static_cast<std::size_t>(len)};
}

}  // namespace

int32_t EXPORT(allocate)(int32_t size) {
  return reinterpret_cast<int32_t>(::malloc(size));
}

int32_t EXPORT(initialize_internal)(int32_t arg0, int32_t arg1) {
  const auto json = to_string_view(arg0, arg1);

  rapidjson::Document d;
  d.Parse(json.data(), json.size());

  REQUIRE(d.HasMember("preopens"));
  for (const auto& preopen : d["preopens"].GetArray()) {
    const auto new_fd = state.preopens.size() + 3;
    state.preopens.emplace_back(preopen.GetString());
    state.fds.emplace(new_fd, make_preopen_fd(state.preopens.back()));
  }

  REQUIRE(d.HasMember("fs"));
  for (const auto& m : d["fs"].GetObject()) {
    const auto* path = m.name.GetString();
    mkdirp(path);

    lfs_file_t file;
    LFS_REQUIRE(lfs_file_open(&state.lfs, &file, path,
                              LFS_O_WRONLY | LFS_O_CREAT | LFS_O_EXCL));
    LFS_REQUIRE(lfs_file_write(&state.lfs, &file, m.value.GetString(),
                               m.value.GetStringLength()));
    LFS_REQUIRE(lfs_file_close(&state.lfs, &file));
  }

  REQUIRE(state.fds.emplace(0, make_stream_fd(__WASI_RIGHTS_FD_READ)).second);
  REQUIRE(state.fds.emplace(1, make_stream_fd(__WASI_RIGHTS_FD_WRITE)).second);
  REQUIRE(state.fds.emplace(2, make_stream_fd(__WASI_RIGHTS_FD_WRITE)).second);

  return __WASI_ERRNO_SUCCESS;
}

int main() {
  LFS_REQUIRE(lfs_rambd_create(&state.cfg));
  LFS_REQUIRE(lfs_format(&state.lfs, &state.cfg));
  LFS_REQUIRE(lfs_mount(&state.lfs, &state.cfg));
  return 0;
}
