---
title: "Boosting"
description: "Convert regular links and forms to use AJAX"
keywords: ["boost", "hx-boost", "progressive enhancement", "AJAX links"]
---

Htmx supports "boosting" regular HTML anchors and forms with the [`hx-boost`](/reference/attributes/hx-boost) attribute. This
attribute will convert all anchor tags and forms into AJAX requests that, by default, target the body of the page.

Here is an example:

```html
<div hx-boost:inherited="true">
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
</div>
```

The anchor tags in this div will issue an AJAX `GET` request to `/blog` and swap the response into the `body` tag.

Note that `hx-boost` is using the `inherited` modifier here.

## Progressive Enhancement 

A nice feature of `hx-boost` is that it degrades gracefully if javascript is not enabled: the links and forms continue
to work, they simply don't use ajax requests.

This is known as
[Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), and it allows
a wider audience to use your site's functionality.

Other htmx patterns can be adapted to achieve progressive enhancement as well, but they will require more thought.

Consider the [active search](/patterns/forms/active-search) example. As it is written, it will not degrade gracefully:
someone who does not have javascript enabled will not be able to use this feature. This is done for simplicity's sake,
to keep the example as brief as possible.

However, you could wrap the htmx-enhanced input in a form element:

```html
<form action="/search" method="POST">
    <input class="form-control" type="search"
           name="search" placeholder="Begin typing to search users..."
           hx-post="/search"
           hx-trigger="keyup changed delay:500ms, search"
           hx-target="#search-results"
           hx-indicator=".htmx-indicator">
</form>
```

With this in place, javascript-enabled clients would still get the nice active-search UX, but non-javascript enabled
clients would be able to hit the enter key and still search. Even better, you could add a "Search" button as well.
You would then need to update the form with an [`hx-post`](/reference/attributes/hx-post) that mirrored the `action` attribute, or perhaps use `hx-boost`
on it.

You would need to check on the server side for the [`HX-Request`](/reference/headers/hx-request) header to differentiate between an htmx-driven and a
regular request, to determine exactly what to render to the client.

Other patterns can be adapted similarly to achieve the progressive enhancement needs of your application.

As you can see, this requires more thought and more work. It also rules some functionality entirely out of bounds.
These tradeoffs must be made by you, the developer, with respect to your projects goals and audience.

[Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/What_is_accessibility) is a concept
closely related to progressive enhancement. Using progressive enhancement techniques such as `hx-boost` will make your
htmx application more accessible to a wide array of users.

htmx-based applications are very similar to normal, non-AJAX driven web applications because htmx is HTML-oriented.

As such, the normal HTML accessibility recommendations apply. For example:

* Use semantic HTML as much as possible (i.e. the right tags for the right things)
* Ensure focus state is clearly visible
* Associate text labels with all form fields
* Maximize the readability of your application with appropriate fonts, contrast, etc.
