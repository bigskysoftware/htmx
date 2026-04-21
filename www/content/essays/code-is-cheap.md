+++
title = "Code is Cheap(er)"
description = """\
  In this essay, Carson Gross discusses the ability to generate code vs. the ability to understand code"""
date = 2026-02-27
updated = 2026-02-27
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

## But Understanding Is Not (And May be Getting More Expensive)

In [Yes, and...](@/essays/yes-and.md) I outlined some thoughts on AI in the development process directed mainly at
younger aspiring computer programmers wondering if it is still a viable career.  I argued that I believe that it is,
and that understanding how to solve problems with computers will continue to be a relevant skill in the future.

In that essay I mention [The Sorcerer's Apprentice Problem](https://www.youtube.com/watch?v=m-W8vUXRfxU).  Like most 
Americans I'm familiar with this allegory through the Disney movie Fantasia: Mickey Mouse starts using the master wizard's
spell book to help him clean up and ends up overwhelmed by a technology he doesn't understand and can't control.

This maps pretty cleanly onto a lot of AI usage we are seeing today: someone vibes up an impressive-on-the-surface application 
with no understanding of what's going on underneath and, when things go sideways, has no recourse beyond throwing more 
prompts (spells) at it.

Unlike in Fantasia, no master magician is showing up to help.  (If one was to show up, they would be quite expensive.)

## Two Claims

Part of the confusion around AI discussions that I see is that two similar-sounding claims are conflated with one another.  

It's understandable because both claims end with "Developers are cooked."

Claim 1: "I created this app from whole cloth and deployed it in a day. Developers are cooked."

Claim 2: "I asked Claude to implement this feature, and it did a great job, write good code. Developers are cooked."

The first claim is rooted in ignorance: the person saying this has no idea what the internals of the system look like, how 
it will perform under stress, how to fix things that break, how hard it will be to add new features, and so on.  They are
like Mickey Mouse when the mop is actually doing his job for him reasonably well.

The second claim is stronger: LLMs can, indeed, generate good code for many problems.  I've seen them do it.

But the conclusion is mistaken.

What the second claim is missing is that the developer *looked at* the code.  They *understood* the code and that it was
*good* code.

This understanding is what categorically separates the second claim from the first claim.

And this is precisely why developers are _not_ cooked.

## Understanding As A Service

In [HATEOAS is for Humans](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html) I said the following:

> I like to turn the client-server relationship around, and consider the human users of a software system as 
> providing Agency As A Service (AAAS) for the server.

In this article I would like to propose Understanding As A Service (UAAS) as another important role humans can play
in their interactions with computers.

## Complexity: Still [Bad](https://grugbrain.dev/)

So code is getting cheaper.  But was "code" ever really the problem?  

At some level the answer to this is yes: writing code has always been hard

## Conclusion