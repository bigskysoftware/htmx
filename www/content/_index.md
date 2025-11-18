+++
insert_anchor_links = "heading"
+++

<!-- Hero Section -->
<div id="hero-section" class="not-prose pt-8 pb-12 sm:pt-16 sm:pb-24 w-screen relative left-1/2 -ml-[50vw] overflow-hidden">
    <div id="hero" class="relative text-center transition starting:opacity-0 duration-500">
      <!-- Logo -->
      <div id="hero-logo" class="relative inline-block">
          <h3 class="text-8xl font-sans font-bold whitespace-nowrap text-neutral-900 dark:text-neutral-100 dark:text-shadow-3d-blue-600 scan-lines">
            &lt;<b class="text-blue-600 dark:brightness-125">/</b>&gt; <span class="ms-4 max-sm:hidden">htm<b class="text-blue-600 dark:brightness-125">x</b></span>
          </h3>
          <sub id="hero-subtitle" class="text-[1.075rem] max-sm:hidden absolute left-3/4 -bottom-4 italic dark:text-shadow-3d-blue-600 whitespace-nowrap transition starting:translate-y-4 starting:opacity-0 delay-250 duration-500">
            high power tools for HTML
          </sub>
      </div>
    </div>
    <!-- Fixed Synthwave Background -->
    <div class="absolute inset-0 pointer-events-none mask-y-from-50% mask-y-to-100% -z-10" aria-hidden="true">
        <!-- Atmospheric glow layers (dark mode only) -->
        <div class="absolute inset-0 bg-gradient-to-t from-blue-950/8 via-transparent to-transparent opacity-0 dark:opacity-100"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-blue-950/5 via-transparent to-blue-950/15 opacity-0 dark:opacity-100"></div>
        <!-- Perspective grid container -->
        <div class="absolute top-1/2 inset-x-0 h-[70vh] -translate-y-1/2"
             style="perspective: 800px; transform-style: preserve-3d;">
            <!-- Grid lines container with perspective transform -->
            <div class="absolute inset-0 flex flex-col justify-around"
                 style="transform: rotateX(60deg); mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 100%);">
                <!-- Horizontal grid lines (lighter at bottom/vanishing point) -->
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/30"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/28"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/26"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/24"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/22"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/20"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/18"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/15"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/12"></div>
                <div class="w-full border-t border-neutral-200 dark:border-blue-500/10"></div>
                <!-- Vertical grid lines -->
                <div class="absolute inset-0 flex justify-around">
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/10"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/10"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/12"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/15"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/18"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/18"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/15"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/12"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/10"></div>
                    <div class="h-full border-l border-neutral-200 dark:border-blue-500/10"></div>
                </div>
            </div>
        </div>
        <!-- Horizon glow (dark mode only) -->
        <div class="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm dark:opacity-100 opacity-0"></div>
    </div>
</div>

<!-- Easter Eggs -->
<div id="easter-eggs" class="hidden">
    <!-- Ads (?ads=true) -->
    <div class="mb-12" _="init if window.location.search contains '?ads=true' put me before #hero">
        <a href="https://swag.htmx.org">
          <img src="/img/ads-top.png" alt="Ad: MacMall PowerBooks as low as 1999$! Call 888-932-1569. Get your FREE 64MB RAM with your PowerBook!" class="mx-auto" />
        </a>
    </div>
    <div class="mt-16" _="init if window.location.search contains '?ads=true' put me after #hero">
        <a href="https://swag.htmx.org">
          <img src="/img/ads-bottom.png" alt="Ads: Get Flash! FREE Microsoft Internet Explorer! Netscape Now! (3.0) Site created with Microsoft&reg; FrontPage&trade;. Powered by Microsoft BackOffice." class="mx-auto"/>
        </a>
    </div>
    <!-- Shut up warren (?uwu=true) -->
    <div _="init if window.location.search contains '?wuw=true' put me into #hero-logo">
        <a href="https://swag.htmx.org/products/shut-up-warren-tee">
          <img src="/img/shut-up-warren.png" alt="shut up warren ⁺₊✦ uwu">
        </a>
    </div>
    <!-- katakana (?wuw=true) -->
    <div _="init if window.location.search contains '?uwu=true' put me into #hero-logo">
     <a href="https://swag.htmx.org/products/htmx-katakana-shirt">
       <img src="/img/katakana.png" alt="htmx エイチティーエムエックス uwu">
     </a>
    </div>
    <!-- horse (?horse=true) -->
    <div _="init if window.location.search contains '?horse=true' put me after #hero-logo">
        <img src="/img/horse.png" class="absolute right-1/2 top-full translate-x-[60%] sm:translate-x-[75%] md:translate-x-[85%] lg:translate-x-full -translate-y-[75%] mask-t-from-50% mask-t-to-100% mask-b-from-90% mask-b-to-100% scan-lines opacity-50">
    </div>
</div>

## introduction

htmx gives you access to [fetch()](@/docs.md#ajax), [CSS](@/docs.md#css_transitions) & [View](@/docs.md#) Transitions, [SSE](@/docs.md) and more
directly in HTML, using [attributes](@/reference.md#attributes), so you can build
[interactive interfaces](@/patterns/_index.md) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of HTML.

htmx is small ([~10k min.br'd](https://cdn.jsdelivr.net/npm/htmx.org/dist/)),
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json),
[extendable](https://htmx.org/extensions) & has reduced code base sizes by  up to [67% when compared with react](@/essays/a-real-world-react-to-htmx-port.md)

## motivation

* Why should only [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) & [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) be able to make HTTP requests?
* Why should only [`click`](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event) & [`submit`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) events trigger them?
* Why should only [`GET`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) & [`POST`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) methods be [available](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)?
* Why should you only be able to replace the **entire** screen?

By removing these constraints, htmx completes HTML as a [hypertext](https://en.wikipedia.org/wiki/Hypertext)

## quick start

```html
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha3/dist/htmx.min.js"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
</button>
```

The [`hx-post`](@/attributes/hx-post.md) and [`hx-swap`](@/attributes/hx-swap.md) attributes on this button tell htmx:

> When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the HTML response

htmx is the successor to [intercooler.js](http://intercoolerjs.org)

Read the [docs introduction](@/docs.md#introduction) for a more in-depth... introduction.

<div class="relative">

## sponsors

<a href="https://github.com/sponsors/bigskysoftware?o=esb" class="os9-button not-prose absolute right-0 top-1/2 -translate-y-1/2">
    <iconify-icon icon="tabler:heart-filled" class="align-middle me-2 scale-[1.2] -translate-y-px"></iconify-icon>
    Sponsor htmx
</a>

</div>

{{ sponsors() }}

<div class="text-center italic mt-8">
    ʕ •ᴥ•ʔ made in montana
</div>