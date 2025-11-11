+++
title = "File Uploads"
template = "demo.html"
+++
Upload files with progress tracking and validation handling. Use `multipart/form-data` encoding.

## Upload with Progress

Create a form with multipart encoding:

```html
<form hx-encoding="multipart/form-data" hx-post="/upload">
  <input type="file" name="file">
  <button>Upload</button>
  <progress id="progress" value="0" max="100"></progress>
</form>
```

Listen for progress events and update the progress bar:

```html
<script>
  htmx.on('#form', 'htmx:xhr:progress', function(evt) {
    htmx.find('#progress').setAttribute('value', evt.detail.loaded / evt.detail.total * 100);
  });
</script>
```

[//]: # ({{ demo_environment&#40;&#41; }})

<form id="upload-form" hx-encoding="multipart/form-data" hx-post="/upload"
      class="space-y-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded mb-8">
  <div>
    <label class="block text-sm font-medium mb-2">Choose file</label>
    <input type="file" name="file"
           class="block w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2">
  </div>
  <button type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Upload
  </button>
  <progress id="progress" value="0" max="100"
            class="w-full h-2 [&::-webkit-progress-bar]:bg-neutral-200 [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600"></progress>
  <div id="upload-result" class="text-sm text-neutral-600 dark:text-neutral-400"></div>
</form>

<script>
  htmx.on('#upload-form', 'htmx:xhr:progress', function(evt) {
    htmx.find('#progress').setAttribute('value', evt.detail.loaded / evt.detail.total * 100);
  });

  onPost("/upload", function(req) {
    return `<div class="text-green-600">File uploaded successfully!</div>`;
  });
</script>

### With Hyperscript

Use hyperscript for cleaner syntax:

```html
<form hx-encoding="multipart/form-data" hx-post="/upload"
      _="on htmx:xhr:progress(loaded, total)
         set #progress.value to (loaded/total)*100">
  <input type="file" name="file">
  <button>Upload</button>
  <progress id="progress" value="0" max="100"></progress>
</form>
```

Hyperscript lets you destructure event details directly into variables.

## Keep File Selection on Errors

When forms return with validation errors, file inputs lose their selection. Preserve them with `hx-preserve` or by moving the input outside the swap target.

### Using hx-preserve

Add `hx-preserve` to keep the file selection:

```html
<form enctype="multipart/form-data" hx-post="/submit">
  <input hx-preserve type="file" name="file">
  <button>Submit</button>
</form>
```

The file stays selected when the form swaps with error messages.

**Important:** Only add `hx-preserve` to the input itself, not error containers. The server can conditionally remove `hx-preserve` when the file has errors (like invalid type).

<form id="preserve-form" enctype="multipart/form-data" hx-post="/validate"
      hx-swap="outerHTML"
      class="space-y-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded mb-8">
  <div>
    <label class="block text-sm font-medium mb-2">Upload file</label>
    <input type="file" name="file"
           class="block w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2">
    <p class="text-xs text-neutral-500 mt-1">Try submitting without selecting a file</p>
  </div>
  <div>
    <label class="block text-sm font-medium mb-2">Name</label>
    <input type="text" name="name" placeholder="Enter your name"
           class="block w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2">
  </div>
  <button type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Submit
  </button>
</form>

<script>
  onPost("/validate", function(req) {
    const name = new URLSearchParams(req.requestBody).get('name');
    if (!name) {
      return `
        <form id="preserve-form" enctype="multipart/form-data" hx-post="/validate"
              hx-swap="outerHTML"
              class="space-y-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded mb-8">
          <div>
            <label class="block text-sm font-medium mb-2">Upload file</label>
            <input hx-preserve type="file" name="file"
                   class="block w-full text-sm border border-neutral-300 dark:border-neutral-600 rounded px-3 py-2">
            <p class="text-xs text-neutral-500 mt-1">Try submitting without selecting a file</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input type="text" name="name" placeholder="Enter your name"
                   class="block w-full text-sm border border-red-300 rounded px-3 py-2">
            <p class="text-sm text-red-600 mt-1">Name is required</p>
          </div>
          <button type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Submit
          </button>
        </form>
      `;
    }
    return `<div class="p-4 bg-green-50 text-green-700 rounded">Form submitted successfully! Your file selection was preserved.</div>`;
  });
</script>

### Move Input Outside Form

Place the file input outside the swap target:

```html
<input form="form-id" type="file" name="file">

<form id="form-id" enctype="multipart/form-data" hx-post="/submit">
  <button>Submit</button>
</form>
```

The `form` attribute links the input to the form. Since the input is outside the swap target, it never gets replaced.
