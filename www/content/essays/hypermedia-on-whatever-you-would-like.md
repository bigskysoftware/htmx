+++
title = "Hypermedia On Whatever you'd Like"
date = 2023-05-?
[taxonomies]
tag = ["posts"]
+++

When discussing htmx, we will sometime invoke the "HOWL" stack: Hypermedia On Whatever you'd Like.  This is a joke
[software stack](https://en.wikipedia.org/wiki/Solution_stack), akin to [the LAMP stack](https://en.wikipedia.org/wiki/LAMP_%28software_bundle%29)
or [the Mean stack](https://en.wikipedia.org/wiki/MEAN_(solution_stack)) but obviously far less constrained than those
stacks.

The big idea here is that, by adopting a hypermedia-driven approach for your front-end and foregoing a large JavaScript
front-end code base, you free yourself up to choose whatever server-side technology best fits your problem and your
own technical tastes.

In the presence of a large JavaScript front-end code base, the question will inevitably come up: "Why aren't we doing
the back-end in JavaScript too?"  There are a lot of advantages to adopting the same language on the front-end as well
as the back-end: you can reuse domain logic and data structures, for example.

Of course, JavaScript is a [famously ugly](https://www.oreilly.com/library/view/javascript-the-good/9780596517748/) programming
language, and it's somewhat baffling that is has become so dominant. There's actually some 
[decent evidence](http://steve-yegge.blogspot.com/2007/02/next-big-language.html) that this wasn't
an accident, and that this technical outcome wasn't _necessarily_ as organic as it might seem.  That being said, JavaScript
has improved dramatically in the last five years, and adopting it (or, perhaps, TypeScript) for your entire stack is 
certainly a plausible and popular option, particularly among the web thought-leaders.

But do we *have* to?

## Hypermedia: The Resistance

No.  We don't.

If you, instead, switch to a hypermedia-driven approach for your front-end, you remove this pressure.  You can then make
your back-end decisions according to other technical and aesthetic considerations.  With htmx, you can often make this
move _without_ sacrificing front-end interactivity in order to do so.  You are going to have to use HTML on the front-end
anyway, so why not make that HTML as powerful as possible and move as much as you can back to the server-side?

Maybe you are working in AI and want to use a Lisp variant for your project.

Maybe you are working in big data and want to use Python.

Maybe you know Django really well and love the batteries-included approach it takes.

Maybe you like the raw, close-to-the-HTML feel of PHP.

Maybe you have an existing Java codebase that needs some sprucing up. 

Maybe you are learning Cobol, [and want to use htmx to make a nice front end for it](https://twitter.com/htmx_org/status/1656381761188954113).

Maybe you just really like Rust, Ocaml, Kotlin, Haskell, .NET, Clojure, Ada, ColdFusion, Ruby... whatever!

These are all perfectly reasonable technical and aesthetic perspectives and there is no good reason that they should be 
shunted aside in the face of the JavaScript juggernaut.  Contra Rich Harris, 
[we don't think the ship has sailed](https://htmx.org/essays/a-response-to-rich-harris/#javascript-the-resistance)
on JavaScript dominating web-development.  If it has, we are working hard to turn that ship around.  

We want to see a rich and vibrant web in which all back-end languages and frameworks can play as equal and interesting alternatives,
each with their own strengths, each contributing to the magical [hypermedia system](https://hypermedia.systems) that is The Web.  

With the resurgence of interest in (and improvements of) hypermedia, that future is now a real possibility, if not an 
emerging reality.

No technical monoculture.

Everyone gets to play.

> I hate that the htmx community has devolved into builders helping each other without regard for likes, engaging 
> those who don't follow the hype, expanding sound bytes into nuance. It may not score cheap social media points, but 
> it's healthy. The web used to be worse than this.
> 
> https://twitter.com/teej_dv/status/1655668643840098304