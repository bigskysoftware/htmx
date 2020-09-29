describe("Core htmx client side validation tests", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('HTML5 required validation error prevents request', function()
    {
        this.server.respondWith("POST", "/test", "Clicked!");

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '</form>');
        form.textContent.should.equal("No Request");
        form.click();
        this.server.respond();
        form.textContent.should.equal("No Request");
        byId("i1").value = "foo";
        form.click();
        this.server.respond();
        form.textContent.should.equal("Clicked!");
    });

    it('HTML5 pattern validation error prevents request', function()
    {
        this.server.respondWith("POST", "/test", "Clicked!");

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" pattern="abc" value="xyz">' +
            '</form>');
        byId("i1").value = "xyz";
        form.textContent.should.equal("No Request");
        form.click();
        this.server.respond();
        form.textContent.should.equal("No Request");
        byId("i1").value = "abc";
        form.click();
        this.server.respond();
        form.textContent.should.equal("Clicked!");
    });

    it('Custom validation error prevents request', function()
    {
        this.server.respondWith("POST", "/test", "Clicked!");

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1">' +
            '</form>');
        byId("i1").setCustomValidity("Nope");
        form.textContent.should.equal("No Request");
        form.click();
        this.server.respond();
        form.textContent.should.equal("No Request");
        byId("i1").setCustomValidity("");
        form.click();
        this.server.respond();
        form.textContent.should.equal("Clicked!");
    });

    it('hyperscript validation error prevents request', function()
    {
        this.server.respondWith("POST", "/test", "Clicked!");

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input _="on htmx:validation:validate if my.value != \'foo\' call me.setCustomValidity(\'Nope\') ' +
            '                                      else call me.setCustomValidity(\'\')" id="i1" name="i1">' +
            '</form>');
        htmx.trigger(form, "htmx:load");
        byId("i1").value = "boo";
        form.textContent.should.equal("No Request");
        form.click();
        this.server.respond();
        form.textContent.should.equal("No Request");
        byId("i1").value = "foo";
        form.click();
        this.server.respond();
        form.textContent.should.equal("Clicked!");
    });



})
