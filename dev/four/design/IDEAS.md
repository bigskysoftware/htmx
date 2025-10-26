**Important:**
I think we should design the codebase to enable doing stuff both from the client, and from the server (e.g. like `server-commands`), with the same consistent syntax. That would provide a good DX.

First off, I hope my ideas don't diverge too far from what you were imagining.

## Using no prefixes (crazy idea)

htmx uses the `hx-` prefix for its attributes, right?  
Your examples showed `tx-` / `fx-` / `gx-`, but… what if we just dropped prefixes entirely?

We take fixi, tweak it a bit, and make it feel like HTML *should've* been.
1. Add full SSE support (like `server-commands` but better)
2. Add extended CSS selectors
3. Add opt-in inheritance (see footnote)
4. Remove the `fx-` prefix (let me cook 👉👈)

> (I was researching developers' sentiment on automatic inheritance through GitHub issues and found one of my own old GitHub comments complaining about it lol. I also watched a friend lose hours because a random `hx-select` up the DOM ate all his swaps. Opt-in makes sense. 

However, I have another idea:

What if there were 3 parts: 
- [framework] Core (only includes the 5 attributes + SSE support - ultra lightweight)
- [framework] Standard (includes Core + CSS selectors + Inheritance + maybe opinionated DX stuff)
- [framework] Standard + [framework] Signals (+ reactivity)

For convenience, we can provide CDNs for:
- Core
- Standard (only)
- Signals (only)
- Standard + Signals (together) 

The core would then be **prefix-free hypermedia controls**. I might be overreaching, but I was wondering how this could look.

I was thinking we could use the [`is` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/is) to declare an element as a hypermedia controller that can checks all of the 4 primitives via the 5 core attributes: `action`, `method`, `trigger`, `target` and `swap`.

Example:
```html
<button is="hypermedia-controller"
        method="get"
        trigger="click"
        target="#output"
        swap="innerHTML">
    Get Content
</button>
```

Maybe `hypermedia-controller` is too long, we could also use `controller`. Or `hyperbased`. Or we could make elements tag-fluid so they can identify as `<button is="form">` (jk jk).

Unfortunately though, as always, WebKit is a POS and [does not (+ will not) support custom elements](https://bugs.webkit.org/show_bug.cgi?id=182671) (`is` attribute).

But what if we just used a flag attribute for it?
```html
<button controller
        method="get"
        trigger="click"
        target="#output"
        swap="innerHTML">
    Get Content
</button>
```

I don't know how you feel about this.

I was wondering how this could look in JSON format
```html
<button 
	hypermedia-controls='{action: "/url", method: "GET", trigger: "click", swap: "innerHTML"}'>
    Get Content
</button>
```

But wtf... JSON is never the answer.

You know I mentioned it would be nice to have a unified/consistent syntax between client/server.

If we used this hypothetical simplified syntax (without the prefix), the server-side part could look something like:
```html
<!-- For swaps -->
<partial
	swap="innerHTML" 
	target="#element-on-page"
>
...
</partial>

<!-- For redirects, and with the [Framework] Signals also for patching signals -->
<meta redirect=... />
```

I know there's already:
```html
<meta http-equiv="refresh" content="0; url=https://www.domain.com/">
```
But sorry man I'm too young for that.

At least in theory, it sounds like a clean solution to me, but maybe in practice it's a disaster...

I understand it reduces the instant visibility of "here's [framework] behaviour" like with `hx-`, but like I said, I was thinking what if these were not supposed to be [framework] behaviour, but built-in hypermedia controls?

To be honest, I'm even willing to create syntax highlighting extensions for JetBrains + VSCode + vim just to make this work.

My presumption was that the prefix-less "native" attributes choice goes along well with the whole generalized hypermedia controls idea (cool article btw, although by the time I got to section 4.1 ### 4.1 A Formal Definition Of Hypermedia Controls i realized grug brain dev is actually big brain in disguise).

I might be abysmally wrong though.

### Using `_` as a prefix
As an alternative perspective, I was thinking about making this framework to be something like a htmx+hyperscript+alpine.js baby, and use `_` for namespacing the behaviour:
e.g.
```html
<button
    _action="/foo"
    _method="post"
    _target="#element"
    _swap="innerHTML"
    >
    ...
</button>
```

But I asked a very close friend of mine what he honestly thinks about it and he said if he saw underscores all over the page it might be visually tiring 😢, which is understandable (in `_hyperscript` there's just one `_` attribute)

### Using `x-` as a prefix
If anything, I honestly like Alpine's `x-` prefix. It's chill. For some reason it doesn't bother me that much. Would it be retarded if we just stole that? Could it start a war among devs?

### Why I'm seeking alternatives
For some reason it feels weird / messy for me to see `tx-`/`gx-`/`fx-`. 

However, by that logic, `hx-` should feel the same. 

I probably don't mind it because I got so used to seeing it for years, it feels "native" in my head.

Anyway, these are just some ideas. Maybe you don't really care about these things so much. I score 95th percentile in orderliness in the Big Five Aspects personality test, which means I can be excessively obsessed with such details & design choices. I hope you will forgive me for this, and that it will be a plus and not a minus for the project. Hope I won't be a difficult person to reason with.

# Reactivity: ~~Alpine.JS vs \_hyperscript~~ Alpine.JS + \_hyperscript

In my head, I see 2 options.

**Option 1:** go the \_hyperscript way 
-> use an attribute like `_` or `gx-live` to handle many different features/behaviours using an essentially custom language. 
I dig that, and found the concept to be very strong and flexible within my extensive usage of \_hyperscript.

**Option 2:** go the Alpine.JS way (separate set of attributes e.g. `bind:`, `on:`)
BUT **fix the 1 thing that (i believe!) Alpine.JS did wrong** (and which \_hyperscript excelled) at.

I used Alpine.JS for a project. I had used \_hyperscript prior to that. I wanted to (and did) go back to \_hyperscript. 

Why? Simple things were simpler in \_hyperscript.

Simple things felt unnecessarily complex in Alpine.JS. It felt like overengineering.

Here's what I mean. Lets compare:

**Alpine.JS**:
```html
<div x-data="{ open: false }">
	<button @click="open = ! open">...</button>
	<div x-show="open">
	Content...
	</div>
</div>
```

**\_hyperscript:**
```html
<div>
	<button _="on click toggle .hidden on next <div/>">...</button>
	<div class="hidden">Content...</div>
</div>
```

I have to do a lot of mental gymnastics to understand what's going on in Alpine.JS.

The \_hyperscript variant was instantly obvious.

Why did I need to create an intermediate `open` variable? Just so I can feel more big brain?

To scrutinize myself, I understand the Alpine.JS setup might handle more complex scenarios where multiple elements depend on that `open` state more gracefully than \_hyperscript's way. In fact I did hit some scenarios where \_hyperscript felt lacking exactly because I couldn't do that.

So, wtf, lets just let developers do both.

I'm thinking, instead of having a special `_`-like attribute that lets you do anything inside, we could add just **2 new dynamic attributes** + **1 existing dynamic attribute** to do everything.
1. `bind:<attribute>` (new)
2. `on:<event>` (new)
3. `data-*` (built-in)

## `on:<event>`
I found `hx-on:` to be a HUGE improvement in the DX provided by htmx.

It was so powerful, in fact, that I replaced \_hyperscript (in some simpler projects) entirely with it, as I could not justify the extra KBs when `hx-on:` could do most of the things that I needed.

For example, I was so happy to be able to do something like this when the `<dialog>` tag came out:
```html
<dialog 
    hx-on::load="this.open()"
	hx-on:close="this.delete()">
	<form method="dialog" hx-on:click="this.submit()"></form> 
	<!-- Submit triggers 'close' on parent <dialog>, which then deletes the <dialog> -->
</dialog>
```

I would often add \_hyperscript back in just when the code inside `hx-on:` got too messy (repeated & long javascript functions, `htmx.find()`s, etc.).

But honestly, I think those issues could be easily fixed with an improved `hx-on:` that lets you:
- `set` some temporary local variables so you don't have to repeat yourself
- use extended CSS literals freely (rather than `htmx.find()`)
- have some DX goodies like `wait`, `add`, `remove`, `toggle`, `go`, etc.

Take the example we had in the Alpine vs \_hyperscript section. We could just do:
```html
<div>
	<button on:click="toggle .hidden on next <div/>"></button>
	<div class="hidden">Content...</div>
</div>
```

This solves most scenarios of SIMPLE stuff (which \_hyperscript thankfully made simple).

And, for more complex scenarios...

## `bind:<attribute>=<reactive expression>`

Each `bind:<attribute>` automatically sets the corresponding `<attribute>` to the computed value reactively.

Example:
```html
<form
    id="number-1"
    bind:action="/numbers/{this.id.replace('number-', '')}"
    action="/numbers/1" <!-- automatically set -->
>
```

For `class:` we could provide some special handling, for DX:
```html
<div 
	bind:class="<array / object of classes / " "-separated string>"
	bind:class="{ 'hidden': not previous <input/>.checked, ... }"
	bind:class:hidden="not previous <input/>.checked"
>
```

**Note:**
Alpine abstracts `textContent` as `:text`, and `innerHTML` as `:html`. 

We could do that as well, or we could go with the longer version `:text-content` and `:inner-html`. Making `bind:outer-html` doesn't really make sense. Or does it?

Cool possible syntax:
```html
<div
	bind:class.hidden="previous #checkbox is checked"
>
```

Or shorter version:
```html
<div bind:.hidden="...">
```

Or even shorter:
```html
<div :.hidden="...">
```

# State: `data-` attributes

I think using `data-` attributes is a good idea.

Datastar uses it for everything. I think we should use it **just for data**.

For anything else, it just adds unnecessary clutter (at least that's what my heart says). I think it's one of the reasons I find datastar's syntax kinda eh.

For instance, we can use `data-<variable>` for simple scenarios (true/false, strings) but also enable other types:

```html
<div data-open>...</div> <!-- False/True values -->
<div data-numbers='[1, 2, 3]'></div> <!-- Arrays -->
<div data-state='{ open: false, numbers: [1, 2, 3]}'></div> <!-- Objects -->
```

`data-state` could be a convention we can propose, but there's nothing special about it. We can let the developers choose what they believe is the best name.

## `(bonus) on:[before|after]-bind.<attribute>`

Maybe we could even let developers hook into the reactive engine (if we can think of scenarios where that would be useful):

```html
<input type="text" />
<div
	bind:title="{previous <input/>.value}"
	on:before-bind.title="console.log('updating my title')"
	on:after-bind.title="console.log('updated my title')"
>
```

Another thing that would potentially make the `on:` attribute way more powerful would be the possibility to listen to events on other elements, like `on <event> from <CSS selector>` which \_hyperscript. I haven't thought of a good syntax to handle that as well yet.

# Other attributes
What else does Alpine.JS have that we could live without (because the web already makes it possible natively)?

`x-show` - should/can be done just by adding/removing/toggling a CSS class like `.hidden` - we don't need it

`x-transition` - TailwindCSS's `transition` class makes it super easy to add transition, even for when an element first appears in the DOM (`transition starting:opacity-0 opacity-100`) and lately also for when it leaves - (as far as i understand it) we don't need it

`x-model` - It binds the value of an input element to Alpine data.

Example:
```html
<div x-data="{ message: '' }">
	<input type="text" x-model="message">
	<span x-text="message"></span>
</div>
```

I believe this could be more intuitive to do, eg.:
```html
<div>
	<input type="text">
	<span bind:text-content="previous <input/>.value"></span>
</div>
```

For more complex scenarios, we could support `<template>` tags:
```html
<div
	data-number="0"
	on:click="increment @data-number">
	 <template>
		 My number is {@data-number}
	 </template>
 </div>
```
Or maybe we can make it possible to access it without `data-`, just `@number` or just `number`.


# Signals: Explicit vs Implicit

After doing some research with Perplexity to understand what a signal really is, I understood that e.g. in a scenario like this:
```html
<div>
	<input type="text">
	<span bind:text-content="previous <input/>.value"></span>
</div>
```
The signal would not be `textContent`, but `<input/>.value` (because when it changes, the `textContent` should change, so that's what does the "signaling").

Alpine.JS takes the "explicit" approach where everything you declare in `x-data` (which you have to), is automatically a signal. It does not allow "implicit" signals which you don't have to declare, like what would be awesome in the example above.

We need to find a way to implement that.

However, it would be useful to also provide a way to hook into the reactive system, maybe without another attribute (like on vs. when in hyperscript).
