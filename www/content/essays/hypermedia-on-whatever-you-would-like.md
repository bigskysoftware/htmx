+++
title = "Hypermedia On Whatever you'd Like"
date = 2023-05-11
[taxonomies]
tag = ["posts"]
+++

When discussing htmx, we will sometime invoke the "HOWL" stack: Hypermedia On Whatever you'd Like.  

This is a joke [software stack](https://en.wikipedia.org/wiki/Solution_stack), akin to [the LAMP stack](https://en.wikipedia.org/wiki/LAMP_%28software_bundle%29)
or [the Mean stack](https://en.wikipedia.org/wiki/MEAN_(solution_stack)) but obviously far less constrained than those
stacks.

The big idea with the HOWL stack is that, by adopting a hypermedia-driven approach for your front-end and foregoing a large JavaScript
front-end code base, you free yourself up to choose _whatever_ server-side technology best fits your problem and your
own technical tastes.

## JavaScript: The Parts

In the presence of a large JavaScript front-end code base, the following question will inevitably come up: 

> "Why aren't we doing the back-end in JavaScript too?"  

It's a reasonable question and, if you stay in this mindset, there are some big advantages to just going all-JavaScript.
An obvious example is that you can then reuse data validation logic and data structures on both sides of the wire.

Of course, JavaScript is a [famously ugly](https://www.oreilly.com/library/view/javascript-the-good/9780596517748/) programming
language, and, as such, it's somewhat baffling that is has become such a significant language on the server-side, where
language choices are much more open than in the browser. 

(As an aside, there's actually some [decent evidence](http://steve-yegge.blogspot.com/2007/02/next-big-language.html) that 
this wasn't an accident, and that this technical outcome wasn't _necessarily_ as organic as it might seem.)

Now, in fairness, JavaScript has improved dramatically in the last five years.  There are now very good server-side runtimes
for executing it.  Adopting JavaScript (or, perhaps, TypeScript) for your server-side stack now isn't nearly as crazy
as it would have sounded a decade ago.

But do we *have* to?  Is it inevitable?

## Hypermedia

No.  

No, it is not.

You can, instead, switch to a [hypermedia-driven](/essays/hypermedia-driven-applications) approach for your front-end, 
and you almost completely remove this pressure.  You are then free to make your back-end decisions according to other technical,
philosophical and aesthetic considerations.

With htmx, you can often make this move _without_ sacrificing much front-end interactivity in order to do so.  You are going 
to have to use HTML on the front-end anyway, so why not make that HTML as powerful as possible and move as much as you 
can back to the server-side?  

That's where the language or framework that you love is, anyway.  Do more with it!

### The Heart Has Reasons...

Maybe you are working in AI and want to use a Lisp variant for your project.

Maybe you are working in big data and want to use Python.

Maybe you know Django really well and love the batteries-included approach it takes.

Maybe you prefer Flask and its stripped-down approach.

Maybe you like the raw, close-to-the-HTML feel of PHP.

Maybe you have an existing Java codebase that needs some sprucing up. 

Maybe you are learning Cobol, [and want to use htmx to make a nice front end for it](https://twitter.com/htmx_org/status/1656381761188954113).

Maybe you just really like Rust, Ocaml, Kotlin, Haskell, .NET, Clojure, Ada, ColdFusion, Ruby... whatever!

These are all perfectly reasonable technical, philosophical and aesthetic perspectives.

There is no compelling reason that they should be shunted aside in the face of the JavaScript though-leader juggernaut.  

### The Web is for Everyone

Unlike Rich Harris, [we don't think the ship has sailed](https://htmx.org/essays/a-response-to-rich-harris/#javascript-the-resistance)
on JavaScript dominating web-development.

In as much as it has, we are working to turn that ship around.

We want to see a rich and vibrant web in which _all_ back-end languages and frameworks can play as 
equal & interesting alternatives, each with their own unique strengths & cultures, each contributing to the 
magical [hypermedia system](https://hypermedia.systems) that is The Web.  

Note that this _includes_ JavaScript, which is a reasonably good language today, in parts, with some amazingly good runtimes.
JavaScript, we would note, can produce HTML as effectively as many other server-side options!

With the resurgence of interest in (and improvements of) hypermedia, that open and diverse future for The Web is now a real 
possibility, if not an emerging reality.

The Web was designed to be an open, participative hypermedia system.  Let's keep that dream alive.

No monocultures: *everyone* gets to play.

> I hate that the htmx community has devolved into builders helping each other without regard for likes, engaging 
> those who don't follow the hype, expanding sound bytes into nuance. It may not score cheap social media points, but 
> it's healthy. The web used to be worse than this.
> 
> 
> <https://twitter.com/teej_dv/status/1655668643840098304>

