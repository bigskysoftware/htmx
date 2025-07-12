+++
title = "The #ViewSource Affordance"
description = """\
  In this essay, Carson Gross explores the significance of the #ViewSource affordance in preserving the open, \
  collaborative culture of the early web. He examines the impact of digital and technical enclosure on this culture, \
  highlights the importance of developer decisions in maintaining openness, and advocates for prioritizing \
  #ViewSource-friendly practices in modern web development."""
date = 2023-09-21
updated = 2023-09-21
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

> Not for nothing, Hypercard presaged the web's critical "#ViewSource" affordance, which allowed people to copy,
> modify, customize and improve on the things that they found delightful or useful.  This affordance was later adapted 
> by other human-centered projects like #Scratch, and is a powerful tonic against #enshittification.
> 
> \-\-[Cory Doctorow @pluralistic@mamot.fr](https://twitter.com/doctorow/status/1701934612686196872)

## Open Culture & The Web

When people talk about open source software, that conversation is often dominated by
[the Free Software Foundation's notion of free software](https://www.gnu.org/philosophy/free-sw.html):

> “Free software” means software that respects users' freedom and community. Roughly, it means that the users have the 
> freedom to run, copy, distribute, study, change and improve the software.

This definition of free software has been a useful one and, through advocating for it, the FSF has gifted the world a 
lot of wonderful open source software.

Web applications, however, have always been an uncomfortable fit for this definition of free.  This is mainly
for technical reasons: web applications involve a web browser interacting with a web server that is, typically, running
on a remote system.

At a fundamental level, the REST-ful architecture of the web was built around _hypermedia representations_ of remote
resources:  browsers deal only with hypermedia representations provided by the server and, thus, have no visibility into
the actual source of the code executing on the server side.

Now, the web has certainly _leveraged_ free and open source software in its growth: browsers are typically (at least mostly)
open source, server software is often open source, and so on.  And there are, of course, open source web applications
that users may run for things like forums and so forth.

However, from the standpoint of typical web application users, web applications are not free in the FSF sense of that
term: the users are unable to see and modify the source of the server code that is being executed as they interact with
the application via the browser.

### Right-Click-View-Source As Culture

Despite the fact that the web has a somewhat uncomfortable relationship with the notion of free software, the early web 
none-the-less had a radically open _developer culture_. 

In fact, in some important and practical ways, the early web had a _more_ open developer culture than what was achieved 
by the free software movement.

The [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) affordance available in browsers allowed people 
to understand and "own", at least in an informal way, the web in a way that even most FSF-conforming applications could 
not: you had direct access to the "source", or at least _part_ of the source, of the application available from 
_within_ the application itself.  

You could copy-and-paste (or save) the "source" (HTML, JavaScript & CSS) and start modifying it, without a complicated
build tool chain or, indeed, without any tool chain at all.

This radical openness of the web allowed many people, often not formally trained computer programmers, to learn how to 
create web pages and applications in an ad hoc and informal way.  

In strict free software terms, this was, of course, a compromise: as a user of a web application, you had no visibility 
into how a server was constructing a given hypermedia response.

But you could see _what_ the server was responding with: you could download and tweak it, poke and prod at it.  You could,
if you were an advanced user, use browser tools to modify the application in place.  

And, most importantly, you could _learn from it_, even if you couldn't see how the HTML was being produced.

This radical openness of the client and network protocol, and the culture it produced, was a big part of the success
of the early web.

## Digital Enclosure vs. Technical Enclosure

The [Enclosure Movement](https://en.wikipedia.org/wiki/Enclosure) was a period in English history when what were 
previously [commons](https://en.wikipedia.org/wiki/Commons) were privatized.

This was a traumatic event in English history, as evidenced by this poem by an 18th century anon:

> The law locks up the man or woman
> 
> Who steals the goose from off the common,
> 
> But lets the greater felon loose
> 
> Who steals the common from the goose.
>
> --18th century anon

In the last decade, the web has gone through a period of "Digital Enclosure", where ["Walled Gardens"](https://en.wikipedia.org/wiki/Closed_platform),
such as Facebook & Twitter, have replaced the earlier, more open and more chaotic blogs and internet forums.

### Technical Enclosure

Many (most?) web developers have decried this trend.  

However, despite recognizing the danger of an increasingly closed internet, many web developers don't consider their own
technical decisions and how those decisions can also contribute to the disappearance of web's _culture_ of openness.

Inadvertently (for the most part) technical trends and decisions in web development in the last two decades have lead
to what we term a "Technical Enclosure" of the web, a processes whereby technical decisions chip away at the #ViewSource
affordance that Cory Doctorow discusses in the opening quote of this article, an affordance that existed as a commons
for early web developers.

To see a stark example of the decline of the [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) affordance
in web development and Technical Enclosure in action, we can look at what is perhaps the most popular web page on the 
internet, [The Google Homepage](https://google.com).

Here is the nearly complete source of that page from the year 2000, taken from 
[the wayback machine](http://web.archive.org/web/20000229040250/http://www.google.com/):

### Google in 2000
<img src="/img/google-2000.png" alt="Google Source Code in 2000" style="border-radius: 12px; margin: 12px">

In contrast, here is a random snapshot of roughly 1/100th of the current source code for the website:

### Google in 2023
<img src="/img/google-2023.png" alt="Google Source Code in 2023" style="border-radius: 12px; margin: 12px">

These two screenshots dramatically demonstrate the decline in the effectiveness of the [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) affordance over time:
yes, you can still right-click the page and view its underlying source, but making sense of the latter code would be
challenging for even the most seasoned web developer.

A new web developer would have almost no chance of deriving any value from doing so.

Now, this is not to criticize the Google engineer's technical decisions that lead to this situation _as technical 
decisions_: obviously, despite similar appearances, the Google homepage of 2023 is far more sophisticated than the one 
available in 2000.

The 2023 google homepage is going to be a lot more complicated than the 2000 page and, given the zeitgeist, it is going to 
involve a lot of JavaScript.

However, this is to point out that something deeply important about the early web has been lost, almost certainly 
unintentionally, along the way: the ability to view the source of the page, make sense of what it is doing and, most 
importantly, to learn from it.

## Right-Click-View-Source Extremism

Both [htmx](/) and [hyperscript](https://hyperscript.org) adhere to the [Locality of Behavior](@/essays/locality-of-behaviour.md)
design principle.

This principle states that:

> The behaviour of a unit of code should be as obvious as possible by looking only at that unit of code

The main technical advantage of Locality of Behavior is ease of maintenance, as outlined in the essay above.

However, there is an important cultural benefit to the Locality of Behavior of htmx and hyperscript as well: **it restores
the power of the [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) affordance on the web**.

Consider [Hyperwordle](https://arhamjain.com/hyperwordle/), a hyperscript-based clone of the popular 
[Wordle](https://www.nytimes.com/games/wordle/index.html) game, now owned by the New York Times.

You can visit Hyperwordle, right click and view the source of it, and you will be presented with some HTML and hyperscript,
all of which is, with a bit of effort, understandable.

The  [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) affordance is effective in this case.

Contrast this with the view-source experience of the Wordle implementation at the New York Times.

Now, this is of course a bit unfair: the NYTimes version has a lot more functionality and is heavily optimized. Hyperwordle
is a proof of concept and not being hammered by millions of users every day.

Despite that qualification, Hyperwordle demonstrates a potential future for the web, a future where a culture of openness,
of [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) politeness, is once again a touchstone of the
culture of the web.

## Prioritizing [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme)

Engineers who care about the open culture of the web should recognize that the threats to that culture come not only from
Digital Enclosure by large, private companies of the most important pieces of the web.  

They should also recognize the risks of Technical Enclosure, and the _non-technical_ value of the 
[#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme) affordance in perpetuating the open culture of
web development.  They should start thinking about making this affordance a priority in their technical decisions.  As
with all priorities, this may involve trading off against other technical and even functional priorities during 
application development.

But if we don't stand up for [#ViewSource](https://en.wikipedia.org/wiki/View-source_URI_scheme), no one else will.

<br/>

<img src="/img/memes/viewsource.png" alt="Right Click View Source Guy" style="border-radius: 12px; margin: 12px">