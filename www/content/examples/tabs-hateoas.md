+++
title = "Tabs (Using HATEOAS)"
template = "demo.html"
+++

This example shows how easy it is to implement tabs using htmx.  Following the principle of [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS), the selected tab is a part of the application state.  Therefore, to display and select tabs in your application, simply include the tab markup in the returned HTML.  If this does not suit your application server design, you can also use a little bit of [JavaScript to select tabs instead](@/examples/tabs-javascript.md).

## Example Code (Main Page)
The main page simply includes the following HTML to load the initial tab into the DOM.
```html
<div id="tabs" hx-get="/tab1" hx-trigger="load delay:100ms" hx-target="#tabs" hx-swap="innerHTML"></div>
```

## Example Code (Each Tab)
Subsequent tab pages display all tabs and highlight the selected one accordingly.

```html
<div class="tab-list" role="tablist">
	<button hx-get="/tab1" class="selected" role="tab" aria-selected="true" aria-controls="tab-content">Tab 1</button>
	<button hx-get="/tab2" role="tab" aria-selected="false" aria-controls="tab-content">Tab 2</button>
	<button hx-get="/tab3" role="tab" aria-selected="false" aria-controls="tab-content">Tab 3</button>
</div>

<div id="tab-content" role="tabpanel" class="tab-content">
	Commodo normcore truffaut VHS duis gluten-free keffiyeh iPhone taxidermy godard ramps anim pour-over.
	Pitchfork vegan mollit umami quinoa aute aliquip kinfolk eiusmod live-edge cardigan ipsum locavore.
	Polaroid duis occaecat narwhal small batch food truck.
	PBR&B venmo shaman small batch you probably haven't heard of them hot chicken readymade.
	Enim tousled cliche woke, typewriter single-origin coffee hella culpa.
	Art party readymade 90's, asymmetrical hell of fingerstache ipsum.
</div>
```

{{ demoenv() }}

<div id="tabs" hx-target="this" hx-swap="innerHTML">
		<div class="tab-list" role="tablist">
			<button hx-get="/tab1" class="selected" role="tab" aria-selected="true" aria-controls="tab-content">Tab 1</button>
			<button hx-get="/tab2" role="tab" aria-selected="false" aria-controls="tab-content">Tab 2</button>
			<button hx-get="/tab3" role="tab" aria-selected="false" aria-controls="tab-content">Tab 3</button>
		</div>
		<div id="tab-content" role="tabpanel" class="tab-content">
			Commodo normcore truffaut VHS duis gluten-free keffiyeh iPhone taxidermy godard ramps anim pour-over.
			Pitchfork vegan mollit umami quinoa aute aliquip kinfolk eiusmod live-edge cardigan ipsum locavore.
			Polaroid duis occaecat narwhal small batch food truck.
			PBR&B venmo shaman small batch you probably haven't heard of them hot chicken readymade.
			Enim tousled cliche woke, typewriter single-origin coffee hella culpa.
			Art party readymade 90's, asymmetrical hell of fingerstache ipsum.
		</div>
</div>


<script>
	onGet("/tab1", function() {
		return `
		<div class="tab-list" role="tablist">
			<button hx-get="/tab1" class="selected" aria-selected="true" autofocus role="tab" aria-controls="tab-content">Tab 1</button>
			<button hx-get="/tab2" role="tab" aria-selected="false" aria-controls="tab-content">Tab 2</button>
			<button hx-get="/tab3" role="tab" aria-selected="false" aria-controls="tab-content">Tab 3</button>
		</div>

		<div id="tab-content" role="tabpanel" class="tab-content">
			Commodo normcore truffaut VHS duis gluten-free keffiyeh iPhone taxidermy godard ramps anim pour-over.
			Pitchfork vegan mollit umami quinoa aute aliquip kinfolk eiusmod live-edge cardigan ipsum locavore.
			Polaroid duis occaecat narwhal small batch food truck.
			PBR&B venmo shaman small batch you probably haven't heard of them hot chicken readymade.
			Enim tousled cliche woke, typewriter single-origin coffee hella culpa.
			Art party readymade 90's, asymmetrical hell of fingerstache ipsum.
		</div>`
	})

	onGet("/tab2", function() {
		return `
		<div class="tab-list" role="tablist">
			<button hx-get="/tab1" role="tab" aria-selected="false" aria-controls="tab-content">Tab 1</button>
			<button hx-get="/tab2" class="selected" aria-selected="true" autofocus role="tab" aria-controls="tab-content">Tab 2</button>
			<button hx-get="/tab3" role="tab" aria-selected="false" aria-controls="tab-content">Tab 3</button>
		</div>

		<div id="tab-content" role="tabpanel" class="tab-content">
			Kitsch fanny pack yr, farm-to-table cardigan cillum commodo reprehenderit plaid dolore cronut meditation.
			Tattooed polaroid veniam, anim id cornhole hashtag sed forage.
			Microdosing pug kitsch enim, kombucha pour-over sed irony forage live-edge.
			Vexillologist eu nulla trust fund, street art blue bottle selvage raw denim.
			Dolore nulla do readymade, est subway tile affogato hammock 8-bit.
			Godard elit offal pariatur you probably haven't heard of them post-ironic.
			Prism street art cray salvia.
		</div>`
	})

	onGet("/tab3", function() {
		return `
		<div class="tab-list" role="tablist">
			<button hx-get="/tab1" role="tab" aria-selected="false" aria-controls="tab-content">Tab 1</button>
			<button hx-get="/tab2" role="tab" aria-selected="false" aria-controls="tab-content">Tab 2</button>
			<button hx-get="/tab3" class="selected" aria-selected="true" autofocus role="tab" aria-controls="tab-content">Tab 3</button>
		</div>

		<div id="tab-content" role="tabpanel" class="tab-content">
			Aute chia marfa echo park tote bag hammock mollit artisan listicle direct trade.
			Raw denim flexitarian eu godard etsy.
			Poke tbh la croix put a bird on it fixie polaroid aute cred air plant four loko gastropub swag non brunch.
			Iceland fanny pack tumeric magna activated charcoal bitters palo santo laboris quis consectetur cupidatat portland aliquip venmo.
		</div>`
	})

</script>

<style>
	#demo-canvas {
		display:none;
	}

	#tabs > .tab-list {
		border-bottom: solid 3px #eee;
	}

	#tabs > .tab-list button {
		border: none;
		display: inline-block;
		padding: 5px 10px;
		cursor:pointer;
		background-color: transparent;
	}

	#tabs > .tab-list button:hover {
		color: var(--midBlue);
	}

	#tabs > .tab-list button.selected {
		background-color: #eee;
	}

	#tabs > .tab-content {
		padding:10px;
		margin-bottom:100px;
	}
</style>
