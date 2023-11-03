describe("web-sockets extension", function () {
    // mock-socket isn't IE11 compatible, thus this handmade one
    // Using the same syntax as the library, so the initial tests didn't require changes to work
    // TODO when we get rid of IE11 for htmx2, replace this by mock-socket since it ofc doesn't implement every feature
    function mockWebsocket() {
        var mockSocketClient = {
            addEventListener: function (event, handler) {
                var handlers = this._listeners[event] || []
                handlers.push(handler)
                this._listeners[event] = handlers
            },
            on: function (event, handler) {
                this.addEventListener(event, handler)
            },
            send: function (data) {
                mockSocketServer._fireEvent("message", data)
            },
            connect: function () {
                this._open = true
                mockSocketServer._fireEvent("connection", mockSocketServer)
                setTimeout(function () {
                    this._fireEvent("open", {type: "open"})
                }.bind(this), 2)
            },
            close: function () {
                if (this._open) {
                    this._open = false
                    this._fireEvent("close", {type: "close", code: 0})
                }
            },
            _listeners: {},
            _fireEvent: function (event, data) {
                var handlers = this._listeners[event] || []
                if (typeof this["on" + event] === "function") {
                    handlers.push(this["on" + event])
                }
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i](data)
                }
            },
            _open: false,
        }
        var mockSocketServer = {
            addEventListener: function (event, handler) {
                var handlers = this._listeners[event] || []
                handlers.push(handler)
                this._listeners[event] = handlers
            },
            on: function (event, handler) {
                this.addEventListener(event, handler)
            },
            close: function () {
                mockSocketClient.close()
            },
            stop: function () {
            },
            emit: function (event, data) {
                mockSocketClient._fireEvent(event, {data: data})
            },
            clients: function () { // Replicate old mock-socket syntax to avoid huge file diff to merge
                return mockSocketClient._open ? [1] : []
            },
            _listeners: {},
            _fireEvent: function (event, data) {
                var handlers = this._listeners[event] || []
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i](data)
                }
            },
        }
        return {
            client: mockSocketClient,
            server: mockSocketServer,
        }
    }

    beforeEach(function () {
        this.server = makeServer();
        // this.socketServer = new Mock.Server('ws://localhost:8080');
        var mockedSocket = mockWebsocket();
        this.socketServer = mockedSocket.server;
        this.messages = [];
        this.clock = sinon.useFakeTimers();

        this.socketServer.on('connection', function (socket) {
            socket.on('message', function (event) {
                this.messages.push(event)
            }.bind(this))
        }.bind(this))

        /* Mock socket library is cool, but it uses setTimeout to emulate asynchronous nature of the network.
        * To avoid unexpected behavior, make sure to call this method whenever socket would have a network communication,
        * e.g., when connecting, disconnecting, sending messages. */
        this.tickMock = function () {
            this.clock.tick(5);
        }

        clearWorkArea();
        this.oldCreateWebSocket = htmx.createWebSocket;
        htmx.createWebSocket = function () {
            mockedSocket.client.connect()
            return mockedSocket.client
        };
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        this.socketServer.close();
        this.socketServer.stop();
        this.clock.restore();
        htmx.createWebSocket = this.oldCreateWebSocket;
    });

    it('can establish connection with the server', function () {
        this.socketServer.clients().length.should.equal(0);
        make('<div hx-ext="ws" ws-connect="ws://localhost:8080">');
        this.socketServer.clients().length.should.equal(1);

        this.tickMock();
    })

    it('is closed after removal by swap', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="ws" ws-connect="ws://localhost:8080">');
        this.tickMock();

        this.socketServer.clients().length.should.equal(1);

        div.click();
        this.server.respond();

        this.tickMock();

        this.socketServer.clients().length.should.equal(0);
    })

    it('is closed after removal by js when message is received', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="ws" ws-connect="ws://localhost:8080">');
        this.tickMock();

        this.socketServer.clients().length.should.equal(1);
        div.parentElement.removeChild(div);

        this.socketServer.emit('message', 'foo');
        this.tickMock();

        this.socketServer.clients().length.should.equal(0);
    })

    it('sends data to the server', function () {
        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
    })

    it('sends data to the server with specific trigger', function () {
        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div hx-trigger="click" ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
    })

    it('sends data to the server with polling trigger', function () {
        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div hx-trigger="every 1s" ws-send id="d1">div1</div></div>');
        this.tickMock();
        this.clock.tick(2000);

        byId("d1").click();

        this.tickMock();

        this.messages.length.should.equal(2);
    })

    it('sends expected headers to the server', function () {
        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><button hx-trigger="click" hx-target="#target" ws-send id="d1" name="d1-name">div1</button><output id="target"></output></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        var message = JSON.parse(this.messages[0]);
        var headers = message.HEADERS;

        console.log(headers);

        headers['HX-Request'].should.be.equal('true');
        headers['HX-Current-URL'].should.be.equal(document.location.href)
        headers['HX-Trigger'].should.be.equal('d1');
        headers['HX-Trigger-Name'].should.be.equal('d1-name');
        headers['HX-Target'].should.be.equal('target');
    })

    it('handles message from the server', function () {
        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.tickMock();

        this.socketServer.emit('message', "<div id=\"d1\">replaced</div>");

        this.tickMock();
        byId("d1").innerHTML.should.equal("replaced");
        byId("d2").innerHTML.should.equal("div2");
    })

    it('raises lifecycle events (connecting, open, close) in correct order', function () {
        var handledEventTypes = [];
        var handler = function (evt) { handledEventTypes.push(evt.detail.event.type) };

        htmx.on("htmx:wsConnecting", handler);

        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="ws" ws-connect="ws://localhost:8080">');

        htmx.on(div, "htmx:wsOpen", handler);
        htmx.on(div, "htmx:wsClose", handler);

        this.tickMock();

        div.parentElement.removeChild(div);
        this.socketServer.emit('message', 'foo');

        this.tickMock();

        handledEventTypes.should.eql(['connecting', 'open', 'close']);

        this.tickMock();

        htmx.off("htmx:wsConnecting", handler);
        htmx.off(div, "htmx:wsOpen", handler);
        htmx.off(div, "htmx:wsClose", handler);
    })

    it('raises htmx:wsConfigSend when sending, allows message modification', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
            evt.detail.parameters.foo = "bar";
        }

        htmx.on("htmx:wsConfigSend", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        myEventCalled.should.be.true;
        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        htmx.off("htmx:wsConfigSend", handle)
    })

    it('passes socketWrapper to htmx:wsConfigSend', function () {
        var socketWrapper = null;

        function handle(evt) {
            evt.preventDefault();
            socketWrapper = evt.detail.socketWrapper;
            socketWrapper.send(JSON.stringify({foo: 'bar'}), evt.detail.elt)
        }

        htmx.on("htmx:wsConfigSend", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        socketWrapper.should.not.be.null;
        socketWrapper.send.should.be.a('function');
        socketWrapper.sendImmediately.should.be.a('function');
        socketWrapper.queue.should.be.an('array');

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')

        htmx.off("htmx:wsConfigSend", handle);
    })

    it('cancels sending when htmx:wsConfigSend is cancelled', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
            evt.preventDefault();
        }

        htmx.on("htmx:wsConfigSend", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.messages.length.should.equal(0);

        myEventCalled.should.be.true;

        htmx.off("htmx:wsConfigSend", handle);
    })

    it('raises htmx:wsBeforeSend when sending', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
        }

        htmx.on("htmx:wsBeforeSend", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        myEventCalled.should.be.true;
        this.messages.length.should.equal(1);
        htmx.off("htmx:wsBeforeSend", handle)
    })

    it('cancels sending when htmx:wsBeforeSend is cancelled', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
            evt.preventDefault();
        }

        htmx.on("htmx:wsBeforeSend", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        myEventCalled.should.be.true;
        this.messages.length.should.equal(0);
        htmx.off("htmx:wsBeforeSend", handle)
    })

    it('raises htmx:wsAfterSend when sending', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
        }

        htmx.on("htmx:wsAfterSend", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div ws-send id="d1">div1</div></div>');
        this.tickMock();

        byId("d1").click();

        this.tickMock();

        myEventCalled.should.be.true;
        this.messages.length.should.equal(1);
        htmx.off("htmx:wsAfterSend", handle)
    })

    it('raises htmx:wsBeforeMessage when receiving message from the server', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
        }

        htmx.on("htmx:wsBeforeMessage", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.tickMock();

        this.socketServer.emit('message', "<div id=\"d1\">replaced</div>")

        this.tickMock();
        myEventCalled.should.be.true;

        htmx.off("htmx:wsBeforeMessage", handle)
    })

    it('cancels swap when htmx:wsBeforeMessage was cancelled', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
            evt.preventDefault();
        }

        htmx.on("htmx:wsBeforeMessage", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.tickMock();

        this.socketServer.emit('message', "<div id=\"d1\">replaced</div>")

        this.tickMock();
        myEventCalled.should.be.true;

        byId("d1").innerHTML.should.equal("div1");
        byId("d2").innerHTML.should.equal("div2");

        htmx.off("htmx:wsBeforeMessage", handle)
    })

    it('raises htmx:wsAfterMessage when message was completely processed', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
        }

        htmx.on("htmx:wsAfterMessage", handle)

        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.tickMock();

        this.socketServer.emit('message', "<div id=\"d1\">replaced</div>")

        this.tickMock();
        myEventCalled.should.be.true;

        htmx.off("htmx:wsAfterMessage", handle)
    })

    it('sends data to the server with non-htmx form + submit button & value', function () {
        make('<form hx-ext="ws" ws-connect="ws://localhost:8080" ws-send>' +
            '<input type="hidden" name="foo" value="bar">' +
            '<button id="b1" type="submit" name="action" value="A">A</button>' +
            '<button id="b2" type="submit" name="action" value="B">B</button>' +
            '</form>');
        this.tickMock();

        byId("b1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        this.messages[0].should.contains('"action":"A"')

        byId("b2").click();

        this.tickMock();

        this.messages.length.should.equal(2);
        this.messages[1].should.contains('"foo":"bar"')
        this.messages[1].should.contains('"action":"B"')
    })

    it('sends data to the server with non-htmx form + submit input & value', function () {
        make('<form hx-ext="ws" ws-connect="ws://localhost:8080" ws-send>' +
            '<input type="hidden" name="foo" value="bar">' +
            '<input id="b1" type="submit" name="action" value="A">' +
            '<input id="b2" type="submit" name="action" value="B">' +
            '</form>');
        this.tickMock();

        byId("b1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        this.messages[0].should.contains('"action":"A"')

        byId("b2").click();

        this.tickMock();

        this.messages.length.should.equal(2);
        this.messages[1].should.contains('"foo":"bar"')
        this.messages[1].should.contains('"action":"B"')
    })

    it('sends data to the server with child non-htmx form + submit button & value', function () {
        make('<div hx-ext="ws" ws-connect="ws://localhost:8080">' +
            '<form ws-send>' +
            '<input type="hidden" name="foo" value="bar">' +
            '<button id="b1" type="submit" name="action" value="A">A</button>' +
            '<button id="b2" type="submit" name="action" value="B">B</button>' +
            '</form>' +
            '</div>');
        this.tickMock();

        byId("b1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        this.messages[0].should.contains('"action":"A"')

        byId("b2").click();

        this.tickMock();

        this.messages.length.should.equal(2);
        this.messages[1].should.contains('"foo":"bar"')
        this.messages[1].should.contains('"action":"B"')
    })

    it('sends data to the server with child non-htmx form + submit input & value', function () {
        make('<div hx-ext="ws" ws-connect="ws://localhost:8080">' +
            '<form ws-send>' +
            '<input type="hidden" name="foo" value="bar">' +
            '<input id="b1" type="submit" name="action" value="A">' +
            '<input id="b2" type="submit" name="action" value="B">' +
            '</form>' +
            '</div>');
        this.tickMock();

        byId("b1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        this.messages[0].should.contains('"action":"A"')

        byId("b2").click();

        this.tickMock();

        this.messages.length.should.equal(2);
        this.messages[1].should.contains('"foo":"bar"')
        this.messages[1].should.contains('"action":"B"')
    })

    it('sends data to the server with external non-htmx form + submit button & value', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }

        make('<div hx-ext="ws" ws-connect="ws://localhost:8080">' +
            '<form ws-send id="form">' +
            '<input type="hidden" name="foo" value="bar">' +
            '</form>' +
            '</div>' +
            '<button id="b1" form="form" type="submit" name="action" value="A">A</button>' +
            '<button id="b2" form="form" type="submit" name="action" value="B">B</button>');
        this.tickMock();

        byId("b1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        this.messages[0].should.contains('"action":"A"')

        byId("b2").click();

        this.tickMock();

        this.messages.length.should.equal(2);
        this.messages[1].should.contains('"foo":"bar"')
        this.messages[1].should.contains('"action":"B"')
    })

    it('sends data to the server with external non-htmx form + submit input & value', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }

        make('<div hx-ext="ws" ws-connect="ws://localhost:8080">' +
            '<form ws-send id="form">' +
            '<input type="hidden" name="foo" value="bar">' +
            '</form>' +
            '</div>' +
            '<input id="b1" form="form" type="submit" name="action" value="A">' +
            '<input id="b2" form="form" type="submit" name="action" value="B">');
        this.tickMock();

        byId("b1").click();

        this.tickMock();

        this.messages.length.should.equal(1);
        this.messages[0].should.contains('"foo":"bar"')
        this.messages[0].should.contains('"action":"A"')

        byId("b2").click();

        this.tickMock();

        this.messages.length.should.equal(2);
        this.messages[1].should.contains('"foo":"bar"')
        this.messages[1].should.contains('"action":"B"')
    })

    describe("Send immediately", function() {
        function checkCallForWsBeforeSend(spy, wrapper, message, target) {
            // Utility function to always check the same for htmx:wsBeforeSend caught by a spy
            spy.calledOnce.should.be.true;
            var call = spy.getCall(0);
            call.args.length.should.equal(1);
            var arg = call.args[0];
            arg.target.should.equal(target);
            arg.detail.socketWrapper.should.equal(wrapper);
            arg.detail.message.should.equal(message);
        }
        it('triggers wsBeforeSend on body if provided to sendImmediately', function (done) {
            var myEventCalled = sinon.spy();
            var message = '{"foo":"bar"}';
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                window.document.body.addEventListener("htmx:wsBeforeSend", myEventCalled)
                try {
                    socketWrapper.sendImmediately(message, window.document.body)
                    checkCallForWsBeforeSend(myEventCalled, socketWrapper, message, window.document.body)
                } finally {
                    window.document.body.removeEventListener("htmx:wsBeforeSend", myEventCalled)
                }
                done()
            }
            try {
                window.document.addEventListener("htmx:wsOpen", handler)
                
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
            
        })
        it('triggers wsBeforeSend on any send element provided to sendImmediately', function (done) {
            var myEventCalled = sinon.spy();
            var message = '{"a":"b"}';
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                var id1 = byId("d1");
                id1.addEventListener("htmx:wsBeforeSend", myEventCalled)
                try {
                    socketWrapper.sendImmediately(message, d1)
                    checkCallForWsBeforeSend(myEventCalled, socketWrapper, message, d1)
                } finally {
                    id1.removeEventListener("htmx:wsBeforeSend", myEventCalled)
                }
                done()
            }

            window.document.addEventListener("htmx:wsOpen", handler)
            try {
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
        
        })
        it('triggers wsAfterSend on body if provided to sendImmediately', function (done) {
            var myEventCalled = sinon.spy();
            var message = '{"foo":"bar"}';
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                window.document.body.addEventListener("htmx:wsAfterSend", myEventCalled)
                try {
                    socketWrapper.sendImmediately(message, window.document.body)
                    checkCallForWsBeforeSend(myEventCalled, socketWrapper, message, window.document.body)
                } finally {
                    window.document.body.removeEventListener("htmx:wsAfterSend", myEventCalled)
                }
                done()
            }
            try {
                window.document.addEventListener("htmx:wsOpen", handler)
                
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
            
        })
        it('triggers wsAfterSend on any send element provided to sendImmediately', function (done) {
            var myEventCalled = sinon.spy();
            var message = '{"a":"b"}';
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                var id1 = byId("d1");
                id1.addEventListener("htmx:wsAfterSend", myEventCalled)
                try {
                    socketWrapper.sendImmediately(message, d1)
                    checkCallForWsBeforeSend(myEventCalled, socketWrapper, message, d1)
                } finally {
                    id1.removeEventListener("htmx:wsAfterSend", myEventCalled)
                }
                done()
            }

            window.document.addEventListener("htmx:wsOpen", handler)
            try {
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
        
        })
        it('sends message if event is not prevented', function (done) {
            var message = '{"a":"b"}';
            var noop = function() {}
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                var id1 = byId("d1");
                id1.addEventListener("htmx:wsBeforeSend", noop)
                try {
                    socketWrapper.sendImmediately(message, d1)
                    this.tickMock();
                    this.messages.should.eql([message])
                } finally {
                    id1.removeEventListener("htmx:wsBeforeSend", noop)
                }
                done()
            }.bind(this)

            window.document.addEventListener("htmx:wsOpen", handler)
            try {
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
        })
        it('sends message if no sending element is provided', function (done) {
            var message = '{"a":"b"}';
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                socketWrapper.sendImmediately(message)
                this.tickMock();
                this.messages.should.eql([message])
                done()
            }.bind(this)

            window.document.addEventListener("htmx:wsOpen", handler)
            try {
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
        })
        it('sends message if sending element has no event listener for beforeSend', function (done) {
            var message = '{"a":"b"}';
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                var d1 = byId("d1");
                socketWrapper.sendImmediately(message, d1)
                this.tickMock();
                this.messages.should.eql([message])
                done()
            }.bind(this)

            window.document.addEventListener("htmx:wsOpen", handler)
            try {
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
        })
        it('does not send message if beforeSend is prevented', function (done) {
            var message = '{"a":"b"}';
            var eventPrevented = function(e) {e.preventDefault()}
            var handler = function(e){
                var socketWrapper = e.detail.socketWrapper;
                var id1 = byId("d1");
                id1.addEventListener("htmx:wsBeforeSend", eventPrevented)
                try {
                    socketWrapper.sendImmediately(message, d1)
                    this.tickMock();
                    this.messages.should.eql([])
                } finally {
                    id1.removeEventListener("htmx:wsBeforeSend", eventPrevented)
                }
                done()
            }.bind(this)

            window.document.addEventListener("htmx:wsOpen", handler)
            try {
                var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div></div>');
                this.tickMock();
            } finally {
                window.document.removeEventListener("htmx:wsOpen", handler)
            }
        
        })
    })

    
});
