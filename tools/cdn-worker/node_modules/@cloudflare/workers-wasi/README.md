# Workers WASI

### *Work in progress*

An experimental implementation of the WebAssembly System Interface designed to run on [Cloudflare Workers](https://workers.cloudflare.com)

## Usage

```typescript
import { WASI } from '@cloudflare/workers-wasi';
import mywasm from './mywasm.wasm';

const wasi = new WASI();
const instance = new WebAssembly.Instance(mywasm, {
   wasi_snapshot_preview1: wasi.wasiImport
});

await wasi.start(instance);
```
  
## Development
Install [Rust](https://www.rust-lang.org/tools/install) and [nvm](https://github.com/nvm-sh/nvm) then run
```
nvm use --lts
```
Build and test

```
git clone --recursive git@github.com:cloudflare/workers-wasi.git
cd ./workers-wasi
make -j test
```

## Build with Docker

```
git clone --recursive git@github.com:cloudflare/workers-wasi.git
cd ./workers-wasi
cat ./Dockerfile | docker build -t workers-wasi-build -
docker run --rm -it -v $(pwd):/workers-wasi workers-wasi-build
```

## Testing

We aim to be interchangeable with other WASI implementations.  Integration tests are run locally using [Miniflare](https://github.com/cloudflare/miniflare) against the following test suites:
- [x] `(52/52)` https://github.com/caspervonb/wasi-test-suite
- [ ] `(28/42)` https://github.com/bytecodealliance/wasmtime/tree/main/crates/test-programs/wasi-tests

## Notes

An ephemeral filesystem implementation built on [littlefs](https://github.com/littlefs-project/littlefs) is included.
Both soft and hard links are not yet supported.

The following syscalls are not yet supported and return `ENOSYS`
- `fd_readdir`
- `path_link`
- `path_readlink`
- `path_symlink`
- `poll_oneoff`
- `sock_recv`
- `sock_send`
- `sock_shutdown`

Timestamps are captured using `Date.now()` which has [unique behavior](https://developers.cloudflare.com/workers/runtime-apis/web-standards#javascript-standards) on the Workers platform for [security reasons](https://blog.cloudflare.com/mitigating-spectre-and-other-security-threats-the-cloudflare-workers-security-model/).  This affects the implementation of
- `clock_res_get`
- `clock_time_get`
- `fd_filestat_set_times`
- `path_filestat_set_times`

## TODO (remove)
Misc TODO:
- [ ] path_rename (update old path for existing open fds)
- [ ] fix preopens interface (use object), and update options docs
- [ ] document difference between nodejs options and ours (streams/fs)
- [ ] fd_close (stdio)
- [ ] fd_renumber (stdio)
- [ ] fd_read/fd_write does not work with renumbering stdio
- [ ] update file timestamps appropriately
