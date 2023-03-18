+++
title = "kutty, er, htmx 0.0.3 has been released!"
date = 2020-05-17
[taxonomies]
tag = ["posts", "announcements"]
+++

## htmx 0.0.3 Release

I'm pleased to announce the [0.0.3 release](https://unpkg.com/browse/htmx.org@0.0.3/) of kutty, er, htmx, the successor
to [intercooler.js](http://intercoolerjs.org)!

#### Why not kutty 0.0.2?

One of the reasons you put a `0.0.1` release out there is to see what happens.  And one of the things that 
happened was that multiple people made comments on how the word "kutty" meant different things in different languages, including
"small", "child" and a very unfortunate meaning in dutch slang.  I had originally 
[called the project `htmx`](https://github.com/bigskysoftware/kutty/commit/b003ccadf855fe49a40ca0b86ca3c9e16448d33c#diff-b9cfc7f2cdf78a7f4b91a753d10865a2) 
(html extensions) and went back and forth between the two names for a bit.  

It seems like, upon contact with reality, `htmx` is a better long term name for the project.  It's also
a lot easier to search twitter & reddit for that term.

It's a simple fix for anyone who actually used `0.0.1`:

* attributes go from `kt-` to `hx-` (their original prefix)
* request headers go from  `X-KT-` to `X-HX-`
* `kutty` goes to `htmx` for event names, etc.

#### Changes

OK, so besides the big re-rename, what changed?

* A bug fix for the `hx-prompt` attribute
* A bug fix for multiple `hx-swap-oob` attributes
* Moved the default CSS indicator injection into its own sheet to avoid breaking
* Added the `htmx.config.includeIndicatorStyles` configuration option so people can opt out of injecting the indicator CSS

Cheers!
