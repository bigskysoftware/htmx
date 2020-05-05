---
layout: layout.njk
title: HTMx - HTML Extensions
---

## Introduction

HTMx is a small (<12Kb) &amp; dependency-free library that surfaces the features of modern browsers using HTML 
attributes.  Using HTMx you can implement many [UX patterns](/demo) that would typically require writing javascript.  

HTMx is unobtrusive, plays well with other tools, can be adopted incrementally with no up-front rewrites.

## Quick Start

``` html
    <!-- Load from unpkg -->
    <script src="https://unpkg.com/htmx.org@0.0.1"></script>

    <!-- enhance a button -->
    <button hx-get="/example">Click Me</button>
```

This code tells HTMx that:

> "When a user clicks on this button, issue an AJAX request to /example, and load the content into the body
>  of the button"

HTMx is based on [intercooler.js](http://intercoolerjs.org) and is the successor to that project.

