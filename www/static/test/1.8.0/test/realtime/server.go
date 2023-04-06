package main

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/benpate/derp"
	"github.com/benpate/htmlconv"
	"github.com/labstack/echo/v4"
	"github.com/pkg/browser"
	"golang.org/x/net/websocket"
)

type formatFunc func(interface{}) string

//go:embed static/data.json
var dataBytes []byte

func main() {

	rand.Seed(time.Now().UnixNano())

	/// Load configuration file
	var data map[string][]interface{}

	if err := json.Unmarshal(dataBytes, &data); err != nil {
		panic("Could not unmarshal data: " + err.Error())
	}

	/// Configure Web Server

	e := echo.New()

	e.Static("/", "static")
	e.Static("/htmx", "../../src")

	// Web Socket Handlers
	e.GET("/echo", wsEcho)
	e.GET("/heartbeat", wsHeartbeat)

	// SSE - JSON Event Streams
	e.GET("/posts.json", handleStream(makeStream(data["posts"], jsonFormatFunc)))
	e.GET("/comments.json", handleStream(makeStream(data["comments"], jsonFormatFunc)))
	e.GET("/photos.json", handleStream(makeStream(data["comments"], jsonFormatFunc)))
	e.GET("/albums.json", handleStream(makeStream(data["albums"], jsonFormatFunc)))
	e.GET("/todos.json", handleStream(makeStream(data["todos"], jsonFormatFunc)))
	e.GET("/users.json", handleStream(makeStream(data["users"], jsonFormatFunc)))

	// SSE - HTML Event Streams (with HTMX extension tags)
	e.GET("/posts.html", handleStream(makeStream(data["posts"], postTemplate())))
	e.GET("/comments.html", handleStream(makeStream(data["comments"], commentTemplate())))
	e.GET("/photos.json", handleStream(makeStream(data["comments"], jsonFormatFunc)))
	e.GET("/albums.html", handleStream(makeStream(data["albums"], albumTemplate())))
	e.GET("/todos.html", handleStream(makeStream(data["todos"], todoTemplate())))
	e.GET("/users.html", handleStream(makeStream(data["users"], userTemplate())))

	e.OPTIONS("/page/random", func(ctx echo.Context) error {
		ctx.Response().Header().Add("Connection", "keep-alive")                 // CORS headers
		ctx.Response().Header().Add("Access-Control-Allow-Origin", "*")         // CORS headers
		ctx.Response().Header().Add("Access-Control-Allow-Methods", "GET")      // CORS headers
		ctx.Response().Header().Add("Access-Control-Allow-Credentials", "true") // CORS headers
		ctx.Response().Header().Add("Access-Control-Allow-Headers", "*")        // CORS headers
		ctx.NoContent(200)
		return nil
	})

	e.GET("/page/random", func(ctx echo.Context) error {
		return pageHandler(ctx, rand.Int())
	})

	e.GET("/page/:number", func(ctx echo.Context) error {

		pageNumber, err := strconv.Atoi(ctx.Param("number"))

		if err != nil {
			pageNumber = 1
		}

		return pageHandler(ctx, pageNumber)
	})

	e.GET("/revealed/:number", func(ctx echo.Context) error {

		pageNumber, err := strconv.Atoi(ctx.Param("number"))

		if err != nil {
			pageNumber = 1
		}

		thisPage := strconv.Itoa(pageNumber)
		nextPage := strconv.Itoa(pageNumber + 1)
		random := strconv.Itoa(rand.Int())

		template := htmlconv.CollapseWhitespace(`
			<div class="container" hx-get="/revealed/%s" hx-swap="afterend limit:10" hx-trigger="revealed">
				This is page %s<br><br>
				Randomly generated <b>HTML</b> %s<br><br>
				I wish I were a haiku.
			</div>`)

		content := fmt.Sprintf(template, nextPage, thisPage, random)
		return ctx.HTML(200, content)
	})

	// On first run, open web browser in admin mode
	browser.OpenURL("http://localhost/")

	e.Logger.Fatal(e.Start(":80"))
}

/*******************************************
 * Web Socket Handlers
 *******************************************/

func wsHeartbeat(c echo.Context) error {

	handler := websocket.Handler(func(ws *websocket.Conn) {

		defer ws.Close()

		for i := 0; ; i = i + 1 {

			time.Sleep(1 * time.Second)

			random := rand.Int()
			message := `<div id="idMessage" hx-swap-oob="true">Message ` + strconv.Itoa(i) + `: ` + strconv.Itoa(random) + `</div>`

			if err := websocket.Message.Send(ws, message); err != nil {
				c.Logger().Error("send", err)
				return
			}
		}
	})

	handler.ServeHTTP(c.Response(), c.Request())
	return nil
}

