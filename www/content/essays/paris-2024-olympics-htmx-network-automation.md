+++
title = "Building Critical Infrastructure with htmx: Network Automation for the Paris 2024 Olympics"
description = """\
  Building critical software infrastructure with htmx, and how the simplification induced by this approach \
  is interesting for AI-assisted development."""
date = 2026-01-16
authors = ["Rodolphe Trujillo"]
[taxonomies]
tag = ["posts"]
+++

## A Bit of Background

During my 6 years at Cisco, I developed numerous web applications to assist network engineers with highly complex
operations, both in terms of the volume of tasks to accomplish and the rigor of procedures to follow. Networking is a
specialized field in its own right, where the slightest error can have disastrous consequences: a network failure, even
partial, can deprive millions of people of essential services like the ability to make a simple phone call.

This criticality imposes strict requirements on code meant for network operations: it must be reliable, readable, and
free of unnecessary frills. If there's a problem, you need to be able to immediately trace the data flow and fix it on
the spot. That's why, for years, I've used very few design patterns and banned function calls that call functions that
call functions, and so on. Beyond 2 levels of calls, I abstain.

Following this logic, I favor mature tools over the latest trends. Thus, the Django / Celery / SQLite stack had been in
my toolbox for a long time. But like everyone else in the 2010s, I built SPAs and had never heard of intercooler.js or
hypermedia, and I understood REST the way it's commonly described pretty much everywhere.

For the JS framework, I made a conservative choice (and a marginal one, I know): I chose Ember.js. My motivations were
its strong backward compatibility during updates and native MVC support. This JS framework is excellent, and that's
still my opinion.

After watching David Guillot's presentation on HTMX at DjangoCon Europe 2022, I dug into the subject and prototyped a
component that addressed one of my recurring needs. It's a kind of datatable on which you can trigger actions. There's a
demo video on the HTMX Discord [here](https://discord.com/channels/725789699527933952/909436816388669530/1042451443656966234).

I was a beginner with HTMX and built it in 2-3 days (no AI :-) ). But what was interesting wasn't so much having this
component quickly at hand : it was the 100% Django codebase. One codebase instead of two, one app to maintain, and no
more API contracts to manage between front and back.

And once again, even though I was comfortable with the Ember.js framework, having a single project to maintain changes
everything.

A few weeks later, a concrete use case came up for a major French ISP: configuring L2VPNs on brand-new routers, in bulk,
without configuration errors (obviously), based on configurations from old routers that were end-of-life and about to be
decommissioned. It was highly critical: a single router can handle thousands of clients, and... there are a lot of
routers.

From that point on, I used the Django / Celery + HTMX + SQLite (and Hyperscript) stack and delivered the app in 5 weeks.
My goal was to guide the network engineer by the hand and spare them 100% of the repetitive, tedious work: they just had
to click and confirm, everything was handled. Their role was now limited to their expertise, and if there was a problem,
it was up to them to fix the network.

The project, initially estimated at 18 months, ultimately took 9. And we were lucky: there were no complex corner cases
to handle. And even if there had been, we had plenty of time to deal with them.

HTMX in all this?
If I had to develop the app as a SPA, it would have taken me at least twice as long. Why?
As a solo full-stack developer, simply switching back and forth between codebases is already time-consuming. And that's
just the tip of the iceberg: the front/back approach itself adds a layer of complexity that ends up weighing heavily on
productivity.

## HTMX at the Olympic Games

The Paris 2024 Olympic Games network consisted of thousands of Cisco switches pre-configured to accept Wi-Fi access
points, which self-configured through an automation system developed by Orange and Cisco. Wi-Fi was the most common
connectivity mode at the Games. But in some cases, a physical connection was necessary, most often to plug in a video
camera, but not only. Sometimes there was simply no other choice but to rely on a cable to connect, and therefore to
configure the relevant switch port. That's where an application became necessary.

When Pollux contacted me about his need, he already had a data model for his network services in a Django project.
Additionally, he could deploy services via CLI: part of the business logic was already in place. The problem was that
service deployment parameters needed to be consolidated in an application. In CLI, you have to manage different data
sources, which can quickly become complicated for the user. So it was necessary to centralize these business parameters
in a webapp, expose all the data needed to deploy a service, and provide a GUI to configure them.

The Games were approaching and Pollux didn't have time to build the webapp: as the architect of the Olympic network, he
was overwhelmed by a colossal number of tasks. I showed him the L2VPN app mentioned above and specified the 5-week
delivery timeline. I told him that if it suited him, I could build him an HTMX webapp based on his existing Django
project and a Bootstrap CSS customized internally by Orange.

We agreed on an 8-week timeline to cover the need, which involved 3 connectivity services: Direct Internet Access,
Private VLAN, and Shared Internet Access.

## Web Dev with HTMX

HTMX is somewhat a return to the roots of web development, and regardless of the web framework: Django, ROR, Symphony...
You rediscover everything that makes a web framework useful rather than turning it into a mere JSON provider. Sending
HTML directly to the browser, storing the app state directly in the HTML. That's what true REST is, and it's so much
simpler to manage.

