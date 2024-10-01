+++
title = "Why Gumroad Didn't Choose htmx"
date = 2024-09-30
updated = 2024-09-30
[taxonomies]
author = ["Sahil Lavingia"]
tag = ["posts"]
+++

At Gumroad, we recently embarked on a new project called [Helper](https://helper.ai). As the CEO, I was initially quite optimistic about using [htmx](https://htmx.org) for this project, even though some team members were less enthusiastic. My optimism stemmed from previous experiences with React, which often felt like overkill for our needs. I thought htmx could be a good solution to keep our front-end super light.

![Gumroad Red](/img/gumroad-red.jpeg)

In fact, I shared this sentiment with our team in Slack:

> "https://htmx.org/ may be a way of adding simple interactions to start"

And initially, it seemed promising! As one of our engineers at Gumroad eloquently put it:

> "HTMX is (officially) a meme to make fun of how overly complicated the JS landscape has gotten - much like tailwind is just a different syntax for inline CSS, HTMX is a different syntax for inline JS."

However, unlike Tailwind, which has found its place in our toolkit, htmx didn't scale for our purposes and didn't lead to the best user experience for our customers–at least for our use case.

Here's why:

1. **Intuition and Developer Experience**: While it would have been possible to do the right thing in htmx, we found it much more intuitive and fun to get everything working with Next.js. The development process felt natural with Next.js, whereas with htmx, it often felt unnatural and forced. For example, when building complex forms with dynamic validation and conditional fields, we found ourselves writing convoluted server-side logic to handle what would be straightforward client-side operations in React.

2. **UX Limitations**: htmx ended up pushing our app towards a Rails/CRUD approach, which led to a really poor (or at least, boring and generic) user experience by default. We found ourselves constantly fighting against this tendency, which was counterproductive. For instance, implementing a drag-and-drop interface for our workflow builder proved to be a significant challenge with htmx, requiring workarounds that felt clunky compared to the smooth experience we could achieve with React libraries.

3. **AI and Tooling Support**: It's worth noting that AI tools are intimately familiar with Next.js and not so much with htmx, due to the lack of open-source training data. This is similar to the issue Rails faces. While not a dealbreaker, it did impact our development speed and the ease of finding solutions to problems. When we encountered issues, the wealth of resources available for React/Next.js made troubleshooting much faster.

4. **Scalability Concerns**: As our project grew in complexity, we found htmx struggling to keep up with our needs. The simplicity that initially attracted us began to feel limiting as we tried to implement more sophisticated interactions and state management. For example, as we added features like real-time collaboration and complex data visualization, managing state across multiple components became increasingly difficult with htmx's server-centric approach.

5. **Community and Ecosystem**: The React/Next.js ecosystem is vast and mature, offering solutions to almost any problem we encountered. With htmx, we often found ourselves reinventing the wheel or compromising on functionality. This became particularly evident when we needed to integrate third-party services and libraries, which often had React bindings but no htmx equivalents.

![Gumroad Green](/img/gumroad-green.jpeg)

Ultimately, we ended up moving to React/Next.js, which has been a really great fit for building the complex UX we've been looking for. We're happy with this decision–for now. It's allowed us to move faster, create more engaging user experiences, and leverage a wealth of existing tools and libraries.

![Gumroad Helper Before After](/img/gumroad-helper-before-after.jpeg)

This experience has reinforced a valuable lesson: while it's important to consider lightweight alternatives, it's equally crucial to choose technologies that can grow with your project and support your long-term vision. For Helper, React and Next.js have proven to be that choice.

Since we've moved there, we've been able to seriously upgrade our app's user experience for our core customers.

![Gumroad Helper Workflows](/img/gumroad-helper-workflows.png)

To elaborate further on our experience:

The "unnatural and forced" feeling with htmx came primarily from trying to implement complex, stateful interactions. For instance, our workflow builder (shown above) requires a lot of client-side state management and real-time updates. With htmx, we found ourselves creating numerous endpoints and writing complex server-side logic to manage what would be simple state updates in React.

Regarding user experiences that were impractical with htmx, real-time collaborative features were a significant challenge. We wanted users to see each other's cursor movements and edits in real-time, which is straightforward with WebSockets and React but became a complex endeavor with htmx.

Our attempt to implement sophisticated interactions and state management with htmx was driven by the evolving requirements of Helper. As we added features like conditional logic in workflows, multi-step forms with complex validation, and real-time data visualization, we found ourselves pushing against the limits of what htmx was designed to do efficiently.

We acknowledge that htmx may be a great fit for many projects–though I haven't seen many that reach our desired level of front-end complexity–especially those with simpler interaction models or those built on top of existing server-rendered applications. Our experience doesn't invalidate the benefits others have found in moving from React to htmx. The key is understanding your project's specific needs and choosing the tool that best aligns with those requirements.

In our case, the complex, stateful, and real-time nature of Helper's interface made React and Next.js a better fit. However, we continue to appreciate htmx's approach and may consider it for future projects where its strengths align better with our needs.

That said, we're always open to reevaluating our tech stack as our needs evolve and new technologies emerge. Who knows what the future might bring?
