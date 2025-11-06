# htmx Coding Standards

* General Code Style
  * Prefer `for` loop to `forEach` (easier to debug, compresses better)
  * Assign complex expressions to a local variable rather than using them directly in statements (easier to debug)
  * Use `let` rather than `const`
  * Local variables should have descriptive names in most cases.  `ctx` and `elt` are acceptable.
      * Terser does a good job of minimizing names, so there is no benefit from a size perspective to using short variable names.
  * There is no size code benefit to naked if statements, use curlies to make debugging easier:
     ```js
      // terser turns these two forms into the same compressed code
      if(bool) return;
      if(bool) {
         return;
      }
     ```
* Method/Field Conventions
  * Private methods should be prefixed with `__`.  The `dist` task will replace double underscore with `#` when it builds 
    the final script.  This allows us to unit test private methods.
  * "Internal" methods should be prefixed with a `_`.  These methods are _not_ guaranteed to never change, but may be useful
    for special cases (e.g. the `quirks` htmx 2.0 compatibility extension)
  * Public methods are forever, be very careful with them
  * Publicly surfaced properties should not be shortened, _except_ "Configuration" which can be shortened to "Config"
* Architectural Style
  * Generally all state in the trigger -> request -> swap life cycle should be stored on `ctx`.  Try to avoid overwriting 
    an existing property, pick a new property name.  These properties are part of the public API and *must* be documented.

## Testing

Tests for htmx are organized in the following manner:

* `/test/unit` - These tests should for the most part *directly* exercise public and private methods.  Because in
  dev private methods are just public methods that start with `__` this is easy to do.  Unit tests should be created
  after a method has stabilized and the behavior is reasonably well understood.
* `/test/attributes` - These are integration tests that test the full behavior of a given attribute and should do things
  like set up a response mock using `mockResponse()`, create a live HTML button with the `createProcessedHTML` method, 
  invoke `click()` on the button, await the `"htmx:finally:request" event, and assert something about the updated DOM.
* `/test/end2end` - These are end-to-end tests that do not fit in the other two categories
* `/test/ext` - These tests are for the core extensions, which ship as part of htmx


## AI Policy

AI may _not_ be used to generate any significant amount of code that is added to htmx.js.  It may be used to _suggest_ code,
but that code must be audited and every line understood by the author.

AI _may_ be used to generate tests for htmx.  These tests should follow the existing standards as much as possible and
should ideally be relatively small.  No more than one test should be added at a time, and the test should be reviewed 
for correctness.

In general, try to keep any AI contributions small and well understood.

> “A computer can never be held accountable, therefore a computer must never make a management decision.”