describe("hx-ext attribute", function() {

    var ext1Calls, ext2Calls, ext3Calls, ext4Calls;

    beforeEach(function () {
        ext1Calls = ext2Calls = ext3Calls = ext4Calls = 0;
        this.server = makeServer();
        clearWorkArea();
        htmx.defineExtension("ext-1", {
            onEvent : function(name, evt) {
                if(name === "htmx:afterRequest"){
                    ext1Calls++;
                }
            }
        });
        htmx.defineExtension("ext-2", {
            onEvent : function(name, evt) {
                if(name === "htmx:afterRequest"){
                    ext2Calls++;
                }
            }
        });
        htmx.defineExtension("ext-3", {
            onEvent : function(name, evt) {
                if(name === "htmx:afterRequest"){
                    ext3Calls++;
                }
            }
        });
        htmx.defineExtension("ext-4", {
            onEvent : function(name, evt) {
                if(name === "namespace:example"){
                    ext4Calls++;
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

    it('Extensions are merged properly', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        make('<div hx-ext="ext-1"><button id="btn-1" hx-get="/test" hx-ext="ext-2">Click Me!</button>' +
            '<button id="btn-2"  hx-get="/test" hx-ext="ext-3">Click Me!</button></div>')
        var btn1 = byId("btn-1");
        var btn2 = byId("btn-2");

        btn1.click();
        this.server.respond();
        ext1Calls.should.equal(1);
        ext2Calls.should.equal(1);
        ext3Calls.should.equal(0);

        btn2.click();
        this.server.respond();
        ext1Calls.should.equal(2);
        ext2Calls.should.equal(1);
        ext3Calls.should.equal(1);
    });

    it('supports comma separated lists', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        make('<div hx-ext="ext-1"><button id="btn-1" hx-get="/test" hx-ext="ext-2,  ext-3 ">Click Me!</button></div>')
        var btn1 = byId("btn-1");
        var btn2 = byId("btn-2");

        btn1.click();
        this.server.respond();
        ext1Calls.should.equal(1);
        ext2Calls.should.equal(1);
        ext3Calls.should.equal(1);
    });

    it('A simple extension is invoked properly  w/ data-* prefix', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button data-hx-get="/test" data-hx-ext="ext-1">Click Me!</button>')
        btn.click();
        this.server.respond();
        ext1Calls.should.equal(1);
        ext2Calls.should.equal(0);
        ext3Calls.should.equal(0);
    });

    it('A simple extension is invoked properly when an HX-Trigger event w/ a namespace fires', function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger":"namespace:example"}, ""]);
        var btn = make('<button data-hx-get="/test" data-hx-ext="ext-4">Click Me!</button>')
        btn.click();
        this.server.respond();
        ext1Calls.should.equal(0);
        ext2Calls.should.equal(0);
        ext3Calls.should.equal(0);
        ext4Calls.should.equal(1);

    });

    it('Extensions are ignored properly', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        make('<div id="div-AA" hx-ext="ext-1, ext-2"><button id="btn-AA" hx-get="/test">Click Me!</button>' +
            '<div id="div-BB" hx-ext="ignore:ext-1"><button id="btn-BB" hx-get="/test"></div></div>')

        var btn1 = byId("btn-AA");
        var btn2 = byId("btn-BB");

        btn1.click();
        this.server.respond();
        ext1Calls.should.equal(1);
        ext2Calls.should.equal(1);
        ext3Calls.should.equal(0);

        btn2.click();
        this.server.respond();
        ext1Calls.should.equal(1);
        ext2Calls.should.equal(2);
        ext3Calls.should.equal(0);
    })

});