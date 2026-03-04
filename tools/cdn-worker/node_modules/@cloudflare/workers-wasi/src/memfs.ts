// @ts-ignore
import wasm from './memfs.wasm'
import * as wasi from './snapshot_preview1'

/**
 * Used to initialize filesystem contents, currently used for testing with
 * existing WASI test suites
 * @internal
 *
 */
export interface _FS {
  [filename: string]: string
}

export class MemFS {
  exports: wasi.SnapshotPreview1

  #instance: WebAssembly.Instance
  #hostMemory?: WebAssembly.Memory

  constructor(preopens: Array<string>, fs: _FS) {
    this.#instance = new WebAssembly.Instance(wasm, {
      internal: {
        now_ms: () => Date.now(),
        trace: (isError: number, addr: number, size: number) => {
          const view = new Uint8Array(
            this.#getInternalView().buffer,
            addr,
            size
          )
          const s = new TextDecoder().decode(view)
          if (isError) {
            throw new Error(s)
          } else {
            console.info(s)
          }
        },
        copy_out: (srcAddr: number, dstAddr: number, size: number) => {
          const dst = new Uint8Array(this.#hostMemory!.buffer, dstAddr, size)
          const src = new Uint8Array(
            this.#getInternalView().buffer,
            srcAddr,
            size
          )
          dst.set(src)
        },
        copy_in: (srcAddr: number, dstAddr: number, size: number) => {
          const src = new Uint8Array(this.#hostMemory!.buffer, srcAddr, size)
          const dst = new Uint8Array(
            this.#getInternalView().buffer,
            dstAddr,
            size
          )
          dst.set(src)
        },
      },
      wasi_snapshot_preview1: {
        proc_exit: (_: number) => {},
        fd_seek: (): number => wasi.Result.ENOSYS,
        fd_write: (): number => wasi.Result.ENOSYS,
        fd_close: (): number => wasi.Result.ENOSYS,
      },
    })
    this.exports = this.#instance.exports as unknown as wasi.SnapshotPreview1

    const start = this.#instance.exports._start as Function
    start()

    const data = new TextEncoder().encode(JSON.stringify({ preopens, fs }))

    const initialize_internal = this.#instance.exports
      .initialize_internal as Function
    initialize_internal(this.#copyFrom(data), data.byteLength)
  }

  initialize(hostMemory: WebAssembly.Memory) {
    this.#hostMemory = hostMemory
  }

  #getInternalView(): DataView {
    const memory = this.#instance.exports.memory as WebAssembly.Memory
    return new DataView(memory.buffer)
  }

  #copyFrom(src: Uint8Array): number {
    const dstAddr = (this.#instance.exports.allocate as Function)(
      src.byteLength
    )
    new Uint8Array(this.#getInternalView().buffer, dstAddr, src.byteLength).set(
      src
    )
    return dstAddr
  }
}
