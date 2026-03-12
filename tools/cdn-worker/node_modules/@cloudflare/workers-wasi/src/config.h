#pragma once

#ifdef __cplusplus
extern "C" {
#endif
void wasi_trace(int error, const char *fmt, ...);
#ifdef __cplusplus
}
#endif

// prevent includes and configure below
#define LFS_NO_DEBUG
#define LFS_NO_WARN
#define LFS_NO_ERROR

// #define LFS_TRACE(...) wasi_trace(0, __VA_ARGS__)
// #define LFS_DEBUG(...) wasi_trace(0, __VA_ARGS__)
#define LFS_WARN(...) wasi_trace(1, __VA_ARGS__)
#define LFS_ERROR(...) wasi_trace(1, __VA_ARGS__)

#define LFS_ASSERT(x) REQUIRE(x)
#define RAPIDJSON_ASSERT(x) (void)(x);

#define unlikely(x) __builtin_expect(!!(x), 0)

#define REQUIRE(x)                      \
  do {                                  \
    if (unlikely(!(x))) {               \
      wasi_trace(1, "REQUIRE(%s)", #x); \
    }                                   \
  } while (0)

#define LFS_REQUIRE(x) REQUIRE((x) >= 0)
