---
layout: layout.njk
title: </> htmx - high power tools for html
---

## htmx Talk

[htmx discord server](/discord)

## Feature Requests & Bug Reports

[https://github.com/bigskysoftware/htmx/issues](https://github.com/bigskysoftware/htmx/issues)

## Social

[@htmx_org on Twitter](https://twitter.com/htmx_org)

[#htmx on Stack Overflow](https://stackoverflow.com/questions/tagged/htmx) Please send  us the URL via Discord after creating the question.

[r/htmx on reddit](https://www.reddit.com/r/htmx/)

## Sponsor

<iframe src="https://github.com/sponsors/bigskysoftware/card" title="Sponsor bigskysoftware" height="225" width="600" style="border: 0;"></iframe>

<div class="row">
<div class="1 col">

## Atom Feed (Announcements & Essays)

[feed.xml](/feed.xml)

## Announcements

<ul> 
{%- for post in collections.announcements reversed -%}
  <li><a href="{{ post.url  }}">{{ post.date | date: "%Y-%m-%d"}} - {{ post.data.title }} </a>🔥🔥</li>
{%- endfor -%}
</ul>
</div>
<div class="1 col">

## Essays

* [Locality of Behavior (LoB)](/essays/locality-of-behaviour)
* [Complexity Budget](/essays/complexity-budget)
* [SPA Alternative](/essays/spa-alternative)

## Podcasts

* [Devmode.fm - Dynamic HTML with htmx](https://devmode.fm/episodes/dynamic-html-with-htmx)
* [JS Party - Less JavaScript more htmx](https://changelog.com/jsparty/171)
* [Software Breakthroughs for the 21s Century](https://www.youtube.com/watch?v=O4ZFIx1ckSg)
* *Coming Soon* [Django Chat](#)
* *Coming Soon* [Python Bytes](#)

[Contact Us](mailto:podcasts@bigsky.software) to Join You on Your Podcast!

</div>
</div>


