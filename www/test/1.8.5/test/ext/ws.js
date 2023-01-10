describe("web-sockets extension", function () {
    beforeEach(function () {
        this.server = makeServer();
        this.socketServer = new Mock.Server('ws://localhost:8080');
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
    });
    afterEach(function () {
        clearWorkArea();
        this.socketServer.close();
        this.socketServer.stop();
        this.clock.restore();
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

    it('handles message from the server', function () {
        var div = make('<div hx-ext="ws" ws-connect="ws://localhost:8080"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.tickMock();

        this.socketServer.emit('message', "<div id=\"d1\">replaced</div>")

        this.tickMock();
        byId("d1").innerHTML.should.equal("replaced");
        byId("d2").innerHTML.should.equal("div2");
    })

    it('raises event when socket connected', function () {
        var myEventCalled = false;
        var handler = function (evt) {
            myEventCalled = true;
        };
        htmx.on("htmx:wsOpen", handler)

        make('<div hx-ext="ws" ws-connect="ws://localhost:8080">');
        this.tickMock();
        myEventCalled.should.be.true;
        htmx.off("htmx:wsOpen", handler)
    })

    it('raises event when socket closed', function () {
        var myEventCalled = false;
        var handler = function (evt) {
            myEventCalled = true;
        };

        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="ws" ws-connect="ws://localhost:8080">');
        htmx.on(div, "htmx:wsClose", handler)
        this.tickMock();

        div.parentElement.removeChild(div);

        this.socketServer.emit('message', 'foo');
        this.tickMock();
        myEventCalled.should.be.true;
        this.tickMock();
        htmx.off(div, "htmx:wsClose", handler)
    })

    it('raises htmx:wsConfig when sending, allows message modification', function () {
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
});
