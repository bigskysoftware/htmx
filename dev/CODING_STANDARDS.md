# htmx Coding Standards

* Prefer `for` loop to `forEach` (easier to debug, compresses better)
* Assign complex expressions to a local variable rather than using them directly in statements (easier to debug)
* Private methods should be prefixed with `__`.  The `dist` task will replace double underscore with `#` when it builds 
  the final script.  This allows us to unit test private methods.
* "Internal" methods should be prefixed with a `_`.  These methods are _not_ guaranteed to never change, but may be useful
  for special cases (e.g. the `quirks` htmx 2.0 compatibility extension)
* Public methods are forever, be very careful with them
* Use `let` rather than `const`
* Publicly surfaced properties should not be shortened, _except_ "Configuration" which can be shortened to "Config"
* Local variables should have descriptive names in most cases.  `ctx` and `elt` are acceptable.
  * Terser does a good job of minimizing names, so there is no benefit from a size perspective to using short variable names.
* Generally all state in the trigger -> request -> swap life cycle should be stored on `ctx`.  Try to avoid overwriting 
  an existing property, pick a new property name.  These properties are part of the public API and *must* be documented.
* There is size code benefit to naked if statements, use curlies to make debugging easier:
   ```js
    // terser turns these two forms into the same compressed code
    if(bool) return;
    if(bool) {
       return;
    }
   ```
* Please lets keep this thing under 10k please please please

## Testing

* TODO - outline testing standards

## AI Policy

AI may not be used to generate any significant amount of code that is added to htmx.js.  It may be used to _suggest_ code,
but that code must be audited and every line understood by the author.

AI _may_ be used to generate tests for htmx.  These tests should follow the existing standards as much as possible and
should ideally be relatively small.  No more than one test should be added at a time, and the test should be reviewed 
for correctness.

In general, try to keep any AI contributions small and well understood.

> “A computer can never be held accountable, therefore a computer must never make a management decision.”