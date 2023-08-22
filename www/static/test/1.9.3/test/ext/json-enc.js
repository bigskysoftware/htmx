describe("json-enc extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic get properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("GET", "/test", jsonResponseBody);
        var div = make('<div hx-get="/test" hx-ext="json-enc">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic post properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("POST", "/test", jsonResponseBody);
        var div = make("<div hx-post='/test' hx-ext='json-enc'>click me</div>");
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic put properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("PUT", "/test", jsonResponseBody);
        var div = make('<div hx-put="/test" hx-ext="json-enc">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic patch properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("PATCH", "/test", jsonResponseBody);
        var div = make('<div hx-patch="/test" hx-ext="json-enc">click me</div>');
        div.click();
        this.server.respond();
        this.server.lastRequest.response.should.equal("{}");
    })

    it('handles basic delete properly', function () {
        var jsonResponseBody = JSON.stringify({});
        this.server.respondWith("DELETE", "/test", jsonResponseBody);
        var div = make('<div hx-delete="/test" hx-ext="json-enc">click me</div>');
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
            var ans = { "passwordok": values["password"] == "123456"};
            xhr.respond(200, {}, JSON.stringify(ans));
        });

        var html = make('<form hx-post="/test" hx-ext="json-enc" > ' +
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
        this.server.lastRequest.response.should.equal('{"passwordok":true}');
    })

    it('handles put with form parameters', function () {
        this.server.respondWith("PUT", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
            var ans = { "passwordok": values["password"] == "123456"};
            xhr.respond(200, {}, JSON.stringify(ans));
        });

        var html = make('<form hx-put="/test" hx-ext="json-enc" > ' +
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
        this.server.lastRequest.response.should.equal('{"passwordok":true}');
    })


    it('handles patch with form parameters', function () {

        this.server.respondWith("PATCH", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
            var ans = { "passwordok": values["password"] == "123456"};
            xhr.respond(200, {}, JSON.stringify(ans));
        });

        var html = make('<form hx-patch="/test" hx-ext="json-enc" > ' +
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
        this.server.lastRequest.response.should.equal('{"passwordok":true}');
    })

    it('handles delete with form parameters', function () {

        this.server.respondWith("DELETE", "/test", function (xhr) {
            var values = JSON.parse(xhr.requestBody);
            values.should.have.keys("username","password");
            values["username"].should.be.equal("joe");
            values["password"].should.be.equal("123456");
            var ans = { "passwordok": values["password"] == "123456"};
            xhr.respond(200, {}, JSON.stringify(ans));
        });

        var html = make('<form hx-delete="/test" hx-ext="json-enc" > ' +
            '<input type="text"  name="username" value="joe"> ' +
            '<input type="password"  name="password" value="123456"> ' +
        '<button  id="btnSubmit">Submit</button> ');

        byId("btnSubmit").click();
        this.server.respond();
        this.server.lastRequest.response.should.equal('{"passwordok":true}');
    })



});

