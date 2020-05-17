---
layout: layout.njk
title: </> htmx - high power tools for html
---

## Htmx Talk

Right now the best place to talk about htmx is the [intercooler gitter room](https://gitter.im/intercooler-js/Lobby)

I'll be setting up a forum and chat room at some point.

## Features & Bug Reports

[https://github.com/bigskysoftware/htmx/issues](https://github.com/bigskysoftware/htmx/issues)

## Twitter

[@htmx_org](https://twitter.com/htmx_org)

## Blog & Announcements
<div>
<ul> 
{%- for post in collections.post reversed -%}
  <li><a href="{{ post.url  }}">{{ post.date | date: "%a, %b %d, %y"}} - {{ post.data.title }}</a>🔥🔥</li>
{%- endfor -%}
</ul>
</div>



