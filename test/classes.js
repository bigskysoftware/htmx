describe("HTMx class modification attributes", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('adds classes properly', function(done)
    {
        let div = make('<div hx-add-class="c1">Click Me!</div>')
        should.equal(div.classList.length, 0);
        setTimeout(function(){
            should.equal(div.classList.contains("c1"), true);
            done();
        }, 100);
    });

    it('removes classes properly', function(done)
    {
        let div = make('<div class="foo bar" hx-remove-class="bar">Click Me!</div>')
        should.equal(div.classList.contains("foo"), true);
        should.equal(div.classList.contains("bar"), true);
        setTimeout(function(){
            should.equal(div.classList.contains("foo"), true);
            should.equal(div.classList.contains("bar"), false);
            done();
        }, 100);
    });
})
