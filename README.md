# htmx-rs 🦀

*high compile times for HTML*

## introduction

htmx-rs gives you access to AJAX and HTML swapping directly in HTML, using
[attributes](#supported), exactly like htmx does, except it's written in Rust.

htmx-rs is not small. It is several times bigger than htmx. It depends on
`wasm-bindgen`, `web-sys`, `js-sys`, and the JavaScript it set out to replace.
It is extensible, if you know Rust, lifetimes, and how to read a wasm-bindgen error.

## motivation

* Why should only JavaScript be able to call JavaScript?
* Why should a 14 KB script tag be enough, when it could be bigger?
* Why should there be no build step?
* Why should anyone be able to read the source in their browser's dev tools?

By removing these arbitrary constraints, htmx-rs completes Rust as a JavaScript delivery mechanism.

## performance

Rust is historically faster than JavaScript. This is not history.

Rust compiled to WebAssembly can't touch the DOM, so every `querySelector`, every
`fetch`, and every `innerHTML` crosses from Wasm into JavaScript and back. htmx-rs
does exactly what htmx does, plus a border crossing, plus downloading and
instantiating a WebAssembly module before it can do anything at all.

It is, however, blazingly fast to say.

## quick start

```html
<script src="https://cdn.jsdelivr.net/npm/htmx-rs@0.1.0"></script>
<!-- have a button POST a click via AJAX, in Rust (via JavaScript) -->
<button hx-post="/clicked" hx-swap="outerHTML">
  Click Me
</button>
```

The `hx-post` and `hx-swap` attributes tell htmx-rs:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace
> the entire button with the response, after first spinning up a WebAssembly runtime."

### installing

1. Install [rustup](https://rustup.rs).
2. `rustup target add wasm32-unknown-unknown`
3. `cargo xtask dist`
4. Wait.

Or use the script tag above, which is also what we'd recommend for htmx, which you should use instead.

## supported

| Attribute | Notes |
| --- | --- |
| `hx-get` `hx-post` `hx-put` `hx-patch` `hx-delete` | GET/DELETE send params in the query string, the rest form-encoded |
| `hx-target` | CSS selector, `this`, `closest x`, `find x`, `next [x]`, `previous [x]`, `body` |
| `hx-swap` | `innerHTML` `outerHTML` `textContent` `beforebegin` `afterbegin` `beforeend` `afterend` `delete` `none` |
| `hx-trigger` | Any event, `load`, `every 2s`, with `once` `changed` `delay:` `throttle:` `from:` |
| `hx-select` | Pick part of the response |
| `hx-include` `hx-vals` | Extra params (`hx-vals` takes JSON) |
| `hx-confirm` | `window.confirm`, lovingly called from Rust |
| `hx-indicator` | Adds `htmx-request` during requests; `.htmx-indicator` CSS is injected |
| `hx-push-url` | `history.pushState` |
| `data-hx-*` | Every attribute also works with a `data-` prefix |

Attribute inheritance works, and swapped-in content is processed automatically.
Request headers: `HX-Request`, `HX-Current-URL`, `HX-Target`, `HX-Trigger`, `HX-Trigger-Name`.
Response headers: `HX-Redirect`, `HX-Refresh`, `HX-Trigger`, `HX-Retarget`, `HX-Reswap`, `HX-Push-Url`.
Events: `htmx:beforeRequest`, `htmx:afterRequest`, `htmx:beforeSwap`, `htmx:afterSwap`,
`htmx:afterSettle`, `htmx:responseError`, `htmx:sendError`, `htmx:targetError`.
`window.htmx` exists, with `htmx.process(elt)`, `htmx.version`, and `htmx.rewrittenInRust === true`.

### not supported

* **`hx-on`** runs JavaScript. We have principles.
* **Event filters** (`click[ctrlKey]`) are also JavaScript. Also principles.
* **`<script>` tags in responses** don't execute. This is a security feature. (It is not. We just didn't implement it.)
* **`hx-boost`, `hx-swap-oob`, history restore, extensions, file uploads, request queueing**:
  on the roadmap, right after 1.0, which is right after we win our argument with the borrow checker.

## benchmarks

| | htmx | htmx-rs |
| --- | --- | --- |
| Size, gzipped | ~14 KB | Bigger. The exact number is computed at build time and shown on the demo page, because we couldn't bear to write it down |
| Build step | None | `rustup`, `cargo`, `wasm-bindgen` |
| Language | JavaScript | Rust (plus the JavaScript we don't talk about) |
| Faster | Yes | No |
| Memory safe | It's JavaScript, it's fine | Guaranteed\* |
| Can say "blazingly fast" | No | Yes |

<sub>\* Within the WebAssembly sandbox, which is managed by a browser engine written in C++.</sub>

## website & docs

* the demo: wherever GitHub Pages put it
* the real thing: <https://htmx.org>, which you should use

## contributing

### hacking guide

```sh
cargo build          # go make coffee
cargo test           # the parser is unit tested, which is more than most JavaScript can say
cargo xtask serve    # demo at http://localhost:8080
```

`cargo xtask dist` writes `dist/htmx-rs.js` with the WebAssembly base64-inlined, so it's one file
with nothing else to host. The build tool is also written in Rust. Of course it is.

### deploying

The GitHub Actions workflow tests, builds, and deploys the demo plus `htmx-rs.js` to GitHub Pages on
every push to the default branch (one-time setup: *Settings → Pages → Source: GitHub Actions*). Pushing a tag
like `v0.1.0` attaches the bundle to a GitHub Release and, if an `NPM_TOKEN` secret is set,
publishes to npm, which puts it on jsDelivr and unpkg automatically.

## license

[0BSD](LICENSE), same as htmx. An unofficial, affectionate parody, not affiliated with htmx or Big Sky Software.

## haiku

*javascript fatigue:*<br/>
*so we wrote it all in Rust.*<br/>
*javascript fatigue.*
