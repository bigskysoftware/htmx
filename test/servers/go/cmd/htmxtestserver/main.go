package main

import (
	"context"
	"fmt"

	htmxtestserver "github.com/bigskysoftware/htmx/tree/master/test/servers/go"
	"sigs.k8s.io/controller-runtime/pkg/manager/signals"
)

func main() {
	ctx := signals.SetupSignalHandler()

	if err := run(ctx); err != nil {
		panic(err)
	}
}

func run(ctx context.Context) error {

	if err := htmxtestserver.RunWebBlocking(ctx, 8008); err != nil {
		return fmt.Errorf("error running web blocking: %w", err)
	}

	return nil
}
