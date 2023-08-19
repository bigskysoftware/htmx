package htmxtestserver

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

func setupServerSentEvents(setupCtx context.Context, router chi.Router) error {
	router.Route("/sse", func(sseRouter chi.Router) {
		sseRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintf(w, htmxPageWithBackFmt, `
			<h1>Server Sent Events</h1>
			<a href="/sse/heartbeat">Heartbeat</a>
			`)
		})

		sseRouter.Route("/heartbeat", func(heartbeatRouter chi.Router) {
			heartbeatRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
				// ctx := r.Context()

				fmt.Fprintf(w, htmxPageWithBackFmt, `
				<h1>Server Sent Events</h1>
				<h2>Heartbeat</h2>
				<div
					id="heartbeats"
					hx-ext="sse"
					sse-connect="/sse/heartbeat/stream"
					sse-swap="heartbeat"
					hx-swap="beforeend"
				>
					<h2>Fragments</h2>
				</div>
				`)
			})

			heartbeatRouter.Get("/stream", func(w http.ResponseWriter, r *http.Request) {
				ctx := r.Context()
				htmlFragmentsCh := make(chan string)

				go heartbeatCh(ctx, "heartbeat", htmlFragmentsCh, 1*time.Second)

				flusher, ok := w.(http.Flusher)
				if !ok {
					http.Error(w, "expected http.ResponseWriter to be an http.Flusher", http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "text/event-stream")
				w.Header().Set("Cache-Control", "no-cache")
				w.Header().Set("Connection", "keep-alive")
				flusher.Flush()

				for {
					select {
					case <-ctx.Done():
						return
					case message := <-htmlFragmentsCh:
						fmt.Fprintf(w, "event: heartbeat\ndata: %s\n\n", message)
						flusher.Flush()
					}

				}
			})
		})
	})
	return nil
}
