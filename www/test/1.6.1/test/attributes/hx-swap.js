describe("hx-swap attribute", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('swap innerHTML properly', function()
    {
        this.server.respondWith("GET", "/test", '<a hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div hx-get="/test"></div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('<a hx-get="/test2">Click Me</a>');
        var a = div.querySelector('a');
        a.click();
        this.server.respond();
        a.innerHTML.should.equal('Clicked!');
    });

    it('swap outerHTML properly', function()
    {
        this.server.respondWith("GET", "/test", '<a id="a1" hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
        div.click();
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        byId("a1").click();
        this.server.respond();
        byId("a1").innerHTML.should.equal('Clicked!');
    });

    it('swap beforebegin properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="beforebegin">*</div>')
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

    it('swap afterbegin properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="afterbegin">*</div>')

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

    it('swap afterbegin properly with no initial content', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="afterbegin"></div>')

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

    it('swap afterend properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="afterend">*</div>')
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

    it('handles beforeend properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="beforeend">*</div>')

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

    it('handles beforeend properly with no initial content', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="beforeend"></div>')

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

    it('properly parses various swap specifications', function(){
        var swapSpec = htmx._("getSwapSpecification"); // internal function for swap spec
        swapSpec(make("<div/>")).swapStyle.should.equal("innerHTML")
        swapSpec(make("<div hx-swap='innerHTML'/>")).swapStyle.should.equal("innerHTML")
        swapSpec(make("<div hx-swap='innerHTML'/>")).swapDelay.should.equal(0)
        swapSpec(make("<div hx-swap='innerHTML'/>")).settleDelay.should.equal(0) // set to 0 in tests
        swapSpec(make("<div hx-swap='innerHTML swap:10'/>")).swapDelay.should.equal(10)
        swapSpec(make("<div hx-swap='innerHTML settle:10'/>")).settleDelay.should.equal(10)
        swapSpec(make("<div hx-swap='innerHTML swap:10 settle:11'/>")).swapDelay.should.equal(10)
        swapSpec(make("<div hx-swap='innerHTML swap:10 settle:11'/>")).settleDelay.should.equal(11)
        swapSpec(make("<div hx-swap='innerHTML settle:11 swap:10'/>")).swapDelay.should.equal(10)
        swapSpec(make("<div hx-swap='innerHTML settle:11 swap:10'/>")).settleDelay.should.equal(11)
        swapSpec(make("<div hx-swap='innerHTML nonsense settle:11 swap:10'/>")).settleDelay.should.equal(11)
        swapSpec(make("<div hx-swap='innerHTML   nonsense   settle:11   swap:10  '/>")).settleDelay.should.equal(11)
    })

    it('works with a swap delay', function(done) {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make("<div hx-get='/test' hx-swap='innerHTML swap:10ms'></div>");
        div.click();
        this.server.respond();
        div.innerText.should.equal("");
        setTimeout(function () {
            div.innerText.should.equal("Clicked!");
            done();
        }, 30);
    });

    it('works with a settle delay', function(done) {
        this.server.respondWith("GET", "/test", "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML settle:10ms'></div>");
        var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML settle:10ms'></div>");
        div.click();
        this.server.respond();
        div.classList.contains('foo').should.equal(false);
        setTimeout(function () {
            byId('d1').classList.contains('foo').should.equal(true);
            done();
        }, 30);
    });

    it('swap outerHTML properly  w/ data-* prefix', function()
    {
        this.server.respondWith("GET", "/test", '<a id="a1" data-hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div id="d1" data-hx-get="/test" data-hx-swap="outerHTML"></div>')
        div.click();
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        byId("a1").click();
        this.server.respond();
        byId("a1").innerHTML.should.equal('Clicked!');
    });

    it('swap none works properly', function()
    {
        this.server.respondWith("GET", "/test", 'Ooops, swapped');

        var div = make('<div hx-swap="none" hx-get="/test">Foo</div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('Foo');
    });


    it('swap outerHTML does not trigger htmx:afterSwap on original element', function()
    {
        this.server.respondWith("GET", "/test", 'Clicked!');
        var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
        div.addEventListener("htmx:afterSwap", function(){
            count++;
        })
        div.click();
        var count = 0;
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        count.should.equal(0);
    });

})
