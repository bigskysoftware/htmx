+++
title = "Prefer If Statements To Polymorphism..."
description = """\
  In this collection of tweets, Carson Gross explores unconventional programming principles, including favoring if \
  statements over polymorphism, minimizing abstractions, and prioritizing practical, implementation-driven \
  development. He challenges traditional software design norms, advocating for simplicity, locality, and utility over \
  complexity and abstraction."""
date = 2024-12-07
updated = 2024-12-07
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

## Or, Watching Myself Lose My Mind In Real Time...

> "Invert, always invert." --Carl Jacobi, by way of Charlie Munger

* *[If Statements](https://x.com/htmx_org/status/1843804410377535533)*
  > prefer if statements to polymorphism 
  > 
  > whenever you are tempted to create a class, ask yourself: "could this be an if statement instead?"
* *[The Closed/Closed Principle](https://x.com/htmx_org/status/1843805753007845474)*
  > In grug-oriented programming, the closed–closed principle (CCP) states "software entities (classes, modules, functions, etc.) should be closed for extension, but also closed for modification"
  > 
  > they should just do something useful man 
* *[The Minimize Abstractions Principle](https://x.com/htmx_org/status/1843806270559793475)*
  > The Minimize Abstractions Principle (MAP) is a computer programming principle that states that "a module should 
  > minimize the number of abstractions it contains, both in API and in implementation.  Stop navel gazing nerd." 
* *[The Try It Out Substitution Principle](https://x.com/htmx_org/status/1843807054970139139)*
  > The "Try It Out" Substitution Principle states that you should try something out and, if that doesn't work, think about why, and substitute something else for it instead. 
  > 
  > It is common to need to substitute multiple things to hit on the right thing eventually. 
* *[The Useful Stuff Principle](https://x.com/htmx_org/status/1843807769557909528)*
  > The Useful Stuff Principle states that entities must depend on useful stuff, not overly abstract nonsense. It states that  a high-level module can depend on a low-level module, because that's how software works.
* *[Dependencies](https://x.com/htmx_org/status/1843808113230860419)*
  > The The Existence of Dependencies Is Not An Excuse For Destroying The Codebase Principle states that the existence of dependencies is not an excuse for destroying the codebase
* *[Abstraction Budget](https://x.com/htmx_org/status/1843821830207099007)*
  > consider giving your developers an abstraction budget
  >
  > when they exhaust that budget & ask for more, tell them they can have another abstraction when they remove an existing one
  >
  > when they complain, look for classes with the term "Factory",  "Lookup" or "Visitor" in their names
* *[Fewer Functions](https://x.com/htmx_org/status/1843822378352291914)*
  > if your function is only called in one place, consider inlining it & reducing the total number of method signatures in your module, to help people better understand it
  > 
  > studies show longer methods have fewer bugs per line of code, so favor longer methods over many smaller methods
* *["God" Object](https://x.com/htmx_org/status/1843823231771521367)*
  > consider creating "God" objects that wrap a lot of functionality up in a single package
  >
  > consumers of your API don't want to learn 50 different classes to get something done, so give them a few that provide the core functionality of your module with minimal fuss
* *[Copy & Paste Driven Development](https://x.com/htmx_org/status/1843827082687852706)*
  > copy&paste driven development is a development methodology where, when you need to reuse some code but in a slightly different manner, you copy & paste the code & then modify it to satisfy the new requirements
  > 
  > this contrasts with designing an elaborate object model, for example
* *[Implementation Driven Development](https://x.com/htmx_org/status/1843828023747063866)*
  > implementation driven development is a development methodology where you first explore various implementations of your idea to determine the best one, then add tests for it
  > 
  > no test code may be written without first having some implementation code to drive that test
* *[Mixing Concerns](https://x.com/htmx_org/status/1843830823113634132)*
  > Mixing of Concerns is a design methodology whereby "concerns" of various kinds are mixed into a single code unit.  This improves locality in that code unit by placing all relevant logic within it.  An example of this is hypermedia, which mixes control & presentation information.
* *[Macroservices Architecture](https://x.com/htmx_org/status/1843831529300267103)*
  > a macroservice architecture revolves around "macroservices": network-deployed modules of code that provide a significant amount of functionality to the overall system
  > 
  > by adopting a macroservice-based architecture you minimize deployment complexity & maximize resource utilization
* *[Sorry](https://x.com/htmx_org/status/1844005320223539524)*
  > kinda had a manic break last night my bad
