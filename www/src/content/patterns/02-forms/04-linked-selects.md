---
title: "Linked Selects"
description: Update select options via another select
icon: "icon-[mdi--form-dropdown]"
---
This example shows how to make the options in one `select` depend on the value chosen in another.

The `make` select triggers a `GET` to `/models` whenever its value changes. The response — a fresh set of `<option>` elements — replaces the contents of the `model` select.

```html
<div>
  <label>Make</label>
  <select name="make" hx-get="/models" hx-target="#models" hx-indicator="#models-indicator">
    <option value="audi">Audi</option>
    <option value="toyota">Toyota</option>
    <option value="bmw">BMW</option>
  </select>
</div>
<div>
  <label>Model</label>
  <select id="models" name="model">
    <option value="a1">A1</option>
    ...
  </select>
  <span id="models-indicator" class="htmx-indicator" style="opacity:0; transition: opacity 200ms;">Loading...</span>
</div>
```

The `/models` endpoint returns the matching options:

```html
<option value='325i'>325i</option>
<option value='325ix'>325ix</option>
<option value='X5'>X5</option>
```

<script>
const models = {
  audi:   ["A1", "A4", "A6"],
  toyota: ["Landcruiser", "Tacoma", "Yaris"],
  bmw:    ["325i", "325ix", "X5"],
};

const optionsFor = (make) =>
  (models[make] || []).map((m) => `<option value='${m}'>${m}</option>`).join("\n");

server.get("/demo", () => `
<h3>Pick A Make/Model</h3>
<form>
  <div>
    <label>Make</label>
    <select name="make" hx-get="/models" hx-target="#models" hx-indicator="#models-indicator">
      <option value="audi">Audi</option>
      <option value="toyota">Toyota</option>
      <option value="bmw">BMW</option>
    </select>
  </div>
  <div>
    <label>Model</label>
    <select id="models" name="model">
      <option value="a1">A1</option>
      <option value="a4">A4</option>
      <option value="a6">A6</option>
    </select>
    <span id="models-indicator" class="htmx-indicator" style="opacity:0; transition: opacity 200ms;">Loading...</span>
  </div>
</form>`);

server.get(/models.*/, (req) => optionsFor(req.params["make"]));

server.start("/demo");
</script>

<style>
#demo-content select { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; }
:is(.dark) #demo-content select { background: #1a1a1a; border-color: #404040; color: #e5e5e5; }
#demo-content label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.25rem; color: #374151; }
:is(.dark) #demo-content label { color: #d1d5db; }
#demo-content .htmx-indicator { font-size: 0.75rem; color: #6b7280; }
:is(.dark) #demo-content .htmx-indicator { color: #9ca3af; }
</style>
