---
title: "Debugging"
description: "Debug htmx issues with browser dev tools"
keywords: ["debug", "devtools", "console", "logging", "logAll", "troubleshoot"]
---

Declarative and event driven programming with htmx (or any other declarative language) can be a wonderful and highly
productive
activity, but one disadvantage when compared with imperative approaches is that it can be trickier to debug.

Figuring out why something *isn't* happening, for example, can be difficult if you don't know the tricks.

Here are some tips:

Errors and warnings flow to `console.error` / `console.warn` by default. To also see every event htmx dispatches, set `htmx.config.logAll = true`:

```javascript
htmx.config.logAll = true;
```

Observability tools (Sentry, DataDog RUM, LogRocket, etc.) capture `console.*` automatically, so htmx logs flow into your existing pipeline without any extra setup.

Of course, that won't tell you why htmx *isn't* doing something. You might also not know *what* events a DOM
element is firing to use as a trigger. To address this, you can use the
[`monitorEvents()`](https://developers.google.com/web/updates/2015/05/quickly-monitor-events-from-the-console-panel)
method available in the
browser console:

```javascript
monitorEvents(htmx.find("#theElement"));
```

This will spit out all events that are occurring on the element with the id `theElement` to the console, and allow you
to see exactly what is going on with it.

Note that this *only* works from the console, you cannot embed it in a script tag on your page.

Finally, push come shove, you might want to just debug `htmx.js` by loading up the unminimized version.

You would most likely want to set a break point in the methods to see what's going on.

And always feel free to jump on the [Discord](https://htmx.org/discord) if you need help.
