describe('htmx.config.implicitInheritance test', function() {

    beforeEach(function() {
        setupTest(this);
        htmx.config.implicitInheritance = true;
    });

    afterEach(function() {
        cleanupTest();
        htmx.config.implicitInheritance = false;
    });

    it('child inherits attribute without :inherited modifier when implicitInheritance is true', function() {
        const container = createDisconnectedHTML(
            '<div hx-target="#result">' +
            '  <button>Test</button>' +
            '</div>'
        );
        const button = container.querySelector('button');
        const result = htmx.__attributeValue(button, 'hx-target');
        assert.equal(result, '#result');
    });

    it('direct attribute takes precedence over inherited when implicitInheritance is true', function() {
        const container = createDisconnectedHTML(
            '<div hx-target="#parent">' +
            '  <button hx-target="#child">Test</button>' +
            '</div>'
        );
        const button = container.querySelector('button');
        const result = htmx.__attributeValue(button, 'hx-target');
        assert.equal(result, '#child');
    });

    it('inherits through multiple levels when implicitInheritance is true', function() {
        const container = createDisconnectedHTML(
            '<div hx-swap="outerHTML">' +
            '  <div>' +
            '    <button>Test</button>' +
            '  </div>' +
            '</div>'
        );
        const button = container.querySelector('button');
        const result = htmx.__attributeValue(button, 'hx-swap');
        assert.equal(result, 'outerHTML');
    });

    it(':append works with implicit inheritance', function() {
        const container = createDisconnectedHTML(
            '<div hx-vals=\'{"a":1}\'>' +
            '  <button hx-vals:append=\'{"b":2}\'>Test</button>' +
            '</div>'
        );
        const button = container.querySelector('button');
        const result = htmx.__attributeValue(button, 'hx-vals');
        assert.equal(result, '{"a":1},{"b":2}');
    });

});

