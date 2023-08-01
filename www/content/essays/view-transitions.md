+++
template = "demo.html"
title = "View Transitions"
date = 2023-04-11
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

We have asserted, for a while now, that a major reason that many people have adopted the SPA architecture for web applications
is due to aesthetic considerations. 

As we mention in our book [Hypermedia Systems](https://hypermedia.systems), when
discussing the Web 1.0-style contact management application we begin with, there are serious _aesthetic_ issues with
the application, even if it has feature-parity with an SPA version:

> From a user experience perspective: there is a noticeable refresh when you move between pages of the application, or when you create, update or
> delete a contact. This is because every user interaction (link click or form submission) requires a full page
> refresh, with a whole new HTML document to process after each action.
>
> *–Hypermedia Systems - [Chapter 5](https://hypermedia.systems/book/extending-html-as-hypermedia/)*

This jarring "ka-chunk" between webpages, often with a [Flash of Unstyled Content](https://webkit.org/blog/66/the-fouc-problem/)
has been with us forever and, while modern browsers have improved the situation somewhat (while, unfortunately, also making
it less obvious that a request is in flight) the situation is still bad, particularly when compared with what a well-crafted
SPA can achieve.

Now, early on in the life of the web, this wasn't such a big deal. We had stars flying around dinosaurs _in the browser's toolbar_,
flaming text, table-based layouts, dancing babies and so forth, and we were largely comparing the web with things like
ftp clients.

The bar was _low_ and the times were _good_.

Alas, the web has since put away such childish things, and now we are expected to present polished, attractive interfaces
to our users, _including_ smooth transitions from one view state to another.  

Again, we feel this is why many teams default to the SPA approach: the old way just seems... clunky.

## CSS Transitions

The early web engineers realized that web developers would like to provide smooth transitions between different view states
and have offered various technologies for achieving this. A major one is [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/transition),
which allow you to specify a mathematical _transition_ from one state to another.

Unfortunately for HTML, CSS transitions are only available if you use JavaScript: you have to change elements dynamically
in order to trigger the transitions, which "vanilla" HTML can't do. In practice, this meant that only the cool kids
using JavaScript to build SPAs got to use these tools, further cementing the _aesthetic superiority_ of SPAs.

htmx, as you probably know, makes CSS Transitions [available in plain HTML](https://htmx.org/examples/animations/) via
a somewhat elaborate [swapping model](https://htmx.org/docs/#request-operations) where we take elements that are in both
the old and new content and "settle" attributes on them. It's a neat trick and can be used to make hypermedia-driven
application feel as buttery-smooth as well done SPA.

However, there is a new kid on the block: [The View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions/)

## The View Transition API

The View Transition API is much more ambitious than CSS transitions in that it is attempting to provide a simple, intuitive
API for transitioning an _entire DOM_ from one state to another in a way that mere mortals can take advantage of. 

Furthermore, this API is supposed to be available not only in JavaScript, but also for plain old links and forms in HTML as well, 
making it possible to build _much nicer_ user interfaces using the Web 1.0 approach.

It will be fun to revisit the Contact application in "Hypermedia Systems" when this functionality is available!

As of this writing, however, the API is, like CSS Transitions, only available in JavaScript, and its only been just
released in Chrome 111+.

In JavaScript, The API could not be more simple:

```js

  // this is all it takes to get a smooth transition from one 
  // state to another!
  document.startViewTransition(() => updateTheDOMSomehow(data));

```

Now, that's my kind of API.

As luck would have it, it's trivial to wrap this API around the regular htmx swapping model, which allows us to
start exploring View Transitions in htmx, even before it's generally available in HTML! 

And, as of [htmx 1.9.0](https://unpkg.com/htmx.org@1.9.0), you can start experimenting with the API by adding the 
`transition:true` attribute to an [`hx-swap`](/attributes/hx-swap) attribute.

## A Practical Example

So let's look at a simple example of this new shiny toy coupled with htmx.  

Doing so will involve two parts: 

* Defining our View Transition animation via CSS
* Adding a small annotation to an htmx-powered button

### The CSS

The first thing that we need to do is define the View Transition animation that we want.

* Define some animations using @keyframes to slide and fade content
* Define a view transition with the name `slide-it` using the `:view-transition-old()` and `:view-transition-new()` pseudo-selectors
* Tie the `.sample-transition` class to the `slide-it` view transition that we just defined, so we can bind it to elements via a that CSS class name

(Fuller details on the View Transition API can be found on the [Chrome Developer Page](https://developer.chrome.com/docs/web-platform/view-transitions/)
documenting them.)

```html

    <style>
       @keyframes fade-in {
         from { opacity: 0; }
       }
    
       @keyframes fade-out {
         to { opacity: 0; }
       }
    
       @keyframes slide-from-right {
         from { transform: translateX(90px); }
       }
    
       @keyframes slide-to-left {
         to { transform: translateX(-90px); }
       }
    
       /* define animations for the old and new content */
       ::view-transition-old(slide-it) {
         animation: 180ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
         600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
       }
       ::view-transition-new(slide-it) {
         animation: 420ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
         600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
       }
    
       /* tie the view transition to a given CSS class */
       .sample-transition {
           view-transition-name: slide-it;
       }
        
    </style>

```

This CSS sets it up such that content with the `.sample-transition` class on it will fade out and slide to the left when 
it is removed, and new content will fade in and slide in from the right.

### The HTML

With our View Transition defined via CSS, the next thing to do is to tie this View Transition to an actual element that
htmx will mutate, and to specify that htmx should take advantage of the View Transition API:

```html

    <div class="sample-transition">
       <h1>Initial Content</h1>
       <button hx-get="/new-content" 
               hx-swap="innerHTML transition:true" 
               hx-target="closest div">
         Swap It!
       </button>
    </div>

```

Here we have a button that issues an `GET` to get some new content, and that replaces the closest div's inner HTML
with the response. 

That div has the `sample-transition` class on it, so the View Transition defined above will apply to it. 

Finally, the `hx-swap` attribute includes the option, `transition:true`, which is what tells htmx to use the
internal View Transition JavaScript API when swapping.

## Demo

With all that tied together, we are ready to start using the View Transition API with htmx. Here's a demo, which
should work in Chrome 111+ (other browsers will work fine, but won't get the nice animation):

<style>
   @keyframes fade-in {
     from { opacity: 0; }
   }

   @keyframes fade-out {
     to { opacity: 0; }
   }

   @keyframes slide-from-right {
     from { transform: translateX(90px); }
   }

   @keyframes slide-to-left {
     to { transform: translateX(-90px); }
   }

   /* define animations for the old and new content */
   ::view-transition-old(slide-it) {
     animation: 180ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
     600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
   }
   ::view-transition-new(slide-it) {
     animation: 420ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
     600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
   }

   /* tie the view transition to a given CSS class */
   .sample-transition {
       view-transition-name: slide-it;
   }
    
</style>


<div class="sample-transition" style="padding: 24px">
   <h1>Initial Content</h1>
   <button hx-get="/new-content" hx-swap="innerHTML transition:true" hx-target="closest div">
     Swap It!
   </button>
</div>

<script>
    var originalContent = htmx.find(".sample-transition").innerHTML;

    this.server.respondWith("GET", "/new-content", function(xhr){
        xhr.respond(200,  {}, "<h1>New Content</h1> <button hx-get='/original-content' hx-swap='innerHTML transition:true' hx-target='closest div'>Restore It! </button>")
    });

    this.server.respondWith("GET", "/original-content", function(xhr){
        xhr.respond(200,  {}, originalContent)
    });
</script>

Assuming you are looking at this page in Chrome 111+, you should see the content above slide gracefully out to the
left and be replaced by new content sliding in from the right. Nice!

## Conclusion

Hey now, that's pretty neat, and, once you get your head around the concept, not all that much work! This new API
shows a lot of promise.

View Transitions are an exciting new technology that we feel can dramatically level the playing field between
[Hypermedia Driven Applications](https://htmx.org/essays/hypermedia-driven-applications/) and the more prevalent SPA
architecture used today.

By doing away with the ugly "ka-chunk" of Web 1.0 applications, the aesthetic advantages of the
SPA approach will be diminished, and we can make decisions less around "sizzle" and focus more on the actual [technical
tradeoffs](https://htmx.org/essays/when-to-use-hypermedia/) associated with various architectures.

We are looking forward to when View Transitions are available in vanilla HTML, but, until then, you can start playing
with them in htmx, today!

