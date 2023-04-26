+++
title = "Different Types Of Decoupling"
date = 2022-10-23
updated = 2023-02-03
[taxonomies]
tag = ["posts"]
+++

> The central feature that distinguishes the REST architectural style from other network-based styles is its emphasis on 
> a uniform interface between components. By applying the software engineering principle of generality to the component 
> interface, the overall system architecture is simplified and the visibility of interactions is improved. 
> Implementations are decoupled from the services they provide, which encourages independent evolvability.

_-Roy Fielding, <https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5>_

Decoupling is the opposite of [coupling](https://en.wikipedia.org/wiki/Coupling_(computer_programming)), where two
pieces of software have a high degree of _interdependence_.  Decoupling software is the act of reducing this
interdependence between unrelated modules so that they can evolve independently.  The concept of coupling and decoupling
is closely (and inversely) related to [cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science)).  A highly
cohesive software module has related logic within a module or conceptual boundary, rather than spread out.  Broadly, 
the more decoupled your codebase is, the more cohesive it will be as well.  Developers generally have a sense that 
decoupling is a good thing

An argument we see at times for the JSON/Data API style of development, where a Single Page Application-style web 
applications communicates with a back end via a JSON API, is that this architectural choice _decouples_ the front-end and
back-end code, and allows re-use of the JSON API in other contexts, such as a mobile application.



You can imagine how creating a general JSON Data API that can be consumed by multiple clients would _decouple_ your
application's back-end code from a particular client: it provides a standard, well documented API and any client that wants
to can use that is welcome to do so.

In the second part of this essay we are going to talk about the hypermedia approach, and how it decouples your system in
a different manner than the way a generic Data API does.  But, before we get into that, we want to spend a bit of time and
look at the facts on the ground with respect to JSON APIs and see how decoupling is working out.

## "The Worst Part Of My Job..."