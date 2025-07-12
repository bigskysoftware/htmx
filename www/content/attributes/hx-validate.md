+++
title = "hx-validate"
description = """\
  The hx-validate attribute in htmx will cause an element to validate itself using the HTML5 Validation API before it \
  submits a request."""
+++

The `hx-validate` attribute will cause an element to validate itself by way of the [HTML5 Validation API](@/docs.md#validation)
before it submits a request.

Only `<form>` elements validate data by default, but other elements do not. Adding `hx-validate="true"` to `<input>`, `<textarea>` or `<select>` enables validation before sending requests.

## Notes

* `hx-validate` is not inherited
