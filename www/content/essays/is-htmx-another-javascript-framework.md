+++
title = "Is htmx Just Another JavaScript Framework?"
date = 2024-01-10
[taxonomies]
author = ["Alexander Petros"]
tag = ["posts"]
+++

One of the most common criticisms of htmx, usually from people hearing about it for the first time, goes like this:

>You're complaining about the complexity of modern frontend frameworks, but your solution is just another complex frontend framework.

This is an excellent objection! It's the right question to ask about *any* third-party (3P) code that you introduce into your project. Even though you aren't writing the 3P code yourself, by including it in your project you are committed to understanding it—and refreshing that understanding if you want to upgrade it. That's a big commitment.

Let's break this criticism down into its constituent parts, and determine exactly how much htmx indulges in the harms it claims to solve.

## The difference between a library and a framework

Some htmx defenders jump to our aid with: "htmx isn't a framework, it's a library." This is probably incorrect.

"Framework" is a colloquial term—there's no hard rule for the point at which some third-party code evolves from a "library" into a "framework"—but we should still try to define it. In this context:

* **Library** - 3P code whose API does not significantly influence the rest of the application
* **Framework** - 3P code whose API dictates the overall structure of the application

If you prefer metaphors: a library is a cog that you add to your machine, a framework is a pre-built machine that you control by customizing its cogs.

This distinction, fuzzy though it may be, is important because it describes how easily some third-party code can be replaced. For example, a JavaScript service that uses a CSV parsing library can probably swap in a different CSV parsing library without too much trouble; a JavaScript service that uses the NextJS framework, however, is probably going to depend on NextJS for its entire useful life, since an enormous chunk of the code is written with the assumption that it is interacting with NextJS constructs.

Therefore, if your service is built atop a framework, its useful lifespan is tied to the useful lifespan of that framework. If that framework is abandoned, or despised, or otherwise undesirable to work on, the difficulty of modifying your project will steadily increase until you give up modifying it, and eventually, mothball it altogether.

That's what people are worried about when they ask is "is htmx just another JavaScript framework?" They want to be sure that they're not committing to a system that will be obsolete soon, like so many of the past web development frameworks.

So: is htmx a framework? And is it going to be fast made obsolete, leaving a trail of un-maintainable websites in the wake of its meteoric demise?

## htmx is (usually) a framework

With apologies to our community's ongoing debate about this question—I think htmx is pretty clearly a framework, at least in the majority use-case. But it does depend on how you use it.

Wherever you make use of htmx in your project, you're including htmx attributes in your HTML (i.e. `hx-post`, `hx-target`), writing endpoints that are called with htmx-formatted data (with certain request headers), and returning data from those endpoints that is formatted in ways that htmx expects (HTML with `hx-*` controls). All of these attributes and headers and endpoints interact with each other to create a system by which elements enter and exit the DOM via network request.

If you use htmx to handle a non-trivial number of your website's network requests, then the inclusion of htmx in your application has significant implications for the project's structure, from the way you structure your frontend markup, to the database queries your endpoints make. That is framework-like behavior, and in that scenario, htmx cannot be trivially replaced.

