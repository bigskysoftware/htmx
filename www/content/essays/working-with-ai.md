+++
title = "Working With AI: A Concrete Example"
description = """\
  In this essay, Carson Gross walks through a concrete bug fix in hyperscript to show where AI helped, \
  where it fell short, and why keeping a knowledgeable human in the loop is what kept complexity in check."""
date = 2026-06-29
updated = 2026-06-29
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

I am, generally, ambivalent towards AI.  There is no doubt it has become a very powerful tool for development in the 
last year, but it also comes with many dangers, both
for us individually (e.g. the slow dulling of our intellects) as well as collectively (e.g. environmental concerns,
increasingly expensive personal computing, etc.)

In ["Code is Cheap(er)"](@/essays/code-is-cheap.md), I warn about The Sorcerer's Apprentice problem, where a developer becomes reliant on AI and is unable to
understand and properly address issues that come up in the systems they are building.

In this article I want to go through a specific interaction that I had with AI while maintaining 
[hyperscript](https://hyperscript.org) to show the strengths and weaknesses of AI in general and to demonstrate
The Sorcerer's Apprentice problem (which I narrowly avoided) in particular.

## The Hyperscript Parser

For some background, hyperscript is an alternative interpreted scripting language for the web.  It is, ironically,
written [entirely in JavaScript](https://github.com/bigskysoftware/_hyperscript/blob/master/src/_hyperscript.js).

It is a strange piece of software: I intentionally broke many of the rules of parsing when writing it as an experiment
to see how things would work out.  

Some examples:

* Parsing logic is colocated [on parse elements](https://github.com/bigskysoftware/_hyperscript/blob/ea9a6534d24cf5c7257adcaad75ee75b0c612d8e/src/parsetree/expressions/expressions.js#L275)
* The parser is pluggable, and the grammar is [defined dynamically](https://github.com/bigskysoftware/_hyperscript/blob/ea9a6534d24cf5c7257adcaad75ee75b0c612d8e/src/_hyperscript.js#L63)
* It supports multiple syntaxes for [property access](https://hyperscript.org/docs/language/#properties).

It is not an approach I would recommend for most programming languages, but it has worked out pretty well for this
project.  

Yet another demonstration that there are indeed multiple ways to skin the cat in software.

## A Bug Report

Our story begins when a user reported a regression when upgrading to the 0.9.91 release.  The following
expression no longer parsed properly:

```applescript

fetch `{% url 'trade:get_symbol_data' %}?symbol=${symbol}` as JSON

```

In particular, the `as JSON` was binding too tightly and trying to convert the string literal into JSON *before* it
was handed to `fetch` instead of doing what the user expected (and what it did previously) namely _fetching_ the
given url with the results treated as JSON.

This sort of binding conflict is a classic problem in parsing.  

Because hyperscript is an [xTalk](https://en.wikipedia.org/wiki/HyperTalk#Descendants_of_HyperTalk) style language and 
inherits many of the ambiguities of English, this problem is all the worse in it.

## Investigating The Cause

The first thing to do was to investigate _why_ this regression occurred.  

This is an area where I am typically going to lean on AI to help.  

I use Claude, and it did an admirable job finding the root cause: in 0.9.91 I had been overly
aggressive in refactoring the [go](https://hyperscript.org/commands/go/) command to reuse/share logic with the [fetch](https://hyperscript.org/commands/fetch/) command.  

I had extracted a common method for both of these commands to use, `parseURLOrExpression()`, but, in doing so, I 
accidentally expanded the grammar after the `fetch` command to include the general `expression`, er, expression.

The `as` keyword has a meaning in expressions: it is a [conversion expression](https://hyperscript.org/expressions/as/),
allowing you to convert between types:

```applescript
  set x to "42" as Int
```

But the `as` keyword is *also* a modifier of the `fetch` command, telling it how to convert the response:

```applescript
  fetch https://hyperscript.org as Text
```

(Perhaps this fact makes you throw up a little bit in your mouth.  Good.)

The crux of the issue was that, inadvertently in the refactor, I had made the parser parse an expression after a `fetch` keyword
which was now consuming the `as` keyword as an expression, rather than allowing it to be a modifier for `fetch`.

With the help of Claude I was able to figure this out in a few minutes, much faster than if I had had to
figure it out on my own.

## Fixing The Issue

AI was very helpful in finding the cause of the problem.  

In _fixing_ the problem, however, it was much weaker.

I will admit here I was being lazy and asked AI for a solution, so complaining about those solutions feels a bit, well,
lazy, but I still think the string of events is informative, so let's go through exactly what happened.

## Proposed Fix 1: A Hack

The first suggestion that was given was to parse what is called a "string-like" leaf first, 
then fall back to a full expression:

```js
return this.parseElement("stringLike") || this.requireElement("expression");
```

This fix would have solved the immediate problem presented by the user.

However, it was very specific to the reported bug and wouldn't have fixed the general case, such as if someone uses a variable as the target of a fetch:

```applescript
  fetch $url as JSON
```

I rejected this proposal because of this: too hacky and not general enough.  

(Note that the hyperscript parser has plenty of organically supplied hacks in it, so this may have been the pot calling the
kettle black.)

## Proposed Fix 2: Better But Unnecessary Complexity

The second proposal was more interesting: add a `noConversions` flag on the parser, set it around the URL parse, and have
`AsExpression.parse` bail when it is set:

```js
// AsExpression.parse()
if (parser.noConversions) return;
```

This will horrify many parser engineers because it makes the hyperscript parser 
[context-sensitive](https://dl.acm.org/doi/epdf/10.1145/362686.362695).  

Good.  

The hyperscript parser was _already_ context-sensitive.

In looking at this fix and thinking for a second, I realized that we already had the hacky context-sensitive 
infrastructure we needed without introducing a new flag on the parser, but Claude had missed it.

### "Follows" In The Hyperscript Parser

In the hyperscript parser we have a notion of ["follows"](https://github.com/bigskysoftware/_hyperscript/blob/ea9a6534d24cf5c7257adcaad75ee75b0c612d8e/src/core/tokenizer.js#L11), that is, tokens that are claimed by a "higher up" parse element as a follow token.  

The hyperscript parser is (a somewhat strange) recursive descent parser, and this allows a parse element (usually a command) 
to "claim" a keyword, and expressions won't match against them during parsing.

As an example, the [`when`](https://hyperscript.org/features/when/) feature uses [`or` as a separator](https://github.com/bigskysoftware/_hyperscript/blob/264eca41bd6cb640a52bf0a312fdf901dba74810/src/parsetree/features/when.js#L27) rather 
than as a logical connective in its declaration:

```html
<div _="when $x or $y changes put it into me"></div>
```

(I can hear many parser engineers closing this window in anger.  Good.)

It turns out that this feature could be used to achieve what we wanted: rather than adding a new flag to the parser
we could push `as` as a follow, then parse the expression, then pop it as a follow.  

This would prevent the `AsExpression` from parsing, while still allowing most general expressions such as variables to work.

## Proposed Fix 3: Close, But No Cigar

I pointed this out to Claude and, in a frisson of excitement, it told me that I was "absolutely right!" and set about
using this technique to fix the bug.

Claude added the correct code to the `parseURLOrExpression()` which fixed the issue generally without adding any additional
parser infrastructure.

Good to go.

## The Final, Semi-Organic Fix

However, as I was reviewing the change, I realized that the new fix was overly broad: both `fetch` and `go` shared
this method, but only `fetch` used `as` to signal a modifier.  

The existing fix prevented the perfectly valid use of `as` conversion expressions in `go` commands as well.

So I implemented the final fix myself, in `FetchCommand#parse()`:

```js
  parser.pushFollow("as");
  try {
    var url = parser.parseURLOrExpression();
  } finally {
    parser.popFollow();
  }
  
  if (parser.matchToken("as")) {
      ...
```

Here I narrowed the special case to only the `fetch` command, leaving `go` parsing unaffected.

This ended up being my final answer to the bug.

## Tests

Along the way I had Claude generate some tests for the various cases.  

There is a good existing test suite for hyperscript, and Claude did a good job of creating small, focused tests that showed the 
problem and that the fix was working properly.

Another area AI appears to work well.

## The Moral of The Story

OK, so what is interesting about this fairly mundane bug fix story?

I think it is interesting to see where AI did well, namely in investigation and test creation, and to contrast that
with where it didn't do so well: coming up with a clean solution.

If I had not been familiar with the hyperscript parser and its infrastructure this fix could have easily led to technical
debt being accrued in the project: another hacky parsing corner case, another bit of state on the parser, etc.

Technical debt, I assert without evidence[^dream], grows exponentially, and therefpre it is very
important to minimize it in your projects.

This story shows how having a human in the loop, working with an agent and with a good understanding of the underlying
infrastructure, can be much more effective in controlling complexity than an agent left to its own devices.

Some people will look at the hyperscript code base and scoff at the notion that controlling complexity was ever
a consideration at all.  I am sympathetic to that view.

However, in this example we can see in a concrete scenario how complexity was restrained, at least a bit, in fixing an 
admittedly embarrassing bug, by a knowledgeable human working with an AI agent.

This is a situation where, rather than being a sorcerer's apprentice and blindly accepting the solutions AI proposed,
I was acting as a sorcerer (I hope that's not too arrogant to say!) demanding a correct solution that better fit the 
existing codebase's architecture.  

I understood the problem and saw the correct solution and was able to work with AI to achieve it and then verify the
solution with the help of AI-generated tests.

This is in contrast, I hope a good contrast, with some forms of vibe coding currently being pushed in which developers (or whatever) appear
to pride themselves on not understanding what is actually going on.

## Aside: AI & The Older Developer

Another thing occurred to me as I was going back over this experience.

I am an older developer, having turned 50 this year.  As developers get older the reality is that we tend to 
"lose our fastball", at least to some extent.

Practically, for me, this has meant two things:

* I am not able to remember as much as I used to
* I am not able to work as long of hours as I used to

It turns out that AI directly addresses both of these issues.

With respect to memory, while I can't remember everything I used to be able to, I can _understand_ things again very
quickly with appropriate, er, prompting.  AI is very good at helping me with this, and it lets me switch between open 
source projects and work projects much more efficiently than if I didn't have it.

With respect to the long hours, AI is able to grind in a way that, even as a young developer, I would have
had a difficult time keeping up with.  This means, for example, I can have a much more extensive test suite for my projects 
than I would have otherwise.

Looking at the tests that Claude generated in this case, they are more extensive than what I probably could have mustered
the energy to do myself.

So AI has addressed two fundamental (relative) weaknesses I have developed as an older developer.

On the other hand, I am very worried that it is also enabling a more general regression in my overall intelligence.  This
is something that occurs naturally as you age anyway.   AI reliance may accelerate this process however and I have to 
say, looking back at this story, I'm a bit ashamed of how long I leaned on Claude before just doing the right thing 
darned myself.

This is an area I am still trying to navigate myself.

## Conclusion

I wanted to write up this series of interactions because I thought it captured some of the good and some of the bad
of AI assistance in coding.  It demonstrated the value of a reasonably competent developer in the loop working
with an AI agent, and also showed the danger of blindly accepting the first (or second) solution that an AI agent 
suggests to a problem.

I hope that it is useful to you as you develop your own thoughts and strategies around AI agents.

--

[^dream]: This was revealed to me in a dream.
