---
layout: blog_post 
nav: blog
---

Intercooler is a funny sort of javascript library - when you use it, you often don't end up writing all that much javascript.  
Because of this, people sometimes  dismiss it as [an older way](http://2.bp.blogspot.com/-KYftkSiFvq4/T9VUCZ1iAiI/AAAAAAAABz4/H3pOtXlT7Kk/s1600/clinteastwood.jpg)
of building web applications, without digging into the library's many interesting features or its 
[underlying philosophy](https://upload.wikimedia.org/wikipedia/commons/9/98/Sanzio_01_Plato_Aristotle.jpg).

This is understandable: [life is short](https://austraalien.files.wordpress.com/2013/10/baby-yolo.jpg), the javascript 
world is [chaotic](http://www.breck-mckye.com/blog/2014/12/the-state-of-javascript-in-2015/) and intercooler is an
[idiosyncratic](https://betting.betfair.com/poker/goingagainstthegrain.png) entry in the market place.

Since it is easy to miss the advantages of intercooler when compared with libraries like Angular or React, in this post 
I will give you N good reasons you should at least look at intercooler in 2016, where N > 0.  

### Simplicity

Intercooler is very simple to get started with.  A single HTML attribute is enough to add AJAX functionality to a 
web application:

<pre>
  &lt;a ic-post-to="/click"> Click Me! &lt;/a>
</pre>

This is in contrast with most javascript frameworks, which demand far more code be written to accomplish anything.

Despite this initial simplicity, intercooler also scales quite well: the amount of intercooler in your application
will scale linearly with the amount of HTML in it, and with a very low constant.

This light footprint also allows intercooler be [retrofitted](http://www.dravenstales.ch/wp-content/uploads/2009/08/tifi-mmmpringles.jpg) 
into an existing application easily, without making a huge commitment to the library.

### Security

I don't see this discussed much, but the client-side browser is *not* a trusted execution environment.  All 
data from a browser environment should be verified on the server side, of course, and I would argue 
you should be concerned about domain logic *even being run* in an execution environment as chaotic and open as a browser.

An application built in intercooler keeps domain logic on the server side, in a 
[trusted](http://www.quickmeme.com/img/2a/2afb26e85dbd25d09c0275c619d04519e2b58d145e9a8b330935fdde74dab27b.jpg), secure environment.

### Language Openness

Because intercooler consists mostly of declarative annotations in HTML, it does not force you towards a particular server-side 
language or environment.  With larger footprint javascript frameworks,  you need to maintain a significant amount of javascript 
on the client-side, or share domain logic between both the client and server side, and there is a lot of pressure to 
adopt javascript on the server side as well as the client side, if only to standardize things.

Server-side javascript may be right for some people, but not everyone wants to or is even able to use it.  Intercooler's
attribute-driven approach takes this problem entirely off the table, leaving you to
[do what you want to do](https://s-media-cache-ak0.pinimg.com/736x/97/f0/9d/97f09d42e177e00e5c4dae7929ce774d.jpg), 
in the server environment best for you.

### REST-ful Friendliness

REST is somewhat controversial in development circles, particularly in the context of JSON APIs.  While I agree
with many of the criticisms of REST for JSON APIs, it turns out that REST-ful style thinking is *wonderful* when you are
designing web interfaces: it helps you produce clean, decoupled and stateless web applications that are easy to reason about and,
therefore, easy to maintain.  

Since web pages and sub-elements within it tend to be "final consumers" of data it is not 
necessary for them to be chatty over HTTP with a REST-ful URL scheme.  All complex data access is done, and tuned, on the 
server-side, against a data store using its natural tools, e.g. SQL.  Additionally, since HTML is being returned from
the server, developers can return both data *as well as the operations on that data (e.g. links, forms, etc.)*, rather than
just data, as with JSON.  This is powerful, deep feature of HTML, and a future guest blog-post will expand on this point.

Intercooler takes REST seriously, providing access to [most HTTP actions](/docs.html#core_attributes), using URL layouts 
to [determine dependencies](/docs.html#dependencies), etc.  In this context, REST-ful thinking works very well indeed.

### CSS Animations

CSS3 introduced [transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
finally bringing a standard, design-friendly way of adding visual effects to web pages.  Unfortunately the best way
to trigger transitions is to change classes on elements in the DOM, and this typically involves interleaving javascript
with event handling to add or remove classes.

Intercooler [standardizes the application of classes during AJAX requests and during HTML content swaps](/docs.html#transitions), 
making CSS transitions easy to wire in without explicit javascript.  Additionally, intercooler [provides tools](/docs.html#client-side) 
for declarative manipulation of classes based on timing or events.

All of this makes working with CSS transitions both intuitive and [easy](http://cdn.meme.am/instances/52877562.jpg).

### Easy History Support

Adding history and back-button support is literally as easy as [adding two attributes](/docs.html#history).  This means
you can use nice, clean, copy-and-paste-able semantic URLs for your app. And because intercooler applications are stateless 
on the client side (for the most part) a user can refresh a page and not lose everything.  Just like old times.

### Conclusion

Intercooler can be [deceptively simple](https://bodhitreepose.files.wordpress.com/2014/06/bruce-lee-simplicity-is-the-key-2-brilliance.jpg): 
you can build advanced interfaces in it using modern browser features like CSS3 transitions, HTTP headers, extended HTTP actions,
hierarchical dependencies, and DOM events, to name just a few.  It is also quite fun, once you get the hang of it.

So, [unfit citizens of web development](https://www.youtube.com/watch?v=F_d4VDDfjpA), heed my instruction: take a look 
at intercooler in 2016.  It might not be right [for every project](https://fir.sh/projects/jsnes/), but it would be a 
great alternative for many of them.