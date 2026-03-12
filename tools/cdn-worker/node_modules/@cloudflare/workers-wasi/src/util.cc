#include "util.h"

#include "config.h"

char* CallFrame::alloc(const std::size_t size) {
  auto* result = tmp_buffer + tmp_offset;
  tmp_offset += size;
  REQUIRE(tmp_offset <= sizeof(tmp_buffer));
  return result;
}

std::string_view CallFrame::ref_string(int32_t addr, const int32_t len) {
  const auto span = ref_array<char>(addr, len);
  return {span.data(), span.size()};
}
