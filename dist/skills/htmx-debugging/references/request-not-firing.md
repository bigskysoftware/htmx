# Request Not Firing

### Request Not Firing

**Check the trigger:**
- Is the event actually happening? Use `monitorEvents()` on the element
- Default triggers differ by element type -- an `<input>` won't fire on `click`
- If using `hx-trigger="load"`, was the element in the DOM before htmx initialized?

**Check synchronization:**
- `hx-sync` may be dropping or queuing the request
- Check for `hx-sync="closest form"` or similar that might block it

**Check confirmation:**
- `hx-confirm` blocks until confirmed -- including `js:` async confirmation
- An `htmx:confirm` event listener calling `preventDefault()` without calling `issueRequest()` will block forever

**Check for `hx-ignore`:**
- A parent element with `hx-ignore` disables htmx for all children

**Dynamic content:**
- Elements added to the DOM after page load need `htmx.process(element)` to initialize htmx behavior
- Or use `htmx.onLoad()` to set up a callback for new content
