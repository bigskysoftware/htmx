---
layout: demo_layout.njk
---
        
## Animations

Htmx is designed to allow you to use [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
to add smooth animations and transitions to your web page using only CSS and HTML.  Below are a few examples of
various animation techniques.

### <a name='basic'></a>[Basic CSS Animations](#basic)

#### Color Throb

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

##### Demo

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

#### Smooth Progress Bar


The [Progress Bar](/examples/progress-bar) demo uses this basic CSS animation technique as well, by updating the `length` 
property of a progress bar element, allowing for a smooth animation.

### <a name='swapping'></a>[Swap Transitions](#swapping)

#### Fade Out On Swap

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

##### Demo

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

### <a name='settling'></a>[Settling Transitions](#settling)

#### Fade In On Settle

Building on the last example, we can fade in the new content by using the `htmx-settling` class during the settle
phase.

```html
<style>
#fade-me-in.htmx-settling {
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

##### Demo

<style>
#fade-me-in.htmx-settling {
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

### <a name='request'></a>[Request In Flight Animation](#request)

You can also take advantage of the `htmx-request` class, which is applied to the element that triggers a request.  Below
is a form that on submit will change its look to indicate that a request is being processed:

```html
<style>
  form.htmx-request {
    opacity: .5;
    transition: opacity 300ms linear;
  }
</style>
<form hx-post="/name">
<label>Name:</label><input name="name"><br/>
<button>Submit</button>
</form>
```

##### Demo

<style>
  form.htmx-request {
    opacity: .5;
    transition: opacity 300ms linear;
  }
</style>

<form hx-post="/name">
<label>Name:</label><input name="name"><br/>
<button>Submit</button>
</form>

<script>
  onPost("/name", function(){ return "Submitted!"; });
</script>

### Using the HTMX `class-tools` Extension

Many interesting animations can be created by using the [`class-tools`](/extensions/class-tools) extension.

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

#### Demo

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

#### Conclusion

You can use the techniques above to create quite a few interesting and pleasing effects with plain old HTML while using htmx.
