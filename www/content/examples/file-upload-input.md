+++
title = "Preserving File Inputs after Form Errors"
template = "demo.html"
+++

When using server-side error handling and validation with forms that include both primitive values and file inputs, the file input's value is lost when the form returns with error messages. Consequently, users are required to re-upload the file, resulting in a less user-friendly experience.

To overcome the problem of losing file input value in simple cases, you can adopt the following approach:

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