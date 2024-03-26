#!/bin/bash
# This script is intended to be run from npm, via `npm run dist`
set -euo pipefail

HTMX_SRC=src/htmx.js

# Clean the dist directory
rm -rf dist/*

# Regular IIFE script
cp $HTMX_SRC dist/htmx.js

# Minified script
uglifyjs -m eval -o dist/htmx.min.js dist/htmx.js

# Gzipped script
gzip -9 -k -f dist/htmx.min.js > dist/htmx.min.js.gz

# AMD script
cat > dist/htmx.amd.js << EOF
define(() => {
$(cat $HTMX_SRC)
return htmx
})
EOF

# CJS script
cat > dist/htmx.cjs.js << EOF
$(cat $HTMX_SRC)
module.exports = htmx;
EOF

# ESM script
cat > dist/htmx.esm.js << EOF
$(cat $HTMX_SRC)
export default htmx
EOF
