describe('find functions', function() {

    it('find() returns first matching element', function() {
        createProcessedHTML('<div class="foo"></div><div class="foo"></div>');
        const result = htmx.find('.foo');
        assert.equal(result.className, 'foo');
    });

    it('findAll() returns all matching elements', function() {
        createProcessedHTML('<div class="foo"></div><div class="foo"></div>');
        const results = htmx.findAll('.foo');
        assert.equal(results.length, 2);
    });

    it('_findExt() finds with closest selector', function() {
        const child = createProcessedHTML('<div class="parent"><span class="child"></span></div>').querySelector('.child');
        const result = htmx.__findExt(child, 'closest .parent');
        assert.equal(result.className, 'parent');
    });

    it('_findExt() finds with next selector', function() {
        createProcessedHTML('<div id="first"></div><div id="second"></div>');
        const first = document.getElementById('first');
        const result = htmx.__findExt(first, 'next');
        assert.equal(result.id, 'second');
    });

    it('_findExt() finds with previous selector', function() {
        createProcessedHTML('<div id="first"></div><div id="second"></div>');
        const second = document.getElementById('second');
        const result = htmx.__findExt(second, 'previous');
        assert.equal(result.id, 'first');
    });

    it('_findExt() finds with hyperscript-style selector', function() {
        const div = createProcessedHTML('<div><span class="target"></span></div>');
        const result = htmx.__findExt(div, '<.target/>');
        assert.equal(result.className, 'target');
    });

    it('__findAllExt() returns array with multiple selectors', function() {
        createProcessedHTML('<div class="a"></div><div class="b"></div>');
        const results = htmx.__findAllExt(document, '.a,.b');
        assert.equal(results.length, 2);
    });

    it('__findAllExt() handles next with query', function() {
        createProcessedHTML('<div id="start"></div><span></span><div class="target"></div>');
        const start = document.getElementById('start');
        const results = htmx.__findAllExt(start, 'next .target');
        assert.equal(results[0].className, 'target');
    });

    it('__findAllExt() handles previous with query', function() {
        createProcessedHTML('<div class="target"></div><span></span><div id="start"></div>');
        const start = document.getElementById('start');
        const results = htmx.__findAllExt(start, 'previous .target');
        assert.equal(results[0].className, 'target');
    });

    it('__tokenizeExtendedSelector() splits by comma', function() {
        const parts = htmx.__tokenizeExtendedSelector('.foo,.bar');
        assert.equal(parts.length, 2);
        assert.equal(parts[0], '.foo');
        assert.equal(parts[1], '.bar');
    });

    it('__tokenizeExtendedSelector() respects angle brackets', function() {
        const parts = htmx.__tokenizeExtendedSelector('<.foo,.bar/>,.baz');
        assert.equal(parts.length, 2);
        assert.equal(parts[0], '<.foo,.bar/>');
        assert.equal(parts[1], '.baz');
    });

    it('__scanForwardQuery() finds next matching element', function() {
        createProcessedHTML('<div id="start"></div><span></span><div class="target"></div>');
        const start = document.getElementById('start');
        const result = htmx.__scanForwardQuery(start, '.target');
        assert.equal(result.className, 'target');
    });

    it('__scanBackwardsQuery() finds previous matching element', function() {
        createProcessedHTML('<div class="target"></div><span></span><div id="start"></div>');
        const start = document.getElementById('start');
        const result = htmx.__scanBackwardsQuery(start, '.target');
        assert.equal(result.className, 'target');
    });

});