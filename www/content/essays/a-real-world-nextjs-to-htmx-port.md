+++
title = "Next.js to htmx — A Real World Example"
description = """\
  In this case study, Pouria Ezzati examines how migrating a URL shortener from Next.js to htmx resulted in \
  significant improvements in codebase size, dependencies, and developer experience while challenging assumptions \
  about modern web frameworks."""
date = 2024-11-07
updated = 2024-11-07
authors = ["Pouria Ezzati"]
[taxonomies]
tag = ["posts"]
+++

Over 6 years ago, I created [an open source URL shortener](https://github.com/thedevs-network/kutt) with Next.js and after years of working on it, I found Next.js to be much more of a burden than a help. Over the years, Next.js has changed, and so did my code so it can be compatible with those changes. 

My Next.js codebase grew bigger, and its complexity increased by greater size. I had dozens of components and a list of dependencies to manage. I ended up maintaining the code constantly just to keep it alive. Sure, Next.js helped here and there, but at what cost?

I asked myself, what am I doing on my website that is so complex that needs all that JavaScript code to decide what to render and how to render on my webpage? Next.js was trying to render the webpage from the server side, so why won't I send the HTML directly myself?

So I decided to try a new route—some might say the good ol' route—and choose plain HTML and use the help of htmx for that.

## Video

Watch me go full in details here:

<iframe style="max-width: 100%" width="618" height="352" src="https://www.youtube.com/embed/8RL4NvYZDT4" title=" Next.js to htmx – A Real World Example " frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


## The process

Replacing my components with the equivalent HTML elements powered by htmx wasn't exactly an easy task, but one that was worth the time. I had to view things from a different angle, and I sometimes felt strict in what user interactions I can implement, but what I created was reliable and fast.

All the build steps were gone; no more transpiling and compiling the code. What you see is what you get. Most of the dependencies became redundant and have been removed. All the main logic of the website was moved to the server side, holding one source for the truth.

In the Next.js version I had isolated components, global states, and all that JavaScript to handle the forms or update the content, and yet, everything was more intuitive with htmx. After trying it, sending and receiving HTML suddenly made sense. 

## Summary

- Dependencies are **reduced by 87%** (**24** to **3**!)
- I wrote **less code by 17%**  (**9500 LOC** to **7900 LOC**.) In reality the total LOC of the code base is **reduced by more than 50%**, since much less code is imported from the dependencies.
- Web build time was **reduced by 100%** (there's **no build step** anymore.)
- Size of the website **reduced by more than 85%** (**~800KB** to **~100KB**!) 

These numbers signify a great improvement, however, what is important for me at the end is the user and the developer experience, which to me htmx won at both. 