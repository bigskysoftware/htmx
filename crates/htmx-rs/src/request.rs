//! Issuing the AJAX request and handling the response.

use js_sys::{Array, Object, JSON};
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    Element, Event, FormData, Headers, HtmlFormElement, Request, RequestInit, Response, Url,
    UrlSearchParams,
};

use crate::dom::{self, attr, detail, dispatch, inherited, window};
use crate::parse::{swap_style, SwapStyle};
use crate::swap;

pub async fn issue(el: Element, verb: &'static str, _evt: Option<Event>) {
    if let Err(err) = issue_inner(&el, verb).await {
        web_sys::console::error_2(&"htmx-rs: request failed".into(), &err);
        dispatch(
            &el,
            "htmx:sendError",
            &detail(&[("elt", &el), ("error", &err)]),
        );
    }
}

async fn issue_inner(el: &Element, verb: &'static str) -> Result<(), JsValue> {
    let Some(path) = attr(el, &format!("hx-{verb}")) else {
        return Ok(());
    };

    if let Some((msg, _)) = inherited(el, "hx-confirm") {
        if !window().confirm_with_message(&msg)? {
            return Ok(());
        }
    }

    let target = match inherited(el, "hx-target") {
        Some((spec, owner)) => dom::resolve(&spec, &owner),
        None => Some(el.clone()),
    };
    let Some(target) = target else {
        dispatch(el, "htmx:targetError", &detail(&[("elt", el)]));
        return Ok(());
    };

    let info = detail(&[
        ("elt", el),
        ("target", &target),
        ("verb", &JsValue::from_str(verb)),
        ("path", &JsValue::from_str(&path)),
    ]);
    if !dispatch(el, "htmx:beforeRequest", &info) {
        return Ok(());
    }

    // Build the request.
    let params = collect_params(el, verb)?;
    let href = window().location().href()?;
    let url = Url::new_with_base(&path, &href)?;
    let init = RequestInit::new();
    init.set_method(&verb.to_ascii_uppercase());
    if verb == "get" || verb == "delete" {
        for (k, v) in &params {
            url.search_params().append(k, v);
        }
    } else {
        let body = UrlSearchParams::new()?;
        for (k, v) in &params {
            body.append(k, v);
        }
        init.set_body(&body.into());
    }
    let headers = Headers::new()?;
    headers.set("HX-Request", "true")?;
    headers.set("HX-Current-URL", &href)?;
    if !target.id().is_empty() {
        headers.set("HX-Target", &target.id())?;
    }
    if !el.id().is_empty() {
        headers.set("HX-Trigger", &el.id())?;
    }
    if let Some(name) = el.get_attribute("name") {
        headers.set("HX-Trigger-Name", &name)?;
    }
    init.set_headers(&headers);
    let request_url = url.href();
    let req = Request::new_with_str_and_init(&request_url, &init)?;

    // Send it, with indicators on.
    let indicators = match inherited(el, "hx-indicator") {
        Some((spec, owner)) => dom::resolve_all(&spec, &owner),
        None => vec![el.clone()],
    };
    for i in &indicators {
        let _ = i.class_list().add_1("htmx-request");
    }
    let result = fetch_text(&req).await;
    for i in &indicators {
        let _ = i.class_list().remove_1("htmx-request");
    }
    let (resp, text) = result?;

    // Handle it.
    let status = resp.status();
    let ok = (200..300).contains(&status);
    dom::set(&info, "status", &JsValue::from(status));
    dom::set(&info, "successful", &JsValue::from_bool(ok));
    dispatch(el, "htmx:afterRequest", &info);

    let h = resp.headers();
    if let Some(to) = h.get("HX-Redirect")? {
        return window().location().set_href(&to);
    }
    if h.get("HX-Refresh")?.as_deref() == Some("true") {
        return window().location().reload();
    }
    if let Some(events) = h.get("HX-Trigger")? {
        trigger_header(el, &events);
    }
    if !ok {
        dispatch(el, "htmx:responseError", &info);
        return Ok(());
    }
    if status == 204 {
        return Ok(());
    }

    let target = match h.get("HX-Retarget")? {
        Some(sel) => dom::document().query_selector(&sel)?.unwrap_or(target),
        None => target,
    };
    let style = match h.get("HX-Reswap")? {
        Some(s) => swap_style(&s),
        None => inherited(el, "hx-swap")
            .map(|(s, _)| swap_style(&s))
            .unwrap_or(SwapStyle::InnerHtml),
    };
    let html = match inherited(el, "hx-select") {
        Some((sel, _)) => swap::select(&text, &sel)?,
        None => text,
    };

    dom::set(&info, "target", &target);
    if !dispatch(el, "htmx:beforeSwap", &info) {
        return Ok(());
    }

    let push = h
        .get("HX-Push-Url")?
        .or_else(|| inherited(el, "hx-push-url").map(|(v, _)| v));
    match push.as_deref() {
        None | Some("false") => {}
        Some("true") => push_url(&request_url),
        Some(other) => push_url(other),
    }

    swap::swap(&target, style, &html)?;

    // Fire afterSwap somewhere that's still on the page.
    let on_page: Element = if el.is_connected() {
        el.clone()
    } else if target.is_connected() {
        target
    } else {
        dom::document()
            .body()
            .map(Element::from)
            .unwrap_or_else(|| el.clone())
    };
    dispatch(&on_page, "htmx:afterSwap", &info);
    dispatch(&on_page, "htmx:afterSettle", &info);
    Ok(())
}

