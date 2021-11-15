# WebSocket - Test Server

This package implements a test-suite WebSocket server for testing htmx.

## What It Does

This server listens for incoming WebSocket connections coming in to ws://localhost:1323/echo.  When it receives messages from any WebSocket client, it responds with that same content in a way that htmx can process.  This means, that the response message will look like this: `<div id="idMessage" hx-swap-oob="true">{your message here}</div>`

## How to Use This Server

1. If you do not already have Go (version 1.17 or higher) installed on your machine, you can download an installation for your machine from [https://golang.org](the Go website)

2. Open up a terminal window and navigate to this directory.  Start up the WebSocket server by typing `go run server.go`

3. Open your web browser to [http://localhost](http://localhost) to run the manual tests.  Huzzah!
