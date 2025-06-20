+++
title = "htmx Idiomorph Extension"
+++

[Idiomorph](https://github.com/bigskysoftware/idiomorph) is a DOM morphing algorithm created by the htmx creator.  DOM
morphing is a process where an existing DOM tree is "morphed" into the shape of another in a way that resuses as much of
the existing DOM's nodes as possible.  By preserving nodes when changing from one tree to another you can present a 
much smoother transition between the two states.

You can use the idiomorph morphing algorithm as a [swapping](@attributes/hx-swap) strategy by including the idiomorph 
extension.

## Installing

The fastest way to install `idiomorph` is to load it via a CDN. Remember to always include the core htmx library before the extension and [enable the extension](#usage).
```HTML
<head>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.5/dist/htmx.min.js@2.0.5" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous"></script>
    <script src="https://unpkg.com/idiomorph@0.7.3" integrity="sha384-JcorokHTL/m+D6ZHe2+yFVQopVwZ+91GxAPDyEZ6/A/OEPGEx1+MeNSe2OGvoRS9" crossorigin="anonymous"></script>
    <script src="https://unpkg.com/idiomorph@0.7.3/dist/idiomorph-ext.min.js" integrity="sha384-szktAZju9fwY15dZ6D2FKFN4eZoltuXiHStNDJWK9+FARrxJtquql828JzikODob" crossorigin="anonymous"></script>
</head>
<body hx-ext="morph">
```
Unminified versions are also available at:  
https://unpkg.com/idiomorph/dist/idiomorph.js  
https://unpkg.com/idiomorph/dist/idiomorph-ext.js

While the CDN approach is simple, you may want to consider [not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn). The next easiest way to install `idiomorph` is to simply copy it into your project. Download idiomorph and its htmx extension from `https://unpkg.com/idiomorph` and `https://unpkg.com/idiomorph/dist/idiomorph-ext.min.js`, add them to the appropriate directory in your project and include them where necessary with `<script>` tags.

For npm-style build systems, you can install `idiomorph` via [npm](https://www.npmjs.com/):
```shell
npm install idiomorph
```
After installing, you'll need to use appropriate tooling to bundle `node_modules/idiomorph/dist/idiomorph.js` (or `.min.js`) and `node_modules/idiomorph/dist/idiomorph-ext.js`. For example, you might bundle the extension with htmx core from `node_modules/htmx.org/dist/htmx.js` and project-specific code.

If you are using a bundler to manage your javascript (e.g. Webpack, Rollup):
- Install `htmx.org` and `idiomorph` via npm
- Import both packages to your `index.js`
```JS
import `htmx.org`;
import `idiomorph`; 
```

## Usage

Once you have referenced the idiomorph extension, you can register it with the name `morph` on the body and then being
using `morph`, `morph:outerHTML` or `morph:innerHTML` as swap strategies.

* `morph` & `morph:outerHTML` will morph the target element as well as it's children
* `morph:innerHTML` will morph only the inner children of an element, leaving the target untouched

```html
<body hx-ext="morph">

    <button hx-get="/example" hx-swap="morph">
        Morph My Outer HTML
    </button>

    <button hx-get="/example" hx-swap="morph:outerHTML">
        Morph My Outer HTML
    </button>
    
    <button hx-get="/example" hx-swap="morph:innerHTML">
        Morph My Inner HTML
    </button>

</body>
```

