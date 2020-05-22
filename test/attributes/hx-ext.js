describe("hx-ext attribute", function() {

    var ext1Calls, ext2Calls, ext3Calls;

    beforeEach(function () {
        ext1Calls = ext2Calls = ext3Calls = 0;
        this.server = makeServer();
        clearWorkArea();
        htmx.defineExtension("ext-1", {
            onEvent : function(name, evt) {
                if(name === "afterRequest.htmx"){
                    ext1Calls++;
                }
            }
        });
        htmx.defineExtension("ext-2", {
            onEvent : function(name, evt) {
                if(name === "afterRequest.htmx"){
                    ext2Calls++;
                }
            }
        });
        htmx.defineExtension("ext-3", {
            onEvent : function(name, evt) {
                if(name === "afterRequest.htmx"){
                    ext3Calls++;
                }
            }
        });
    });

    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        htmx.removeExtension("ext-1");
        htmx.removeExtension("ext-2");
        htmx.removeExtension("ext-3");
    });

    it('A simple extension is invoked properly', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-get="/test" hx-ext="ext-1">Click Me!</button>')
        btn.click();
        this.server.respond();
        ext1Calls.should.equal(1);
        ext2Calls.should.equal(0);
        ext3Calls.should.equal(0);
    });

});