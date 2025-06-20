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
  <img src="/img/ads_top.png"/>
</a>
</div>

<div class="dark-hero full-width" classes="add appear">
  <div class="main">
      <span class="logo dark">&lt;<span class="blue">/</span>&gt; <span class="no-mobile">htm<span class="blue">x</span></span></span>
      <sub class="no-mobile"><i>high power tools for HTML</i></sub>
  </div>
  <div class="wuw">
     <a href="https://swag.htmx.org/products/shut-up-warren-tee">
       <img src="/img/wuw.png">
     </a>
  </div>
  <div class="uwu">
     <a href="https://swag.htmx.org/products/htmx-katakana-shirt">
       <img src="/img/kawaii.png">
     </a>
  </div>

</div>
<div class="ad">
<a href="https://swag.htmx.org">
  <img src="/img/ads_bottom.png"/>
</a>
</div>

<div class="alert">
<b>NEWS:</b> htmx 2.0 has been released!  It is not currently marked as <a href="https://docs.npmjs.com/cli/v10/commands/npm-dist-tag#purpose"><code>latest</code></a>
in NPM so that people using the <a href="https://v1.htmx.org">1.x line</a> are not accidentally upgraded.  We will mark
2.0 as <code>latest</code> at some point in 2025.
</div>

<h2>introduction</h2>

htmx gives you access to [AJAX](@/docs.md#ajax), [CSS Transitions](@/docs.md#css_transitions), [WebSockets](@/docs.md#websockets-and-sse) and [Server Sent Events](@/docs.md#websockets-and-sse)
directly in HTML, using [attributes](@/reference.md#attributes), so you can build
[modern user interfaces](@/examples/_index.md) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~14k min.gz'd](https://cdn.jsdelivr.net/npm/htmx.org/dist/)),
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
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.5/dist/htmx.min.js"></script>
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

Note that htmx 2.x has dropped IE support.  If you require IE support you can use the [1.x](https://v1.htmx.org)
code-line, which will be supported in perpetuity.

<h2><a name='book'></a>book</h2>

We are happy to announce the release of [Hypermedia Systems](https://hypermedia.systems), a book on how to build
[Hypermedia-Driven Applications](@/essays/hypermedia-driven-applications.md) using htmx & more:

<div style="text-align: center;padding: 24px">
<a href="https://www.amazon.com/dp/B0C9S88QV6/ref=sr_1_1?crid=1P0I3GXQK32TN"><img src="/img/hypermedia-systems.png" alt="hypermedia systems"></a>
</div>

<h2>sponsors <iframe src="https://github.com/sponsors/bigskysoftware/button" title="Sponsor htmx" height="32" width="114" style="border: 1px solid gray; border-radius: 12px; float:right"></iframe></h2>


htmx development can be supported via [GitHub Sponsors](https://github.com/sponsors/bigskysoftware?o=esb)


Thank you to all our generous <a href="https://github.com/sponsors/bigskysoftware?o=esb">supporters</a>, including:

<style>
#sponsor-table td {
  text-align: center;
  padding: 16px;
  min-height: 100px;
  border-bottom: none;
  width:33%;
}

@media only screen and (max-width: 760px)  {

	/* Force table to not be like tables anymore */
	table, thead, tbody, th, td, tr {
		display: block;
	}
    #sponsor-table td {
      width:90%;
    }
    #sponsor-table td * {
      margin: auto;
    }
}

</style>
<div style="overflow-x: auto">

<h1 style="margin-top:32px;text-align:center">Platinum Sponsor</h1>
<div style="display: grid;grid-template-columns: 1fr">
<div>
        <a data-github-account="commspace" href="https://www.commspace.co.za">
        <img class="dark-hidden" src="/img/commspace.svg" alt="commspace" style="min-width:200px"/>
        <img class="dark-visible" src="/img/commspace-dark.svg" alt="commspace" style="min-width:200px"/>
        </a>
</div>
</div>

## Silver Sponsors
<style>
#silver-sponsors div {
  text-align: center;
  padding: 12px;
}
#silver-sponsors div a * {
    width: 80%;
}
#silver-sponsors img {
    min-width: 150px;
}
</style>
<div id="silver-sponsors" style="display: grid;grid-template-columns: repeat(3, 1fr); align-items: center; justify-items: center; ">
<div>
        <a data-github-account="JetBrainsOfficial" href="https://www.jetbrains.com"><img  src="/img/jetbrains.svg" alt="Jetbrains"></a>
