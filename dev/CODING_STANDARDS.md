# htmx Coding Standards

* Prefer `for` loop to `forEach` (easier to debug)
* Assign complex expressions to a local variable rather than using them directly in statements (easier to debug)
* Private methods should be prefixed with `__`.  The `dist` task will replace double underscore with `#` when it builds 
  the final script.  This allows us to unit test private methods.
* "Internal" methods should be prefixed with a `_`.  These methods are _not_ guaranteed to never change, but may be useful
  for special cases (e.g. the `quirks` htmx 2.0 compatibility extension)
* Public methods are forever, be very careful with them
* Use `let` rather than `const`
* Publicly surfaced properties should not be shortened, _except_ "Configuration" which can be shortened to "Config"
* Local variables should have descriptive names in most cases.  `ctx` and `elt` are acceptable.
* Generally all state in the trigger -> request -> swap life cycle should be stored on ctx.  Try to avoid overwrighting 
  an existing property, pick a new property name.  These properties are part of the public API and *must* be documented.

## AI Policy

AI may not be used to generate any significant amount of code that is added to htmx.js.  It may be used to _suggest_ code,
but that code must be audited and every line understood by the author.

AI _may_ be used to generate tests for htmx.  These tests should follow the existing standards as much as possible and
should ideally be relatively small.  No more than one test should be added at a time, and the test should be reviewed 
for correctness.

In general, try to keep any AI contributions small and well understood.

> “A computer can never be held accountable, therefore a computer must never make a management decision.”