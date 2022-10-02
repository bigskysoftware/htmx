---
layout: layout.njk
title: A Real World React -> htmx Port
---

## Moving From React to htmx

It is all well and good talking about [REST & HATEOAS](/essays/hateoas) in theory or describing the
[Hypermedia-Driven Application](/essays/hypermedia-driven-applications) architecture, but at the end of the day, what 
matters in software is practical: Does it work?  Does it improve things?

We can say for sure that htmx _works_, since we use it in our own software.  But it is hard to say that it would be
an _improvement_ over other approaches, since we haven't had an apples-to-apples comparison of how htmx might compare with,
say, [react](https://reactjs.org/).

Until now.

[David Guillot](https://github.com/David-Guillot) at [Contexte](https://www.contexte.com/) has given what we are calling 
["The Mother of All htmx Demos"](https://en.wikipedia.org/wiki/The_Mother_of_All_Demos) at
[DjangoCon 2022](https://pretalx.evolutio.pt/djangocon-europe-2022/talk/MZWJEA/):

> **From React to htmx on a real-world SaaS product: we did it, and it's awesome!**
> 
> We took the plunge and replaced the 2-year-of-work React UI of our SaaS product with simple Django templates and htmx 
> in a couple of months. We’d like to share our experience with you, with concrete indicators on various aspects, and 
> convince your CTO!

## Video

[//]: # (You can &#40;should!&#41; watch the entire presentation here:)

[//]: # ()
[//]: # (<iframe width="615" height="350" src="https://www.youtube.com/embed/dQw4w9WgXcQ" )

[//]: # (title="Rick Astley - Never Gonna Give You Up &#40;Official Music Video&#41;" frameborder="0" )

[//]: # (allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>)

The video of this talk is not publically available yet, but if you just want the executive summary:

## Executive Summary

* The effort took about **2 months** (with a 21K LOC code base, mostly JavaScript)
* **No reduction** in the application's user experience (UX)
* They reduced the **code base size** by **67%** (21,500 LOC to 7200 LOC)
* They _increased_ **python code** by **140%** (500 LOC to 1200 LOC), a good thing if you prefer python to JS
* They reduced their total **JS dependencies** by **96%** (255 to 9)
* They reduced their **web build time** by **88%** (40 seconds to 5)
* **First load time-to-interactive** was reduced by **50-60%** (from 2 to 6 seconds to 1 to 2 seconds)
* **Much larger data sets were possible** when using htmx, because react simply couldn't handle the data
* Web application **memory usage** was reduced by **46%** (75MB to 45MB)

## Analysis

These are eye-popping numbers, and they reflect the fact that the Contexte application is extremely amenable to 
hypermedia: it is a content-focused application that shows lots of text and images.  We would not expect every 
web application to see these sorts of numbers.  However, we _would_ expect many applications to see dramatic improvements
by adopting the hypermedia/htmx approach, at least for part of their system.

### Dev Team Makeup

One easy-to-overlook aspect of the port is the effect it had on the team's structure.  When Contexte was using react,
there was a hard split between back end and front end, with two developers being entirely back end, one developer being
entirely front end, and one developer being "full stack".  "Full stack" here means they are comfortable with doing work
on both the front end and back end, and, thus are able to develop features entirely independently across the whole "web stack".

After the port to htmx, *the entire team* became "full stack" developers.  This means that each team member is more 
effective and able to contribute more value.  It also makes development more fun, since developers can own an entire
feature.  Finally, it can lead to better optimized software, since the developer can make optimizations anywhere in
the stack without needing to coordinate with other developers.

## Q&A

Here are some questions we asked David:

Q: How did you hear about htmx?  What made you consider using it for Contexte?

Q: These are eye-popping numbers.  Did you expect htmx to perform this well for you?

Q: Your team went from having a strong back-end/front-end split to a team of full-stack developers.  How did that change
affect development?

Q: Surely there were areas where htmx wasn't as nice as react.  Can you give some?

Q: Do you have any insights for other people considering htmx?


## Slides

The slides for the presentation can be found here (be sure to check the excellent speakers notes!)

<https://docs.google.com/presentation/d/1jW7vTiHFzA71m2EoCywjNXch-RPQJuAkTiLpleYFQjI/edit?usp=sharing>