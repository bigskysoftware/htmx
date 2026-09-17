# Runtime Behavior Changes

## Step 11: Handle GET/DELETE Form Data Change

In htmx 4, `hx-delete` (like `hx-get`) no longer includes the enclosing form's inputs. If your
delete buttons relied on form data:

```html
<!-- htmx 2: form data included automatically -->
<form>
    <input type="hidden" name="token" value="abc">
    <button hx-delete="/item/1">Delete</button>
</form>

<!-- htmx 4: must explicitly include form -->
<form>
    <input type="hidden" name="token" value="abc">
    <button hx-delete="/item/1" hx-include="closest form">Delete</button>
</form>
```

## Step 12: Handle OOB Swap Changes

In htmx 2, OOB swaps happened before the main content swap. In htmx 4, main content swaps first,
then OOB/partial elements swap after. If you have code that depends on OOB elements being present
when the main content is swapped, you may need to restructure.

Additionally, responses containing only OOB elements no longer perform an empty main swap by default.
If your code relied on OOB-only responses clearing the main target, set `htmx.config.allowEmptySwapAfterOOB = true`
or add `swapEmpty:true` to `hx-swap` on specific elements.

## Step 13: Handle Non-200 Response Swapping

In htmx 2, 4xx and 5xx responses did not swap by default. In htmx 4, all responses swap except
204 (No Content) and 304 (Not Modified).

If your server returns error HTML in 4xx/5xx responses and you don't want it swapped in, either:

- Set `htmx.config.noSwap = [204, 304, "4xx", "5xx"]` to restore htmx 2 behavior
- Use `hx-status:4xx="swap:none"` and `hx-status:5xx="swap:none"` on specific elements
- Return 204 No Content when you want no swap to occur
