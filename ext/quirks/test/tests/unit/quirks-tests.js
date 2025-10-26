describe('quirks - Attribute Inheritance Tests', function() {
    const inheritedAttributes = [
        'hx-indicator',
        'hx-disabled-elt',
        'hx-include',
        'hx-target',
        'hx-boost',
        'hx-params',
        'hx-swap',
        'hx-encoding',
        'hx-confirm',
        'hx-sync',
        'hx-prompt',
        'hx-push-url',
        'hx-replace-url',
        'hx-select-oob',
        'hx-select'
    ];

    // ========================================================================
    // Basic Inheritance Tests
    // ========================================================================

    describe('Basic Inheritance', function() {
        inheritedAttributes.forEach(attr => {
            it(`${attr} should inherit from parent element`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="child"></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/parent');

                parent.remove();
            });

            it(`${attr} should inherit from grandparent element`, function() {
                const grandparent = parseHTML(`<div ${attr}="/grandparent"><div><div id="child"></div></div></div>`, true);
                const child = grandparent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/grandparent');

                grandparent.remove();
            });

            it(`${attr} should inherit from great-grandparent element`, function() {
                const greatGrandparent = parseHTML(`<div ${attr}="/great-grandparent"><div><div><div id="child"></div></div></div></div>`, true);
                const child = greatGrandparent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/great-grandparent');

                greatGrandparent.remove();
            });
        });
    });

    // ========================================================================
    // Direct Attribute Precedence Tests
    // ========================================================================

    describe('Direct Attribute Precedence', function() {
        inheritedAttributes.forEach(attr => {
            it(`${attr} direct attribute should take precedence over parent`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="child" ${attr}="/child"></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/child');

                parent.remove();
            });

            it(`${attr} direct attribute should take precedence over grandparent`, function() {
                const grandparent = parseHTML(`<div ${attr}="/grandparent"><div><div id="child" ${attr}="/child"></div></div></div>`, true);
                const child = grandparent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/child');

                grandparent.remove();
            });

            it(`${attr} parent attribute should take precedence over grandparent`, function() {
                const grandparent = parseHTML(`<div ${attr}="/grandparent"><div id="parent" ${attr}="/parent"><div id="child"></div></div></div>`, true);
                const child = grandparent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/parent');

                grandparent.remove();
            });
        });
    });

    // ========================================================================
    // data- Prefix Tests
    // ========================================================================

    describe('data- Prefix Support', function() {
        inheritedAttributes.forEach(attr => {
            it(`data-${attr} should inherit from parent element`, function() {
                const parent = parseHTML(`<div data-${attr}="/parent"><div id="child"></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/parent');

                parent.remove();
            });

            it(`${attr} should take precedence over data-${attr} on same element`, function() {
                const div = parseHTML(`<div ${attr}="/direct" data-${attr}="/data"></div>`, true);

                const result = htmx.__attributeValue(div, attr, null);
                assert.equal(result, '/direct');

                div.remove();
            });

            it(`data-${attr} on child should take precedence over ${attr} on parent`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="child" data-${attr}="/child"></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/child');

                parent.remove();
            });
        });
    });

    // ========================================================================
    // hx-disinherit Tests
    // ========================================================================

    describe('hx-disinherit Blocking', function() {
        inheritedAttributes.forEach(attr => {
            it(`hx-disinherit="*" should block ${attr} inheritance`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="middle" hx-disinherit="*"><div id="child"></div></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, null);

                parent.remove();
            });

            it(`hx-disinherit="${attr}" should block ${attr} inheritance specifically`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="middle" hx-disinherit="${attr}"><div id="child"></div></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, null);

                parent.remove();
            });

            it(`hx-disinherit with different attribute should not block ${attr} inheritance`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="middle" hx-disinherit="hx-get"><div id="child"></div></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, '/parent');

                parent.remove();
            });

            it(`hx-disinherit with multiple attributes should block ${attr} if listed`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="middle" hx-disinherit="hx-get ${attr} hx-post"><div id="child"></div></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, null);

                parent.remove();
            });

            it(`hx-disinherit on element with attribute should still return that attribute value`, function() {
                const div = parseHTML(`<div ${attr}="/value" hx-disinherit="*"></div>`, true);

                const result = htmx.__attributeValue(div, attr, null);
                assert.equal(result, '/value');

                div.remove();
            });
        });
    });

    // ========================================================================
    // Default Value Tests
    // ========================================================================

    describe('Default Values', function() {
        inheritedAttributes.forEach(attr => {
            it(`${attr} should return null when not found and no default provided`, function() {
                const div = parseHTML(`<div id="test"></div>`, true);

                const result = htmx.__attributeValue(div, attr, null);
                assert.equal(result, null);

                div.remove();
            });

            it(`${attr} should return default value when not found`, function() {
                const div = parseHTML(`<div id="test"></div>`, true);

                const result = htmx.__attributeValue(div, attr, 'default-value');
                assert.equal(result, 'default-value');

                div.remove();
            });

            it(`${attr} should return found value even when default provided`, function() {
                const parent = parseHTML(`<div ${attr}="/found"><div id="child"></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, 'default-value');
                assert.equal(result, '/found');

                parent.remove();
            });
        });
    });

    // ========================================================================
    // Non-Inherited Attribute Tests
    // ========================================================================

    describe('Non-Inherited Attributes', function() {
        const nonInheritedAttributes = ['hx-get', 'hx-post', 'hx-put', 'hx-delete', 'hx-patch'];

        nonInheritedAttributes.forEach(attr => {
            it(`${attr} should NOT inherit from parent element`, function() {
                const parent = parseHTML(`<div ${attr}="/parent"><div id="child"></div></div>`, true);
                const child = parent.querySelector('#child');

                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, null);

                parent.remove();
            });

            it(`${attr} should return own value when present`, function() {
                const div = parseHTML(`<div ${attr}="/value"></div>`, true);

                const result = htmx.__attributeValue(div, attr, null);
                assert.equal(result, '/value');

                div.remove();
            });

            it(`${attr} should return default when not present`, function() {
                const div = parseHTML(`<div></div>`, true);

                const result = htmx.__attributeValue(div, attr, 'default-value');
                assert.equal(result, 'default-value');

                div.remove();
            });
        });
    });

    // ========================================================================
    // Edge Cases
    // ========================================================================

    describe('Edge Cases', function() {
        it('should handle empty attribute values', function() {
            const parent = parseHTML(`<div hx-target=""><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-target', null);
            assert.equal(result, '');

            parent.remove();
        });

        it('should handle whitespace-only attribute values', function() {
            const parent = parseHTML(`<div hx-target="   "><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-target', null);
            assert.equal(result, '   ');

            parent.remove();
        });

        it('should handle special characters in attribute values', function() {
            const parent = parseHTML(`<div hx-target="#my-id.class[data-foo='bar']"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-target', null);
            assert.equal(result, "#my-id.class[data-foo='bar']");

            parent.remove();
        });

        it('should handle deeply nested inheritance (5+ levels)', function() {
            const root = parseHTML(`<div hx-swap="outerHTML"><div><div><div><div><div id="deep"></div></div></div></div></div></div>`, true);
            const deep = root.querySelector('#deep');

            const result = htmx.__attributeValue(deep, 'hx-swap', null);
            assert.equal(result, 'outerHTML');

            root.remove();
        });

        it('should handle multiple hx-disinherit at different levels', function() {
            const root = parseHTML(`<div hx-target="/root" hx-swap="outerHTML"><div hx-disinherit="hx-target"><div id="child"></div></div></div>`, true);
            const child = root.querySelector('#child');

            const targetResult = htmx.__attributeValue(child, 'hx-target', null);
            const swapResult = htmx.__attributeValue(child, 'hx-swap', null);

            assert.equal(targetResult, null);
            assert.equal(swapResult, 'outerHTML');

            root.remove();
        });

        it('should handle inheritance with mixed regular and data- attributes', function() {
            const parent = parseHTML(`<div hx-target="/parent" data-hx-swap="innerHTML"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const targetResult = htmx.__attributeValue(child, 'hx-target', null);
            const swapResult = htmx.__attributeValue(child, 'hx-swap', null);

            assert.equal(targetResult, '/parent');
            assert.equal(swapResult, 'innerHTML');

            parent.remove();
        });

        it('should handle case-sensitive attribute names correctly', function() {
            const parent = parseHTML(`<div hx-target="/lowercase" HX-TARGET="/uppercase"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            // HTML attributes are case-insensitive, should get the first one
            const result = htmx.__attributeValue(child, 'hx-target', null);
            assert.isNotNull(result);

            parent.remove();
        });

        it('should return null (not undefined) when attribute not found', function() {
            const div = parseHTML(`<div></div>`, true);

            const result = htmx.__attributeValue(div, 'hx-target', null);
            assert.strictEqual(result, null);

            div.remove();
        });

        it('should handle boolean-like values', function() {
            const parent = parseHTML(`<div hx-boost="true"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-boost', null);
            assert.equal(result, 'true');

            parent.remove();
        });

        it('should handle numeric values', function() {
            const parent = parseHTML(`<div hx-sync="123"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-sync', null);
            assert.equal(result, '123');

            parent.remove();
        });
    });

    // ========================================================================
    // Complex Scenarios
    // ========================================================================

    describe('Complex Scenarios', function() {
        it('should handle overriding middle of inheritance chain', function() {
            const root = parseHTML(`<div hx-target="/root"><div id="middle" hx-target="/middle"><div id="child"></div></div></div>`, true);
            const middle = root.querySelector('#middle');
            const child = root.querySelector('#child');

            const middleResult = htmx.__attributeValue(middle, 'hx-target', null);
            const childResult = htmx.__attributeValue(child, 'hx-target', null);

            assert.equal(middleResult, '/middle');
            assert.equal(childResult, '/middle');

            root.remove();
        });

        it('should handle disinherit on middle element with value on grandparent', function() {
            const root = parseHTML(`<div hx-target="/root"><div id="middle" hx-disinherit="*"><div id="child"></div></div></div>`, true);
            const middle = root.querySelector('#middle');
            const child = root.querySelector('#child');

            const middleResult = htmx.__attributeValue(middle, 'hx-target', null);
            const childResult = htmx.__attributeValue(child, 'hx-target', null);

            // Middle element should still get the value from parent
            assert.equal(middleResult, '/root');
            // But child should not inherit through the disinherit barrier
            assert.equal(childResult, null);

            root.remove();
        });

        it('should handle multiple inherited attributes on same element chain', function() {
            const root = parseHTML(`<div hx-target="/target" hx-swap="outerHTML" hx-params="*"><div id="child"></div></div>`, true);
            const child = root.querySelector('#child');

            const targetResult = htmx.__attributeValue(child, 'hx-target', null);
            const swapResult = htmx.__attributeValue(child, 'hx-swap', null);
            const paramsResult = htmx.__attributeValue(child, 'hx-params', null);

            assert.equal(targetResult, '/target');
            assert.equal(swapResult, 'outerHTML');
            assert.equal(paramsResult, '*');

            root.remove();
        });

        it('should handle selective disinherit of multiple attributes', function() {
            const root = parseHTML(`<div hx-target="/target" hx-swap="outerHTML" hx-params="*"><div id="middle" hx-disinherit="hx-target hx-params"><div id="child"></div></div></div>`, true);
            const child = root.querySelector('#child');

            const targetResult = htmx.__attributeValue(child, 'hx-target', null);
            const swapResult = htmx.__attributeValue(child, 'hx-swap', null);
            const paramsResult = htmx.__attributeValue(child, 'hx-params', null);

            assert.equal(targetResult, null);
            assert.equal(swapResult, 'outerHTML');
            assert.equal(paramsResult, null);

            root.remove();
        });

        it('should handle inheritance with body as ancestor', function() {
            const originalBodyAttr = document.body.getAttribute('hx-target');
            document.body.setAttribute('hx-target', '/body');

            const div = parseHTML(`<div id="test"></div>`, true);

            const result = htmx.__attributeValue(div, 'hx-target', null);
            assert.equal(result, '/body');

            div.remove();
            if (originalBodyAttr) {
                document.body.setAttribute('hx-target', originalBodyAttr);
            } else {
                document.body.removeAttribute('hx-target');
            }
        });

        it('should handle all 15 inherited attributes at once', function() {
            const attrs = inheritedAttributes.map(attr => `${attr}="${attr}-value"`).join(' ');
            const root = parseHTML(`<div ${attrs}><div id="child"></div></div>`, true);
            const child = root.querySelector('#child');

            inheritedAttributes.forEach(attr => {
                const result = htmx.__attributeValue(child, attr, null);
                assert.equal(result, `${attr}-value`, `${attr} should inherit correctly`);
            });

            root.remove();
        });
    });

    // ========================================================================
    // Comparison with Non-Quirks Mode
    // ========================================================================

    describe('Quirks vs Non-Quirks Mode Behavior', function() {
        it('should demonstrate difference from non-quirks mode for inherited attributes', function() {
            // In quirks mode, inherited attributes should walk up the tree
            const parent = parseHTML(`<div hx-target="/parent"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-target', 'default');

            // In quirks mode, this should find the parent's value
            assert.equal(result, '/parent');

            // In non-quirks mode (htmx 4), this would return 'default'
            // because the child doesn't have the attribute directly

            parent.remove();
        });

        it('should behave same as non-quirks mode for non-inherited attributes', function() {
            // For non-inherited attributes, both modes should behave the same
            const parent = parseHTML(`<div hx-get="/parent"><div id="child"></div></div>`, true);
            const child = parent.querySelector('#child');

            const result = htmx.__attributeValue(child, 'hx-get', 'default');

            // Both modes should return default since hx-get doesn't inherit
            assert.equal(result, 'default');

            parent.remove();
        });
    });
});