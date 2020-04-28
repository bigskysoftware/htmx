describe("HTMx History Tests", function() {
    beforeEach(function () {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("should handle a basic back button click", function (done) {
        this.server.respondWith("GET", "/test", "second");

        getWorkArea().innerHTML.should.be.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test">first</div>');
        div.click();
        this.server.respond();
        getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">second</div>")
        history.back();
        setTimeout(function(){
            getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">first</div>");
            done();
        }, 20);
    })

    it("should handle two forward clicks then back twice", function (done) {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        getWorkArea().innerHTML.should.be.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test">0</div>');
        div.click();
        this.server.respond();
        getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">1</div>")

        div.click();
        this.server.respond();
        getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">2</div>")

        history.back();
        setTimeout(function(){
            getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">1</div>");
            history.back();
            setTimeout(function(){
                getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">0</div>");
                done();
            }, 20);
        }, 20);
    })

    it("should handle a back, forward, back button click", function (done) {
        this.server.respondWith("GET", "/test", "second");

        getWorkArea().innerHTML.should.be.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test">first</div>');
        div.click();
        this.server.respond();
        getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">second</div>")
        history.back();
        setTimeout(function(){
            getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">first</div>");
            history.forward();
            setTimeout(function() {
                getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">second</div>");
                history.back();
                setTimeout(function() {
                    getWorkArea().innerHTML.should.be.equal("<div hx-push-url=\"true\" hx-get=\"/test\">first</div>");
                    done();
                }, 20);
            }, 20);
        }, 20);
    })
});
