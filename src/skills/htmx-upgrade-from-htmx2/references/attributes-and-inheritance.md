# Attributes and Inheritance

## Step 1: Attribute Renames

Search and replace across the codebase. **Order matters for hx-disable.**

```
# IMPORTANT: Do hx-disable FIRST (it means something different in htmx 2 vs 4)
# In htmx 2, hx-disable stops htmx processing. In htmx 4, hx-ignore does that.
hx-disable  ->  hx-ignore          (htmx 2's "disable htmx processing")

# Now safe to rename hx-disabled-elt
hx-disabled-elt  ->  hx-disable    (htmx 2's "disable elements during request")
```

## Step 2: Remove Deleted Attributes

| Find                  | Replace with                                                |
|-----------------------|-------------------------------------------------------------|
| `hx-vars='...'`       | `hx-vals='js:...'` (wrap value in `js:` prefix)             |
| `hx-params="..."`     | Remove; use `htmx:config:request` event to filter params    |
| `hx-prompt="..."`     | Load the `hx-prompt` extension (same syntax as htmx 2)      |
| `hx-ext="..."`        | Remove (just including the extension script is enough)      |
| `hx-disinherit="..."` | Remove (inheritance is explicit by default)                 |
| `hx-inherit="..."`    | Remove (use `:inherited` modifier on individual attributes) |
| `hx-request='...'`    | `hx-config='...'`. Takes HCON, which accepts the old JSON    |
| `hx-history="false"`  | Remove (history no longer uses localStorage)                |

## Step 3: Update Attribute Inheritance

In htmx 2, all attributes inherited implicitly from parent elements. In htmx 4, inheritance must
be explicit using the `:inherited` modifier.

### How to find inherited attributes

**Do not blindly add `:inherited` to everything.** Instead, analyze the codebase to find attributes
that are actually being inherited. Look for this pattern: a parent element has an htmx attribute,
and child/descendant elements rely on it without declaring it themselves.

Common attributes that are frequently inherited:

- **`hx-target`** -- very common. Look for a container with `hx-target` and multiple child elements
  with `hx-get`/`hx-post`/etc. that don't have their own `hx-target`
- **`hx-include`** -- common in form-heavy UIs where a parent sets a shared include
- **`hx-swap`** -- when a group of elements should all swap the same way
- **`hx-boost`** -- typically set on a parent `<div>` or `<body>` to boost all links within
- **`hx-confirm`** -- set on a container to confirm all actions within it
- **`hx-headers`** -- set on a parent to attach auth tokens or CSRF headers to all requests within
- **`hx-indicator`** -- set on a parent to share a loading indicator
- **`hx-sync`** -- set on a parent to coordinate request timing for children
- **`hx-config`** -- set on a parent to configure timeouts, etc. for children
- **`hx-encoding`** -- set on a parent for multipart encoding across children
- **`hx-validate`** -- set on a parent to enable validation for all children

### What to search for

For each inheritable attribute, search for elements that have the attribute but **don't** have
their own `hx-get`, `hx-post`, `hx-put`, `hx-patch`, or `hx-delete`. These are likely
inheritance parents. Add `:inherited` to them:

```html
<!-- htmx 2 -->
<div hx-target="#output" hx-headers='{"X-Token":"abc"}'>
    <button hx-get="/items">Load</button>
    <button hx-delete="/item/1">Delete</button>
</div>

<!-- htmx 4 -->
<div hx-target:inherited="#output" hx-headers:inherited='{"X-Token":"abc"}'>
    <button hx-get="/items">Load</button>
    <button hx-delete="/item/1">Delete</button>
</div>
```

For `hx-boost`, it is almost always inherited -- a `hx-boost="true"` on a non-link, non-form
element is always meant for its descendants.

## Step 4: Check `data-hx-*` Attributes

No change is needed. In htmx 4 `htmx.config.prefix` defaults to `"data-hx-"`, and the prefix is
additive: htmx checks both `hx-get` and `data-hx-get`. Leave `data-hx-*` markup as it is.

Set `prefix` only if you want a third spelling:

```html
<meta name="htmx-config" content='{"prefix": "x-hx-"}'>
```

Setting `prefix` replaces `data-hx-`, so any `data-hx-*` markup stops working. `hx-*` always works.
