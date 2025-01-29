+++
title = "hx-params"
description = """\
  The hx-params attribute in htmx allows you to filter the parameters that will be submitted with an AJAX request."""
+++

The `hx-params` attribute allows you to filter the parameters that will be submitted with an AJAX request.  

The possible values of this attribute are:

* `*` - Include all parameters (default)
* `none` - Include no parameters
* `not <param-list>` - Include all except the comma separated list of parameter names
* `<param-list>` - Include all the comma separated list of parameter names

```html
  <div hx-get="/example" hx-params="*">Get Some HTML, Including Params</div>
```

This div will include all the parameters that a `POST` would, but they will be URL encoded
and included in the URL, as per usual with a `GET`.

## Notes

* `hx-params` is inherited and can be placed on a parent element
