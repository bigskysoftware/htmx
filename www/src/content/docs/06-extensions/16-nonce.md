---
title: "Nonce Security"
description: "CSP nonce enforcement and Trusted Types support for htmx"
keywords: ["nonce", "csp", "security", "trusted types", "xss"]
---

The `hx-nonce` extension gates htmx attribute processing behind CSP nonces, protecting against HTML injection attacks on sites that already use script nonces.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-nonce.js"></script>
```

## The hx-nonce Attribute

The `hx-nonce` attribute is how the server signals to the extension that an htmx element was intentionally rendered by trusted server-side code. When htmx initialises an element, the extension checks that its `hx-nonce` matches the page nonce — if it doesn't match or is missing, all htmx attributes are stripped and the element is inert.

Your templating engine should stamp `hx-nonce` on every element that carries htmx attributes:

```html
<!-- Django -->
<button hx-post="/save" hx-nonce="{{ request.csp_nonce }}">Save</button>

<!-- Rails ERB -->
<button hx-post="/save" hx-nonce="<%= content_security_policy_nonce %>">Save</button>

<!-- Laravel Blade -->
<button hx-post="/save" hx-nonce="{{ csp_nonce() }}">Save</button>
```

**Important:** `hx-nonce` alone does not guarantee XSS protection. It proves the element was rendered by the server, but it says nothing about the safety of the attribute values on that element. Any htmx attribute that includes user-supplied data must still be properly escaped by your templating engine:

```html
<!-- UNSAFE — user data in hx-get without escaping -->
<div hx-get="/search?q={{ user_input }}" hx-nonce="...">...</div>

<!-- SAFE — escaped by the templating engine -->
<div hx-get="/search?q={{ user_input | escape }}" hx-nonce="...">...</div>
```

All major templating engines should help you escape output by default — make sure you are not bypassing this with raw/unescaped output filters. If an attacker can inject unescaped content into an htmx attribute value on a nonced element, `hx-nonce` will not protect you.

Set a `Content-Security-Policy` header with a per-request nonce and stamp `hx-nonce` on every htmx element:

```http
Content-Security-Policy: script-src 'self' 'nonce-<nonce>'
```

```html
<script nonce="<nonce>" src="/htmx.js"></script>
<script nonce="<nonce>" src="/hx-nonce.js"></script>

<button hx-post="/save" hx-nonce="<nonce>">Save</button>
```

The extension reads the page nonce from the first `script[nonce]` element and blocks any htmx element whose `hx-nonce` doesn't match. If no page nonce is found, all htmx processing is blocked — fail closed.

## Trusted Types

Loading `hx-nonce` automatically creates a `'htmx'` Trusted Types policy. Add it to your CSP to enforce that only htmx can write HTML into DOM sinks:

```http
Content-Security-Policy: script-src 'self' 'nonce-<nonce>';
                         require-trusted-types-for 'script';
                         trusted-types htmx
```

No extra configuration needed. Falls back transparently on browsers without Trusted Types support. If `'htmx'` is not in your `trusted-types` whitelist, all htmx processing is blocked — fail closed.

## Safe Eval

htmx's JS expression features (`hx-on:`, `hx-vals js:`, `hx-confirm js:`, trigger filters) are entirely optional. If you don't use them, you can omit `unsafe-eval` from your CSP entirely with no further configuration.

If you do use these features, set `safeEval:true` to replace htmx's `new Function()` eval with nonce-based script injection, enabling them without `unsafe-eval`:

```http
Content-Security-Policy: script-src 'self' 'nonce-<nonce>'
```

```html
<meta name="htmx-config" content='extensions:"hx-nonce",safeEval:true'>
```

## Partial Responses

Partial responses should include a `Content-Security-Policy` header with a fresh nonce. The extension rewrites the response nonce to the page nonce before fragment parsing so swapped-in elements pass subsequent nonce checks:

```http
Content-Security-Policy: script-src 'nonce-<response-nonce>'
```

## Inline Scripts in Swapped Content

When htmx swaps in HTML containing `<script>` tags, it re-creates them to trigger execution. The `hx-nonce` extension ensures the response nonce is rewritten to the page nonce before parsing, so script nonces are correctly promoted and execute under a strict `script-src 'nonce-<nonce>'` policy.

This is the ideal replacement for `htmx.config.inlineScriptNonce`. Do not use `inlineScriptNonce` when using this extension — it applies a single static nonce to all swapped scripts regardless of origin, which undermines the per-response nonce model this extension provides.

## Security Events

| Event | Fired when |
|-------|-----------|
| `htmx:security:strip` | Element stripped due to missing or mismatched nonce |
| `htmx:security:violation` | Nonce mismatch at eval time or unnnonced boosted form submitter |

```js
document.addEventListener('htmx:security:strip', e => {
    console.warn(e.target, e.detail.reason, e.detail.stripped);
});
```

`detail.reason` is `'missing-nonce'` or `'nonce-mismatch'`.
