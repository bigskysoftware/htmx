---
title: "Linked Selects"
description: Update select options via another select
icon: "icon-[mdi--form-dropdown]"
---

<script>
const makes = {
  audi: [
    { name: "A4", type: "Sedan", price: "$39,900" },
    { name: "Q5", type: "SUV", price: "$45,600" },
    { name: "e-tron GT", type: "Electric", price: "$106,500" },
  ],
  toyota: [
    { name: "Tacoma", type: "Truck", price: "$31,500" },
    { name: "GR Supra", type: "Sport", price: "$56,250" },
    { name: "Land Cruiser", type: "SUV", price: "$58,250" },
  ],
  bmw: [
    { name: "M3", type: "Sedan", price: "$76,000" },
    { name: "X5", type: "SUV", price: "$65,200" },
    { name: "i4", type: "Electric", price: "$52,200" },
  ],
};

const brandName = { audi: "Audi", toyota: "Toyota", bmw: "BMW" };

const selectCls = "w-full py-2.5 px-3 pr-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-800 dark:text-neutral-200 appearance-none cursor-pointer";

function detailCard(make, modelName) {
  const models = makes[make] || makes.audi;
  const m = models.find(x => x.name === modelName) || models[0];
  return `
    <div class="starting:opacity-0 starting:translate-y-1 transition duration-300 ease-out flex items-center justify-between px-4 py-3 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850">
      <div>
        <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">${brandName[make] || "Audi"} ${m.name}</div>
        <span class="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[0.5625rem] font-medium uppercase tracking-wider bg-neutral-200/50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">${m.type}</span>
      </div>
      <div class="text-right">
        <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">${m.price}</div>
        <div class="text-[0.625rem] uppercase tracking-wide text-neutral-450 dark:text-neutral-500 mt-0.5">MSRP</div>
      </div>
    </div>`;
}

function modelSelect(make) {
  const models = makes[make] || makes.audi;
  return `
    <label class="block text-xs font-semibold uppercase tracking-wide text-neutral-450 dark:text-neutral-400 mb-2">Model</label>
    <div class="relative starting:opacity-0 transition duration-300 ease-out">
      <select id="models" name="model" class="${selectCls}"
              hx-get="/detail"
              hx-target="#detail"
              hx-include="[name='make']">
        ${models.map(m => `<option value="${m.name}">${m.name}</option>`).join("\n")}
      </select>
      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none text-[0.625rem]">&#9662;</span>
    </div>`;
}

server.get("/demo", () => `
<div>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-xs font-semibold uppercase tracking-wide text-neutral-450 dark:text-neutral-400 mb-2">Make</label>
      <div class="relative">
        <select name="make" class="${selectCls}"
                hx-get="/models"
                hx-target="#model-panel">
          <option value="audi">Audi</option>
          <option value="toyota">Toyota</option>
          <option value="bmw">BMW</option>
        </select>
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none text-[0.625rem]">&#9662;</span>
      </div>
    </div>
    <div id="model-panel">
      ${modelSelect("audi")}
    </div>
  </div>
  <div id="detail" class="mt-3">
    ${detailCard("audi", "A4")}
  </div>
</div>`);

server.get(/models.*/, (req) => {
  const make = req.params["make"];
  const first = (makes[make] || makes.audi)[0].name;
  return modelSelect(make) +
    `<div id="detail" hx-swap-oob="true" class="mt-3">${detailCard(make, first)}</div>`;
});

server.get(/detail.*/, (req) => detailCard(req.params["make"], req.params["model"]));

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[240px]"></div>

## Basic usage

On the client, set the first select to request new options whenever its value changes.

```html
<select name="make"
        hx-get="/models"
        hx-target="#models"
        hx-indicator="#models-indicator">
  <option value="audi">Audi</option>
  <option value="toyota">Toyota</option>
  <option value="bmw">BMW</option>
</select>

<select id="models" name="model">
  <option value="A4">A4</option>
  ...
</select>
<span id="models-indicator" class="htmx-indicator">Loading...</span>
```

- [`hx-get`](/reference/attributes/hx-get) requests `/models` with the current `make` value as a query parameter.
- [`hx-target`](/reference/attributes/hx-target)=`"#models"` swaps the response into the second select.
- [`hx-indicator`](/reference/attributes/hx-indicator)=`"#models-indicator"` shows a loading message while the request is in flight.
- No [`hx-trigger`](/reference/attributes/hx-trigger) is needed: htmx defaults to `change` for `<select>` elements.

On the server, respond with a new set of `<option>` elements matching the selected make:

```html
<option value="M3">M3</option>
<option value="X5">X5</option>
<option value="i4">i4</option>
```

Because the default [`hx-swap`](/reference/attributes/hx-swap) strategy is [`innerHTML`](/reference/attributes/hx-swap#innerhtml), the options replace the contents of the `#models` select.
