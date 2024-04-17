echo "htmx.min.js:"
cat dist/htmx.min.js | openssl dgst -sha384 -binary | openssl base64 -A
echo ""
echo "htmx.js:"
cat dist/htmx.js | openssl dgst -sha384 -binary | openssl base64 -A
echo ""
