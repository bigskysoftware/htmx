+++
title = "Turning the Warship: htmx and Big Blue"
description = """\
In this article, Luiz Esmiralha describes how he finally shipped htmx at a big client \
with the help of IBM Bob.
"""
date = 2026-10-22
authors = ["Luiz Esmiralha"]
[taxonomies]
tag = ["posts"]
+++

For the past 30 years, I have worked almost exclusively for big multinational corporations and yet, after all this time,
they continue to be a puzzle to me. They create markets and reshape industries, yet they are also slow to adopt new
ideas and even slower to give up on bad ones. It feels like being a crew member on a gargantuan warship pushing full
speed ahead at 35 knots, while trying to make her turn around.

I have been an htmx enthusiast/CEO (same thing) since 2022, when I first experimented with it in personal projects. The
simplicity of the stack and the expressiveness of the library were remarkable and a relief from the heavyweight SPA
approach, which has its place but has become a knee-jerk choice for most projects. Since this initial success, I have
tried to use htmx at work in every engagement where it would be a good fit (many such cases). Well, the warship takes
her time.

Three years later, I was assigned to a new client, a Brazilian water utility, which hired IBM (I work at IBM btw) to
maintain and extend their customer portal, an app that handles everything from paying bills to reporting leaks and
supply interruptions. One of the client's pain points was that they had no back-office app for operational tasks, like
managing feature toggles, resetting passwords and editing configuration data. Operators had to resort to manual changes
to the production database in order to enable a feature toggle. In my experience, it is easier to introduce new
technologies in internal tools where mistakes aren't visible to customers. I finally saw an opening and took it.

Still, I'm an architect (so-called) and I can't make a technology choice without weighing the alternatives. Wouldn't
feel right. So, in this age of vibe coding, I ran another experiment. I presented the alternatives to IBM Bob (IBM's
coding agent) and let it pick the best fit for the context. Bob ditched the SPA approach as too complex for the project
and went for a simpler server-rendered HTML option. When I asked for concrete tech choices, it suggested htmx. Now, I
know that I am biased and that probably influenced how I prompted Bob, but I never mentioned htmx during our session.

I'll make a brief digression here. Every new solution in a brownfield project like ours must fit into the client's
existing constraints, such as architecture, processes and policies. Our client runs everything on AWS-managed
Kubernetes. It's a solid architectural choice, but it's complex (and complexity is...?). I would have avoided it for
such a simple solution, but cutting against the grain would do more harm than good to the architecture.

The solution we ended up with consists of two components: a web interface meant to be run locally and a set of jobs that
run on Kubernetes. The idea was to avoid exposing another web app for the back office, especially one that runs
sensitive operations like resetting user passwords. We would have faced challenges such as federated authentication,
authorization, and tracking who changed what and when. Instead, we opted for a local website running htmx that updates
versioned objects in GitLab. These changes trigger pipelines that run Kubernetes jobs to perform the necessary
operations in the database. With this GitOps approach, we get authentication, authorization and audit trails "for free."

We did the entire implementation by writing a Markdown spec, refining it with Bob and then letting it code (yes, I read
the code). Not what the moderns call spec-driven development, but similar to what Carson outlines in his "Markdown in
/src" essay. Bob basically one-shot the first working version of the app in under an hour. It was quite a surprise to
learn that Bob is well-versed in htmx patterns and idioms, like placing the element that triggers the swap inside the
swap target itself.

The result was a solution that fits the problem perfectly with no new infrastructure and low complexity in the UI
(complexity very, very bad). The UI is mostly tables and forms, and what we like most is how responsive it feels when
compared to the customer portal, which is written in React, even with both running locally against local databases. The
vaporwave-inspired look (a nod to htmx lore) doesn't hurt either.

The back-office app is a great improvement in consistency and security over the flaky procedures that required manual
changes to the production database. We expect to add more features to it over the coming weeks, and we don't want to
stop at the back office. We are in talks about revamping the customer portal next quarter, and htmx is on the table. The
warship (and maybe the tide) is turning after all.
