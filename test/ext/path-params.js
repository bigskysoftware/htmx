describe("path-params extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('uses parameter to populate path variable', function () {
        var request;
        htmx.on("htmx:beforeRequest", function (evt) {
            request = evt;
        });
        var div = make("<div hx-ext='path-params' hx-get='/items/{itemId}' hx-vals='{\"itemId\":42}'></div>")
        div.click();
        should.equal(request.detail.requestConfig.path, '/items/42');
    });

    it('parameter is removed when used', function () {
        var request;
        htmx.on("htmx:beforeRequest", function (evt) {
            request = evt;
        });
        var div = make("<div hx-ext='path-params' hx-get='/items/{itemId}' hx-vals='{\"itemId\":42, \"other\":43}'></div>")
        div.click();
        should.equal(request.detail.requestConfig.parameters.other, 43);
        should.equal(request.detail.requestConfig.parameters.itemId, undefined);
    });

    it('parameter value is encoded', function () {
        var request;
        htmx.on("htmx:beforeRequest", function (evt) {
            request = evt;
        });
        var div = make("<div hx-ext='path-params' hx-get='/items/{itemId}' hx-vals='{\"itemId\":\"a/b\"}'></div>")
        div.click();
        should.equal(request.detail.requestConfig.path, '/items/a%2Fb');
    });

    it('missing variables are ignored', function () {
        var request;
        htmx.on("htmx:beforeRequest", function (evt) {
            request = evt;
        });
        var div = make("<div hx-ext='path-params' hx-get='/items/{itemId}/{subitem}' hx-vals='{\"itemId\":42}'></div>")
        div.click();
        should.equal(request.detail.requestConfig.path, '/items/42/{subitem}');
    });
});
