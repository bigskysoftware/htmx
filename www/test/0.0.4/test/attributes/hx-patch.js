describe("hx-patch attribute", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('issues a PATCH request with proper headers', function()
    {
        this.server.respondWith("PATCH", "/test", function(xhr){
            xhr.requestHeaders['X-HTTP-Method-Override'].should.equal('PATCH');
            xhr.respond(200, {}, "Patched!");
        });

        var btn = make('<button hx-patch="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Patched!");
    });

    it('issues a PATCH request with proper headers  w/ data-* prefix', function()
    {
        this.server.respondWith("PATCH", "/test", function(xhr){
            xhr.requestHeaders['X-HTTP-Method-Override'].should.equal('PATCH');
            xhr.respond(200, {}, "Patched!");
        });

        var btn = make('<button data-hx-patch="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Patched!");
    });
})
