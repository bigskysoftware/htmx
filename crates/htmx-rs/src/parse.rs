//! Pure, DOM-free parsing of htmx attribute syntax.
//! Fully unit tested, which is more than can be said for most JavaScript.

/// Where `hx-target` (or `hx-indicator`, `hx-include`, `from:`) points.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TargetSpec<'a> {
    This,
    Closest(&'a str),
    Find(&'a str),
    Next(Option<&'a str>),
    Previous(Option<&'a str>),
    Body,
    Global(&'a str),
}

pub fn target_spec(spec: &str) -> TargetSpec<'_> {
    let s = spec.trim();
    match s {
        "this" => return TargetSpec::This,
        "body" | "document" => return TargetSpec::Body,
        "next" => return TargetSpec::Next(None),
        "previous" => return TargetSpec::Previous(None),
        _ => {}
    }
    if let Some(r) = s.strip_prefix("closest ") {
        TargetSpec::Closest(r.trim())
    } else if let Some(r) = s.strip_prefix("find ") {
        TargetSpec::Find(r.trim())
    } else if let Some(r) = s.strip_prefix("next ") {
        TargetSpec::Next(Some(r.trim()))
    } else if let Some(r) = s.strip_prefix("previous ") {
        TargetSpec::Previous(Some(r.trim()))
    } else {
        TargetSpec::Global(s)
    }
}

/// `hx-swap` styles.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SwapStyle {
    InnerHtml,
    OuterHtml,
    TextContent,
    BeforeBegin,
    AfterBegin,
    BeforeEnd,
    AfterEnd,
    Delete,
    None,
}

/// Parses `hx-swap`. Modifiers after the style (`swap:1s`, `scroll:top`, ...) are
/// accepted and ignored, in the finest tradition of `#[allow(unused)]`.
pub fn swap_style(spec: &str) -> SwapStyle {
    match spec.split_whitespace().next().unwrap_or("") {
        "outerHTML" => SwapStyle::OuterHtml,
        "textContent" => SwapStyle::TextContent,
        "beforebegin" => SwapStyle::BeforeBegin,
        "afterbegin" => SwapStyle::AfterBegin,
        "beforeend" => SwapStyle::BeforeEnd,
        "afterend" => SwapStyle::AfterEnd,
        "delete" => SwapStyle::Delete,
        "none" => SwapStyle::None,
        _ => SwapStyle::InnerHtml,
    }
}

/// `500ms`, `2s`, `1.5s`, `1m`, or a bare number of milliseconds.
pub fn duration_ms(s: &str) -> Option<i32> {
    let s = s.trim();
    let (num, mult) = if let Some(n) = s.strip_suffix("ms") {
        (n, 1.0)
    } else if let Some(n) = s.strip_suffix('s') {
        (n, 1_000.0)
    } else if let Some(n) = s.strip_suffix('m') {
        (n, 60_000.0)
    } else {
        (s, 1.0)
    };
    let v: f64 = num.parse().ok()?;
    if v.is_finite() && v >= 0.0 {
        Some((v * mult).round() as i32)
    } else {
        None
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TriggerKind {
    Event(String),
    Load,
    Every(i32),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TriggerSpec {
    pub kind: TriggerKind,
    pub once: bool,
    pub changed: bool,
    pub delay: Option<i32>,
    pub throttle: Option<i32>,
    pub from: Option<String>,
}

impl TriggerSpec {
    pub fn event(name: &str) -> Self {
        Self {
            kind: TriggerKind::Event(name.to_string()),
            once: false,
            changed: false,
            delay: None,
            throttle: None,
            from: None,
        }
    }
}

/// Parses `hx-trigger`, e.g. `keyup changed delay:300ms, load, every 2s`.
/// Event filters (`click[ctrlKey]`) are stripped: evaluating them would mean running
/// JavaScript, which is against our religion.
pub fn triggers(spec: &str) -> Vec<TriggerSpec> {
    let mut out = Vec::new();
    for part in spec.split(',') {
        let tokens: Vec<&str> = part.split_whitespace().collect();
        let Some(first) = tokens.first() else {
            continue;
        };
        let mut i = 1;
        let kind = match *first {
            "every" => {
                i = 2;
                match tokens.get(1).and_then(|t| duration_ms(t)) {
                    Some(ms) if ms > 0 => TriggerKind::Every(ms),
                    _ => continue,
                }
            }
            "load" => TriggerKind::Load,
            ev => TriggerKind::Event(ev.split('[').next().unwrap_or(ev).to_string()),
        };
        let mut t = TriggerSpec {
            kind,
            ..TriggerSpec::event("")
        };
        while i < tokens.len() {
            let tok = tokens[i];
            if tok == "once" {
                t.once = true;
            } else if tok == "changed" {
                t.changed = true;
            } else if let Some(v) = tok.strip_prefix("delay:") {
                t.delay = duration_ms(v);
            } else if let Some(v) = tok.strip_prefix("throttle:") {
                t.throttle = duration_ms(v);
            } else if let Some(v) = tok.strip_prefix("from:") {
                // `from:closest form` spans two tokens.
                if matches!(v, "closest" | "find" | "next" | "previous") {
                    if let Some(next) = tokens.get(i + 1) {
                        t.from = Some(format!("{v} {next}"));
                        i += 1;
                    }
                } else {
                    t.from = Some(v.to_string());
                }
            }
            i += 1;
        }
        out.push(t);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn targets() {
        assert_eq!(target_spec("this"), TargetSpec::This);
        assert_eq!(target_spec(" closest .card "), TargetSpec::Closest(".card"));
        assert_eq!(target_spec("find span"), TargetSpec::Find("span"));
        assert_eq!(target_spec("next"), TargetSpec::Next(None));
        assert_eq!(
            target_spec("previous div"),
            TargetSpec::Previous(Some("div"))
        );
        assert_eq!(target_spec("#out"), TargetSpec::Global("#out"));
        assert_eq!(target_spec("body"), TargetSpec::Body);
    }

    #[test]
    fn swaps() {
        assert_eq!(swap_style("outerHTML swap:1s"), SwapStyle::OuterHtml);
        assert_eq!(swap_style("beforeend"), SwapStyle::BeforeEnd);
        assert_eq!(swap_style(""), SwapStyle::InnerHtml);
        assert_eq!(swap_style("nonsense"), SwapStyle::InnerHtml);
    }

    #[test]
    fn durations() {
        assert_eq!(duration_ms("500ms"), Some(500));
        assert_eq!(duration_ms("2s"), Some(2000));
        assert_eq!(duration_ms("1.5s"), Some(1500));
        assert_eq!(duration_ms("1m"), Some(60000));
        assert_eq!(duration_ms("250"), Some(250));
        assert_eq!(duration_ms("soon"), None);
    }

    #[test]
    fn trigger_parsing() {
        let t = triggers("keyup changed delay:300ms");
        assert_eq!(t.len(), 1);
        assert_eq!(t[0].kind, TriggerKind::Event("keyup".into()));
        assert!(t[0].changed);
        assert_eq!(t[0].delay, Some(300));

        let t = triggers("load, every 2s, click[ctrlKey] once from:closest form");
        assert_eq!(t[0].kind, TriggerKind::Load);
        assert_eq!(t[1].kind, TriggerKind::Every(2000));
        assert_eq!(t[2].kind, TriggerKind::Event("click".into()));
        assert!(t[2].once);
        assert_eq!(t[2].from.as_deref(), Some("closest form"));

        assert!(triggers("every never").is_empty());
        assert_eq!(triggers("input throttle:1s")[0].throttle, Some(1000));
    }
}
