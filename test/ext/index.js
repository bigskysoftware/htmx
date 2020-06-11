describe("default extensions behavior", function() {

    var loadCalls, afterSwapCalls, afterSettleCalls;

    beforeEach(function () {
        loadCalls = afterSwapCalls = afterSettleCalls = 0;
        this.server = makeServer();
        clearWorkArea();

        htmx.defineExtension("ext-testswap", {
            onEvent : function(name, evt) {
                if (name === "load.htmx") {
                    loadCalls++;
                }
                if (name === "afterSwap.htmx") {
                    afterSwapCalls++;
                }
                if (name === "afterSettle.htmx") {
                    afterSettleCalls++;
                }
            },
            handleSwap: function (swapStyle, target, fragment, settleInfo) {
                // simple outerHTML replacement for tests
                var parentEl = target.parentElement;
                parentEl.removeChild(target);
                parentEl.appendChild(fragment)
                return true;
            }

        });

    });

    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        htmx.removeExtension("ext-testswap");
    });

    it('handleSwap: afterSwap and afterSettle triggered if extension defined on parent', function () {
        this.server.respondWith("GET", "/test", '<button>Clicked!</button>');
        var div = make('<div hx-ext="ext-testswap"><button hx-get="/test" hx-swap="testswap">Click Me!</button></div>');
        var btn = div.firstChild;
        btn.click()
        this.server.respond();
        afterSwapCalls.should.equal(1);
        afterSettleCalls.should.equal(1);
        loadCalls.should.equal(0); // load.htmlx event on new added button is not triggered
    });
});
