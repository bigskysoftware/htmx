describe("loading states extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        this.clock = sinon.useFakeTimers();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        this.clock.restore();
        clearWorkArea();
    });

    it('works on basic setup', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<div data-loading>');
        btn.click();
        element.style.display.should.be.equal("inline-block");
        this.server.respond();
        element.style.display.should.be.equal("none");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with custom display', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<div data-loading="flex">');
        btn.click();
        element.style.display.should.be.equal("flex");
        this.server.respond();
        element.style.display.should.be.equal("none");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with classes', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<div data-loading-class="test">');
        btn.click();
        element.should.have.class("test");
        this.server.respond();
        element.should.not.have.class("test");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with classes removal', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<div data-loading-class-remove="test" class="test">');
        btn.click();
        element.should.not.have.class("test");
        this.server.respond();
        element.should.have.class("test");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with disabling', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<button data-loading-disable>');
        btn.click();
        element.disabled.should.be.true;
        this.server.respond();
        element.disabled.should.be.false;
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with aria-busy', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<button data-loading-aria-busy>');
        btn.click();
        element.should.have.attribute("aria-busy", "true");
        this.server.respond();
        element.should.not.have.attribute("aria-busy");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with multiple directives', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<button data-loading-aria-busy data-loading-class="loading" data-loading-class-remove="not-loading" class="not-loading">');
        btn.click();
        element.should.have.attribute("aria-busy", "true");
        element.should.have.class("loading")
        element.should.not.have.class("not-loading")
        this.server.respond();
        element.should.not.have.attribute("aria-busy");
        element.should.not.have.class("loading")
        element.should.have.class("not-loading")
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with delay', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states">Click Me!</button>');
        var element = make('<div data-loading-class-remove="test" data-loading-delay="1s" class="test">');
        btn.click();
        element.should.have.class("test");
        this.clock.tick(1000);
        element.should.not.have.class("test");
        this.server.respond();
        element.should.have.class("test");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with custom targets', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states" data-loading-target="#loader" data-loading-class="test">Click Me!</button>');
        var element = make('<div id="loader">');
        btn.click();
        element.should.have.class("test");
        this.server.respond();
        element.should.not.have.class("test");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with path filters', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="loading-states" >Click Me!</button>');
        var matchingRequestElement = make('<div data-loading-class="test" data-loading-path="/test">');
        var nonMatchingPathElement = make('<div data-loading-class="test" data-loading-path="/test1">');
        btn.click();
        matchingRequestElement.should.have.class("test");
        nonMatchingPathElement.should.not.have.class("test");
        this.server.respond();
        matchingRequestElement.should.not.have.class("test");
        nonMatchingPathElement.should.not.have.class("test");
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with scopes', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<div data-loading-states><button hx-get="/test" hx-ext="loading-states" >Click Me!</button></div>');
        var element = make('<div data-loading-class="test">');
        btn.getElementsByTagName("button")[0].click();
        element.should.not.have.class("test");
        this.server.respond();
        element.should.not.have.class("test");
        btn.getElementsByTagName("button")[0].innerHTML.should.equal("Clicked!");
    });

});
