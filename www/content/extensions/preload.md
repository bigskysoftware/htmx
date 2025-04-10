+++
title = "htmx Preload Extension"
+++

The `preload` extension allows you to load HTML fragments into your browser's cache before they are requested by the
user, so that additional pages appear to users to load nearly instantaneously. As a developer, you can customize its
behavior to fit your applications needs and use cases.

**IMPORTANT:** Preloading content judiciously can improve your web application's perceived performance, but preloading
too many resources can negatively impact your visitors' bandwidth and your server performance by initiating too many
unused requests. Use this extension carefully!

## Installing

The fastest way to install `preload` is to load it via a CDN. Remember to always include the core htmx library before the extension and [enable the extension](#usage).
```HTML
<head>
    <script src="https://unpkg.com/htmx.org@2.0.4" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous"></script>
    <script src="https://unpkg.com/htmx-ext-preload@2.1.0" integrity="sha384-fkzubQiTB69M7XTToqW6tplvxAOJkqPl5JmLAbumV2EacmuJb8xEP9KnJafk/rg8" crossorigin="anonymous"></script>
</head>
<body hx-ext="preload">
...
```
An unminified version is also available at https://unpkg.com/htmx-ext-preload/dist/preload.js.

While the CDN approach is simple, you may want to consider [not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn). The next easiest way to install `preload` is to simply copy it into your project. Download the extension from `https://unpkg.com/htmx-ext-preload`, add it to the appropriate directory in your project and include it where necessary with a `<script>` tag.

For npm-style build systems, you can install `preload` via [npm](https://www.npmjs.com/):
```shell
npm install htmx-ext-preload
```
After installing, you'll need to use appropriate tooling to bundle `node_modules/htmx-ext-preload/dist/preload.js` (or `.min.js`). For example, you might bundle the extension with htmx core from `node_modules/htmx.org/dist/htmx.js` and project-specific code.

If you are using a bundler to manage your javascript (e.g. Webpack, Rollup):
- Install `htmx.org` and `htmx-ext-preload` via npm
- Import both packages to your `index.js`
```JS
import `htmx.org`;
import `htmx-ext-preload`; 
```

## Usage

Register the extension with htmx using the `hx-ext` attribute. Then, add a `preload` attribute to any hyperlinks
and `hx-get` elements you want to preload. By default, resources will be loaded as soon as the `mousedown` event begins,
giving your application a roughly 100-200ms head start on serving responses. See configuration below for other options.

```html
<body hx-ext="preload">
<h1>What Works</h2>
    <a href="/server/1" preload>WILL BE requested using a standard XMLHttpRequest() and default options (below)</a>
    <button hx-get="/server/2" preload>WILL BE requested with additional htmx headers.</button>

    <h1>What WILL NOT WORK</h1>
    <a href="/server/3">WILL NOT be preloaded because it does not have an explicit "preload" attribute</a>
    <a hx-post="/server/4" preload>WILL NOT be preloaded because it is an HX-POST transaction.</a>
</body>
```

All preload requests include an additional `"HX-Preloaded": "true"` header.

### Inheriting Preload Settings

You can add the `preload` attribute to the top-level element that contains several `<a href="">` or `hx-get=""`
elements, and all of them will be preloaded. Be careful with this setting, because you can end up wasting bandwidth if
you preload many more resources than you need.

```html

<body hx-ext="preload">
<ul preload>
    <li><a href="/server/1">This will be preloaded because of the attribute in the node above.</a>
    <li><a href="/server/2">This will also be preloaded for the same reason.</a>
    <li><a href="/server/3">This will be preloaded, too. Lorem ipsum.</a>
</ul>
</body>
```

### Preloading Forms

The extension can preload some form elements if the form includes `hx-get` attribute or uses `method="get"`. The `preload` attribute can be added to the form or to some of its selected elements. Currently these form elements can be preloaded:
- `<input type="radio>">` will be preloaded as if the radio button was clicked and form submitted
- `<input type="checkbox">` will be preloaded as if the checkbox was checked and form submitted
- `<input type="checkbox" checked>` will be preloaded as if the checkbox was unchecked and form submitted
- `<select>` will send multiple preload requests as if each unselected option was selected and form submitted
- `<input type="submit">` will be preloaded as if form was submitted

### Preloading of Linked Images

After an HTML page (or page fragment) is preloaded, this extension can also preload linked image resources. It will not
load or run linked Javascript or Cascading Stylesheet content, whether linked or embedded in the preloaded HTML. To
preload images as well, use the following syntax.

```html

<div hx-ext="preload">
    <a href="/my-next-page" preload="mouseover" preload-images="true">Next Page</a>
</div>
```

### Configuration

Defaults for this extension are chosen to balance users' perceived performance with potential load on your servers from
unused requests. As a developer, you can modify two settings to customize this behavior to your specific use cases.

#### preload="mousedown" (DEFAULT)

The default behavior for this extension is to begin loading a resource when the user presses the mouse down. This is a
conservative setting that guarantees the user actually intends to use the linked resource. Because user click events
typically take 100-200ms to complete, this setting gives your server a significant headstart compared with a regular
click.

```html
<a href="/server/1" preload="mousedown">This will be preloaded when the user begins to click.</a>
```

#### preload="mouseover"

To preload links more aggressively, you can trigger the preload to happen when the user's mouse hovers over the link
instead. To prevent many resources from being loaded when the user scrolls or moves the mouse across a large list of
objects, a 100ms delay is built in to this action. If the user's mouse leaves the element *before* this timeout expires,
then the resource is not preloaded.

Typical users hover over links for several hundred milliseconds before they click, which gives your server even more
time to respond to the request than the `mousedown` option
above.  [Test your own hover timing here.](http://instantclick.io/click-test). However, be careful when using this
option because it can increase server load by requesting resources unnecessarily.

```html
<a href="/server/1" preload="mouseover">This will be preloaded when the user's mouse remains over it for more than
    100ms.</a>
```

#### preload="custom-event-name"

Preload can also listen to any custom event within the system, triggering resources to be preloaded (if they have not
already been cached by the browser). The extension itself generates an event called `preload:init` that can be used to
trigger preloads as soon as an object has been processed by htmx.

```html

<body hx-ext="preload">
<button hx-get="/server" preload="preload:init" hx-target="idLoadMore">Load More</a>
    <div id="idLoadMore">
        Content for this DIV will be preloaded as soon as the page is ready.
        Clicking the button above will swap it into the DOM.
    </div>
</body>
```

#### preload="always"

By default, the extension will preload each element once.
If you would like to keep always preloading the element, you can add `preload="always"` attribute.
This can be useful if `hx-target` is not the element itself.
This attribute can be combined with other configuration attributes e.g. `preload="always mouseover"`.

### About Touch Events

To accommodate touchscreen devices, an additional `ontouchstart` event handler is added whenever you specify
a `mouseover` or `mousedown` trigger. This extra trigger fires immediately (no waiting period) whenever the user touches
the screen, saving you 300ms of waiting time on Android, and 450ms on iOS.

### Limitations

* Links must be marked with a `preload` attribute, or have an ancestor node that has the `preload` attribute.
* Only `GET` transactions (including `<a href="">` and `hx-get=""`) can be preloaded. Following REST principles, `GET`
  transactions are assumed to not make any significant changes to a resource. Transactions that can potentially make a
  change (such as `POST`, `PUT`, and `DELETE`) will not be preloaded under any circumstances.
* When listening to `mouseover` events, preload waits for 100ms before downloading the linked resource. If the mouse
  leaves the resource before this timeout expires, the resource is not preloaded.
* Preloaded responses will only be cached in the browser if the response headers allow it. For example, the response
  header `Cache-Control: private, max-age=60` allows the browser to cache the response,
  whereas `Cache-Control: no-cache` prevents it.

## Credits

The behavior for this plugin was inspired by the work done by [Alexandre Dieulot](https://github.com/dieulot)
on [InstantClick](http://instantclick.io/), which is released under the MIT license.
