# Server Sent Events - Test Server

This package implements a simple server that generates Server Sent Events for your test pages to read.  It streams fake data from [jsonplaceholder](https://jsonplaceholder.typicode.com) to your website on a semi-regular schedule.

## How to Use This Server

1. If you do not already have Go (version 1.17 or higher) installed on your machine, you can download an installation for your machine from [the Go website](https://golang.org)

2. Open up a terminal window and navigate to this directory.  Start up the WebSocket server by typing `go run server.go`

3. Open your web browser to [http://localhost](http://localhost) to run the manual tests.  Huzzah!

## JSON Event Streams

Streams random JSON records every second (or so) to your client.

* `/posts.json`
* `/comments.json`
* `/albums.json`
* `/photos.json`
* `/todos.json`
* `/users.json`

## HTML Event Streams

Streams random HTML fragments every second (or so) to your client.  These streams are used by the manual htmx tests.

* `/posts.html`
* `/comments.html`
* `/albums.html`
* `/photos.html`
* `/todos.html`
* `/users.html`

## Specifying Event Types

You can add a `type=` parameter to your URLs to specify the event name(s) that you want the server to use.  You can specify multiple names in a comma separated list and the server will alternate between them.  If you do not specify a type, then the default message name of `message` is used.

## About

This server is also published independently at [https://github.com/benpate/sseplaceholder]

It is inspired by [jsonplaceholder](https://jsonplaceholder.typicode.com) -- *"a free online REST API that you can use whenever you need some fake data."*
