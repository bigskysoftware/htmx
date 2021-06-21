describe("scheme handler support", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles generic scheme properly', function () {
        htmx.config.schemeHandlers['foo'] = function(){
            window.foo = "bar";
        }
        var div = make('<div hx-post="foo:blah blah blah">click me</div>');
        div.click();
        window.foo.should.equal("bar");
        delete window.foo
        delete htmx.config.schemeHandlers['foo']
    })

    it('handles javascript scheme properly', function () {
        var div = make('<div hx-post="javascript:window.foo = \'bar\'">click me</div>');
        div.click();
        window.foo.should.equal("bar");
        delete window.foo
    })


});

