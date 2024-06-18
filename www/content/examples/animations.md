+++
title = "Animations"
template = "demo.html"
+++

htmx is designed to allow you to use [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
to add smooth animations and transitions to your web page using only CSS and HTML.  Below are a few examples of
various animation techniques.

htmx also allows you to use the new [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
for creating animations.

### Basic CSS Animations {#basic}

### Color Throb

The simplest animation technique in htmx is to keep the `id` of an element stable across a content swap.  If the
`id` of an element is kept stable, htmx will swap it in such a way that CSS transitions can be written between
the old version of the element and the new one.

Consider this div:

```html
<style>
.smooth {
  transition: all 1s ease-in;
}
</style>
<div id="color-demo" class="smooth" style="color:red"
      hx-get="/colors" hx-swap="outerHTML" hx-trigger="every 1s">
  Color Swap Demo
</div>

```

This div will poll every second and will get replaced with new content which changes the `color` style to a new value
(e.g. `blue`):

```html
<div id="color-demo" class="smooth" style="color:blue"
      hx-get="/colors" hx-swap="outerHTML" hx-trigger="every 1s">
  Color Swap Demo
</div>
```

Because the div has a stable id, `color-demo`, htmx will structure the swap such that a CSS transition, defined on the
`.smooth` class, applies to the style update from `red` to `blue`, and smoothly transitions between them.

#### Demo {#throb-demo}

<style>
.smooth {
  transition: all 1s ease-in;
}
</style>
<div id="color-demo" class="smooth" style="color:red"
      hx-get="/colors" hx-swap="outerHTML" hx-trigger="every 1s">
  Color Swap Demo
</div>

<script>
    var colors = ['blue', 'green', 'orange', 'red'];
    onGet("/colors", function () {
      var color = colors.shift();
      colors.push(color);
      return '<div id="color-demo" hx-get="/colors" hx-swap="outerHTML" class="smooth" hx-trigger="every 1s" style="color:' + color + '">\n'+
             '  Color Swap Demo\n'+
             '</div>\n'
    });
</script>

### Smooth Progress Bar

The [Progress Bar](@/examples/progress-bar.md) demo uses this basic CSS animation technique as well, by updating the `length`
property of a progress bar element, allowing for a smooth animation.

## Swap Transitions {#swapping}

### Fade Out On Swap

If you want to fade out an element that is going to be removed when the request ends, you want to take advantage
of the `htmx-swapping` class with some CSS and extend the swap phase to be long enough for your animation to
complete.  This can be done like so:

```html
<style>
.fade-me-out.htmx-swapping {
  opacity: 0;
  transition: opacity 1s ease-out;
}
</style>
<button class="fade-me-out"
        hx-delete="/fade_out_demo"
        hx-swap="outerHTML swap:1s">
        Fade Me Out
</button>
```

#### Demo {#fade-swap-demo}

<style>
.fade-me-out.htmx-swapping {
  opacity: 0;
  transition: opacity 1s ease-out;
}
</style>

<button class="fade-me-out"
        hx-delete="/fade_out_demo"
        hx-swap="outerHTML swap:1s">
        Delete Me
</button>

<script>
    onDelete("/fade_out_demo", function () {return ""});
</script>

## Settling Transitions {#settling}

### Fade In On Addition

Building on the last example, we can fade in the new content by using the `htmx-added` class during the settle
phase.  You can also write CSS transitions against the target, rather than the new content, by using the `htmx-settling`
class.

```html
<style>
#fade-me-in.htmx-added {
  opacity: 0;
}
#fade-me-in {
  opacity: 1;
  transition: opacity 1s ease-out;
}
</style>
<button id="fade-me-in"
        hx-post="/fade_in_demo"
        hx-swap="outerHTML settle:1s">
        Fade Me In
</button>
```

#### Demo {#fade-settle-demo}

<style>
#fade-me-in.htmx-added {
  opacity: 0;
}
#fade-me-in {
  opacity: 1;
  transition: opacity 1s ease-out;
}
</style>

<button id="fade-me-in"
        hx-post="/fade_me_in"
        hx-swap="outerHTML settle:1s">
        Fade Me In
</button>

<script>
    onPost("/fade_me_in", function () {return "<button id=\"fade-me-in\"\n"+
                                               "        hx-post=\"/fade_me_in\"\n"+
                                               "        hx-swap=\"outerHTML settle:1s\">\n"+
                                               "        Fade Me In\n"+
                                               "</button>"});
</script>

## Request In Flight Animation {#request}

