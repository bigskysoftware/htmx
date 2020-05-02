describe("HTMx Direct Swap", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic response properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-direct='true'>Swapped</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped");
    })

    it('handles no id match properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-direct='true'>Swapped</div>");
        var div = make('<div hx-get="/test">click me</div>');
        div.click();
        this.server.respond();
        div.innerText.should.equal("Clicked\nSwapped");
    })


});

