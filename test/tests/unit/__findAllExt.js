describe('__findAllExt unit tests', function() {

    it('returns elements matching CSS selector', function () {
        createProcessedHTML('<div class="foo"></div><div class="bar"></div><div class="foo"></div>')
        let results = htmx.__findAllExt(document, '.foo')
        assert.equal(results.length, 2)
        assert.equal(results[0].className, 'foo')
    })

    it('returns multiple selectors separated by comma', function () {
        createProcessedHTML('<div class="foo"></div><div class="bar"></div>')
        let results = htmx.__findAllExt(document, '.foo,.bar')
        assert.equal(results.length, 2)
    })

    it('handles closest keyword', function () {
        let child = createProcessedHTML('<div class="parent"><div class="child"></div></div>').querySelector('.child')
        let results = htmx.__findAllExt(child, 'closest .parent')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'parent')
    })

    it('handles next keyword', function () {
        createProcessedHTML('<div id="a"></div><div id="b"></div>')
        let a = document.getElementById('a')
        let results = htmx.__findAllExt(a, 'next')
        assert.equal(results.length, 1)
        assert.equal(results[0].id, 'b')
    })

    it('handles nextElementSibling keyword', function () {
        createProcessedHTML('<div id="a"></div><div id="b"></div>')
        let a = document.getElementById('a')
        let results = htmx.__findAllExt(a, 'nextElementSibling')
        assert.equal(results.length, 1)
        assert.equal(results[0].id, 'b')
    })

    it('handles next with selector', function () {
        createProcessedHTML('<div id="a"></div><span></span><div class="target"></div>')
        let a = document.getElementById('a')
        let results = htmx.__findAllExt(a, 'next .target')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'target')
    })

    it('handles previous keyword', function () {
        createProcessedHTML('<div id="a"></div><div id="b"></div>')
        let b = document.getElementById('b')
        let results = htmx.__findAllExt(b, 'previous')
        assert.equal(results.length, 1)
        assert.equal(results[0].id, 'a')
    })

    it('handles previousElementSibling keyword', function () {
        createProcessedHTML('<div id="a"></div><div id="b"></div>')
        let b = document.getElementById('b')
        let results = htmx.__findAllExt(b, 'previousElementSibling')
        assert.equal(results.length, 1)
        assert.equal(results[0].id, 'a')
    })

    it('handles previous with selector', function () {
        createProcessedHTML('<div class="target"></div><span></span><div id="a"></div>')
        let a = document.getElementById('a')
        let results = htmx.__findAllExt(a, 'previous .target')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'target')
    })

    it('handles document keyword', function () {
        let div = createProcessedHTML('<div></div>')
        let results = htmx.__findAllExt(div, 'document')
        assert.equal(results.length, 1)
        assert.equal(results[0], document)
    })

    it('handles window keyword', function () {
        let div = createProcessedHTML('<div></div>')
        let results = htmx.__findAllExt(div, 'window')
        assert.equal(results.length, 1)
        assert.equal(results[0], window)
    })

    it('handles body keyword', function () {
        let div = createProcessedHTML('<div></div>')
        let results = htmx.__findAllExt(div, 'body')
        assert.equal(results.length, 1)
        assert.equal(results[0], document.body)
    })

    it('handles hyperscript-style selector', function () {
        createProcessedHTML('<div class="foo"></div>')
        let results = htmx.__findAllExt(document, '<.foo/>')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'foo')
    })

    it('handles hyperscript-style selector with comma inside', function () {
        createProcessedHTML('<div class="foo"></div><div class="bar"></div>')
        let results = htmx.__findAllExt(document, '<.foo,.bar/>')
        assert.equal(results.length, 2)
    })

    it('handles mixed keywords and selectors', function () {
        createProcessedHTML('<div id="a"></div><div id="b"></div><div class="foo"></div>')
        let a = document.getElementById('a')
        let results = htmx.__findAllExt(a, 'next,.foo')
        assert.equal(results.length, 2)
        assert.equal(results[0].id, 'b')
        assert.equal(results[1].className, 'foo')
    })

    it('handles global prefix', function () {
        createProcessedHTML('<div class="foo"></div>')
        let div = document.querySelector('div')
        let results = htmx.__findAllExt(div, 'global .foo')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'foo')
    })

    it('returns empty array when no matches', function () {
        createProcessedHTML('<div class="foo"></div>')
        let results = htmx.__findAllExt(document, '.nonexistent')
        assert.equal(results.length, 0)
    })

    it('handles element as first parameter', function () {
        let div = createProcessedHTML('<div><span class="foo"></span></div>')
        let results = htmx.__findAllExt(div, '.foo')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'foo')
    })

    it('handles string selector as first parameter', function () {
        createProcessedHTML('<div class="foo"></div>')
        let results = htmx.__findAllExt('.foo')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'foo')
    })

    it('returns null items as empty when keyword fails', function () {
        let div = createProcessedHTML('<div></div>')
        let results = htmx.__findAllExt(div, 'next')
        assert.equal(results.length, 0)
    })

    it('handles multiple keywords', function () {
        createProcessedHTML('<div id="a"></div><div id="b"></div>')
        let a = document.getElementById('a')
        let results = htmx.__findAllExt(a, 'next,document')
        assert.equal(results.length, 2)
        assert.equal(results[0].id, 'b')
        assert.equal(results[1], document)
    })

    it('handles find keyword - returns first match within element', function () {
        let parent = createProcessedHTML('<div id="parent"><span class="target"></span><span class="target"></span></div>')
        let results = htmx.__findAllExt(parent, 'find .target')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'target')
    })

    it('handles find keyword - scopes to element not document', function () {
        createProcessedHTML('<div class="outside"></div><div id="parent"><div class="inside"></div></div>')
        let parent = document.getElementById('parent')
        let results = htmx.__findAllExt(parent, 'find .inside')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'inside')
        // Should not find .outside
        let results2 = htmx.__findAllExt(parent, 'find .outside')
        assert.equal(results2.length, 0)
    })

    it('handles findAll keyword - returns all matches within element', function () {
        let parent = createProcessedHTML('<div id="parent"><span class="target"></span><span class="target"></span><span class="target"></span></div>')
        let results = htmx.__findAllExt(parent, 'findAll .target')
        assert.equal(results.length, 3)
        results.forEach(el => assert.equal(el.className, 'target'))
    })

    it('handles findAll keyword - scopes to element not document', function () {
        createProcessedHTML('<div class="outside"></div><div class="outside"></div><div id="parent"><div class="inside"></div><div class="inside"></div></div>')
        let parent = document.getElementById('parent')
        let results = htmx.__findAllExt(parent, 'findAll .inside')
        assert.equal(results.length, 2)
        // Should not find .outside elements
        let results2 = htmx.__findAllExt(parent, 'findAll .outside')
        assert.equal(results2.length, 0)
    })

    it('handles find with no matches', function () {
        let parent = createProcessedHTML('<div id="parent"><span></span></div>')
        let results = htmx.__findAllExt(parent, 'find .nonexistent')
        assert.equal(results.length, 0)
    })

    it('handles findAll with no matches', function () {
        let parent = createProcessedHTML('<div id="parent"><span></span></div>')
        let results = htmx.__findAllExt(parent, 'findAll .nonexistent')
        assert.equal(results.length, 0)
    })

});