+++
title = "Alternatives to htmx"
description = """\
  In this article, Carson Gross compares several alternative libraries and frameworks to htmx that embrace a \
  hypermedia-oriented approach to web development. Carson explores established solutions like Unpoly and Hotwire \
  Turbo, as well as emerging projects like Triptych and htmz, providing developers with a comprehensive overview of \
  hypermedia-driven application development options beyond htmx."""
date = 2025-01-12
updated = 2024-01-12
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

[htmx](/) is only one of many different libraries & frameworks that take the
[hypermedia oriented](@/essays/hypermedia-driven-applications.md) approach to building web applications.  I have
said before that I think the [ideas of htmx](/essays) / [hypermedia](https://hypermedia.systems) are more important than
htmx as an implementation.

Here are some of my favorite other takes on these ideas that I think are worth your consideration:

## Unpoly

[Unpoly](https://unpoly.com/) is a wonderful, mature front end framework that has been used heavily (especially in the
ruby community) for over a decade now.  It offers best-in-class [progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
and has many useful concepts such as [layers](https://unpoly.com/up.layer) and sophisticated 
[form validation](https://unpoly.com/validation).

I interviewed the author, Henning Koch, [here](@/essays/interviews/henning_koch.md)

You can see a demo application using Unpoly [here](https://demo.unpoly.com/).

## Triptych

[Triptych](https://github.com/alexpetros/triptych) is a set of [three proposals](https://alexanderpetros.com/triptych/) 
to bring more generalized hypermedia controls directly into the HTML specification:

* Allow more [HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) to be used directly from HTML
* Allow buttons to act as stand-alone hypermedia controls
* Allow hypermedia controls to target any element on the page for replacement

It is [in the process](https://github.com/whatwg/html/issues/3577#issuecomment-2294931398) of being introduced to the 
[WHATWG](https://whatwg.org/) for inclusion in the HTML specification.

The project includes a [polyfill](https://github.com/alexpetros/triptych/blob/main/triptych.js) that can be used today
to implement applications using the proposal today.

## fixi.js

[fixi.js](https://github.com/bigskysoftware/fixi) is a minimalist implementation of
[generalized hypermedia controls](https://dl.acm.org/doi/fullHtml/10.1145/3648188.3675127) by the htmx team, focusing
on being as small as possible and [omitting](https://github.com/bigskysoftware/fixi#minimalism) many of the features 
found in htmx.

It is intended to be as small as possible (~3.5k unminified & uncompressed, ~1.3k compressed) while still being readable
and debuggable, so it can be included in a project directly without requiring any transformations.

## Datastar

[Datastar](https://data-star.dev/) started life as a proposed rewrite of htmx in typescript and with modern
tooling.  It eventually became its own project and takes an [SSE-oriented](https://data-star.dev/guide/getting_started#backend-setup)
approach to hypermedia.  

Datastar combines functionality found in both htmx and [Alpine.js](https://alpinejs.dev/) into 
a single, tidy package that is smaller than htmx.  

You can see many examples of Datastar in action [here](https://data-star.dev/examples).

## Alpine-ajax

Speaking of Alpine (which is a common library to use in conjunction with htmx) you should look at 
[Alpine AJAX](https://alpine-ajax.js.org/), an Alpine plugin which integrates htmx-like concepts directly into Alpine.

If you are already an Alpine enthusiast, Alpine AJAX allows you to stay in that world.

You can see many examples of Alpine AJAX in action [here](https://alpine-ajax.js.org/examples/).

## Hotwire Turbo

[Turbo](https://turbo.hotwired.dev/) is a component of the [Hotwire](https://hotwired.dev/) set of web development
technologies by [37Signals](https://37signals.com/), of [Ruby on Rails](https://rubyonrails.org/) fame.  It is a polished
front end framework that is used heavily in the rails community, but can be used with other backend technologies as well.

Some people who have had a bad experience with htmx [have enjoyed turbo](https://news.ycombinator.com/item?id=42615663).

## htmz

[htmz](https://leanrada.com/htmz/) is a brilliant, tiny library that takes advantage of the fact that anchors and forms
already have a [`target`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target) attribute that can target 
an `iframe`.

This, in combination with the `location hash`, is used to allow [generalized transclusion](https://dl.acm.org/doi/fullHtml/10.1145/3648188.3675127#sec-7).

This is the *entire* source of the library (I'm not joking):

```html
  <iframe hidden name=htmz onload="setTimeout(()=>document.querySelector(contentWindow.location.hash||null)?.replaceWith(...contentDocument.body.childNodes))"></iframe>
```

Amazing!

## TwinSpark

[TwinSpark](https://twinspark.js.org/) is a library created by [Alexander Solovyov](https://solovyov.net/) that is 
similar to htmx, and includes features such as [morphing](https://twinspark.js.org/api/ts-swap/#morph).

It is being [used in production](https://twinspark.js.org#who-is-using-this) on sites with 100k+ daily users.

## jQuery

Finally, good ol' [jQuery](https://jquery.com/) has the the [`load()`](https://api.jquery.com/load/#load-url-data-complete)
function that will load a given url into an element.  This method was part of the inspiration for 
[intercooler.js](https://intercoolerjs.org), the precursor to htmx.

It is very simple to use:

```javascript
  $( "#result" ).load( "ajax/test.html" );
```
and might be enough for your needs if you are already using jQuery.

## Conclusion

I hope that if htmx isn't right for your application, one of these other libraries might be useful in allowing you to
utilize the hypermedia model.  There is a lot of exciting stuff happening in the hypermedia world right now, and these
libraries each contribute to that.

Finally, if you have a moment, please give them (especially the newer ones) a star on Github: as an open source 
developer I know that Github stars are one of the best psychological boosts that help keep me going.

