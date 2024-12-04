---
layout: blog_post 
nav: blog
---

About a year ago, intercooler.js [made it to the top of HN](https://news.ycombinator.com/item?id=12885980).  I had been 
shilling intercooler pretty hard on HN for over a year and was very relieved to stop when this happened. I don't enjoy doing
PR work & annoying people: I'd rather be writing code.

Unfortunately a bit of PR is necessary for any project, especially one that isn't backed by a big tech company, so I've put together
a list of reasons you might consider intercooler for a project in 2018.  

If you find intercooler interesting, please 
consider sharing this post with your friends and, if you haven't [giving it a star on Github](https://github.com/intercoolerjs/intercooler-js).

Thank you!

### Introduction

Intercooler is basically HTML++: it lets you add AJAX to a web page using only HTML attributes.  It generalizes
the anchor/form mechanism in HTML for triggering HTTP requests, allowing any element and/or event to cause a request and
replace (target) any part of the page.  

The [docs](http://intercoolerjs.org/docs.html) and 
[examples](http://intercoolerjs.org/examples/index.html) are quick reads and give you a good idea how the library works.

There is a good theoretical basis for using intercooler: because network communication is HTML, a hypertext, it
naturally satisfies REST/HATEOAS.  I think intercooler is one of the best ways to implement a REST-ful web application
available, if you are interested in that type of architecture.  You can read a more on this in the
['Rescuing REST'](http://intercoolerjs.org/2016/01/18/rescuing-rest.html) and 
['HATEOAS is for Humans'](http://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html)
blog posts.

### A Few Reasons To Try Intercooler

With that introduction out of the way, here are a few reasons you might consider using intercooler for a project (or
part of a project) this year:

* **Intercooler is incremental** - It would be difficult for getting started with intercooler to be simpler; a single 
  HTML attribute is enough to add AJAX functionality to a web application:
  
  `<a ic-post-to="/click"> Click Me! </a>`
  
  This means you can add it to an existing web application with very little commitment, adding as much or little AJAX
  as you like at the pace you are comfortable with, and in the places that add the most value.

* **Intercooler scales well** - Because browsers are fast at swapping HTML into the DOM, and because intercooler is
  symmetric with the way traditional web applications worked, properly built intercooler-based applications can take
  advantage of many of the tools used to scale traditional web applications (e.g. HTTP caching headers).

* **Intercooler is language agnostic** - Since it is based on HTML, intercooler doesn't put pressure on you to use any 
  particular back end language.  You can use whatever language and stack you are comfortable with that best addresses
  the problem you are working on.

* **Intercooler trivially satisfies REST** - Again, since intercooler uses HTML, your web applications naturally satisfy
  the [REST-ful architectural constraints](https://en.wikipedia.org/wiki/Representational_state_transfer) (Particularly 
  [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS)) without you really needing to think about it.  REST is the unique, 
  native architecture of the web, and many of its advantages are being lost as people adopt client/server models.

* **Intercooler makes it easy to show request indicators** - It can be very frustrating working with many modern web 
  applications because they don't make it clear when a request is in flight.  Intercooler has simple support for 
  [progress indicators](http://intercoolerjs.org/docs.html#progress) and also makes it easy to take advantage of CCS
  transitions during [requests](/docs.html#transitions) or based on [timing](/docs.html#client-side).

* **Intercooler makes it easy to implement history** - Adding history and back-button support can be done by 
   [adding two attributes to your application](/docs.html#history), giving you nice, copy-and-paste-able semantic 
   URLs in your AJAX-based application. Because intercooler applications are stateless on the client side 
   (for the most part) a user can refresh a page and not lose everything, just like the old days.  :)

### Conclusion

I hope you find some of these reasons to look at intercooler compelling and decide to give it a try in 2018.  It obviously
goes against the grain of a lot of web development being done today and it certainly isn't right for every project, but 
I think there are some real advantages to its approach for many web applications.

Again, if you like what you see, please consider sharing this article with your friends to help me get the word out.

Thank you and good luck in 2018!