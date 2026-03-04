---
title: "Validation"
description: "Validate forms using HTML5 validation APIs"
---

# Validation

Htmx integrates with the [HTML5 Validation API](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
and will not issue a request for a form if a validatable input is invalid.

Non-form elements do not validate before they make requests by default, but you can enable validation by setting
the [`hx-validate`](/reference/attributes/hx-validate) attribute to "true".
