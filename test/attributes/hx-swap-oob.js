describe("hx-swap-oob attribute", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic response properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-oob='true'>Swapped0</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped0");
    })

    it('handles more than one oob swap properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-oob='true'>Swapped1</div><div id='d2' hx-swap-oob='true'>Swapped2</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        make('<div id="d2"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped1");
        byId("d2").innerHTML.should.equal("Swapped2");
    })

    it('handles no id match properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' hx-swap-oob='true'>Swapped2</div>");
        var div = make('<div hx-get="/test">click me</div>');
        div.click();
        this.server.respond();
        div.innerText.should.equal("Clicked");
    })

    it('handles basic response properly w/ data-* prefix', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' data-hx-swap-oob='true'>Swapped3</div>");
        var div = make('<div data-hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped3");
    })

    it('handles outerHTML response properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' foo='bar' hx-swap-oob='outerHTML'>Swapped4</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        byId("d1").getAttribute("foo").should.equal("bar");
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped4");
    })

    it('handles innerHTML response properly', function () {
        this.server.respondWith("GET", "/test", "Clicked<div id='d1' foo='bar' hx-swap-oob='innerHTML'>Swapped5</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        should.equal(byId("d1").getAttribute("foo"), null);
        div.innerHTML.should.equal("Clicked");
        byId("d1").innerHTML.should.equal("Swapped5");
    })

    it('oob swaps can be nested in content', function () {
        this.server.respondWith("GET", "/test", "<div>Clicked<div id='d1' foo='bar' hx-swap-oob='innerHTML'>Swapped6</div></div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"></div>');
        div.click();
        this.server.respond();
        should.equal(byId("d1").getAttribute("foo"), null);
        div.innerHTML.should.equal("<div>Clicked</div>");
        byId("d1").innerHTML.should.equal("Swapped6");
    })

    it('oob swaps can use selectors to match up', function () {
        this.server.respondWith("GET", "/test", "<div>Clicked<div hx-swap-oob='innerHTML:[oob-foo]'>Swapped7</div></div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1" oob-foo="bar"></div>');
        div.click();
        this.server.respond();
        should.equal(byId("d1").getAttribute("oob-foo"), "bar");
        div.innerHTML.should.equal("<div>Clicked</div>");
        byId("d1").innerHTML.should.equal("Swapped7");
    })

    it('swaps into all targets that match the selector (innerHTML)', function () {
        this.server.respondWith("GET", "/test", "<div>Clicked</div><div class='target' hx-swap-oob='innerHTML:.target'>Swapped8</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1">No swap</div>');
        make('<div id="d2" class="target">Not swapped</div>');
        make('<div id="d3" class="target">Not swapped</div>');
        div.click();
        this.server.respond();
        byId("d1").innerHTML.should.equal("No swap");
        byId("d2").innerHTML.should.equal("Swapped8");
        byId("d3").innerHTML.should.equal("Swapped8");
    })

    it('swaps into all targets that match the selector (outerHTML)', function () {
        var oobSwapContent = '<div class="new-target" hx-swap-oob="outerHTML:.target">Swapped9</div>';
        this.server.respondWith("GET", "/test", "<div>Clicked</div>" + oobSwapContent);
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="d1"><div>No swap</div></div>');
        make('<div id="d2"><div class="target">Not swapped</div></div>');
        make('<div id="d3"><div class="target">Not swapped</div></div>');
        div.click();
        this.server.respond();
        byId("d1").innerHTML.should.equal("<div>No swap</div>");
        byId("d2").innerHTML.should.equal(oobSwapContent);
        byId("d3").innerHTML.should.equal(oobSwapContent);
    })

    it('oob swap delete works properly', function()
    {
        this.server.respondWith("GET", "/test", '<div hx-swap-oob="delete" id="d1"></div>');

        var div = make('<div id="d1" hx-get="/test">Foo</div>')
        div.click();
        this.server.respond();
        should.equal(byId("d1"), null);
    });

    it('handles elements with IDs containing special characters properly', function () {
        this.server.respondWith("GET", "/test", "<div id='foo-/bar/' hx-swap-oob='innerHTML'>Swapped10</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="foo-/bar/">Existing Content</div>');
        div.click();
        this.server.respond();
        var swappedElement = document.querySelector('[id="foo-/bar/"]');
        swappedElement.innerHTML.should.equal("Swapped10");
    })
    
    it('handles one swap into multiple elements with the same ID properly', function () {
        this.server.respondWith("GET", "/test", "<div id='foo-/bar/' hx-swap-oob='innerHTML'>Swapped11</div>");
        var div = make('<div hx-get="/test">click me</div>');
        make('<div id="foo-/bar/">Existing Content 1</div>');
        make('<div id="foo-/bar/">Existing Content 2</div>');
        div.click();
        this.server.respond();
        var swappedElements = document.querySelectorAll('[id="foo-/bar/"]');
        swappedElements.forEach(function(element) {
            element.innerHTML.should.equal("Swapped11");
        });
    })    
});

