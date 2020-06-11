---
layout: layout.njk
title: </> htmx - high power tools for html
---

## htmx Talk

Right now the best place to talk about htmx is the [intercooler gitter room](https://gitter.im/intercooler-js/Lobby)

I'll be setting up a forum and chat room at some point.

## Features & Bug Reports

[https://github.com/bigskysoftware/htmx/issues](https://github.com/bigskysoftware/htmx/issues)

## Twitter

[@htmx_org](https://twitter.com/htmx_org)

<div class="row">
<div class="1 col">

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

</div>
</div>


