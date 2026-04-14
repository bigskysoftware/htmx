#!/bin/bash

DOCS=www/src/content/docs/01-get-started/01-installation.md

# Calculate SHAs
MINIFIED_SHA=$(cat dist/htmx.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
FULL_SHA=$(cat dist/htmx.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_MIN_SHA=$(cat dist/htmx.esm.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_SHA=$(cat dist/htmx.esm.js | openssl dgst -sha384 -binary | openssl base64 -A)

echo "Updating $DOCS with new SHAs..."
echo "htmx.min.js:     sha384-$MINIFIED_SHA"
echo "htmx.js:         sha384-$FULL_SHA"
echo "htmx.esm.min.js: sha384-$ESM_MIN_SHA"
echo "htmx.esm.js:     sha384-$ESM_SHA"

awk -v minified="sha384-$MINIFIED_SHA" -v full="sha384-$FULL_SHA" \
    -v esm_min="sha384-$ESM_MIN_SHA" -v esm="sha384-$ESM_SHA" '
/integrity="sha384-[^"]*"/ && /htmx\.esm\.min\.js/                              { sub(/sha384-[^"]*/, esm_min) }
/integrity="sha384-[^"]*"/ && /htmx\.esm\.js/ && !/htmx\.esm\.min\.js/          { sub(/sha384-[^"]*/, esm) }
/integrity="sha384-[^"]*"/ && /htmx\.min\.js/ && !/htmx\.esm/                   { sub(/sha384-[^"]*/, minified) }
/integrity="sha384-[^"]*"/ && /htmx\.js/ && !/htmx\.min\.js/ && !/htmx\.esm/    { sub(/sha384-[^"]*/, full) }
/integrity="sha384-[^"]*"/ && /htmx\.org@/ && !/dist\//                         { sub(/sha384-[^"]*/, minified) }
{print}
' "$DOCS" > "$DOCS.tmp" && mv "$DOCS.tmp" "$DOCS"

echo "✓ $DOCS updated successfully"
