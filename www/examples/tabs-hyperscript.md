---
layout: demo_layout.njk
---
        
## Tabs (Using Hyperscript)

This example shows how to load tab contents using htmx, and to select the "active" tab using Javascript.  This reduces some duplication by offloading some of the work of re-rendering the tab HTML from your application server to your clients' browsers.  

You may also consider [a more idiomatic approach](../tabs-hateoas) that follows the principle of [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS).

### Example Code

The HTML below displays a list of tabs, with added HTMX to dynamically load each tab pane from the server.  A simple [hyperscript](https://hyperscript.org) event handler uses the [`take` command](https://hyperscript.org/commands/take/) to switch the selected tab when the content is swapped into the DOM.  Alternatively, this could be accomplished with a slightly longer Javascript event handler.

```html
<div id="tabs" hx-target="#tab-contents" _="on htmx:afterOnLoad take .selected for event.target">
	<a hx-get="/tab1" class="selected">Tab 1</a>
	<a hx-get="/tab2">Tab 2</a>
	<a hx-get="/tab3">Tab 3</a>
</div>

<div id="tab-contents" hx-get="/tab1" hx-trigger="load"></div>
```

{% include demo_ui.html.liquid %}

<div id="tabs" hx-target="#tab-contents" _="on click take .selected for event.target">
	<a hx-get="/tab1" class="selected">Tab 1</a>
	<a hx-get="/tab2">Tab 2</a>
	<a hx-get="/tab3">Tab 3</a>
</div>

<div id="tab-contents" hx-get="/tab1" hx-trigger="load"></div>

<script src="https://unpkg.com/hyperscript.org"></script>
<script>
	onGet("/tab1", function() {
		return `
			<p>Commodo normcore truffaut VHS duis gluten-free keffiyeh iPhone taxidermy godard ramps anim pour-over. 
			Pitchfork vegan mollit umami quinoa aute aliquip kinfolk eiusmod live-edge cardigan ipsum locavore. 
			Polaroid duis occaecat narwhal small batch food truck. 
			PBR&B venmo shaman small batch you probably haven't heard of them hot chicken readymade. 
			Enim tousled cliche woke, typewriter single-origin coffee hella culpa. 
			Art party readymade 90's, asymmetrical hell of fingerstache ipsum.</p>
		`});

	onGet("/tab2", function() {
		return `
			<p>Kitsch fanny pack yr, farm-to-table cardigan cillum commodo reprehenderit plaid dolore cronut meditation. 
			Tattooed polaroid veniam, anim id cornhole hashtag sed forage. 
			Microdosing pug kitsch enim, kombucha pour-over sed irony forage live-edge. 
			Vexillologist eu nulla trust fund, street art blue bottle selvage raw denim. 
			Dolore nulla do readymade, est subway tile affogato hammock 8-bit. 
			Godard elit offal pariatur you probably haven't heard of them post-ironic. 
			Prism street art cray salvia.</p>
		`
	});

	onGet("/tab3", function() {
		return `
			<p>Aute chia marfa echo park tote bag hammock mollit artisan listicle direct trade. 
			Raw denim flexitarian eu godard etsy. 
			Poke tbh la croix put a bird on it fixie polaroid aute cred air plant four loko gastropub swag non brunch. 
			Iceland fanny pack tumeric magna activated charcoal bitters palo santo laboris quis consectetur cupidatat portland aliquip venmo.</p>
		`
	});

</script>

<style>

	#demo-canvas {
		display:none;
	}

	#tabs {
		border-bottom: solid 3px #eee;
	}

	#tabs > a {
		display: inline-block;
		padding: 5px 10px;
		cursor:pointer;
	}

	#tabs > a.selected {
		background-color: #eee;
	}

	#tab-contents {
		padding:10px;
	}
</style>
