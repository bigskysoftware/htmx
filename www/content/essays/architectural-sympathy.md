+++
title = "Architectural Sympathy"
date = 2023-04-06
updated = 2023-04-06
[taxonomies]
author = ["Carson Gross"]
+++


# Mechanical Sympathy & Architectural Sympathy

> You don’t have to be an engineer to be be a racing driver, but you do have to have Mechanical Sympathy.

_-Jackie Stewart, racing driver_

The term "mechanical sympathy" was originally coined by Jackie Steward to capture a characteristic
 of race car drivers, who needed a deep and intuitive understanding of how a race car worked in order
to get the best possible performance out of the vehicle.

This term was applied to software development by Martin Thompson when discussing his [LMAX](https://martinfowler.com/articles/lmax.html)
architecture, which utilized a low level and intuitive understanding of how his cloud system functioned
in order to maximize the performance of it.  Thompson maintained [a blog](https://mechanical-sympathy.blogspot.com/)
on the topic for many years, and it is well worth going back and reading the posts there.

## Architectural Sympathy

In this brief essay I want to propose another concept and design principle, that of _Architectural Sympathy_:

> Architectural Sympathy is the characteristic of one piece of software adopting and conforming to the architectural
> design of another piece of software 

This is a design principle that I have kept in mind when designing [htmx](https://htmx.org) and 
[hyperscript](https://hyperscript.org) and I wanted to write it down for reference and so others can think about,
criticize and improve it.

### htmx's Architectural Sympathy for The Web

htmx is architecturally sympathetic to The Web because it adopts the underlying [REST-ful](/essays/hateoas) architecture 
of The Web: exchanging _hypermedia_ in a REST-ful manner with a hypermedia server.  As much as is practical, htmx takes
design cues from the existing Web infrastructure:

* It mimics the core hypermedia-exchange mechanic of links and forms
* It uses CSS selectors for targeting
* It uses standard URL paths for designating end points
* It uses the standard API language for specifying swap types
* Etc.

htmx attempts to _fold in_ to the existing conceptual architecture of The Web, rather than replace it.

This is in contrast with the [SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA) approach to building web 
applications.  Most SPA frameworks have little architectural sympathy with the original web model.  Rather, they largely 
_replace_ the original, REST-ful, hypermedia-oriented architecture of the web in favor of a more thick-client like 
architecture, exchanging information over an
[RPC-like fixed-data format](/essays/how-did-rest-come-to-mean-the-opposite-of-rest/) network architecture.

### Advantages Of The Architecturally Sympathetic Approach

If a new piece of software maintains architectural sympathy with an original piece of software, the following advantages
are obtained:

* A developer who is familiar with the original piece of software does not need to learn a whole new conceptual approach
  when using the new piece of software. 
* The design constraints of the original piece of software offer a framework within which to evaluate features for the
  new piece of software.  This makes it easier to [say "no"](https://grugbrain.dev/#grug-on-saying-no) as you develop the
  new software. ("The enemy of art is the absence of limitations." --[Orson Welles](https://quoteinvestigator.com/2014/05/24/art-limit/))
* Experience gained from working with the original piece of software can directly inform the design and implementation of
  the new software
* There will likely be a subjective feeling of "fit" between the new and original software for users of the new software

### Disadvantages Of The Architecturally Sympathetic Approach

Of course, as with any design principle, there are trade-offs when using Architectural Sympathy:

* The shortcomings of the original piece of software are likely to be found in some way in the new software
* The design constraints impressed on the new software by the older software may be so oppressive as to limit progress
  and functionality in the new software
* It may be difficult for developers to "see the point" of the new software, if it feels too close to the original software
* By maintaining architectural sympathy with the older, original software, the new software risks appearing old itself,
  a danger in the software business that has often favored new and exciting approaches to problems.
* You may not be able to layer as many new concepts as some users might like on top of the original software

## Craftsmanship & Architectural Sympathy

A non-software example of architectural sympathy that I like to point to are medieval cathedrals: these cathedrals were
often built, rebuilt and improved over centuries by many different builders and architects (such as they were).  And yet 
they were able, over those centuries, to maintain a high level of architectural sympathy with the earlier workers.

Rather than focusing on radically new approaches to building, workers focused on maintaining a coherent whole and, within
that framework, on the craftsmanship of their individual contributions.  Yes, there were flourishes and changes along the
way, but these typically did not sacrifice the conceptual coherence of the whole for the sake of innovation.

Adopting an architecturally sympathetic mindset in software development often means sacrificing how you would like to
do things in favor of how an original piece of software did things.  While this constraint can chafe at times, it can
also produce well crafted software that is harmonious and that dovetails well with existing software.
