describe("hx-request attribute", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('basic hx-request timeout works', function (done) {
        var timedOut = false;
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make("<div hx-post='/vars' hx-request='\"timeout\":1'></div>")
        htmx.on(div, 'htmx:timeout', function(){
            timedOut = true;
        })
        div.click();
        setTimeout(function(){
            div.innerHTML.should.equal("");
            // unfortunately it looks like sinon.js doesn't implement the timeout functionality
            // timedOut.should.equal(true);
            done();
        }, 400)
    });

    it('hx-request header works', function () {
        this.server.respondWith("POST", "/vars", function (xhr) {
            should.equal(xhr.requestHeaders['HX-Request'], undefined);
            xhr.respond(200, {}, "Clicked!")
        });
        var div = make("<div hx-post='/vars' hx-request='{\"noHeaders\":true}'></div>")
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });


});