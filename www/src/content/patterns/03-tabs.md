---
includeMockServer: true
title: "Tabs"
description: Switch between content panels using tabs
category: "Display"
icon: "icon-[mdi--tab]"
---

<script>
var _panels = {
    1: { label: "Overview",  body: "htmx gives you access to AJAX, CSS transitions, WebSockets and server sent events directly in HTML, using attributes." },
    2: { label: "Install",   body: "Add a single script tag to your page. There is no build step, and there are no dependencies." },
    3: { label: "Extensions", body: "Extensions add behavior without growing the core. Load only the ones your page needs." },
};

// Roving tabindex: only the selected tab is in the tab order.
function _tabButton(n, selected, url) {
    let base = "px-3 py-2 text-sm font-medium cursor-pointer border-b-2 -mb-px transition";
    let state = selected
        ? "border-neutral-800 dark:border-neutral-200 text-neutral-800 dark:text-neutral-100"
        : "border-transparent text-neutral-500 dark:text-neutral-400 interact:text-neutral-700 dark:interact:text-neutral-200";
    return `<button id="tab-${n}" class="${base} ${state}" role="tab" aria-controls="panel"
                    aria-selected="${selected}" tabindex="${selected ? 0 : -1}"
                    hx-get="${url}">${_panels[n].label}</button>`;
}

// Arrow keys, Home, and End move between tabs. Required by the ARIA tabs pattern.
const _keyNav = `hx-on:keydown="let tabs = [...this.querySelectorAll('[role=tab]')];
                                let i = tabs.indexOf(document.activeElement);
                                let k = event.key;
                                let n = k == 'ArrowRight' ? i + 1 : k == 'ArrowLeft' ? i - 1
                                      : k == 'Home' ? 0 : k == 'End' ? tabs.length - 1 : -1;
                                if (i < 0 || n < 0) return;
                                event.preventDefault();
                                let next = tabs[(n + tabs.length) % tabs.length];
                                next.focus();
                                next.click();"`;

function _panel(n) {
    return `<div id="panel" role="tabpanel" class="p-4 text-sm text-neutral-600 dark:text-neutral-300 starting:opacity-0 transition-opacity duration-200">
        ${_panels[n].body}
    </div>`;
}

// --- server driven: the response carries the tab state ---
for (let n of [1, 2, 3]) {
    server.get(`/tabs/${n}`, () => `
        <div role="tablist" class="flex gap-1 border-b border-neutral-200 dark:border-neutral-800" ${_keyNav}>
            ${[1, 2, 3].map(i => _tabButton(i, i === n, `/tabs/${i}`)).join("")}
        </div>
        ${_panel(n)}`);
}

server.get("/demo", () => `
    <div id="tabs" class="w-full" hx-get="/tabs/1" hx-trigger="load"
         hx-target:inherited="this" hx-swap:inherited="innerMorph"></div>`);

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex flex-col justify-start min-h-[142px]"></div>

## Server-driven tabs

The server owns which tab is selected. Each response carries the full tab strip and the panel, so the selected tab is part of the returned HTML.

This follows [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS). The application state lives in the hypermedia, not in client-side variables.

On the client, start with an empty container that loads the first tab.

```html
<div id="tabs"
     hx-get="/tabs/1"
     hx-trigger="load"
     hx-target:inherited="this"
     hx-swap:inherited="innerMorph">
</div>
```

- [`hx-trigger`](/reference/attributes/hx-trigger)=[`"load"`](/reference/attributes/hx-trigger#load) fetches the first tab when the element enters the DOM.
- [`hx-target`](/reference/attributes/hx-target)=`"this"` with the `:inherited` modifier makes every tab button inside target the container.
- [`hx-swap`](/reference/attributes/hx-swap)=`"innerMorph"` replaces the strip and the panel together. A morph keeps focus on the tab you activated, so keyboard navigation survives the swap.

On the server, return the tab strip and the panel for the requested tab.

```html
<div role="tablist">
  <button id="tab-1" role="tab" aria-controls="panel" aria-selected="true"  tabindex="0"  hx-get="/tabs/1">Overview</button>
  <button id="tab-2" role="tab" aria-controls="panel" aria-selected="false" tabindex="-1" hx-get="/tabs/2">Install</button>
  <button id="tab-3" role="tab" aria-controls="panel" aria-selected="false" tabindex="-1" hx-get="/tabs/3">Extensions</button>
</div>

<div id="panel" role="tabpanel">
  Overview content...
</div>
```

Only `aria-selected` and `tabindex` change between responses. The `tabindex` values are a [roving tabindex](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex): the tab strip takes one Tab stop, and arrow keys move within it.

Style the selected tab from the attribute, so the markup stays the source of truth:

```css
[role="tab"][aria-selected="true"] {
  border-bottom: 2px solid currentColor;
}
```

## Notes

### Accessibility

The markup follows the [ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): `role="tablist"`, `role="tab"`, `aria-controls`, `aria-selected`, `role="tabpanel"`, and a roving `tabindex`.

The pattern also expects the arrow keys to move between tabs. Put one handler on the tab strip:

```html
<div role="tablist"
     hx-on:keydown="let tabs = [...this.querySelectorAll('[role=tab]')];
                    let i = tabs.indexOf(document.activeElement);
                    let k = event.key;
                    let n = k == 'ArrowRight' ? i + 1 : k == 'ArrowLeft' ? i - 1
                          : k == 'Home' ? 0 : k == 'End' ? tabs.length - 1 : -1;
                    if (i < 0 || n < 0) return;
                    event.preventDefault();
                    let next = tabs[(n + tabs.length) % tabs.length];
                    next.focus();
                    next.click();">
```

The demo above uses it. Left and Right wrap around, and Home and End jump to the ends.
