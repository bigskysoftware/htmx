+++
title = "Does Hypermedia Scale?"
date = 2023-11-06
updated = 2023-11-06
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

One objection that we sometimes hear to htmx and hypermedia is some variation of the following:

> Well, it might work well for something small, but it won't scale.
 
It is always dangerous to provoke us with essay-fodder and so lets dig into this claim a bit and see if we can
shed some light on whether [Hypermedia-Driven Applications](@/essays/hypermedia-driven-applications.md) (HDAs) can scale.

## Scaling

First of all, let's define the term "scaling" and then the contexts that word can be used in development. In a software
context, scaling typically means the ability of the software to handle "larger" things.  Those things can be:

* More nodes in a general [system](https://hypermedia.systems)
* More user requests (scaling your individual applications performance)
* More features  (scaling your codebase) 
* More _complex_ features 
* More developers (scaling your team size)

Each of these sense of the word "scaling" demand their own analysis with respect to HDAs.

## Scaling Nodes In General

Although this isn't of much interest to individual developers making decisions about their own applications, it is worth
stating that The Web has scaled _incredibly well_ as a distributed networking system.  It is the most successful
distributed system that I am aware of, in any event.

This is not necessarily of interest to an _individual_ application developer, but it sets the proper tone: hypermedia
can scale.

## Scaling Application Performance

Does hypermedia scale well with _performance_?  To answer this question, lets first look at some of the characteristics 
of performance-scalable software.  While there is no authoritative source for these characteristics, most engineers
with experience scaling software will agree that most of the items on this list are at least helpful:

* Software should be _stateless_
* Software should support _horizontal scaling_
* Features in the software should be _independent_
* The performance of the system should be _observable_
* The software should utilize caching

It turns out, happily, that properly designed hypermedia systems can have all these characteristics.

Statelessness is [a constraint of the REST-ful architecture](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_3)
that Roy Fielding created to describe the web.  In practice, many hypermedia-driven applications use a _session cookie_
to manage a small amount of state on the server side, but this is a well-understood technique that hasn't proven fatal
in scaling applications.

Horizontal scaling has a long history in hypermedia-driven applications and dovetails with the stateless nature of most 
hypermedia-driven applications: early PAAS vendors like [heroku](https://www.heroku.com/) (of blessed memory) offered 
easy horizontal scaling of rails-driven applications, for example.

Feature independence is another strength of HDAs.  In HDAs, end-points for screens tend to be
[_decoupled_](@/essays/two-approaches-to-decoupling.md) from one another in a way that general JSON APIs are not.  This
means that those endpoints can be monitored, evolved and be tuned independently of one another. We have a long history of 
tuning these sorts of endpoints to create sub-100 millisecond response times (e.g. minimizing database queries for a
given end-point by SQL tuning.)

Building on the independence of end-points to support various views, platform performance is easy to monitor and 
understand.  Rather than a generalized JSON API that can be accessed in multiple ways across your application, you have
UI specific end-points that construct hypermedia for specific views.  Determining what is causing a performance issue
becomes much easier when views are constructed on the server-side and requests are driven through simple hypermedia
exchanges.

Finally, web applications have a long and storied history of [caching](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_4).
HTTP offers caching at the browser, controlled by headers.  Mature server side frameworks like Rails offer sophisticated
caching at the controller layer.  Caching is second nature for HDAs.

All of these combine to make HDAs extremely scalable from a performance perspective.  Battle-tested performance techniques
are available for scaling your HDA as user load increases.

Does the HDA approach push more computation onto the server side?  To an extent, this is true.  However, the difference
between the JSON representation for a given resource and the HTML representation for it is not nearly as large as some
people think, particularly if you don't include the header and footer information in HTML requests, as is common in
htmx-based applications.  Network latency and datastore-access typically dominates request time anyway, and the ability
to use SQL (or a similar server-side query language) gives you an opportunity to optimize that aspect of the request.

HDAs also typically have the optimal ["one request per view"](https://twitter.com/htmx_org/status/1721750496086798378) 
naturally since, well, in HDAs the requests *are* your views.

## Scaling With # Of Features

Because HDAs tend to have independent end-points driven by UI needs, rather than a general JSON data API, scaling with 
the number of features is typically very easy.  Assuming a reasonable Model-View-Controller split on the server side, 
Controllers and Models tend to be very independent of one another.  When features truly overlap, having the features 
developed and tested on the server-side provides a more controlled and testable environment.

Views can achieve reuse via server-side includes, found in nearly all server-side templating libraries, or be maintained
separately in order to avoid interdependencies.

All of this is to say that, with reasonable application architecture, HDAs often scale _very well_ with the # of 
features in an application, especially when those features are inherently decoupled from one another.

## Scaling With Complexity Of Features

Scaling with the # of features is at some level akin to _horizontal scaling_: so long as they are relatively independent
they will scale fine (and if they aren't, HDAs will still often scale as well as or better than other options.)

But what about _deep_ features: features that are complex _in themselves_?

Here we must split the deep features into two categories:

* Server-side deep features
* Client-side deep features

For deep server-side features, HDAs are often a great choice.  A good example of this is something like an AI chat-bot:
this is a very sophisticated server-side feature, but it interacts with the user via a simple textual interface.  Many
[AI chat-bots](https://www.sliceofexperiments.com/p/building-a-personalized-ask-me-anything) have been built using 
htmx, with people remarking on how simple it is.

For deep _client-side_ features, HDAs are sometimes _not_ a great choice.  We outline details on this in our essay on
[when to choose hypermedia](@/essays/when-to-use-hypermedia.md).  To summarize that article: if your UI requires responding to a large number of events
quickly (e.g. dragging a map-view) or has significant inter-UI dependencies that cannot be updated in a bulk hypermedia
exchange (e.g. a spreadsheet application), the hypermedia approach isn't going to work well

However, we would note two things:

* It is often possible to _wrap_ more complex front-end behavior within an HDA application, integrating via events. 
* Sometimes it is better to [say "No"](https://grugbrain.dev/#grug-on-saying-no) to complex front-end features, or at
  least consider if a simpler implementation is acceptable that doesn't entail the additional complexity typically 
  found with complex front end frameworks.

## Scaling The Team

The final sense of scaling we will consider is the idea of scaling a development team.  Here we must rely on more
subjective and anecdotal measures, unfortunately.

It is our experience (and the experience of others) that HDAs seem to allow you to accomplish more with _fewer_ developers.
They also eliminate the front-end/back-end split, and the communication friction of this split,
since developers become responsible for entire features.  Some people _like_ the front-end/back-end split and feel
this allows teams to scale better by making the teams independent.

We do not agree.  We think that the front-end and back-end of most web applications are _inherently coupled_ and, therefore,
the best approach is to adopt an architecture that accepts this coupling and is designed to handle change well, which
the hypermedia approach is (via the uniform interface.)

Can HDAs scale to teams of 100 or more?  This we can't answer because we haven't seen this scenario.  But it can certainly
scale into the 10s.  We can _imagine_ the approach scaling much higher (it did during the web 1.0 era, after all) but
at this point we are speculating.

We prefer smaller teams anyway.  10 developers should be enough for any application.

## Conclusion

So, taking these all together, we have the following conclusion regarding scaling Hypermedia-Driven Applications:

HDAs can scale very well with respect to performance and feature count.  They *can* scale with feature complexity,
with caveats.  And, finally, the jury is still out on scaling with team size, although we can say that the HDA approach
tends to keep teams smaller and eliminate inter-team communication friction.
