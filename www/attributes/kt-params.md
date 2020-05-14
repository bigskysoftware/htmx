---
layout: layout.njk
title: </> kutty - kt-params
---

## `kt-params`

The `kt-params` attribute allows you to filter the parameters that will be submitted with an AJAX request.  

The possible values of this attribute are:

* `*` - Include all parameters (default)
* `none` - Include no parameters
* `not <param-list>` - Include all except the comma separated list of parameter names
* `<param-list>` - Include all the comma separated list of parameter names

```html
  <div kt-get="/example" kt-params="*">Get Some HTML, Including Params</div>
```

This div will include all the parameters that a `POST` would, but they will be URL encoded
and included in the URL, as per usual with a `GET`.

### Notes

* `kt-params` is inherited and can be placed on a parent element
