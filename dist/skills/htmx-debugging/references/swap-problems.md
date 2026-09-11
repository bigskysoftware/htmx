# Swap Problems

### Swap Not Happening

**Check response status:**
- `204` and `304` do NOT swap by default (controlled by `htmx.config.noSwap`)
- In htmx 4, 4xx and 5xx responses DO swap by default (unlike htmx 2!)
- If you need htmx 2 behavior: `htmx.config.noSwap = [204, 304, '4xx', '5xx']`

**Check the target:**
- Does the `hx-target` CSS selector match an existing element?
- Use browser devtools to run `document.querySelector("your-selector")` to verify

**Check `hx-swap`:**
- `hx-swap="none"` explicitly prevents swapping
- `hx-swap="delete"` deletes the target regardless of response

**Check `hx-select`:**
- If set, only matching elements from the response are used
- If nothing matches, nothing gets swapped

**Check event listeners:**
- An `htmx:before:swap` listener calling `preventDefault()` will cancel the swap

### Wrong Content Being Swapped

**Check selectors:**
- `hx-select` might be matching the wrong element in the response
- `hx-target` might point to the wrong element

**Check for OOB/partial interference:**
- `hx-swap-oob` in the response swaps content by ID independently
- `<hx-partial>` tags in the response swap into their own targets
- In htmx 4, OOB swaps happen AFTER the main content swap (changed from htmx 2)

**Check response headers:**
- `HX-Retarget`, `HX-Reswap`, `HX-Reselect` override client-side attributes, and htmx applies them before `hx-status`
- `hx-status:XXX` attributes can change target, swap, select or history handling for one status code.
  htmx tries the exact code first, then `NNx`, then `Nxx`, and stops at the first match
