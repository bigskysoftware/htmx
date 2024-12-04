---
layout: blog_post
nav: blog
---

At a recent tech talk I gave, as is common, a recruiter spoke beforehand.  He said that the #1 thing that his clients
were looking for were "full stack" developers, that is, developers who can conceive of and deliver an entire application
or an entire feature within an application, from the front end all the way through to the data store.

It used to be that being a "full-stack" developer wasn't all that complex.  You had to know a bit of SQL, how HTML worked and
a bit of server side glue to get from point A to point B.  It wasn't easy to produce a *good* web application, but 
the basic technology stack was simple enough to understand.

These days, [just the front end technologies](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f#.dwh66ycs0) 
involved in a web application can have a huge learning curve.  And that doesn't even get you everything you need on the 
front end: you still need to understand CSS and HTML on top of all of that.  

Yikes.

There is a shortcut, though.  Doing full-stack development still takes a bit more effort than the good old days, but only
just a bit.
 
Assuming you know a bit of basic web programming, here is the easy, two-step process:

## Step 1: Learn Bootstrap &amp; CSS

First you need to put in a bit of time with [Bootstrap](http://getbootstrap.com/) and
[some CSS tutorials](http://www.skilledup.com/articles/best-free-css-tutorials). This shouldn't be too bad, as long as 
you keep it simple and you go with the grain of the tools.

Rely mostly on Bootstrap's core features: CSS should be used sparingly beyond the basics.  **If something is hard to do, just don't do it.**

Use the Bootstrap defaults as much as possible and add your personalized look around the frame of the application, rather 
than in the main content pane of the application.  **Keep the HTML as stripped down and simple as possible.**

As a side note: a vocal group of people is critical of Bootstrap, and I understand the concern that all our applications 
can end up looking the same (although I think that it is ambiguous that this is a bad thing, from a UX perspective). 
Regardless, the default bootstrap look and feel, with a bit of CSS on top of it, is going to be better than what *you*, 
aspiring full stack developer, can do and it is far better than the default browser look and feel.

Bootstrap is a standard, and later on, if it becomes necessary, you can bring in real design talent to improve it.  They will 
thank you for keeping the HTML clean.

## Step 2: Learn intercooler.js

And now here's the real trick: **use [intercooler.js](http://intercoolerjs.org)**.  You can set aside 99% of the junk that is 
involved in modern javascript front end development and use the familiar web development tools you always have.

You can use whatever backend technology you like and are familiar with: ruby, Java, javascript, Haskell, .Net... whatever. 
You might not have to write a single line of javascript, depending on  how fancy you want to get, and you will be able to 
produce a fast, rich web application quickly and reliably.  You can easily retrofit it into existing web applications
as well.

You'll get [progress indicators](http://intercoolerjs.org/docs.html#progress) for free and, with a bit of CSS, you can 
have [nice transitions](http://intercoolerjs.org/docs.html#transitions) as well.

There are a [bunch of examples of common UX patterns](http://intercoolerjs.org/examples/index.html) using stripped down 
bootstrap-based HTML already available, to be copyandpasta'd into your project.

**And that's it.**

Congrats, you can update your resume: you have just completed my two minute full stack developer camp.

*Always remember the programmer's three virtues: [Laziness, Impatience, Hubris](http://threevirtues.com/)*