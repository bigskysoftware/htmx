package main

import (
	"math/rand"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

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

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Static("/", "./static")
	e.Static("/htmx", "../../../src")

	e.GET("/echo", wsEcho)
	e.GET("/heartbeat", wsHeartbeat)
	e.Logger.Fatal(e.Start(":80"))
}
