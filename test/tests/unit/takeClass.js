describe('takeClass() unit tests', function() {

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    it('default source: strips className from target.parentElement subtree, adds to target', function() {
        playground().innerHTML = `
            <div>
                <span class="x active">a</span>
                <span class="x">b</span>
                <span class="x" id="t">c</span>
            </div>
        `;
        let t = document.getElementById('t');
        htmx.takeClass(t, 'active');
        assert.equal(playground().querySelectorAll('.active').length, 1);
        assert.equal(t.classList.contains('active'), true);
    });

    it('explicit element source expands to element + descendants matching .className', function() {
        playground().innerHTML = `
            <section class="active">
                <span class="active">inside</span>
            </section>
            <button id="t"></button>
        `;
        htmx.takeClass(document.getElementById('t'), 'active', playground().querySelector('section'));
        assert.equal(playground().querySelectorAll('.active').length, 1);
        assert.equal(document.getElementById('t').classList.contains('active'), true);
    });

    it('selector string source resolves via findAll, strips from each match directly', function() {
        playground().innerHTML = `
            <button class="tab active"></button>
            <button class="tab active"></button>
            <button class="tab" id="t"></button>
        `;
        htmx.takeClass(document.getElementById('t'), 'active', '.tab');
        assert.equal(playground().querySelectorAll('.active').length, 1);
        assert.equal(document.getElementById('t').classList.contains('active'), true);
    });

    it('iterable source: NodeList', function() {
        playground().innerHTML = `
            <div class="x active"></div>
            <div class="x active"></div>
            <button id="t"></button>
        `;
        htmx.takeClass(document.getElementById('t'), 'active', playground().querySelectorAll('.x'));
        assert.equal(playground().querySelectorAll('.active').length, 1);
    });

    it('iterable source: Array', function() {
        playground().innerHTML = `
            <div class="x active"></div>
            <div class="x active"></div>
            <button id="t"></button>
        `;
        let arr = [...playground().querySelectorAll('.x')];
        htmx.takeClass(document.getElementById('t'), 'active', arr);
        assert.equal(playground().querySelectorAll('.active').length, 1);
    });

    it('multi-element target: each receives the class', function() {
        playground().innerHTML = `
            <div class="row active"></div>
            <div class="row" id="a"></div>
            <div class="row" id="b"></div>
        `;
        htmx.takeClass(playground().querySelectorAll('#a, #b'), 'active', '.row');
        assert.equal(document.getElementById('a').classList.contains('active'), true);
        assert.equal(document.getElementById('b').classList.contains('active'), true);
        assert.equal(playground().querySelectorAll('.active').length, 2);
    });

    it('selector target', function() {
        playground().innerHTML = `
            <div class="row active"></div>
            <div class="row chosen"></div>
        `;
        htmx.takeClass('.chosen', 'active', '.row');
        assert.equal(playground().querySelectorAll('.active').length, 1);
        assert.equal(playground().querySelector('.chosen').classList.contains('active'), true);
    });

    it('removes empty class="" attribute when classList becomes empty', function() {
        playground().innerHTML = `
            <span class="active">a</span>
            <button id="t"></button>
        `;
        htmx.takeClass(document.getElementById('t'), 'active');
        assert.equal(playground().querySelector('span').hasAttribute('class'), false);
    });

});
