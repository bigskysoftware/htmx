> RFC. This directory is a proposed grammar, parser, and Node test
> corpus. It is **not** wired into `src/htmx.js`. Shipping HCON is
> unchanged. See GRAMMAR.md.

# Strict HCON

A testable, LL(1), non-Turing-complete grammar for htmx's attribute config
language. Recursive descent. No regex. Shipping htmx 4.0.0 HCON is a
global regex plus per-attribute peelers; this is the language we think
it should be.

```bash
make hcon          # from the community wrapper root
# or
cd hcon && npm test
```

- Spec: [`GRAMMAR.md`](GRAMMAR.md)
- Parser: [`src/hcon.js`](src/hcon.js)
- Hosts interpret maps, they do not re-tokenize: [`src/interpret.js`](src/interpret.js)
- 4.0.0 regex copy, comparison only: [`src/legacy.js`](src/legacy.js)
- Compatibility classifications: [`test/corpus.json`](test/corpus.json)

CI is `.github/workflows/hcon.yml` (Node, no Playwright). The associated
htmx RFC branch adds the same job next to `htmx_tests`.
