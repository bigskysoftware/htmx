+++
title = "hx-request"
description = """\
  The hx-request attribute in htmx allows you to configure the request timeout, whether the request will send \
  credentials, and whether the request will include headers."""
+++

The `hx-request` attribute allows you to configure various aspects of the request via the following attributes:
 
* `timeout` - the timeout for the request, in milliseconds
* `credentials` - if the request will send credentials
* `noHeaders` - strips all headers from the request

These attributes are set using a JSON-like syntax:

```html
<div ... hx-request='{"timeout":100}'>
  ...
</div>
```

You may make the values dynamically evaluated by adding the `javascript:` or `js:` prefix:

```html
<div ... hx-request='js: timeout:getTimeoutSetting() '>
  ...
</div>
```

## Notes

* `hx-request` is merge-inherited and can be placed on a parent element
