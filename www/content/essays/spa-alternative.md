+++
title = "SPA Alternative"
date = 2020-10-29
updated = 2022-02-06
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

Recently [Tom MacWright](https://macwright.com) has written a few posts on Single Page Applications and their discontents:

* [Second-guessing the modern web](https://macwright.com/2020/05/10/spa-fatigue.html)
* [If not SPAs, What?](https://macwright.com/2020/10/28/if-not-spas.html)

> The emerging norm for web development is to build a React single-page application, with server rendering. The two key 
> elements of this architecture are something like: 
>
>1. The main UI is built & updated in JavaScript using React or something similar.
>2. The backend is an API that that application makes requests against. 
>
> This idea has really swept the internet. It started with a few major popular websites and has crept into corners 
> like marketing sites and blogs.

In these two articles Tom lays out the problem associated with the React/SPA everywhere mindset.  If I can summarize 
them in one sentence: SPA frameworks tend to be complex, and you don't get a lot of benefit for all that
complexity in many cases.

## An Alternative

Tom outlines a few alternatives to the SPA approach in the second article and, I'm happy to say, mentions htmx.  However,
he classifies htmx (as well as [Stimulus](https://stimulusjs.org/) and [Alpine.js](https://github.com/alpinejs/alpine/))
as "progressive-enhancement" libraries.  This is a good description, but, at least in the case of htmx, I think there 
is a better term to help describe this style of library: *HTML-Centric* (or, perhaps, *Hypertext-Centric*)

### HTML-Centric Development

In HTML-Centric Development, rather than being an afterthought, HTML is embraced as the primary medium of application
development.  This is in contrast to most SPA frameworks, where a client-side model & the javascript that manipulates
it is the central focus.

HTML-Centric Development builds on the original model of the web, as outlined in 
[Roy Fielding's PhD dissertation](https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm), describing the web
architecture.  In particular, by embracing HTML as a hypertext, you get the benefits of 
[REST and HATEOAS](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm), all without needing to
be an expert in either of those topics.  

(Recall, Roy was *describing* the web architecture, so the original web was
largely REST-ful, without any particular effort on the part of the original participants)

By picking HTML-Centric Development, you accrue many benefits:

* A simpler front end allows you to save your [complexity budget](@/essays/complexity-budget.md) for the back end functionality
  that differentiates your application from others.
* You do not face pressure to adopt javascript on the back end "since the front end is written in javascript".  This allows
  you to use the best backend framework for your particular application.
* With a simpler front end, a "full stack" developer can more easily manage and optimize front-to-back optimization in 
  your application, leading to much better system tuning
* Your web application is going to have HTML in it anyway, so by maximizing its utility you are boosting the power of
  an existing component, rather than adding another layer of complexity between the end user and your application code.
* The stateless network model of the web has proven very resilient and easy to develop for.  Many mature and battle-tested
  technologies and techniques (e.g. [caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)) exist for 
  building HTML-based applications.

### HTML: The Bad Parts

With all these benefits of the HTML-Centric model, one may wonder why it has been abandoned (and is often mocked) by 
many web developers.  At a high level, the answer is: 

*HTML-Centric applications have historically offered a limited 
amount of interactivity when compared with javascript-based applications*.

This is in large part because HTML is a limited hypertext.  In particular:

* Only `<a>` and `<form>` can make HTTP requests
* Only `click` & `submit` events can trigger them
* Only GET & POST [HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) are widely available
* A request must replace the entire screen, leading to a clunkly and sometimes jarring user experience

Of course, none of the constraints are inherent in the concept of a hypertext, and the goal of [htmx](@/_index.md)
is to remove each of them.

By removing these constraints and completing HTML as a fully-functional and high-powered hypertext, HTML-Centric 
applications can compete with SPAs in many application domains, while at the same time accruing the technical
and complexity benefits mentioned above.

## Being Brave, Technically

Tom closes his first article with this:

> What if everyone’s wrong? We’ve been wrong before.

Web development has gone down blind alleys quite a few times: GWT, Java Server Faces, Angular 1, FlatUI, etc.  
During the height of the hype cycle around each of these technologies, it was difficult to go against the grain.  It is 
particularly difficult to do in the technology world , where the being left behind technically is not only a threat to 
our ego, but also to our employment.  

> "No One Ever Got Fired For Using React"

is today's 

> "No One Ever Got Fired For Buying IBM"

That's a reality that we must accept, even if we feel that React/etc. aren't appropriate for many (or even most) web
applications being built today.  

However, we are starting to see a reconsideration of the SPA approach.  With a bit of technical bravery, a willingness
to stand against the crowd, you may be able to make your application much less complex, and focus your development
efforts on what your application does, rather than on how it does it.

From the [htmx developer's starter kit](https://twitter.com/htmx_org/status/1306234341056344065):

![What if?](/img/what_if.png)
