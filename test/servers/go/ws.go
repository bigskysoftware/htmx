package htmxtestserver

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"golang.org/x/net/websocket"
)

func setupWebsockets(setupCtx context.Context, router chi.Router) error {
	router.Route("/ws", func(webSocketRouter chi.Router) {
		webSocketRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprintf(w, htmxPageWithBackFmt, `
				<h1>Websockets</h1>
				<a href="/ws/heartbeat">Heartbeat</a>
				<a href="/ws/echo">Echo</a>
				<a href="/ws/custom">Custom Event</a>
			`)
		})

		webSocketRouter.Route("/heartbeat", func(webSocketHeartbeatRouter chi.Router) {
			webSocketHeartbeatRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprintf(w, htmxPageWithBackFmt, `
					<h1>Heartbeat</h1>
					<h3>Messages</h3>
					<div id="heartbeat"
						hx-ext="ws"
						ws-connect="/ws/heartbeat/stream"
					></div>
				`)
			})

			webSocketHeartbeatRouter.Get("/stream", func(w http.ResponseWriter, r *http.Request) {
				websocket.Handler(func(ws *websocket.Conn) {
					ctx := r.Context()
					defer ws.Close()
					htmlFragmentsCh := make(chan string)
					go heartbeatCh(ctx, "heartbeat", htmlFragmentsCh, 1*time.Second)

					for {
						select {
						case <-ctx.Done():
							return
						case message := <-htmlFragmentsCh:
							if err := websocket.Message.Send(ws, message); err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}
						}

					}
				}).ServeHTTP(w, r)
			})
		})

		webSocketRouter.Route("/echo", func(webSocketEchoRouter chi.Router) {
			webSocketEchoRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprintf(w, htmxPageWithBackFmt, `
					<h1>Echo</h1>
				`)
			})

			webSocketEchoRouter.Get("/stream", func(w http.ResponseWriter, r *http.Request) {
				websocket.Handler(func(ws *websocket.Conn) {

					defer ws.Close()

					for {
						var message string

						if err := websocket.Message.Receive(ws, &message); err != nil {
							http.Error(w, err.Error(), http.StatusBadRequest)
							return
						}

						if err := websocket.Message.Send(ws, message); err != nil {
							http.Error(w, err.Error(), http.StatusInternalServerError)
							return
						}
					}
				}).ServeHTTP(w, r)
			})
		})

		webSocketRouter.Route("/custom", func(webSocketCustomRouter chi.Router) {
			webSocketCustomRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprintf(w, htmxPageWithBackFmt, `
					<h1>Custom Event</h1>
					<h3>Messages</h3>
					<table>
						<thead>
							<tr>
								<th>Message</th>
							</tr>
						</thead>
						<tbody id="custom"  hx-get="/ws/custom/stream" hx-swap-oob="beforeend">
						</tbody>
					</table>
					<div
						hx-ext="ws"
						ws-connect="/ws/custom/stream"
						ws-event="custom-event"
					></div>
				`)
			})

			webSocketCustomRouter.Get("/stream", func(w http.ResponseWriter, r *http.Request) {
				websocket.Handler(func(ws *websocket.Conn) {
					ctx := r.Context()
					defer ws.Close()
					htmlFragmentsCh := make(chan string)
					go heartbeatCh(ctx, "custom", htmlFragmentsCh, 1*time.Second)

					for {
						select {
						case <-ctx.Done():
							return
						case message := <-htmlFragmentsCh:
							if err := websocket.Message.Send(ws, message); err != nil {
								http.Error(w, err.Error(), http.StatusInternalServerError)
								return
							}
						}

					}
				}).ServeHTTP(w, r)
			})
		})
	})

	return nil
}
