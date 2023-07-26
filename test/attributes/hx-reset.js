describe("hx-reset attribute", function() {
    beforeEach(function () {
        this.server = makeServer();
        this.server.respondImmediately = true;
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('should reset the form if hx-reset is present on form and response is successful', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make('<form hx-reset hx-post="/test" hx-trigger="click from:#i1"><input id="i1" name="i1" value="default value"/></form>')
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click()
        response.calledOnce.should.equal(true, "Expected server to be called but it was not"); // make sure the server was called
        reset.calledOnce.should.equal(true); // check at the form call level
    });
    
    it('should reset the form if hx-reset is present on triggering element and response successful, even with separate target', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make('<div id="theTarget"></div><form hx-reset hx-target="#theTarget" hx-post="/test" hx-trigger="click from:#i1"><input id="i1" name="i1" value="default value"/></form>')
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click()
        response.calledOnce.should.equal(true, "Expected server to be called but it was not"); // make sure the server was called
        reset.calledOnce.should.equal(true); // check at the form call level
        input.value.should.equal("default value"); // check at the input level - though that tests the browser more than htmx
    });
    it('should reset the form if hx-reset is present on form, when request is triggered by child', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make('<form hx-reset><input hx-post="/test" hx-trigger="click" id="i1" name="i1" value="default value"/></form>')
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        input.value.should.equal("default value");
        reset.calledOnce.should.equal(true);
    });
    it('should reset the form if hx-reset is present on triggering element which has a form value', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make(`<form>
            <input hx-post="/test" hx-reset="" hx-trigger="click" id="i1" name="i1" target="#theTarget" value="default value"/>
            <div id="theTarget"></div>
        </form>`)
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        reset.calledOnce.should.equal(true);
        input.value.should.equal("default value");
    });
    it('should not reset the form if no hx-reset attribute', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make('<form><input hx-post="/test" hx-trigger="click" id="i1" name="i1" value="default value"/></form>')
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        input.value.should.equal("user typed value");
        reset.called.should.equal(false);
    });
    it('should not reset the form if response is unsuccessful', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(400, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make('<form hx-reset><input hx-post="/test" hx-trigger="click" id="i1" name="i1" value="default value"/></form>')
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        input.value.should.equal("user typed value");
        reset.called.should.equal(false);
    });
    it('should reset a form specified by querySelector', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var div = make(`<div>
            <form id="theForm"></form>
            <input hx-reset="#theForm" hx-post="/test" hx-trigger="click" id="i1" name="i1" value="default value"/>
        </div>`)
        var form = byId("theForm")
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        reset.called.should.equal(true, "Expected form to be reset but form.reset was not called");
    });
    it('should reset a form specified by querySelector, even if it also the target', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var div = make(`<div>
            <form id="theForm"></form>
            <input hx-reset="#theForm" hx-post="/test" hx-target="#theForm" hx-trigger="click" id="i1" name="i1" value="default value"/>
        </div>`)
        var form = byId("theForm")
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        reset.called.should.equal(true, "Expected form to be reset but form.reset was not called");
    });
    it('should ignore if specified target is not a form', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var div = make(`<div>
            <div id="theNotForm"></div>
            <form>
                <input hx-reset="#theNotForm" hx-post="/test" hx-target="#theNotForm" hx-trigger="click" id="i1" name="i1" value="default value"/>
            </form>
        </div>`)
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        input.value.should.equal("user typed value");
    });
    it('should ignore if specified target does not exist', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var div = make(`<div>
            <div id="theTarget"></div>
            <form>
                <input hx-reset="#theMissingElement" hx-post="/test" hx-target="#theTarget" hx-trigger="click" id="i1" name="i1" value="default value"/>
            </form>
        </div>`)
        var target= byId("theTarget")
        var input = byId("i1")
        input.value = "user typed value"
        input.click();
        response.calledOnce.should.equal(true, "Expected server to be called but it was not");
        input.value.should.equal("user typed value");
        target.textContent.should.equal("Hello");
    });
    it('should reset the form if data-hx-reset is present on form and response is successful', function () {
        var response = sinon.spy(function(xhr) {
            getParameters(xhr)["i1"].should.equal("user typed value");
            xhr.respond(200, {}, "Hello");
        })
        this.server.respondWith("POST", "/test", response);
        var form = make('<form hx-reset hx-post="/test" hx-trigger="click from:#i1"><input id="i1" name="i1" value="default value"/></form>')
        var reset = sinon.spy(form, "reset");
        var input = byId("i1")
        input.value = "user typed value"
        input.click()
        response.calledOnce.should.equal(true, "Expected server to be called but it was not"); // make sure the server was called
        reset.calledOnce.should.equal(true); // check at the form call level
    });
});
