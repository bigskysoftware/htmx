describe("client-side-templates extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('works on basic mustache template', function () {
        this.server.respondWith("GET", "/test", '{"foo":"bar"}');
        var btn = make('<button hx-get="/test" hx-ext="client-side-templates" mustache-template="mt1">Click Me!</button>')
        make('<script id="mt1" type="x-tmpl-mustache">*{{foo}}*</script>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("*bar*");
    });

    it('works on basic handlebars template', function () {
        this.server.respondWith("GET", "/test", '{"foo":"bar"}');
        var btn = make('<button hx-get="/test" hx-ext="client-side-templates" handlebars-template="hb1">Click Me!</button>')
        Handlebars.partials["hb1"] = Handlebars.compile("*{{foo}}*");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("*bar*");
    });


});