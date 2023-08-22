describe("hx-params attribute", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('none excludes all params', function () {
        this.server.respondWith("POST", "/params", function (xhr) {
            var params = getParameters(xhr);
            should.equal(params['i1'], undefined);
            should.equal(params['i2'], undefined);
            should.equal(params['i3'], undefined);
            xhr.respond(200, {}, "Clicked!")
        });
        var form = make('<form hx-trigger="click" hx-post="/params" hx-params="none">' +
            '<input name="i1" value="test"/>' +
            '<input  name="i2" value="test"/>' +
            '<input  name="i3" value="test"/>' +
            '</form> ');
        form.click();
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('"*" includes all params', function () {
        this.server.respondWith("POST", "/params", function (xhr) {
            var params = getParameters(xhr);
            should.equal(params['i1'], "test");
            should.equal(params['i2'], "test");
            should.equal(params['i3'], "test");
            xhr.respond(200, {}, "Clicked!")
        });
        var form = make('<form hx-trigger="click" hx-post="/params" hx-params="*">' +
            '<input name="i1" value="test"/>' +
            '<input  name="i2" value="test"/>' +
            '<input  name="i3" value="test"/>' +
            '</form> ');
        form.click();
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('named includes works', function () {
        this.server.respondWith("POST", "/params", function (xhr) {
            var params = getParameters(xhr);
            should.equal(params['i1'], "test");
            should.equal(params['i2'], undefined);
            should.equal(params['i3'], "test");
            xhr.respond(200, {}, "Clicked!")
        });
        var form = make('<form hx-trigger="click" hx-post="/params" hx-params="i1, i3">' +
            '<input name="i1" value="test"/>' +
            '<input  name="i2" value="test"/>' +
            '<input  name="i3" value="test"/>' +
            '</form> ');
        form.click();
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('named exclude works', function () {
        this.server.respondWith("POST", "/params", function (xhr) {
            var params = getParameters(xhr);
            should.equal(params['i1'], undefined);
            should.equal(params['i2'], "test");
            should.equal(params['i3'], undefined);
            xhr.respond(200, {}, "Clicked!")
        });
        var form = make('<form hx-trigger="click" hx-post="/params" hx-params="not i1, i3">' +
            '<input name="i1" value="test"/>' +
            '<input  name="i2" value="test"/>' +
            '<input  name="i3" value="test"/>' +
            '</form> ');
        form.click();
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('named exclude works  w/ data-* prefix', function () {
        this.server.respondWith("POST", "/params", function (xhr) {
            var params = getParameters(xhr);
            should.equal(params['i1'], undefined);
            should.equal(params['i2'], "test");
            should.equal(params['i3'], undefined);
            xhr.respond(200, {}, "Clicked!")
        });
        var form = make('<form data-hx-trigger="click" data-hx-post="/params" data-hx-params="not i1, i3">' +
            '<input name="i1" value="test"/>' +
            '<input  name="i2" value="test"/>' +
            '<input  name="i3" value="test"/>' +
            '</form> ');
        form.click();
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

});