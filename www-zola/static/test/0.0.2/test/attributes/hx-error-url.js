describe("hx-error-url attribute", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('Submits a POST with error content on bad request', function()
    {
        this.server.respondWith("POST", "/error", function(xhr){
            should.equal(JSON.parse(xhr.requestBody).detail.xhr.status, 404);
        });
        var btn = make('<button hx-error-url="/error" hx-get="/bad">Click Me!</button>')
        btn.click();
        this.server.respond();
        this.server.respond();
    });
})
