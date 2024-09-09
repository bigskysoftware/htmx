+++
title = "Hypermedia APIs vs. Data APIs"
date = 2021-07-17
updated = 2022-04-07
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

A *hypermedia* API is an API that returns [hypermedia](https://en.wikipedia.org/wiki/Hypermedia), typically HTML over
HTTP.  This style of API is distinguished from data APIs that do not return a hypermedia.  The most familiar form of this
latter style of API today is the ubiquitous JSON API.  

These two different types of API have distinctly different design needs and, therefore, should use different design 
constraints and adopt different goals when being created.

Hypermedia APIs:
 
* Will be trivially [REST-ful](https://en.wikipedia.org/wiki/Representational_state_transfer), since they are simply what [Roy Fielding was describing](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm).
* Should be driven by the needs of the underlying hypermedia application
* May change dramatically *without* versioning information, because hypermedia utilizes [self describing messages](https://en.wikipedia.org/wiki/Representational_state_transfer#Uniform_interface) 
* Should be passed directly to humans, to maximize the flexibility of the system
 
Data APIs, on the other hand:
 
* Will not benefit dramatically from REST-fulness, beyond perhaps [Level 2 of the Richardson Maturity Model](https://en.wikipedia.org/wiki/Richardson_Maturity_Model)
* Should strive for both regularity and expressiveness due to the arbitrary data needs of consumers
* Should be versioned and should be very stable within a particular version of the API
* Should be consumed by code, processed and then potentially presented to a human
 
## APIs Today
 
Today, APIs are typically thought of in terms of JSON-over-HTTP.  These are almost always data-oriented APIs rather
than hypermedia APIs, although occasionally hypermedia concepts are incorporated into them (typically to
little benefit of the end users.)  There has been a [movement away](https://graphql.org/) from REST-ful APIs as the industry has begun
to [recognize the problems with fitting data APIs into the REST-ful model.](https://kieranpotts.com/rebranding-rest/)
 
This is a good thing: the industry should question REST-ful ideas in the Data API world and begin looking at older client-server
technologies that did a better job of servicing that particular network architecture, leaving REST instead to the network architecture
that it was coined to describe: hypermedia APIs.

## Designing a Hypermedia API

To show how a hypermedia API might be designed differently than a data API, let's consider the following situation, 
which came up on the [htmx discord](/discord) recently:

> I want a page with a form and a table on it.  The form will add new elements to the table, and the table will also be
> polling every 30 seconds so that updates from other users are shown.

Let's consider this UI in terms of a base url, `/contacts`

The first thing we will need is an end point to retrieve the form and the table of current contacts.  This will
live at `/contacts`, giving:

```txt
  GET /contacts -> render the form & contacts table
```

Next, we want to be able to create contacts.  This would be done via a POST to the same URL:

```txt
  GET /contacts -> render the form & contacts table
  POST /contacts -> create the new contact, redirect to GET /contacts
```

with HTML that looks something like this:

```html
<div>
    <form action='/contacts' method="post">
      <!-- form for adding contacts -->
    </form>
    <table>
      <!-- contacts table -->
    </table>
</div>
```

So far, so standard web 1.0 application, and thus far the data-API and hypermedia API needs haven't diverged very much,
although it is worth noteing that the hypermedia API is *self describing* and could be modified (say, changing the URL for creating
contacts) without breaking the hypermedia application.

Now we get to the part where htmx is needed: polling the server for updates to the table occasionally.  To do this
 we will add a new end point, `/contacts/table`, which renders only the table of contacts:
 
```txt
  GET /contacts -> render the form & contacts table
  POST /contacts -> create the new contact, redirect to GET /contacts
  GET /contacts/table -> render the contacts table
```
 
and then add a poll trigger to the table:
 
 ```html
 <div>
     <form action='/contacts' method="post">
       <!-- form for adding contacts -->
     </form>
     <table hx-trigger="every 30s" hx-get="/contacts/table" hx-swap="outerHTML">
       <!-- contacts table -->
     </table>
 </div>
 ```
Here we see the hypermedia API and data API begin to diverge.  This new end point is driven entirely by hypermedia
needs, not data model needs.  This end point can go away if the hypermedia needs of the application change; its form may change 
dramatically and so on, which is entirely acceptable since the system is self-describing.

Since we have updated the HTML to use htmx for polling, we may as well make the form use htmx as well for a better
UX experience:

 ```html
 <div>
     <form action='/contacts' method="post" hx-boost="true">
       <!-- form for adding contacts -->
     </form>
     <table hx-trigger="every 30s" hx-get="/contacts/table" hx-swap="outerHTML">
       <!-- contacts table -->
     </table>
 </div>
 ```

We can, if we choose, add additional end points for things like server-side validation of inputs, dynamic forms and 
so forth.  These end points would be driven by *hypermedia needs* rather than any sort of data model considerations:
we think in terms of what we are trying to achieve with our application.  

## API Churn

The crux point of this short essay is this: API churn is fine in a hypermedia system because *the messages in a hypermedia system are self-describing*.
We can thrash the API around and the application doesn't break: human users simply see the new hypermedia (HTML) and select what
actions they want to do.

Humans, compared with computers, are [good at deciding what to do](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html)
and are reasonably OK with change.

This is in contrast with data APIs.  Data APIs cannot be modified without breaking client code and thus must be much
more disciplined in their changes.  Data APIs also face pressure to provide higher levels of expressiveness so that they
can satisfy more client needs without modification.  

<aside>

*This latter situation is [especially dangerous](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html) when these data APIs are consumed in a browser, because any data-api expressiveness available to a front-end developer is also available to a potentially hostile user, who can fire up a console and begin hammering away at the API.  Apparently, facebook uses a [whitelist](https://twitter.com/AdamChainz/status/1392162996844212232) to deal with this.*

*Do you?*

</aside>

## Conclusion

When designing a hypermedia API, you should use a different design mindset than you use for data APIs.  Churn is
much less of a concern, and providing the end points you need for a good hypermedia experience should be your primary goal.
