+++
insert_anchor_links = "heading"
+++

<style type="text/css">
.wuw {
  display:none;
}
.uwu {
  display:none;
}
body.lmao .dark-hero .main {
    display:none;
}
body.lmao .dark-hero .wuw {
    display:block;
    padding-top: 24px;
}
body.lmao .dark-hero .uwu {
    display:none;
}
body.kawaii .dark-hero .main {
    display:none;
}
body.kawaii .dark-hero .wuw {
    display:none;
}
body.kawaii .dark-hero .uwu {
    display:block;
    padding-top: 24px;
}

body.ads .ad {
  display: block;
  text-align: center;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
}

body.ads .ad a:hover {
  opacity: 100%;
}

body .ad {
  display: none;
}

body.ads .ad img {
  max-width: 90vw;
}

.sponsor-button-container {
  float: right;
  margin: .5rem 0 1rem 1rem;
}

.sponsor-button-container .btn {
  padding: 8px 20px !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.sponsor-button-container .btn:hover {
  text-decoration: none;
}

</style>
<script type="application/javascript">
if(window.location.search=="?wuw=true" || window.location.search=="?suw=true") {
  document.body.classList.add("lmao")
}
if(window.location.search=="?uwu=true") {
  document.body.classList.add("kawaii")
}
if(window.location.search=="?ads=true") {
  document.body.classList.add("ads")
}
</script>

<div class="ad" style="margin-bottom: 30px">
<a href="https://swag.htmx.org">
  <img src="/img/ads_top.png" alt="Ad: MacMall PowerBooks as low as 1999$!
    Call 888-932-1569. Get your FREE 64MB RAM with your PowerBook!"/>
</a>
</div>

<div class="dark-hero full-width" classes="add appear">
  <div class="main">
      <span class="logo dark">&lt;<span class="blue">/</span>&gt; <span class="no-mobile">htm<span class="blue">x</span></span></span>
      <sub class="no-mobile"><i>high power tools for HTML</i></sub>
  </div>
  <div class="wuw">
     <a href="https://swag.htmx.org/products/shut-up-warren-tee">
       <img src="/img/wuw.png" alt="shut up warren ⁺₊✦ uwu">
     </a>
  </div>
  <div class="uwu">
     <a href="https://swag.htmx.org/products/htmx-katakana-shirt">
       <img src="/img/kawaii.png" alt="htmx エイチティーエムエックス uwu">
     </a>
  </div>

</div>
<div class="ad">
<a href="https://swag.htmx.org">
  <img src="/img/ads_bottom.png" alt="Ads: Get Flash! FREE Microsoft Internet Explorer!
    Netscape Now! (3.0) Site created with Microsoft&reg; FrontPage&trade;.
    Powered by Microsoft BackOffice."/>
</a>
</div>

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>htmx 4.0 is under construction, information here may be out of data/incorrect/changing!<p>
  <p>Please see <a href="/changes-in-4/">Changes In 4</a> for a rough list of changes jump on the <a href="/discord">discord</a> if you need help! </p>
</aside>
<h2>introduction</h2>


htmx gives you access to [AJAX](@/docs.md#ajax), [CSS Transitions](@/docs.md#css_transitions), [WebSockets](@/docs.md) and [Server Sent Events](@/docs.md)
directly in HTML, using [attributes](@/reference.md#attributes), so you can build
[modern user interfaces](@/patterns/_index.md) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~16k min.gz'd](https://cdn.jsdelivr.net/npm/htmx.org/dist/)),
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json),
[extendable](https://htmx.org/extensions) & has **reduced** code base sizes by [67% when compared with react](@/essays/a-real-world-react-to-htmx-port.md)

<h2>motivation</h2>

* Why should only [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) & [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) be able to make HTTP requests?
* Why should only [`click`](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event) & [`submit`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) events trigger them?
* Why should only [`GET`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) & [`POST`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) methods be [available](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)?
* Why should you only be able to replace the **entire** screen?

By removing these constraints, htmx completes HTML as a [hypertext](https://en.wikipedia.org/wiki/Hypertext)

<h2>quick start</h2>

```html
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha/dist/htmx.min.js"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The [`hx-post`](@/attributes/hx-post.md) and [`hx-swap`](@/attributes/hx-swap.md) attributes on
this button tell htmx:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the HTML response"

htmx is the successor to [intercooler.js](http://intercoolerjs.org)

Read the [docs introduction](@/docs.md#introduction) for a more in-depth... introduction.

<div class="sponsor-button-container">
  <a href="https://github.com/sponsors/bigskysoftware?o=esb" class="btn">❤️ Sponsor htmx</a>
</div>

## Sponsors

{{ include(path="static/sponsors.html") }}

<div style="text-align: center;font-style: italic;margin-top: 26px;">ʕ •ᴥ•ʔ made in montana</div>
