describe("kt-indicator attribute", function(){
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
        var btn = make('<button kt-get="/test">Click Me!</button>')
        btn.click();
        btn.classList.contains("kutty-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("kutty-request").should.equal(false);
    });

    it('Indicator classes are properly put on element with explicit indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button kt-get="/test" kt-indicator="#a1, #a2">Click Me!</button>')
        var a1 = make('<a id="a1"></a>')
        var a2 = make('<a id="a2"></a>')
        btn.click();
        btn.classList.contains("kutty-request").should.equal(false);
        a1.classList.contains("kutty-request").should.equal(true);
        a2.classList.contains("kutty-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("kutty-request").should.equal(false);
        a1.classList.contains("kutty-request").should.equal(false);
        a2.classList.contains("kutty-request").should.equal(false);
    });
})
