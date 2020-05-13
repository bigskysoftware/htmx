describe("kt-trigger attribute", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('non-default value works', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var form = make('<form kt-get="/test" kt-trigger="click">Click Me!</form>');
        form.click();
        form.innerHTML.should.equal("Click Me!");
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('changed modifier works', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var input = make('<input kt-trigger="click changed" kt-target="#d1" kt-get="/test" value="foo"/>');
        var div = make('<div id="d1"></div>');
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.value = "bar";
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 2");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 2");
    });

    it('once modifier works', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var input = make('<input kt-trigger="click once" kt-target="#d1" kt-get="/test" value="foo"/>');
        var div = make('<div id="d1"></div>');
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.value = "bar";
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
    });


})
