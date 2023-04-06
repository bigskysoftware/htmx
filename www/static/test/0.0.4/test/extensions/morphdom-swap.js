describe("morphdom-swap extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
        htmx.defineExtension('morphdom-swap', {
            handleSwap : function(swapStyle, target, fragment) {
                if (swapStyle === 'morphdom') {
                    morphdom(target, fragment.outerHTML);
                    return []; // no settle phase when using morphdom!
                }
            }
        });
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        htmx.removeExtension('morphdom-swap');
    });

    it('works on basic request', function () {
        this.server.respondWith("GET", "/test", "<button>Clicked!</button>!");
        var btn = make('<button hx-get="/test" hx-ext="morphdom-swap" hx-swap="morphdom" >Click Me!</button>')
        btn.click();
        should.equal(btn.getAttribute("hx-get"), "/test");
        this.server.respond();
        should.equal(btn.getAttribute("hx-get"), null);
        btn.innerHTML.should.equal("Clicked!");
    });

});