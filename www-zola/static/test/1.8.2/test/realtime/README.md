# Htmx - Realtime Test Suite

This package implements a realtime server for testing WebSockets and Server Sent Events (SSE) in htmx.

## How to Use This Server

1. If you do not already have Go (version 1.17 or higher) installed on your machine, you can download an installation for your machine from [https://golang.org](the Go website)

2. Open up a terminal window and navigate to this directory.  Start up the WebSocket server by typing `go run server.go`

3. Your browser should open the test suite web page automatically.  If it doesn't, then navigate to [http://localhost](http://localhost) to run the manual tests.  Huzzah!

## Web Sockets

This listens for incoming WebSocket connections coming in to ws://localhost:1323/echo and ws://localhost:1323/heartbeat.  When it receives messages from any WebSocket client, it responds with that same content in a way that htmx can process.  This means, that the response message will look like this: `<div id="idMessage" hx-swap-oob="true">{your message here}</div>`

### Echo

The echo endpont listens for incoming WebSocket connections coming in to `ws://localhost:1323/echo`.  When it receives messages from any WebSocket client, it responds with that same content wrapped as an OOB Swap.  So, if you post the message `Hello There. General Kenobi.` the server will respond with this: `<div id="idMessage" hx-swap-oob="true">Hello There. General Kenobi.</div>`

### Heartbeat

The heartbeat endpoint `ws://localhost:1323/heartbeat`. It does not process any messages that are sent to it, but it does send messages containing random numbers to every listener at random intervals. Heartbeat message will look like this: `<div id="idMessage" hx-swap-oob="true">12345678901234567890</div>`

## Server Sent Events

This package implements a simple server that generates Server Sent Events for your test pages to read.  It streams fake data from [jsonplaceholder](https://jsonplaceholder.typicode.com) to your website on a semi-regular schedule.

### JSON Event Streams

Streams random JSON records every second (or so) to your client.

* `/posts.json`
* `/comments.json`
* `/albums.json`
* `/photos.json`
* `/todos.json`
* `/users.json`

### HTML Event Streams

Streams random HTML fragments every second (or so) to your client.  These streams are used by the manual htmx tests.

* `/posts.html`
* `/comments.html`
* `/albums.html`
* `/photos.html`
* `/todos.html`
* `/users.html`

### Specifying Event Types

You can add a `type=` parameter to your URLs to specify the event name(s) that you want the server to use.  You can specify multiple names in a comma separated list and the server will alternate between them.  If you do not specify a type, then the default message name of `message` is used.

## Credits

It is inspired by [jsonplaceholder](https://jsonplaceholder.typicode.com) -- *"a free online REST API that you can use whenever you need some fake data."*
