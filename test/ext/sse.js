describe("sse extension", function() {

    function mockEventSource() {
        var listeners = {};
        var wasClosed = false;
        var url;
        var mockEventSource = {
            _listeners: listeners,
            removeEventListener: function(name, l) {
                listeners[name] = listeners[name].filter(function(elt, idx, arr) {
                    if (arr[idx] === l) {
                        return false;
                    }
                    return true;
                })
            },
            addEventListener: function(message, l) {
                if (listeners[message] === undefined) {
                    listeners[message] = [];
                }
                listeners[message].push(l)
            },
            sendEvent: function(eventName, data) {
                var eventListeners = listeners[eventName];
                if (eventListeners) {
                    eventListeners.forEach(function(listener) {
                        var event = htmx._("makeEvent")(eventName);
                        event.data = data;
                        listener(event);
                    })
                }
            },
            close: function() {
                wasClosed = true;
            },
            wasClosed: function() {
                return wasClosed;
            },
            connect: function(url) {
                this.url = url
            }
        };
        return mockEventSource;
    }

    beforeEach(function() {
        this.server = makeServer();
        var eventSource = mockEventSource();
        this.eventSource = eventSource;
        clearWorkArea();
        htmx.createEventSource = function(url) {
            eventSource.connect(url);
            return eventSource;
        };
    });
    afterEach(function() {
        this.server.restore();
        this.eventSource = mockEventSource();
        clearWorkArea();
    });

    it('handles basic sse triggering', function() {

        this.server.respondWith("GET", "/d1", "div1 updated");
        this.server.respondWith("GET", "/d2", "div2 updated");

        var div = make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '<div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div>' +
            '</div>');

        this.eventSource.sendEvent("e1");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1 updated");
        byId("d2").innerHTML.should.equal("div2");

        this.eventSource.sendEvent("e2");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1 updated");
        byId("d2").innerHTML.should.equal("div2 updated");
    })

    it('does not trigger events that arent named', function() {

        this.server.respondWith("GET", "/d1", "div1 updated");

        var div = make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>');

        this.eventSource.sendEvent("foo");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1");

        this.eventSource.sendEvent("e2");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1");

        this.eventSource.sendEvent("e1");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1 updated");
    })

    it('does not trigger events not on descendents', function() {

        this.server.respondWith("GET", "/d1", "div1 updated");

        var div = make('<div hx-ext="sse" sse-connect="/foo"></div>' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>');

        this.eventSource.sendEvent("foo");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1");

        this.eventSource.sendEvent("e2");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1");

        this.eventSource.sendEvent("e1");
        this.server.respond();
        byId("d1").innerHTML.should.equal("div1");
    })

    it('is closed after removal, hx-trigger', function() {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>');
        div.click();
        this.server.respond();
        this.eventSource.wasClosed().should.equal(true)
    })

    it('is closed after removal, hx-swap', function() {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-swap="e1" hx-get="/d1">div1</div>' +
            '</div>');
        div.click();
        this.server.respond();
        this.eventSource.wasClosed().should.equal(true)
    })

    it('is closed after removal with no close and activity, hx-trigger', function() {
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>');
        div.parentElement.removeChild(div);
        this.eventSource.sendEvent("e1")
        this.eventSource.wasClosed().should.equal(true)
    })

    it('is not listening for events after hx-swap element removed', function() {
        var div = make('<div hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" hx-swap="outerHTML" sse-swap="e1">div1</div>' +
            '</div>');
        this.eventSource._listeners["e1"].should.be.lengthOf(1)
        div.removeChild(byId("d1"));
        this.eventSource.sendEvent("e1", "Test")
        this.eventSource._listeners["e1"].should.be.empty
    })

    // sse and hx-trigger handlers are distinct
    it('is closed after removal with no close and activity, sse-swap', function() {
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ext="sse" sse-connect="/foo">' +
            '<div id="d1" sse-swap="e1" hx-get="/d1">div1</div>' +
            '</div>');
        div.parentElement.removeChild(div);
        this.eventSource.sendEvent("e1")
        this.eventSource.wasClosed().should.equal(true)
    })

    it('swaps content properly on SSE swap', function() {
        var div = make('<div hx-ext="sse" sse-connect="/event_stream">\n' +
            '  <div id="d1" sse-swap="e1"></div>\n' +
            '  <div id="d2" sse-swap="e2"></div>\n' +
            '</div>\n');
        byId("d1").innerText.should.equal("")
        byId("d2").innerText.should.equal("")
        this.eventSource.sendEvent("e1", "Event 1")
        byId("d1").innerText.should.equal("Event 1")
        byId("d2").innerText.should.equal("")
        this.eventSource.sendEvent("e2", "Event 2")
        byId("d1").innerText.should.equal("Event 1")
        byId("d2").innerText.should.equal("Event 2")
    })

    it('swaps swapped in content', function() {
        var div = make('<div hx-ext="sse" sse-connect="/event_stream">\n' +
            '<div id="d1" sse-swap="e1" hx-swap="outerHTML"></div>\n' +
            '</div>\n'
        )

        this.eventSource.sendEvent("e1", '<div id="d2" sse-swap="e2"></div>')
        this.eventSource.sendEvent("e2", 'Event 2')
        byId("d2").innerText.should.equal("Event 2")
    })

    it('works in a child of an hx-ext="sse" element', function() {
        var div = make('<div hx-ext="sse">\n' +
            '<div id="d1" sse-connect="/event_stream" sse-swap="e1">div1</div>\n' +
            '</div>\n'
        )
        this.eventSource.sendEvent("e1", "Event 1")
        byId("d1").innerText.should.equal("Event 1")
    })

    it('only adds sseEventSource to elements with sse-connect', function() {
        var div = make('<div hx-ext="sse" sse-connect="/event_stream" >\n' +
            '<div id="d1" sse-swap="e1"></div>\n' +
            '</div>');

        (byId('d1')["htmx-internal-data"].sseEventSource == undefined).should.be.true

        // Even when content is swapped in	
        this.eventSource.sendEvent("e1", '<div id="d2" sse-swap="e2"></div>');

        (byId('d2')["htmx-internal-data"].sseEventSource == undefined).should.be.true
    })

    it('initializes connections in swapped content', function() {
        this.server.respondWith("GET", "/d1", '<div><div sse-connect="/foo"><div id="d2" hx-trigger="sse:e2" hx-get="/d2">div2</div></div></div>');
        this.server.respondWith("GET", "/d2", "div2 updated");

        var div = make('<div hx-ext="sse" hx-get="/d1"></div>');
        div.click();

        this.server.respond();
        this.eventSource.sendEvent("e2");
        this.server.respond();

        byId("d2").innerHTML.should.equal("div2 updated");
    })

    it('creates an eventsource on elements with sse-connect', function() {
        var div = make('<div hx-ext="sse"><div id="d1"sse-connect="/event_stream"></div></div>');

        (byId("d1")['htmx-internal-data'].sseEventSource == undefined).should.be.false;

    })

    it('raises htmx:sseBeforeMessage when receiving message from the server', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
        }

        htmx.on("htmx:sseBeforeMessage", handle)

        var div = make('<div hx-ext="sse" sse-connect="/event_stream" sse-swap="e1"></div>');

        this.eventSource.sendEvent("e1", '<div id="d1"></div>')

        myEventCalled.should.be.true;

        htmx.off("htmx:sseBeforeMessage", handle)
    })

    it('cancels swap when htmx:sseBeforeMessage was cancelled', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
            evt.preventDefault();
        }

        htmx.on("htmx:sseBeforeMessage", handle)

        var div = make('<div hx-ext="sse" sse-connect="/event_stream" sse-swap="e1"><div id="d1">div1</div></div>');

        this.eventSource.sendEvent("e1", '<div id="d1">replaced</div>')

        myEventCalled.should.be.true;

        byId("d1").innerHTML.should.equal("div1");

        htmx.off("htmx:sseBeforeMessage", handle)
    })

    it('raises htmx:sseMessage when message was completely processed', function () {
        var myEventCalled = false;

        function handle(evt) {
            myEventCalled = true;
        }

        htmx.on("htmx:sseMessage", handle)

        var div = make('<div hx-ext="sse" sse-connect="/event_stream" sse-swap="e1"><div id="d1">div1</div></div>');

        this.eventSource.sendEvent("e1", '<div id="d1">replaced</div>')

        myEventCalled.should.be.true;
        byId("d1").innerHTML.should.equal("replaced");

        htmx.off("htmx:sseMessage", handle)
    })

});

