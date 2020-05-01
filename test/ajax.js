describe("HTMx AJAX Tests", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    // bootstrap test
    it('issues a GET request on click and swaps content', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    });

    it('processes inner content properly', function()
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

    it('handles swap outerHTML properly', function()
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

    it('handles prependBefore properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="prependBefore">*</div>')
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

    it('handles prepend properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="prepend">*</div>')
        div.click();
        this.server.respond();
        div.innerText.should.equal("1*");

        byId("a1").click();
        this.server.respond();
        div.innerText.should.equal("**");

        div.click();
        this.server.respond();
        div.innerText.should.equal("2**");

        byId("a2").click();
        this.server.respond();
        div.innerText.should.equal("***");
    });

    it('handles prepend properly with no initial content', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="prepend"></div>')
        div.click();
        this.server.respond();
        div.innerText.should.equal("1");

        byId("a1").click();
        this.server.respond();
        div.innerText.should.equal("*");

        div.click();
        this.server.respond();
        div.innerText.should.equal("2*");

        byId("a2").click();
        this.server.respond();
        div.innerText.should.equal("**");
    });

    it('handles appendAfter properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="appendAfter">*</div>')
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

    it('handles append properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="append">*</div>')
        div.click();
        this.server.respond();
        div.innerText.should.equal("*1");

        byId("a1").click();
        this.server.respond();
        div.innerText.should.equal("**");

        div.click();
        this.server.respond();
        div.innerText.should.equal("**2");

        byId("a2").click();
        this.server.respond();
        div.innerText.should.equal("***");
    });

    it('handles append properly with no initial content', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="append"></div>')
        div.click();
        this.server.respond();
        div.innerText.should.equal("1");

        byId("a1").click();
        this.server.respond();
        div.innerText.should.equal("*");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*2");

        byId("a2").click();
        this.server.respond();
        div.innerText.should.equal("**");
    });

    it('handles hx-target properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-get="/test" hx-target="#s1">Click Me!</button>');
        var target = make('<span id="s1">Initial</span>');
        btn.click();
        target.innerHTML.should.equal("Initial");
        this.server.respond();
        target.innerHTML.should.equal("Clicked!");
    });

    it('handles 204 NO CONTENT responses properly', function()
    {
        this.server.respondWith("GET", "/test", [204, {}, "No Content!"]);

        var btn = make('<button hx-get="/test">Click Me!</button>');
        btn.click();
        btn.innerHTML.should.equal("Click Me!");
        this.server.respond();
        btn.innerHTML.should.equal("Click Me!");
    });

    it('handles hx-trigger with non-default value', function()
    {
        this.server.respondWith("GET", "/test", "Focused!");

        var btn = make('<button hx-get="/test" hx-trigger="focus">Focus Me!</button>');
        btn.focus();
        btn.innerHTML.should.equal("Focus Me!");
        this.server.respond();
        btn.innerHTML.should.equal("Focused!");
    });

    it('handles hx-trigger with load event', function()
    {
        this.server.respondWith("GET", "/test", "Loaded!");
        var div = make('<div hx-get="/test" hx-trigger="load">Load Me!</div>');
        div.innerHTML.should.equal("Load Me!");
        this.server.respond();
        div.innerHTML.should.equal("Loaded!");
    });

    it('sets the content type of the request properly', function (done) {
        this.server.respondWith("GET", "/test", function(xhr){
            xhr.respond(200, {}, "done");
            xhr.overriddenMimeType.should.equal("text/html");
            done();
        });
        var div = make('<div hx-get="/test">Click Me!</div>');
        div.click();
        this.server.respond();
    });

    it('doesnt issue two requests when clicked twice before response', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "click " + i);
            i++
        });
        var div = make('<div hx-get="/test"></div>');
        div.click();
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("click 1");
    });


})
