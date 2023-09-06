describe("hyperscript integration", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();

        if (IsIE11()) {
            this.title += " - Skipped as hyperscript isn't IE11 compatible"
            this.skip()
        }
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('can trigger with a custom event', function () {
        this.server.respondWith("GET", "/test", "Custom Event Sent!");
        var btn = make('<button _="on click send customEvent" hx-trigger="customEvent" hx-get="/test">Click Me!</button>')
        htmx.trigger(btn, "htmx:load"); // have to manually trigger the load event for non-AJAX dynamic content
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Custom Event Sent!");
    });

    it('can handle htmx driven events', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button _="on htmx:afterSettle add .afterSettle" hx-get="/test">Click Me!</button>')
        htmx.trigger(btn, "htmx:load");
        btn.classList.contains("afterSettle").should.equal(false);
        btn.click();
        this.server.respond();
        btn.classList.contains("afterSettle").should.equal(true);
    });

    it('can handle htmx error events', function () {
        this.server.respondWith("GET", "/test", [404, {}, "Bad request"]);
        var div = make('<div id="d1"></div>')
        var btn = make('<button _="on htmx:error(errorInfo) put errorInfo.error into #d1.innerHTML" hx-get="/test">Click Me!</button>')
        htmx.trigger(btn, "htmx:load");
        btn.click();
        this.server.respond();
        div.innerHTML.startsWith("Response Status Error Code 404 from");
    });

    it('hyperscript in non-htmx annotated nodes is evaluated', function () {
        this.server.respondWith("GET", "/test", "<div><div><div id='d1' _='on click put \"Clicked...\" into my.innerHTML'></div></div></div>");
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        var newDiv = byId("d1");
        newDiv.click();
        newDiv.innerText.should.equal("Clicked...");
    });

    it('hyperscript removal example works', function (done) {
        this.server.respondWith("GET", "/test", "<div id='d1' _='on load wait 20ms then remove me'>To Remove</div>");
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        var newDiv = byId("d1");
        newDiv.innerText.should.equal("To Remove")
        setTimeout(function(){
            newDiv = byId("d1");
            should.equal(newDiv, null);
            done();
        }, 100);
    });

});