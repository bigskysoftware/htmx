describe("protocol handler support", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles generic protocol properly', function () {
        htmx.config.protocolHandlers['foo'] = function(){
            window.foo = "bar";
        }
        var div = make('<div hx-post="foo:blah blah blah">click me</div>');
        div.click();
        window.foo.should.equal("bar");
        delete window.foo
        delete htmx.config.protocolHandlers['foo']
    })

    it('handles javascript protocol properly', function () {
        var div = make('<div hx-post="javascript:window.foo = \'bar\'">click me</div>');
        div.click();
        window.foo.should.equal("bar");
        delete window.foo
    })


});

