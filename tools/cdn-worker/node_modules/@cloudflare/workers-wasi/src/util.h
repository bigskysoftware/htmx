#pragma once
#include <span>
#include <string_view>
#include <type_traits>

class CallFrame {
 public:
  template <class T>
  std::span<T> alloc_uninitialized(const std::size_t count);

  template <class T, class U>
  std::span<T> ref_array(const U addr, std::size_t const count);

  std::string_view ref_string(const int32_t addr, const int32_t size);

 private:
  char* alloc(const std::size_t size);

  char tmp_buffer[4096 * 10];
  int tmp_offset = 0;
};

#define IMPORT(x) \
  __attribute__((__import_module__("internal"), __import_name__(#x))) x
int32_t IMPORT(copy_out)(int32_t src_addr, int32_t dst_addr, int32_t size);
int32_t IMPORT(copy_in)(int32_t src_addr, int32_t dst_addr, int32_t size);
int32_t IMPORT(trace)(int32_t is_error, int32_t addr, int32_t size);
int32_t IMPORT(now_ms)();
#undef IMPORT

template <class T>
class MutableView {
 public:
  explicit MutableView(CallFrame& frame, const int32_t addr,
                       const int32_t count = 1)
      : value(frame.ref_array<T>(addr, count)), addr(addr) {}

  T& get() { return value[0]; }

  ~MutableView() {
    copy_out(reinterpret_cast<int32_t>(value.data()), addr, value.size_bytes());
  }

  const std::span<T> value;

 private:
  const int32_t addr;
};

template <class T, class U>
[[nodiscard]] std::span<T> CallFrame::ref_array(const U addr,
                                                std::size_t const count) {
  auto data = alloc_uninitialized<T>(count);
  copy_in(reinterpret_cast<int32_t>(addr),
          reinterpret_cast<int32_t>(data.data()), data.size_bytes());
  return data;
}

template <class T>
[[nodiscard]] std::span<T> CallFrame::alloc_uninitialized(
    const std::size_t count) {
  static_assert(std::is_trivial_v<T>);
  const auto byte_length = count * sizeof(T);
  return {reinterpret_cast<T*>(alloc(byte_length)), count};
}
