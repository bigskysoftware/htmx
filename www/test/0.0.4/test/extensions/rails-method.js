describe("rails-method extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
        htmx.defineExtension('rails-method', {
            onEvent : function(name, evt) {
                if(name === "configRequest.htmx"){
                    var methodOverride = evt.detail.headers['X-HTTP-Method-Override'];
                    if(methodOverride){
                        evt.detail.parameters['_method'] = methodOverride;
                    }
                }
            }
        });
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        htmx.removeExtension('rails-method');
    });

    it('Does not affect a GET request', function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, xhr.url)
        });
        var btn = make('<button hx-get="/test" hx-ext="rails-method">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("/test");
    });

    it('Does not affect a POST request', function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            xhr.respond(200, {}, getParameters(xhr)['_method']);
        });
        var btn = make('<button hx-post="/test" hx-ext="rails-method">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("");
    });

    it('Adds proper _method param to PUT request', function () {
        this.server.respondWith("PUT", "/test", function (xhr) {
            xhr.respond(200, {}, getParameters(xhr)['_method']);
        });
        var btn = make('<button hx-put="/test" hx-ext="rails-method">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("PUT");
    });

    it('Adds proper _method param to PATCH request', function () {
        this.server.respondWith("PATCH", "/test", function (xhr) {
            xhr.respond(200, {}, getParameters(xhr)['_method']);
        });
        var btn = make('<button hx-patch="/test" hx-ext="rails-method">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("PATCH");
    });

    it('Adds proper _method param to DELETE request', function () {
        this.server.respondWith("DELETE", "/test", function (xhr) {
            xhr.respond(200, {}, getParameters(xhr)['_method']);
        });
        var btn = make('<button hx-delete="/test" hx-ext="rails-method">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("DELETE");
    });

});