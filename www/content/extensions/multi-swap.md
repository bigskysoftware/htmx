+++
title = "multi-swap"
+++

This extension allows you to swap multiple elements marked with the `id` attribute from the HTML response. You can also choose for each element which [swap method](@/docs.md#swapping) should be used.

Multi-swap can help in cases where OOB ([Out of Band Swaps](@/docs.md#oob_swaps)) is not enough for you. OOB requires HTML tags marked with `hx-swap-oob` attributes to be at the TOP level of HTML, which significantly limited its use. With OOB, it's impossible to swap multiple elements arbitrarily placed and nested in the DOM tree.

It is a very powerful tool in conjunction with `hx-boost` and `preload` extension.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/multi-swap.js"></script>
```

## Usage

1. Set `hx-ext="multi-swap"` attribute on `<body>`, on some parent element, or on each action element that should trigger an action (typically anchors or buttons).
2. On your action elements set `hx-swap="multi:ID-SELECTORS"`, e.g. `hx-swap="multi:#id1,#id2:outerHTML,#id3:afterend"`.
3. If you're not using e.g. `hx-get` to enable HTMX behavior, set `hx-boost="true"` on your action elements, or on some parent element, so that all elements inherit the hx-boost setting.

Selectors must be separated by a comma (without surrounding spaces) and a colon with the desired swap method can optionally be placed after the selector. Default swap method is `innerHTML`.

```html
<body hx-boost="true" hx-ext="multi-swap">
   <!-- simple example how to swap #id1 and #id2 from /example by innerHTML (default swap method) -->
   <button hx-get="/example" hx-swap="multi:#id1,#id2">Click to swap #id1 and #id2 content</button>

   <!-- advanced example how to swap multiple elements from /example by different swap methods -->
   <a href="/example" hx-swap="multi:#id1,#id2:outerHTML,#id3:beforeend,#id4:delete">Click to swap #id1 and #id2, extend #id3 content and delete #id4 element</a>

   <div id="id1">Old 1 content</div>
   <div id="id2">Old 2 content</div>
   <div id="id3">Old 3 content</div>
   <div id="id4">Old 4 content</div>
</body>
```

**Real world example with preloading**

The use case below shows how to ensure that only the `#submenu` and `#content` elements are redrawn when the main menu items are clicked. Thanks to the combination with the preload extension, the page, including its images, is preloaded on `mouseover` event.

```html
<head>
  <script src="/path/to/htmx.js"></script>
  <script src="/path/to/ext/multi-swap.js"></script>
  <script src="/path/to/ext/preload.js"></script>
</head>
<body hx-ext="multi-swap,preload">
  <header>...</header>
  <menu hx-boost="true">
    <ul>
      <li><a href="/page-1" hx-swap="multi:#submenu,#content" preload="mouseover" preload-images="true">Page 1</a></li>
      <li><a href="/page-2" hx-swap="multi:#submenu,#content" preload="mouseover" preload-images="true">Page 2</a></li>
    </ul>
    <div id="submenu">... submenu contains items by selected top-level menu ...</div>
  <menu>
  <main id="content">...</div>
  <footer>...</footer>
</body>
```


### Notes and limitations

* Attribute `hx-swap` value **must not contain spaces**, otherwise only the part of the value up to the first space will be accepted.
* If the `delete` swap method is used, the HTML response must also contain deleted element (it can be empty div with `id` attribute).
* Only elements with an `id` selector are supported, as the function internally uses OOB internal method. So it is not possible to use `class` or any other selectors.
