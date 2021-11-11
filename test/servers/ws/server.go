package main

import (
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

func wsEcho(c echo.Context) error {

	handler := websocket.Handler(func(ws *websocket.Conn) {

		defer ws.Close()

		/*
			var done chan<- bool

			defer func() {
				close(done)
				ws.Close()
			}()

			go func() {
				for i := 0; ; i = i + 1 {
					time.Sleep(10 * time.Second)
					if done == nil {
						return
					}
					websocket.Message.Send(ws, "ping #"+strconv.Itoa(i))
				}
			}()
		*/
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

	e.Static("/", "../static")
	e.Static("/htmx", "../../../src")

	e.GET("/echo", wsEcho)
	e.Logger.Fatal(e.Start(":1323"))
}
