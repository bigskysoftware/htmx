+++
title = "Digital Enclosure & Right-Click-View-Source Extremism"
date = 2023-04-06
updated = 2023-04-06
[taxonomies]
author = ["Carson Gross"]
+++

> Not for nothing, Hypercard presaged the web's critical "#ViewSource" affordance, which allowed people to copy,
> modify, customize and improve on the things that they found delightful or useful.  This affordance was later adapted 
> by other human-centered projects like #Scratch, and is a powerful tonic against #enshittification.
> 
> \-\-[Cory Doctorow @pluralistic@mamot.fr](https://twitter.com/doctorow/status/1701934607732810208)

A driving idea behind projects like [htmx](/) and [hyperscript](https://hyperscript.org) is the idea that the "code"
for a thing should be "on" the thing.  This is in part driven by a preference for [Locality of Behavior](@essays/locality_of_behavior.md),
a technical design decision which helps ease the maintenance of software.  

But another major driver is the conviction that, on the web, people should be able to view the source of a page and see
what the page is doing, the #ViewSource affordance Cory mentions above.

## Free Software vs. Open Culture

This later factor isn't a technical design consideration, rather, it is a moral position, or, as we will see, more of
a cultural position.

The idea that you should be able to view the source of a web page is in the spirit of 
[the Free Software Foundation's notion of free software](https://www.gnu.org/philosophy/free-sw.html):

> “Free software” means software that respects users' freedom and community. Roughly, it means that the users have the 
> freedom to run, copy, distribute, study, change and improve the software."

However, there are some important distinctions between the #ViewSource affordance of the web and the FSF's definition of
free software above.

Web applications have always been an uncomfortable fit for this stricter definition of free for technical reasons:
the server for a web application is typically remote and, at a fundamental level, the operations occurring on the server 
are opaque to the hypermedia client (i.e. the browser).

The client deals only with hypermedia representations provided by the server, and has no visibility into the actual 
source of the code executing on the server side.

There are, of course, open source web applications, but running an open source web application is typically much less 
convenient than other types of applications due to the operational complexity that they often entail.

### Right-Click-View-Source As Culture

However, despite this less pure adherence to the idea of free software, the early web none-the-less had radically
_open_ culture, in some practical ways a _more_ open culture than even that achieved by the free software movement.

The #ViewSource affordance available in browsers allowed people to understand and "own" the web in a way that even most 
FSF-conforming applications could not: you had direct access to the "source" of the application available, _within_
the application itself.  

You could copy-and-paste (or save) that "source" (HTML, JavaScript & CSS) and start modifying it, without a complicated
build tool chain or, indeed, without any tool chain at all. This radical openness of the web allowed many people, often
not formally trained computer scientists, to learn how to create web pages and applications in an ad hoc and informal way.  

In strict free software terms, this was, of course, a compromise: as a user of a web application, you had no visibility 
into how a server was constructing a given hypermedia response.

But you could see _what_ the server was responding with: you could download and tweak it, poke and prod at it.  You could,
if you were an advanced user, use browser tools to modify the application in place.  And, most importantly, you could
_learn from it_, even if you couldn't see how the HTML was being produced.

## Digital Enclosure & Right-Click-View-Source Extremism

The [Enclosure Movement](https://en.wikipedia.org/wiki/Enclosure) was a period in English history when what were 
previously [commons](https://en.wikipedia.org/wiki/Commons) were privatized.  This was a traumatic event in English 
history, as evidenced by this poem by an 18th century anon:


> The law locks up the man or woman
> Who steals the goose from off the common,
> But lets the greater felon loose
> Who steals the common from the goose.
> 
> 18th century anon

In the last decade, the web has gone through a period of digital enclosure, where ["Walled Gardens"](https://en.wikipedia.org/wiki/Closed_platform),
such as Facebook & Twitter, have replaced the earlier, more chaotic blogs and internet forums.

Many developers have decried this trend, and rightly, in our opinion.  But, despite recognizing the danger of an increasingly
closed internet, many web developers don't consider their own technical decisions and how those also influence the 
culture of openness that is rapidly disappearing.

### Two Wordle Implementations

