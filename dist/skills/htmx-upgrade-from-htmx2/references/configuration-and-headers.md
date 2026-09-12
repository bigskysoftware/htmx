# Configuration and HTTP Headers

## Step 7: Update Configuration

| htmx 2 config            | htmx 4 config                           |
|--------------------------|-----------------------------------------|
| `defaultSwapStyle`       | `defaultSwap`                           |
| `globalViewTransitions`  | `transitions`                           |
| `historyEnabled`         | `history`                               |
| `includeIndicatorStyles` | `includeIndicatorCSS`                   |
| `timeout`                | `defaultTimeout` (new default: 60000ms) |

Removed configs (no equivalent): `refreshOnHistoryMiss`, `historyCacheSize`, `defaultSwapDelay`,
`addedClass`, `settlingClass`, `swappingClass`, `allowEval`, `allowScriptTags`, `attributesToSettle`,
`useTemplateFragments`, `wsReconnectDelay`, `wsBinaryType`, `disableSelector`, `withCredentials`,
`scrollBehavior`, `getCacheBusterParam`, `methodsThatUseUrlParams`, `selfRequestsOnly`, `ignoreTitle`,
`scrollIntoViewOnBoost`, `triggerSpecsCache`, `allowNestedOobSwaps`, `responseHandling`.

## Step 8: Update Server-Side Header Handling

**Request headers your server reads:**

| htmx 2 header     | htmx 4 header | Format change                                        |
|-------------------|---------------|------------------------------------------------------|
| `HX-Trigger`      | `HX-Source`   | Was element ID -> now `tag#id` (e.g. `button#submit`) |
| `HX-Trigger-Name` | Removed       | Use `HX-Source`                                      |
| `HX-Target`       | `HX-Target`   | Was element ID -> now `tag#id`                        |
| `HX-Prompt`       | Via extension | Load the `hx-prompt` extension to restore the header |

New request header: `HX-Request-Type` (`"full"` or `"partial"`).

**Response headers your server sends:**

| htmx 2 header             | htmx 4 status             |
|---------------------------|---------------------------|
| `HX-Trigger-After-Swap`   | Removed; use `HX-Trigger` |
| `HX-Trigger-After-Settle` | Removed; use `HX-Trigger` |

Still supported: `HX-Trigger`, `HX-Push-Url`, `HX-Replace-Url`, `HX-Redirect`, `HX-Location`,
`HX-Refresh`, `HX-Retarget`, `HX-Reswap`, `HX-Reselect`.
