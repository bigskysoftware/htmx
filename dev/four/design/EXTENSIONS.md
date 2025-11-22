# Extension Organization

Extensions have had a rough history with htmx.  First, extensions were bundled directly in htmx.  Eventually this became
untenable for some extensions: many were either too small and too experimental to keep in sync with the htmx releases.

In htmx 2.0, we moved to separate repository for extensions:

<https://github.com/bigskysoftware/htmx-extensions>

We organized extensions into two categories:

* `core` - core extensions maintained by the htmx team
* `community` - community extensions maintained by other people (or htmx team members occasionally)

At first, moved the documentation out to a separate website.  We eventually realized this was a mistake, making it
too hard to find the extensions, and moved the documentation back to the main htmx website:

https://htmx.org/extensions/

All in all, a pretty standard open source charlie fargo.

# htmx4

In htmx4 we have a chance to reorganize things again, based on this experience.  One thing that has changed since
the early days is we have a much stronger idea of what extensions should look like and how they should function.  htmx4
has a much better extension architecture, requiring far fewer hacks.  So my hope is that extensions should be much more
stable, at least the core ones.

We have also moved a lot of extension functionality _into_ htmx 4:

* morphing/idiomorph (via the `morph` swaps)
* response targets (via the `hx-status` attribute)
* sse (via normal streaming response handling)

So, given this state of affairs, I want to propose the following extension layout:

## Core Extensions

I propose that the (much smaller set of) core extensions move _back_ into the main repo and are released with htmx 
versions.  This includes the following:

* `hx-compat` - an htmx 2.0 compatibility extension
* `hx-optimistic` - an optimistic update extension
* `hx-preload` - a preloading extension
* `hx-ws` - a websockets extension
* `hx-head` - head tag support

We have a much better idea what all these extensions should look like now and they should be stable and easily tied to
the htmx release cycles.  All of them fill in major bits of functionality that htmx users might want in their htmx-based
applications.

## Community Extensions

Community extensions will remain in external repos and ported on demand.  We will link to these extensions from the
<https://htmx.org/extensions> webpage, but will not try to keep them in a centralized repository.  They can each become
their own, independent project (some maintained by htmx contributors, some managed individually)


