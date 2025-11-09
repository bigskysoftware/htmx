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
        let {fragment} = htmx.__makeFragment('<hx-partial hx-target="#foo">Content</hx-partial>');
        fragment.children[0].tagName.should.equal('TEMPLATE');
        fragment.children[0].hasAttribute('partial').should.be.true;
    })

    it('strips head content', function () {
        let {fragment} = htmx.__makeFragment('<head><title>Title</title></head><div>Body</div>');
        assert.isNull(fragment.querySelector('head'));
        fragment.children[0].tagName.should.equal('DIV');
    })

    it('handles table row content', function () {
        let {fragment} = htmx.__makeFragment('<tr><td>Cell 1</td><td>Cell 2</td></tr>');
        fragment.children[0].tagName.should.equal('TR');
        fragment.children[0].children.length.should.equal(2);
        fragment.children[0].children[0].innerText.should.equal('Cell 1');
        fragment.children[0].children[1].innerText.should.equal('Cell 2');
    })

    it('handles multiple table rows', function () {
        let {fragment} = htmx.__makeFragment('<tr><td>A</td></tr><tr><td>B</td></tr>');
        fragment.children.length.should.equal(2);
        fragment.children[0].tagName.should.equal('TR');
        fragment.children[1].tagName.should.equal('TR');
    })

    it('handles table cell content', function () {
        let {fragment} = htmx.__makeFragment('<td>Cell Content</td>');
        fragment.children[0].tagName.should.equal('TD');
        fragment.children[0].innerText.should.equal('Cell Content');
    })

    it('handles thead content', function () {
        let {fragment} = htmx.__makeFragment('<thead><tr><th>Header</th></tr></thead>');
        fragment.children[0].tagName.should.equal('THEAD');
        fragment.children[0].querySelector('th').innerText.should.equal('Header');
    })

    it('handles tbody content', function () {
        let {fragment} = htmx.__makeFragment('<tbody><tr><td>Data</td></tr></tbody>');
        fragment.children[0].tagName.should.equal('TBODY');
        fragment.children[0].querySelector('td').innerText.should.equal('Data');
    })

    it('handles mixed table elements', function () {
        let {fragment} = htmx.__makeFragment('<thead><tr><th>H</th></tr></thead><tbody><tr><td>D</td></tr></tbody>');
        fragment.children.length.should.equal(2);
        fragment.children[0].tagName.should.equal('THEAD');
        fragment.children[1].tagName.should.equal('TBODY');
    })

});