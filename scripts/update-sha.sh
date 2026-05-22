#!/bin/bash

JSON=www/src/data/integrity.json

# Calculate SHAs
MINIFIED_SHA=$(cat dist/htmx.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
FULL_SHA=$(cat dist/htmx.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_MIN_SHA=$(cat dist/htmx.esm.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
ESM_SHA=$(cat dist/htmx.esm.js | openssl dgst -sha384 -binary | openssl base64 -A)

echo "Updating $JSON with new SHAs..."
echo "htmx.min.js:     sha384-$MINIFIED_SHA"
echo "htmx.js:         sha384-$FULL_SHA"
echo "htmx.esm.min.js: sha384-$ESM_MIN_SHA"
echo "htmx.esm.js:     sha384-$ESM_SHA"

cat > "$JSON" <<EOF
{
    "min": "sha384-$MINIFIED_SHA",
    "full": "sha384-$FULL_SHA",
    "esmMin": "sha384-$ESM_MIN_SHA",
    "esm": "sha384-$ESM_SHA"
}
EOF

echo "✓ $JSON updated successfully"