You can definitely use htmx in a library-like manner, to add dynamic functionality to just a few sections of your web page. But you can write [React in this library-like manner too](https://www.patterns.dev/vanilla/islands-architecture) and nobody argues that React isn't a framework. Suffice to say that many people who use htmx in their applications are doing so in a way that bends to the demands of htmx, as a framework for building hypermedia applications.

As they should! Building with htmx works a lot better if you play to its strengths. You can send JSON-formatted form bodies, [if you really insist](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/json-enc/README.md). But you shouldn't! It's simpler to just use `application/x-www-form-urlencoded` bodies, and write an endpoint that accepts them. You can write an endpoint that is re-used across multiple different clients, [if you really insist](@/essays/why-tend-not-to-use-content-negotiation.md). But you shouldn't!  It's simpler to [split your data and your hypermedia APIs into separate URLs](@/essays/splitting-your-apis.md). Yes, htmx can be used as a library, but maybe let it be your framework too.

That does not mean, however, that htmx is Just Another JavaScript Framework, because htmx has a huge advantage that the other frameworks do not: HTML.

## htmx is for writing HTML

Let's say you're using htmx as a framework—is it a *JavaScript* framework? In one obvious sense, yes: htmx is implemented with ~4k lines of JS. But in another, much more important sense, it is not: React, Svelte, Solid, and so on have you write JS(X) that the framework converts into HTML; htmx just has you write HTML. This removes entire categories of maintenance that might make you abandon other frameworks with time.

Codebases tend to get stuck when you want to upgrade or change some dependency, but the framework you use is incompatible with that change. Java is the most notorious offender here—there are untold millions of lines of Java in production that will never leave Java 8 because upgrading Spring is too hard—but the npm package ecosystem is a close second. When you use the htmx "framework" you will never have this problem, because htmx is a [zero-dependency, client-loaded JavaScript file](@/essays/no-build-step.md), so it is guaranteed to never conflict with whatever build process or dependency chain your server *does* depend on.

Browsers render HTML, so no compiler or transpiler is ever necessary to work with htmx. While many htmx users happily render API responses with JSX, htmx works very well with [classic](https://jinja.palletsprojects.com) [template](https://ejs.co/) [engines](https://docs.ruby-lang.org/en/2.3.0/ERB.html), making it portable to [whatever language you like](@/essays/hypermedia-on-whatever-youd-like.md). Say what you will about Django and Rails, but they were relevant in 2008 and they're relevant today—htmx integrates seamlessly with them both. This is a recurring theme with htmx-driven development: htmx works well with development tools old and new, because the common denominator in all these tools is HTML, and htmx is for writing HTML.

<div style="text-align:center; width:100%">
  <img width=500
       src="/img/memes/htmxanddjango.png"
       alt="A monkey labeled 'HTMX' protecting a cute dog named 'Django' from 'all that compilated JS noise'"
      >
</div>

Pushing the user to define the behavior of their application primarily in HTML, rather than JS, has too many advantages to cover in this essay, so I'll stick to the one people hate most about JavaScript fameworks: churn. Depending on when you wrote your React application, you might have written your form with [controlled class components](https://legacy.reactjs.org/docs/forms.html), or [react hooks](https://blog.logrocket.com/react-hook-form-complete-guide/), or this [experimental `<form>` extension](https://react.dev/reference/react-dom/components/form). This is genuinely maddening, especially if you—like me—first learned how to make a web form with class components.

No matter when you wrote your htmx application, however, the behavior of an htmx form has always been defined in largely the same way a regular HTML form is: with `<form>`. With htmx adding additional network functionality, you can finally use `PUT` requests and control where the response goes, but in all other respects—validation, inputs, labels, autocomplete—you have default `<form>` element behavior.

Finally, because htmx simply extends HTML in a very narrow domain (network requests and DOM replacements), most of the "htmx" you write is just plain old HTML. When you have access to complex state management mechanisms, it's incredibly easy to implement a custom collapsible div; when you don't, you might stop long enough to search up the [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) element. Whenever a problem can be solved by native HTML elements, the longevity of the code improves tremendously as a result. This is a much less alienating way to learn web development, because the bulk of your knowledge will remain relevant as long as HTML does.

In this respect, htmx is much more like JQuery than React (htmx's predecessor, [intercooler.js](https://intercoolerjs.org/), was a JQuery extension), but it improves on JQuery by using a declarative, HTML-based interface: where JQuery made you go to the `<script>` tag to specify AJAX behavior, htmx requires only a simple `hx-post` attribute.

In short, while htmx can be used as a framework, it's a framework that [deviates far less from the web's semantics](https://unplannedobsolescence.com/blog/custom-html-has-levels) than the JavaScript frameworks do, and will benefit from improvements in those semantics with no additional work from the user, thanks to the web's [excellent backwards compatibility guarantees](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/The_web_and_web_standards#dont_break_the_web). If you want to build a website that lasts for a long time, these qualities make htmx a substantially better bet than many of its contemporaries.

*NOTE: Despite agreeing with this analysis, finding no logical flaws in the essay, and allowing me to publish it on his website, Carson continues to insist that htmx is a library.*

<div style="text-align:center; width:100%">
  <img width=500
       src="/img/memes/istudiedhtml.png"
       alt="A man holding a sword. He says: 'When you wrote class components, I studied HTML. When you were converting classes to hooks, I mastered the HTML. While you wasted time moving all your client-side logic to server components, I cultivated inner HTML. And now that the browser won't hydrate your thick client JSON API you have the audactiy to come to me for help?'"
      >
</div>

