---
title: "Attributes"
description: "Declarative controls for requests, swapping, and targeting."
---

### Requests

- [hx-get](/reference/attributes/hx-get) - issues `GET` request to specified URL
- [hx-post](/reference/attributes/hx-post) - issues `POST` request to specified URL
- [hx-put](/reference/attributes/hx-put) - issues `PUT` request to specified URL
- [hx-patch](/reference/attributes/hx-patch) - issues `PATCH` request to specified URL
- [hx-delete](/reference/attributes/hx-delete) - issues `DELETE` request to specified URL
- [hx-query](/reference/attributes/hx-query) - issues `QUERY` request to specified URL

### Request Control

- [hx-trigger](/reference/attributes/hx-trigger) - controls when element issues requests
- [hx-swap](/reference/attributes/hx-swap) - controls how response is inserted
- [hx-target](/reference/attributes/hx-target) - controls where response is inserted
- [hx-select](/reference/attributes/hx-select) - controls which response part is inserted
- [hx-swap-oob](/reference/attributes/hx-swap-oob) - marks response elements to swap into page by ID
- [hx-select-oob](/reference/attributes/hx-select-oob) - picks response elements to swap into page by ID
- [hx-confirm](/reference/attributes/hx-confirm) - shows confirmation dialog before request

### Scripting

- [hx-on](/reference/attributes/hx-on) - runs inline JavaScript when event fires

### Data

- [hx-vals](/reference/attributes/hx-vals) - adds values to request parameters
- [hx-include](/reference/attributes/hx-include) - includes additional element values in request
- [hx-headers](/reference/attributes/hx-headers) - adds custom headers to request
- [hx-encoding](/reference/attributes/hx-encoding) - sets request encoding type

### History

- [hx-push-url](/reference/attributes/hx-push-url) - pushes URL into browser history
- [hx-replace-url](/reference/attributes/hx-replace-url) - replaces current URL in browser history
- [hx-history-elt](/reference/attributes/hx-history-elt) - marks element to swap on history restore

### Enhancements

- [hx-boost](/reference/attributes/hx-boost) - converts links and forms to AJAX
- [hx-preload](/reference/attributes/hx-preload) - preloads content before user triggers request
- [hx-pending](/reference/attributes/hx-pending) - shows custom content during requests

### Advanced

- [hx-indicator](/reference/attributes/hx-indicator) - specifies loading indicator element
- [hx-status](/reference/attributes/hx-status) - handles responses differently by status code
- [hx-sync](/reference/attributes/hx-sync) - synchronizes requests between elements
- [hx-validate](/reference/attributes/hx-validate) - validates before submitting request
- [hx-disable](/reference/attributes/hx-disable) - disables elements during request
- [hx-ignore](/reference/attributes/hx-ignore) - disables htmx processing for element
- [hx-preserve](/reference/attributes/hx-preserve) - preserves element during swaps
- [hx-action](/reference/attributes/hx-action) - specifies URL to receive request
- [hx-method](/reference/attributes/hx-method) - specifies HTTP method for request
- [hx-config](/reference/attributes/hx-config) - configures request behavior
