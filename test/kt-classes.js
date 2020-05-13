describe("kt-classes attribute", function(){
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
        var div = make('<div kt-classes="add c1">Click Me!</div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(div.classList.contains("c1"), true);
            done();
        }, 100);
    });

    it('removes classes properly', function(done)
    {
        var div = make('<div class="foo bar" kt-classes="remove bar">Click Me!</div>')
        should.equal(div.classList.contains("foo"), true);
        should.equal(div.classList.contains("bar"), true);
        setTimeout(function(){
            should.equal(div.classList.contains("foo"), true);
            should.equal(div.classList.contains("bar"), false);
            done();
        }, 100);
    });
})
