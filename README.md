# CFX HTMX
This repository is a modified version of the [official htmx repo](https://github.com/bigskysoftware/htmx). The modifications made, are specifically for making htmx compatible with the CitizenFX server builds.

**htmx version**: *1.9.10*

## Installation
1. download the [latest release](https://github.com/5m1Ly/cfx-htmx/releases/latest) htmx resource
1. place the resource folder somewhere in your fxserver project
1. add the resource to your server.cfg
1. add the following to your html head tag
    ```html
    <!-- HTMX -->
    <script type="text/javascript" src="https://cfx-nui-htmx/dist/htmx.js"></script>
    ```
1. once this is done you shoud be able to use htmx within your resources

<<<<<<< HEAD
## Contribution
If you want to contribute to the project you'll need to do at least one of two things. The first one being adding two comments above the lines you changed. These two comments would present themselves in the following way;
```js
// cfx-htmx
// the comment on the line above is there to mark a change specifically for the cfx version of htmx
// this comment and the one on the line above is there to explain why the change has been made 
=======
## introduction

htmx allows you to access  [AJAX](https://htmx.org/docs#ajax), [CSS Transitions](https://htmx.org/docs#css_transitions),
[WebSockets](https://htmx.org/extensions/ws/) and [Server Sent Events](https://htmx.org/extensions/sse/)
directly in HTML, using [attributes](https://htmx.org/reference#attributes), so you can build
[modern user interfaces](https://htmx.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~14k min.gz'd](https://cdn.jsdelivr.net/npm/htmx.org/dist/)),
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json) &
[extendable](https://htmx.org/extensions)

## motivation

* Why should only `<a>` and `<form>` be able to make HTTP requests?
* Why should only `click` & `submit` events trigger them?
* Why should only GET & POST be available?
* Why should you only be able to replace the *entire* screen?

By removing these arbitrary constraints htmx completes HTML as a
[hypertext](https://en.wikipedia.org/wiki/Hypertext)

## quick start

```html
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
>>>>>>> ab8fd6992923994049891ca5f22983ae23795b37
```

The second thing is only nessesary when changing an existing line within the code which would then look like the example in the link below.

[src/htmx.js ln. 3387 > ln. 3391](https://github.com/5m1Ly/cfx-htmx/blob/a4672c9dfdc97b063be2c7f088a3fefbe056c81b/src/htmx.js#L3387C1-L3391C82)

<<<<<<< HEAD
## More information
for more information about htmx you can go to their [repo](https://github.com/bigskysoftware/htmx) or [website](https://htmx.org/)
=======
htmx is the successor to [intercooler.js](http://intercoolerjs.org)

### installing as a node package

To install using npm:

```
npm install htmx.org --save
```

Note there is an old broken package called `htmx`.  This is `htmx.org`.

## website & docs

* <https://htmx.org>
* <https://htmx.org/docs>

## contributing
Want to contribute? Check out our [contribution guidelines](CONTRIBUTING.md)

No time? Then [become a sponsor](https://github.com/sponsors/bigskysoftware#sponsors)

### hacking guide

To develop htmx locally, you will need to install the development dependencies.

Run:

```
npm install
```

Then, run a web server in the root.

This is easiest with:

```
npx serve
```

You can then run the test suite by navigating to:

<http://0.0.0.0:3000/test/>

At this point you can modify `/src/htmx.js` to add features, and then add tests in the appropriate area under `/test`.

* `/test/index.html` - the root test page from which all other tests are included
* `/test/attributes` - attribute specific tests
* `/test/core` - core functionality tests
* `/test/core/regressions.js` - regression tests
* `/test/ext` - extension tests
* `/test/manual` - manual tests that cannot be automated

htmx uses the [mocha](https://mochajs.org/) testing framework, the [chai](https://www.chaijs.com/) assertion framework
and [sinon](https://sinonjs.org/releases/v9/fake-xhr-and-server/) to mock out AJAX requests.  They are all OK.

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*
>>>>>>> ab8fd6992923994049891ca5f22983ae23795b37
