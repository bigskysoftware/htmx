//! # htmx-rs
//!
//! [htmx](https://htmx.org), rewritten in Rust. 🦀
//!
//! Blazingly fast. Memory safe. Fearlessly concurrent. Slightly larger.
//! Drop one `<script>` tag on the page and every `hx-*` attribute just works,
//! except the ones that don't (see the README).

mod dom;
mod parse;
mod request;
mod swap;
mod trigger;

use js_sys::Object;
use wasm_bindgen::prelude::*;
use web_sys::Element;

pub use parse::{
    duration_ms, swap_style, target_spec, triggers, SwapStyle, TargetSpec, TriggerKind, TriggerSpec,
};

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

const INDICATOR_CSS: &str = ".htmx-indicator{opacity:0}\
.htmx-request .htmx-indicator,.htmx-request.htmx-indicator{opacity:1;transition:opacity 200ms ease-in}";

#[wasm_bindgen(start)]
pub fn start() {
    let w = dom::window();
    let doc = dom::document();

    if js_sys::Reflect::has(&w, &"htmx".into()).unwrap_or(false) {
        web_sys::console::warn_1(
            &"htmx-rs: JavaScript htmx detected on this page. Rewriting it in Rust.".into(),
        );
    }
    install_global();

    if let (Ok(style), Some(head)) = (doc.create_element("style"), doc.head()) {
        style.set_text_content(Some(INDICATOR_CSS));
        let _ = head.append_child(&style);
    }

    if doc.ready_state() == "loading" {
        let go = Closure::once_into_js(|| {
            if let Some(body) = dom::document().body() {
                process(&body);
            }
        });
        let _ = doc.add_event_listener_with_callback("DOMContentLoaded", go.unchecked_ref());
    } else if let Some(body) = doc.body() {
        process(&body);
    }

    web_sys::console::info_1(
        &format!("htmx-rs {VERSION} 🦀 blazingly fast hypermedia, now memory safe").into(),
    );
}

/// Finds and wires up every `hx-*` element in `root` (including `root` itself).
pub fn process(root: &Element) {
    let selector = trigger::VERBS
        .iter()
        .flat_map(|v| [format!("[hx-{v}]"), format!("[data-hx-{v}]")])
        .collect::<Vec<_>>()
        .join(",");
    if root.matches(&selector).unwrap_or(false) {
        trigger::init(root);
    }
    for el in dom::query_all(root, &selector) {
        trigger::init(&el);
    }
}

/// Exposes `window.htmx` so existing code that pokes at it still finds something.
fn install_global() {
    let htmx = Object::new();
    dom::set(&htmx, "version", &JsValue::from_str(VERSION));
    dom::set(&htmx, "rewrittenInRust", &JsValue::TRUE);
    let process_fn = Closure::<dyn Fn(JsValue)>::new(|v: JsValue| {
        if let Ok(el) = v.dyn_into::<Element>() {
            process(&el);
        }
    });
    dom::set(&htmx, "process", process_fn.as_ref());
    process_fn.forget();
    dom::set(&dom::window(), "htmx", &htmx);
}
