+++
title = "hx-boost"
+++

The `hx-boost` attribute allows you to "boost" normal anchors and form tags to use AJAX instead.  This
has the [nice fallback](https://en.wikipedia.org/wiki/Progressive_enhancement) that, if the user does not 
have javascript enabled, the site will continue to work.

For anchor tags, clicking on the anchor will issue a `GET` request to the url specified in the `href` and
will push the url so that a history entry is created.  The target is the `<body>` tag, and the `innerHTML`
swap strategy is used by default.  All of these can be modified by using the appropriate attributes, except
the `click` trigger.

For forms the request will be converted into a `GET` or `POST`, based on the method in the `method` attribute
and will be triggered by a `submit`.  Again, the target will be the `body` of the page, and the `innerHTML`
swap will be used. The url will _not_ be pushed, however, and no history entry will be created. (You can use the 
[hx-push-url](@/attributes/hx-push-url.md) attribute if you want the url to be pushed.)

Here is an example of some boosted links:

```html
<div hx-boost="true">
  <a href="/page1">Go To Page 1</a>
  <a href="/page2">Go To Page 2</a>
</div>
```
These links will issue an ajax `GET` request to the respective URLs and replace the body's inner content with it.

Here is an example of a boosted form:

```html
<form hx-boost="true" action="/example" method="post">
    <input name="email" type="email" placeholder="Enter email...">
    <button>Submit</button>
</form>
```
This form will issue an ajax `POST` to the given URL and replace the body's inner content with it.


## Notes

* `hx-boost` is inherited and can be placed on a parent element
* Only links that are to the same domain and that are not local anchors will be boosted
* All requests are done via AJAX, so keep that in mind when doing things like redirects
* To find out if the request results from a boosted anchor or form, look for [`HX-Boosted`](@/reference.md#request_headers) in the request header
* Selectively disable boost on child elements with `hx-boost="false"`
* Disable the replacement of elements via boost, and their children, with [`hx-preserve="true"`](@/attributes/hx-preserve.md)
