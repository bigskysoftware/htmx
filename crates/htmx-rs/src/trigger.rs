//! Wiring `hx-trigger` to actual events. Fearless concurrency: every request fires and
//! they race. Fearlessly.

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use wasm_bindgen::prelude::*;
use web_sys::{Element, Event, EventTarget};

use crate::dom::{self, window};
use crate::parse::{self, TriggerKind, TriggerSpec};
use crate::request;

pub const VERBS: [&str; 5] = ["get", "post", "put", "patch", "delete"];

/// Sets up an element that has an `hx-<verb>` attribute. Safe to call more than once.
pub fn init(el: &Element) {
    if !dom::mark_processed(el) {
        return;
    }
    let Some(verb) = VERBS
        .iter()
        .find(|v| dom::attr(el, &format!("hx-{v}")).is_some())
    else {
        return;
    };
    let specs = match dom::attr(el, "hx-trigger") {
        Some(s) => parse::triggers(&s),
        None => vec![default_trigger(el)],
    };
    for spec in specs {
        attach(el, verb, spec);
    }
}

fn default_trigger(el: &Element) -> TriggerSpec {
    let tag = el.tag_name().to_ascii_uppercase();
    let ty = el
        .get_attribute("type")
        .unwrap_or_default()
        .to_ascii_lowercase();
    let name = match tag.as_str() {
        "FORM" => "submit",
        "INPUT" if matches!(ty.as_str(), "submit" | "button" | "reset" | "image") => "click",
        "INPUT" | "TEXTAREA" | "SELECT" => "change",
        _ => "click",
    };
    TriggerSpec::event(name)
}

/// Stop the browser doing its own thing (navigating, submitting) when htmx-rs is in charge.
fn should_cancel(evt: &Event, el: &Element) -> bool {
    let tag = el.tag_name().to_ascii_uppercase();
    match evt.type_().as_str() {
        "submit" => tag == "FORM",
        "click" => {
            let ty = el
                .get_attribute("type")
                .unwrap_or_default()
                .to_ascii_lowercase();
            let submitter = tag == "BUTTON" && ty != "button"
                || tag == "INPUT" && matches!(ty.as_str(), "submit" | "image");
            let link = tag == "A"
                && el
                    .get_attribute("href")
                    .is_some_and(|h| !h.starts_with('#'));
            link || submitter && el.closest("form").ok().flatten().is_some()
        }
        _ => false,
    }
}

fn fire(el: &Element, verb: &'static str, evt: Option<Event>) {
    wasm_bindgen_futures::spawn_local(request::issue(el.clone(), verb, evt));
}

fn later(ms: i32, f: impl FnOnce() + 'static) -> Option<i32> {
    let cb = Closure::once_into_js(f);
    window()
        .set_timeout_with_callback_and_timeout_and_arguments_0(cb.unchecked_ref(), ms)
        .ok()
}

#[derive(Default)]
struct ListenerState {
    fired: Cell<bool>,
    last_value: RefCell<Option<Option<String>>>,
    timer: Cell<Option<i32>>,
    last_fire: Cell<f64>,
}

fn attach(el: &Element, verb: &'static str, spec: TriggerSpec) {
    match spec.kind.clone() {
        TriggerKind::Load => {
            let el2 = el.clone();
            match spec.delay {
                Some(ms) => {
                    later(ms, move || fire(&el2, verb, None));
                }
                None => fire(el, verb, None),
            }
        }
        TriggerKind::Every(ms) => {
            let el2 = el.clone();
            let handle = Rc::new(Cell::new(0));
            let h2 = handle.clone();
            let tick = Closure::<dyn FnMut()>::new(move || {
                if !el2.is_connected() {
                    // The element left the page. Free the poller (the closure itself leaks;
                    // the borrow checker can't see into setInterval).
                    window().clear_interval_with_handle(h2.get());
                    return;
                }
                fire(&el2, verb, None);
            });
            if let Ok(id) = window().set_interval_with_callback_and_timeout_and_arguments_0(
                tick.as_ref().unchecked_ref(),
                ms,
            ) {
                handle.set(id);
            }
            tick.forget();
        }
        TriggerKind::Event(name) => {
            let source: EventTarget = match spec.from.as_deref() {
                None => el.clone().into(),
                Some("document") => dom::document().into(),
                Some("window") => window().into(),
                Some(other) => match dom::resolve(other, el) {
                    Some(e) => e.into(),
                    None => return,
                },
            };
            let own_event = spec.from.is_none();
            let state = Rc::new(ListenerState::default());
            let el2 = el.clone();
            let handler = Closure::<dyn FnMut(Event)>::new(move |evt: Event| {
                if own_event && should_cancel(&evt, &el2) {
                    evt.prevent_default();
                }
                if spec.once && state.fired.get() {
                    return;
                }
                if spec.changed {
                    let v = dom::value(&el2);
                    let mut last = state.last_value.borrow_mut();
                    if last.as_ref() == Some(&v) {
                        return;
                    }
                    *last = Some(v);
                }
                if let Some(ms) = spec.throttle {
                    let now = js_sys::Date::now();
                    if state.fired.get() && now - state.last_fire.get() < ms as f64 {
                        return;
                    }
                    state.last_fire.set(now);
                }
                state.fired.set(true);
                match spec.delay {
                    None => fire(&el2, verb, Some(evt)),
                    Some(ms) => {
                        if let Some(id) = state.timer.take() {
                            window().clear_timeout_with_handle(id);
                        }
                        let e = el2.clone();
                        state
                            .timer
                            .set(later(ms, move || fire(&e, verb, Some(evt))));
                    }
                }
            });
            let _ =
                source.add_event_listener_with_callback(&name, handler.as_ref().unchecked_ref());
            handler.forget();
        }
    }
}
