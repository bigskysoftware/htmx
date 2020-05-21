describe("Core htmx AJAX Verbs with json encoding", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();

    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        // if we don't set this, then all the following test MAY 
        // inherit incorrect encoding, and fail. 
        htmx.config.defaultEncoding="xml";
    });

    it('handles basic post properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("POST", "/test", jsonResponseBody);
        var div = make('<div hx-post="/test encoding:json">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic put properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("PUT", "/test", jsonResponseBody);
        var div = make('<div hx-put="/test encoding:json">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic patch properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("PATCH", "/test", jsonResponseBody);
        var div = make('<div hx-patch="/test encoding:json">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic delete properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("DELETE", "/test", jsonResponseBody);
        var div = make('<div hx-delete="/test encoding:json">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles post with form parameters', function () {

        this.server.respondWith("POST", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
        });

        var html = make('<form hx-post="/test encoding:json" > ' + 
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
    })

    it('handles put with form parameters', function () {

        this.server.respondWith("PUT", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
        });

        var html = make('<form hx-put="/test encoding:json" > ' + 
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
    })


    it('handles patch with form parameters', function () {

        this.server.respondWith("PATCH", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
        });

        var html = make('<form hx-patch="/test encoding:json" > ' + 
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
    })

    it('handles delete with form parameters', function () {

        this.server.respondWith("DELETE", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
        });

        var html = make('<form hx-delete="/test encoding:json" > ' + 
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
    })

    it('handles post with default encoding of json', function () {

        this.server.respondWith("POST", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
        });

        htmx.config.defaultEncoding = "json";
        make('<form hx-post="/test" > ' + 
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
    })

});

