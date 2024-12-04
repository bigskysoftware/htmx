---
layout: blog_post
nav: blog
title: HATEOAS is for Humans
---

##TLDR##

* HATEOAS is actually a simple concept: a server sends both data and the network operations on that data to the client, 
  which has no special knowledge about the data.  
* This simple but powerful idea has been lost because it is typically examined in terms of machines and APIs, rather 
  than in terms of humans and HTML. 
* Humans are uniquely positioned to take advantage of the power of HATEOAS in a way that machines are not (yet) because
  they have agency. 

## HATEOAS - Wat?

[HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) is perhaps the least understood aspect of
[REST](https://en.wikipedia.org/wiki/Representational_state_transfer) and is often an object of outright
[hatred](https://jeffknupp.com/blog/2014/06/03/why-i-hate-hateoas/) for perfectly reasonable, competent developers. 
This is too bad, and it is mainly due to the fact that the HATEOAS and REST concepts have been applied to APIs 
(originally XML, then JSON) rather than to where they originally arose: humans and HTML on the web.

Let's see if I can give a simple (if incomplete) explanation of what HATEOAS is and then explain why it works
so well with humans and HTML and why it works poorly for machines and JSON.

To begin at the beginning, what does the acronym HATEOAS mean?  
 
Simple! 

**'Hypermedia As The Engine Of Application State'**

OK, maybe not so simple.  So what does *that* mean?

What it means is: all "state" (that is, both the data and the network actions available on that data) is encoded in 
hypermedia (e.g. HTML) returned by the server.  Clients know nothing specific about any particular network end point: 
both the data and the network operations available on that data come from the server.

The crucial point, to repeat again: both the data and the network operations on that data come from the server, together,
in hypermedia.  

Sounds a bit object oriented, doesn't it?

## HTML - HATEOAS for Humans

Let's look at an example to help make this idea concrete.  Rather than using an API example (which, unfortunately, even 
the HATEOAS Wikipedia article does), let's consider something even simpler: just a bit of HTML.  HTML, after all, is the 
most ubiquitous and successful hypermedia in the world.

Consider the following snippet of HTML, retrieved from a server at, say, the following end point: `/contacts/42`:

<pre>
  &lt;div>
    &lt;div>
      Name: Joe Blow
    &lt;/div>
    &lt;div>
      Email: joe@blow.com
    &lt;/div>
    &lt;div>
      &lt;a href="/contacts/42/edit">Edit&lt;/a>
      &lt;a href="/contacts/42/email">Email&lt;/a>
      &lt;a href="/contacts/42/archive">Archive&lt;/a>
    &lt;/div>
  &lt;/div>
</pre>

This bit of HTML, you will notice, encodes *both* the data for the contact, as well as the actions 
available on that data (Editing, Emailing and Archiving) in the form of links.   The client (a browser) knows nothing
about contacts, it knows only how to take this HTML and render it as some UI for a human to interact with.  It's
certainly not the most efficient encoding of this data, and it is intermixed with some other junk as well, but that's
OK.  That other junk has proven to be pretty useful on the client side, so let's let it slide for now.

This means that a web application that communicates in terms of HTML, naturally satisfies the HATEOAS constraint of
REST, without anyone needing to think very hard about it.  

If you have ever built a traditional web app, congrats, you have implemented HATEOAS better than 99% of all API developers.

It must be noted that, unfortunately, traditional HTML itself is somewhat limited in the number of HTTP methods 
(mainly GET and POST) and user actions (clicks and form submissions) that it allows, which made it difficult to 
realize the complete benefits of REST.

Fortunately, [intercooler.js](/), in addition to [much else](/docs.html), rectifies both 
of these issues with the [ic-put-to](/attributes/ic-put-to.html), [ic-delete-from](/attributes/ic-delete-from.html), etc.
and the [ic-trigger](/attributes/ic-trigger.html) attributes, respectively.  This gives you a much richer and complete
programming infrastructure for building your HTML-based REST-ful web application.

You should use it.  😉

## Why The Gnashing of Teeth?

Anyway, we can see that, despite all the fancy verbiage, HATEOAS is almost idiotically easy to implement by just using 
HTML.  

Why all the hate and confusion around it, then?

To understand why, let's look at the example from the [HATEOAS Wikipage](https://en.wikipedia.org/wiki/HATEOAS):

<pre>
  &lt;?xml version="1.0"?>
  &lt;account>
     &lt;account_number>12345&lt;/account_number>
     &lt;balance currency="usd">100.00&lt;/balance>
     &lt;link rel="deposit" href="http://somebank.org/account/12345/deposit" />
     &lt;link rel="withdraw" href="http://somebank.org/account/12345/withdraw" /> 
     &lt;link rel="transfer" href="http://somebank.org/account/12345/transfer" />
     &lt;link rel="close" href="http://somebank.org/account/12345/close" />
   &lt;/account>
</pre>

This is an XML API satisfying HATEOAS by encoding all the actions on the account as `link` elements.  And that's
great as far as it goes.  You get the Gold REST Star for this API.

But consider what is consuming this data: some client code, probably on behalf of yet another (thick or web) client further down 
the line, or perhaps an automated script.  Regardless, it is code, rather than a human, that is likely dealing with it.

What can it do with all those actions?  The actions, note, are dynamic, but the script itself probably 
isn't: it needs to either handle all possible actions or forward them along to a human to deal with, right?

And that gets to crux of the issue: the code doesn't (yet) have <a href="https://en.wikipedia.org/wiki/Agency_(philosophy)">agency</a>.  
It can't reasonably decide what to do in the face of new and unexpected actions.  The coder writing the code could have
it handle all possible actions (tough) or pass them along to a human somewhere else (also tough).

Realistically, the code will likely handle a few of the actions and just ignore the rest, so all that work for a Gold 
REST Star is, unfortunately, wasted.

## Agency As A Service (AAAS)

Now, humans aren't good at much, but (but!) one thing we are pretty good at doing is agency.  We can make decisions given new
and novel situations, making sense of somewhat chaotic environments and learning new things.  *We* can figure out
when a new action shows up, associated with some data, if *we* want to take that action.  

It's just a thing that we do.

I like to turn the client-server relationship around, and consider the *human users* of a software system as providing 
**Agency As A Service (AAAS)** for the server.  

The server software knows all about the data and what actions are available on that data, but has no idea what the heck 
to do.  Fortunately, these otherwise bumbling humans show up and will poke and prod the server to provide the agency
the server so desperately needs.  The server, of course, wants to speak with the humans in a language (hypermedia)
that the humans find pleasant, or at least tolerable.

And that language is HTML.

So, you can see: a system satisfying HATEOAS is wasted if the hypermedia isn't being consumed by something with agency. 
Humans are that thing, and, therefore for HATEOAS to be effective, the hypermedia needs to be humane.  

Again, that's HTML.  I didn't realize just how special it was until year 20 of writing web apps.

Once we have strong AI, maybe the situation changes.  But that's what we've got today.

## OK, So How Should We Speak To The Machines?

Well and good.  But what about the machines?  There are integrations and scripts and scrapes and thick clients to be
written, and they all need to talk to servers as well, right?

That's of course correct and, I'm not ashamed to admit, **I'm not sure what the right answer is here, of if there is a
single one**.

REST-minus-HATEOAS seems like it works OK in many cases.  RPC-style end points were once popular and appear to be
getting popular again.  They all seem reasonably workable to me.

But what I am convinced of, and what I hope to convince you of, is that HATEOAS is largely wasted on machines.

HATEOAS is for humans.
