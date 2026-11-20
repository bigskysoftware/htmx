//! htmx, rewritten in Rust and WebAssembly.
//!
//! Status: 1 of approximately 4,000 functions ported.

use wasm_bindgen::prelude::*;

/// Ported from `htmx.js`. 0 percent faster, but now it is safe.
#[wasm_bindgen]
pub fn process(elt: &web_sys::Element) -> Result<(), JsValue> {
    // TODO: port the rest of htmx
    let _ = elt;
    unimplemented!("hypermedia is not yet memory safe")
}

/// The JavaScript version was 16kb. This one is 2.4mb before `wasm-opt`.
#[wasm_bindgen(start)]
pub fn main() {
    web_sys::console::log_1(&"htmx (rust edition) loaded. please stand by.".into());
}
