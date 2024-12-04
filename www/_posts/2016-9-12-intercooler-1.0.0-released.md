---
layout: blog_post
nav: blog
---

## A Long Road

At long last, I'm very happy to announce the release of intercooler v1.0, available from the [downloads](/download.html)
page, as well as Bower and NPM.

I created intercooler almost [three years ago](https://github.com/intercoolerjs/intercooler-js/commit/62d3dbdb5c056ee866aba3575e148de649fc3efe),
inspired by the [turbolinks](https://github.com/turbolinks/turbolinks) and [pjax](https://github.com/defunkt/jquery-pjax)
projects.  I wanted a general, client-side library that opened up all the functionality of the web, based on the 
following core idea:

> Many, perhaps most, web applications are better written using a declarative, HTML-driven approach
> that keeps business logic and HTML rendering on the server side.

Since the original release, having used intercooler now in large, complex web applications, I've become ever more convinced of 
the [validity and advantages of this idea](/2016/02/17/api-churn-vs-security.html).  I've also come to understand the deep relationship between 
[REST](/2016/01/18/rescuing-rest.html), [HATEOS](/2016/05/08/hatoeas-is-for-humans.html) and HTML, and how intercooler 
facilitates this style of development, far better than JSON APIs can.

## My Favorite Features

Looking back at the many [features](/docs.html) have been introduced in intercooler, here are a few of my favorites:

### Request Indicators

It seems like such a simple thing, but having an indicator when an AJAX request is in flight is such a great
basic bit of usability in web applications.  While other features are certainly "cooler" I think this one
is perhaps one of the most important.

### Server-side triggering of client-side events

I try not to be doctrinaire on technical matters and I knew from experience that there were going to be times when 
HTML DOM swaps *wasn't* going to be the best way to handle things: I would need to kick be able to kick out to javascript.  
I tried a few different approaches to this problem, before finally introducing the 
`X-IC-Trigger` [response header](/docs.html#responses), allowing the server to trigger client-side javascript events.  

It was a revelation: it allowed me to introduce client side code where the UI demanded it, but keep it
clean and compartmentalized from the business logic of my application.  It takes a huge amount of feature pressure off 
the main intercooler library to have this mechanism, allowing me to keep the library focused.

### History support

The history API in browsers is [pretty terrible](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Example) to 
work with.  Intercooler makes using it only [a few attributes](/docs.html#history), so easy even *I* can used it.

That's very cool.

## The Future &amp; Spirit of Intercooler

Intercooler is at an interesting point: I view it as a largely complete library.  Perhaps this is arrogance, but I 
think I got the basic idea right, and the implementation at least right enough.  I don't expect any major rewrites,
but rather to polish it, fix bugs that come up and perhaps add declarative support for some 
[more exotic web features](https://github.com/intercoolerjs/intercooler-js/issues/104).  

So that means there will not be constant activity and churn on the project, but rather a [stewardship](http://goo.gl/sNBng6)
relationship.  This is in contrast with the software industry in general, which is always looking for the new new thing,
and the front end world in particular, which is currently an almost 
[comical exaggeration](https://medium.com/@ericclemmons/javascript-fatigue-48d4011b6fc4#.88el9uljo) of this tendency.

So I'll be here, writing about intercooler on the blog, improving the [docs](/docs.html) and [examples](/examples/index.html), 
maybe adding [tests](https://github.com/intercoolerjs/intercooler-js/blob/master/test/unit_tests.html), but mainly trying to 
avoid screwing it up.  You can use it, knowing that there won't be major changes in semantics or the API and that
your code will continue to work a decade (or more) from now.  

A sturdy, quiet alternative in a web development world of noise and complexity.  I'm happy with that.

I hope that you will give it a try and, if you do, I hope that you find it useful.
 
🍺

Carson / [@carson_gross](https://twitter.com/carson_gross)