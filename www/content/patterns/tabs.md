+++
title = "Tabs"
template = "demo.html"
+++
Switch between content panels. Two approaches: server controls tab state, or JavaScript does.

## Server-Driven (HATEOAS)

The server controls which tab is selected. This follows [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) (Hypertext As The Engine Of Application State) - the server returns complete UI state with each response.

```html
<!-- Initial container -->
<div id="tabs" hx-get="/tab1" hx-trigger="load"></div>
```

```html
<!-- Server returns this for each tab click -->
<div role="tablist">
  <button hx-get="/tab1" role="tab" aria-selected="true">Tab 1</button>
  <button hx-get="/tab2" role="tab" aria-selected="false">Tab 2</button>
  <button hx-get="/tab3" role="tab" aria-selected="false">Tab 3</button>
</div>

<div role="tabpanel">
  Tab content here...
</div>
```

[//]: # ({{ demo_environment&#40;&#41; }})

[//]: # (<div id="tabs" hx-target:inherited="this" hx-swap:inherited="innerHTML">)

[//]: # (	<div role="tablist" class="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">)

[//]: # (		<button hx-get="/tab1" role="tab" aria-selected="true")

[//]: # (		        class="px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none">)

[//]: # (			Tab 1)

[//]: # (		</button>)

[//]: # (		<button hx-get="/tab2" role="tab" aria-selected="false")

[//]: # (		        class="px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none">)

[//]: # (			Tab 2)

[//]: # (		</button>)

[//]: # (		<button hx-get="/tab3" role="tab" aria-selected="false")

[//]: # (		        class="px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none">)

[//]: # (			Tab 3)

[//]: # (		</button>)

[//]: # (	</div>)

[//]: # (	<div role="tabpanel" class="p-4 mb-12">)

[//]: # (		This is the content for Tab 1.)

[//]: # (	</div>)

[//]: # (</div>)

[//]: # ()
[//]: # (<script>)

[//]: # (	const tabClasses = "px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none";)

[//]: # ()
[//]: # (	onGet&#40;"/tab1", function&#40;&#41; {)

[//]: # (		return `)

[//]: # (		<div role="tablist" class="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">)

[//]: # (			<button hx-get="/tab1" role="tab" aria-selected="true" class="${tabClasses}">Tab 1</button>)

[//]: # (			<button hx-get="/tab2" role="tab" aria-selected="false" class="${tabClasses}">Tab 2</button>)

[//]: # (			<button hx-get="/tab3" role="tab" aria-selected="false" class="${tabClasses}">Tab 3</button>)

[//]: # (		</div>)

[//]: # (		<div role="tabpanel" class="p-4 mb-12">)

[//]: # (			This is the content for Tab 1.)

[//]: # (		</div>`)

[//]: # (	}&#41;)

[//]: # ()
[//]: # (	onGet&#40;"/tab2", function&#40;&#41; {)

[//]: # (		return `)

[//]: # (		<div role="tablist" class="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">)

[//]: # (			<button hx-get="/tab1" role="tab" aria-selected="false" class="${tabClasses}">Tab 1</button>)

[//]: # (			<button hx-get="/tab2" role="tab" aria-selected="true" class="${tabClasses}">Tab 2</button>)

[//]: # (			<button hx-get="/tab3" role="tab" aria-selected="false" class="${tabClasses}">Tab 3</button>)

[//]: # (		</div>)

[//]: # (		<div role="tabpanel" class="p-4 mb-12">)

[//]: # (			This is the content for Tab 2.)

[//]: # (		</div>`)

[//]: # (	}&#41;)

[//]: # ()
[//]: # (	onGet&#40;"/tab3", function&#40;&#41; {)

[//]: # (		return `)

[//]: # (		<div role="tablist" class="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">)

[//]: # (			<button hx-get="/tab1" role="tab" aria-selected="false" class="${tabClasses}">Tab 1</button>)

[//]: # (			<button hx-get="/tab2" role="tab" aria-selected="false" class="${tabClasses}">Tab 2</button>)

[//]: # (			<button hx-get="/tab3" role="tab" aria-selected="true" class="${tabClasses}">Tab 3</button>)

[//]: # (		</div>)

[//]: # (		<div role="tabpanel" class="p-4 mb-12">)

[//]: # (			This is the content for Tab 3.)

[//]: # (		</div>`)

[//]: # (	}&#41;)

[//]: # (</script>)

## Client-Side

JavaScript handles tab selection. Server returns content only. Uses `aria-selected` attribute to control styling.

```html
<div role="tablist" 
     hx-target:inherited="#tab-contents"
     hx-on:htmx-after-on-load="
       document.querySelector('[aria-selected=true]').setAttribute('aria-selected', 'false');
       event.target.setAttribute('aria-selected', 'true');
     ">
  <button role="tab" hx-get="/tab1" aria-selected="true">Tab 1</button>
  <button role="tab" hx-get="/tab2" aria-selected="false">Tab 2</button>
  <button role="tab" hx-get="/tab3" aria-selected="false">Tab 3</button>
</div>

<div id="tab-contents" role="tabpanel" hx-get="/tab1" hx-trigger="load"></div>
```

Server returns just the content:

```html
<p>Your tab content...</p>
```

[//]: # (<div role="tablist" class="flex gap-1 border-b border-neutral-200 dark:border-neutral-700")

[//]: # (     hx-target:inherited="#tab-contents-js")

[//]: # (     hx-on:htmx-after-on-load=")

[//]: # (       document.querySelector&#40;'#tabs-js [aria-selected=true]'&#41;.setAttribute&#40;'aria-selected', 'false'&#41;;)

[//]: # (       event.target.setAttribute&#40;'aria-selected', 'true'&#41;;)

[//]: # (     " id="tabs-js">)

[//]: # (	<button role="tab" hx-get="/tab1-js" aria-selected="true")

[//]: # (	        class="px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none">)

[//]: # (		Tab 1)

[//]: # (	</button>)

[//]: # (	<button role="tab" hx-get="/tab2-js" aria-selected="false")

[//]: # (	        class="px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none">)

[//]: # (		Tab 2)

[//]: # (	</button>)

[//]: # (	<button role="tab" hx-get="/tab3-js" aria-selected="false")

[//]: # (	        class="px-4 py-2 border-b-2 border-transparent aria-selected:border-blue-600 aria-selected:text-blue-600 dark:aria-selected:border-blue-400 dark:aria-selected:text-blue-400 hover:text-blue-600 dark:hover:text-blue-400 select-none">)

[//]: # (		Tab 3)

[//]: # (	</button>)

[//]: # (</div>)

[//]: # ()
[//]: # (<div id="tab-contents-js" role="tabpanel" class="p-4 mb-12" hx-get="/tab1-js" hx-trigger="load"></div>)

[//]: # ()
[//]: # (<script>)

[//]: # (	onGet&#40;"/tab1-js", function&#40;&#41; {)

[//]: # (		return `<p>This is the content for Tab 1.</p>`)

[//]: # (	}&#41;;)

[//]: # (	onGet&#40;"/tab2-js", function&#40;&#41; {)

[//]: # (		return `<p>This is the content for Tab 2.</p>`)

[//]: # (	}&#41;;)

[//]: # (	onGet&#40;"/tab3-js", function&#40;&#41; {)

[//]: # (		return `<p>This is the content for Tab 3.</p>`)

[//]: # (	}&#41;;)

[//]: # (</script>)
