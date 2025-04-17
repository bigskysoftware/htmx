+++
title = "A Real World wasm to htmx Port"
description = """\
  In this article, Joe Fioti describes their journey of simplifying their web application architecture by moving from \
  a complex WebAssembly-based system to a streamlined htmx solution, resulting in significantly reduced code \
  complexity and improved development efficiency."""
date = 2025-01-10
updated = 2025-01-10
authors = ["Joe Fioti"]
[taxonomies]
tag = ["posts"]
+++

<style>
img, video {
  max-width: 100%;
  margin: 10px;
}
</style>

When I was in college, I wrote some customer service software that tied together some custom AI models I trained, the OpenAI API, a database, and some social media APIs to make the first version of [Sidekick](https://sidekickai.co).

## Led astray

Over the next couple years I worked on adding more features and growing the user base. As a solo founder, I should have been focused on sales, marketing, and market discovery. Instead, as an engineer, I wanted to hand-craft the perfect web stack. I was firmly of the belief that the network gap between the frontend and the backend could be abstracted away, and I could make writing web apps as simple as writing native apps. Did this have anything to do with my business, product, or customers? Absolutely not, but as many technical founders do, I believed if I perfected the tech, the customers would materialize.

My design decisions were naive, but also reminiscent to what's seen in industry today: I wanted the backend and frontend to share a language (Rust), I wanted compile-time checks across the network boundary, I wanted to write frontend code like it was an app (reactive), and I wanted nearly instant reload times. What I got out of it was a buggy mess.

I had invented a system where simple rust functions can be tagged with a macro to generate a backend route and a frontend request function, so you can call the function like it was a standard function, and it would run on the backend. A true poor-mans GraphQL. My desire to write Rust on the frontend required I compile a WASM bundle. My desire for instant load times required isomorphic SSR. All of this complexity, for what was essentially a simple CRUD site.

## A better way

At this point Sidekick has grown and it now has a codebase which is responsible for not-insignificant volumes of traffic each day. There was this point where I looked into HTMX, multi-page websites, and HATEOAS, and realized the Sidekick codebase, which had grown into ~36k lines spread over 8 different crates, could be folded into a single crate, a single binary that ran the backend, which generated the frontend on demand through templating, and that HTMX could suffice for all the interactivity we required.

Large refactors typically have a bad track record so we wrote a quick and dirty simplified version of part of the site to convince ourselves it could work. After sufficient convincing, we undertook a full rewrite. All said and done, the rewrite took approximately 3 weeks of intense work. The results were dramatic:

- **36k LOC -> 8k LOC**
- **8 crates -> 1 crate**
- **~5 bug reports / week -> ~1 bug report / week**
- **More full nights of sleep**

![sidekick_port_loc.jpg](/img/sidekick_port_loc.jpg)


The rewrite went far better than I could have imagined. It definitely won't be representative of every experience, our app was definitely uniquely suited to HTMX. Axum and some custom middleware also went a long way for sharing common infrastructure across the site. Though we don't have proper metrics, we've anecdotally noticed significantly improved load times.

## Reflection

I'll finish by touching on the biggest benefit in my eyes: it's tremendously easier to add new features as our customers request them. A feature that would have taken 2 weeks to fully implement, test and ship, now takes a day or two. As a small startup with a large number of customer demands, this is table stakes.

Sidekick hasn't raised VC funding so I can't afford to hire lots of devs. With HTMX we don't need to.
