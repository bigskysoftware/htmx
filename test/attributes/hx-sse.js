describe("hx-sse attribute", function() {

    function mockEventSource() {
        var listeners = {};
        var wasClosed = false;
        var mockEventSource = {
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
            }
        };
        return mockEventSource;
    }

    beforeEach(function() {
        this.server = makeServer();
        var eventSource = mockEventSource();
        this.eventSource = eventSource;
        clearWorkArea();
        htmx.createEventSource = function() { return eventSource };
    });
    afterEach(function() {
        this.server.restore();
        this.eventSource = mockEventSource();
        clearWorkArea();
    });

    it('handles basic sse triggering', function() {

        this.server.respondWith("GET", "/d1", "div1 updated");
        this.server.respondWith("GET", "/d2", "div2 updated");

        var div = make('<div hx-sse="connect:/foo">' +
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

        var div = make('<div hx-sse="connect:/foo">' +
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

        var div = make('<div hx-sse="connect:/foo"></div>' +
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

    it('is closed after removal', function() {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-sse="connect:/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>');
        div.click();
        this.server.respond();
        this.eventSource.wasClosed().should.equal(true)
    })

    it('is closed after removal with no close and activity', function() {
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-sse="connect:/foo">' +
            '<div id="d1" hx-trigger="sse:e1" hx-get="/d1">div1</div>' +
            '</div>');
        div.parentElement.removeChild(div);
        this.eventSource.sendEvent("e1")
        this.eventSource.wasClosed().should.equal(true)
    })

    it('swaps content properly on SSE swap', function() {
        var div = make('<div hx-sse="connect:/event_stream">\n' +
            '  <div id="d1" hx-sse="swap:e1"></div>\n' +
            '  <div id="d2" hx-sse="swap:e2"></div>\n' +
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
        var div = make('<div hx-sse="connect:/event_stream">\n' +
            '<div id="d1" hx-sse="swap:e1" hx-swap="outerHTML"></div>\n' +
            '</div>\n'
        )

        this.eventSource.sendEvent("e1", '<div id="d2" hx-sse="swap:e2"></div>')
        this.eventSource.sendEvent("e2", 'Event 2')
        byId("d2").innerText.should.equal("Event 2")
    })
});

