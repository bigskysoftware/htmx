#!/bin/bash

# Calculate SHAs
MINIFIED_SHA=$(cat dist/htmx.min.js | openssl dgst -sha384 -binary | openssl base64 -A)
FULL_SHA=$(cat dist/htmx.js | openssl dgst -sha384 -binary | openssl base64 -A)

echo "Updating docs.md with new SHAs..."
echo "htmx.min.js: sha384-$MINIFIED_SHA"
echo "htmx.js: sha384-$FULL_SHA"

# Update both integrity attributes in docs.md using awk for precise control
awk -v minified="sha384-$MINIFIED_SHA" -v full="sha384-$FULL_SHA" '
/integrity="sha384-[^"]*"/ && /htmx\.min\.js/ {
    sub(/sha384-[^"]*/, minified)
}
/integrity="sha384-[^"]*"/ && /htmx\.js"/ && !/htmx\.min\.js/ {
    sub(/sha384-[^"]*/, full)
}
{print}
' www/content/docs.md > www/content/docs.md.tmp && mv www/content/docs.md.tmp www/content/docs.md

echo "✓ docs.md updated successfully"
