---
title: "CSS Transitions"
description: "Animate content changes with CSS transitions"
keywords: ["animations", "animate", "fade", "transition", "view transitions"]
---

htmx makes it easy to
use [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) without
javascript. Consider this HTML content:

```html
<div id="div1">Original Content</div>
```

Imagine this content is replaced by htmx via an ajax request with this new content:

```html
<div id="div1" class="red">New Content</div>
```

Note two things:

* The div has the *same* id in the original and in the new content
* The `red` class has been added to the new content

Given this situation, we can write a CSS transition from the old state to the new state:

```css
.red {
    color: red;
    transition: all ease-in 1s;
}
```

When htmx swaps in this new content, it will do so in such a way that the CSS transition will apply to the new content,
giving you a nice, smooth transition to the new state.

So, in summary, all you need to do to use CSS transitions for an element is keep its `id` stable across requests!
