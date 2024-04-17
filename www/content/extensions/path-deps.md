+++
title = "path-deps"
+++

This extension supports expressing inter-element dependencies based on paths, inspired by the
[intercooler.js dependencies mechanism](http://intercoolerjs.org/docs.html#dependencies).  When this
extension is installed an element can express a dependency on another path by using the `path-deps` property
and then setting `hx-trigger` to `path-deps`:

```html
  <div hx-get="/example"
       hx-trigger="path-deps"
       path-deps="/foo/bar">...</div>
```

This div will fire a `GET` request to `/example` when any other element issues a mutating request (that is, a non-`GET`
request like a `POST`) to `/foo/bar` or any sub-paths of that path.

You can use a `*` to match any path component:

```html
  <div hx-get="/example"
       hx-trigger="path-deps"
       path-deps="/contacts/*">...</div>
```

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/path-deps.js"></script>
```

## Usage

```html
<div hx-ext='path-deps'>
  <ul hx-get="/list" hx-trigger="path-deps" path-deps="/list">
  </ul>
  <button hx-post="/list">
     Post To List
  </button>
</div>
```

### Javascript API

#### Method - `PathDeps.refresh()` {#refresh}

This method manually triggers a refresh for the given path.

##### Parameters

* `path` - the path to refresh

##### Example

```js
  // Trigger a refresh on all elements with the path-deps attribute '/path/to/refresh', including elements with a parent path, e.g. '/path'
  PathDeps.refresh('/path/to/refresh');
```
