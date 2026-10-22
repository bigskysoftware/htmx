# HCON grammar (strict)

A closed, non-Turing-complete map language for htmx attributes.
Implemented by recursive descent in `src/hcon.js`. Regex is not part of
the grammar; `test/no-regex.test.js` fails the build if a regex literal
or `RegExp` call appears in the parser.

This is a proposal, not a description of shipping htmx 4.0.0. The 4.0.0
parser is a global regex plus per-attribute peelers. This document is
the language we think HCON should be.

## Non-goals

- CSS. Selectors are string values (`target:'#table tbody'` or
  `from:<#table tbody/>`). The grammar does not parse combinators.
- JavaScript. Trigger filters (`click[shiftKey]`) are outside HCON.
  They `eval`. That is a host concern, not this language.
- Arrays and nested `{...}` inside HCON. JSON remains the full-fidelity
  form (`parse` of a string that starts with `{` is `JSON.parse`).
- Mixing JSON and HCON in one string.

## Start symbols

Comma cannot mean two things. Two start symbols share one tokenizer:

| Start | Used by | Pair separator | Item separator |
|---|---|---|---|
| `Map` | `hx-swap` modifiers, `hx-vals`, `hx-config`, `hx-headers`, `hx-swap-oob` | whitespace | — |
| `List` | `hx-trigger` | whitespace inside each map | comma |

So `delay:100ms throttle:200ms` is one map, and
`click delay:500ms, keyup` is a list of two maps.
`delay:100ms, throttle:200ms` as a **Map** is a syntax error (comma).
As a **List** it is two maps. Hosts pick the start symbol.

## EBNF

```
input     := ws* ( json | map ) ws*
list      := ws* map ( comma ws* map )* ws*

json      := '{' … '}'          (* JSON.parse of the whole input *)

map       := pair ( ws+ pair )*
pair      := key ( ':' ws* value )?          (* missing value => true *)

key       := string | dotted
dotted    := ident ( '.' ident )*
value     := string | number | boolean | ident

string    := '"' chars '"' | "'" chars "'" | '<' hs-chars '/>'
ident     := ident-char+
ident-char:= any char except whitespace, ':' , ','

number    := '-'? digits ( '.' digits )? ( [eE] [+-]? digits )?
boolean   := 'true' | 'false'

ws        := space | tab | CR | LF
comma     := ','
```

`hs-chars` is any run that does not contain the two-character closer
`/>`. That is the existing hyperscript quoting form, kept because it
does not fight HTML attribute quotes.

Quoted values are **always strings**. `count:42` is a number;
`count:"42"` is the string `"42"`. The shipping parser JSON-parses
every value, so quotes do not control type.

Leftover input that is not a pair is an error. Unquoted spaces do **not**
produce leftover: `beforeend:#table tbody` is a well-formed Map
`{beforeend:"#table", tbody:true}`. That is why colon form cannot be
rejected in the grammar. `interpretSwap` / `interpretOob` reject a
swap-style key whose value is not `true` — hosts interpret, they do
not re-tokenize.

The shipping parser `matchAll`s and drops unmatched text.

## Interpretation (not parsing)

A map is data. Attribute hosts look up vocabularies:

- `hx-swap="innerHTML swap:200ms target:'#table tbody'"`
  → `{innerHTML: true, swap: "200ms", target: "#table tbody"}`
  → the unique key that is a swap style becomes `style`.
- `hx-swap-oob="beforeend target:'#table tbody'"` is the same map.
  Colon form `beforeend:#table tbody` is **not** HCON.
- `hx-trigger` uses `List`. Each map’s unique event-name flag is
  `name`. `every:2s` is a pair, not the shipping `every 2s` peel.

## Complexity

The grammar is regular over tokens plus one-token lookahead (LL(1)).
No recursion in values except JSON (a different language). No loops,
functions, or substitutions. That is the non-Turing bound: HCON cannot
express computation; hosts may still `eval` filters, which this parser
refuses to tokenize.

## Compatibility

`src/legacy.js` is a copy of the 4.0.0 regex parser. `test/corpus.json`
classifies strings as `both`, `legacy_only`, or `strict_error`. CI
fails if the classifications drift without an explicit corpus edit.
