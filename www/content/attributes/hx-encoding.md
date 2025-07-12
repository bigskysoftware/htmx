+++
title = "hx-encoding"
description = """\
  The hx-encoding attribute in htmx allows you to switch the request encoding from the usual \
  `application/x-www-form-urlencoded` encoding to `multipart/form-data`, usually to support file uploads in an AJAX \
  request."""
+++

The `hx-encoding` attribute allows you to switch the request encoding from the usual `application/x-www-form-urlencoded`
encoding to `multipart/form-data`, usually to support file uploads in an ajax request.

The value of this attribute should be `multipart/form-data`.

The `hx-encoding` tag may be placed on parent elements.

## Notes

* `hx-encoding` is inherited and can be placed on a parent element