async fn fetch_text(req: &Request) -> Result<(Response, String), JsValue> {
    let resp: Response = JsFuture::from(window().fetch_with_request(req))
        .await?
        .dyn_into()?;
    let text = JsFuture::from(resp.text()?)
        .await?
        .as_string()
        .unwrap_or_default();
    Ok((resp, text))
}

fn push_url(url: &str) {
    if let Ok(history) = window().history() {
        let _ = history.push_state_with_url(&JsValue::NULL, "", Some(url));
    }
}

/// `HX-Trigger: myEvent` or `HX-Trigger: {"myEvent": {"some": "detail"}}`.
fn trigger_header(el: &Element, value: &str) {
    let value = value.trim();
    if value.starts_with('{') {
        if let Ok(obj) = JSON::parse(value) {
            for entry in Object::entries(obj.unchecked_ref()).iter() {
                let pair: Array = entry.unchecked_into();
                if let Some(name) = pair.get(0).as_string() {
                    dispatch(el, &name, &pair.get(1));
                }
            }
        }
    } else {
        for name in value.split(',').map(str::trim).filter(|n| !n.is_empty()) {
            dispatch(el, name, &JsValue::NULL);
        }
    }
}

type Params = Vec<(String, String)>;

fn collect_params(el: &Element, verb: &str) -> Result<Params, JsValue> {
    let mut out = Params::new();
    if let Some(form) = el.dyn_ref::<HtmlFormElement>() {
        form_entries(form, &mut out)?;
    } else {
        // Non-GET requests from inside a form include the whole form, like htmx.
        let form = if verb == "get" {
            None
        } else {
            el.closest("form")?
                .and_then(|f| f.dyn_into::<HtmlFormElement>().ok())
        };
        match form {
            Some(f) => form_entries(&f, &mut out)?,
            None => input_entry(el, &mut out),
        }
    }
    if let Some((spec, owner)) = inherited(el, "hx-include") {
        for inc in dom::resolve_all(&spec, &owner) {
            if let Some(f) = inc.dyn_ref::<HtmlFormElement>() {
                form_entries(f, &mut out)?;
            } else {
                input_entry(&inc, &mut out);
                for child in dom::query_all(&inc, "input,select,textarea") {
                    input_entry(&child, &mut out);
                }
            }
        }
    }
    if let Some((vals, _)) = inherited(el, "hx-vals") {
        let obj = JSON::parse(&vals)?;
        for entry in Object::entries(obj.unchecked_ref()).iter() {
            let pair: Array = entry.unchecked_into();
            let (Some(k), v) = (pair.get(0).as_string(), pair.get(1)) else {
                continue;
            };
            let v = match v.as_string() {
                Some(s) => s,
                None => JSON::stringify(&v).map(String::from).unwrap_or_default(),
            };
            out.retain(|(name, _)| name != &k);
            out.push((k, v));
        }
    }
    Ok(out)
}

fn form_entries(form: &HtmlFormElement, out: &mut Params) -> Result<(), JsValue> {
    let fd = FormData::new_with_form(form)?;
    if let Some(iter) = js_sys::try_iter(&fd)? {
        for item in iter {
            let pair: Array = item?.dyn_into()?;
            // Files are skipped. Multipart uploads are on the roadmap, right after "1.0".
            if let (Some(k), Some(v)) = (pair.get(0).as_string(), pair.get(1).as_string()) {
                out.push((k, v));
            }
        }
    }
    Ok(())
}

fn input_entry(el: &Element, out: &mut Params) {
    let tag = el.tag_name().to_ascii_uppercase();
    if !matches!(tag.as_str(), "INPUT" | "SELECT" | "TEXTAREA") {
        return;
    }
    let Some(name) = el.get_attribute("name").filter(|n| !n.is_empty()) else {
        return;
    };
    let ty = el
        .get_attribute("type")
        .unwrap_or_default()
        .to_ascii_lowercase();
    if matches!(ty.as_str(), "checkbox" | "radio") && !dom::checked(el) {
        return;
    }
    if let Some(v) = dom::value(el) {
        out.push((name, v));
    }
}
