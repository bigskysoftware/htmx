describe("response-targets extension", function() {
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('targets an adjacent element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" hx-target-404="#d1" hx-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets an adjacent element properly with wildcard', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" hx-target-4*="#d1" hx-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a parent element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets" id="d1"><button id="b1" hx-target-404="#d1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a parent element properly with wildcard', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets" id="d1"><button id="b1" hx-target-*="#d1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a `this` element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets" hx-target-404="this"><button id="b1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a `closest` element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets"><p><i><button id="b1" hx-target-404="closest div" hx-get="/test">Click Me!</button></i></p></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a `closest` element properly w/ hyperscript syntax', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets"><p><i><button id="b1" hx-target-404="closest <div/>" hx-get="/test">Click Me!</button></i></p></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a `find` element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets" hx-target-404="find span" hx-get="/test">Click Me! <div><span id="s1"></span><span id="s2"></span></div></div>')
        div1.click();
        this.server.respond();
        var span1 = byId("s1")
        var span2 = byId("s2")
        span1.innerHTML.should.equal("Not found!");
        span2.innerHTML.should.equal("");
    });

    it('targets a `find` element properly w/ hyperscript syntax', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var div1 = make('<div hx-ext="response-targets" hx-target-404="find <span/>" hx-get="/test">Click Me! <div><span id="s1"></span><span id="s2"></span></div></div>')
        div1.click();
        this.server.respond();
        var span1 = byId("s1")
        var span2 = byId("s2")
        span1.innerHTML.should.equal("Not found!");
        span2.innerHTML.should.equal("");
    });

    it('targets an inner element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" hx-target-404="#d1" hx-get="/test">Click Me!<div id="d1"></div></button>')
        var div1 = byId("d1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets an inner element properly w/ hyperscript syntax', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" hx-target-404="<#d1/>" hx-get="/test">Click Me!<div id="d1"></div></button>')
        var div1 = byId("d1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('handles bad target gracefully', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" hx-target-404="bad" hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Click Me!");
    });


    it('targets an adjacent element properly w/ data-* prefix', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" data-hx-target-404="#d1" data-hx-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
    });

    it('targets a `next` element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        make('<div hx-ext="response-targets">' +
            '  <div id="d3"></div>' +
            '  <button id="b1" hx-target-404="next div" hx-get="/test">Click Me!</button>' +
            '  <div id="d1"></div>' +
            '  <div id="d2"></div>' +
            '</div>')
        var btn = byId("b1")
        var div1 = byId("d1")
        var div2 = byId("d2")
        var div3 = byId("d3")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
        div2.innerHTML.should.equal("");
        div3.innerHTML.should.equal("");
    });

    it('targets a `next` element properly w/ hyperscript syntax', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        make('<div hx-ext="response-targets">' +
            '  <div id="d3"></div>' +
            '  <button id="b1" hx-target-404="next <div/>" hx-get="/test">Click Me!</button>' +
            '  <div id="d1"></div>' +
            '  <div id="d2"></div>' +
            '</div>')
        var btn = byId("b1")
        var div1 = byId("d1")
        var div2 = byId("d2")
        var div3 = byId("d3")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Not found!");
        div2.innerHTML.should.equal("");
        div3.innerHTML.should.equal("");
    });

    it('targets a `previous` element properly', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        make('<div hx-ext="response-targets">' +
            '  <div id="d3"></div>' +
            '  <button id="b1" hx-target-404="previous div" hx-get="/test">Click Me!</button>' +
            '  <div id="d1"></div>' +
            '  <div id="d2"></div>' +
            '</div>')
        var btn = byId("b1")
        var div1 = byId("d1")
        var div2 = byId("d2")
        var div3 = byId("d3")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("");
        div2.innerHTML.should.equal("");
        div3.innerHTML.should.equal("Not found!");
    });

    it('targets a `previous` element properly w/ hyperscript syntax', function()
    {
        this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
        make('<div hx-ext="response-targets">' +
            '  <div id="d3"></div>' +
            '  <button id="b1" hx-target-404="previous <div/>" hx-get="/test">Click Me!</button>' +
            '  <div id="d1"></div>' +
            '  <div id="d2"></div>' +
            '</div>')
        var btn = byId("b1")
        var div1 = byId("d1")
        var div2 = byId("d2")
        var div3 = byId("d3")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("");
        div2.innerHTML.should.equal("");
        div3.innerHTML.should.equal("Not found!");
    });

    it('targets the element specified in headers if configured to prefer it (default)', function () {
        this.server.respondWith("GET", "/test", [404, { "HX-Retarget": "#d2" }, "Not found!"]);
        var btn = make('<button hx-ext="response-targets" hx-target-404="#d1" hx-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        var div2 = make('<div id="d2"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("");
        div2.innerHTML.should.equal("Not found!");
    });

    it('ignores the HX-Retarget header when responseTargetPrefersRetargetHeader is false', function () {
        htmx.config.responseTargetPrefersRetargetHeader = false;
        try {
            this.server.respondWith("GET", "/test", [404, { "HX-Retarget": "#d2" }, "Not found!"]);
            var btn = make('<button hx-ext="response-targets" hx-target-404="#d1" hx-get="/test">Click Me!</button>')
            var div1 = make('<div id="d1"></div>')
            var div2 = make('<div id="d2"></div>')
            btn.click();
            this.server.respond();
            div1.innerHTML.should.equal("Not found!");
            div2.innerHTML.should.equal("");
        } finally {
            htmx.config.responseTargetPrefersRetargetHeader = true;
        }
    });

    it('targets the already established target when responseTargetPrefersExisting is true', function () {
        htmx.config.responseTargetPrefersExisting = true;
        try {
            this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
            var btn = make('<button hx-ext="response-targets" hx-target-404="#d1" hx-get="/test">Click Me!</button>')
            var div1 = make('<div id="d1"></div>')
            btn.click();
            this.server.respond();
            div1.innerHTML.should.equal("");
            btn.innerHTML.should.equal("Not found!");
        } finally {
            htmx.config.responseTargetPrefersExisting = false;
        }
    });

    describe('status code formatting', function()
    {
        var attributes = [
            "hx-target-404",

            "hx-target-40*",
            "hx-target-40x",

            "hx-target-4*",
            "hx-target-4x",
            "hx-target-4**",
            "hx-target-4xx",

            "hx-target-*",
            "hx-target-x",
            "hx-target-***",
            "hx-target-xxx",
        ];

        // String replacement because IE11 doesn't support template literals
        var btnMarkup = '<button hx-ext="response-targets" HX_TARGET="#d1" hx-get="/test">Click Me!</button>';
        // forEach because IE11 doesn't play nice with closures inside for loops
        attributes.forEach(function(attribute) {
            it('supports ' + attribute, function() {
                this.server.respondWith("GET", "/test", [404, {}, "Not found!"]);
                var btn = make(btnMarkup.replace("HX_TARGET", attribute));
                var div1 = make('<div id="d1"></div>')
                btn.click();
                this.server.respond();
                div1.innerHTML.should.equal("Not found!");
            });
        });
    });
});
