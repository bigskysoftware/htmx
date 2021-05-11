---
layout: layout.njk
title: </> htmx - high power tools for html
---

## htmx Talk

[htmx discord server](/discord)

## Features & Bug Reports

[https://github.com/bigskysoftware/htmx/issues](https://github.com/bigskysoftware/htmx/issues)

## Social

[@htmx_org on Twitter](https://twitter.com/htmx_org)
[#htmx on Stack Overflow](https://stackoverflow.com/questions/tagged/htmx)

## Sponsor

<iframe src="https://github.com/sponsors/bigskysoftware/card" title="Sponsor bigskysoftware" height="225" width="600" style="border: 0;"></iframe>

<div class="row">
<div class="1 col">

## Atom Feed (Announcements & Essays)

[feed.xml](/feed.xml)

## Announcements

<ul> 
{%- for post in collections.post reversed -%}
  <li><a href="{{ post.url  }}">{{ post.date | date: "%Y-%m-%d"}} - {{ post.data.title }} </a>🔥🔥</li>
{%- endfor -%}
</ul>
</div>
<div class="1 col">

## Essays

* [Locality of Behavior (LoB)](/essays/locality-of-behaviour)
* [Complexity Budget](/essays/complexity-budget)
* [SPA Alternative](/essays/spa-alternative)

</div>
</div>


