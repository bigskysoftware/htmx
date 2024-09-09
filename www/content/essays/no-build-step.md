+++
title = "Why htmx Does Not Have a Build Step"
date = 2023-08-19
[taxonomies]
author = ["Alexander Petros"]
tag = ["posts"]
+++

A recurring question from some htmx contributors is why htmx isn't written in TypeScript, or, for that matter, why htmx lacks any build step at all. The full htmx source is a single 3,500-line JavaScript file; if you want to contribute to htmx, you do so by modifying the `htmx.js` file, the same file that gets sent to browsers in production, give or take minification and compression.

I do not speak for the htmx project, but I have made a few nontrivial contributions to it, and have been a vocal advocate for retaining this no-build setup every time the issue has arisen. From my perspective, here's why htmx does not have a build step.

## Write Once, Run Forever
The best reason to write a library in plain JavaScript is that it lasts forever. This is arguably JavaScript's single most underrated feature. While I'm sure there are some corner cases, JavaScript from 1999 that ran in Netscape Navigator will run unaltered, alongside modern code, in Google Chrome downloaded yesterday. That is true for very few programming environments. It's certainly not true for Python, or Java, or C, which all have versioning mechanisms where opting for new language features will force you off of deprecated APIs.

Of course, most people's experience with JavaScript is that it ages like milk. Reopen a node repository after 3 months and you'll find that your project is mired in a flurry of security warnings, backwards-incompatible library "upgrades," and a frontend framework whose cultural peak was the exact moment you started the project and is now widely considered tech debt. Who's to blame for this situation is for someone else to decide, but, in any case, you can eliminate this entire problem class by not having any dependencies beyond the JavaScript runtime.

