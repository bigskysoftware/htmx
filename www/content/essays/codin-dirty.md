+++
title = "Codin' Dirty"
date = 2024-07-02
updated = 2024-07-02
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

<center>

![quick-and-dirty](/img/quick-and-dirty.png)

</center>

> “Writing clean code is what you must do in order to call yourself a professional. There is no reasonable excuse for 
> doing anything less than your best.” [Clean Code](https://www.goodreads.com/book/show/3735293-clean-code)

In this essay I want to talk about my approach to writing code and contrast it in particular with the recommendations of
the book [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882).

I am going to call my approach "Codin' Dirty" because I often use techniques that conflict with Clean Code recommendations.

I don't really consider my code all that dirty: yeah, it's a little junky in places, but for the most part I'm 
happy with it and find it easy enough to maintain with decent levels of quality.

I also don't think *you* need to code dirty.  My goal here is not to convince you to code the way I code, but rather
to show that you don't *have* to follow the Clean Code recommendations to write reasonable, maintainable and
successful software.

I have been around for a while and I have seen a lot of different approaches to building software work.  Some people are 
very effective using Object-Oriented Programming, other very smart people hate it.  Some people love the expressiveness 
of dynamic languages, some smart people hate dynamic languages with a passion. Some people ship successfully while 
strictly follow Test Driven Development, others slap a few end-to-end tests on at the end of the
project or (what seems crazy to me) don't bother testing at all.

I have seen all these different approaches ship (and maintain) successful software.

So, again, my goal here is not to convince you that my way of coding is the only way, but rather to show you (particularly
younger developers, who are prone to being intimidated by terms like "Clean Code") that you can have a successful 
programming career even it they're tryna catch you codin' dirty.

## TLDR

The TLDR of my codin' dirty approach is:

* (Some) big functions are good
* Prefer integration tests to unit tests
* Keep class/interface/concept count down, if possible

## I Like Big Functions

I think that large methods are fine. In fact, I think that *some* large methods are usually a *good* thing in a codebase.

This is in contrast with Clean Code, which says:

> “The first rule of functions is that they should be small. The second rule of functions is that they should be 
> smaller than that.” [Clean Code](https://www.goodreads.com/book/show/3735293-clean-code)

Now, it always depends on the type of work that I'm doing, of course, but I usually tend to organize my functions into the 
following:

* A few large "crux" functions, the real meat of the module.  I set no bound on the Lines of Code (LOC) of these methods.
* A fair number of "support" functions, which tend to be in the 10-20 LOC range
* A fair number of "utility" functions, which tend to be in the 5-10 LOC range

As an example of a "crux" method, consider the [`issueAjaxRequest()`](https://github.com/bigskysoftware/htmx/blob/7fc1d61b4fdbca486263eda79c3f31feb10af783/src/htmx.js#L4057)
in [htmx](https://htmx.org).  This method is nearly 400 lines long.

Definitely not clean!

However, in this function there is a lot of context to keep around, and it lays out a series of specific steps that must
proceed in a fairly linear manner.  There isn't much reuse to be found by splitting it up into other functions and I
think it would hurt the clarity (and the debuggability!) of the function if I did so just based on the general sense
that functions should be small.


### Important Things Should Be Big

A major reason I like big functions is that I think that in software, all other things being equal, important things should 
be big, whereas unimportant things should be little.

Consider a visual representation of "Clean" code versus "Dirty" code:

<div style="padding: 1em">

![clean-v-dirty.png](/img/clean-v-dirty.png)

</div>

When you split your functions into many equally sized, small implementations you end up smearing the important parts of your
implementation around, even if they are better expressed in a larger function.

Everything looks the same: a function signature definition, followed by an if statement or a for loop, maybe a function 
call or two, and a return.

If you allow your important functions to be larger it is easier to pick them out from the sea of functions, they are
obviously important: just look at them, they are big!

There are also fewer functions in general in all categories, since much of the code has been merged into larger functions.  This 
makes it easier to keep the important, and maybe even the medium-important function names and signatures in your head.

I would much rather come into a module that looks "dirty" like this than one that is "clean": I will be able to understand
it more quickly and will remember the important parts more easily.

### Empirical Evidence

How about the empirical (dread word in software!) evidence for the ideal function size?

In [Chapter 7, Section 4](https://flylib.com/books/en/2.823.1.64/1/) of [Code Complete](https://en.wikipedia.org/wiki/Code_Complete),
Steve McConnell lays out some evidence for and against longer functions.  The results are mixed, but many
of the studies he cites show better errors-per-line metrics for *larger*, rather than smaller, functions.

### Other Modern Examples

Now, those are older studies (we should do some modern ones!) so maybe they aren't relevant to today's coding environments.
And perhaps htmx is [too idiosyncratic and sloppy](@/essays/htmx-sucks.md) to draw any conclusions regarding software development from.  

So let's take a look at some other modern pieces of software.

Consider the [`sqlite3CodeRhsOfIn()`](https://github.com/sqlite/sqlite/blob/70989b6f5923a732b0caee881bd7c3ff8859e9c5/src/expr.c#L3502)
of [SQLite](https://sqlite.com/), a popular open source database.  This function looks to be > 200LOC.  Despite this, I haven't 
noticed SQLite having maintenance or code quality issues.

Or consider the [`ChromeContentRendererClient::RenderFrameCreated()`](https://github.com/chromium/chromium/blob/6fdb8fdff0ba83db148ff2f87105bc95e5a4ceec/chrome/renderer/chrome_content_renderer_client.cc#L591)
function in the [Google Chrome](https://www.google.com/chrome/index.html) Web Browser.  It also looks to be over 200 LOC.
I'm not saying chrome isn't a beast, but the programmers writing this are pretty smart people, and the project continues
to make progress and is well maintained.

Next, consider the [`kvstoreScan()`](https://github.com/redis/redis/blob/3fcddfb61f903d7112da186cba8b1c93a99dc87f/src/kvstore.c#L359)
method in [Redis](https://redis.io/).  This is smaller, on the order of 40LOC, but still far larger than Clean Code would
suggest.  A quick scan through the Redis codebase will furnish many other "dirty" examples.

These are all C-based projects, so maybe Clean Code's rule of small functions only applies to object-oriented, Java-like languages?

OK, take a look at the [`update()`](https://github.com/JetBrains/intellij-community/blob/8c6cc1579ac358451ba2c5b8a54853249fdc5451/java/compiler/impl/src/com/intellij/compiler/actions/CompileAction.java#L60)
method in the `CompilerAction` class of [IntelliJ](https://www.jetbrains.com/idea/), which is roughly 90LOC.  Again, 
poking around their codebase will reveal many other large functions well over 50LOC.

SQLite, Chrome, Redis & IntelliJ...

These are important, complicated, successful & well maintained pieces of software, and yet 
we can find large functions in all of them.  

Now, I don't want to imply that these projects agree with this essay in any way, but I think th you also shouldn't be 
afraid of large functions, nor should you break those large functions up simply in order to 
make your code "clean".  You should only do so when it allows for reuse or some other necessary functionality.

## I Prefer Integration Tests to Unit Tests

I am a huge fan of testing.  htmx is possible because we have a good [test suite](https://htmx.org/test) that helps us ensure
that the library stays stable as we work on it.  When I started on [intercooler.js](https://intercoolerjs.org), the 
predecessor to htmx, I was a dyed-in-the-wool static typing guy.  But working on intercooler and in 
[Ruby-on-Rails](https://rubyonrails.org/) showed me that, with proper testing, it was possible for me to produce
quality software in dynamic languages.

As a side note, we recently introduced [JSDoc](https://jsdoc.app/) annotations to the htmx codebase, to get some of
the benefits of static typing without introducing a build step.  In that effort we found no serious errors.  I can
think of two minor issues that have come up in the history of the htmx project that could have been prevented by static typing.
I still like static typing [for other reasons](https://grugbrain.dev/#grug-on-type-systems), but I think that with a good 
test suite the "correctness" argument is less compelling than I did a decade ago.

If you take a look at the [test suite](https://github.com/bigskysoftware/htmx/blob/master/test/core/ajax.js) one thing
you might notice is the relative lack of [Unit Tests](https://en.wikipedia.org/wiki/Unit_testing).  We have very few
test that directly call methods on the htmx object.  Instead, the tests are mostly 
[Integration Tests](https://en.wikipedia.org/wiki/Integration_testing): they set up a particular DOM configuration
with some htmx attributes and then, for example, click a button and verify some things about the state of the DOM afterward.

Clean Code, on the other hand, recommends extensive Unit Testing, coupled with Test-First Development:

> **First Law** You may not write production code until you have written a failing unit test.
> **Second Law** You may not write more of a unit test than is sufficient to fail, and not compiling is failing.
> **Third** Law You may not write more production code than is sufficient to pass the currently failing test.
> 
> --[Clean Code](https://www.goodreads.com/book/show/3735293-clean-code)

I generally avoid doing this sort of thing, especially early on in projects.  Early on you often have no
idea what the right abstractions for your domain are, and you need to try a few different approaches to figure out what
you are doing.  If you adopt this approach you end up with a bunch of tests that are going to break as you explore the
problem space, trying to find the right abstractions.  

Further, Unit Testing encourages the exhaustive testing of every single method you write, so you often end up having more 
tests to be tied to a particular implementation of things, rather than the high level API or conceptual ideas of the
module of code.

Of course, you can refactor your tests as you change things, but the reality is that a large and growing test suite takes
on its own mass and momentum in a project, making radical changes more and more difficult as they are added.  You end up
creating things like test helpers, mocks, etc. for your testing code.  These are all code artifacts that make changing 
your system more and more difficult over time, a problem that many testing advocates fail to acknowledge.

### Dirty Testing

My preferred approach in most situations is to do some unit testing, but not a ton, early on in the project and wait 
until the core APIs and concepts of a module have crystallized.  

At that point I then test the API exhaustively with integrations tests.

In my experience, these Integration Tests are much more useful than Unit Tests, because they remain stable and useful 
as you change the implementation around.  They aren't as tied to the current codebase, but rather express higher level
invariants that survive refactors much more readily.

I have also found that once you have a few higher-level integration tests, you can then do Test-Driven development, but
at the higher level: you don't think about units of code, but rather the API you want to achieve, write the tests for that
and then implement it however you see fit.

So, I think you should hold off on committing to a large test suite until later in the project, and that test suite
should be done at a higher level than Clean Code suggests.

## I Prefer To Minimize Classes

A final "dirty" code practice I follow is that I try to minimize the number of classes in my projects.  This definitely
makes me a [black sheep](https://grammarist.com/idiom/black-sheep/) in the Java community, but I have found that it is
very easy to overwhelm a particular problem with classes and interfaces if you try to decompose it too much.

In the OO world, [architecture astronauts](https://en.wikipedia.org/wiki/Architecture_astronaut) are often extremely 
intimidating to other developers, particularly younger developers, and this puts pressure on everyone to make their
code as abstract as possible, which inevitably leads to an explosion of classes, interfaces and concepts.

Now, Clean Code does not say that you should maximize the # of classes in your system, but recommendations it
makes tend to lead to this outcome:

> * "Prefer Polymorphism to If/Else or Switch/Case"
> * "The first rule of classes is that they should be small. The second rule of classes is that they should be smaller 
>   than that."
> * "The Single Responsibility Principle (SRP) states that a class or module should have one, and only one, reason to 
>    change."
> * "The first thing you might notice is that the program got a lot longer. It went from a little over one page to 
>    nearly three pages in length."

I don't think classes should be particularly small, or that you should prefer polymorphism to a simple (or even a long,
janky) if/else statement, or that a given module should only have one reason to change.  And I think the last sentence
is a good indication why: you tend to end up with a lot more code which may be of little real benefit to the system.

### "God" Objects

You will often hear people criticise the idea of ["God objects"](https://en.wikipedia.org/wiki/God_object) and I
can of course see where the criticism comes from: an incoherent class with a morass of unrelated methods is obviously 
a bad thing.

However, I think that fear of "God objects" can tend to lead to over-factoring software as well.

To balance out this fear, let's look at one of my favorite software packages, [Active Record](https://guides.rubyonrails.org/active_record_basics.html).

Active Record provides a way for you to map ruby object to a database, it is what is called an 
[Object/Relational Mapping](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping) tool.  And it does a great
job of that, in my opinion: it makes the easy stuff easy, and you can kick out to raw SQL when you need to without much
fuss.

But that's not all the Active Record objects are good at: they also provide excellent functionality for building HTML
in the [view layer](https://guides.rubyonrails.org/action_view_overview.html) of Rails.  Now, they don't include *view
specific* pieces of functionality, but they do offer functionality that is very useful on the view side, such as providing
and API to retrieve error messages, even at the field level.

When you are writing Ruby on Rails applications you simply pass your Active Record instances out to the view.

Compare this with a more factored implementation, where validation errors are handled as their own "concern".  Now you need
to pass (or at least access) two different things in order to properly generate your HTML.  It's not uncommon in the Java
community to adopt the [DTO](https://www.baeldung.com/java-dto-pattern) pattern and have another set of objects entirely
distinct from the ORM layer that is passed out to the view.

I like the Active Record approach.  It may not be properly [separating concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
when looked at from a purist perspective, but *my* concern is often getting data from a database into an HTML document,
and Active Record does that job admirably without me needing to deal with a bunch of other objects along the way.

## Conclusion

All of this, again, is not to convince you to code the way I code, or to suggest that the way I code is "optimal" in 
any way. Rather it is to give you, and especially you younger developers out there, a sense that you don't *have* to write code
the way that many thought leaders suggest in order to have a successful software career.

I have never liked the morality-tinted rhetoric that sometimes surrounds things like Clean Code, Agile & TDD and, in my 
experience, there are plenty of different ways to produce successful and maintainable software.
