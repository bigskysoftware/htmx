+++
title = "Preserving File Inputs after Form Errors"
template = "demo.html"
+++

When using server-side error handling and validation with forms that include both primitive values and file inputs, the file input's value is lost when the form returns with error messages. Consequently, users are required to re-upload the file, resulting in a less user-friendly experience.

To overcome the problem of losing the file input value, you can use the `hx-preserve` attribute on the `input` element:

```html
<form method="POST" id="binaryForm" enctype="multipart/form-data" hx-swap="outerHTML" hx-target="#binaryForm">
    <input hx-preserve id="someId" type="file" name="binaryFile">
    <!-- Other code here, such as input error handling. -->
    <button type="submit">Submit</button>
</form>
```

If the file field is returned with errors on it, they will be displayed provided that `hx-preserve` was placed in the `input` only and not the element that would show the errors (e.g. `ol.errorlist`). If in a given circumstance you want the file upload input to return *without* preserving the user's chosen file (for example, because the file was an invalid type), you can manage that on the server side by omitting the `hx-preserve` attribute when the field has the relevant errors.

Alternatively, you can preserve file inputs after form errors by restructuring the form so that the file input is located outside the area that will be swapped.

Before:

```html
<form method="POST" id="binaryForm" enctype="multipart/form-data" hx-swap="outerHTML" hx-target="#binaryForm">
    <input type="file" name="binaryFile">
    <button type="submit">Submit</button>
</form>
```

After:

```html
<input form="binaryForm" type="file" name="binaryFile">

<form method="POST" id="binaryForm" enctype="multipart/form-data" hx-swap="outerHTML" hx-target="#binaryForm">
    <button type="submit">Submit</button>
</form>
```

1. Form Restructuring: Move the binary file input outside the main form element in the HTML structure.

2. Using the form Attribute: Enhance the binary file input by adding the form attribute and setting its value to the ID of the main form. This linkage associates the binary file input with the form, even when it resides outside the form element.