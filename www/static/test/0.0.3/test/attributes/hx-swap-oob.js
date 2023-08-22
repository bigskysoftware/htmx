describe("hx-swap-oob attribute", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic response properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-oob='true'>Swapped</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped");
    })

    it('handles more than one oob swap properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-oob='true'>Swapped1</div><div id='d2' hx-swap-oob='true'>Swapped2</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        make('<div id="d2"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped1");
        byId("d2").innerHTML.should.equal("Swapped2");
    })

    it('handles no id match properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-oob='true'>Swapped</div>");
        var div = make('<div hx-get="/test">click me</div>');
        div.click();
        this.server.respond();
        div.innerText.should.equal("Clicked");
    })

});

