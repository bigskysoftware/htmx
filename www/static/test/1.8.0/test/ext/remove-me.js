describe("remove-me extension", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('removes elements properly', function(done)
    {
        var div = make('<div id="d1" hx-ext="remove-me" remove-me="20ms">Click Me!</div>')
        byId("d1").should.equal(div)
        setTimeout(function(){
            should.equal(byId("d1"), null);
            done();
        }, 40);
    });


    it('removes properly w/ data-* prefix', function(done)
    {
        var div = make('<div hx-ext="remove-me" data-remove-me="20ms">Click Me!</div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(div.parentElement, null);
            done();
        }, 100);
    });

    it('extension can be on parent', function(done)
    {
        var div = make('<div hx-ext="remove-me"><div id="d1" remove-me="20ms">Click Me!</div></div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(byId("d1"), null);
            done();
        }, 100);
    });

    it('extension can be on a child', function(done)
    {
        var div = make('<div><div hx-ext="remove-me" id="d1" remove-me="20ms">Click Me!</div></div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(byId("d1"), null);
            done();
        }, 100);
    });


})
