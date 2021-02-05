describe("path-deps extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('path-deps basic case works', function () {
        this.server.respondWith("POST", "/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps works with trailing slash', function () {
        this.server.respondWith("POST", "/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test/">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps GET does not trigger', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-get="/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("FOO");
    });

    it('path-deps dont trigger on path mismatch', function () {
        this.server.respondWith("POST", "/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test2">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("FOO");
    });

    it('path-deps dont trigger on path longer than request', function () {
        this.server.respondWith("POST", "/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test/child">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("FOO");
    });

    it('path-deps trigger on path shorter than request', function () {
        this.server.respondWith("POST", "/test/child", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test/child" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps trigger on *-at-start path', function () {
        this.server.respondWith("POST", "/test/child/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test/child/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/*/child/test">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps trigger on *-in-middle path', function () {
        this.server.respondWith("POST", "/test/child/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test/child/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test/*/test">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps trigger on *-at-end path', function () {
        this.server.respondWith("POST", "/test/child/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test/child/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test/child/*">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps trigger all *s path', function () {
        this.server.respondWith("POST", "/test/child/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var btn = make('<button hx-post="/test/child/test" hx-ext="path-deps">Click Me!</button>')
        var div = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/*/*/*">FOO</div>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
        div.innerHTML.should.equal("FOO");
        this.server.respond();
        div.innerHTML.should.equal("Deps fired!");
    });

    it('path-deps api basic refresh case works', function () {
        this.server.respondWith("GET", "/test", "Path deps fired!");
        var div = make('<div hx-get="/test" hx-trigger="path-deps" path-deps="/test">FOO</div>')
        PathDeps.refresh("/test");
        this.server.respond();
        div.innerHTML.should.equal("Path deps fired!");
    });

    it('path-deps api parent path case works', function () {
        this.server.respondWith("GET", "/test1", "Path deps 1 fired!");
        this.server.respondWith("GET", "/test2", "Path deps 2 fired!");
        var div = make('<div hx-get="/test1" hx-trigger="path-deps" path-deps="/test/child">FOO</div>')
        var div2 = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test">BAR</div>')
        PathDeps.refresh("/test/child");
        this.server.respond();
        div.innerHTML.should.equal("Path deps 1 fired!");
        this.server.respond();
        div2.innerHTML.should.equal("Path deps 2 fired!");
    });

    it('path-deps replacing containing element fires event', function () {
        this.server.respondWith("POST", "/test", "Clicked!");
        this.server.respondWith("GET", "/test2", "Deps fired!");
        var div1 = make('<div><button id="buttonSubmit" hx-post="/test" hx-swap="outerHTML" hx-ext="path-deps" >Click Me!</button></div>')
        var div2 = make('<div hx-get="/test2" hx-trigger="path-deps" path-deps="/test">FOO</div>')
        byId("buttonSubmit").click();
        this.server.respond();
        div1.innerHTML.should.equal('Clicked!');
        div2.innerHTML.should.equal("FOO");
        this.server.respond();
        div2.innerHTML.should.equal("Deps fired!");
    });
});
