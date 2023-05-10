+++
title = "Lazy Loading"
template = "demo.html"
+++

This example shows how to lazily load an element on a page.  We start with an initial
state that looks like this:

```html
<div hx-get="/graph" hx-trigger="load">
  <img  alt="Result loading..." class="htmx-indicator" width="150" src="/img/bars.svg"/>
</div>
```

Which shows a progress indicator as we are loading the graph.  The graph is then
loaded and faded gently into view via a settling CSS transition:

```css
.htmx-settling img {
  opacity: 0;
}
img {
 transition: opacity 300ms ease-in;
}
```

<style>
.htmx-settling img {
  opacity: 0;
}
img {
 transition: opacity 300ms ease-in;
}
</style>

{{ demoenv() }}

<script>
    server.autoRespondAfter = 2000; // longer response for more drama

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params){
      return lazyTemplate();
    });

    onGet("/graph", function(request, params){
      return "<img alt='Tokyo Climate' src='/img/tokyo.png'>";
    });

    // templates
    function lazyTemplate(page) {
      return `<div hx-get="/graph" hx-trigger="load">
  <img  alt="Result loading..." class="htmx-indicator" width="150" src="/img/bars.svg"/>
</div>`;
    }
</script>
