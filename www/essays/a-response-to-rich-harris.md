---
layout: layout.njk
tags: posts
title: A Response To Rich Harris
---

# A Response To Rich Harris

[Rich Harris](https://twitter.com/rich_harris) is a well-known web developer who on [Svelte.js](https://svelte.dev/), a novel 
Single-Page Application (SPA) framework.  

In October of 2021, he gave a talk at JamStack entitled ["Have Single-Page Apps Ruined the Web?"](https://www.youtube.com/watch?v=860d8usGC0o).

We have been asked for our opinion on the talk, so this essay is our response.

The first thing to say about the talk is that it is very well done: thoughtful, funny, fair to both sides of the debate 
and reasonable throughout.  We don't agree with a lot that Mr. Harris has to say, as we will detail below, but we respect 
and appreciate his opinions as well as the technologies he works on.

## Problems with SPAs

The talk begins with some reasonable criticisms of SPAs, particularly pointing out usability issues found 
with Instagram, a canonical SPA implementation from our friends at Facebook.  All in all, he takes a very fair look at 
the drawbacks to SPAs, including the following:

* You will need a bloated JS framework
* Performance will suffer
* It will be buggy
* There will be accessibility issues
* The tooling is complicated
* It will be less resilient

After considering the usability issues with Instagram, Mr. Harris has this to say:

> Come on people.  If the best front end engineers in the world can't make
> text and images work without five megabytes of javascript, then  maybe
> we should just give up on the web platform.

Here we find ourselves in violent agreement with Mr. Harris, with the caveat that we would substitute "the *javascript* web platform" 
for just "the web platform", since that is what is in play with Instagram.

We would further clarify that SPA applications and frameworks often simply *ignore* the web platform, that is, 
the original, [REST-ful model](/essays/rest-explained.md) of the web, except perhaps as a bootstrap mechanism.

## Problems with MPAs

Mr. Harris then moves on to problems with Multi-Page Applications (MPAs) which are the "traditional", 
click-a-link-load-a-page-of-HTML web applications that are, to an extent, being supplanted by SPAs.  

We will go through the problems he outlines, all of which are valid when discussing "standard" MPAs, 
we will demonstrate how a Hypermedia-centric technology like htmx can solve each of them, while still remaining within the
general category of MPA.

### "You Can't Keep A Video Running"

A general problem with standard MPAs is that they issue a full page refresh on 
every request.  This means something like a video or audio player will be replaced and, thus, stop playing, when a request is made.  This can be addressed in htmx via the [`hx-preserve`](/attributes/hx-preserve) attribute, which tells htmx to preserve a particular piece of content between requests.

### "Back Button & Infinite Scroll Don't Work"

In the presence of infinite scroll behavior (presumably implemented via javascript of some sort) the back button will not work properly with an MPA.  I would note that the presence of infinite scroll calls into question the term MPA, which would traditionally use paging instead of an infinte scroll.

That said, [infinite scroll](/examples/infinite-scroll) can be achieved quite easily using htmx, in a hypermedia-oriented and obvious manner.  And, when combined with the [`hx-push-url`](/attributes/hx-push-url) attribute, history and the back button works properly with very little effort by the developer, all with nice Copy-and-Pasteable URLs.

### "What about Nice Transitions"

Nice transitions are, well, nice, although we think that designers tend to over-estimate their contribution to application usability.  htmx, however, supports transitions using [standard CSS transtions](https://htmx.org/examples/animations/) to make animations possible.  Obviously there is a limit to what you can achieve with these techniques, but we believe there is an 80/20 (or 95/5) rule in play in this regard.

### "Multipage Apps Load Javascript Libraries Every Request"

Mr. Harris focuses heavily on "crappy Ad Tech" as a culprit for web usability issues, and who can defend the 2.5MB payload of tracking, spyware and adware that most websites deliver to their users today?  He says that SPAs ameliorate this issue by loading up the bundle of garbage once, rather than over and over as an MPA does.

Now, a vanilla MPA would typically have said garbage cached after the first request, so the download cost, at least, is about the same as with SPAs.  However, an MPA powered by htmx has exactly the same characteristics as an SPA: said garbage would be downloaded and executed once, and after that all requests would be relatively light-weight replacements of DOM elements.

### "MPAs Have Network Latency Issues"

This is a valid point: with an MPA-style hypermedia approach you are gated by how fast your server can respond to requests.  However, there are well-known techniques, developed over decades, for monitoring and optimizing this response time and, to be frank, the SPAs we work with day-to-day are often plenty laggy.  On top of that, the complexity of optimistically synchronizing data with a server can lead to extremely difficult to understand data consistency issues and, a topic we will return to, a significant increase in application complexity.

### "Github Has UI Bugs"

Github does, indeed, have UI bugs, it's true.  But none of them are particularly difficult to solve.  htmx offers multiple ways to [update content beyond the target element](https://htmx.org/examples/update-other-content/), all of them quite easy and any of which would work to solve the UI consistency issues pointed out.

Compare and contrast with the engineering work required to fix the bugs that Mr. Harris pointed out in Instagrams web application.  We know which issues we'd rather fix.

## Transitional Applications

Mr. Harris then discusses the concept of "transitional applications" which are a mix of both SPA and MPA technologies.  This terminology is reasonable, we'll see if it sticks.  We recommend using htmx for the parts of the app it makes sense and kicking out to other technologies when needed: vue.js, alpine.js, etc. and so we can recommend a "transitional" approach to web development.

## The Elephant In The Room: Complexity

Unfortunately, there is a topic that Mr. Harris does not discuss, and we believe this may be because he doesn't see it.  As he is a javascript developer who is passionate about that language and swims in the engineering culture of front end frameworks, the current *complexity* of javascript front end development seems natural to him.  But, for many of us, the javascript ecosystem is simply *insanely* overly-complicated.  Comically so, given the requirements of most web applications.

Many of the "transitional" technologies that Mr. Harris goes on to mention: [React Server Components](https://vercel.com/blog/everything-about-react-server-components) (which he calls "like html over the wire, but vastly more sophisticated), [Marko](https://markojs.com/) (which is doing "partial hydration"), [Quik](https://github.com/BuilderIO/qwik) (which aggressively lazy loads things, apparently), are all remarkable engineering achievements, but are also all, we must say, quite complicated.

This is, unfortunately, part of the culture of front end development right now: sky-high levels of complexity are tolerated in application frameworks, in build tool chains, in deployment models and so on, and, when problems arise due to all this complexity, more complexity is often offered as the answer.  "Simple" is disparaging and "sophisticated" is high praise.

This complexity is overwhelming many developers and development teams.  As Mr. Harris himself points out when discussing Instagram, even some of 
the best front engineers in the world appear to be unable to keep it all under control.

So there is a cultural issue here.

But there is a technical one as well:

The technical issue is what we will call "The Hypermedia Approach" vs. "The Remote Procedure Call (RPC) Approach".  When web applications moved from MPAs to SPAs, they adopted, often unwittingly, the latter RPC approach to application development: AJAX moved to JSON as a data serialization format and largely ([and correctly](/essays/hypermedia-apis-vs-data-apis/)) abandoned the hypermedia concept.   This abandonment of The Hypermedia Approach was driven by the admitted usability issues with vanilla MPAs.

It turns out, however, that those usability issues often *can* [be addressed](/examples) using The Hypermedia Approach: rather than *abandoning* Hypermedia for RPC, what we need is a *more powerful* Hypermedia.  This is exactly what htmx gives you.

By returning to The Hypermedia Approach, you can build reasonably sophisticated web applications that address many of 
Mr. Harris's concerns regarding MPAs, at a fraction of the complexity required by most popular SPA frameworks.  And, for free,
you get all [the benefits](https://en.wikipedia.org/wiki/Representational_state_transfer#Architectural_concepts) that Roy Fielding 
outlined with a truly REST-ful architecture.

Is this architecture right for all web applications?  Obviously not.  

Is it right for many, perhaps most, web applications?  We certainly think so.

## Javascript: The Resistance

Now we get to the most emotionally charged claim made in the talk: that "the ship has sailed" on javascript, and we should 
accept that it will be the dominant programming language in web development going forward.  

We are not so sure about that.

Mr. Harris mentions edge computing as a driver for javascript adoption, but we do not expect edge computing to figure in the 
majority of web applications for the forseeable future, or, frankly ever.  CPU is cheap and microservices are a mess.  Don't @ us.

And, contra what Mr. Harris says, today the [trend is not obviously in javascripts favor](https://insights.stackoverflow.com/trends?tags=java%2Cc%2Cc%2B%2B%2Cpython%2Cc%23%2Cvb.net%2Cjavascript%2Cassembly%2Cphp%2Cperl%2Cruby%2Cvb%2Cswift%2Cr%2Cobjective-c).  Five years ago, we (as, yes, members of the javascript resistance) were despairing of any hope of stopping the Javascript juggernaut.  

But then something unexpected happened: Python took off and, from the looks of it, javascript has, well, flat lined:

<div style="text-align:center">

![Javascript Devs](/img/language-trends-so.png)

</div>

Does this mean javascript will go away?  

Of course not.  Javascript is a core technology of the web and will be with us forever.  Without it, we couldn't have built 
htmx (or [hyperscript](https://hyperscript.org)) to replace it, so we are very thankful, in a funny sort of way, for javascript.

But this does mean that the future does not *necessarily* belong to javascript, as appeared to be the case say five years ago.  

We are fond of talking about the HOWL stack: Hypermedia On Whatever you'd Like.  The idea is that, by returning to a (more powerful) Hypermedia architecture, you can use whatever backend language you'd like: python, lisp, haskell, go, java, whatever.  Even javascript, if you like.  There's no accounting for taste, after all.

That's a world we'd rather live in: many programming language options, each with their own strengths, technical cultures and thriving 
communities, all able to participate in the web development world through the magic more powerful hypermedia.  Diversity, after all, is our strength.

And so, in conclusion,

<dov style="text-align:center">

![Javascript Devs](/img/js-devs-be-thinking.png)

</dov>