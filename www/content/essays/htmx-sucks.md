+++
title = "htmx sucks"
date = 2024-02-01
updated = 2024-04-01
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

I have been following [htmx](https://htmx.org) for a while now.  I thought it was a somewhat funny/cringey meme
and that it served as some light comic relief from the real work being done in web development, things like 
[React Server Components](https://react.dev/reference/react/use-server), [Svelte Runes](https://svelte.dev/blog/runes)
and [Signals](https://www.solidjs.com/tutorial/introduction_signals) that are actually pushing the state of the art forward.

Unfortunately at some point [in the middle of 2023](https://star-history.com/#bigskysoftware/htmx&Date)
people began to actually take htmx seriously for [some](https://www.youtube.com/watch?v=zjHHIqI9lUY) [reason](https://www.youtube.com/watch?v=r-GSGH2RxJs). 
This is an extremely alarming turn of events that has me deeply concerned for the future of web development.  

And I'm not alone in my alarm: you can read an excellent [dressing down of htmx here](https://archive.is/rQrl7):

> Basically they put their ignorance on full display, then attribute all sorts of unfounded merits to whatever they’ve 
> done hoping that everyone else pats them on the back for it.

So true. So, so true.

Unfortunately, the language in that excellent medium post is academic and, without a solid grasp of theoretical HTML, 
many of the more important points in it will go over a typical web developers head.

So, in this article, I will attempt to present, in plain language for the layman web developer, why [htmx sucks](@/essays/htmx-sucks.md).

## The Code Is Crap

First of all, consider the code for htmx.  

[Look at this garbage.](https://github.com/bigskysoftware/htmx/blob/master/src/htmx.js)

They use `var` all over the place, almost no modern JavaScript features (hello, htmx people, have you heard of 
[Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)?), they pollute the `window` name space, and on and on and on.

Worst of all, it's just one big ball of JavaScript!  One file!  It isn't decomposed at all.  If this person
took one of my [classes at MSU](https://www.cs.montana.edu/directory/2256398/carson-gross) I would fail them based 
solely on this complete misunderstanding of [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns),
something any freshman in computer science should be able to grasp.

Good software starts with clean code, and this code is filthy.

## No Build Tools

The next red flag is the lack of a build step.  Not only does htmx not have a traditional build step, thereby depriving
themselves of the [benefits](https://vitejs.dev/guide/why.html) that the rest of the JavaScript community
enjoys, but they [actively brag](@/essays/no-build-step.md) about it!

And it gets worse.

If you look closely, even though they claim to not have a build step, they [_actually do_](https://github.com/bigskysoftware/htmx/blob/bedee219329117fff8d58e33678d82f7c34b08b5/package.json#L30)
have a build step, it's just an ad hoc set of bash scripts they wrote themselves.

Ridiculous _and_ dishonest.  Shameful.

## No Typescript

Despite the [obvious benefits](https://blog.logrocket.com/understanding-typescripts-benefits-pitfalls/) of 
[TypeScript](https://www.typescriptlang.org/) for a project like htmx, the authors have stubbornly resisted using it.
Part of this is their irrational opposition to a build step (which they actually have, btw!) but part of it is a ridiculous
commitment to "shipping debuggable source code".  Of course, as any JavaScript developer who isn't a complete idiot knows,
TypeScript supports [Source Maps](https://www.typescriptlang.org/tsconfig#sourceMap) that make it perfectly debuggable.  Despite this fact, the authors continue to 
insist on using an antiquated version of JavaScript for development.

In a tacit admission that they screwed up, they are now belatedly adding [JSDoc](https://jsdoc.app/) annotations 
to their codebase (I use the word loosely here).  All this to make up for the fact that they didn't do the obvious,
correct thing initially and simply write the whole project in modern, modular TypeScript.

The only good news here is that at least they have a halfway-decent [test suite](https://github.com/bigskysoftware/htmx/blob/master/test/index.html), and given the state of the codebase, they 
better damned well!

## Antiquated Technology

OK, that covers the major (but by no means all!) issues with the htmx codebase itself.  Let's move on to more general
issues with htmx.

The first glaring issue is something the authors, again, brag about: it uses [hypermedia](https://hypermedia.systems). Really
this is just a pretentious way of saying "it uses HTML", I don't know why they insist on using a different and confusing
term for it, but whatever.

OK, well, if you haven't noticed, HTML is over thirty years old now.  It's ancient.  And, moreover, we have lots of
experience with the approach these guys are recommending.  It's not like htmx is doing anything new: [intercooler.js](https://intercoolerjs.org), 
[PJax](https://github.com/defunkt/jquery-pjax) and [Unpoly](https://unpoly.com/) (way better than htmx, btw) have been around literally _forever_.

Even before that, we had [`jquery.load()`](https://api.jquery.com/load/#load-url-data-complete).

Look at this jQuery code from 2008:

```js
$( "#result" ).load( "ajax/test.html" );
```

And now look at the super innovative stuff the htmx folks give us:

```html
<button hx-get="/ajax/test.html"
        hx-target="#result">
    Load
</button>
```

Wow.  Amazing.

It would be funny if it weren't so infuriating.

## No Components

The next reason to consider not using htmx is that there aren't any components available for it.  If you go with 
react you get things like [MUI](https://mui.com/), [NextUI](https://nextui.org/) & [Chakra](https://chakra-ui.com/).

With htmx, you get... nothing.  You have to figure out what components you want to use and then how to integrate them 
with htmx using events and so forth.

Do you really want to spend time figuring out how things like [lit](https://lit.dev/) work and then _also_ how to
integrate them with htmx?  That doesn't make any sense.  Far better to go with a front end library with integrated, 
off-the-shelf components you can just use without any fuss.

## No Front-End/Back-End Split

Another major reason to avoid htmx is that it eliminates the split between the Back-End & Front-End teams.  They even
have a page with a team [bragging about it as a virtue](@/essays/a-real-world-react-to-htmx-port.md) when their company (foolishly) 
moved from React to htmx.

The Front-End/Back-End split has been extremely successful for many companies, allowing the Front-End engineers
to focus on building a good user experience, and the Back-End engineers to focus on getting the data access layer
right.

Yes, there are at times some difficulties in coordinating between the two teams, with Back-End engineers complaining that
Front-End engineers change their requirements too frequently and Front-End engineers complaining that Back-End engineers
move too slowly.  But we have technologies like [GraphQL](https://graphql.org/) and [RSC](https://react.dev/reference/react/use-server) to
help with that, it's a solved problem at this point within the existing [standard web application model](https://macwright.com/2020/10/28/if-not-spas.html).

The Front-End/Back-End split has proven a very good organizational model for companies, particularly as they scale their development
team, and abandoning it for "Full Stack" (so called) development is risky and, frankly, foolish.

## Back-End Engineers Make Garbage UIs

Leaving aside if the Front-End/Back-End split is good or not, we can definitively say that Back-End engineers make
garbage user interfaces.

Just look at [the htmx website](https://htmx.org).  You've got inline styles, tables, a bunch of image tags
didn't have `alt` descriptions forever.  Just a dogs breakfast of bad HTML, from people who are trying to tell us
to use HTML!

You should leave your user interfaces in the hands of people who understand how to properly build them, and those
people are, today, mostly Front-End SPA developers.

## XSS Vulnerabilities

Getting back to a more technical reason why you shouldn't use htmx, it opens you up to a class of security issues called
[Cross-Site Scripting attacks](https://owasp.org/www-community/attacks/xss/), abbreviated "XSS".

The problem here is fundamental to the design of htmx: it enables & and even encourages you to put *behavior* in your markup.  Once
again we see a clear violation of [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns).
We've known for ages in web development that you should separate your markup, styling and behavior into HTML, CSS & 
JavaScript files respectively.

By violating this obvious and well known truth htmx makes you vulnerable to other people injecting behavior into your
web application if you don't [sanitize your HTML](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) 
properly.

Sometimes the htmx author will make a smart-alec comment like "Well, how do you feel about the 
[href](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href) attribute?", but that's different, obviously.

## No Jobs

Another practical reason not to use htmx is that there are, rounding off, zero htmx jobs.

I just did a search for htmx jobs on indeed and found a grand total of two: one at Microsoft and one at Oak Ridge
National Labratory.

A search for "react", on the other hand, gives 13,758 jobs.

Seriously, developer, which of these two technologies do you want to hitch your career to?

## No One To Hire

The flip side of the above problem is that, if you are a company, there are, rounding off, zero htmx developers.

Everyone goes to bootcamps and learns React.  If you want to have a large potential employee pool (maybe your company
has high turnover for some reason, maybe you want to keep employee wages down, maybe a small team of full stack engineers
would get in the way of your kingdom building) it makes a ton more sense to go with The Big Dog in front end development.

Today, that dog is React.

## Duplicating (Or More!) Your APIs

Getting back to the more technical side of things, if you adopt htmx and you want to _also_ have a mobile app or an
API for 3rd parties to use, you will need to create that API entirely separately from your web application's end points.

Here, again, we find that, incredibly, the [htmx people brag about this fact](@/essays/splitting-your-apis.md), completely
ignoring the duplication of work involved here.

It makes far more sense to have a single API maintained by a single, Back-End team that can flexibly serve all your
needs.

This is obvious and, frankly, not worth even arguing about.

## It Won't Scale

Another technical issue with htmx is that it just won't scale.  It may work for small applications, but as applications
get larger the htmx model breaks down and becomes a mess.  The component model of React and other front-end tools keeps
everything compartmentalized and testable.  This makes it much easier to keep large codebases clean.

As an example, consider [Github](https://github.com/), which started out using technology a lot like htmx.  It has
recently started adopting React and is now much more stable than it was previously.  They would have been better off
if they had just started with React and built the whole thing in a modern, component-based way, but at least they
are making the right move now.  Better late than never.

## The Creator Is Unhinged

Finally, and maybe the most important reason not to use htmx: the creator is obviously unhinged.

Just look at the [twitter feed](https://twitter.com/htmx_org): unprofessional, childish, intentionally provocative.

Or consider the fact that he posts [essays he](@/essays/is-htmx-another-javascript-framework.md)) [doesn't agree with](@/essays/htmx-sucks.md) to 
his own site.

The essays tab [has a section for memes](https://htmx.org/essays/#memes), most of which are cringe-worthy and all 
of which have no business being on a website of a front end library that expects to be taken seriously.

Apparently he allows [anyone to be the CEO of htmx](https://htmx.ceo) and make one of those super-cringey
job announcements on LinkedIn.

Wanton buffoonery.

When you pick a front-end library you are, to an extent, picking the author of that library as a co-worker.  Do you
really want to work this guy?  I certainly don't.

## Conclusion

I hope this has convinced you that choosing htmx & hypermedia for your web application is an [exceptionally bad idea](https://www.reddit.com/r/ProgrammerHumor/comments/zmyug8/edsger_dijkstra_math_and_memes/) that could only
have originated in [Montana](https://bigsky.software).  Don't listen to the fanboys and fangirls with their "It's so over",
"We're so back" nonsense, CEO profiles and childish memes.

Software, and especially Front-End software is serious business and needs to be treated with the same gravity as things
like law & politics, two other extremely serious and productive activities.  We should support libraries that focus on
innovation & sophistication, not broken, backwards-looking libraries whose creator spends most of his time posting
ridiculous things on twitter.

It's just common sense: htmx sucks.
