package htmxtestserver

import (
	"context"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"time"

	"golang.org/x/crypto/sha3"
)

var (
	hasher  = sha3.New256()
	encoder = base32.StdEncoding.WithPadding(base32.NoPadding)
)

func heartbeatCh(ctx context.Context, htmlFragmentCh chan<- string, interval time.Duration) {
	buf := make([]byte, 8)
	count := uint64(1)
	t := time.NewTicker(interval)

	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			binary.LittleEndian.PutUint64(buf, count)
			count++

			hasher.Reset()
			hasher.Write(buf)

			message := fmt.Sprintf(
				`<div id="heartbeat" hx-swap-oob="beforeend"><div>Message %d:%s</div></div>`,
				count,
				encoder.EncodeToString(hasher.Sum(nil)[0:4]),
			)

			htmlFragmentCh <- message
		}

	}
}

const htmxPageFmt = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>HTMX TestServer</title>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
	<script src="/htmx/htmx.js"></script>
	<script src="/htmx/ext/sse.js"></script>
	<script src="/htmx/ext/ws.js"></script>
</head>
<body>
<header class="container">HTMX Test Server</header>
<main class="container">
%s
</main>
</body>
</html>
`

var htmxPageWithBackFmt = fmt.Sprintf(htmxPageFmt, `
<a href="javascript:history.back()">Go Back</a>
%s
`)
