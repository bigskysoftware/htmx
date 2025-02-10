+++
title = "10 Tips For Building SSR/HDA applications"
description = """\
  In this guide, Carson Gross provides ten practical tips to help developers transition from Single Page Applications \
  (SPAs) to Server-Side Rendering and Hypermedia-Driven Applications, focusing on essential mindset shifts and \
  architectural advantages."""
date = 2022-06-13
updated = 2023-06-13
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

Building web applications using traditional Server-Side Rendering (SSR) or, saying the same thing another way, building 
[Hypermedia-Driven Applications](@/essays/hypermedia-driven-applications.md) (HDAs) requires a mindset shift when
compared with building web applications with Single Page Application frameworks like React.

If you come at this style of development with an SPA-engineering hat on, you are likely to be frustrated and miss out
on many advantages of this particular architectural choice.

Here are 10 tip to help you make the mental shift smoothly, taking advantage of the strengths of this approach and
minimizing the weaknesses of it:

### Tip 1: Maximize Your Server-Side Strengths

A big advantage of the hypermedia-driven approach is that it makes the server-side environment far more important when
building your web application.  Rather than simply producing JSON, your back end is an integral component in the user
experience of your web application.

Because of this, it makes sense to look deeply into the functionality available there.  Many older web frameworks have
incredibly deep functionality available around producing HTML.  Features like 
[server-side caching](https://guides.rubyonrails.org/caching_with_rails.html) can make the difference between an incredibly 
snappy web application and a sluggish user experience.

Take time to learn all the tools available to you.  

A good rule of thumb is to shoot to have responses in your application take less than 100ms to complete, and mature
server side frameworks have tools to help make this happen.

### Tip 2: Factor Your Application On The Server

Server-side environments often have extremely mature mechanisms for factoring (or organizing) your code properly.  The
[Model/View/Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) pattern is well-developed in
most environments, and tools like modules, packages, etc. provide an excellent way to organize your code.

Whereas SPAs user interfaces are typically organized via _components_, hypermedia-driven applications are typically 
organized via _template inclusion_, where the server-side templates are broken up according to the HTML-rendering needs 
of the application, and then included in one another as needed.  This tends to lead to fewer, chunkier files than you 
would find in a component-based application.

Another technology to look for are [Template Fragments](@/essays/template-fragments.md), which allow you to render only
part of a template file.  This can reduce even further the number of template files required for your server-side 
application.

### Tip 3: Specialize Your API End Points

Unlike a [JSON API](@/essays/hypermedia-apis-vs-data-apis.md), the hypermedia API you produce for your hypermedia-driven
application _should_ feature end-points specialized for your particular application's UI needs.  

Because hypermedia APIs are [not designed to be consumed by general-purpose clients](@/essays/hypermedia-clients.md) you 
can set aside the pressure to keep them generalized and produce the content specifically needed for your application.  
Your end-points should be optimized to support your particular applications UI/UX needs, not for a general-purpose 
data-access model for your domain model.

### Tip 4: Aggressively Refactor Your API End Points

A related tip is that, when you have a hypermedia-based API, you can aggressively refactor your API in a way that is
heavily discouraged when writing JSON API-based SPAs.  Because hypermedia-based applications use [Hypermedia As The Engine 
Of Application State](@/essays/hateoas.md), you are able and, in fact, encouraged, to change the shape of them as your
application developers and as use cases change.

A great strength of the hypermedia approach is that you can completely rework your API to adapt to new needs over time
without needing to version the API or even document it.

### Tip 5: Take Advantage of Direct Access To The Data Store

When an application is built using the SPA approach, the data store typically lives behind a JSON API.  This level of
indirection often prevents front end developers from being able to take full advantage of the tools available in the
data store.  GraphQL can help address this issue, but comes with [security-related issues](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html) 
that do not appear to be well understood by many developers.

When you produce your HTML on the server side, on the other hand, the developer creating that HTML can have full access
to the data store and take advantage of, for example, [joins](https://www.sqltutorial.org/sql-left-join/) and 
[aggregation functions](https://www.sqltutorial.org/sql-aggregate-functions/) in SQL stores.

This puts far more expressive power directly in the hands of the developer producing the HTML.  Because your hypermedia
API can be structured around your UI needs, you can tune each endpoint to issue as few data store requests as possible.

A good rule of thumb is that every request should shoot to have three or fewer data-store accesses.

### Tip 6: Avoid Modals

[Modal windows](https://en.wikipedia.org/wiki/Modal_window) have become popular, almost standard, in many web applications
today.  

Unfortunately, [modal windows do not play well with much of the infrastructure of the web](https://youdontneedamodalwindow.dev/)
and introduce client-side state that can be difficult (though not impossible) to integrate cleanly with the hypermedia-based
approach.

Consider using alternatives such as [inline editing](https://htmx.org/examples/click-to-edit/), rather than modals.

### Tip 7: Accept "Good Enough" UX

A problem many SPA developers face when coming to the HDA approach is that they look at their current SPA application and
imagine implementing it _exactly_ using hypermedia.  While htmx and other hypermedia-oriented libraries significantly 
close the interactivity gap between hypermedia-based applications and SPAs, that gap still exists.

As Roy Fielding [said](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5) with respect
to the web's REST-ful network architecture:

> The trade-off, though, is that a uniform interface degrades efficiency, since information is transferred in a
> standardized form rather than one which is specific to an application's needs.

Accepting a slightly less efficient and interactive solution to a particular UX can save you a tremendous amount of
[complexity](@/essays/complexity-budget.md) when building a web application.

Do not let the perfect be the enemy of the good.

### Tip 8: When Necessary, Create "Islands of Interactivity"

At some point in your web application, there may come a point where the hypermedia approach, on its own, just doesn't
cut it.

A good example of this is re-ordering a list of things.  This can be done in "pure" hypermedia by clicking up and down
arrows or having order # drop-downs next to items.  (I am ashamed to admit I have built both of these!)

But this experience stinks compared to what people are used to: drag-and-drop.

In cases like this, it is perfectly fine to use a front-end heavy approach as an "Island of Interactivity".  

Consider the [SortableJS](@/examples/sortable.md) example.  Here you have a sophisticated area of interactivity that allows for
drag-and-drop, and that integrates with htmx and the broader hypermedia-driven application via events.

This is an excellent way to encapsulate richer UX within an HDA.

### Tip 9: Don't Be Afraid To Script!

Scripting is [explicitly a part of the web architecture](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7)
and developers adopting the hypermedia approach shouldn't be afraid to use it.  Of course there is scripting and then
there is scripting.

As much as possible, you should try to use the  [hypermedia-friendly scripting](@/essays/hypermedia-friendly-scripting.md)
approach, retaining hypermedia-exchanges as the primary mechanism for communicating system state changes with the
server.

Inline-style scripting, as enabled by [alpine.js](https://alpinejs.dev/) & [hyperscript](https://hyperscript.org) for example,
is worth exploring as well, as it refocuses your scripting on the hypermedia (HTML) itself and imposes an aesthetic 
constraint on just how much code you can write.

### Tip 10: Be Pragmatic

Finally, do not be dogmatic about using hypermedia.  At the end of the day, it is just another technology with its own
[strengths & weaknesses](@/essays/when-to-use-hypermedia.md).  If a particular part of an app, or if an entire app,
demands something more interactive than what hypermedia can deliver, then go with a technology that can.  

Just be familiar with [what hypermedia can do](@/examples/_index.md), so you can make that decision as an informed 
developer.

## Conclusion

Hopefully these tips help you adopt hypermedia and server-side rendering as a tool more effectively and smoothly.  It
isn't a perfect client-server architecture, and it involves explicit tradeoffs, but it can be extremely effective for
many web applications (far more than most web developers today suspect) and provides a much simpler overall development
experience in those cases.
