+++
title = "REST Copypasta"
date = 2023-06-26
updated = 2023-06-26
[taxonomies]
tag = ["posts"]
[extra]
show_title = false
+++

# For Reference

```
I'd just like to interject for a moment.  What you're referring to as REST,
is in fact, JSON/RPC, or as I've recently taken to calling it, REST-less.
JSON is not a hypermedia unto itself, but rather a plain data format made useful 
by out of band information as defined by swagger documentation or similar.

Many computer users work with a canonical version of REST every day,
without realizing it.  Through a peculiar turn of events, the version of REST
which is widely used today is often called "The Web", and many of its users are
not aware that it is basically the REST-ful architecture, defined by Roy Fielding.

There really is a REST, and these people are using it, but it is just a
part of The Web they use.  REST is the network architecture: hypermedia encodes the state
 of resources for hypermedia clients. JSON is an essential part of Single Page Applications, 
 but useless by itself; it can only function in the context of a complete API specification.  JSON is
normally used in combination with SPA libraries: the whole system
is basically RPC with JSON added, or JSON/RPC.  All the so-called "REST-ful"
APIs are really JSON/RPC.
```