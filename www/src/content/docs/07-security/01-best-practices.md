---
title: "Best Practices"
description: "Protect your htmx application from common attacks"
---

htmx allows you to define logic directly in your DOM. This has a number of advantages, the largest being
[Locality of Behavior](/essays/locality-of-behaviour), which makes your system easier to understand and
maintain.

A concern with this approach, however, is security: since htmx increases the expressiveness of HTML, if a malicious
user is able to inject HTML into your application, they can leverage this expressiveness of htmx to malicious
ends.

## Rule 1: Escape All User Content

The first rule of HTML-based web development has always been: *do not trust input from the user*. You should escape all
3rd party, untrusted content that is injected into your site. This is to prevent, among other issues,
[XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting).

There is extensive documentation on XSS and how to prevent it on the
excellent [OWASP Website](https://owasp.org/www-community/attacks/xss/),
including
a [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

The good news is that this is a very old and well understood topic, and the vast majority of server-side templating
languages
support [automatic escaping](https://docs.djangoproject.com/en/4.2/ref/templates/language/#automatic-html-escaping) of
content to prevent just such an issue.

That being said, there are times people choose to inject HTML more dangerously, often via some sort of `raw()`
mechanism in their templating language. This can be done for good reasons, but if the content being injected is coming
from a 3rd party then it _must_ be scrubbed, including removing attributes starting with `hx-` and `data-hx`, as well as
inline `<script>` tags, etc.

If you are injecting raw HTML and doing your own escaping, a best practice is to *whitelist* the attributes and tags you
allow, rather than to blacklist the ones you disallow.

## htmx Security Tools

Of course, bugs happen and developers are not perfect, so it is good to have a layered approach to security for
your web application, and htmx provides tools to help secure your application as well.

Let's take a look at them.

### `hx-ignore`

The first tool htmx provides to help further secure your application is the [`hx-ignore`](/reference/attributes/hx-ignore)
attribute. This attribute will prevent processing of all htmx attributes on a given element, and on all elements within
it. So, for example, if you were including raw HTML content in a template (again, this is not recommended!) then you
could place a div around the content with the `hx-ignore` attribute on it:

```html
<div hx-ignore>
    <%= raw(user_content) %>
</div>
```

And htmx will not process any htmx-related attributes or features found in that content. This attribute cannot be
disabled by injecting further content: if an `hx-ignore` attribute is found anywhere in the parent hierarchy of an
element, it will not be processed by htmx.

## CSP Options

Browsers also provide tools for further securing your web application. The most powerful tool available is a
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). Using a CSP you can tell the
browser to, for example, not issue requests to non-origin hosts, to not evaluate inline script tags, etc.

CSP can be set via an HTTP header or a `<meta>` tag. HTTP headers are preferred — `<meta>` tags
do not enforce all directives and scripts that appear before the `<meta>` tag in the document are
not covered by it:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-<nonce>'
```

A full discussion of CSPs is beyond the scope of this document, but
the [MDN Article](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) provides a good jumping-off point
for exploring this topic.

### hx-nonce Extension

For sites using CSP script nonces, the [`hx-nonce` extension](/docs/extensions/nonce) provides deep integration:

- Gates all htmx attribute processing behind a per-request nonce, blocking injected htmx attributes
- Automatically creates a `'htmx'` [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) policy so only htmx can write HTML into DOM sinks
- Replaces `new Function()` eval with nonce-based script injection when `safeEval:true` is set, removing the need for `unsafe-eval`

See the [hx-nonce extension docs](/docs/extensions/nonce) for full setup instructions.

### htmx & Eval

htmx uses `new Function()` for some optional features:

* Event filters
* The [`hx-on`](/reference/attributes/hx-on) attribute
* Attribute values starting with `js:` or `javascript:`

All of these are optional. If you don't use them you can omit `unsafe-eval` from your CSP entirely.

If you do use these features, the [`hx-nonce` extension](/docs/extensions/nonce) with `safeEval:true` replaces
`new Function()` with nonce-based script injection, enabling them without `unsafe-eval`.

### CSP & Inline Styles

htmx injects its indicator CSS using [Constructable Stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet) (`document.adoptedStyleSheets`), which are not subject to `style-src` CSP restrictions.

The one area to be aware of is morph swaps when used alongside JS frameworks like Alpine that set `style` attributes via JavaScript. During morph, htmx's `__copyAttributes` reads all attributes from the new element and copies them to the old one — including any `style` attributes set by the framework. Under a strict `style-src` policy without `'unsafe-inline'`, this `setAttribute("style", ...)` call will produce a CSP violation.

Add `"style"` to [`morphIgnore`](/reference/config/htmx-config-morphIgnore) to skip it:

```html
<meta name="htmx-config" content='{"morphIgnore":["data-htmx-powered","style"]}'>
```

Class-based CSS transitions continue to work normally.

## CSRF Prevention

The assignment and checking of CSRF tokens are typically backend responsibilities, but `htmx` can support returning the
CSRF token automatically with every request using the [`hx-headers`](/reference/attributes/hx-headers) attribute. The attribute needs to be added to the
element issuing the request or one of its ancestor elements. This makes the `html` and `body` elements effective
global vehicles for adding the CSRF token to the `HTTP` request header, as illustrated below.

```html
<html lang="en" hx-headers='{"X-CSRF-TOKEN": "CSRF_TOKEN_INSERTED_HERE"}'>
:
</html>
```

The above elements are usually unique in an HTML document and should be easy to locate within templates.
