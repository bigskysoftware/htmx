---
layout: layout.njk
title: When To Use Hypermedia?
---

# When Should you Use Hypermedia?

> The trade-off, though, is that a uniform interface degrades efficiency, since information is transferred in a 
> standardized form rather than one which is specific to an application's needs. The REST interface is designed to be 
> efficient for large-grain hypermedia data transfer, optimizing for the common case of the Web, but resulting in an
> interface that is not optimal for other forms of architectural interaction.

_-Roy Fielding, <https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5>_

We are obviously big fans of hypermedia and think that it can address, at least in part, many of the problems that the web 
development world is facing today:

* Hypermedia is typically less complex than an SPA approach would be for a given problem
* Hypermedia allows your application API to be much more aggressively changed and optimized
* Hypermedia takes pressure off adopting a particular back-end technology

With [htmx](/) and the additional UX possibilities that it gives you, many modern web applications can be built 
using HTML and the hypermedia paradigm.

With that being said, as with all technical choices, there are tradeoffs associated with hypermedia.  In this article
outlines when we think hypermedia *is* likely to be a good fit, and when it *is not* likely to be a good fit.

## Transitional Applications & Hypermedia

Before we get into the details of when hypermedia is a good choice, we'd like to clarify that adopting hypermedia is not
an [either/or](https://en.wikipedia.org/wiki/Either/Or) decision when building a web application.  Even the most Single-y
of Single Page Applications utilizes hypermedia after all, as a bootstrap mechanism, to start the application.

In his talk, [Have SPAs Ruined The Web](https://www.youtube.com/watch?v=860d8usGC0o), Rich Harris gives us the term
"Transitional" Applications, that is applications that mix both hypermedia and non-hypermedia (SPA) concepts.  We
have responded to Mr. Harris' talk [in more detail here](/essays/a-response-to-rich-harris/), but suffice to say we agree
with him that a pragmatic "Transitional" approach to web development is best: use the right tool for the job.

Where we would likely disagree with Mr. Harris is just where "the line" is between what can be achieved with hypermedia
and the point at which it is better to reach for a more involved client-side library.  We feel that, with htmx, hypermedia
can go much, much further than many web developers believe is possible.  And that, for many applications, it can 
address many or all of their UX needs.

## Hypermedia: A Good Fit If...

So, when *is* hypermedia a good choice for an application and/or feature?

### If Your UI is mostly text & images

In [The Mother Of All htmx Demos](/essays/a-real-world-react-to-htmx-port/), David Buillot of Contexte shows how replacing
react with htmx lead to a 67% reduction in the total codebase, along with numerous other eye-popping results.  

As much as we would like to say that every team moving from react to htmx would experience these results, the fact is that the
Contexte web application is *extremely amenable* to the hypermedia style.

What makes Contexte so perfect for hypermedia is that it is a media-oriented web application, showing articles consisting
of text and images for reading.  It has a sophisticated filtering mechanism and other niceties, but the crux of the
application is displaying and categorizing articles.  This is exactly the sort of thing that hypermedia was designed to
do, and that is why htmx and hypermedia worked so well for this application.

### If Your UI is CRUD-y

Another area where hypermedia has a long track-record of success is [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete)-y
web applications, in the [Ruby on Rails](https://rubyonrails.org/) style.  If your main application mechanic is showing
forms and saving the forms into a database, hypermedia can work very well.  

And, with htmx, it can also be [very smooth](https://htmx.org/examples/click-to-edit/), and not just constrained
to a simple [detail view](https://htmx.org/examples/edit-row/) approach.

### If Your UI is "nested", with updates mostly taking place within well-defined blocks

One area where hypermedia can start to go a little wobbly is when you have UI dependencies that span structural
areas.  A good example of this, and one that often comes up when criticizing the hypermedia approach, is the issue
count number shown in the ["Issues" tab](https://github.com/bigskysoftware/htmx/issues) in Github.  When you close
an issue on Github, for a long time, the tab count did not update properly, because the tab itself wasn't replaced
by the hypermedia request.

"Ah ha!", exclaims the SPA partisan, "See, even GitHub can't get this right!"

Well, yes, but there are [a few techniques for making this work](https://htmx.org/examples/update-other-content/), and,
if you watch their talk, Contexte handled this situation easily, using events.

But, let us grant that this is an area where the hypermedia approach can get into trouble.  To avoid this problem, one
strategy is to colocate and next the dependent elements for a given resource within an area in the application.  

Consider a contact application whose detail screen for displaying and editing a contact has:

* An area for basic contact information
* An area for emails
* An area for phone numbers

The UI could be laid out in the following manner:

![Nested Example](/img/nesting-example.png)

Where each sub-section has its own dedicated hypermedia end-points:

* `/contacts/<id>/details` for the first name/last name/ etc. info
* `/contacts/<id>/emails` for the email section
* `/contacts/<id>/phonenumbers` for the phone numbers section

The crux here is that the email count and phone count are co-located with their collections, which allows you to 
[target](/attributes/hx-target) just that particular area for update when a modification is made to the respective 
collections.  All the data dependencies are co-located within a single area that can be updated via a single, simple
and obvious target, and that don't interfere with one another.

Each area effectively forms a sort of server-side component, independent of the other areas on the screen, and they are
all nested within a broader contact detail user interface.

#### UI Driven Hypermedia APIs

Note that our hypermedia API (that is, our end-points) in this case is _driven by the UI_, we have a particular layout 
that we want to achieve and we adapt our API to that.  If the UI changed, we would have no qualms with completely changing
the API to satisfy the new requirements.  This is a [unique aspect](https://htmx.org/essays/hateoas/) of developing with
hypermedia, and we [discuss it in more detail here](https://htmx.org/essays/hypermedia-apis-vs-data-apis/).

Of course, there may be UI requirements that do not allow for grouping of dependent element in this manner and, if
the techniques [mentioned above](https://htmx.org/examples/update-other-content/) aren't satisfactory, then it may be 
time to consider an alternative approach.

### If You need "deep links" and good first-render performance

A final area where hypermedia outperforms other options is when you need "deep links", that is, links into your
application that go beyond the landing page, or when you need excellent first-render performance.  

Since hypermedia is the natural language of the web, and since browsers are very good at rendering HTML given a URL, 
using this approach is hard to beat for "traditional" web features such as these.

## Hypermedia: Not A Good Fit If...

Of course, there are times when hypermedia isn't a good choice.  Let's review some of them:

### If Your UI has many dynamic interdependencies

As we discussed above in the section on "nested" UIs, one area where hypermedia can have trouble is when there are 
many UI dependencies spread across your UI and you can't afford to "update the whole UI".  This is what Roy Fielding was
getting at in the quote at the top of this article: the web was designed for large-grain hypermedia data transfers, not
lots of small data exchanges.

Particularly difficult for hypermedia to handle is when these dependencies are dynamic, that is, they depend on information
that cannot be determined at render-time.  A good example of this is something like a spreadsheet: a user can enter an
arbitrary function into a cell and introduce all sorts of dependencies on the screen.  Something like Google Sheets
would be a poor fit for the hypermedia approach.

(Note, however, that for many applications, the ["editable row"](https://htmx.org/examples/edit-row/) pattern is an 
acceptable alternative to more general spreadsheet-like behavior, and does play well with hypermedia, by isolating the 
edits within a bounded area.)

### If you require offline functionality

The hypermedia distributed architecture leans heavily on the server side for rendering representations of resources.  
When a server is down or unreachable, the architecture will obviously have trouble.  It is possible to use Web Workers
to handle offline requests, and it is possible to detect when a hypermedia application is offline and show a message.

But if your application requires full functionality in an offiline environment, then the hypermedia approach is not
going to be acceptable.

### Your UI state is updated extremely frequently

Another situation where hypermedia is not going to be a good approach is if your UI state is updated frequently.  A good
example is an online game that needs to capture mouse movements.  Putting a hypermedia network request in-between a mouse
move and a UI update will not work well, and you would be far better off writing your own client-side state management
for the game and syncing with a server using a different technology.

Of course, your game may also have a setting page, and that setting page might be better done with hypermedia than
whatever solution you use for the core of your game.  There is nothing wrong with mxing and matching approaches!

### Your team is not on board

A final reason to not choose hypermedia isn't technical, but rather sociological: currently, hypermedia simply isn't
in favor in web development.  Many companies have adopted react as their standard library for building web applications.  
Many developers and consultants have bet their careers on it.  Many hiring managers have never heard of hypermedia, let
alone htmx, but put react on every job they post out of habit.

While this is frustrating, it is also a real phenomenon and should be borne in mind with humility.  Although Contexte
was able to rewrite their application quickly and every effectively in htmx, not all teams are as small, agile and
passionate, nor are all applications such slam dunks for the approach.  It may be better to adopt hypermedia around
the edges, perhaps for internal tools first, to prove its value first, before taking a broader look at it.

## Conclusion

We are often asked what sorts of applications **wouldn't** htmx be good for.  Again, we prefer to think about things on a 
feature-by-feature basis, and we hope that this article has given you some design points to think about when
considering hypermedia and htmx.

But, at a high level and to close with some easy-to-remember applications:

We think that applications like Twitter or GMail could be built very effectively using hypermedia due to their
focus on text-and-images, but that applications like Google Sheets or Google Maps could not due to their arbitrary
data dependencies and UI paradigms.

Of course, the vast majority of web applications are nowhere near the scale of these examples, and almost every web
application has parts where the hypermedia approach could be better: simpler, faster and cleaner.

Having hypermedia as a tool in your tool-chest will improve your ability to address engineering problems as a web
developer, even if you don't reach for it as your favorite hammer, like we do.  There is a 
good [theoretical basis](https://htmx.org/essays/a-real-world-react-to-htmx-port/) for the approach, as well as 
[practical benefits for many applications](https://htmx.org/essays/a-real-world-react-to-htmx-port/).

Not the least being: this is how the web is supposed to work!