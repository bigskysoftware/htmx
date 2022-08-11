---
layout: docs.njk
title: </> htmx - Documentation - Installing
---

## <a name="installing"></a> [Installing](#installing)

Htmx is a dependency-free, browser-oriented javascript library. This means that using it is as simple as adding a `<script>`
tag to your document head. No need for complicated build steps or systems.

If you are migrating to htmx from intercooler.js, please see the [migration guide](/migration-guide).

### Via A CDN (e.g. unpkg.com)

The fastest way to get going with htmx is to load it via a CDN. You can simply add this to your head tag
and get going:

```html
<script
  src="https://unpkg.com/htmx.org@1.8.0"
  integrity="sha384-cZuAZ+ZbwkNRnrKi05G/fjBX+azI9DNOkNYysZ0I/X5ZFgsmMiBXgDZof30F5ofc"
  crossorigin="anonymous"
></script>
```

While the CDN approach is extremely simple, you may want to consider [not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

### Download a copy

The next easiest way to install htmx is to simply copy it into your project.

Download `htmx.min.js` [from unpkg.com](https://unpkg.com/htmx.org/dist/htmx.min.js) and add it to the appropriate directory in your project
and include it where necessary with a `<script>` tag:

```html
<script src="/path/to/htmx.min.js"></script>
```

You can also add extensions this way, by downloading them from the `ext/` directory.

### npm

For npm-style build systems, you can install htmx via [npm](https://www.npmjs.com/):

```sh
npm install htmx.org
```

After installing, you’ll need to use appropriate tooling to use `node_modules/htmx.org/dist/htmx.js` (or `.min.js`).
For example, you might bundle htmx with some extensions and project-specific code.

### <a name="webpack">[Webpack](#webpack)

If you are using webpack to manage your javascript:

- Install `htmx` via your favourite package manager (like npm or yarn)
- Add the import to your `index.js`

```js
import "htmx.org";
```

If you want to use the global `htmx` variable (recommended), you need to inject it to the window scope:

- Create a custom JS file
- Import this file to your `index.js` (below the import from step 2)

```js
import "path/to/my_custom.js";
```

- Then add this code to the file:

```js
window.htmx = require("htmx.org");
```

- Finally, rebuild your bundle
