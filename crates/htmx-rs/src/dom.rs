//! Thin, safe wrappers over the DOM. Every one of these calls crosses into JavaScript.
//! We don't talk about it.

use js_sys::{Object, Reflect};
use wasm_bindgen::{JsCast, JsValue};
use web_sys::{CustomEvent, CustomEventInit, Document, Element, EventTarget, Window};

use crate::parse::{target_spec, TargetSpec};

pub fn window() -> Window {
    web_sys::window().expect("htmx-rs needs a window. Are you running hypermedia in a terminal?")
}

pub fn document() -> Document {
    window().document().expect("htmx-rs needs a document")
}

/// Reads `hx-foo`, falling back to `data-hx-foo`, like htmx does.
pub fn attr(el: &Element, name: &str) -> Option<String> {
    el.get_attribute(name)
        .or_else(|| el.get_attribute(&format!("data-{name}")))
}

/// Attribute inheritance: the nearest ancestor-or-self that declares `name`.
/// Returns the value and the element that owns it (relative targets resolve from there).
pub fn inherited(el: &Element, name: &str) -> Option<(String, Element)> {
    let owner = el
        .closest(&format!("[{name}],[data-{name}]"))
        .ok()
        .flatten()?;
    attr(&owner, name).map(|v| (v, owner))
}

const MARK: &str = "__htmxRs";

/// Marks an element as processed. Returns `false` if it already was.
pub fn mark_processed(el: &Element) -> bool {
    let key = JsValue::from_str(MARK);
    if Reflect::get(el, &key)
        .map(|v| v.is_truthy())
        .unwrap_or(false)
    {
        return false;
    }
    let _ = Reflect::set(el, &key, &JsValue::TRUE);
    true
}

/// Resolves an extended CSS selector (`this`, `closest x`, `find x`, `next`, ...) to one element.
pub fn resolve(spec: &str, base: &Element) -> Option<Element> {
    match target_spec(spec) {
        TargetSpec::This => Some(base.clone()),
        TargetSpec::Closest(s) => base.closest(s).ok().flatten(),
        TargetSpec::Find(s) => base.query_selector(s).ok().flatten(),
        TargetSpec::Next(s) => sibling(base, s, true),
        TargetSpec::Previous(s) => sibling(base, s, false),
        TargetSpec::Body => document().body().map(Element::from),
        TargetSpec::Global(s) => document().query_selector(s).ok().flatten(),
    }
}

/// Like [`resolve`], but a plain selector matches every element, not just the first.
pub fn resolve_all(spec: &str, base: &Element) -> Vec<Element> {
    match target_spec(spec) {
        TargetSpec::Global(s) => query_all(&document(), s),
        _ => resolve(spec, base).into_iter().collect(),
    }
}

pub fn query_all(root: &impl AsRef<web_sys::Node>, sel: &str) -> Vec<Element> {
    let node: &web_sys::Node = root.as_ref();
    let list = if let Some(el) = node.dyn_ref::<Element>() {
        el.query_selector_all(sel)
    } else if let Some(doc) = node.dyn_ref::<Document>() {
        doc.query_selector_all(sel)
    } else {
        return Vec::new();
    };
    let Ok(list) = list else { return Vec::new() };
    (0..list.length())
        .filter_map(|i| list.item(i))
        .filter_map(|n| n.dyn_into::<Element>().ok())
        .collect()
}

fn sibling(base: &Element, sel: Option<&str>, forward: bool) -> Option<Element> {
    let step = |e: &Element| {
        if forward {
            e.next_element_sibling()
        } else {
            e.previous_element_sibling()
        }
    };
    let mut cur = step(base);
    while let Some(el) = cur {
        match sel {
            None => return Some(el),
            Some(s) if el.matches(s).unwrap_or(false) => return Some(el),
            _ => cur = step(&el),
        }
    }
    None
}

/// `el.value` as a string, for inputs, selects and textareas.
pub fn value(el: &Element) -> Option<String> {
    Reflect::get(el, &JsValue::from_str("value"))
        .ok()?
        .as_string()
}

pub fn checked(el: &Element) -> bool {
    Reflect::get(el, &JsValue::from_str("checked"))
        .map(|v| v.is_truthy())
        .unwrap_or(false)
}

/// Dispatches a bubbling, cancelable `CustomEvent`. Returns `false` if someone called
/// `preventDefault()` on it.
pub fn dispatch(target: &EventTarget, name: &str, detail: &JsValue) -> bool {
    let init = CustomEventInit::new();
    init.set_bubbles(true);
    init.set_cancelable(true);
    init.set_detail(detail);
    match CustomEvent::new_with_event_init_dict(name, &init) {
        Ok(ev) => target.dispatch_event(&ev).unwrap_or(true),
        Err(_) => true,
    }
}

/// Builds an `event.detail` object.
pub fn detail(pairs: &[(&str, &JsValue)]) -> JsValue {
    let o = Object::new();
    for (k, v) in pairs {
        let _ = Reflect::set(&o, &JsValue::from_str(k), v);
    }
    o.into()
}

pub fn set(obj: &JsValue, key: &str, value: &JsValue) {
    let _ = Reflect::set(obj, &JsValue::from_str(key), value);
}
