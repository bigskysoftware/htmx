---
title: "htmx-echarts"
description: "Live and statically-fetched ECharts charts over SSE, fetch or polling"
category: "Community"
icon: "icon-[mdi--chart-line]"
keywords: ["echarts", "chart", "sse", "server-sent-events", "polling", "community", "visualization"]
---

The `echarts` extension connects htmx, [Apache ECharts](https://echarts.apache.org/), and Server-Sent Events (SSE) for live-updating — or statically-fetched — charts. It handles the JavaScript wiring for you: initialize a chart, keep it fed with data, forward chart interactions back to htmx, and clean everything up on swap.

> **Community extension.** This is a third-party extension maintained by [Marcin Golenia](https://github.com/marcingolenia), not part of the htmx core. Source, demo, and issues live at [github.com/marcingolenia/htmx-echarts](https://github.com/marcingolenia/htmx-echarts/tree/htmx4). This documentation tracks the `htmx4` branch (htmx 4, beta 5); for htmx 2 use htmx-echarts `0.2.0`.

## Installing

You need htmx, the ECharts browser bundle, and the extension script. ECharts must load **before** the extension, which assumes `window.echarts` is available.

```html
<head>
    <!-- htmx -->
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js" defer></script>
    <!-- ECharts must be loaded before the extension -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js" defer></script>
    <!-- extension -->
    <script src="https://cdn.jsdelivr.net/npm/htmx-echarts@4.0.0-beta5/dist/htmx-echarts.min.js" defer></script>
</head>
```

htmx 4 registers extensions on script load, so no `hx-ext="echarts"` attribute is needed — including the script is enough. If you restrict extensions with the `htmx-config` meta tag, list `echarts` explicitly or it will refuse to register:

```html
<meta name="htmx-config" content='{"extensions": "echarts"}' />
```

## Usage

Mark a chart with `data-chart-type` and point it at a `data-url`. The extension picks a mode from the attributes present:

- `data-url` **and** `data-sse-event` set → **SSE streaming**.
- `data-url` set, `data-sse-event` **not** set → **static fetch** (one-shot).
- `data-url` set with a `poll:` token, no `data-sse-event` → **static fetch + polling**.

In every mode the response body is a **full ECharts option object**, which the extension applies with `setOption`.

### SSE streaming

```html
<div
    data-chart-type="line"
    data-url="/sse"
    data-sse-event="chart-update"
    style="height: 400px;"
></div>
```

The extension opens an `EventSource(data-url)` and, for each `chart-update` event, parses `event.data` as JSON and calls `chart.setOption(...)`.

### Static fetch (one-shot)

```html
<div
    data-chart-type="line"
    data-url="/initial-data"
    style="height: 400px;"
></div>
```

A single `fetch("/initial-data")` runs on init; no SSE connection is opened. The JSON response must be a full ECharts option:

```json
{
    "tooltip": { "trigger": "axis" },
    "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
    "yAxis": { "type": "value" },
    "series": [
        { "name": "2011", "type": "line", "data": [10, 20, 30] },
        { "name": "2012", "type": "bar",  "data": [5, 15, 25] }
    ]
}
```

### Static fetch with polling

Encode a polling interval into `data-url` with a `poll:` token. The first whitespace-separated token is the URL; later tokens configure behavior.

```html
<div
    data-chart-type="line"
    data-url="/charts/line-polling poll:1000ms"
    style="height: 400px;"
></div>
```

The extension fetches once on init, then re-fetches the same URL every interval and applies the latest option. Durations accept plain milliseconds (`1000`, `1000ms`) or seconds (`1s`, `0.5s`, `2.5s`).

### Empty state

When there is nothing to plot, return a full option with empty `series` data plus a [`graphic`](https://echarts.apache.org/en/option.html#graphic) text element so the chart shows a message instead of a blank grid:

```json
{
    "tooltip": { "trigger": "axis" },
    "xAxis": { "type": "category", "data": [] },
    "yAxis": { "type": "value" },
    "series": [{ "name": "Example", "type": "bar", "data": [] }],
    "graphic": {
        "type": "text",
        "left": "center",
        "top": "middle",
        "style": { "text": "No data available", "fontSize": 16, "fill": "#999" }
    }
}
```

## Attributes

| Attribute | Description |
|---|---|
| `data-chart-type` (required) | Marks the element as a chart container — `[data-chart-type]` is the extension's selector. The value (`"line"`, `"bar"`, `"pie"`, …) is for readability; without the attribute the element is ignored. |
| `data-url` (required) | URL for SSE streaming or static JSON fetch, optionally followed by polling modifiers. |
| `data-sse-event` | When set, opens an `EventSource` and listens for this SSE event name. When omitted, the extension does a `fetch` and treats the response as static data. |
| `data-theme` | Registered ECharts theme name passed to `echarts.init`. Omit for the default look. |
| `data-chart-bridge` | Which ECharts events to forward to htmx: `click`, `hover`/`mouseover`, or `false`/`none`. Defaults to `click,hover`. |
| `data-chart-event-click` / `data-chart-event-hover` | Override the default `chart-click` / `chart-hover` event names. |
| `data-chart-loading` | Set to `"false"` to suppress the built-in spinner. By default `chart.showLoading()` runs after init and `chart.hideLoading()` once the first data arrives. |

## Chart events (htmx bridge)

ECharts interactions are forwarded to the chart container as DOM events via [`htmx.trigger`](https://htmx.org/api/#trigger), so you can drive htmx straight from the chart. By default the extension emits:

- `chart-click` — ECharts `click`
- `chart-hover` — ECharts `mouseover` on series / graphic elements

Each event's `detail` carries useful fields from the ECharts callback when present: `name`, `value`, `seriesIndex`, `dataIndex`, `seriesName`, `componentType`, `data`, `color`.

```html
<div
    data-chart-type="pie"
    data-url="/api/charts/sales-by-region"
    hx-trigger="chart-click"
    hx-get="/api/details"
    hx-target="#details"
></div>
```

To pass fields as parameters, use `hx-vals` with a `js:` expression (e.g. `hx-vals='js:{ region: event.detail.name }'`), or handle the event with `hx-on:chart-click`. If `htmx.trigger` is unavailable, the extension dispatches a bubbling `CustomEvent` with the same name and `detail`.

## Themes

The extension passes `data-theme` as the [theme argument](https://echarts.apache.org/en/api.html#echarts.init) to `echarts.init(dom, theme)`. That name must already be registered on `window.echarts` — the core `echarts.min.js` bundle does not register built-in themes like `dark` on its own. Load theme files (same ECharts version) **after** the core bundle and **before** the extension:

```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/theme/dark.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/htmx-echarts@4.0.0-beta5/dist/htmx-echarts.min.js" defer></script>
```

```html
<div data-chart-type="line" data-url="/charts/line-polling poll:1000ms" data-theme="dark"></div>
```

For a custom theme, call `echarts.registerTheme("myTheme", { /* … */ })` before the extension runs, then set `data-theme="myTheme"`. The official [theme gallery](https://echarts.apache.org/en/download-theme.html) and theme builder work the same way.

## Server-side alternative

The demo also shows rendering ECharts to SVG on the server and sending only the markup — no extension needed. That is simpler and lets you email or embed the chart in a PDF, at the cost of interactivity and smooth live updates. The two approaches combine well: stream live charts to the client with the extension, and render a server-side SVG when you need to export one.

## Backend

Any framework that can stream SSE works. The [repository](https://github.com/marcingolenia/htmx-echarts/tree/htmx4) includes runnable SSE endpoint examples for Hono/Bun, Node/Express and code examples in README.md for ASP.NET Core, and Python/Flask. Each streams `chart-update` events whose payload is a full ECharts option applied with `setOption`.
