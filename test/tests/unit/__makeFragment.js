describe('__makeFragment unit tests', function() {

    it('creates fragment from simple HTML', function () {
        let {fragment} = htmx.__makeFragment('<div>Test</div>');
        fragment.children[0].tagName.should.equal('DIV');
        fragment.children[0].innerText.should.equal('Test');
    })

    it('creates fragment from multiple elements', function () {
        let {fragment} = htmx.__makeFragment('<div>A</div><span>B</span>');
        fragment.children.length.should.equal(2);
        fragment.children[0].innerText.should.equal('A');
        fragment.children[1].innerText.should.equal('B');
    })

    it('extracts title from HTML document', function () {
        let {title} = htmx.__makeFragment('<html><head><title>Test Title</title></head><body></body></html>');
        title.should.equal('Test Title');
    })

    it('handles html tag', function () {
        let {fragment} = htmx.__makeFragment('<html><body><div>Test</div></body></html>');
        fragment.children[0].tagName.should.equal('DIV');
    })

    it('handles body tag', function () {
        let {fragment} = htmx.__makeFragment('<body><div>Test</div></body>');
        fragment.children[0].tagName.should.equal('DIV');
    })

    it('converts partial tags to template', function () {
        let {fragment} = htmx.__makeFragment('<partial hx-target="#foo">Content</partial>');
        fragment.children[0].tagName.should.equal('TEMPLATE');
        fragment.children[0].hasAttribute('partial').should.be.true;
    })

    it('strips head content', function () {
        let {fragment} = htmx.__makeFragment('<head><title>Title</title></head><div>Body</div>');
        assert.isNull(fragment.querySelector('head'));
        fragment.children[0].tagName.should.equal('DIV');
    })

});