func wsEcho(c echo.Context) error {

	handler := websocket.Handler(func(ws *websocket.Conn) {

		defer ws.Close()

		for {

			msg := ""

			if err := websocket.Message.Receive(ws, &msg); err != nil {
				c.Logger().Error("receive", err)
				return
			}

			response := `<div id="idMessage" hx-swap-oob="true">` + msg + `</div>`

			if err := websocket.Message.Send(ws, response); err != nil {
				c.Logger().Error("send", err)
				return
			}
		}
	})

	handler.ServeHTTP(c.Response(), c.Request())
	return nil
}

/*******************************************
 * SSE Handlers
 *******************************************/

func pageHandler(ctx echo.Context, page int) error {

	pageString := strconv.Itoa(page)
	random := strconv.Itoa(rand.Int())

	template := htmlconv.CollapseWhitespace(`
		<div>
			This is page %s<br><br>
			Randomly generated <b>HTML</b> %s<br><br>
			I wish I were a haiku.
		</div>`)

	content := fmt.Sprintf(template, pageString, random)
	ctx.Response().Header().Add("Access-Control-Allow-Origin", "*")         // CORS headers
	ctx.Response().Header().Add("Access-Control-Allow-Methods", "GET")      // CORS headers
	ctx.Response().Header().Add("Access-Control-Allow-Headers", "*")        // CORS headers
	ctx.Response().Header().Add("Access-Control-Allow-Credentials", "true") // CORS headers
	return ctx.HTML(200, content)
}

func postTemplate() formatFunc {

	// return templateFormatFunc("post.html", "DDD")
	return templateFormatFunc("post.html", `
		<div>
			<div class="bold">Post: {{.title}}</div>
			<div>{{.body}}</div>
			<div>id: {{.id}}</div>
			<div>user: {{.userId}}</div>
			<div>event: [[eventType]]</div>
		</div>`)
}

func commentTemplate() formatFunc {

	// return templateFormatFunc("comment.html", "CCC")
	return templateFormatFunc("comment.html", `
		<div>
			<div class="bold">Comment: {{.name}}</div>
			<div>{{.email}}</div>
			<div>{{.body}}</div>
			<div>event: [[eventType]]</div>
		</div>`)
}

func albumTemplate() formatFunc {

	return templateFormatFunc("album.html", `
		<div>
			<div class="bold">Album: {{.title}}</div>
			<div>id: {{.id}}</div>
			<div>event: [[eventType]]</div>
		</div>`)
}

func todoTemplate() formatFunc {

	return templateFormatFunc("todo.html", `
		<div>
			<div class="bold">ToDo:{{.id}}: {{.title}}</div>
			<div>complete? {{.completed}}</div>
			<div>event: [[eventType]]</div>
		</div>`)
}

func userTemplate() formatFunc {

	return templateFormatFunc("user.html", `
		<div>
			<div class="bold">User: {{.name}} / {{.username}}</div>
			<div>{{.email}}</div>
			<div>{{.address.street}} {{.address.suite}}<br>{{.address.city}}, {{.address.zipcode}}</div>
			<div>event: [[eventType]]</div>
		</div>`)
}

// handleStream creates an echo.HandlerFunc that streams events from an eventSource to client browsers
func handleStream(eventSource chan string) echo.HandlerFunc {

	return func(ctx echo.Context) error {

		w := ctx.Response().Writer

		// Make sure that the writer supports flushing.
		f, ok := w.(http.Flusher)

		if !ok {
			return derp.New(500, "handler.ServerSentEvent", "Streaming Not Supported")
		}

		c := ctx.Request().Context()

		// Set the headers related to event streaming.
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Transfer-Encoding", "chunked")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		types := []string{}

		if param := ctx.QueryParam("types"); param != "" {
			types = strings.Split(param, ",")
		}

		// Don't close the connection, instead loop endlessly.
		for {

			select {
			case <-c.Done():
				log.Println("HTTP connection just closed.")
				return nil

			case message := <-eventSource:

				var eventType string

				if len(types) > 0 {
					eventType = types[rand.Int()%len(types)]
					fmt.Fprintf(w, "event: %s\n", eventType)
				}

				message = strings.Replace(message, "\n", " ", -1)
				message = strings.Replace(message, "[[eventType]]", eventType, 1)

				fmt.Fprintf(w, "data: %s\n\n", message)

				// Flush the response.  This is only possible if the response supports streaming.
				f.Flush()
			}
		}
	}
}

// makeStream loops through  an array of interfaces
func makeStream(data []interface{}, format formatFunc) chan string {

	result := make(chan string)

	go func() {

		for {
			for _, record := range data {
				result <- format(record)
				time.Sleep((time.Duration(rand.Int() % 500)) * time.Millisecond)

			}
		}
	}()

	return result
}

func jsonFormatFunc(data interface{}) string {
	result, _ := json.Marshal(data)
	return string(result)
}

func templateFormatFunc(name string, text string) formatFunc {

	f, _ := template.New(name).Parse(htmlconv.CollapseWhitespace(text))

	return func(data interface{}) string {

		var buffer bytes.Buffer

		f.Execute(&buffer, data)

		return buffer.String()
	}
}
