+++
title = "Another Real World React -> htmx Port"
description = """\
  In this article, Carson Gross summarizes a real-world case study of Adrian McPhee porting the OpenUnited platform \
  from React to htmx, documenting significant reductions in code complexity and development time while highlighting \
  how content-focused web applications can benefit from a hypermedia architectural approach."""
date = 2023-09-20
updated = 2023-09-20
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

The [Mother of All htmx Demos](@/essays/a-real-world-react-to-htmx-port.md) you can see the real world results of a
port from a React-based front end to an htmx-powered front end.  The results are very good, although we qualify the
experience with the following:

> These are eye-popping numbers, and they reflect the fact that the Contexte application is extremely amenable to
hypermedia: it is a content-focused application that shows lots of text and images.  We would not expect every
web application to see these sorts of numbers.
> 
> However, we _would_ expect _many_ applications to see dramatic improvements by adopting the hypermedia/htmx approach, at
least for part of their system.

As luck would have it, we have another application (again, based on Django on the server side) that has been ported from
a React front end to an htmx front end: [OpenUnited](https://openunited.com/).

Here is a graphic from the [original LinkedIn post](https://www.linkedin.com/feed/update/urn:li:activity:7109116330770878464/) 
by Adrian McPhee, showing the total Lines of Code in the code base before and after the port:

![Open United Before & After](/img/open_united_before_after_htmx.png)

### Before/After Source Code

A very nice aspect of this port is that, because OpenUnited is open source, in contrast with Contexte, the before and 
after code is available to examine:

Before: <https://github.com/OpenUnited/old-codebase>

After: <https://github.com/OpenUnited/platform>

## Executive Summary

Here is a high-level summary of the port

* They reduced the **code base size** by **61%** (31237 LOC to 12044 LOC)
* They reduced the **total number of files** by **72%** (588 files to 163 files)
* They reduced the **total number of file types** by **38%** (18 file types to 11 file types)
* Subjectively, development velocity felt at least **5X** faster
* Rather than prototyping in Figma and then porting to HTML, UX development was done directly in HTML

## Analysis

Once again we have some eye-popping results.  This is because the OpenUnited application is extremely 
amenable to hypermedia: like Contexte, it is a content-focused application that shows lots of text and images.  

This experience again demonstrates that, for at least a certain class of web applications, htmx and the hypermedia 
architecture can be an excellent choice.