</div>
<div>
        <a href="https://github.blog/2023-04-12-github-accelerator-our-first-cohort-and-whats-next"><img class="dark-invert" src="/img/Github_Logo.png" alt="GitHub" style="max-width:80%;min-width:100px;"></a>
</div>
<div>
        <a data-github-account="craftcms" href="https://craftcms.com">
        <img class="dark-hidden" src="/img/logo-craft-cms.svg" alt="craft cms">
        <img  class="dark-visible" src="/img/logo-craft-cms-dark.svg" alt="craft cms">
        </a>
</div>
<div>
        <a data-github-account="ButterCMS" href="https://buttercms.com/?utm_campaign=sponsorship&utm_medium=banner&utm_source=htmxhome">
          <img class="dark-invert" style="min-width: 150px;" src="/img/butter-cms.svg" alt="ButterCMS">
        </a>
</div>
<div>
        <a data-github-account="Black-HOST" href="https://black.host">
          <img class="dark-invert"  src="/img/blackhost-logo.svg" alt="Black Host">
        </a>
</div>
<div>
        <a href="https://www.v7n.com/">
          <img alt="V7N" class="dark-hidden" src="/img/v7n-logo.png">
          <img alt="V7N" class="dark-visible" src="/img/v7n-logo-dark.png">
        </a>
</div>
<div>
      <a data-github-account="sekunho" href="https://tacohiro.systems/"><img src="/img/sekun-doggo.jpg" alt="Hiro The Doggo" style="border: 2px solid lightgray; border-radius:20px"></a>
</div>
<div>
        <a href="https://dasfilter.shop/pages/affiliates">
          <img class="dark-hidden"  alt="Das Filter" src="/img/das-filter.svg">
          <img class="dark-visible" alt="Das Filter" src="/img/das-filter-dark.svg">
        </a>
</div>
<div>
      <a href="https://www.pullapprove.com/?utm_campaign=sponsorship&utm_medium=banner&utm_source=htmx">
        <img class="dark-hidden" src="/img/pullapprove-logo.svg" alt="PullApprove"/>
        <img class="dark-visible" src="/img/pullapprove-logo-dark.svg" alt="PullApprove"/>
      </a>
</div>
<div>
        <a data-github-account="transloadit" href=" https://transloadit.com/?utm_source=htmx&utm_medium=referral&utm_campaign=sponsorship&utm_content=website/">
          <img class="dark-hidden" alt="Transloadit" src="/img/logos-transloadit-default.svg">
          <img class="dark-visible" alt="Transloadit" src="/img/transloadit-logo-dark.svg">
        </a>
</div>
<div>
      <a data-github-account="uibakery" href="https://uibakery.io">
      <img class="dark-hidden" src="/img/ui-bakery.svg" alt="UI Bakery">
      <img class="dark-visible" src="/img/ui-bakery-dark.svg" alt="UI Bakery"></a>
</div>

<div>
    <a data-github-account="tracebit-com" href="https://tracebit.com/?utm_source=htmx">
      <img class="dark-hidden" alt="Tracebit Cloud Canaries" src="/img/tracebit-logo.png">
      <img class="dark-visbile" alt="Tracebit Cloud Canaries" src="/img/tracebit-logo-dark.png">
    </a>
</div>
<div>
      <a data-github-account="pubkey" href="https://rxdb.info/?utm_source=sponsor&utm_medium=githubsponsor&utm_campaign=githubsponsor-htmx">
        <img src="/img/rxdb.svg" alt="RxDB JavaScript Database"></a>
