describe("hx-sse attribute", function() {

    function mockEventSource() {
        var listeners = {};
        var mockEventSource = {
            addEventListener : function(message, l) {
                listeners[message] = l;
            },
            sendEvent : function(event) {
                var listener = listeners[event];
                if(listener){
                    listener();
                }
            },
        };
        return mockEventSource;
    }

    beforeEach(function () {
        this.server = makeServer();
        var eventSource = mockEventSource();
        this.eventSource = eventSource;
        clearWorkArea();
        htmx.createEventSource = function(){ return eventSource };
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic sse triggering', function () {

        this.server.respondWith("GET", "/d1", "div1 updated");
        this.server.respondWith("GET", "/d2", "div2 updated");

        var div = make('<div hx-sse="connect /foo">' +
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

    it('does not trigger events that arent named', function () {

        this.server.respondWith("GET", "/d1", "div1 updated");

        var div = make('<div hx-sse="connect /foo">' +
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

    it('does not trigger events not on decendents', function () {

        this.server.respondWith("GET", "/d1", "div1 updated");

        var div = make('<div hx-sse="connect /foo"></div>' +
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


});