You can also take advantage of the `htmx-request` class, which is applied to the element that triggers a request.  Below
is a form that on submit will change its look to indicate that a request is being processed:

```html
<style>
  form.htmx-request {
    opacity: .5;
    transition: opacity 300ms linear;
  }
</style>
<form hx-post="/name" hx-swap="outerHTML">
<label>Name:</label><input name="name"><br/>
<button>Submit</button>
</form>
```

#### Demo {#request-demo}

<style>
  form.htmx-request {
    opacity: .5;
    transition: opacity 300ms linear;
  }
</style>

<div aria-live="polite">
<form hx-post="/name" hx-swap="outerHTML">
<label>Name:</label><input name="name"><br/>
<button>Submit</button>
</form>
</div>

<script>
  onPost("/name", function(){ return "Submitted!"; });
</script>

## Using the htmx `class-tools` Extension

Many interesting animations can be created by using the [`class-tools`](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/class-tools/README.md) extension.

Here is an example that toggles the opacity of a div.  Note that we set the toggle time to be a bit longer than
the transition time.  This avoids flickering that can happen if the transition is interrupted by a class change.

```html
<style>
.demo.faded {
  opacity:.3;
}
.demo {
  opacity:1;
  transition: opacity ease-in 900ms;
}
</style>
<div class="demo" classes="toggle faded:1s">Toggle Demo</div>
```

#### Demo {#class-tools-demo}

<style>
.demo.faded {
  opacity:.3;
}
.demo {
  opacity:1;
  transition: opacity ease-in 900ms;
}
</style>
<div class="demo" classes="toggle faded:1s">Toggle Demo</div>

### Using the View Transition API {#view-transitions}

htmx provides access to the new  [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
via the `transition` option of the [`hx-swap`](/attributes/hx-swap) attribute.

Below is an example of a swap that uses a view transition.  The transition is tied to the outer div via a
`view-transition-name` property in CSS, and that transition is defined in terms of `::view-transition-old`
and `::view-transition-new`, using `@keyframes` to define the animation.  (Fuller details on the View Transition
API can be found on the [Chrome Developer Page](https://developer.chrome.com/docs/web-platform/view-transitions/) on them.)

The old content of this transition should slide out to the left and the new content should slide in from the right.

Note that, as of this writing, the visual transition will only occur on Chrome 111+, but more browsers are expected to
implement this feature in the near future.

```html
<style>
   @keyframes fade-in {
     from { opacity: 0; }
   }

   @keyframes fade-out {
     to { opacity: 0; }
   }

   @keyframes slide-from-right {
     from { transform: translateX(90px); }
   }

   @keyframes slide-to-left {
     to { transform: translateX(-90px); }
   }

   .slide-it {
     view-transition-name: slide-it;
   }

   ::view-transition-old(slide-it) {
     animation: 180ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
     600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
   }
   ::view-transition-new(slide-it) {
     animation: 420ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
     600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
   }
</style>


<div class="slide-it">
   <h1>Initial Content</h1>
   <button hx-get="/new-content" hx-swap="innerHTML transition:true" hx-target="closest div">
     Swap It!
   </button>
</div>
```

#### Demo

<style>
   @keyframes fade-in {
     from { opacity: 0; }
   }

   @keyframes fade-out {
     to { opacity: 0; }
   }

   @keyframes slide-from-right {
     from { transform: translateX(90px); }
   }

   @keyframes slide-to-left {
     to { transform: translateX(-90px); }
   }

   .slide-it {
     view-transition-name: slide-it;
   }

   ::view-transition-old(slide-it) {
     animation: 180ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
     600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
   }
   ::view-transition-new(slide-it) {
     animation: 420ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
     600ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
   }
</style>

<div class="slide-it">
   <h1>Initial Content</h1>
   <button hx-get="/new-content" hx-swap="innerHTML transition:true" hx-target="closest div">
     Swap It!
   </button>
</div>

<script>
    var originalContent = htmx.find(".slide-it").innerHTML;

    this.server.respondWith("GET", "/new-content", function(xhr){
        xhr.respond(200,  {}, "<h1>New Content</h1> <button hx-get='/original-content' hx-swap='innerHTML transition:true' hx-target='closest div'>Restore It! </button>")
    });

    this.server.respondWith("GET", "/original-content", function(xhr){
        xhr.respond(200,  {}, originalContent)
    });
</script>

## Conclusion

You can use the techniques above to create quite a few interesting and pleasing effects with plain old HTML while using htmx.
