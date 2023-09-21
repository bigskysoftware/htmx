describe("hx-disabled-elt attribute", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('single element can be disabled w/ hx-disabled elts', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-disabled-elt="this">Click Me!</button>')
        btn.hasAttribute('disabled').should.equal(false);
        btn.click();
        btn.hasAttribute('disabled').should.equal(true);
        this.server.respond();
        btn.hasAttribute('disabled').should.equal(false);
    });


    it('single element can be disabled w/ data-hx-disabled elts', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" data-hx-disabled-elt="this">Click Me!</button>')
        btn.hasAttribute('disabled').should.equal(false);
        btn.click();
        btn.hasAttribute('disabled').should.equal(true);
        this.server.respond();
        btn.hasAttribute('disabled').should.equal(false);
    });

    it('single element can be disabled w/ closest syntax', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var fieldset = make('<fieldset><button id="b1" hx-get="/test" hx-disabled-elt="closest fieldset">Click Me!</button></fieldset>')
        var btn = byId('b1');
        fieldset.hasAttribute('disabled').should.equal(false);
        btn.click();
        fieldset.hasAttribute('disabled').should.equal(true);
        this.server.respond();
        fieldset.hasAttribute('disabled').should.equal(false);
    });

    it('multiple requests with same disabled elt are handled properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var b1 = make('<button hx-get="/test" hx-disabled-elt="#b3">Click Me!</button>')
        var b2 = make('<button hx-get="/test" hx-disabled-elt="#b3">Click Me!</button>')
        var b3 = make('<button id="b3">Demo</button>')
        b3.hasAttribute('disabled').should.equal(false);

        b1.click();
        b3.hasAttribute('disabled').should.equal(true);

        b2.click();
        b3.hasAttribute('disabled').should.equal(true);


        // hack to make sinon process only one response
        this.server.processRequest(this.server.queue.shift());

        b3.hasAttribute('disabled').should.equal(true);

        this.server.respond();

        b3.hasAttribute('disabled').should.equal(false);

    });

    it('multiple elts can be disabled', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var b1 = make('<button hx-get="/test" hx-disabled-elt="#b2, #b3">Click Me!</button>')
        var b2 = make('<button id="b2">Click Me!</button>')
        var b3 = make('<button id="b3">Demo</button>')

        b2.hasAttribute('disabled').should.equal(false);
        b3.hasAttribute('disabled').should.equal(false);

        b1.click();
        b2.hasAttribute('disabled').should.equal(true);
        b3.hasAttribute('disabled').should.equal(true);

        this.server.respond();

        b2.hasAttribute('disabled').should.equal(false);
        b3.hasAttribute('disabled').should.equal(false);

    });


})
