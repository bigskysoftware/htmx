describe("hx-error-swap attribute", function () {
    beforeEach(function () {
        this.server = makeServer();
        var server = this.server
        this.server.respondWithRandomError = function (method, url, html) {
            server.respondWith(method, url, function (xhr) {
                // random error code
                var code = 400 + Math.floor(Math.random() * 199)
                xhr.respond(code, {}, html);
            })
        }
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('400 content can be swapped with only hx-error-swap set', function () {
        this.server.respondWithRandomError("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-error-swap="innerHTML">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Clicked!");
    });

    it('error-swap innerHTML properly', function () {
        this.server.respondWithRandomError("GET", "/test", '<a hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div hx-get="/test" hx-error-swap="innerHTML"></div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('<a hx-get="/test2">Click Me</a>');
        var a = div.querySelector('a');
        a.click();
        this.server.respond();
        a.innerHTML.should.equal('Clicked!');
    });

    it('error-swap outerHTML properly', function () {
        this.server.respondWithRandomError("GET", "/test", '<a id="a1" hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div id="d1" hx-get="/test" hx-error-swap="outerHTML"></div>')
        div.click();
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        byId("a1").click();
        this.server.respond();
        byId("a1").innerHTML.should.equal('Clicked!');
    });

    it('error-swap beforebegin properly', function () {
        var i = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            i++;
            xhr.respond(400, {}, '<a id="a' + i + '" hx-get="/test2" hx-error-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWithRandomError("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-error-swap="beforebegin">*</div>')
        var parent = div.parentElement;
        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("1*");

        byId("a1").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("**");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("*2*");

        byId("a2").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("***");
    });

    it('error-swap afterbegin properly', function () {
        var i = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            i++;
            xhr.respond(400, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-error-swap="afterbegin">*</div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("1*");

        div.click();
        this.server.respond();
        div.innerText.should.equal("21*");

        div.click();
        this.server.respond();
        div.innerText.should.equal("321*");
    });

    it('error-swap afterbegin properly with no initial content', function () {
        var i = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            i++;
            xhr.respond(400, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-error-swap="afterbegin"></div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("1");

        div.click();
        this.server.respond();
        div.innerText.should.equal("21");

        div.click();
        this.server.respond();
        div.innerText.should.equal("321");
    });

    it('error-swap afterend properly', function () {
        var i = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            i++;
            xhr.respond(400, {}, '<a id="a' + i + '" hx-get="/test2" hx-error-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWithRandomError("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-error-swap="afterend">*</div>')
        var parent = div.parentElement;
        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("*1");

        byId("a1").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("**");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("*2*");

        byId("a2").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("***");
    });

    it('handles beforeend properly', function () {
        var i = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            i++;
            xhr.respond(400, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-error-swap="beforeend">*</div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("*1");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*12");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*123");
    });

    it('handles beforeend properly with no initial content', function () {
        var i = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            i++;
            xhr.respond(400, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-error-swap="beforeend"></div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("1");

        div.click();
        this.server.respond();
        div.innerText.should.equal("12");

        div.click();
        this.server.respond();
        div.innerText.should.equal("123");
    });

    it('properly parses various swap specifications', function () {
        var errorSwapSpec = function (elt) {
            return htmx._("getSwapSpecification")(elt, null, true); // internal function for swap spec
        }
        errorSwapSpec(make("<div/>")).swapStyle.should.equal("none")
        errorSwapSpec(make("<div hx-swap='outerHTML'/>")).swapStyle.should.equal("none")
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='mirror'/>")).swapStyle.should.equal("outerHTML")
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML'/>")).swapStyle.should.equal("innerHTML")
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML'/>")).swapDelay.should.equal(0)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML'/>")).settleDelay.should.equal(0) // set to 0 in tests
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML swap:10'/>")).swapDelay.should.equal(10)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML settle:10'/>")).settleDelay.should.equal(10)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML swap:10 settle:11'/>")).swapDelay.should.equal(10)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML swap:10 settle:11'/>")).settleDelay.should.equal(11)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML settle:11 swap:10'/>")).swapDelay.should.equal(10)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML settle:11 swap:10'/>")).settleDelay.should.equal(11)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML nonsense settle:11 swap:10'/>")).settleDelay.should.equal(11)
        errorSwapSpec(make("<div hx-swap='outerHTML' hx-error-swap='innerHTML   nonsense   settle:11   swap:10  '/>")).settleDelay.should.equal(11)
    })

    it('works with a swap delay', function (done) {
        this.server.respondWithRandomError("GET", "/test", "Clicked!");
        var div = make("<div hx-get='/test' hx-error-swap='innerHTML swap:10ms'></div>");
        div.click();
        this.server.respond();
        div.innerText.should.equal("");
        setTimeout(function () {
            div.innerText.should.equal("Clicked!");
            done();
        }, 30);
    });

    it('works with a settle delay', function (done) {
        this.server.respondWithRandomError("GET", "/test", "<div id='d1' class='foo' hx-get='/test' hx-error-swap='outerHTML settle:10ms'></div>");
        var div = make("<div id='d1' hx-get='/test' hx-error-swap='outerHTML settle:10ms'></div>");
        div.click();
        this.server.respond();
        div.classList.contains('foo').should.equal(false);
        setTimeout(function () {
            byId('d1').classList.contains('foo').should.equal(true);
            done();
        }, 30);
    });

    it('error-swap none works properly', function () {
        this.server.respondWithRandomError("GET", "/test", 'Ooops, swapped');

        var div = make('<div hx-error-swap="none" hx-get="/test">Foo</div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('Foo');
    });

    it('error-swap outerHTML does not trigger htmx:afterSwap on original element', function () {
        this.server.respondWithRandomError("GET", "/test", 'Clicked!');
        var div = make('<div id="d1" hx-get="/test" hx-error-swap="outerHTML"></div>')
        div.addEventListener("htmx:afterSwap", function () {
            count++;
        })
        div.click();
        var count = 0;
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        count.should.equal(0);
    });

    it('error-swap delete works properly', function () {
        this.server.respondWithRandomError("GET", "/test", 'Oops, deleted!');

        var div = make('<div id="d1" hx-error-swap="delete" hx-get="/test">Foo</div>')
        div.click();
        this.server.respond();
        should.equal(byId("d1"), null);
    });

    it('error-swap mirror with swap outerHTML works properly', function () {
        this.server.respondWithRandomError("GET", "/test", '<a id="a1" hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML" hx-error-swap="mirror"></div>')
        div.click();
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        byId("a1").click();
        this.server.respond();
        byId("a1").innerHTML.should.equal('Clicked!');
    });

    it('error-swap mirror with swap delete works properly', function () {
        this.server.respondWithRandomError("GET", "/test", 'Oops, deleted!');

        var div = make('<div id="d1" hx-swap="delete" hx-error-swap="mirror" hx-get="/test">Foo</div>')
        div.click();
        this.server.respond();
        should.equal(byId("d1"), null);
    });

    it('error-swap works properly along different hx-swap', function () {
        this.server.respondWithRandomError("GET", "/test", '<a id="a1" hx-swap="delete" hx-error-swap="innerHTML" hx-get="/test2">Click Me</a>');
        this.server.respondWithRandomError("GET", "/test2", "Clicked!");

        var div = make('<div id="d1" hx-get="/test" hx-swap="innerHTML" hx-error-swap="outerHTML"></div>')
        div.click();
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        byId("a1").click();
        this.server.respond();
        byId("a1").innerHTML.should.equal('Clicked!');
    });

    it('"mirror" error-swap strategy works properly along default swap strategy', function () {
        this.server.respondWithRandomError("GET", "/test", "Clicked!");

        var div = make('<div hx-error-swap="mirror" hx-get="/test">Initial</div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('Clicked!');
    });
})
