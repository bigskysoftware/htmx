---
layout: core_layout.njk
title: HTMx - HTML Extensions
---

<div class="dark-hero">
  <span class="logo dark" kt-add-class="settle">&lt;<a>/</a>&gt; k<a>u</a>tty</span>
  <sub><i>high powered tools for HTML</i></sub>
</div>

<div class="c">

## Introduction

Kutty is a set of HTML extensions (attributes, request headers, etc.) that let you use markup to build 
[advanced UX](/demo) with the simplicity of the hypertext we all know and love. 

Kutty is a small (<6Kb min.gz'd), dependency-free & you can try it out quickly, without a huge rewrite.

## Quick Start

``` html
    <!-- Load from unpkg -->
    <script src="https://unpkg.com/kutty.org@0.0.1"></script>
    <!-- have a button POST a click via AJAX -->
    <button kt-post="/clicked" kt-swap="outerHTML">Click Me</button>
```

This annotation tells kutty:

> "When a user clicks on this button, issue an AJAX request to /example, and replace the button with the response"

Kutty is based on [intercooler.js](http://intercoolerjs.org) and is the successor to that project.

</div>