export { traceImportsToConsole } from './helpers'
import * as wasi from './snapshot_preview1'
import { MemFS, _FS } from './memfs'
// @ts-ignore
import { Asyncify } from '../deps/asyncify/asyncify.mjs'
import {
  FileDescriptor,
  fromReadableStream,
  fromWritableStream,
} from './streams'

export type Environment = { [key: string]: string }

/**
 * ProcessExit is thrown when `proc_exit` is called
 * @public
 */
export class ProcessExit extends Error {
  /**
   * The exit code passed to `proc_exit`
   */
  code: number

  constructor(code: number) {
    super(`proc_exit=${code}`)
    this.code = code

    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ProcessExit.prototype)
  }
}

/**
 * Options to configure the {@link WASI} interface
 *
 * @public
 */
export interface WASIOptions {
  /**
   * Command-line arguments
   *
   * @defaultValue `[]`
   *
   */
  args?: string[]
  /**
   * Environment variables
   *
   * @defaultValue `{}`
   *
   */
  env?: Environment

  /**
   * By default WASI applications that call `proc_exit` will throw a {@link ProcessExit} exception, setting this option to true will cause {@link WASI.start} to return the the exit code instead.
   *
   * @defaultValue `false`
   *
   */
  returnOnExit?: boolean

  /**
   * A list of directories that will be accessible in the WebAssembly application's sandbox.
   *
   * @defaultValue `[]`
   *
   */
  preopens?: string[]

  /**
   * Input stream that the application will be able to read from via stdin
   */
  stdin?: ReadableStream

  /**
   * Output stream that the application will be able to write to via stdin
   */
  stdout?: WritableStream

  /**
   * Output stream that the application will be able to write to via stderr
   */
  stderr?: WritableStream

  /**
   * Enable async IO for stdio streams, requires the application is built with {@link asyncify|https://web.dev/asyncify/}
   *
   * @experimental
   * @defaultValue `false`
   *
   */
  streamStdio?: boolean

  /**
   * Initial filesystem contents, currently used for testing with
   * existing WASI test suites
   * @internal
   *
   */
  fs?: _FS
}

/**
 * @public
 */
export class WASI {
  #args: Array<string>
  #env: Array<string>
  #memory?: WebAssembly.Memory
  #preopens: Array<string>
  #returnOnExit: boolean
  #streams: Array<FileDescriptor>

  #memfs: MemFS
  #state: any = new Asyncify()
  #asyncify: boolean

