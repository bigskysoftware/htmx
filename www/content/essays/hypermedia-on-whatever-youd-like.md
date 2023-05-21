+++
title = "Hypermedia On Whatever you'd Like"
date = 2023-05-11
[taxonomies]
tag = ["posts"]
+++

> The one big remaining (advantage of MPAs) is (server side programming) language choice. If you're already part of the 
> anti-JavaScript resistance, then nothing I say in the rest of this talk is going to matter that much. 
> 
> But, I'm going to get into this later: that ship might have sailed...
> 
> Rich Harris - [Have SPA's Ruined The Web?](https://youtubetranscript.com/?v=860d8usGC0o&t=440)

One term we will sometimes throw around, when discussing htmx, is the idea of The HOWL Stack.  HOWL, here, stands for 
_Hypermedia On Whatever you'd Like_.

This is a tongue-in-cheek [software stack](https://en.wikipedia.org/wiki/Solution_stack), a reference to more popular
software stacks like [The LAMP Stack](https://en.wikipedia.org/wiki/LAMP_%28software_bundle%29)
or [The MEAN Stack](https://en.wikipedia.org/wiki/MEAN_(solution_stack)).

The TLDR of The HOWL Stack is this: by adopting a [hypermedia-driven approach](/essays/hypermedia-driven-applications) 
you free yourself up to choose _whatever_ server-side technology best fits your problem and your own technical tastes.

## The JavaScript Empire

When you choose to use an SPA framework for your web application you will, naturally, have a large front-end codebase written in 
JavaScript. 

And, just as naturally, the following question will come up:

> "Well, why aren't we doing the back-end in JavaScript too?"  

This is a perfectly reasonable question to ask and there are a lot of advantages to adopting the same programming 
language on both sides of the wire:

* You can share application logic between the two code-bases.  A good example here is validation logic.
* You can share data structures between the two code-bases. 
* You can build up expertise in a single language, JavaScript, making it easier on developers
* We don't see this mentioned much, but by adopting a single language on both sides of the wire,
  [full stack development](https://www.geeksforgeeks.org/what-is-full-stack-development/) is much easier to do

This _pressure_ to adopt JavaScript will only grow as your investment in the JavaScript front end ecosystem grows.  Your
team will be building up expertise in JavaScript, you will likely be maintaining a JavaScript-based build system and
so forth.

On top of this, JavaScript  has improved _dramatically_ in the last five years and there are now multiple excellent
server-side runtimes for executing it.  Server-side JavaScript frameworks continue to sprout up and innovate.  Library 
support in the language continues to grow and many web development thought leaders have embraced the language, which means
that there are lots of learning resources available online.

All of this adds to a sense of inevitability of JavaScript that Rich Harris alludes to above.

Why _wouldn't_ a web project adopt JavaScript across the whole stack?

## The Hypermedia Resistance

Besides JavaScript, there is another technology sitting in the browser: _hypermedia_.  

Or, more concretely, HTML support (and the related Document Object Model, or DOM).  In fact, even if you are using an 
SPA framework, you will be working with that hypermedia infrastructure in some form, via JSX templates for example, if 
only to create UIs that a browser can understand.

So you are going to be using HTML or the related DOM APIs in some manner in your web application.

What if we made HTML more powerful?  

That's the idea of [htmx](/), which makes it possible to implement [common modern web application patterns](/examples) 
using the hypermedia approach.  This closes the UX gap between traditional MPAs and SPAs, making taking the hypermedia
route feasible for a much larger set of web applications.

Once you've adopted the hypermedia approach (and remember, you are going to be using hypermedia infrastructure _anyway_,
so why not leverage it as much as possible) it suddenly puts server-side language choice back on the table.  

You aren't going to have a large JavaScript code-base for your front end, so you've removed the pressure that comes with 
that to adopt JavaScript on the back end.  You can now make your server-side language (and framework) choice based on other
considerations, both technical and aesthetic.

Once you go hypermedia, you can use that hypermedia on whatever you'd like: HOWL!

## An Open Web for Everyone

And when we "whatever", we really mean that.  

Here is a screen-shot of the [htmx discord](/discord)'s HOWL section recently:

<div style="text-align: center; padding: 16px">
<img src="/img/howl-channels.png">
</div>

You can see we have traffic in loads of different programming languages and frameworks: Java, Go, .NET, Rust, Clojure,
PHP, Ruby, Python, Ocaml...

We even have some folks talking about using htmx with Bash and Cobol!

How cool is that?

This is exactly the future that we at Big Sky Software want to see: a rich and vibrant web in which 
_every_ back-end language and frameworks can play as an equal & interesting alternative. Each language and framework has 
their own unique strengths & cultures, and each can contribute to the magical 
[hypermedia system](https://hypermedia.systems) that is The Web.

## But, Is it An *Anti*-JavaScript Resistance?

Before we finish this essay, we do want to address the idea that the resistance to JavaScript *everywhere* is necessarily
*Anti*-JavaScript.

Now, admittedly, we have laughed at our fair share of [jokes about JavaScript](/img/js-the-good-parts.jpeg), and we have 
gone so far as to create an alternative scripting language for the web, [hyperscript](https://hyperscript.org).  

So it might seem like we should be card-carrying anti-javascriptites.  

But, to the contrary, we are deeply appreciative of JavaScript.

After all, both htmx and hyperscript are _built in JavaScript_.  We couldn't have created these libraries without
JavaScript, which, whatever else one might say, has the great virtue of [_being there_](https://en.wikipedia.org/wiki/Being_There).

And we recommend _using_ JavaScript for front-end scripting needs in a hypermedia-driven application, so long as you 
script in a [hypermedia-friendly](/hypermedia-friendly-scripting/) way.

Further, we wouldn't steer someone away from using JavaScript (or, perhaps, TypeScript) on the server side for a 
hypermedia-driven application, if that language is the best option for your team.  As we said earlier, JavaScript now 
has multiple excellent server-side runtimes, and many excellent server-side libraries available.  It might be the best
option for you and your team!

But it is not, and it shouldn't be, the *only* option for your team.

## The Dream of the 90s Is Alive...

With the resurgence of interest in (and improvements of) hypermedia an open and diverse future for The Web is now a
real possibility, if not an emerging reality.

The Web was designed to be an open, polyglot & participative hypermedia system and the ship _hasn't sailed_ on that,
not yet!  

We can keep it that way by re-embracing the fundamental technology of the web: hypermedia.

The [dream of the 90s](https://www.youtube.com/watch?v=TZt-pOc3moc) is alive, with hypermedia.

> I hate that the htmx community has devolved into builders helping each other without regard for likes, engaging
> those who don't follow the hype, expanding sound bytes into nuance. It may not score cheap social media points, but
> it's healthy. The web used to be worse than this.
>
> [@teej_dv](https://twitter.com/teej_dv/status/1655668643840098304)
