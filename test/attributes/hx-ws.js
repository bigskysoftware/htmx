describe("hx-ws attribute", function() {

    function mockWebsocket() {
        var listener;
        var lastSent;
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
            }
        };
        return mockSocket;
    }

    beforeEach(function () {
        this.server = makeServer();
        var socket = mockWebsocket();
        this.socket = socket;
        clearWorkArea();
        htmx.createWebSocket = function(){ return socket };
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles a basic call back', function () {
        var div = make('<div hx-ws="connect wss:/foo"><div id="d1">div1</div><div id="d2">div2</div></div>');
        this.socket.write("<div id=\"d1\">replaced</div>")
        byId("d1").innerHTML.should.equal("replaced");
        byId("d2").innerHTML.should.equal("div2");
    })

    it('handles a basic send', function () {
        var div = make('<div hx-ws="connect wss:/foo"><div hx-ws="send" id="d1">div1</div></div>');
        byId("d1").click();
        var lastSent = this.socket.getLastSent();
        var data = JSON.parse(lastSent);
        data.HEADERS["X-HX-Request"].should.equal("true");
    })

});