  constructor(options?: WASIOptions) {
    this.#args = options?.args ?? []
    const env = options?.env ?? {}
    this.#env = Object.keys(env).map((key) => {
      return `${key}=${env[key]}`
    })

    this.#returnOnExit = options?.returnOnExit ?? false
    this.#preopens = options?.preopens ?? []

    this.#asyncify = options?.streamStdio ?? false
    this.#streams = [
      fromReadableStream(options?.stdin, this.#asyncify),
      fromWritableStream(options?.stdout, this.#asyncify),
      fromWritableStream(options?.stderr, this.#asyncify),
    ]
    this.#memfs = new MemFS(this.#preopens, options?.fs ?? {})
  }

  /**
   * See {@link https://nodejs.org/api/wasi.html}
   *
   *  @throws {@link ProcessExit}
   *
   *  This exception is thrown if {@link WASIOptions.returnOnExit} is set to `false`
   *  and `proc_exit` is called
   *
   */
  async start(instance: WebAssembly.Instance): Promise<number | undefined> {
    this.#memory = instance.exports.memory as WebAssembly.Memory
    this.#memfs.initialize(this.#memory)

    try {
      if (this.#asyncify) {
        if (!instance.exports.asyncify_get_state) {
          throw new Error(
            "streamStdio is requested but the module is missing 'Asyncify' exports, see https://github.com/GoogleChromeLabs/asyncify"
          )
        }

        this.#state.init(instance)
      }

      await Promise.all(this.#streams.map((s) => s.preRun()))
      if (this.#asyncify) {
        await this.#state.exports._start()
      } else {
        const entrypoint = instance.exports._start as Function
        entrypoint()
      }
    } catch (e) {
      if (!this.#returnOnExit) {
        throw e
      }

      if ((e as Error).message === 'unreachable') {
        return 134
      } else if (e instanceof ProcessExit) {
        return e.code
      } else {
        throw e
      }
    } finally {
      // We must call close to avoid early termination due to hanging promise
      await Promise.all(this.#streams.map((s) => s.close()))
      await Promise.all(this.#streams.map((s) => s.postRun()))
    }
    return undefined
  }

  get wasiImport(): Record<string, Function> {
    const wrap = (f: any, self: any = this) => {
      const bound = f.bind(self)
      if (this.#asyncify) {
        return this.#state.wrapImportFn(bound)
      }
      return bound
    }

    return {
      args_get: wrap(this.#args_get),
      args_sizes_get: wrap(this.#args_sizes_get),
      clock_res_get: wrap(this.#clock_res_get),
      clock_time_get: wrap(this.#clock_time_get),
      environ_get: wrap(this.#environ_get),
      environ_sizes_get: wrap(this.#environ_sizes_get),
      fd_advise: wrap(this.#memfs.exports.fd_advise),
      fd_allocate: wrap(this.#memfs.exports.fd_allocate),
      fd_close: wrap(this.#memfs.exports.fd_close),
      fd_datasync: wrap(this.#memfs.exports.fd_datasync),
      fd_fdstat_get: wrap(this.#memfs.exports.fd_fdstat_get),
      fd_fdstat_set_flags: wrap(this.#memfs.exports.fd_fdstat_set_flags),
      fd_fdstat_set_rights: wrap(this.#memfs.exports.fd_fdstat_set_rights),
      fd_filestat_get: wrap(this.#memfs.exports.fd_filestat_get),
      fd_filestat_set_size: wrap(this.#memfs.exports.fd_filestat_set_size),
      fd_filestat_set_times: wrap(this.#memfs.exports.fd_filestat_set_times),
      fd_pread: wrap(this.#memfs.exports.fd_pread),
      fd_prestat_dir_name: wrap(this.#memfs.exports.fd_prestat_dir_name),
      fd_prestat_get: wrap(this.#memfs.exports.fd_prestat_get),
      fd_pwrite: wrap(this.#memfs.exports.fd_pwrite),
      fd_read: wrap(this.#fd_read),
      fd_readdir: wrap(this.#memfs.exports.fd_readdir),
      fd_renumber: wrap(this.#memfs.exports.fd_renumber),
      fd_seek: wrap(this.#memfs.exports.fd_seek),
      fd_sync: wrap(this.#memfs.exports.fd_sync),
      fd_tell: wrap(this.#memfs.exports.fd_tell),
      fd_write: wrap(this.#fd_write),
      path_create_directory: wrap(this.#memfs.exports.path_create_directory),
      path_filestat_get: wrap(this.#memfs.exports.path_filestat_get),
      path_filestat_set_times: wrap(
        this.#memfs.exports.path_filestat_set_times
      ),
      path_link: wrap(this.#memfs.exports.path_link),
      path_open: wrap(this.#memfs.exports.path_open),
      path_readlink: wrap(this.#memfs.exports.path_readlink),
      path_remove_directory: wrap(this.#memfs.exports.path_remove_directory),
      path_rename: wrap(this.#memfs.exports.path_rename),
      path_symlink: wrap(this.#memfs.exports.path_symlink),
      path_unlink_file: wrap(this.#memfs.exports.path_unlink_file),
      poll_oneoff: wrap(this.#poll_oneoff),
      proc_exit: wrap(this.#proc_exit),
      proc_raise: wrap(this.#proc_raise),
      random_get: wrap(this.#random_get),
      sched_yield: wrap(this.#sched_yield),
      sock_recv: wrap(this.#sock_recv),
      sock_send: wrap(this.#sock_send),
      sock_shutdown: wrap(this.#sock_shutdown),
    }
  }

  #view(): DataView {
    if (!this.#memory) {
      throw new Error('this.memory not set')
    }
    return new DataView(this.#memory.buffer)
  }

  #fillValues(
    values: Array<string>,
    iter_ptr_ptr: number,
    buf_ptr: number
  ): number {
    const encoder = new TextEncoder()
    const buffer = new Uint8Array(this.#memory!.buffer)

    const view = this.#view()
    for (const value of values) {
      view.setUint32(iter_ptr_ptr, buf_ptr, true)
      iter_ptr_ptr += 4

      const data = encoder.encode(`${value}\0`)
      buffer.set(data, buf_ptr)
      buf_ptr += data.length
    }

    return wasi.Result.SUCCESS
  }

  #fillSizes(
    values: Array<string>,
    count_ptr: number,
    buffer_size_ptr: number
  ): number {
    const view = this.#view()
    const encoder = new TextEncoder()
    const len = values.reduce((acc, value) => {
      return acc + encoder.encode(`${value}\0`).length
    }, 0)

    view.setUint32(count_ptr, values.length, true)
    view.setUint32(buffer_size_ptr, len, true)
    return wasi.Result.SUCCESS
  }

  #args_get(argv_ptr_ptr: number, argv_buf_ptr: number): number {
    return this.#fillValues(this.#args, argv_ptr_ptr, argv_buf_ptr)
  }

  #args_sizes_get(argc_ptr: number, argv_buf_size_ptr: number): number {
    return this.#fillSizes(this.#args, argc_ptr, argv_buf_size_ptr)
  }

  #clock_res_get(id: number, retptr0: number): number {
    switch (id) {
      case wasi.Clock.REALTIME:
      case wasi.Clock.MONOTONIC:
      case wasi.Clock.PROCESS_CPUTIME_ID:
      case wasi.Clock.THREAD_CPUTIME_ID: {
        const view = this.#view()
        view.setBigUint64(retptr0, BigInt(1e6), true)
        return wasi.Result.SUCCESS
      }
    }
    return wasi.Result.EINVAL
  }

  #clock_time_get(id: number, precision: bigint, retptr0: number): number {
    switch (id) {
      case wasi.Clock.REALTIME:
      case wasi.Clock.MONOTONIC:
      case wasi.Clock.PROCESS_CPUTIME_ID:
      case wasi.Clock.THREAD_CPUTIME_ID: {
        const view = this.#view()
        view.setBigUint64(retptr0, BigInt(Date.now()) * BigInt(1e6), true)
        return wasi.Result.SUCCESS
      }
    }
    return wasi.Result.EINVAL
  }

  #environ_get(env_ptr_ptr: number, env_buf_ptr: number): number {
    return this.#fillValues(this.#env, env_ptr_ptr, env_buf_ptr)
  }

  #environ_sizes_get(env_ptr: number, env_buf_size_ptr: number): number {
    return this.#fillSizes(this.#env, env_ptr, env_buf_size_ptr)
  }

  #fd_read(
    fd: number,
    iovs_ptr: number,
    iovs_len: number,
    retptr0: number
  ): Promise<number> | number {
    if (fd < 3) {
      const desc = this.#streams[fd]
      const view = this.#view()
      const iovs = wasi.iovViews(view, iovs_ptr, iovs_len)
      const result = desc.readv(iovs)
      if (typeof result === 'number') {
        view.setUint32(retptr0, result, true)
        return wasi.Result.SUCCESS
      }
      const promise = result as Promise<number>
      return promise.then((read: number) => {
        view.setUint32(retptr0, read, true)
        return wasi.Result.SUCCESS
      })
    }
    return this.#memfs.exports.fd_read(fd, iovs_ptr, iovs_len, retptr0)
  }

  #fd_write(
    fd: number,
    ciovs_ptr: number,
    ciovs_len: number,
    retptr0: number
  ): Promise<number> | number {
    if (fd < 3) {
      const desc = this.#streams[fd]
      const view = this.#view()
      const iovs = wasi.iovViews(view, ciovs_ptr, ciovs_len)
      const result = desc.writev(iovs)
      if (typeof result === 'number') {
        view.setUint32(retptr0, result, true)
        return wasi.Result.SUCCESS
      }
      let promise = result as Promise<number>
      return promise.then((written: number) => {
        view.setUint32(retptr0, written, true)
        return wasi.Result.SUCCESS
      })
    }
    return this.#memfs.exports.fd_write(fd, ciovs_ptr, ciovs_len, retptr0)
  }

  #poll_oneoff(
    in_ptr: number,
    out_ptr: number,
    nsubscriptions: number,
    retptr0: number
  ): number {
    return wasi.Result.ENOSYS
  }

  #proc_exit(code: number) {
    throw new ProcessExit(code)
  }

  #proc_raise(signal: number): number {
    return wasi.Result.ENOSYS
  }

  #random_get(buffer_ptr: number, buffer_len: number): number {
    const buffer = new Uint8Array(this.#memory!.buffer, buffer_ptr, buffer_len)
    crypto.getRandomValues(buffer)
    return wasi.Result.SUCCESS
  }

  #sched_yield(): number {
    return wasi.Result.SUCCESS
  }

  #sock_recv(
    fd: number,
    ri_data_ptr: number,
    ri_data_len: number,
    ri_flags: number,
    retptr0: number,
    retptr1: number
  ): number {
    return wasi.Result.ENOSYS
  }

  #sock_send(
    fd: number,
    si_data_ptr: number,
    si_data_len: number,
    si_flags: number,
    retptr0: number
  ): number {
    return wasi.Result.ENOSYS
  }

  #sock_shutdown(fd: number, how: number): number {
    return wasi.Result.ENOSYS
  }
}

export type { _FS }
