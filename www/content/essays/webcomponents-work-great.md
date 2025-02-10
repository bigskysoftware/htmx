+++
title = "Web Components Work Great with htmx"
description = """\
  This essay by Alexander Petros explores how Web Components can be integrated seamlessly with htmx, a library that \
  enables dynamic web pages through HTML. It discusses the flexibility of htmx in handling interactive elements like \
  Web Components alongside traditional server-driven approaches, such as multi-page apps. By using the example of an \
  editable carnival ride table, Alexander demonstrates how Web Components simplify functionality without the need for \
  heavy JavaScript frameworks, highlighting their compatibility with htmx's DOM-based lifecycle. Alexander also \
  addresses potential challenges and how htmx manages them efficiently."""
date = 2024-11-13
authors = ["Alexander Petros"]
[taxonomies]
tag = ["posts"]
+++

People interested in htmx often ask us about component libraries.
React and other JavaScript frameworks have great ecosystems of pre-built components that can be imported into your project; htmx doesn't really have anything similar.

The first and most important thing to understand is that htmx doesn't preclude you from using *anything*.
Because htmx-based websites are [often multi-page apps](https://unplannedobsolescence.com/blog/less-htmx-is-more/), each page is a blank canvas on which you can import as much or as little JavaScript as you like.
If your app is largely hypermedia, but you want an interactive, React-based calendar for one page, just import it on that one page with a script tag.

We sometimes call this pattern "Islands of Interactivity"—it's referenced in our explainers [here](@/essays/10-tips-for-SSR-HDA-apps.md#tip-8-when-necessary-create-islands-of-interactivity), [here](@/essays/hypermedia-friendly-scripting.md#islands), and [here](@/essays/you-cant.md#myth-5-with-htmx-or-mpas-every-user-action-must-happen-on-the-server).
Unlike JS frameworks, which are largely incompatible with each other, using islands with htmx won't lock you into any specific paradigm.

But there's a second way that you can re-use complex frontend functionality with htmx, and it's [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)!

## Practical Example

Let's say that you have a table that says what carnival rides everyone is signed up for:

<table>
  <tr>
    <th>Name
    <th>Carousel
    <th>Roller Coaster
  </tr>
  <tr>
    <td>Alex
    <td>Yes
    <td>No
  </tr>
  <tr>
    <td>Sophia
    <td>Yes
    <td>Yes
  </tr>
</table>

Alex is willing to go on the carousel but not the roller coaster, because he is scared; Sophia is not scared of either.

I built this as a regular HTML table ([closing tags are omitted](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#technical_summary) for clarity):

```html
<table>
  <tr><th>Name    <th>Carousel  <th>Roller Coaster
  <tr><td>Alex    <td>Yes       <td>No
  <tr><td>Sophia  <td>Yes       <td>Yes
</table>
```

Now imagine we want to make those rows editable.
This is a classic situation in which people reach for frameworks, but can we do it with hypermedia?
Sure!
Here's a naive idea:

```html
<form hx-put=/carnival>
<table>
  <tr>
    <th>Name
    <th>Carousel
    <th>Roller Coaster
  </tr>
  <tr>
    <td>Alex
    <td><select name="alex-carousel"> <option selected>Yes <option>No <option> Maybe</select>
    <td><select name="alex-roller"> <option>Yes <option selected>No <option> Maybe</select>
  </tr>
  <tr>
    <td>Sophia
    <td><select name="sophia-carousel"> <option selected>Yes <option>No <option> Maybe</select>
    <td><select name="sophia-roller"> <option selected>Yes <option>No <option> Maybe</select>
  </tr>
</table>
<button>Save</button>
</form>
```

<br>
That will give us this table:

<table>
  <tr>
    <th>Name
    <th>Carousel
    <th>Roller Coaster
  </tr>
  <tr>
    <td>Alex
    <td><edit-cell name="alex-carousel" value="Yes"></edit-cell>
    <td><edit-cell name="alex-roller" value="No"></edit-cell>
  </tr>
  <tr>
    <td>Sophia
    <td><edit-cell name="sophia-carousel" value="Yes"></edit-cell>
    <td><edit-cell name="sophia-roller" value="Yes"></edit-cell>
  </tr>
</table>
<button>Save</button>

That's not too bad!
The save button will submit all the data in the table, and the server will respond with a new table that reflects the updated state.
We can also use CSS to make the `<select>`s fit our design language.
But it's easy to see how this could start to get unwieldy—with more columns, more rows, and more options in each cell, sending all that information each time starts to get costly.

Let's remove all that redundancy with a web component!

```html
<form hx-put=/carnival>
<table>
  <tr>
    <th>Name
    <th>Carousel
    <th>Roller Coaster
  </tr>
  <tr>
    <td>Alex
    <td><edit-cell name="alex-carousel" value="Yes"></edit-cell>
    <td><edit-cell name="alex-roller" value="No"></edit-cell>
  </tr>
  <tr>
    <td>Sophia
    <td><edit-cell name="sophia-carousel" value="Yes"></edit-cell>
    <td><edit-cell name="sophia-roller" value="Yes"></edit-cell>
  </tr>
</table>
<button>Save</button>
</form>
```

We still have an entirely declarative [HATEOAS](https://htmx.org/essays/hateoas/) interface—both current state (the `value` attribute) and possible actions on that state (the `<form>` and `<edit-cell>` elements) are efficiently encoded in the hypertext—only now we've expressed the same ideas a lot more concisely.
htmx can add or remove rows (or better yet, whole tables) with the `<edit-cell>` web component as if `<edit-cell>` were a built-in HTML element.

You've probably noticed that I didn't include the implementation details for `<edit-cell>` (although you can, [of course](@/essays/right-click-view-source.md), View Source this page to see them).
That's because they don't matter!
Whether the web component was written by you, or a teammate, or a library author, it can be used exactly like a built-in HTML element and htmx will handle it just fine.

## Don't Web Components have some problems?

A lot of the problems that JavaScript frameworks have supporting Web Components don't apply to htmx.

Web Components [have DOM-based lifecycles](https://dev.to/ryansolid/web-components-are-not-the-future-48bh), so they are difficult for JavaScript frameworks, which often manipulate elements outside of the DOM, to work with.
Frameworks have to account for some [bizarre and arguably buggy](https://x.com/Rich_Harris/status/1841467510194843982) APIs that behave differently for native DOM elements than they do for custom ones.
Here at htmx, we agree with [SvelteJS creator Rich Harris](https://x.com/Rich_Harris/status/1839484645194277111): "web components are [not] useful primitives on which to build web frameworks."

The good news is that htmx [is not really a JavaScript web framework](@/essays/is-htmx-another-javascript-framework.md).
The DOM-based lifecycles of custom elements work great in htmx, because everything in htmx has a DOM-based lifecycle—we get stuff from the server, and we add it to the DOM.
The default htmx swap style is to just set [`.innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML), and that works great for the vast majority of users.

That's not to say that htmx doesn't have to accommodate weird Web Component edge cases.
Our community member and resident WC expert [Katrina Scialdone](https://unmodernweb.com/) merged [Shadow DOM support for htmx 2.0](https://github.com/bigskysoftware/htmx/pull/2075), which lets htmx process the implementation details of a Web Component,
and supporting that is [occasionally](https://github.com/bigskysoftware/htmx/pull/2846) [frustrating](https://github.com/bigskysoftware/htmx/pull/2866).
But being able to work with both the [Shadow DOM](@/examples/web-components.md) and the ["Light DOM"](https://meyerweb.com/eric/thoughts/2023/11/01/blinded-by-the-light-dom/) is a nice feature for htmx, and it carries a relatively minimal support burden because htmx just isn't doing all that much.

## Bringing Behavior Back to the HTML

A couple of years ago, W3C Contributor (and Web Component proponent, I think) Lea Verou wrote the following, in a blog post about ["The failed promise of Web Components"](https://lea.verou.me/blog/2020/09/the-failed-promise-of-web-components/):

> the main problem is that HTML is not treated with the appropriate respect in the design of these components. They are not designed as closely as possible to standard HTML elements, but expect JS to be written for them to do anything. HTML is simply treated as a shorthand, or worse, as merely a marker to indicate where the element goes in the DOM, with all parameters passed in via JS.

Lea is identifying an issue that, from the perspective of 2020, would have seemed impossible to solve: the cutting-edge web developers targeted by Web Components were not writing HTML, they were writing JSX, usually with React (or Vue, or what have you).
The idea that [behavior belongs in the HTML](https://unplannedobsolescence.com/blog/behavior-belongs-in-html/) was, in the zeitgeist, considered [a violation of separation of concerns](https://htmx.org/essays/locality-of-behaviour/);
disrespecting HTML was best practice.

The relatively recent success of htmx—itself now a participant in the zeitgeist—offers an alternative path: take HTML seriously again.
If your website is one whose functionality can be primarily described with [large-grain hypermedia transfers](@/essays/when-to-use-hypermedia.md) (we believe most of them can), then the value of being able to express more complex patterns through hypermedia increases dramatically.
As more developers use htmx (and multi-page architectures generally) to structure their websites,
perhaps the demand for Web Components will increase along with it.

Do Web Components "just work" everywhere? Maybe, maybe not. But they do work here.

<script>
class EditCell extends HTMLElement {
  connectedCallback() {
    this.value = this.getAttribute("value")
    this.name = this.getAttribute("name")

    this.innerHTML = `
      <select>
        <option ${this.value === 'Yes' ? 'selected' : ''}>Yes
        <option ${this.value === 'No' ? 'selected' : ''}>No
        <option ${this.value === 'Maybe' ? 'selected' : ''}>Maybe
      </select>
    `
  }
}

customElements.define('edit-cell', EditCell)
</script>