If you ask me what's most striking, it's certainly returning to very simple things like this:

<figure>
<center>

![progress bar](/img/paris-olympics-progress-bar.png)

</center>
<figcaption> Progress bar from RCP Portal </figcaption>
</figure>

How does this progress bar work? 

Exactly like [the example in the docs](https://htmx.org/examples/progress-bar/)! 

Why this choice? Because it's coded in 10 seconds, because the app won't have thousands of users on this internal tool,
no scaling concerns: you can do good old data polling without any problem.

And the end user? If I use old-school polling, they don't care: what they want is the information. No SSE or WebSocket
for this use case, I don't need it. And if the need ever arises, the WebSocket (or SSE) plugin is easy to set up.

One of the big advantages of the philosophy surrounding HTMX is the notion of [Locality of Behaviour](@/essays/locality-of-behaviour.md). Let's take this
progress bar: if you want to know how it works, just look at the page source. No need to go into documentation or the
codebase, just a right-click and "View Page Source":

```html

<div
        hx-get="/job/progress"
        hx-trigger="every 600ms"
        hx-target="this"
        hx-swap="innerHTML">
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
         aria-labelledby="pblabel">
        <div id="pb" class="progress-bar" style="width:0%">
        </div>
    </div>
```

You immediately know that every 600ms, this part of the page is updated with the content returned by the view handling
the `/job/progress` endpoint. No mystery for the team taking over development who wants to modify something: everything
you need to know is right in front of you.

And that's exactly what HTMX is about: every component, every interaction remains visible, understandable, and
self-documented directly in the HTML. This is important for what comes next.

## HTMX is "AI friendly"™

In the early stages of app development, I focused on the most complex network service: DIA (Direct Internet Access). DIA
for the Olympic Games meant many business parameters with many rules to apply.

The DIA creation form calls an endpoint that triggers a very long function, close to 600 lines of code.

Why such a long function?

Because it's more readable and efficient to concentrate the data flow in one place, rather than dispersing it across a
multitude of layers and patterns.

An application is a wrapper around data: it orchestrates the data flow (data must flow!) and CRUD operations. But what
control do you retain when this flow is obfuscated in complex patterns or dispersed across 2 codebases?

The data flow must remain readable for the developer.

HTMX, by allowing you to manage the GUI directly server-side, makes this flow even clearer. The same endpoint can return
HTML fragments to signal that certain form data is invalid, or conversely indicate that a service deployment has
started. You can thus act on any part of the GUI within the same function, while transforming the data to pass it to the
system that configures the network switch.

In a traditional frontend/backend approach, this would be more complex: two applications to manage, and a much less
readable data flow.

This drastic code simplification enabled by HTMX, combined with a procedural approach, produces compact and transparent
logic, easy to navigate for a developer... or for an LLM, as I discovered.

For the Private VLAN (PVLAN) network service, the "shape" of the main function is roughly the same as for DIA: input
parameters, validation, then interactions with the GUI via HTML fragments, and, if everything is correct, switch
configuration.

The difference? PVLAN is simpler to handle: fewer form parameters and a bit less business logic.

So I took the long DIA function and gave it to an LLM (Claude 3 had just been released), with a prompt specifying the
parameters specific to PVLAN. In seconds, Claude returned a new adapted function, and the same for the HTML templates.
Result: about 80% of the code was ready, with only a few points to correct and relatively few errors made by the LLM,
which freed up time for me to add specific business logic for a major client.

For the third network service, Shared Internet Access (SIA), even simpler than the previous two, I provided the LLM with
both the DIA and PVLAN functions. With the magic word *"extrapolation"* in the prompt, the generated code was 95%
correct.

## Summary of My Experience

- **DIA**: 0% AI, 100% handwritten code (business logic + GUI + overhaul of the switch configuration task management
  system) → **4 weeks**
- **PVLAN**: 80% AI, 20% handwritten code (corrections + adding specific business logic) → **1 week**
- **SIA**: 95% AI, 5% handwritten code (minor corrections) → **1 day**

The time saved was reinvested in testing, bug fixes, project management, and even a few additions outside the initial
scope.

Moreover, the same app was used on the "Tour de France 2025" with minor changes that were made easily thanks to the
hypermedia approach.

This result is possible because of the combination of *HTMX + the procedural approach*, which produces naturally 
readable code, without unnecessary abstraction layers. The data flow is clear, concentrated in a single function, and 
the GUI/server logic is directly accessible.

For an LLM, this is ideal: it doesn't need to construct context through a complex architecture. It just needs to follow
the flow and extrapolate it to a new use case. In other words, what's simpler for the developer is also simpler for the
AI. This is the sense in which HTMX is truly *"AI friendly"™*.

Ultimately, HTMX mainly allowed me to save time and keep my code clear.
No unnecessary layers, no superfluous complexity: just concrete stuff that works, fast.

And that has made a big difference on these critical projects.
