---
layout: layout.njk
title: Complexity Budget
---

## Complexity Budgets

Every application involves managing a complexity budget.  A complexity budget can be defined as:

> An explicit or implicit allocation of complexity across the entire application

"Complexity" here is defined subjectively (rather than [formally](https://en.wikipedia.org/wiki/Programming_complexity))
and in [Stewartian Terms](https://en.wikipedia.org/wiki/I_know_it_when_I_see_it): "I know it when I see it."  Or, more
specifically to software development, "I know it when I *feel* it."

One of the primary jobs of an application architect is to manage a complexity budget:

* Decide if a given feature is "worth it"
* Decide if a given implementation is "worth it"
* Add in appropriate system boundaries to limit complexity between component
* Etc.

Note that attempting to address complexity can, in fact, add more complexity.  A good example of this, from experience
is [OSGi](https://en.wikipedia.org/wiki/OSGi), which when applied to an application I was working on, made things
*far more complex*, grinding development to a halt.  (This is not to say OSGi is universally bad, just that in this
case, rather than boosting developer productivity, it effectively ended it.)

A good software architect is someone who manages their software budget effectively, either explicitly or implicitly

### Complexity Growth

I assert, without evidence, that Stewartian Application Complexity grows roughly geometrically with the size of an 
application.  By proper factoring by experience developers, this curve can be held down for quite some time, and this 
is one major reason why many good developers are so much more productive than others.  

However, this doesn't change the fact that, somewhere out there, there is a Complexity Wall lurking and, if you aren't 
careful you will run into it and grind development to a halt.  I have had multiple experiences with this: one day, 
inexplicably, development on a system that I was working on went from feeling "large, but managable" to 
"this is impossible to deal with".

### Spending Your Complexity Budget Wisely

Here are some tools for managing your complexity budget:

1. Foremost: understanding that there *is* a complexity budget that needs to be managed
1. Saying "No" - probably the easiest, best and, also, hardest tool to use in your battle with complexity
1. Embracing [KISS](https://en.wikipedia.org/wiki/KISS_principle), even if it means admitting you are stupid (It's often very good for an organization if the senior developers can admit they are fallible)
1. Focus your "complexity spend" on the areas where your application is adding value and/or differentiates itself
1. Proper factoring of components - this is an art: Too many components and your complexity explodes.  Too few... same. 
1. Choosing the proper balance of expressiveness and restrictions for a component

Unfortunately, experience shows that managing Stewartian Complexity is a subjective endeavor, and many talented and
experience developers will disagree on the proper course of action at a given decision point.

None the less, by making the concept of a complexity budget explicit, these conversations can be more productive and
ultimately lead to better software outcomes.

### A Final Note

All mature applications are complex.  

Finding a new codebase "complex" is *not* an excuse for tearing everything
apart or aggressive refactoring.  We must always bear in mind [Chesterton's Fence](https://fs.blog/2020/03/chestertons-fence/).

If an application is functioning well (or even reasonably) then we should assume that the complexity budget was well
(or reasonably) managed.  And we must also bear in mind that, with unfortunate frequency, attempts at addressing complexity
in existing, large applications often fail or, sadly, make things worse.