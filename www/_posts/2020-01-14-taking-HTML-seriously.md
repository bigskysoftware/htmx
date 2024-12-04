---
layout: blog_post
nav: blog
title: Taking HTML Seriously
---

## HTML, The Water We Swim In

HTML isn't often discussed as a technology in it's own right these days.  This isn't because it has fallen out of use, of
course, but rather because it is ubiquitous.  ["Fish don't know they're in water."](https://sivers.org/fish)

Because it is so ubiquitous (and maybe because it is so easy) it is unappreciated.  Or, at least, under-appreciated.  I'd
like to start this new decade by taking a look back at this technology and, in particular, [REST](https://en.wikipedia.org/wiki/Representational_state_transfer).
REST is [Roy Fielding](https://en.wikipedia.org/wiki/Roy_Fielding)'s technical description of the new web architecture, of
which HTML, as a hypertext, was a crucial component.  

If you are familiar with REST, you have probably heard of it discussed in a JSON API context, rather than in an HTML web application 
context.  This is unfortunate, because it obscures what REST is.  Let's look at the idea of REST (and [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS)) 
in its native format: some HTML, displaying a simple data record (in this case, a contact.)

<pre>
  &lt;div>
    &lt;div>
      Name: Joe Blow
    &lt;/div>
    &lt;div>
      Email: joe@blow.com
    &lt;/div>
    &lt;div>
      &lt;a href="/contacts/42/edit">Edit&lt;/a>
      &lt;a href="/contacts/42/email">Email&lt;/a>
      &lt;a href="/contacts/42/archive">Archive&lt;/a>
    &lt;/div>
  &lt;/div>
</pre>

This should be easy to understand &amp; pedestrian HTML for web developers.  So, what makes this HTML/hypertext
special?  The answer is also simple: this bit of HTML encodes both the data
about the contact **as well as the actions available on that data**, in the form of hyperlinks.

Contrast this with a thick client, such as a standard mobile application. For a standard thick client a specific "Contacts" screen 
must be built, with the actions on that data already encoded into the UI. The UI simply retrieves the data and then 
renders it locally, with the actions defined locally.  To do something new you will need a new version of the application.

In the HTML example, all the data **and actions** on the data are encoded in the hypertext.  The client (a browser) doesn't
know anything about the data, it just knows how to render hypertext.   A technical way to say this is that we are using 
 Hypertext As The Engine Of the Application State.  This is where the acronym HATEOAS came from.

## State of The Art Today: JSON

Today many people are building web applications that re-introduce the thick client model into web development.  
They use react or a similar technology that then speaks to a JSON-based data API.  

The JSON APIs often ape REST-ful conventions.  Some even try to implement HATEOAS. This is a category error: JSON is not 
a hypertext and, therefore, it is unnatural, difficult and, typically, pointless to build a REST-ful API using it.  
Developers find it [frustrating](https://www.jeffknupp.com/blog/2014/06/03/why-i-hate-hateoas/), and 
[Roy does too](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven).

## The Fatal Flaw of HTML

So how did we end up here, shoe-horning REST/HATEOAS from it's natural environment (HTML/Hypertext) into JSON apis?

To answer that, we need to answer why people started using JSON and client side heavy javascript in the first place.

The harsh reality is that HTML never got to the point that it could, by itself, offer UX approaching the 
thick client.   Pure server-side rendered HTML offered only a simple &amp; clunky 
Click &rarr; Request &rarr; Page Render model.  For reasons I can't completely understand, HTML never moved beyond 
this extremely basic UX model.

Developers and users, understandably, wanted better usability than that.  Developers reached for the only tool 
available: javascript and AJAX.  This was a pragmatic move, but unfortunately it made REST difficult and tedious, rather 
than natural and helpful.
 
## Some HTML-Oriented Solutions

There are a few against-the-grain libraries that address this problem from within the context of the original, HTML driven model: 
[Turbolinks](https://github.com/turbolinks/turbolinks), [pjax](https://github.com/defunkt/jquery-pjax) and 
[intercooler.js](http://intercoolerjs.org/) are the three I am most familiar with.  All of them use HTML, rather than JSON
for their client/server communication, and all of them address the clunkiness the Click &rarr; Request &rarr; Page Render model.

With intercooler, in particular, I tried to stay as close to the original HTML model as possible, using hypertext attributes to drive 
everything,  while opening up the remainder of the web architecture (e.g. AJAX, various DOM events, various HTTP Actions.)  
You can see what pure (or nearly pure) HTML [can accomplish with intercooler here](https://intercoolerjs.org/examples/index.html).

It isn't perfect for every application, but you might try it out and see how it goes.  You might be surprised at how
much it can simplify your web application development environment, and how natural the original REST architecture
feels once you get back into it.

## Conclusion

HTML was a crucial aspect of the original model of the web, not just on the client side, but at the network data
format level.  Many developers now view HTML as a client-side only language and are unaware of the benefits of using it 
for a network format.  I hope after reading this article you better appreciate the difference between JSON and HTML
in terms of REST and why you might want to try using HTML as your application's network data format.

HTML is pretty cool.

## Further Reading

Intercooler is a slow-moving project.  It works reasonably well and I plan on gentle evolution going forward.
Since there isn't constant activity and point releases on it, it's easy to think it's a dead or dormant project, but
it isn't: it is being used by quite a few people, very happily.  

If you liked this article, you might find the following older posts interesting:

* ['Rescuing REST'](https://intercoolerjs.org/2016/01/18/rescuing-rest.html)
* ['HATEOAS is for Humans'](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html) 
* ['API Churn vs. Security'](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html) 

Instawork [liked intercooler so much](https://engineering.instawork.com/iterating-with-simplicity-evolving-a-django-app-with-intercooler-js-8ed8e69d8a52)
they went ahead and built a similar (and far more advanced!) technology for mobile development:

* [https://hyperview.org](https://hyperview.org)
