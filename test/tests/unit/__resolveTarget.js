describe('__resolveTarget unit tests', function() {

    it('returns element when selector is an Element', function () {
        let div = createProcessedHTML('<div></div>');
        let result = htmx.__resolveTarget(div, div);
        result.should.equal(div);
    })

    it('returns element when selector is "this" and element has hx-target', function () {
        let div = createProcessedHTML('<div hx-target="this"></div>');
        let result = htmx.__resolveTarget(div, 'this');
        result.should.equal(div);
    })

    it('returns element when selector is null', function () {
        let div = createProcessedHTML('<div></div>');
        let result = htmx.__resolveTarget(div, null);
        result.should.equal(div);
    })

    it('uses find when selector is a CSS selector', function () {
        let div = createProcessedHTML('<div><span id="target"></span></div>');
        let result = htmx.__resolveTarget(div, '#target');
        result.should.equal(div.querySelector('#target'));
    })

});