+++
title = "Hypermedia On Whatever you'd Like"
date = 2023-05-23
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

> The one big remaining (advantage of MPAs) is (server side programming) language choice. If you're already part of the 
> anti-JavaScript resistance, then nothing I say in the rest of this talk is going to matter that much. 
> 
> But, I'm going to get into this later: that ship might have sailed...
> 
> Rich Harris - [Have SPA's Ruined The Web?](https://youtubetranscript.com/?v=860d8usGC0o&t=440)

A concept we like to talk about is "The HOWL Stack".  HOWL stands for _Hypermedia On Whatever you'd Like_.

This is a joke-but-not-really [software stack](https://en.wikipedia.org/wiki/Solution_stack), and a reference to more
well known stacks like [The LAMP Stack](https://en.wikipedia.org/wiki/LAMP_%28software_bundle%29)
or [The MEAN Stack](https://en.wikipedia.org/wiki/MEAN_(solution_stack)).

The TLDR of The HOWL Stack is this: when you use a [hypermedia-driven approach](/essays/hypermedia-driven-applications) 
for your web application, you free yourself up to choose _whatever_ server-side technology best fits your problem and 
your own technical tastes.

## Feeling The JavaScript Pressure

If you decide to use an SPA framework for your web application you will, naturally, have a large front-end codebase 
that is written in JavaScript. 

Given that, the following question inevitably will come up:

> "Well, why aren't we doing the back-end in JavaScript too?"  

This is a reasonable question to ask and there are a lot of advantages to adopting the same programming language on both
sides of the wire:

* You can share application logic between the two code-bases.  A good example here is validation logic.
* You can share data structures between the two code-bases. 
* You can build up expertise in a single language, JavaScript, making it easier for developers to work in various parts 
  of your application.
* You can reuse the build system & dependency management knowledge you've acquired for the front end

This _pressure_ to adopt JavaScript will only grow as your investment in the JavaScript front end ecosystem grows.

Furthermore, JavaScript has improved dramatically in the last five years and there are now multiple excellent
server-side runtimes for executing it.  Many of the older arguments about the messiness of the language can be
waved off as preventable via linting, developer discipline, and so forth.  

JavaScript is the dominant language among the web development thought leaders and there are massive numbers of tutorials,
code camps, etc. that strongly emphasize the language.  Nothing succeeds like success, and JavaScript (as well as React)
have succeeded.

Let's call the result of this _The JavaScript Pressure_ and acknowledge that nearly every developer working with the 
web feels it at least to some extent.

## Hypermedia: Our Only Hope

What hope do non-JavaScript developers have in web development?

Well, there is one older technology sitting there in the browser alongside JavaScript: _hypermedia_.  

Browsers offer excellent HTML support (and the related Document Object Model, or DOM).  In fact, even if you are using an 
SPA framework, you will be working with that hypermedia infrastructure in some form (via JSX templates, for example) if 
only to create UIs that a browser can understand.

So you are going to be using HTML or the related DOM APIs in some manner in your web application.

Well, what if we made HTML a more powerful hypermedia?  

That's the idea of [htmx](/), which makes it possible to implement [common modern web application patterns](/examples) 
using the hypermedia approach.  This closes the UX gap between traditional MPAs and SPAs, making taking the hypermedia
route feasible for a much larger set of web applications.

Once you adopt this hypermedia approach (and remember, you are going to be using hypermedia infrastructure _anyway_,
so why not leverage it as much as possible?) a surprising side effect occurs:

Suddenly, the advantage of server-side language choice that Harris attributed to MPAs is _back on the table_.

If your application's front end is mainly written in terms of HTML, maybe with a bit of client-side scripting,
and with no large JavaScript code-base, you've suddenly dramatically diminished (or entirely eliminated) The JavaScript 
Pressure on the back end.

You can now make your server-side language (and framework) choice based on other considerations: technical, aesthetic or
otherwise:

* Perhaps you are working in AI and want to use a Lisp variant for your project
* Perhaps you are working in big data and want to use Python
* Perhaps you know Django really well and love the batteries-included approach it takes
* Perhaps you prefer Flask and the stripped-down approach it takes
* Perhaps you like the raw, close-to-the-HTML feel of PHP 
* Perhaps you have an existing Java codebase that needs some sprucing up
* Perhaps you are learning Cobol, [and want to use htmx to make a nice front end for it](https://twitter.com/htmx_org/status/1656381761188954113).
* Perhaps you just really like Rust, Ocaml, Kotlin, Haskell, .NET, Clojure, Ada, ColdFusion, Ruby... whatever!

These are all perfectly reasonable technical, philosophical and aesthetic perspectives.

And, by adopting hypermedia as your primary front-end technology, you pursue any of these goals without a bicameral 
code-base. Hypermedia doesn't care what you use to produce it: you can use hypermedia on whatever you'd like.

## An Open Web for Everyone

And when we say "whatever", we really mean it.

Here is a screenshot of the [htmx discord](/discord)'s HOWL subsection recently.  Note that these are just the channels
that happen to have active traffic, there are many more.

<div style="text-align: center; padding: 16px">
<img src="/img/howl-channels.png">
</div>

You can see we have ongoing conversations in a bunch of different programming languages and frameworks: Java, Go, .NET, 
Rust, Clojure, PHP, Ruby, Python, Ocaml.  We even have some folks talking about using htmx with Bash and Cobol!

This is exactly the future that we want to see: a rich and vibrant Web in which _every_ back-end language and framework
can play as an equal & interesting alternative. Each language and framework has their own unique strengths & cultures and
each can contribute to the magical [hypermedia system](https://hypermedia.systems) that is The Web.

## But, Is it An *Anti*-JavaScript Resistance?

Before we finish this essay, we do want to address the idea that the resistance to JavaScript *everywhere* is necessarily
*Anti*-JavaScript.

Now, admittedly, we have laughed at our fair share of [jokes about JavaScript](/img/js-the-good-parts.jpeg), and we have 
gone so far as to create an alternative scripting language for the web, [hyperscript](https://hyperscript.org).  

So it might seem like we should be card-carrying anti-javascriptites.  

But, to the contrary, we are deeply appreciative of JavaScript.

After all, both htmx and hyperscript are _built in JavaScript_.  We couldn't have created these libraries without
JavaScript, which, whatever else one might say, has the great virtue of [_being there_](https://en.wikipedia.org/wiki/Being_There).

And we even go so far as to _recommend using_ JavaScript for front-end scripting needs in a hypermedia-driven 
application, so long as you script in a [hypermedia-friendly](/essays/hypermedia-friendly-scripting/) way.

Further, we wouldn't steer someone away from using JavaScript (or TypeScript) on the _server side_ for a 
hypermedia-driven application, if that language is the best option for your team.  As we said earlier, JavaScript now 
has multiple excellent server-side runtimes and many excellent server-side libraries available.  

It might be the best option for you and your team, and there is no reason not to use it in that case.

Hypermedia On Whatever you'd Like means just that: whatever you'd like.

But JavaScript is not, and it should not be, the *only* server-side option for your team.

## Turning The Ship Around

With the resurgence of interest in (and improvements of) hypermedia, an open and diverse future for The Web is now a
real possibility, if not an emerging reality.

The Web was designed to be an open, polyglot & participative hypermedia system.  

And the ship _hasn't sailed_ on that dream, at least not yet!  

We can keep that dream alive by re-learning and re-embracing the foundational technology of the web: hypermedia.

> I hate that the htmx community has devolved into builders helping each other without regard for likes, engaging
> those who don't follow the hype, expanding sound bytes into nuance. It may not score cheap social media points, but
> it's healthy. The web used to be worse than this.
>
> [@teej_dv](https://twitter.com/teej_dv/status/1655668643840098304)
