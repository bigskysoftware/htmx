---
title: "Best Practices"
description: "Protect your htmx application from common attacks"
---

# Best Practices

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

Here is an example CSP in a `meta` tag:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self';">
```

A full discussion of CSPs is beyond the scope of this document, but
the [MDN Article](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) provides a good jumping-off point
for exploring this topic.

### htmx & Eval

htmx uses eval for some functionality:

* Event filters
* The `hx-on` attribute
* Handling most attribute values that starts with `js:` or `javascript:`

All of these features can be replaced with standard event listeners and thus are not crucial to using htmx.

Thus you can disable `eval()` via a CSP and continue to use htmx.

## CSRF Prevention

The assignment and checking of CSRF tokens are typically backend responsibilities, but `htmx` can support returning the
CSRF token automatically with every request using the `hx-headers` attribute. The attribute needs to be added to the
element issuing the request or one of its ancestor elements. This makes the `html` and `body` elements effective
global vehicles for adding the CSRF token to the `HTTP` request header, as illustrated below.

```html
<html lang="en" hx-headers='{"X-CSRF-TOKEN": "CSRF_TOKEN_INSERTED_HERE"}'>
:
</html>
```

The above elements are usually unique in an HTML document and should be easy to locate within templates.
