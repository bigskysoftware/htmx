describe("hx-ws attribute", function() {

    function mockWebsocket() {
        var listener;
        var lastSent;
        var wasClosed = false;
        var mockSocket = {
            addEventListener : function(message, l) {
                listener = l;
            },
            write : function(content) {
                return listener({data:content});
            },
            send : function(data) {
                lastSent = data;
            },
            getLastSent : function() {
                return lastSent;
            },
            close : function() {
                wasClosed = true;
            },
            wasClosed : function () {
                return wasClosed;
            }
        };
        return mockSocket;
    }

    beforeEach(function () {
        this.server = makeServer();
        var socket = mockWebsocket();
        this.socket = socket;
        clearWorkArea();
        this.oldCreateWebSocket = htmx.createWebSocket;
        htmx.createWebSocket = function(){
            return socket
        };
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        htmx.createWebSocket = this.oldCreateWebSocket;
    });

    it('handles a basic call back', function () {
        var div = make('<div hx-ws="connect:/foo"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.socket.write("<div id=\"d1\">replaced</div>")
        byId("d1").innerHTML.should.equal("replaced");
        byId("d2").innerHTML.should.equal("div2");
    })

    it('handles a basic send', function () {
        var div = make('<div hx-ws="connect:/foo"><div hx-ws="send" id="d1">div1</div></div>');
        byId("d1").click();
        var lastSent = this.socket.getLastSent();
        var data = JSON.parse(lastSent);
        data.HEADERS["HX-Request"].should.equal("true");
    })

    it('is closed after removal', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make('<div hx-get="/test" hx-swap="outerHTML" hx-ws="connect:wss:/foo"></div>');
        div.click();
        this.server.respond();
        this.socket.wasClosed().should.equal(true)
    })

    it('is closed after removal with no close and activity', function () {
        var div = make('<div hx-ws="connect:/foo"></div>');
        div.parentElement.removeChild(div);
        this.socket.write("<div id=\"d1\">replaced</div>")
        this.socket.wasClosed().should.equal(true)
    })

});

