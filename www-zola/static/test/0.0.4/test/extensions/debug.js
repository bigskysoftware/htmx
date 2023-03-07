describe("debug extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
        htmx.defineExtension('debug', {
            onEvent : function(name, evt) {
                if(console.debug){
                    console.debug(name, evt);
                } else if(console) {
                    console.log("DEBUG:", name, evt);
                } else {
                    throw "NO CONSOLE SUPPORTED"
                }
            }
        });
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        htmx.removeExtension('debug');
    });

    it('works on basic request', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="debug">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    });

});