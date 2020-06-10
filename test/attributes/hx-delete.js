describe("hx-delete attribute", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('issues a DELETE request', function()
    {
        this.server.respondWith("DELETE", "/test", function(xhr){
            xhr.respond(200, {}, "Deleted!");
        });

        var btn = make('<button hx-delete="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Deleted!");
    });

    it('issues a DELETE request w/ data-* prefix', function()
    {
        this.server.respondWith("DELETE", "/test", function(xhr){
            xhr.respond(200, {}, "Deleted!");
        });

        var btn = make('<button data-hx-delete="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Deleted!");
    });
})