</div>
<div>
      <a href="https://www.ohne-makler.net/"><img src="/img/ohne-makler.svg" alt="Ohne-Makler" style="width:100%;max-width:150px"></a>
</div>


<div>
        <a data-github-account="cased" href="https://cased.com///">
          <img class="dark-hidden" alt="Developer friendly DevOps" src="/img/Cased_Logo_DarkBlue.svg" style="width:100%;max-width:250px">
          <img class="dark-visible" alt="Developer friendly DevOps" src="/img/Cased_Logo_Beige-01.svg" style="width:100%;max-width:250px">
        </a>
</div>
<div>
        <a data-github-account="llcorg" href="https://www.llc.org/">
          <img alt="How to start an LLC - a guide from LLC.org, proud open source sponsor" src="/img/llc-org.svg" style="width:100%;max-width:250px">
        </a>
</div>


<div>
        <a data-github-account="VPSServerCom" href="https://www.vpsserver.com/">
          <img class="dark-hidden" alt="VPS Server Hosting in the Cloud: Cost Efficiency" src="/img/vps-server-logo.svg" style="width:100%;max-width:250px">
          <img class="dark-visible" alt="VPS Server Hosting in the Cloud: Cost Efficiency" src="/img/vps-server-logo-dark.svg" style="width:100%;max-width:250px">
        </a>
</div>
<div>
        <a data-github-account="appleple" href="https://www.a-blogcms.jp/">
          <img src="/img/ablogcms_logo.svg" style="width:100%;max-width:250px">
        </a>
</div>
<div>
        <a data-github-account="CoverageCritic" alt="Find Internet Providers With Broadband Map" href="https://broadbandmap.com/">
           <img class="dark-hidden" src="/img/BroadbandMapLogo2LineLightMode.png" style="width:100%;max-width:250px">
           <img class="dark-visible" src="/img/BroadbandMapLogo2LineDarkMode.png" style="width:100%;max-width:250px">
        </a>
</div>


<div>
        <a data-github-account="upstatebreaker" href="https://buymybreaker.com/">
          <img class="dark-hidden" alt="Electrical Equipment - BuyMyBreaker.com" src="/img/bmb-light.svg" style="min-width: 80px" >
          <img class="dark-visible" alt="Electrical Equipment - BuyMyBreaker.com" src="/img/bmb-dark.svg" style="min-width: 80px">
        </a>
</div>
<div>
        <a data-github-account="Viralyft" alt="Buy YouTube views" href="https://viralyft.com/buy-youtube-views/">
           <img class="dark-hidden" src="/img/Viralyft_light.png" style="width:100%;max-width:250px">
           <img class="dark-visible" src="/img/Viralyft_dark.png" style="width:100%;max-width:250px">
        </a>
</div>
<div>
        <a data-github-account="Follower24" alt="Follower24" href="https://www.follower24.de/">
           <img class="dark-hidden" src="/img/follower_light.svg" style="width:100%;max-width:250px">
           <img class="dark-visible" src="/img/follower_dark.svg" style="width:100%;max-width:250px">
        </a>
</div>


<div>
    <a data-github-account="ExchangeRate-API" alt="The Accurate & Reliable Exchange Rate API" href="https://www.exchangerate-api.com">
       <img class="dark-hidden" src="/img/exchange-rate-api.png" style="width:100%;max-width:250px">
       <img class="dark-visible" src="/img/exchange-rate-api-dark.png" style="width:100%;max-width:250px">
    </a>
</div>
<div>
        <a data-github-account="radioplusexperts" alt="Assignment Writing service" href="https://edubirdie.com/do-my-assignment">
           <img class="dark-hidden" src="/img/edubirdie-light.png" style="width:100%;max-width:250px">
           <img class="dark-visible" src="/img/edubirdie-dark.png" style="width:100%;max-width:250px">
        </a>
</div>
</div>

<div style="text-align: center;font-style: italic;margin-top: 26px;">ʕ •ᴥ•ʔ made in montana</div>