A popular way to write JavaScript today is compile it from TypeScript (which I will use frequently as an example, because TypeScript is probably the [best reason](https://en.wikipedia.org/wiki/Straw_man#Steelmanning) to use a build system). TypeScript does not run natively in web browsers, so TypeScript code is not protected by [ECMA's](https://developer.mozilla.org/en-US/docs/Glossary/ECMA) fanatical devotion to backwards compatibility. Like any dependency, new major TypeScript versions are not guaranteed to be backwards compatible with the previous ones. They might be! But if they aren't, then you need to do maintenance if you want to use the modern development toolchain.

Maintenance is a cost paid for with labor, and open-source codebases are the projects that can least afford to pay it. Opting not to use a build step drastically minimizes the labor required to keep htmx up-to-date. This experience has been borne out by [intercooler.js](https://intercoolerjs.org), the predecessor to htmx which is maintained indefinitely with (as I understand) very little effort. When htmx 1.0 was released, TypeScript was at version 4.1; when intercooler.js was released, TypeScript was pre-1.0. Would code written in those TypeScript versions compile unmodified in today's TypeScript compiler (version 5.1 at the time of writing)? Maybe, maybe not.

But htmx is written in JavaScript, with no dependencies, so it will run unmodified for as long as web browsers remain relevant. Let the browser vendors do the hard work for you.

## Developer Experience
It is true that the TypeScript developer experience (DX) is better than the JavaScript developer experience in many respects. It is not true that the TypeScript DX is better in *every* respect, and the tendency of software engineers to view progress as a teleology of capability rather than choices with tradeoffs sometimes blinds them to the cost paid for the DX aspects they like. For instance, a small tradeoff you make for using TypeScript is that compiling it takes time, and you have to wait for it to recompile to test a change. Usually this cost is negligible, and well worth paying, but it is nonetheless a cost.

A more significant cost for using TypeScript is that the code running in the browser is not the code you wrote, which makes the browser's developer tools harder to use. When your TypeScript code throws an exception, you have to figure out how the stack trace (with its JavaScript line numbers, JavaScript function signatures, and so forth) maps to the TypeScript code that you wrote; when your JavaScript code throws an exception, you can click straight through to the source code, read the thing you wrote, and set a breakpoint in the debugger. This is *tremendous* DX. For many younger web developers who have never worked this way, it can be a revelatory experience.

Build step advocates point out that TypeScript can generate [source maps](https://firefox-source-docs.mozilla.org/devtools-user/debugger/how_to/use_a_source_map/index.html), which tell your browser what TypeScript corresponds to what JavaScript, and that's true! But now you have *another* thing to keep track of—the TypeScript you wrote, the JavaScript it generated, and the source map that connects these two. The hot-reloading development server you're now dependent on will keep these up to date for you on localhost—but what about on your staging server? What about in production? Bugs that appear in these environments will be harder to track down, because you've lost a lot of information about where they come from. These are solvable problems, but they're problems you created; they are a cost.

The htmx DX is very simple—your browser loads a single file, which in every environment is the exact same file you wrote. The tradeoffs required to maintain that experience are real, but they're tradeoffs that make sense for this project.

## Enforced Clarity
Modularization is one of the [honking great ideas](https://legacy.python.org/dev/peps/pep-0020/) of software. Modules make it possible to solve incredibly complex problems by breaking down code into well-contained substructures that solve smaller problems. Modules are really useful.

Sometimes, however, you want to solve simple problems, or at least relatively simple problems. In those cases, it can be helpful *not* to use the building blocks of more complex software, lest you emulate their complexity without creating commensurate value. At its core, htmx solves a relatively simple problem: it adds a handful of attributes to HTML that make it easier to replace DOM elements using the declarative character of hypertext. Requiring that htmx remain in a single file (again, around 3,500 LOC) enforces a degree of intention on the library; there is a real pressure when working on the htmx source to justify the addition of new code, a pressure which maintains an equilibrium of relative simplicity.

While the DX costs are obvious, there are also surprising DX benefits. If you search a function name in the source file, you'll instantly find every invocation of that function (this also mitigates the need for more-advanced code introspection). The lack of places for functionality to hide makes working on htmx a lot more approachable. Far, far more complex projects use aspects of this approach as well: SQLite3 compiles from a [single-file source amalgamation](https://www.sqlite.org/amalgamation.html) (though they use separate files for development, they're not *crazy*) which makes hacking on it [significantly easier](https://jvns.ca/blog/2019/10/28/sqlite-is-really-easy-to-compile/). You could never build the linux kernel this way—but htmx is not the linux kernel.

# Costs
Like any technology decision, choosing to forgo a build step has advantages and disadvantages. It's important to acknowledge those tradeoffs so that you can make an informed decision, and revisit that decision if some of the benefits or costs no longer apply. With the advantages of writing plain JavaScript in mind, let's consider some of the pain points it introduces.

## No static types
TypeScript is a strict superset of JavaScript, and some of the features it adds are very useful. TypeScript has... types, which make your [IDE better at suggesting code](https://grugbrain.dev/#grug-on-type-systems) and pointing out where you might have used methods incorrectly. The tools for automatically renaming and refactoring code are much more reliable for TypeScript than they are for JavaScript. The htmx code does have to be written in JavaScript, though, because browsers run JavaScript. And [as long as JavaScript is dynamically typed](https://github.com/tc39/proposal-type-annotations), the tradeoffs required to get true static typing in the htmx source are not worth it (htmx *users* can still take advantage of typed APIs, declared with `.d.ts` files).

Future versions of htmx might use JSDoc to get some of the same guarantees without the build step. Other libraries, like [Svelte](https://github.com/sveltejs/svelte/pull/8569), have been trending in this direction as well, in part due to the [debugging friction](https://news.ycombinator.com/item?id=35892250) that TypeScript files introduce.

## No ES6
Because htmx maintains support for Internet Explorer 11, and because it does not have a build step, every line of htmx has to be written in IE11-compatible JavaScript, which means no [ES6](https://262.ecma-international.org/6.0/). When people like me say that JavaScript is pretty good now, they are usually referring to language features that were introduced with ES6, like `async/await`, anonymous functions, and functional array methods (i.e. `.map`, `.forEach`)—none of which can be used in the htmx source.

While this is incredibly annoying, in practice it is not a huge impediment. The lack of some nice language features doesn't prevent you from writing code with functional paradigms. Would it be nice not to write a custom [forEach method](https://github.com/bigskysoftware/htmx/blob/b4a61c543b283eb2315a47708006783efb78f563/src/htmx.js#L375-L381)? Of course. But until all the browsers targeted by htmx support ES6, it's not hard to supplement ES5 with a few helper functions. If you are used to ES6, you will automatically write better ES5.

IE11 support is going to be dropped in htmx 2.0, at which point ES6 will be allowed in the source code.

## No modules in core
This point is obvious, but it's worth re-stating: the htmx source would be a lot tidier if it could be split it into modules. There are other factors that affect code quality [besides tidiness](https://www.steveonstuff.com/2022/01/27/no-such-thing-as-clean-code), but to the extent that the htmx source is high-quality, it is not because it is tidy.

This makes doing certain things with htmx very difficult. The [idiomorph algorithm](https://github.com/bigskysoftware/idiomorph) might be included in the htmx 2.0 core, but it's also maintained as a separate package so that people can use the DOM-morphing algorithm without using htmx. If the core could include multiple files, one could easily accomplish this with any number of mirroring schemes, such as git submodules. But the core is a single file, so the idiomorph code will have to live there as well.

# Final Thoughts
This essay might be better titled "Why htmx Doesn't Have a Build Step <em>Right Now</em>." As previously mentioned, circumstances change and these tradeoffs can be revisited at any time! One issue we're exploring at the moment has to do with releases. When htmx cuts releases, it uses a few different shell commands to populate the `dist` directory with minified and compressed versions of `htmx.js` (pedants are welcome to point out that this is obviously, in some sense, a build step). In the future, we might expand that script to auto-generate the [Universal Module Definition](https://github.com/umdjs/umd). Or we might have new distribution needs that require an even more involved setup. Who knows!

One of the core values of htmx is that it gives you *choice* in a web development ecosystem that has for the last decade been dominated by an increasingly complex JavaScript stack. Once you no longer have an enormous codebase of frontend JavaScript, there is far less pressure to adopt JavaScript on the backend. You can write backends in Python, Go, even NodeJS, and it doesn't matter to htmx—every mainstream language has mature solutions for formatting HTML. This is the principle of [Hypermedia On Whatever you'd Like (HOWL)](https://htmx.org/essays/hypermedia-on-whatever-youd-like/).

Writing JavaScript with no build process is one of the options available to you once you no longer require NextJS or SvelteKit to manage the spiraling complexity of SPA frameworks. That choice makes sense for htmx development today, and it may or may not make sense for your app too.
