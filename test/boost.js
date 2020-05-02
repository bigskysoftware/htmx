describe("HTMx Boost Tests", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic anchor properly', function () {
        this.server.respondWith("GET", "/test", "Boosted");
        var div = make('<div hx-target="this" hx-boost="true"><a id="a1" href="/test">Foo</a></div>');
        var a = byId('a1');
        a.click();
        this.server.respond();
        div.innerHTML.should.equal("Boosted");
        history.back();
    })


    it('handles basic form post properly', function () {
        this.server.respondWith("POST", "/test", "Boosted");
        this.server.respondWith("POST", "/test", "Boosted");
        var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test" method="post"><button id="b1">Submit</button></form></div>');
        var btn = byId('b1');
        btn.click();
        this.server.respond();
        div.innerHTML.should.equal("Boosted");
        history.back();
    })

    it('handles basic form get properly', function () {
        this.server.respondWith("GET", "/test", "Boosted");
        var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test" method="get"><button id="b1">Submit</button></form></div>');
        var btn = byId('b1');
        btn.click();
        this.server.respond();
        div.innerHTML.should.equal("Boosted");
        history.back();
    })

    it('handles basic form with no explicit method property', function () {
        this.server.respondWith("GET", "/test", "Boosted");
        var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test"><button id="b1">Submit</button></form></div>');
        var btn = byId('b1');
        btn.click();
        this.server.respond();
        div.innerHTML.should.equal("Boosted");
        history.back();
    })


});

