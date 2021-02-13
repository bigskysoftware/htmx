cat dist/htmx.min.js | openssl dgst -sha384 -binary | openssl base64 -A
echo ""