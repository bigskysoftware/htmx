var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/@cloudflare/workers-wasi/dist/index.mjs
import wasm from "./c5f1acc97ad09df861eff9ef567c2186d4e38de3-memfs.wasm";
var __accessCheck = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var __privateMethod = /* @__PURE__ */ __name((obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
}, "__privateMethod");
var Result;
(function(Result2) {
  Result2[Result2["SUCCESS"] = 0] = "SUCCESS";
  Result2[Result2["EBADF"] = 8] = "EBADF";
  Result2[Result2["EINVAL"] = 28] = "EINVAL";
  Result2[Result2["ENOENT"] = 44] = "ENOENT";
  Result2[Result2["ENOSYS"] = 52] = "ENOSYS";
  Result2[Result2["ENOTSUP"] = 58] = "ENOTSUP";
})(Result || (Result = {}));
var Clock;
(function(Clock2) {
  Clock2[Clock2["REALTIME"] = 0] = "REALTIME";
  Clock2[Clock2["MONOTONIC"] = 1] = "MONOTONIC";
  Clock2[Clock2["PROCESS_CPUTIME_ID"] = 2] = "PROCESS_CPUTIME_ID";
  Clock2[Clock2["THREAD_CPUTIME_ID"] = 3] = "THREAD_CPUTIME_ID";
})(Clock || (Clock = {}));
var iovViews = /* @__PURE__ */ __name((view, iovs_ptr, iovs_len) => {
  let result = Array(iovs_len);
  for (let i = 0; i < iovs_len; i++) {
    const bufferPtr = view.getUint32(iovs_ptr, true);
    iovs_ptr += 4;
    const bufferLen = view.getUint32(iovs_ptr, true);
    iovs_ptr += 4;
    result[i] = new Uint8Array(view.buffer, bufferPtr, bufferLen);
  }
  return result;
}, "iovViews");
var _instance;
var _hostMemory;
var _getInternalView;
var getInternalView_fn;
var _copyFrom;
var copyFrom_fn;
var MemFS = class {
  static {
    __name(this, "MemFS");
  }
  constructor(preopens, fs) {
    __privateAdd(this, _getInternalView);
    __privateAdd(this, _copyFrom);
    __privateAdd(this, _instance, void 0);
    __privateAdd(this, _hostMemory, void 0);
    __privateSet(this, _instance, new WebAssembly.Instance(wasm, {
      internal: {
        now_ms: /* @__PURE__ */ __name(() => Date.now(), "now_ms"),
        trace: /* @__PURE__ */ __name((isError, addr, size) => {
          const view = new Uint8Array(__privateMethod(this, _getInternalView, getInternalView_fn).call(this).buffer, addr, size);
          const s = new TextDecoder().decode(view);
          if (isError) {
            throw new Error(s);
          } else {
            console.info(s);
          }
        }, "trace"),
        copy_out: /* @__PURE__ */ __name((srcAddr, dstAddr, size) => {
          const dst = new Uint8Array(__privateGet(this, _hostMemory).buffer, dstAddr, size);
          const src = new Uint8Array(__privateMethod(this, _getInternalView, getInternalView_fn).call(this).buffer, srcAddr, size);
          dst.set(src);
        }, "copy_out"),
        copy_in: /* @__PURE__ */ __name((srcAddr, dstAddr, size) => {
          const src = new Uint8Array(__privateGet(this, _hostMemory).buffer, srcAddr, size);
          const dst = new Uint8Array(__privateMethod(this, _getInternalView, getInternalView_fn).call(this).buffer, dstAddr, size);
          dst.set(src);
        }, "copy_in")
      },
      wasi_snapshot_preview1: {
        proc_exit: /* @__PURE__ */ __name((_) => {
        }, "proc_exit"),
        fd_seek: /* @__PURE__ */ __name(() => Result.ENOSYS, "fd_seek"),
        fd_write: /* @__PURE__ */ __name(() => Result.ENOSYS, "fd_write"),
        fd_close: /* @__PURE__ */ __name(() => Result.ENOSYS, "fd_close")
      }
    }));
    this.exports = __privateGet(this, _instance).exports;
    const start = __privateGet(this, _instance).exports._start;
    start();
    const data = new TextEncoder().encode(JSON.stringify({ preopens, fs }));
    const initialize_internal = __privateGet(this, _instance).exports.initialize_internal;
    initialize_internal(__privateMethod(this, _copyFrom, copyFrom_fn).call(this, data), data.byteLength);
  }
  initialize(hostMemory) {
    __privateSet(this, _hostMemory, hostMemory);
  }
};
_instance = /* @__PURE__ */ new WeakMap();
_hostMemory = /* @__PURE__ */ new WeakMap();
_getInternalView = /* @__PURE__ */ new WeakSet();
getInternalView_fn = /* @__PURE__ */ __name(function() {
  const memory = __privateGet(this, _instance).exports.memory;
  return new DataView(memory.buffer);
}, "getInternalView_fn");
_copyFrom = /* @__PURE__ */ new WeakSet();
copyFrom_fn = /* @__PURE__ */ __name(function(src) {
  const dstAddr = __privateGet(this, _instance).exports.allocate(src.byteLength);
  new Uint8Array(__privateMethod(this, _getInternalView, getInternalView_fn).call(this).buffer, dstAddr, src.byteLength).set(src);
  return dstAddr;
}, "copyFrom_fn");
var DATA_ADDR = 16;
var DATA_START = DATA_ADDR + 8;
var DATA_END = 1024;
var WRAPPED_EXPORTS = /* @__PURE__ */ new WeakMap();
var State = {
  None: 0,
  Unwinding: 1,
  Rewinding: 2
};
function isPromise(obj) {
  return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
}
__name(isPromise, "isPromise");
function proxyGet(obj, transform) {
  return new Proxy(obj, {
    get: /* @__PURE__ */ __name((obj2, name) => transform(obj2[name]), "get")
  });
}
__name(proxyGet, "proxyGet");
var Asyncify = class {
  static {
    __name(this, "Asyncify");
  }
  constructor() {
    this.value = void 0;
    this.exports = null;
  }
  getState() {
    return this.exports.asyncify_get_state();
  }
  assertNoneState() {
    let state = this.getState();
    if (state !== State.None) {
      throw new Error(`Invalid async state ${state}, expected 0.`);
    }
  }
  wrapImportFn(fn) {
    return (...args) => {
      if (this.getState() === State.Rewinding) {
        this.exports.asyncify_stop_rewind();
        return this.value;
      }
      this.assertNoneState();
      let value = fn(...args);
      if (!isPromise(value)) {
        return value;
      }
      this.exports.asyncify_start_unwind(DATA_ADDR);
      this.value = value;
    };
  }
  wrapModuleImports(module) {
    return proxyGet(module, (value) => {
      if (typeof value === "function") {
        return this.wrapImportFn(value);
      }
      return value;
    });
  }
  wrapImports(imports) {
    if (imports === void 0)
      return;
    return proxyGet(imports, (moduleImports = /* @__PURE__ */ Object.create(null)) => this.wrapModuleImports(moduleImports));
  }
  wrapExportFn(fn) {
    let newExport = WRAPPED_EXPORTS.get(fn);
    if (newExport !== void 0) {
      return newExport;
    }
    newExport = /* @__PURE__ */ __name(async (...args) => {
      this.assertNoneState();
      let result = fn(...args);
      while (this.getState() === State.Unwinding) {
        this.exports.asyncify_stop_unwind();
        this.value = await this.value;
        this.assertNoneState();
        this.exports.asyncify_start_rewind(DATA_ADDR);
        result = fn();
      }
      this.assertNoneState();
      return result;
    }, "newExport");
    WRAPPED_EXPORTS.set(fn, newExport);
    return newExport;
  }
  wrapExports(exports) {
    let newExports = /* @__PURE__ */ Object.create(null);
    for (let exportName in exports) {
      let value = exports[exportName];
      if (typeof value === "function" && !exportName.startsWith("asyncify_")) {
        value = this.wrapExportFn(value);
      }
      Object.defineProperty(newExports, exportName, {
        enumerable: true,
        value
      });
    }
    WRAPPED_EXPORTS.set(exports, newExports);
    return newExports;
  }
  init(instance, imports) {
    const { exports } = instance;
    const memory = exports.memory || imports.env && imports.env.memory;
    new Int32Array(memory.buffer, DATA_ADDR).set([DATA_START, DATA_END]);
    this.exports = this.wrapExports(exports);
    Object.setPrototypeOf(instance, Instance.prototype);
  }
};
var Instance = class extends WebAssembly.Instance {
  static {
    __name(this, "Instance");
  }
  constructor(module, imports) {
    let state = new Asyncify();
    super(module, state.wrapImports(imports));
    state.init(this, imports);
  }
  get exports() {
    return WRAPPED_EXPORTS.get(super.exports);
  }
};
Object.defineProperty(Instance.prototype, "exports", { enumerable: true });
var DevNull = class {
  static {
    __name(this, "DevNull");
  }
  writev(iovs) {
    return iovs.map((iov) => iov.byteLength).reduce((prev, curr) => prev + curr);
  }
  readv(iovs) {
    return 0;
  }
  close() {
  }
  async preRun() {
  }
  async postRun() {
  }
};
var ReadableStreamBase = class {
  static {
    __name(this, "ReadableStreamBase");
  }
  writev(iovs) {
    throw new Error("Attempting to call write on a readable stream");
  }
  close() {
  }
  async preRun() {
  }
  async postRun() {
  }
};
var _pending;
var _reader;
var AsyncReadableStreamAdapter = class extends ReadableStreamBase {
  static {
    __name(this, "AsyncReadableStreamAdapter");
  }
  constructor(reader) {
    super();
    __privateAdd(this, _pending, new Uint8Array());
    __privateAdd(this, _reader, void 0);
    __privateSet(this, _reader, reader);
  }
  async readv(iovs) {
    let read = 0;
    for (let iov of iovs) {
      while (iov.byteLength > 0) {
        if (__privateGet(this, _pending).byteLength === 0) {
          const result = await __privateGet(this, _reader).read();
          if (result.done) {
            return read;
          }
          __privateSet(this, _pending, result.value);
        }
        const bytes = Math.min(iov.byteLength, __privateGet(this, _pending).byteLength);
        iov.set(__privateGet(this, _pending).subarray(0, bytes));
        __privateSet(this, _pending, __privateGet(this, _pending).subarray(bytes));
        read += bytes;
        iov = iov.subarray(bytes);
      }
    }
    return read;
  }
};
_pending = /* @__PURE__ */ new WeakMap();
_reader = /* @__PURE__ */ new WeakMap();
var WritableStreamBase = class {
  static {
    __name(this, "WritableStreamBase");
  }
  readv(iovs) {
    throw new Error("Attempting to call read on a writable stream");
  }
  close() {
  }
  async preRun() {
  }
  async postRun() {
  }
};
var _writer;
var AsyncWritableStreamAdapter = class extends WritableStreamBase {
  static {
    __name(this, "AsyncWritableStreamAdapter");
  }
  constructor(writer) {
    super();
    __privateAdd(this, _writer, void 0);
    __privateSet(this, _writer, writer);
  }
  async writev(iovs) {
    let written = 0;
    for (const iov of iovs) {
      if (iov.byteLength === 0) {
        continue;
      }
      await __privateGet(this, _writer).write(iov);
      written += iov.byteLength;
    }
    return written;
  }
  async close() {
    await __privateGet(this, _writer).close();
  }
};
_writer = /* @__PURE__ */ new WeakMap();
var _writer2;
var _buffer;
var _bytesWritten;
var SyncWritableStreamAdapter = class extends WritableStreamBase {
  static {
    __name(this, "SyncWritableStreamAdapter");
  }
  constructor(writer) {
    super();
    __privateAdd(this, _writer2, void 0);
    __privateAdd(this, _buffer, new Uint8Array(4096));
    __privateAdd(this, _bytesWritten, 0);
    __privateSet(this, _writer2, writer);
  }
  writev(iovs) {
    let written = 0;
    for (const iov of iovs) {
      if (iov.byteLength === 0) {
        continue;
      }
      const requiredCapacity = __privateGet(this, _bytesWritten) + iov.byteLength;
      if (requiredCapacity > __privateGet(this, _buffer).byteLength) {
        let desiredCapacity = __privateGet(this, _buffer).byteLength;
        while (desiredCapacity < requiredCapacity) {
          desiredCapacity *= 1.5;
        }
        const oldBuffer = __privateGet(this, _buffer);
        __privateSet(this, _buffer, new Uint8Array(desiredCapacity));
        __privateGet(this, _buffer).set(oldBuffer);
      }
      __privateGet(this, _buffer).set(iov, __privateGet(this, _bytesWritten));
      written += iov.byteLength;
      __privateSet(this, _bytesWritten, __privateGet(this, _bytesWritten) + iov.byteLength);
    }
    return written;
  }
  async postRun() {
    const slice = __privateGet(this, _buffer).subarray(0, __privateGet(this, _bytesWritten));
    await __privateGet(this, _writer2).write(slice);
    await __privateGet(this, _writer2).close();
  }
};
_writer2 = /* @__PURE__ */ new WeakMap();
_buffer = /* @__PURE__ */ new WeakMap();
_bytesWritten = /* @__PURE__ */ new WeakMap();
var _buffer2;
var _reader2;
var SyncReadableStreamAdapter = class extends ReadableStreamBase {
  static {
    __name(this, "SyncReadableStreamAdapter");
  }
  constructor(reader) {
    super();
    __privateAdd(this, _buffer2, void 0);
    __privateAdd(this, _reader2, void 0);
    __privateSet(this, _reader2, reader);
  }
  readv(iovs) {
    let read = 0;
    for (const iov of iovs) {
      const bytes = Math.min(iov.byteLength, __privateGet(this, _buffer2).byteLength);
      if (bytes <= 0) {
        break;
      }
      iov.set(__privateGet(this, _buffer2).subarray(0, bytes));
      __privateSet(this, _buffer2, __privateGet(this, _buffer2).subarray(bytes));
      read += bytes;
    }
    return read;
  }
  async preRun() {
    const pending = [];
    let length = 0;
    for (; ; ) {
      const result2 = await __privateGet(this, _reader2).read();
      if (result2.done) {
        break;
      }
      const data = result2.value;
      pending.push(data);
      length += data.length;
    }
    let result = new Uint8Array(length);
    let offset = 0;
    pending.forEach((item) => {
      result.set(item, offset);
      offset += item.length;
    });
    __privateSet(this, _buffer2, result);
  }
};
_buffer2 = /* @__PURE__ */ new WeakMap();
_reader2 = /* @__PURE__ */ new WeakMap();
var fromReadableStream = /* @__PURE__ */ __name((stream, supportsAsync) => {
  if (!stream) {
    return new DevNull();
  }
  if (supportsAsync) {
    return new AsyncReadableStreamAdapter(stream.getReader());
  }
  return new SyncReadableStreamAdapter(stream.getReader());
}, "fromReadableStream");
var fromWritableStream = /* @__PURE__ */ __name((stream, supportsAsync) => {
  if (!stream) {
    return new DevNull();
  }
  if (supportsAsync) {
    return new AsyncWritableStreamAdapter(stream.getWriter());
  }
  return new SyncWritableStreamAdapter(stream.getWriter());
}, "fromWritableStream");
var ProcessExit = class extends Error {
  static {
    __name(this, "ProcessExit");
  }
  constructor(code) {
    super(`proc_exit=${code}`);
    this.code = code;
    Object.setPrototypeOf(this, ProcessExit.prototype);
  }
};
var _args;
var _env;
var _memory;
var _preopens;
var _returnOnExit;
var _streams;
var _memfs;
var _state;
var _asyncify;
var _view;
var view_fn;
var _fillValues;
var fillValues_fn;
var _fillSizes;
var fillSizes_fn;
var _args_get;
var args_get_fn;
var _args_sizes_get;
var args_sizes_get_fn;
var _clock_res_get;
var clock_res_get_fn;
var _clock_time_get;
var clock_time_get_fn;
var _environ_get;
var environ_get_fn;
var _environ_sizes_get;
var environ_sizes_get_fn;
var _fd_read;
var fd_read_fn;
var _fd_write;
var fd_write_fn;
var _poll_oneoff;
var poll_oneoff_fn;
var _proc_exit;
var proc_exit_fn;
var _proc_raise;
var proc_raise_fn;
var _random_get;
var random_get_fn;
var _sched_yield;
var sched_yield_fn;
var _sock_recv;
var sock_recv_fn;
var _sock_send;
var sock_send_fn;
var _sock_shutdown;
var sock_shutdown_fn;
var WASI = class {
  static {
    __name(this, "WASI");
  }
  constructor(options) {
    __privateAdd(this, _view);
    __privateAdd(this, _fillValues);
    __privateAdd(this, _fillSizes);
    __privateAdd(this, _args_get);
    __privateAdd(this, _args_sizes_get);
    __privateAdd(this, _clock_res_get);
    __privateAdd(this, _clock_time_get);
    __privateAdd(this, _environ_get);
    __privateAdd(this, _environ_sizes_get);
    __privateAdd(this, _fd_read);
    __privateAdd(this, _fd_write);
    __privateAdd(this, _poll_oneoff);
    __privateAdd(this, _proc_exit);
    __privateAdd(this, _proc_raise);
    __privateAdd(this, _random_get);
    __privateAdd(this, _sched_yield);
    __privateAdd(this, _sock_recv);
    __privateAdd(this, _sock_send);
    __privateAdd(this, _sock_shutdown);
    __privateAdd(this, _args, void 0);
    __privateAdd(this, _env, void 0);
    __privateAdd(this, _memory, void 0);
    __privateAdd(this, _preopens, void 0);
    __privateAdd(this, _returnOnExit, void 0);
    __privateAdd(this, _streams, void 0);
    __privateAdd(this, _memfs, void 0);
    __privateAdd(this, _state, new Asyncify());
    __privateAdd(this, _asyncify, void 0);
    __privateSet(this, _args, options?.args ?? []);
    const env = options?.env ?? {};
    __privateSet(this, _env, Object.keys(env).map((key) => {
      return `${key}=${env[key]}`;
    }));
    __privateSet(this, _returnOnExit, options?.returnOnExit ?? false);
    __privateSet(this, _preopens, options?.preopens ?? []);
    __privateSet(this, _asyncify, options?.streamStdio ?? false);
    __privateSet(this, _streams, [
      fromReadableStream(options?.stdin, __privateGet(this, _asyncify)),
      fromWritableStream(options?.stdout, __privateGet(this, _asyncify)),
      fromWritableStream(options?.stderr, __privateGet(this, _asyncify))
    ]);
    __privateSet(this, _memfs, new MemFS(__privateGet(this, _preopens), options?.fs ?? {}));
  }
  async start(instance) {
    __privateSet(this, _memory, instance.exports.memory);
    __privateGet(this, _memfs).initialize(__privateGet(this, _memory));
    try {
      if (__privateGet(this, _asyncify)) {
        if (!instance.exports.asyncify_get_state) {
          throw new Error("streamStdio is requested but the module is missing 'Asyncify' exports, see https://github.com/GoogleChromeLabs/asyncify");
        }
        __privateGet(this, _state).init(instance);
      }
      await Promise.all(__privateGet(this, _streams).map((s) => s.preRun()));
      if (__privateGet(this, _asyncify)) {
        await __privateGet(this, _state).exports._start();
      } else {
        const entrypoint = instance.exports._start;
        entrypoint();
      }
    } catch (e) {
      if (!__privateGet(this, _returnOnExit)) {
        throw e;
      }
      if (e.message === "unreachable") {
        return 134;
      } else if (e instanceof ProcessExit) {
        return e.code;
      } else {
        throw e;
      }
    } finally {
      await Promise.all(__privateGet(this, _streams).map((s) => s.close()));
      await Promise.all(__privateGet(this, _streams).map((s) => s.postRun()));
    }
    return void 0;
  }
  get wasiImport() {
    const wrap = /* @__PURE__ */ __name((f, self = this) => {
      const bound = f.bind(self);
      if (__privateGet(this, _asyncify)) {
        return __privateGet(this, _state).wrapImportFn(bound);
      }
      return bound;
    }, "wrap");
    return {
      args_get: wrap(__privateMethod(this, _args_get, args_get_fn)),
      args_sizes_get: wrap(__privateMethod(this, _args_sizes_get, args_sizes_get_fn)),
      clock_res_get: wrap(__privateMethod(this, _clock_res_get, clock_res_get_fn)),
      clock_time_get: wrap(__privateMethod(this, _clock_time_get, clock_time_get_fn)),
      environ_get: wrap(__privateMethod(this, _environ_get, environ_get_fn)),
      environ_sizes_get: wrap(__privateMethod(this, _environ_sizes_get, environ_sizes_get_fn)),
      fd_advise: wrap(__privateGet(this, _memfs).exports.fd_advise),
      fd_allocate: wrap(__privateGet(this, _memfs).exports.fd_allocate),
      fd_close: wrap(__privateGet(this, _memfs).exports.fd_close),
      fd_datasync: wrap(__privateGet(this, _memfs).exports.fd_datasync),
      fd_fdstat_get: wrap(__privateGet(this, _memfs).exports.fd_fdstat_get),
      fd_fdstat_set_flags: wrap(__privateGet(this, _memfs).exports.fd_fdstat_set_flags),
      fd_fdstat_set_rights: wrap(__privateGet(this, _memfs).exports.fd_fdstat_set_rights),
      fd_filestat_get: wrap(__privateGet(this, _memfs).exports.fd_filestat_get),
      fd_filestat_set_size: wrap(__privateGet(this, _memfs).exports.fd_filestat_set_size),
      fd_filestat_set_times: wrap(__privateGet(this, _memfs).exports.fd_filestat_set_times),
      fd_pread: wrap(__privateGet(this, _memfs).exports.fd_pread),
      fd_prestat_dir_name: wrap(__privateGet(this, _memfs).exports.fd_prestat_dir_name),
      fd_prestat_get: wrap(__privateGet(this, _memfs).exports.fd_prestat_get),
      fd_pwrite: wrap(__privateGet(this, _memfs).exports.fd_pwrite),
      fd_read: wrap(__privateMethod(this, _fd_read, fd_read_fn)),
      fd_readdir: wrap(__privateGet(this, _memfs).exports.fd_readdir),
      fd_renumber: wrap(__privateGet(this, _memfs).exports.fd_renumber),
      fd_seek: wrap(__privateGet(this, _memfs).exports.fd_seek),
      fd_sync: wrap(__privateGet(this, _memfs).exports.fd_sync),
      fd_tell: wrap(__privateGet(this, _memfs).exports.fd_tell),
      fd_write: wrap(__privateMethod(this, _fd_write, fd_write_fn)),
      path_create_directory: wrap(__privateGet(this, _memfs).exports.path_create_directory),
      path_filestat_get: wrap(__privateGet(this, _memfs).exports.path_filestat_get),
      path_filestat_set_times: wrap(__privateGet(this, _memfs).exports.path_filestat_set_times),
      path_link: wrap(__privateGet(this, _memfs).exports.path_link),
      path_open: wrap(__privateGet(this, _memfs).exports.path_open),
      path_readlink: wrap(__privateGet(this, _memfs).exports.path_readlink),
      path_remove_directory: wrap(__privateGet(this, _memfs).exports.path_remove_directory),
      path_rename: wrap(__privateGet(this, _memfs).exports.path_rename),
      path_symlink: wrap(__privateGet(this, _memfs).exports.path_symlink),
      path_unlink_file: wrap(__privateGet(this, _memfs).exports.path_unlink_file),
      poll_oneoff: wrap(__privateMethod(this, _poll_oneoff, poll_oneoff_fn)),
      proc_exit: wrap(__privateMethod(this, _proc_exit, proc_exit_fn)),
      proc_raise: wrap(__privateMethod(this, _proc_raise, proc_raise_fn)),
      random_get: wrap(__privateMethod(this, _random_get, random_get_fn)),
      sched_yield: wrap(__privateMethod(this, _sched_yield, sched_yield_fn)),
      sock_recv: wrap(__privateMethod(this, _sock_recv, sock_recv_fn)),
      sock_send: wrap(__privateMethod(this, _sock_send, sock_send_fn)),
      sock_shutdown: wrap(__privateMethod(this, _sock_shutdown, sock_shutdown_fn))
    };
  }
};
_args = /* @__PURE__ */ new WeakMap();
_env = /* @__PURE__ */ new WeakMap();
_memory = /* @__PURE__ */ new WeakMap();
_preopens = /* @__PURE__ */ new WeakMap();
_returnOnExit = /* @__PURE__ */ new WeakMap();
_streams = /* @__PURE__ */ new WeakMap();
_memfs = /* @__PURE__ */ new WeakMap();
_state = /* @__PURE__ */ new WeakMap();
_asyncify = /* @__PURE__ */ new WeakMap();
_view = /* @__PURE__ */ new WeakSet();
view_fn = /* @__PURE__ */ __name(function() {
  if (!__privateGet(this, _memory)) {
    throw new Error("this.memory not set");
  }
  return new DataView(__privateGet(this, _memory).buffer);
}, "view_fn");
_fillValues = /* @__PURE__ */ new WeakSet();
fillValues_fn = /* @__PURE__ */ __name(function(values, iter_ptr_ptr, buf_ptr) {
  const encoder = new TextEncoder();
  const buffer = new Uint8Array(__privateGet(this, _memory).buffer);
  const view = __privateMethod(this, _view, view_fn).call(this);
  for (const value of values) {
    view.setUint32(iter_ptr_ptr, buf_ptr, true);
    iter_ptr_ptr += 4;
    const data = encoder.encode(`${value}\0`);
    buffer.set(data, buf_ptr);
    buf_ptr += data.length;
  }
  return Result.SUCCESS;
}, "fillValues_fn");
_fillSizes = /* @__PURE__ */ new WeakSet();
fillSizes_fn = /* @__PURE__ */ __name(function(values, count_ptr, buffer_size_ptr) {
  const view = __privateMethod(this, _view, view_fn).call(this);
  const encoder = new TextEncoder();
  const len = values.reduce((acc, value) => {
    return acc + encoder.encode(`${value}\0`).length;
  }, 0);
  view.setUint32(count_ptr, values.length, true);
  view.setUint32(buffer_size_ptr, len, true);
  return Result.SUCCESS;
}, "fillSizes_fn");
_args_get = /* @__PURE__ */ new WeakSet();
args_get_fn = /* @__PURE__ */ __name(function(argv_ptr_ptr, argv_buf_ptr) {
  return __privateMethod(this, _fillValues, fillValues_fn).call(this, __privateGet(this, _args), argv_ptr_ptr, argv_buf_ptr);
}, "args_get_fn");
_args_sizes_get = /* @__PURE__ */ new WeakSet();
args_sizes_get_fn = /* @__PURE__ */ __name(function(argc_ptr, argv_buf_size_ptr) {
  return __privateMethod(this, _fillSizes, fillSizes_fn).call(this, __privateGet(this, _args), argc_ptr, argv_buf_size_ptr);
}, "args_sizes_get_fn");
_clock_res_get = /* @__PURE__ */ new WeakSet();
clock_res_get_fn = /* @__PURE__ */ __name(function(id, retptr0) {
  switch (id) {
    case Clock.REALTIME:
    case Clock.MONOTONIC:
    case Clock.PROCESS_CPUTIME_ID:
    case Clock.THREAD_CPUTIME_ID: {
      const view = __privateMethod(this, _view, view_fn).call(this);
      view.setBigUint64(retptr0, BigInt(1e6), true);
      return Result.SUCCESS;
    }
  }
  return Result.EINVAL;
}, "clock_res_get_fn");
_clock_time_get = /* @__PURE__ */ new WeakSet();
clock_time_get_fn = /* @__PURE__ */ __name(function(id, precision, retptr0) {
  switch (id) {
    case Clock.REALTIME:
    case Clock.MONOTONIC:
    case Clock.PROCESS_CPUTIME_ID:
    case Clock.THREAD_CPUTIME_ID: {
      const view = __privateMethod(this, _view, view_fn).call(this);
      view.setBigUint64(retptr0, BigInt(Date.now()) * BigInt(1e6), true);
      return Result.SUCCESS;
    }
  }
  return Result.EINVAL;
}, "clock_time_get_fn");
_environ_get = /* @__PURE__ */ new WeakSet();
environ_get_fn = /* @__PURE__ */ __name(function(env_ptr_ptr, env_buf_ptr) {
  return __privateMethod(this, _fillValues, fillValues_fn).call(this, __privateGet(this, _env), env_ptr_ptr, env_buf_ptr);
}, "environ_get_fn");
_environ_sizes_get = /* @__PURE__ */ new WeakSet();
environ_sizes_get_fn = /* @__PURE__ */ __name(function(env_ptr, env_buf_size_ptr) {
  return __privateMethod(this, _fillSizes, fillSizes_fn).call(this, __privateGet(this, _env), env_ptr, env_buf_size_ptr);
}, "environ_sizes_get_fn");
_fd_read = /* @__PURE__ */ new WeakSet();
fd_read_fn = /* @__PURE__ */ __name(function(fd, iovs_ptr, iovs_len, retptr0) {
  if (fd < 3) {
    const desc = __privateGet(this, _streams)[fd];
    const view = __privateMethod(this, _view, view_fn).call(this);
    const iovs = iovViews(view, iovs_ptr, iovs_len);
    const result = desc.readv(iovs);
    if (typeof result === "number") {
      view.setUint32(retptr0, result, true);
      return Result.SUCCESS;
    }
    const promise = result;
    return promise.then((read) => {
      view.setUint32(retptr0, read, true);
      return Result.SUCCESS;
    });
  }
  return __privateGet(this, _memfs).exports.fd_read(fd, iovs_ptr, iovs_len, retptr0);
}, "fd_read_fn");
_fd_write = /* @__PURE__ */ new WeakSet();
fd_write_fn = /* @__PURE__ */ __name(function(fd, ciovs_ptr, ciovs_len, retptr0) {
  if (fd < 3) {
    const desc = __privateGet(this, _streams)[fd];
    const view = __privateMethod(this, _view, view_fn).call(this);
    const iovs = iovViews(view, ciovs_ptr, ciovs_len);
    const result = desc.writev(iovs);
    if (typeof result === "number") {
      view.setUint32(retptr0, result, true);
      return Result.SUCCESS;
    }
    let promise = result;
    return promise.then((written) => {
      view.setUint32(retptr0, written, true);
      return Result.SUCCESS;
    });
  }
  return __privateGet(this, _memfs).exports.fd_write(fd, ciovs_ptr, ciovs_len, retptr0);
}, "fd_write_fn");
_poll_oneoff = /* @__PURE__ */ new WeakSet();
poll_oneoff_fn = /* @__PURE__ */ __name(function(in_ptr, out_ptr, nsubscriptions, retptr0) {
  return Result.ENOSYS;
}, "poll_oneoff_fn");
_proc_exit = /* @__PURE__ */ new WeakSet();
proc_exit_fn = /* @__PURE__ */ __name(function(code) {
  throw new ProcessExit(code);
}, "proc_exit_fn");
_proc_raise = /* @__PURE__ */ new WeakSet();
proc_raise_fn = /* @__PURE__ */ __name(function(signal) {
  return Result.ENOSYS;
}, "proc_raise_fn");
_random_get = /* @__PURE__ */ new WeakSet();
random_get_fn = /* @__PURE__ */ __name(function(buffer_ptr, buffer_len) {
  const buffer = new Uint8Array(__privateGet(this, _memory).buffer, buffer_ptr, buffer_len);
  crypto.getRandomValues(buffer);
  return Result.SUCCESS;
}, "random_get_fn");
_sched_yield = /* @__PURE__ */ new WeakSet();
sched_yield_fn = /* @__PURE__ */ __name(function() {
  return Result.SUCCESS;
}, "sched_yield_fn");
_sock_recv = /* @__PURE__ */ new WeakSet();
sock_recv_fn = /* @__PURE__ */ __name(function(fd, ri_data_ptr, ri_data_len, ri_flags, retptr0, retptr1) {
  return Result.ENOSYS;
}, "sock_recv_fn");
_sock_send = /* @__PURE__ */ new WeakSet();
sock_send_fn = /* @__PURE__ */ __name(function(fd, si_data_ptr, si_data_len, si_flags, retptr0) {
  return Result.ENOSYS;
}, "sock_send_fn");
_sock_shutdown = /* @__PURE__ */ new WeakSet();
sock_shutdown_fn = /* @__PURE__ */ __name(function(fd, how) {
  return Result.ENOSYS;
}, "sock_shutdown_fn");

