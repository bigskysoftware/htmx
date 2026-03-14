---
title: "File Upload"
description: Upload files with progress and validation
icon: "icon-[ic--round-file-upload]"
soon: true
---

<script>
const inputClass = "block w-full px-3 py-2.5 text-sm border rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none transition focus:border-neutral-400 dark:focus:border-neutral-500";
const labelClass = "block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1.5";
const errorClass = "text-[0.675rem] text-red-600 dark:text-red-400 mt-1.5";

function renderForm(errors = {}, values = {}) {
  const border = (field) => errors[field]
    ? "border-red-300 dark:border-red-700"
    : "border-neutral-200 dark:border-neutral-700";

  const fileSelected = values.file;

  return `
  <form id="upload-form" hx-post="/submit" hx-target="#upload-wrapper" hx-swap="innerHTML"
        hx-on::after-settle="var fi=document.getElementById('file-input'); var lb=document.getElementById('file-label'); if(fi&&lb&&fi.files[0]) lb.textContent=fi.files[0].name"
        class="w-full mx-auto flex flex-col gap-5">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="name-input" class="${labelClass}">Name</label>
        <input id="name-input" name="name" placeholder="Jane Smith" value="${values.name || ''}"
               class="${inputClass} ${border('name')}">
        ${errors.name ? '<p class="' + errorClass + '">' + errors.name + '</p>' : ''}
      </div>
      <div>
        <label for="email-input" class="${labelClass}">Email</label>
        <input id="email-input" name="email" type="email" placeholder="jane@example.com" value="${values.email || ''}"
               class="${inputClass} ${border('email')}">
        ${errors.email ? '<p class="' + errorClass + '">' + errors.email + '</p>' : ''}
      </div>
    </div>
    <div>
      <label for="file-input"
             class="group flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed ${errors.file ? 'border-red-300 dark:border-red-700' : 'border-neutral-200 dark:border-neutral-800'} rounded-lg cursor-pointer transition hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850 active:scale-[0.99]">
        <i class="icon-[mdi--cloud-upload-outline] size-8 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition"></i>
        <span class="text-sm text-neutral-600 dark:text-neutral-400" id="file-label">${fileSelected ? fileSelected : 'Choose a file'}</span>
      </label>
      <input hx-preserve id="file-input" type="file" name="file" class="sr-only"
             onchange="document.getElementById('file-label').textContent=this.files[0]?.name||'Choose a file'">
      ${errors.file ? '<p class="' + errorClass + '">' + errors.file + '</p>' : ''}
    </div>
    <button type="submit"
            class="w-full px-5 py-2.5 text-sm font-medium rounded-md text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 cursor-pointer hover:bg-neutral-700 dark:hover:bg-neutral-300 active:scale-[0.98] transition">
      Submit
    </button>
  </form>`;
}

server.get("/demo", () =>
  `<div id="upload-wrapper" class="starting:opacity-0 transition duration-300">${renderForm()}</div>`);

server.post("/submit", (req) => {
  const name = (req.params.name || '').trim();
  const email = (req.params.email || '').trim();
  const hasFile = req.params.file && req.params.file !== '' && req.params.file !== '[object File]';

  const errors = {};
  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!email.includes('@')) errors.email = 'Enter a valid email.';

  if (Object.keys(errors).length > 0) {
    return renderForm(errors, { name, email, file: hasFile ? 'file' : '' });
  }

  return `
  <div class="w-full max-w-sm mx-auto starting:opacity-0 transition duration-300">
    <div class="flex flex-col items-center gap-3 py-8 text-center">
      <i class="icon-[mdi--check-circle] size-12 text-green-500 dark:text-green-400"></i>
      <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Submitted successfully</p>
      <p class="text-xs text-neutral-500 dark:text-neutral-400">Your file selection was preserved through validation.</p>
      <button hx-get="/reset" hx-target="#upload-wrapper" hx-swap="innerHTML"
              class="mt-2 px-4 py-2 text-[0.8125rem] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-md cursor-pointer transition active:scale-[0.98]">
        Try again
      </button>
    </div>
  </div>`;
});

server.get("/reset", () => renderForm());

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex items-center justify-center min-h-[460px]"></div>

## Basic usage

On the client, set `hx-encoding` to `multipart/form-data`:

```html
<form hx-post="/upload"
      hx-encoding="multipart/form-data">
    <input type="file" name="file">
    <input type="text" name="name">
    <button>Submit</button>
</form>
```

- [`hx-encoding`](/reference/attributes/hx-encoding)=`"multipart/form-data"` sends the form as [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData), required for file uploads.
- [`hx-post`](/reference/attributes/hx-post) submits the form to `/upload`.

On the server, respond with a success or error message:

```html
<p>File uploaded successfully.</p>
```

## Preserving file selection on errors

When a form re-renders with validation errors, file inputs lose their selection. Add [`hx-preserve`](/reference/attributes/hx-preserve) to keep it:

```html
<form hx-post="..."
      hx-swap="outerHTML"
      hx-encoding="multipart/form-data">
    <input hx-preserve type="file" name="file">
    <input type="text" name="name">
    <button>Submit</button>
</form>
```

Try it in the demo: select a file, then submit with empty fields. The form re-renders with errors, but your file selection stays.

Alternatively, place the file input outside the swap target using the [`form` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form):

```html
<input form="my-form" type="file" name="file">

<form id="my-form" hx-post="..."
      hx-encoding="multipart/form-data">
    <button>Submit</button>
</form>
```

The input is outside the form element, so it is never replaced during swaps.

## Upload progress

htmx 4.x uses the native [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) API. `fetch` supports [upload progress monitoring](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#monitoring_upload_progress) in some browsers, but cross-browser support is limited. For reliable progress tracking, use [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) directly:

```html
<form id="upload-form" enctype="multipart/form-data">
  <input type="file" name="file">
  <button>Upload</button>
  <progress id="progress" value="0" max="100"></progress>
</form>

<script>
  document.querySelector('#upload-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (evt) => {
      document.querySelector('#progress').value = (evt.loaded / evt.total) * 100;
    });
    xhr.open('POST', '/upload');
    xhr.send(new FormData(e.target));
  });
</script>
```
