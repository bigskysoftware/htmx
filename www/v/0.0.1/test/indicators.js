describe("HTMx Indicator Tests", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('Indicator classes are properly put on element with no explicit indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        btn.classList.contains("hx-show-indicator").should.equal(true);
        this.server.respond();
        btn.classList.contains("hx-show-indicator").should.equal(false);
    });

    it('Indicator classes are properly put on element with explicit indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-indicator="#a1, #a2">Click Me!</button>')
        var a1 = make('<a id="a1"></a>')
        var a2 = make('<a id="a2"></a>')
        btn.click();
        btn.classList.contains("hx-show-indicator").should.equal(false);
        a1.classList.contains("hx-show-indicator").should.equal(true);
        a2.classList.contains("hx-show-indicator").should.equal(true);
        this.server.respond();
        btn.classList.contains("hx-show-indicator").should.equal(false);
        a1.classList.contains("hx-show-indicator").should.equal(false);
        a2.classList.contains("hx-show-indicator").should.equal(false);
    });
})
