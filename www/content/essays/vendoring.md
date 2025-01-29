+++
title = "Vendoring"
description = """\
  Carson Gross explores the concept of 'vendoring' in software development, where external project sources are copied \
  directly into a project. He covers the benefits of vendoring, such as improved visibility and control over \
  dependencies, and discusses challenges like transitive dependencies and the culture of dependency in modern software \
  development. He also contrasts vendoring with modern dependency management tools, and considers the potential for \
  vendor-first dependency managers to combine the strengths of both approaches. He encourages a rethinking of \
  dependencies and promotes a more independent approach to software development."""
date = 2025-01-27
updated = 2025-01-27
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

"Vendoring" software is a technique where you copy the source of another project directly into your own project. 

It is an old technique that has been used for time immemorial in software development, but the term "vendoring" to 
describe it appears to have originated in the [ruby community](https://stackoverflow.com/posts/72115282/revisions).

Vendoring can be and is still used today. You can vendor htmx, for example, quite easily.

Assuming you have a `/js/vendor` directory in your project, you can just download the source into your own project like 
so:

```bash
curl https://raw.githubusercontent.com/bigskysoftware/htmx/refs/tags/v2.0.4/dist/htmx.min.js > /js/vendor/htmx-2.0.4.min.js
```

You then include the library in your `head` tag:

```html
<script src="/js/vendor/htmx-2.0.4.min.js"></script>
```

And then you check the htmx source into your own source control repository.  (I would even recommend considering using 
the [non-minimized version](https://raw.githubusercontent.com/bigskysoftware/htmx/refs/tags/v2.0.4/dist/htmx.js), so
you can better understand and debug the code.)

That's it, that's vendoring.

## Vendoring Strengths

OK, great, so what are some strengths of vendoring libraries like this?

It turns out there are quite a few:

* Your entire project is checked in to your source repository, so no external systems beyond your source control need
  to be involved when building it
* Vendoring dramatically improves dependency *visibility*: you can _see_ all the code your project depends on, so you
  won't have a situation like we have in htmx, where we feel like we only have a few development dependencies, whe in
  fact we may have a lot
* This also means if you have a good debugger, you can step into the library code as easily as any other code.  You
  can also read it, learn from it and even modify it if necessary.
* From a security perspective, you aren't relying on opaque code.  Even if your package manager has
  an integrity hash system, the actual code may be opaque to you.  With vendored code it is checked in and can be
  analysed automatically or by a security team.
* Personally, it has always seemed crazy to me that people will often resolve dependencies at deployment time, right
  when your software is about to go out the door.  If that bothers you, like it does me, vendoring puts a stop to it.

On the other hand, vendoring also has one massive drawback: there typically isn't a good way to deal with what is called
the [transitive dependency](https://en.wikipedia.org/wiki/Transitive_closure) problem.

If htmx had sub-dependencies, that is, other libraries that it depended on, then to vendor it properly you would have to
start vendoring all those libraries as well.  And if those dependencies had further dependencies, you'd need to install 
them as well... And on and on.  

Worse, two dependencies might depend on the same library, and you'll need to make sure you get the 
[correct version](https://en.wikipedia.org/wiki/Dependency_hell) of that library for everything to work.

This can get pretty difficult to deal with, but I want to make a paradoxical claim that this weakness (and, again, it's 
a real one) is actually a strength in some way:

Because dealing with large numbers of dependencies is difficult, vendoring encourages a culture of _independence_.

You get more of what you make easy, and if you make dependencies easy, you get more of them.  Making dependencies,
_especially_ transitive dependencies, more difficult would make them less common.

And, as we will see in a bit, maybe fewer dependencies isn't such a bad thing.

## Dependency Managers

That's great and all, but there are [significant](https://gist.github.com/datagrok/8577287)
[drawbacks](https://web.archive.org/web/20180216205752/http://blog.bithound.io/why-we-stopped-vendoring-our-npm-dependencies/)
to vendoring, particular the transitive dependency problem.

Modern software engineering uses dependency managers to deal with the dependencies of software projects.  These tools 
allow you to specify your projects dependencies, typically via some sort of file.  They then they will install those
dependencies and resolve and manage all the other dependencies that are necessary for those dependencies to work.  

One of the most widely used package managers is NPM: The [Node Package Manager](https://www.npmjs.com/).  Despite having
no runtime dependencies, htmx uses NPM to specify 16 development dependencies.  Development dependencies are dependencies
that are necessary for development of htmx, but not for running it.  You can see the dependencies at the bottom of
the NPM [`package.json`](https://github.com/bigskysoftware/htmx/blob/master/package.json) file for the project.

Dependency managers are a crucial part of modern software development and many developers today couldn't imagine
writing software without them.

### The Trouble with Dependency Managers

So dependency managers solve the transitive dependency problem that vendoring has.  But, as with everything in software 
engineering, there are tradeoffs associated with them.  To see some of these tradeoffs, let's take a look at the 
[`package-lock.json`](https://github.com/bigskysoftware/htmx/blob/master/package-lock.json) file in htmx.

NPM generates a `package-lock.json` file that contains the resolved transitive closure of dependencies for a project, with 
the concrete versions of those dependencies.  This helps ensure that the same dependencies are used unless a user
explicitly updates them.

If you take a look at the `package-lock.json` for htmx, you will find that the original 13 development dependencies have
ballooned into a total of 411 dependencies when all is said and done.

htmx, it turns out, relies on a huge number of packages, despite priding itself on being a relatively lean.  In fact,
the `node_modules` folder in htmx is a whopping 110 megabytes!

But, beyond this bloat there are deeper problems lurking in that mass of dependencies.

While writing this essay I found that htmx apparently depends on the 
[`array.prototype.findlastindex`](https://www.npmjs.com/package/array.prototype.findlastindex), a 
[polyfill](https://en.wikipedia.org/wiki/Polyfill_(programming)) for a JavaScript feature introduced in 
[2022](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex).

Now, [htmx 1.x](https://v1.htmx.org/) is IE compatible, and I don't *want* polyfills for _anything_: I want to write
code that will work in IE without any additional library support.  And yet a polyfill has snuck in via a chain
of dependencies (htmx does not directly rely on it) that introduces a dangerous polyfill that would let me write
code that would break in IE, as well as other older browsers.  

This polyfill may or may not be available when I run the htmx [test suite](https://htmx.org/test/) (it's hard to tell) 
but that's the point: some dangerous code has snuck into my project without me even knowing it, due to the number
and complexity of the (development) dependencies it has.

This demonstrates significant _cultural_ problem with dependency managers: 

They tend to foster a culture of, well, dependency.

A spectacular example of this was the infamous [left-pad incident](https://en.wikipedia.org/wiki/Npm_left-pad_incident),
in which an engineer took down a widely used package and broke the build at companies like Facebook, PayPal, Netflix,
etc.

That was a relatively innocuous, although splashy, issue, but a more serious concern is 
[supply chain attacks](https://en.wikipedia.org/wiki/Supply_chain_attack), where a hostile entity is able to compromise
a company via code injected unwittingly via dependencies.

The larger our dependency graph gets, the worse these problems get.

## Dependencies Reconsidered

I'm not the only person thinking about our culture of dependency.  Here's what some other, smarter folks have to say 
about it:

[Armin Ronacher](https://x.com/mitsuhiko), creator of [flask](https://flask.palletsprojects.com/en/stable/)
recently said this on [the ol'twits](https://x.com/mitsuhiko/status/1882739157120041156):

> The more I build software, the more I despise dependencies. I greatly prefer people copy/pasting stuff into their own
> code bases or re-implement it. Unfortunately the vibe of the time does not embrace that idea much. I need that vibe
> shift.

He also wrote a great blog post about his
[experience with package management](https://lucumr.pocoo.org/2025/1/24/build-it-yourself/) in the Rust ecosystem:

> It's time to have a new perspective: we should give kudos to engineers who write a small function themselves instead
> of hooking in a transitive web of crates. We should be suspicious of big crate graphs. Celebrated are the minimal
> dependencies, the humble function that just quietly does the job, the code that doesn't need to be touched for years
> because it was done right once.

Please go read it in full.

Back in 2021, [Tom Macwright](https://macwright.com) wrote this in
[Vendor by default](https://macwright.com/2021/03/11/vendor-by-default)

> But one thing that I do think is sort of unusual is: I’m vendoring a lot of stuff.
>
> Vendoring, in the programming sense, means “copying the source code of another project into your project.” It’s in
> contrast to the practice of using dependencies, which would be adding another project’s name to your package.json
> file and having npm or yarn download and link it up for you.

I highly recommend reading his take on vendoring as well.

## Software Designed To Be Vendored

Some good news, if you are an open source developer and like the idea of vendoring, is that there is a simple way to 
make your software vendor-friendly: remove as many dependencies as you can.

[DaisyUI](https://daisyui.com/), for example, has been in the process of 
[removing their dependencies](https://x.com/Saadeghi/status/1882556881253826941), going from 100 dependencies in 
version 3 to 0 in version 5.

There is also a set htmx-adjacent projects that are taking vendoring seriously:

* [Surreal](https://github.com/gnat/surreal) - a lightweight jQuery alternative
* [Facet](https://github.com/kgscialdone/facet) - an HTML-oriented Web Component library
* [fixi](https://github.com/bigskysoftware/fixi) - a minimal htmx alternative

None of these JavaScript projects are available in NPM, and all of them [recommend](https://github.com/gnat/surreal#-install) 
[vendoring](https://github.com/kgscialdone/facet#installation) the [software](https://github.com/bigskysoftware/fixi#installing) 
into your own project as the primary installation mechanism.

## Vendor First Dependency Managers?

The last thing I want to briefly mention is a technology that combines both vendoring and dependency management:
vendor-first dependency managers.  I have never worked with one before, but I have been pointed to 
[vend](https://github.com/fosskers/vend), a common lisp vendor oriented package manager (with a great README), as well 
as [go's vendoring option](https://go.dev/ref/mod#vendoring).  

In writing this essay, I also came across [vendorpull](https://github.com/sourcemeta/vendorpull) and 
[git-vendor](https://github.com/brettlangdon/git-vendor), both of which are small but interesting projects.

These all look like excellent tools, and it seems to me that there is an opportunity for some of them (and tools like 
them) to add additional functionality to address the traditional weaknesses of vendoring, for example:

* Managing transitive dependencies, if any
* Relatively easy updates of those dependencies
* Managing local modifications made to dependencies (and maybe help manage contributing them upstream?)

With these additional features I wonder if vendor-first dependency managers could compete with "normal" dependency 
managers in modern software development, perhaps combining some of the benefits of both approaches.

Regardless, I hope that this essay has helped you think a bit more about dependencies and perhaps planted the idea that
maybe your software could be a little less, well, dependent on dependencies.
