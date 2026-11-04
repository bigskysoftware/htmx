//! Putting HTML into the page. The whole point of hypermedia.

use wasm_bindgen::{JsCast, JsValue};
use web_sys::{DocumentFragment, Element, HtmlTemplateElement, Node};

use crate::dom::document;
use crate::parse::SwapStyle;

/// Parses an HTML string into an inert fragment. `<script>` tags in it will not run.
/// This is a security feature. (It is not. We just didn't implement it.)
pub fn fragment(html: &str) -> Result<DocumentFragment, JsValue> {
    let t: HtmlTemplateElement = document().create_element("template")?.dyn_into()?;
    t.set_inner_html(html);
    Ok(t.content())
}

/// `hx-select`: keep only the part of the response matching `sel`.
pub fn select(html: &str, sel: &str) -> Result<String, JsValue> {
    Ok(fragment(html)?
        .query_selector(sel)?
        .map(|e| e.outer_html())
        .unwrap_or_default())
}

/// Swaps `html` into `target` and processes any new htmx-rs attributes it brought along.
pub fn swap(target: &Element, style: SwapStyle, html: &str) -> Result<(), JsValue> {
    match style {
        SwapStyle::None => return Ok(()),
        SwapStyle::Delete => {
            target.remove();
            return Ok(());
        }
        SwapStyle::TextContent => {
            target.set_text_content(Some(html));
            return Ok(());
        }
        _ => {}
    }

    let frag = fragment(html)?;
    let kids = frag.child_nodes();
    let new_nodes: Vec<Node> = (0..kids.length()).filter_map(|i| kids.item(i)).collect();
    let parent = || {
        target
            .parent_node()
            .ok_or_else(|| JsValue::from_str("htmx-rs: swap target has no parent"))
    };

    match style {
        SwapStyle::InnerHtml => {
            target.set_inner_html("");
            target.append_child(&frag)?;
        }
        SwapStyle::OuterHtml => {
            let p = parent()?;
            p.insert_before(&frag, Some(target.as_ref()))?;
            p.remove_child(target)?;
        }
        SwapStyle::BeforeBegin => {
            parent()?.insert_before(&frag, Some(target.as_ref()))?;
        }
        SwapStyle::AfterBegin => {
            target.insert_before(&frag, target.first_child().as_ref())?;
        }
        SwapStyle::BeforeEnd => {
            target.append_child(&frag)?;
        }
        SwapStyle::AfterEnd => {
            parent()?.insert_before(&frag, target.next_sibling().as_ref())?;
        }
        SwapStyle::None | SwapStyle::Delete | SwapStyle::TextContent => unreachable!(),
    }

    for node in new_nodes {
        if let Ok(el) = node.dyn_into::<Element>() {
            crate::process(&el);
        }
    }
    Ok(())
}
