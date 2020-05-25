describe("class-tools extension", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('adds classes properly', function(done)
    {
        var div = make('<div hx-ext="class-tools" classes="add c1">Click Me!</div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(div.classList.contains("c1"), true);
            done();
        }, 100);
    });

    it('removes classes properly', function(done)
    {
        var div = make('<div class="foo bar" hx-ext="class-tools" classes="remove bar">Click Me!</div>')
        should.equal(div.classList.contains("foo"), true);
        should.equal(div.classList.contains("bar"), true);
        setTimeout(function(){
            should.equal(div.classList.contains("foo"), true);
            should.equal(div.classList.contains("bar"), false);
            done();
        }, 100);
    });

    it('adds classes properly w/ data-* prefix', function(done)
    {
        var div = make('<div hx-ext="class-tools" data-classes="add c1">Click Me!</div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(div.classList.contains("c1"), true);
            done();
        }, 100);
    });

    it('extension can be on parent', function(done)
    {
        var div = make('<div hx-ext="class-tools"><div id="d1" classes="add c1">Click Me!</div></div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(div.classList.contains("c1"), false);
            should.equal(byId("d1").classList.contains("c1"), true);
            done();
        }, 100);
    });


})
