describe('__executeJavaScript', function() {

    it('returns the evaluated value by default', function() {
        let elt = document.createElement('div');
        htmx.__executeJavaScript(elt, { value: 41 }, 'value + 1', true, false).should.equal(42);
    });

    it('returns a reusable function when compile is true', function() {
        let elt = document.createElement('div');
        let run = htmx.__executeJavaScript(elt, { value: 41 }, 'value + 1', true, false, true);
        assert.isFunction(run);
        run().should.equal(42);
        run().should.equal(42);
    });

});
