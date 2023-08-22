describe("hx-put attribute", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('issues a PUT request', function()
    {
        this.server.respondWith("PUT", "/test", function(xhr){
            xhr.respond(200, {}, "Putted!");
        });

        var btn = make('<button hx-put="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Putted!");
    });

    it('issues a PUT request w/ data-* prefix', function()
    {
        this.server.respondWith("PUT", "/test", function(xhr){
            xhr.respond(200, {}, "Putted!");
        });

        var btn = make('<button data-hx-put="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Putted!");
    });
})
