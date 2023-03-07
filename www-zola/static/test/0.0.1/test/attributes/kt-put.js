describe("kt-put attribute", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('issues a PUT request with proper headers', function()
    {
        this.server.respondWith("PUT", "/test", function(xhr){
            xhr.requestHeaders['X-HTTP-Method-Override'].should.equal('PUT');
            xhr.respond(200, {}, "Putted!");
        });

        var btn = make('<button kt-put="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Putted!");
    });
})
