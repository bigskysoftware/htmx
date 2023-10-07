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

    it('works on mustache array template', function () {
        this.server.respondWith("GET", "/test", '{"foo":"bar"}');
        var btn = make('<button hx-get="/test" hx-ext="client-side-templates" mustache-array-template="mt1">Click Me!</button>')
        make('<script id="mt1" type="x-tmpl-mustache">*{{data.foo}}*</script>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("*bar*");
    });

    it('works on basic handlebars template', function () {
        this.server.respondWith("GET", "/test", '{"foo":"bar"}');
        var btn = make('<button hx-get="/test" hx-ext="client-side-templates" handlebars-template="hb1">Click Me!</button>')
        make('<script id="hb1" type="text/x-handlebars-template">*{{foo}}*</script>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("*bar*");
    });

    it('works on handlebars array template', function () {
        this.server.respondWith("GET", "/test", '[{"foo":"bar"}]');
        var btn = make('<button hx-get="/test" hx-ext="client-side-templates" handlebars-array-template="hb1">Click Me!</button>')
        make('<script id="hb1" type="text/x-handlebars-template">*{{#.}}{{foo}}{{/.}}*</script>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("*bar*");
    });

    it('works on basic xslt template', function () {
        this.server.respondWith("GET", "/test", '<foo>bar</foo>');
        var btn = make('<button hx-get="/test" hx-ext="client-side-templates" xslt-template="mt1">Click Me!</button>')
        make('<script id="mt1" type="application/xml">' +
        `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:template match="/">*<xsl:value-of select="foo" />*</xsl:template>
         </xsl:stylesheet>
        ` + '</script>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("*bar*");
    });
});
