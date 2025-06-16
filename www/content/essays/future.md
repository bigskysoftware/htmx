+++
title = "The future of htmx"
description = """\
  In this essay, Carson Gross and Alex Petros discuss htmx's future direction and philosophy. They explain how the \
  project aims to emulate jQuery's success through API stability, minimal feature additions, and quarterly releases \
  while continuing to promote hypermedia-driven development and support the broader web development ecosystem."""
date = 2025-01-01
updated = 2025-01-01
authors = ["Carson Gross", "Alex Petros"]
[taxonomies]
tag = ["posts"]
+++

## In The Beginning...

htmx began life as [intercooler.js](https://intercoolerjs.org), a library built around jQuery that added behavior based
on HTML attributes. 

For developers who are not familiar with it, [jQuery](https://jquery.com/) is a venerable JavaScript
library that made writing cross-platform JavaScript a lot easier during a time when browser implementations were very
inconsistent, and JavaScript didn’t have many of the convenient APIs and features that it does now.

Today many web developers consider jQuery to be “legacy software.” With all due respect to this perspective, jQuery is 
currently used on [75% of all public websites](https://w3techs.com/technologies/overview/javascript_library), a number that dwarfs all other JavaScript tools.

Why has jQuery remained so ubiquitous?

Here are three technical reasons we believe contribute to its ongoing success:

* It is very easy to add to a project (just a single, dependency-free link)
* It has maintained a very consistent API, remaining largely backwards compatible over its life (intercooler.js works
  with jQuery v1, v2 and v3)
* As a library, you can use as much or as little of it as you like: it stays out of the way otherwise and doesn’t
  dictate the structure of your application

## htmx is the New jQuery

Now, that’s a ridiculous (and arrogant) statement to make, of course, but it is an *ideal* that we on the htmx team are
striving for.

In particular, we want to emulate these technical characteristics of jQuery that make it such a low-cost, high-value
addition to the toolkits of web developers. Alex has
discussed [“Building The 100 Year Web Service”](https://www.youtube.com/watch?v=lASLZ9TgXyc) and we want htmx to be a
useful tool for exactly that use case.

Websites that are built with jQuery stay online for a very long time, and websites built with htmx should be capable of
the same (or better).

Going forward, htmx will be developed with its *existing* users in mind.

If you are an existing user of htmx—or are thinking about becoming one—here’s what that means.

### Stability as a Feature

We are going to work to ensure that htmx is extremely stable in both API & implementation. This means accepting and
documenting the [quirks](https://htmx.org/quirks/) of the current implementation.

Someone upgrading htmx (even from 1.x to 2.x) should expect things to continue working as before.

Where appropriate, we may add better configuration options, but we won’t change defaults.

### No New Features as a Feature

We are going to be increasingly inclined to not accept new proposed features in the library core.

People shouldn’t feel pressure to upgrade htmx over time unless there are specific bugs that they want fixed, and they
should feel comfortable that the htmx that they write in 2025 will look very similar to htmx they write in 2035 and
beyond.

We will consider new core features when new browser features become available, for example we
are [already using](https://htmx.org/examples/move-before/) the experimental `moveBefore()` API on supported browsers.

However, we expect most new functionality to be explored and delivered via the
htmx [extensions API](https://htmx.org/extensions/), and will work to make the extensions API more capable where
appropriate.

### Quarterly Releases

Our release schedule is going to be roughly quarterly going forward.

There will be no death march upgrades associated with htmx, and there is no reason to monitor htmx releases for major
functionality changes, just like with jQuery. If htmx 1.x is working fine for you, there is no reason to feel like you
need to move to 2.x.

## Promoting Hypermedia

htmx does not aim to be a total solution for building web applications and services:
it [generalizes hypermedia controls](https://dl.acm.org/doi/pdf/10.1145/3648188.3675127), and that’s roughly about it.

This means that a very important way to improve htmx — and one with lots of work remaining — is by helping improve the tools
and techniques that people use *in conjunction* with htmx.

Doing so makes htmx dramatically more useful _without_ any changes to htmx itself.

### Supporting Supplemental Tools

While htmx gives you a few new tools in your HTML, it has no opinions about other important aspects of building your
websites. A flagship feature of htmx is that it does not dictate what backend or database you use.

htmx is [compatible with lots of backends](https://htmx.org/essays/hypermedia-on-whatever-youd-like/), and we want to
help make hypermedia-driven development work better for all of them.

One part of the hypermedia ecosystem that htmx has already helped improve is template engines. When
we [first wrote](https://htmx.org/essays/template-fragments/) about how “template fragments” make defining partial page
replacements much simpler, they were a relatively rare feature in template engines.

Not only are fragments much more common now, that essay
is [frequently](https://github.com/mitsuhiko/minijinja/issues/260) [cited](https://github.com/sponsfreixes/jinja2-fragments)
as an inspiration for building the feature.

There are many other ways that the experience of writing hypermedia-based applications can be improved, and we will
remain dedicated to identifying and promoting those efforts.

### Writing, Research, and Standardization

Although htmx will not be changing dramatically going forward, we will continue energetically evangelizing the ideas of
hypermedia.

In particular, we are trying to push [the ideas](https://dl.acm.org/doi/pdf/10.1145/3648188.3675127) of htmx into the
HTML standard itself, via the [Triptych project](https://alexanderpetros.com/triptych/). In an ideal world, htmx
functionality disappears into the web platform itself.

htmx code written *today* will continue working forever, of course, but in the very long run perhaps there will be no
need to include the library to achieve [similar UI patterns](https://htmx.org/examples) via hypermedia.

## Intercooler Was Right

At the [end of the intercooler docs](https://intercoolerjs.org/docs#philosophy), we said this:

> Many javascript projects are updated at a dizzying pace. Intercooler is not.
>
> This is not because it is dead, but rather because it is (mostly) right: the basic idea is right, and the implementation
at least right enough.
>
> This means there will not be constant activity and churn on the project, but rather
a [stewardship](https://en.wikipedia.org/wiki/Stewardship_\(theology\)) relationship: the main goal now is to not screw
it up. The documentation will be improved, tests will be added, small new declarative features will be added around the
edges, but there will be no massive rewrite or constant updating. This is in contrast with the software industry in
general and the front end world in particular, which has comical levels of churn.
>
> Intercooler is a sturdy, reliable tool for web development.

Leaving aside [the snark at the end of the third paragraph](https://www.youtube.com/watch?v=zGyAWH5btwY), this thinking
is very much applicable to htmx. In fact, perhaps even more so since htmx is a standalone piece of software, benefiting
from the experiences (and mistakes) of intercooler.js.

We hope to see htmx, in its own small way, join the likes of giants like jQuery as a sturdy and reliable tool for
building your 100 year web services.
