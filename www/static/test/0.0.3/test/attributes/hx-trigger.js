describe("hx-trigger attribute", function(){
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

        var form = make('<form hx-get="/test" hx-trigger="click">Click Me!</form>');
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
        var input = make('<input hx-trigger="click changed" hx-target="#d1" hx-get="/test" value="foo"/>');
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
        var input = make('<input hx-trigger="click once" hx-target="#d1" hx-get="/test" value="foo"/>');
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

    it('polling works', function(complete)
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            if (requests > 5) {
                complete();
                // cancel polling with a
                xhr.respond(286, {}, "Requests: " + requests);
            } else {
                xhr.respond(200, {}, "Requests: " + requests);
            }
        });
        this.server.autoRespond = true;
        this.server.autoRespondAfter = 0;
        make('<div hx-trigger="every 10ms" hx-get="/test"/>');
    });


})
