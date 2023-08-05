package htmxtestserver

import (
	"context"
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/go-rod/rod"
	"github.com/stretchr/testify/assert"
)

func TestSSECleanup(t *testing.T) {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	maxWait := 3 * time.Second
	iterations := 10

	ctxWithTimeout, cancel := context.WithTimeout(context.Background(), maxWait)
	defer cancel()

	port := 8008
	go RunWebBlocking(ctxWithTimeout, port)

	browser := rod.New().MustConnect()
	defer browser.MustClose()

	cycleSSEPage := func(ctx context.Context, iterations int, errCh chan<- error) {
		baseURL := fmt.Sprintf("http://localhost:%d/sse", port)
		var page *rod.Page

		for i := 1; i <= iterations; i++ {
			select {
			case <-ctx.Done():
				errCh <- fmt.Errorf("Timed out waiting for page switch")
			default:
				log.Printf("Iteration %d", i)

				log.Print("Try going to links page")
				page = browser.MustPage(baseURL)
				page.MustWaitLoad()
				log.Print("On links page")

				log.Print("Click heartbeat link")
				page.MustElement("a[href='/sse/heartbeat']").MustClick()
				page.MustWaitLoad()
			}
		}

		errCh <- nil
	}

	errCh := make(chan error)
	go cycleSSEPage(ctxWithTimeout, iterations, errCh)

	select {
	case err := <-errCh:
		assert.NoError(t, err)
	case <-ctxWithTimeout.Done():
		t.Fatalf("Timed out waiting for page switch")
	}
}