// src/index.js
import assemblerWasm from "./6497d080c8698bc59fb0d60cba1b142b008aba50-assembler.wasm";

// src/sources.json
var sources_default = { version: "4.0.0", kernel: "// htmx 4.0 \u2014 Kernel\n//\n// Pipeline: init \u2192 [trigger fires] \u2192 before:trigger \u2192 [extensions do work] \u2192 after:trigger\n// Swap:    before:swap \u2192 swap.execute() \u2192 after:swap\n// Each phase emits before:* \u2192 execute() \u2192 after:*\n// Extensions modify detail or replace execute during before:*.\n//\n// The kernel is transport-agnostic. It knows nothing about HTTP, ajax, or\n// requests. Core extensions add ajax, attribute reading, and all hx-* behavior.\n//\n// throw HtmxError \u2014 Programmer error (bad arguments, misconfigured extension).\n// htmx:error event \u2014 Runtime error (network, missing target, etc.).\n\nclass HtmxError extends Error {\n    constructor(message, options) {\n        super(message, options)\n        this.type = options?.type\n    }\n}\n\nvar htmx = (function () {\n    'use strict'\n\n    // \u2500\u2500 State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n    // Namespace for managed state. Kernel owns state.elements (per-element\n    // lifecycle). Extensions may add their own domains (e.g., state.connections).\n\n    const state = {\n        booted: false,\n        elements: new WeakMap(),\n    }\n\n    // \u2500\u2500 Config \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n    // Extensions populate this at boot (e.g., defaultSwap, requestTimeout).\n    const config = {}\n\n    // \u2500\u2500 Extensions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    const extensions = []\n\n    /**\n     * Register an extension. Extensions run in registration order.\n     * @param {string} name - Unique extension name.\n     * @param {{requires?: string[], on?: Object<string, function>}} extension\n     */\n    function register(name, extension) {\n        if (extensions.some(registered => registered.name === name)) {\n            throw new HtmxError(`Extension \"${name}\" is already registered`, {type: 'EXTENSION_ALREADY_REGISTERED'})\n        }\n        for (const dependency of extension.requires || []) {\n            if (!extensions.some(registered => registered.name === dependency)) {\n                throw new HtmxError(`Extension \"${name}\" requires \"${dependency}\" to be registered first`, {type: 'EXTENSION_DEPENDENCY_MISSING'})\n            }\n        }\n        extensions.push({name, ...extension})\n        // Late-registered extensions still get a boot event\n        if (state.booted && extension.on?.['htmx:boot']) {\n            extension.on['htmx:boot']({}, api)\n        }\n    }\n\n    // \u2500\u2500 Events \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    /**\n     * Emit an event: extensions see it first, then it dispatches as a DOM CustomEvent.\n     * Any extension returning false (or preventDefault) cancels the event.\n     * @param {Element} element\n     * @param {string} eventName\n     * @param {Object} [detail={}]\n     * @returns {boolean} false if canceled\n     */\n    function emit(element, eventName, detail = {}) {\n        // Extensions get first crack \u2014 can inspect/modify detail or cancel\n        for (const extension of extensions) {\n            if (extension.on?.[eventName]?.(detail, api) === false) return false\n        }\n\n        // Fall back to body for disconnected elements (e.g., during cleanup)\n        const dispatchTarget = element?.isConnected ? element : document.body\n\n        return dispatchTarget.dispatchEvent(\n            new CustomEvent(eventName, {\n                detail,\n                bubbles: true,\n                cancelable: true,\n                composed: true,\n            }))\n    }\n\n    // \u2500\u2500 Utilities \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    /** @param {boolean} result - Return value of api.emit(). */\n    const canceled = (result) => result === false\n\n    /**\n     * Listen for a DOM event. Auto-registers a cleanup callback if the element\n     * has state, so listeners are removed when the element is cleaned up.\n     * @param {EventTarget} element\n     * @param {string} eventName\n     * @param {EventListener} handler\n     * @param {AddEventListenerOptions} [options]\n     * @returns {function} unsubscribe callback\n     */\n    function on(element, eventName, handler, options) {\n        if (!eventName) throw new HtmxError('Cannot add listener without an event name', {type: 'EVENT_NAME_MISSING'})\n\n        element.addEventListener(eventName, handler, options)\n\n        const off = () => element.removeEventListener(eventName, handler, options)\n\n        // Auto-cleanup: if this element is managed, unsubscribe on removal\n        if (state.elements.has(element)) state.elements.get(element).cleanup.push(off)\n\n        return off\n    }\n\n    /**\n     * Resolve an element reference. Always searches from document.\n     *\n     * Supports CSS selectors and direct Element references.\n     * Pass {multiple: true} to get an array of matches.\n     * Pass {from: element} for element-relative selectors \u2014 ignored by the\n     * kernel, used by the extended-selectors extension (closest, next, etc.).\n     *\n     * @param {string|Element|null} selector - What to resolve.\n     * @param {{multiple?: boolean, from?: Element}} [options] - Options.\n     * @returns {Element|Element[]|null} Resolved element(s), or null/[] if not found.\n     */\n    function find(selector, options) {\n        const multiple = options?.multiple\n        if (selector instanceof Element) return multiple ? [selector] : selector\n        if (!selector) return multiple ? [] : null\n        return multiple\n            ? [...document.querySelectorAll(selector)]\n            : document.querySelector(selector)\n    }\n\n    /**\n     * Read a raw attribute from an element.\n     * Core wraps this to add parsing and inheritance.\n     * @param {Element} element - Element to read from.\n     * @param {string} name - Attribute name.\n     * @param {Object} [options] - Ignored by kernel. Extensions that wrap attr\n     *   use this for parsing hints (e.g. inheritance control).\n     */\n    function attr(element, name, options) {\n        return element.getAttribute(name)\n    }\n\n    /**\n     * Wrap an api function with a decorator. The wrapper receives the original\n     * function as its first argument, followed by the caller's arguments.\n     * @param {string} name - Property name on api to wrap.\n     * @param {Function} wrapper - (original, ...args) => result\n     */\n    function wrap(name, wrapper) {\n        if (!api[name]) throw new HtmxError(`Cannot wrap \"${name}\" \u2014 not found on api`, {type: 'WRAP_TARGET_MISSING'})\n        const original = api[name]\n        api[name] = (...args) => wrapper(original, ...args)\n    }\n\n    // \u2500\u2500 Init & Cleanup \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    /**\n     * Initialize a subtree \u2014 discover hx-* elements and init each one.\n     *\n     * Default execute walks the subtree with a TreeWalker, calling initElement\n     * on any element with an hx-* attribute. Extensions can replace\n     * detail.walk.execute during htmx:before:walk:init for custom discovery.\n     *\n     * @param {Element} [root=document.body] - Subtree root to initialize.\n     */\n    function init(root = document.body) {\n        const detail = {element: root, walk: {execute: null}}\n\n        // Default execute: walk the subtree, initElement anything with hx-*\n        detail.walk.execute = () => {\n            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)\n            let node = root\n            while (node) {\n                const attrs = node.attributes\n                for (let i = 0; i < attrs.length; i++) {\n                    if (attrs[i].name.startsWith('hx-')) {\n                        api.initElement(node)\n                        break\n                    }\n                }\n                node = walker.nextNode()\n            }\n        }\n\n        if (canceled(api.emit(root, 'htmx:before:walk:init', detail))) return\n        detail.walk.execute()\n        api.emit(root, 'htmx:after:walk:init', {element: root})\n    }\n\n    /**\n     * Initialize a single element: set up state, let extensions configure the\n     * trigger, then wire it to the lifecycle.\n     *\n     * Sequence:\n     *   before:init \u2192 init.execute() \u2192 after:init\n     *   \xB7\xB7\xB7later, on trigger event\xB7\xB7\xB7\n     *   before:trigger \u2192 [extensions do work] \u2192 after:trigger\n     *\n     * detail.trigger.execute \u2014 what runs each time the trigger event fires.\n     *   Default: preventDefault + emit before:trigger / after:trigger.\n     *   Extensions do their work during before:trigger (read attrs JIT, call\n     *   api.ajax, send WebSocket message, etc.). Replaceable during before:init.\n     *\n     * detail.init.execute \u2014 what runs at init time.\n     *   Default: commit state + wire trigger listener. Replaceable during before:init.\n     *\n     * detail.trigger.eventName \u2014 which DOM event to listen for.\n     *   Set by smart-defaults or hx-trigger during before:init.\n     *   Null means \"don't wire a default listener\" \u2014 used by extensions that\n     *   handle their own wiring (multi-trigger) or connection (SSE, WebSockets).\n     *\n     * @param {Element} element\n     */\n    function initElement(element) {\n        if (state.elements.has(element)) return // already initialized\n\n        const detail = {\n            element,\n            trigger: {\n                eventName: null, // set by smart-defaults or hx-trigger\n                execute: null,   // per-fire: preventDefault + emit trigger events\n            },\n            init: {\n                execute: null,   // init-time: commit state + wire trigger\n            },\n        }\n\n        // Default trigger execute: emit lifecycle events, extensions do work during before:trigger\n        detail.trigger.execute = (event) => {\n            event?.preventDefault()\n            if (canceled(api.emit(element, 'htmx:before:trigger', {element, event}))) return\n            api.emit(element, 'htmx:after:trigger', {element, event})\n        }\n\n        // Default init execute: commit state + wire trigger\n        detail.init.execute = () => {\n            state.elements.set(element, {cleanup: []})\n            if (detail.trigger.eventName) {\n                api.on(element, detail.trigger.eventName, detail.trigger.execute)\n            }\n        }\n\n        if (canceled(api.emit(element, 'htmx:before:init', detail))) return\n        detail.init.execute()\n        api.emit(element, 'htmx:after:init', detail)\n    }\n\n    /**\n     * Clean up a subtree \u2014 tear down root and all stateful descendants.\n     *\n     * Default execute walks the subtree, calling cleanupElement on any\n     * element with state. Extensions can replace detail.walk.execute\n     * during htmx:before:walk:cleanup for custom discovery (e.g., shadow DOM).\n     *\n     * @param {Element} root - Subtree root to clean up.\n     */\n    function cleanup(root) {\n        const detail = {element: root, walk: {execute: null}}\n\n        // Default execute: cleanupElement on root + all stateful descendants\n        detail.walk.execute = () => {\n            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)\n            let node = root\n            while (node) {\n                if (state.elements.has(node)) api.cleanupElement(node)\n                node = walker.nextNode()\n            }\n        }\n\n        if (canceled(api.emit(root, 'htmx:before:walk:cleanup', detail))) return\n        detail.walk.execute()\n        api.emit(root, 'htmx:after:walk:cleanup', {element: root})\n    }\n\n    /**\n     * Tear down listeners and delete state for a single element.\n     *\n     * Follows the standard before:* \u2192 execute() \u2192 after:* pattern.\n     * Extensions can replace detail.cleanup.execute during before:cleanup\n     * (e.g., to add exit animations before teardown).\n     *\n     * @param {Element} element - The element to clean up.\n     */\n    function cleanupElement(element) {\n        if (!state.elements.has(element)) return\n\n        const detail = {element, cleanup: {execute: null}}\n\n        detail.cleanup.execute = () => {\n            for (const teardown of state.elements.get(element).cleanup) teardown()\n            state.elements.delete(element)\n        }\n\n        if (canceled(api.emit(element, 'htmx:before:cleanup', detail))) return\n        detail.cleanup.execute()\n        api.emit(element, 'htmx:after:cleanup', detail)\n    }\n\n    // \u2500\u2500 Swap \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    /**\n     * Swap content into the DOM.\n     *\n     * Takes a pipeline context (detail) \u2014 a shared object that flows through\n     * the entire pipeline for a given action. Each transport adds its own\n     * namespace; the kernel only reads `detail.element` and `detail.swap`:\n     *\n     *   HTTP:          {element, request, response, swap: {content, target, style}}\n     *   WebSocket:     {element, connection, message, swap: {content, target, style}}\n     *   Programmatic:  {element, swap: {content, target, style}}\n     *\n     * The kernel ignores transport-specific fields (request, response,\n     * connection, etc.) \u2014 they're pass-through context for extensions.\n     * A morph extension can read detail.response.headers during before:swap;\n     * a logging extension can read detail.connection. The kernel doesn't care.\n     *\n     * All preprocessing (target resolution string\u2192element, content parsing\n     * string\u2192fragment) happens inside execute, so extensions can modify\n     * detail.swap.target or detail.swap.content during before:swap and have\n     * their changes take effect.\n     *\n     * detail.swap.execute \u2014 the function that performs the DOM manipulation.\n     * Default: resolve target, parse content, dispatch on style. Replaceable\n     * during before:swap (e.g., for morphing).\n     *\n     * @param {Object} detail - Pipeline context. Kernel reads detail.element\n     *   and detail.swap.{content, target, style}. Everything else is pass-through.\n     */\n    function swap(detail) {\n        const emitOn = detail.element || document.body\n\n        detail.swap.execute = () => {\n            // Resolve target: string selector \u2192 element, fallback to triggering element\n            if (typeof detail.swap.target === 'string') {\n                detail.swap.target = api.find(detail.swap.target, {from: detail.element})\n            }\n            detail.swap.target ??= detail.element\n\n            if (!detail.swap.target) {\n                throw new HtmxError('Swap target not found', {type: 'SWAP_TARGET_MISSING'})\n            }\n\n            // Parse content: string \u2192 DocumentFragment\n            if (typeof detail.swap.content === 'string') {\n                const template = document.createElement('template')\n                template.innerHTML = detail.swap.content\n                detail.swap.content = template.content\n            }\n\n            // Dispatch on swap style\n            const target = detail.swap.target\n            const content = detail.swap.content\n            switch (detail.swap.style) {\n                case 'innerHTML':\n                    target.innerHTML = '';\n                    target.append(content);\n                    break\n                case 'outerHTML':\n                    target.replaceWith(content);\n                    break\n                case 'beforebegin':\n                    target.before(content);\n                    break\n                case 'afterbegin':\n                    target.prepend(content);\n                    break\n                case 'beforeend':\n                    target.append(content);\n                    break\n                case 'afterend':\n                    target.after(content);\n                    break\n                case 'delete':\n                    target.remove();\n                    break\n                case 'none':\n                    break\n                default:\n                    throw new HtmxError(`Unknown swap style \"${detail.swap.style}\"`, {type: 'SWAP_STYLE_UNKNOWN'})\n            }\n        }\n\n        if (canceled(api.emit(emitOn, 'htmx:before:swap', detail))) return\n        detail.swap.execute()\n        api.emit(emitOn, 'htmx:after:swap', detail)\n    }\n\n    // \u2500\u2500 API \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n    // Extensions receive this as the second argument in event handlers.\n    // They can wrap/replace functions here; internal code calls through api.\n\n    const api = {\n        config, register,\n        init, initElement, cleanup, cleanupElement,\n        swap, emit, on, attr, find,\n        state, wrap,\n    }\n\n    // \u2500\u2500 Extensions: Start \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n    // \u2500\u2500 Extensions: End \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    // \u2500\u2500 Boot \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n\n    /**\n     * Emit htmx:boot, init the document body, and observe DOM mutations\n     * (added nodes \u2192 init, removed nodes \u2192 cleanup).\n     */\n    function boot() {\n        state.booted = true\n        api.emit(document.body, 'htmx:boot')\n        api.init(document.body)\n\n        new MutationObserver(mutations => {\n            for (const mutation of mutations) {\n                for (const node of mutation.addedNodes) {\n                    if (node instanceof Element) api.init(node)\n                }\n                for (const node of mutation.removedNodes) {\n                    if (node instanceof Element) api.cleanup(node)\n                }\n            }\n        }).observe(document.body, {childList: true, subtree: true})\n    }\n\n    if (document.readyState === 'loading') {\n        document.addEventListener('DOMContentLoaded', boot)\n    } else {\n        queueMicrotask(boot)\n    }\n\n    // \u2500\u2500 Public API \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n    // Getters delegate to api so extension wraps take effect.\n\n    return {\n        version: '4.0.0',\n        config,\n        register,\n        get init() {\n            return api.init\n        },\n        get emit() {\n            return api.emit\n        },\n        get on() {\n            return api.on\n        },\n        get attr() {\n            return api.attr\n        },\n        get find() {\n            return api.find\n        },\n        get parse() {\n            return api.parse ?? (() => {\n                throw new HtmxError('No parser installed \u2014 include htmx.core.js or register a parse extension', {type: 'PARSER_MISSING'})\n            })\n        },\n        get ajax() {\n            return api.ajax ?? (() => {\n                throw new HtmxError('No ajax transport installed \u2014 include htmx.core.js or register an ajax extension', {type: 'AJAX_MISSING'})\n            })\n        },\n        swap(...args) {\n            return api.swap(...args)\n        },\n        state,\n    }\n})()\n", extensions: { core: { source: "// htmx 4.0 \u2014 Core Extensions\n//\n// Everything that makes hx-* attributes work, plus standard extensions.\n// Each behavior is a separate htmx.register() call \u2014 self-documenting,\n// individually replaceable. The assembler inlines them at emit sites.\n\n// \u2500\u2500 parse \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Install the RelaxedJSON parser and wrap attr to parse attribute values.\n// Must be first \u2014 everything downstream depends on api.parse and api.attr.\n\nhtmx.register('parse', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            const tokenPattern = /(?:\"([^\"]*)\"|'([^']*)'|([^\\s,:]+))(?:\\s*:\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s,]*)))?/g\n\n            function coerce(text) {\n                if (text === 'true') return true\n                if (text === 'false') return false\n                const duration = text.match(/^(\\d+)(ms|s|m)?$/)\n                if (duration) {\n                    const [, n, unit] = duration\n                    return unit === 's' ? n * 1000 : unit === 'm' ? n * 60000 : +n\n                }\n                return text\n            }\n\n            api.parse = function parse(text, options) {\n                if (!text) return null\n\n                const matches = [...text.trim().matchAll(tokenPattern)]\n                if (!matches.length) return null\n\n                const result = {}\n\n                for (let i = 0; i < matches.length; i++) {\n                    const m = matches[i]\n                    const key = m[1] ?? m[2] ?? m[3]\n                    const val = m[4] ?? m[5] ?? m[6]\n                    const hasVal = val !== undefined\n\n                    if (i === 0 && !hasVal) {\n                        result.value = key\n                    } else if (hasVal) {\n                        result[key] = coerce(val)\n                    } else {\n                        result[key] = true\n                    }\n                }\n\n                if (options?.as && result.value !== undefined) {\n                    result[options.as] = result.value\n                    delete result.value\n                }\n\n                return result\n            }\n\n            // Wrap attr to parse attribute values\n            api.wrap('attr', (original, element, name, options) => {\n                return api.parse(original(element, name), options)\n            })\n        }\n    }\n})\n\n// \u2500\u2500 http \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// HTTP transport. Installs api.ajax at boot. The kernel is transport-agnostic;\n// this extension adds the HTTP request/response/swap pipeline.\n\nhtmx.register('http', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            /**\n             * Issue an HTTP request and swap the response into the DOM.\n             *\n             * Builds a pipeline detail from options, then runs three phases:\n             *\n             * 1. **Request** \u2014 before:request \u2192 request.execute() (=fetch) \u2192 after:request\n             * 2. **Response** \u2014 before:response \u2192 response.execute() (=read body)\n             * 3. **Swap** \u2014 delegated to api.swap() (has its own before/execute/after)\n             *\n             * Extensions modify detail or replace execute during before:*.\n             *\n             * @param {Object} options - {element, request: {url, method, ...}, swap: {style, target}}\n             * @returns {Promise<void>}\n             */\n            api.ajax = async function ajax(options = {}) {\n                if (!options.request?.url) throw new HtmxError('Cannot issue request without a URL', {type: 'REQUEST_URL_MISSING'})\n                const element = options.element || document.body\n\n                const detail = {\n                    element,\n                    request: {...options.request, execute: null},\n                    swap: options.swap || null,\n                    response: null,\n                    error: null,\n                }\n\n                try {\n                    // \u2500\u2500 Request phase \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n                    detail.request.execute = async () => {\n                        const {url, execute, ...fetchOptions} = detail.request\n                        return await fetch(url, fetchOptions)\n                    }\n\n                    if (canceled(api.emit(element, 'htmx:before:request', detail))) return\n\n                    const response = await detail.request.execute()\n\n                    detail.response = {\n                        raw: response,\n                        status: response.status,\n                        ok: response.ok,\n                        url: response.url,\n                        headers: Object.fromEntries(response.headers),\n                        execute: null,\n                    }\n\n                    api.emit(element, 'htmx:after:request', detail)\n\n                    // \u2500\u2500 Response phase \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n                    detail.response.execute = async () => {\n                        detail.response.text = await detail.response.raw.text()\n                    }\n\n                    if (canceled(api.emit(element, 'htmx:before:response', detail))) return\n\n                    await detail.response.execute()\n\n                    // \u2500\u2500 Swap phase \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n                    if (detail.response.text != null) {\n                        detail.swap ??= {}\n                        detail.swap.content = detail.response.text\n                        api.swap(detail)\n                    }\n\n                    api.emit(element, 'htmx:done', detail)\n\n                } catch (error) {\n                    detail.error = error\n                    console.error(error)\n                    api.emit(element, 'htmx:error', detail)\n                } finally {\n                    api.emit(element, 'htmx:finally', detail)\n                }\n            }\n\n            // Make canceled() available to ajax internals\n            const canceled = (result) => result === false\n        }\n    }\n})\n\n// \u2500\u2500 public-api \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Ergonomic htmx.swap() and htmx.ajax() signatures that reshape flat\n// options into the pipeline detail format the kernel expects.\n\nhtmx.register('public-api', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            htmx.swap = (options) => {\n                const {element, content, target, style, ...modifiers} = options\n                return api.swap({\n                    element: element || null,\n                    swap: {content, target, style: style || null, ...modifiers},\n                })\n            }\n            htmx.ajax = (options) => {\n                const {element, url, method, headers, body, target, swap, ...requestModifiers} = options\n                const swapObj = typeof swap === 'string' ? {style: swap} : (swap || {})\n                return api.ajax({\n                    element: element || null,\n                    request: {url, method: method || 'GET', headers: headers || {}, body: body ?? null, ...requestModifiers},\n                    swap: {style: null, target: target || null, ...swapObj},\n                })\n            }\n        }\n    }\n})\n\n// \u2500\u2500 HTTP method attributes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Read hx-get/post/put/patch/delete at trigger time (JIT), call api.ajax()\n\nhtmx.register('hx-get', {\n    on: {\n        'htmx:before:trigger': (detail, api) => {\n            const val = api.attr(detail.element, 'hx-get', {as: 'url'})\n            if (val) api.ajax({element: detail.element, request: {url: val.url, method: 'GET'}})\n        }\n    }\n})\n\nhtmx.register('hx-post', {\n    on: {\n        'htmx:before:trigger': (detail, api) => {\n            const val = api.attr(detail.element, 'hx-post', {as: 'url'})\n            if (val) api.ajax({element: detail.element, request: {url: val.url, method: 'POST'}})\n        }\n    }\n})\n\nhtmx.register('hx-put', {\n    on: {\n        'htmx:before:trigger': (detail, api) => {\n            const val = api.attr(detail.element, 'hx-put', {as: 'url'})\n            if (val) api.ajax({element: detail.element, request: {url: val.url, method: 'PUT'}})\n        }\n    }\n})\n\nhtmx.register('hx-patch', {\n    on: {\n        'htmx:before:trigger': (detail, api) => {\n            const val = api.attr(detail.element, 'hx-patch', {as: 'url'})\n            if (val) api.ajax({element: detail.element, request: {url: val.url, method: 'PATCH'}})\n        }\n    }\n})\n\nhtmx.register('hx-delete', {\n    on: {\n        'htmx:before:trigger': (detail, api) => {\n            const val = api.attr(detail.element, 'hx-delete', {as: 'url'})\n            if (val) api.ajax({element: detail.element, request: {url: val.url, method: 'DELETE'}})\n        }\n    }\n})\n\n// \u2500\u2500 hx-swap \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Read swap style and modifiers from the attribute at swap time (JIT)\n\nhtmx.register('hx-swap', {\n    on: {\n        'htmx:before:swap': (detail, api) => {\n            const swapAttr = api.attr(detail.element, 'hx-swap', {as: 'style'})\n            if (swapAttr) Object.assign(detail.swap, swapAttr)\n        }\n    }\n})\n\n// \u2500\u2500 hx-target \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Read swap target selector from the attribute at swap time (JIT)\n\nhtmx.register('hx-target', {\n    on: {\n        'htmx:before:swap': (detail, api) => {\n            const targetAttr = api.attr(detail.element, 'hx-target', {as: 'selector'})\n            if (targetAttr) detail.swap.target = targetAttr.selector\n        }\n    }\n})\n\n// \u2500\u2500 smart-defaults \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Config values, default trigger assignment, default swap style, default headers\n\nhtmx.register('smart-defaults', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            api.config.defaultSwap ??= 'innerHTML'\n            api.config.defaultHeaders ??= {'HX-Request': 'true'}\n        },\n\n        'htmx:before:init': (detail, api) => {\n            // Default trigger based on element type\n            if (!detail.trigger.eventName) {\n                if (detail.element.matches('form')) detail.trigger.eventName = 'submit'\n                else if (detail.element.matches('input:not([type=button]), select, textarea')) detail.trigger.eventName = 'change'\n                else detail.trigger.eventName = 'click'\n            }\n        },\n\n        'htmx:before:swap': (detail, api) => {\n            detail.swap.style ??= api.config.defaultSwap\n        },\n\n        'htmx:before:request': (detail, api) => {\n            detail.request.headers = {...api.config.defaultHeaders, ...detail.request.headers}\n            detail.request.headers['HX-Current-URL'] ??= location.href\n        },\n    }\n})\n\n// \u2500\u2500 swap-aliases \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Friendly swap name mapping \u2192 insertAdjacentHTML position names\n\nhtmx.register('swap-aliases', {\n    on: {\n        'htmx:before:swap': (detail, api) => {\n            const aliases = {\n                before: 'beforebegin',\n                prepend: 'afterbegin',\n                append: 'beforeend',\n                after: 'afterend',\n                remove: 'delete',\n            }\n            if (detail.swap.style in aliases) detail.swap.style = aliases[detail.swap.style]\n        }\n    }\n})\n\n// \u2500\u2500 timeout \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Request timeout via AbortSignal\n\nhtmx.register('timeout', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            api.config.requestTimeout ??= 60000\n        },\n\n        'htmx:before:request': (detail, api) => {\n            const timeout = api.config.requestTimeout\n            if (timeout) {\n                const timeoutSignal = AbortSignal.timeout(timeout)\n                detail.request.signal = detail.request.signal\n                    ? AbortSignal.any([detail.request.signal, timeoutSignal])\n                    : timeoutSignal\n            }\n        },\n    }\n})\n\n// \u2500\u2500 hx-trigger \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Parse trigger attribute for multi-trigger, load, every, from\n\nhtmx.register('hx-trigger', {\n    on: {\n        'htmx:before:init': (detail, api) => {\n            const raw = detail.element.getAttribute('hx-trigger')\n            if (!raw) return\n\n            const triggers = raw.split(',').map(part => api.parse(part.trim(), {as: 'eventName'}))\n            const defaultEventName = detail.trigger.eventName\n            detail.trigger.eventName = null\n\n            const defaultExecute = detail.init.execute\n            detail.init.execute = () => {\n                defaultExecute()\n\n                const element = detail.element\n                const execute = detail.trigger.execute\n\n                for (const t of triggers) {\n                    const eventName = t.eventName || defaultEventName\n\n                    const options = {}\n                    if (t.delay !== undefined) options.delay = t.delay\n                    if (t.throttle !== undefined) options.throttle = t.throttle\n                    if (t.once) options.once = true\n\n                    // Special: load \u2014 fire immediately\n                    if (eventName === 'load') {\n                        queueMicrotask(() => execute())\n                        continue\n                    }\n\n                    // Special: every \u2014 fire on interval\n                    if (eventName === 'every') {\n                        let ms\n                        for (const [key, val] of Object.entries(t)) {\n                            if (val !== true) continue\n                            const m = key.match(/^(\\d+)(ms|s|m)?$/)\n                            if (m) {\n                                ms = m[2] === 's' ? m[1] * 1000 : m[2] === 'm' ? m[1] * 60000 : +m[1]\n                                break\n                            }\n                        }\n                        if (ms) {\n                            const id = setInterval(() => execute(), ms)\n                            api.state.get(element).cleanup.push(() => clearInterval(id))\n                        }\n                        continue\n                    }\n\n                    if (!eventName) continue\n\n                    // Resolve listen target (from modifier)\n                    if (t.from) {\n                        for (const target of api.find(t.from, {from: element, multiple: true})) {\n                            const off = api.on(target, eventName, execute, options)\n                            api.state.get(element).cleanup.push(off)\n                        }\n                    } else {\n                        api.on(element, eventName, execute, options)\n                    }\n                }\n            }\n        }\n    }\n})\n\n// \u2500\u2500 trigger-delay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Debounce handler when options.delay is set on api.on()\n\nhtmx.register('trigger-delay', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            api.wrap('on', (original, element, eventName, handler, options) => {\n                /**\n                 * [trigger-delay] Debounce: when `options.delay` is set, the handler\n                 * only fires once after the specified quiet period elapses.\n                 *\n                 * @param {number} [options.delay] - Debounce delay in ms.\n                 * @example on(el, 'click', handler, {delay: 500})\n                 */\n                if (options?.delay !== undefined) {\n                    const ms = options.delay\n                    let timeout\n                    const orig = handler\n                    handler = (event) => {\n                        clearTimeout(timeout)\n                        timeout = setTimeout(() => orig(event), ms)\n                    }\n                }\n                return original(element, eventName, handler, options)\n            })\n        }\n    }\n})\n\n// \u2500\u2500 trigger-throttle \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Throttle handler when options.throttle is set on api.on()\n\nhtmx.register('trigger-throttle', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            api.wrap('on', (original, element, eventName, handler, options) => {\n                /**\n                 * [trigger-throttle] Rate-limit: when `options.throttle` is set, the\n                 * handler fires at most once per the specified interval.\n                 *\n                 * @param {number} [options.throttle] - Minimum ms between invocations.\n                 * @example on(el, 'click', handler, {throttle: 200})\n                 */\n                if (options?.throttle !== undefined) {\n                    const ms = options.throttle\n                    let last = 0\n                    const orig = handler\n                    handler = (event) => {\n                        const now = Date.now()\n                        if (now - last >= ms) {\n                            last = now\n                            orig(event)\n                        }\n                    }\n                }\n                return original(element, eventName, handler, options)\n            })\n        }\n    }\n})\n\n// \u2500\u2500 extended-selectors \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Named targets (this, body, document, window), traversal (closest, next,\n// previous), and scoped search (find <sel>).\n// Uses options.from as the context element for relative selectors.\n\nhtmx.register('extended-selectors', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            function scanForward(element, selector) {\n                for (const candidate of (element.getRootNode() || document).querySelectorAll(selector)) {\n                    if (candidate.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) return candidate\n                }\n                return null\n            }\n\n            function scanBackward(element, selector) {\n                const all = (element.getRootNode() || document).querySelectorAll(selector)\n                for (let i = all.length - 1; i >= 0; i--) {\n                    if (all[i].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) return all[i]\n                }\n                return null\n            }\n\n            api.wrap('find', (original, selector, options) => {\n                /**\n                 * [extended-selectors] Named targets (`this`, `body`,\n                 * `document`, `window`), traversal (`closest`, `next`,\n                 * `previous`), and scoped search (`find <sel>`) when\n                 * `options.from` is set as context element.\n                 *\n                 * @param {string} selector - Extended selector syntax.\n                 * @returns {Element|Element[]|Window|Document|null}\n                 * @example find('closest .container', {from: el})\n                 * @example find('this', {from: el})\n                 * @example find('window')\n                 */\n                const el = options?.from\n                const multiple = options?.multiple\n                const match = (result) => multiple ? (result ? [result] : []) : result ?? null\n\n                if (typeof selector !== 'string') return original(selector, options)\n\n                // Named targets\n                if (selector === 'this') return match(el)\n                if (selector === 'body') return match(document.body)\n                if (selector === 'document') return multiple ? [document] : document\n                if (selector === 'window') return multiple ? [window] : window\n\n                if (!el) return original(selector, options)\n\n                // Immediate relatives (require context element)\n                if (selector === 'next') return match(el.nextElementSibling)\n                if (selector === 'previous') return match(el.previousElementSibling)\n                if (selector === 'host') return match(el.getRootNode()?.host)\n\n                // Traversal\n                if (selector.startsWith('closest ')) return match(el.closest(selector.slice(8)))\n                if (selector.startsWith('next ')) return match(scanForward(el, selector.slice(5)))\n                if (selector.startsWith('previous ')) return match(scanBackward(el, selector.slice(9)))\n\n                // Scoped search: search within the context element\n                if (selector.startsWith('find ')) {\n                    const sel = selector.slice(5)\n                    return multiple\n                        ? [...el.querySelectorAll(sel)]\n                        : el.querySelector(sel)\n                }\n\n                return original(selector, options)\n            })\n        }\n    }\n})\n\n// \u2500\u2500 inheritance \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Walk up the DOM for inherited attributes\n// hx-target:inherited, hx-target:append, hx-target:inherited:append\n\nhtmx.register('inheritance', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            api.config.inheritance ??= {}\n            api.config.inheritance.mode ??= 'explicit'\n            api.config.inheritance.inheritSuffix ??= 'inherited'\n            api.config.inheritance.appendSuffix ??= 'append'\n\n            api.wrap('attr', (original, element, name, options) => {\n                /**\n                 * [inheritance] Walk up the DOM for inherited attributes.\n                 * Supports `:inherited` and `:append` suffixes for explicit\n                 * inheritance chains. Set `options.inherit` to `false` to skip.\n                 *\n                 * @param {boolean} [options.inherit=true] - Set false to skip inheritance.\n                 * @example <div hx-target:inherited=\"#main\">\n                 */\n                if (options?.inherit === false) return original(element, name, options)\n\n                const {mode, inheritSuffix, appendSuffix} = api.config.inheritance\n                const inherited = `${name}:${inheritSuffix}`\n                const append = `${name}:${appendSuffix}`\n                const inheritedAppend = `${name}:${inheritSuffix}:${appendSuffix}`\n\n                // Direct attribute on element\n                if (element.hasAttribute(name)) return original(element, name, options)\n                if (element.hasAttribute(inherited)) {\n                    name = inherited\n                    return original(element, name, options)\n                }\n\n                // Build ancestor selector\n                const parts = [`[${CSS.escape(inherited)}]`, `[${CSS.escape(inheritedAppend)}]`]\n                if (mode === 'implicit') parts.unshift(`[${CSS.escape(name)}]`)\n                const selector = parts.join(',')\n\n                // Collect :append chain + base, walking up\n                const chain = []\n\n                const selfAppend = element.getAttribute(append)\n                    ?? element.getAttribute(inheritedAppend)\n                if (selfAppend !== null) chain.push(selfAppend)\n\n                let ancestor = element.parentElement?.closest(selector)\n                while (ancestor) {\n                    const base = ancestor.getAttribute(inherited)\n                        ?? (mode === 'implicit' ? ancestor.getAttribute(name) : null)\n                    if (base !== null) {\n                        chain.push(base)\n                        break\n                    }\n\n                    const ancestorAppend = ancestor.getAttribute(inheritedAppend)\n                    if (ancestorAppend !== null) {\n                        chain.push(ancestorAppend)\n                        ancestor = ancestor.parentElement?.closest(selector)\n                        continue\n                    }\n\n                    break\n                }\n\n                if (!chain.length) return null\n                return api.parse(chain.reverse().join(','), options)\n            })\n        }\n    }\n})\n\n// \u2500\u2500 parse-dot-path \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Expand dot-notation keys into nested objects\n// user.name:John \u2192 {user: {name: \"John\"}}\n\nhtmx.register('parse-dot-path', {\n    on: {\n        'htmx:boot': (detail, api) => {\n            api.wrap('parse', (original, text, options) => {\n                /**\n                 * [parse-dot-path] Expands dot-notation keys into nested\n                 * objects. `\"user.name:John\"` \u2192 `{user: {name: \"John\"}}`.\n                 *\n                 * @returns {Object|null} Parsed object with dot-paths expanded.\n                 */\n                const result = original(text, options)\n                if (!result) return result\n\n                const expanded = {}\n                for (const [k, v] of Object.entries(result)) {\n                    if (k.includes('.')) {\n                        const keys = k.split('.')\n                        keys.slice(0, -1).reduce((o, key) => o[key] ??= {}, expanded)[keys.at(-1)] = v\n                    } else {\n                        expanded[k] = v\n                    }\n                }\n                return expanded\n            })\n        }\n    }\n})\n\n// \u2500\u2500 hx-boost \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n// Convert <a> and <form> inside hx-boost containers into htmx requests\n\nhtmx.register('hx-boost', {\n    on: {\n        // After a subtree is init'd, find links/forms inside boosted containers\n        'htmx:after:walk:init': (detail, api) => {\n            const root = detail.element\n            const containers = [\n                ...(root.matches?.('[hx-boost]') ? [root] : []),\n                ...root.querySelectorAll('[hx-boost]')\n            ]\n            for (const container of containers) {\n                const boost = api.attr(container, 'hx-boost')\n                if (!boost || boost.value === 'false') continue\n                for (const el of container.querySelectorAll('a[href], form')) {\n                    api.initElement(el)\n                }\n            }\n        },\n\n        // At trigger time, if this is a boosted link/form, fire ajax\n        'htmx:before:trigger': (detail, api) => {\n            const el = detail.element\n            if (!el.matches('a[href], form')) return\n\n            const boosted = el.closest('[hx-boost]')\n            if (!boosted) return\n            const boost = api.attr(boosted, 'hx-boost')\n            if (!boost || boost.value === 'false') return\n\n            if (el.matches('a[href]')) {\n                api.ajax({element: el, request: {url: el.getAttribute('href'), method: 'GET'}})\n            } else {\n                api.ajax({\n                    element: el,\n                    request: {\n                        url: el.getAttribute('action') || '',\n                        method: (el.getAttribute('method') || 'GET').toUpperCase(),\n                    },\n                })\n            }\n        },\n    }\n})\n", names: ["parse", "http", "public-api", "hx-get", "hx-post", "hx-put", "hx-patch", "hx-delete", "hx-swap", "hx-target", "smart-defaults", "swap-aliases", "timeout", "hx-trigger", "trigger-delay", "trigger-throttle", "extended-selectors", "inheritance", "parse-dot-path", "hx-boost"] } }, standard: ["parse", "http", "public-api", "hx-get", "hx-post", "hx-put", "hx-patch", "hx-delete", "hx-swap", "hx-target", "smart-defaults", "swap-aliases", "timeout", "hx-trigger", "trigger-delay", "trigger-throttle", "extended-selectors", "inheritance", "parse-dot-path", "hx-boost"] };

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const match = path.match(/^\/(\d+\.\d+)\/(.+)$/);
    if (!match) {
      return new Response("htmx CDN\n\nUsage:\n  /4.0/htmx.js              standard build\n  /4.0/htmx.kernel.js       kernel only\n  /4.0/htmx.js?include=sse   standard + extras\n  /4.0/htmx.js?exclude=boost standard minus\n  /4.0/htmx.js?only=ajax     kernel + specific\n", {
        status: 200,
        headers: { "content-type": "text/plain" }
      });
    }
    const version = match[1];
    const file = match[2];
    if (version !== "4.0") {
      return new Response(`Unknown version: ${version}`, { status: 404 });
    }
    if (file === "htmx.kernel.js") {
      return respond(sources_default.kernel, "kernel-only");
    }
    if (file !== "htmx.js") {
      return new Response(`Not found: ${file}`, { status: 404 });
    }
    let extensionSources = [sources_default.extensions.core.source];
    let cacheKey = "standard";
    const include = url.searchParams.get("include");
    const exclude = url.searchParams.get("exclude");
    const only = url.searchParams.get("only");
    if (only) {
      const requested = only.split(",").map((s) => s.trim()).sort();
      const unknown = requested.filter((n) => !sources_default.standard.includes(n));
      if (unknown.length) {
        return new Response(`Unknown extensions: ${unknown.join(", ")}
Available: ${sources_default.standard.join(", ")}`, { status: 400 });
      }
      cacheKey = `only=${requested.join(",")}`;
    } else if (exclude) {
      cacheKey = `exclude=${exclude.split(",").map((s) => s.trim()).sort().join(",")}`;
    } else if (include) {
      cacheKey = `include=${include.split(",").map((s) => s.trim()).sort().join(",")}`;
    }
    try {
      const input = JSON.stringify({
        kernel: sources_default.kernel,
        extensions: extensionSources,
        optimize: false
      });
      const stdin = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(input));
          controller.close();
        }
      });
      const stdout = new TransformStream();
      const wasi = new WASI({
        args: ["htmx-wasi"],
        stdin,
        stdout: stdout.writable
      });
      const instance = new WebAssembly.Instance(assemblerWasm, {
        wasi_snapshot_preview1: wasi.wasiImport
      });
      ctx.waitUntil(
        wasi.start(instance).catch(() => {
        })
      );
      return new Response(stdout.readable, {
        headers: {
          "content-type": "application/javascript; charset=utf-8",
          "cache-control": "public, max-age=31536000, immutable",
          "x-htmx-version": sources_default.version,
          "x-htmx-build": cacheKey,
          "access-control-allow-origin": "*"
        }
      });
    } catch (e) {
      return new Response(`WASM error: ${e.message}
${e.stack}`, {
        status: 500,
        headers: { "content-type": "text/plain" }
      });
    }
  }
};
function respond(js, buildType) {
  return new Response(js, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
      "x-htmx-version": sources_default.version,
      "x-htmx-build": buildType,
      "access-control-allow-origin": "*"
    }
  });
}
__name(respond, "respond");

// ../../../../.npm-global/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../.npm-global/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-p05SIq/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../.npm-global/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-p05SIq/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
