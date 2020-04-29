describe("HTMx History Tests", function() {

    if (document.location.href.indexOf("file:") === 0) {
        it("HISTORY TESTING SKIPPED IN HEADLESS MODE"), function() {
        }
        return;
    }

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
        getWorkArea().textContent.should.equal("second")
        history.back();
        setTimeout(function(){
            getWorkArea().textContent.should.equal("first");
            done();
        }, 20);
    });

    it("should handle two forward clicks then back twice", function (done) {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        getWorkArea().innerHTML.should.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test" class="">0</div>');
        div.click();
        this.server.respond();
        getWorkArea().textContent.should.equal("1")

        div.click();
        this.server.respond();
        getWorkArea().textContent.should.equal("2")

        history.back();
        setTimeout(function(){
            getWorkArea().textContent.should.equal("1");
            history.back();
            setTimeout(function(){
                getWorkArea().textContent.should.equal("0");
                done();
            }, 20);
        }, 20);
    })

    it("should handle a back, forward, back button click", function (done) {
        this.server.respondWith("GET", "/test", "second");

        getWorkArea().innerHTML.should.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test" class="">first</div>');
        div.click();
        this.server.respond();
        getWorkArea().textContent.should.equal("second")
        history.back();
        setTimeout(function(){
            getWorkArea().textContent.should.equal("first");
            history.forward();
            setTimeout(function() {
                getWorkArea().textContent.should.equal("second");
                history.back();
                setTimeout(function() {
                    getWorkArea().textContent.should.equal("first");
                    done();
                }, 20);
            }, 20);
        }, 20);
    })
});
