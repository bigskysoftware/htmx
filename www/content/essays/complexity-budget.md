+++
title = "Complexity Budget"
description = """\
  In this essay, Carson Gross explores the concept of a complexity budget in software development. He discusses how \
  managing complexity across applications is a critical responsibility for architects and developers, while examining \
  strategies for effective complexity management and the challenges that arise when attempting to reduce it."""
date = 2020-10-29
updated = 2024-01-21
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

Every software project involves managing a complexity budget.  

A complexity budget can be defined as:

> An explicit or implicit allocation of complexity across the entire application

"Complexity" here is defined subjectively (rather than [formally](https://en.wikipedia.org/wiki/Programming_complexity))
and in [Stewartian Terms](https://en.wikipedia.org/wiki/I_know_it_when_I_see_it): "I know it when I see it."

Or, more specifically to software development: "I know it when I *feel* it."

One of the primary jobs of an application architect is to manage a projects complexity budget:

* Decide if a given feature is "worth it"
* Decide if a given implementation is "worth it"
* Add appropriate system boundaries to limit complexity between components
* And so on

An infuriating aspect of complexity is that that attempts to address it can, in fact, add more complexity.

A good example of this from experience was when a company I worked at added [OSGi](https://en.wikipedia.org/wiki/OSGi) to the system to manage the
increasing complexity of the project.  It seemed like a reasonable approach, 
it offered a sophisticated [module](https://www.osgi.org/resources/what-is-osgi/) system,
it was recommended by a newly hired architect, and it even says on the "What is OSGI page":

> OSGi significantly reduces complexity in almost all aspects of development: code is easier to write and test, reuse is
> increased, build systems become significantly simpler, deployment is more manageable, bugs are detected early, and 
> the runtime provides an enormous insight into what is running.

What's not to like?

Unfortunately, adding OSGi to that project effectively ground the entire project to a halt: it took a few of our best
engineers out of normal application development for over a year, and when they were done the codebase was even more
difficult to work with than when they started.  Feature velocity, already teetering, collapsed.

This is not to say OSGi is universally bad.  But, in this case, rather than boosting our development teams productivity,
it effectively ended it.

A good software architect is someone who manages the software budget of their project effectively, either explicitly or 
implicitly.

## Complexity Growth

My sense, admittedly without hard evidence, is that Stewartian Application Complexity grows roughly geometrically with 
the size of an application.  Proper [factoring](https://en.wikipedia.org/wiki/Decomposition_(computer_science)) by 
experienced developers can hold this curve down for quite some time.

However, this doesn't change the fact that, somewhere out there, there is a Complexity Wall lurking.

And, if you aren't careful, you will run headlong into it and grind your development velocity to a halt.

I have had multiple experiences with this: one day, inexplicably, development on a system that I was working on went 
from feeling "large, but manageable" to "this is impossible to deal with".

## Spending Your Complexity Budget Wisely

Here are some tools for managing your complexity budget:

1. Foremost: understanding that there *is* a complexity budget that needs to be managed
1. Focus your "complexity spend" on the areas where your application is adding value and/or differentiates itself
1. Saying "No" - probably the easiest, best and, also, hardest tool to use in your battle with complexity
1. Embracing [KISS](https://en.wikipedia.org/wiki/KISS_principle), even if it means admitting you are stupid (Note that it's often very good for an organization if the senior developers can admit they are fallible)
1. Proper factoring of components - this is an art: Too many components and your complexity explodes.  Too few... same. 
1. Choosing the proper balance of expressiveness and restrictions for a component

Unfortunately, experience shows that managing Stewartian Complexity is a subjective endeavor and that many talented and
experience developers will disagree on the proper course of action at a given decision point.

Nonetheless, by making the concept of a complexity budget explicit in your software project, these conversations can be
more productive and ultimately lead to better software outcomes.

## A Final Note

Almost all mature applications are complex.  

Finding a new codebase "complex" is *not* an excuse for tearing everything apart or aggressive refactoring.  We must always bear in mind [Chesterton's Fence](https://fs.blog/2020/03/chestertons-fence/).

If an application is functioning well (or even reasonably) then we should assume that the complexity budget was well
(or at least reasonably) managed.

And we must always remember that, with unfortunate frequency, big attempts at addressing complexity in existing, large 
applications often fail or, sadly, make things worse.
