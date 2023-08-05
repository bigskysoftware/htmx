package htmxtestserver

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
)

func RunWebBlocking(setupCtx context.Context, port int) error {

	router := chi.NewRouter()

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: router,
	}

	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, htmxPageFmt, `
		<h1>Extensions</h1>
		<a href="/sse">Server Sent Events</a>
		<a href="/ws">Websockets</a>
		`)
	})

	if err := errors.Join(
		setupWebsockets(setupCtx, router),
		setupServerSentEvents(setupCtx, router),
	); err != nil {
		panic(fmt.Errorf("error setting up extensions: %w", err))
	}

	htmxSrcDir, err := filepath.Abs("../../../src")

	if err != nil {
		return fmt.Errorf("error getting absolute path to htmx src: %w", err)
	}
	log.Printf("htmxSrcDir: %s", htmxSrcDir)

	if _, err := os.Stat(filepath.Join(htmxSrcDir, "htmx.js")); err != nil {
		return fmt.Errorf("error checking if htmx.js exists in %s: %w", htmxSrcDir, err)
	}

	fs := http.FileServer(http.Dir(htmxSrcDir))
	router.Handle("/htmx/*", http.StripPrefix("/htmx/", fs))

	go func() {
		<-setupCtx.Done()
		srv.Shutdown(context.Background())
	}()

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	return nil
}
