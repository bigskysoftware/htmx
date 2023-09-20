describe("bad extension", function() {
    htmx.defineExtension("bad-extension", {
            onEvent : function(name, evt) {throw "onEvent"},
            transformResponse : function(text, xhr, elt) {throw "transformRequest"},
            isInlineSwap : function(swapStyle) {throw "isInlineSwap"},
            handleSwap : function(swapStyle, target, fragment, settleInfo) {throw "handleSwap"},
            encodeParameters : function(xhr, parameters, elt) {throw "encodeParameters"}
        }
    )
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('does not blow up rendering', function () {
        this.server.respondWith("GET", "/test", "clicked!");
        var div = make('<div hx-get="/test" hx-ext="bad-extension">Click Me!</div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("clicked!");
    });

});