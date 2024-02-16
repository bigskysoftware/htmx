# WebSocket and Server-Side Events live test suite
This package implements a realtime server for testing WebSockets and Server Sent Events (SSE) in htmx.

## How to Use This Server
From this directory, run `node server.mjs`.

If you want to hotreload, I recommend using `nodemon`, which you can install with `npm install -g
nodemon`, and then run `nodemon -e js,html server.mjs`.

## Web Sockets
When htmx receives messages from any WebSocket client, it responds with that same content in a way that htmx can process. This means, that the response message will look like this: `<div id="idMessage" hx-swap-oob="true">{your message here}</div>`

### Echo
When the echo endpoint receives messages from any WebSocket client, it responds with that same content wrapped as an OOB Swap.  So, if you post the message `Hello There. General Kenobi.` the server will respond with this: `<div id="idMessage" hx-swap-oob="true">Hello There. General Kenobi.</div>`

### Heartbeat
The heartbeat endpoint does not process any messages that are sent to it, but it does send messages containing random numbers to every listener at random intervals. Heartbeat message will look like this: `<div id="idMessage" hx-swap-oob="true">12345678901234567890</div>`

## Server Sent Events

This package implements a simple server that generates Server Sent Events for your test pages to read. It streams fake data from [jsonplaceholder](https://jsonplaceholder.typicode.com) to your website on a semi-regular schedule.

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
This test suite was originally written by Ben Pate, and updated to run in nodeJS by Alex Petros.

It is inspired by [jsonplaceholder](https://jsonplaceholder.typicode.com) -- *"a free online REST API that you can use whenever you need some fake data."*
