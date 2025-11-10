describe('bootstrap unit tests', function() {
    it("Test that fragment parsing works as expected", function() {
        var result = htmx.__makeFragment("foo");
        var temp = document.createElement('div');
        temp.appendChild(result.fragment.cloneNode(true));
        assert.equal("foo", temp.textContent.trim())

        // Test that template partials are preserved in fragment
        result = htmx.__makeFragment(`<template partial hx-target="#test">foo</template>`);
        temp = document.createElement('div');
        temp.appendChild(result.fragment.cloneNode(true));
        assert.include(temp.innerHTML, 'template')
    })

    it("__makeFragment handles multiple partials", function() {
        var result = htmx.__makeFragment(`
            <div>Main content</div>
            <template partial hx-target="#test1">Partial 1</template>
            <template partial hx-target="#test2" hx-swap="innerHTML">Partial 2</template>
        `);
        var temp = document.createElement('div');
        temp.appendChild(result.fragment.cloneNode(true));
        assert.include(temp.innerHTML, "Main content")
        assert.include(temp.innerHTML, "template")
    })

    it("__makeFragment extracts title from HTML", function() {
        var result = htmx.__makeFragment(`
            <html><head><title>Test Title</title></head><body>Content</body></html>
        `);
        assert.equal("Test Title", result.title)
    })

    it("__makeFragment handles body tag response", function() {
        var result = htmx.__makeFragment(`<body><div>Content</div></body>`);
        var temp = document.createElement('div');
        temp.appendChild(result.fragment.cloneNode(true));
        assert.include(temp.innerHTML, "Content")
    })

    it("__makeFragment handles fragment response", function() {
        var result = htmx.__makeFragment(`<div>Fragment</div><span>More</span>`);
        var temp = document.createElement('div');
        temp.appendChild(result.fragment.cloneNode(true));
        assert.include(temp.innerHTML, "Fragment")
        assert.include(temp.innerHTML, "More")
    })

    it("__attributeValue returns direct attribute value", function() {
        const div = createDisconnectedHTML('<div hx-get="/test"></div>');
        const result = htmx.__attributeValue(div, 'hx-get', 'default');
        assert.equal(result, '/test');
    })

    it("__attributeValue returns inherited attribute from element", function() {
        const div = createDisconnectedHTML('<div hx-get:inherited="/inherited"></div>');
        const result = htmx.__attributeValue(div, 'hx-get', 'default');
        assert.equal(result, '/inherited');
    })

    it("__attributeValue prefers direct attribute over inherited", function() {
        const div = createDisconnectedHTML('<div hx-get="/direct" hx-get:inherited="/inherited"></div>');
        const result = htmx.__attributeValue(div, 'hx-get', 'default');
        assert.equal(result, '/direct');
    })

    it("__attributeValue finds inherited attribute on parent", function() {
        const parent = createDisconnectedHTML('<div hx-get:inherited="/parent"><div></div></div>');
        const child = parent.firstElementChild;
        const result = htmx.__attributeValue(child, 'hx-get', 'default');
        assert.equal(result, '/parent');
    })

    it("__attributeValue returns default when attribute not found", function() {
        const div = createDisconnectedHTML('<div></div>');
        const result = htmx.__attributeValue(div, 'hx-get', 'default');
        assert.equal(result, 'default');
    })

    it("__tokenize splits simple tokens by whitespace", function() {
        const result = htmx.__tokenize('click submit change');

        assert.deepEqual(result, ['click', 'submit', 'change']);
    })

    it("__tokenize handles quoted strings", function() {
        const result = htmx.__tokenize('click "my event" change');

        assert.deepEqual(result, ['click', '"my event"', 'change']);
    })

    it("__tokenize handles single quoted strings", function() {
        const result = htmx.__tokenize("click 'my event' change");

        assert.deepEqual(result, ['click', "'my event'", 'change']);
    })

    it("__tokenize handles escaped characters in quotes", function() {
        const result = htmx.__tokenize('click "my \\"event\\"" change');

        assert.deepEqual(result, ['click', '"my \\"event\\""', 'change']);
    })

    it("__tokenize preserves colons and commas as separate tokens", function() {
        const result = htmx.__tokenize('click delay:500 , submit');

        assert.deepEqual(result, ['click', 'delay', ':', '500', ',', 'submit']);
    })

    it("__tokenize handles complex trigger specification", function() {
        const result = htmx.__tokenize('click delay:1s, keyup changed from:body');

        assert.deepEqual(result, ['click', 'delay', ':', '1s', ',', 'keyup', 'changed', 'from', ':', 'body']);
    })

    it("__tokenize handles empty string", function() {
        const result = htmx.__tokenize('');

        assert.deepEqual(result, []);
    })

    it("__tokenize handles multiple consecutive spaces", function() {
        const result = htmx.__tokenize('click    submit     change');

        assert.deepEqual(result, ['click', 'submit', 'change']);
    })

    it("__parseTriggerSpecs parses simple event", function() {
        const result = htmx.__parseTriggerSpecs('click');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click');
    })

    it("__parseTriggerSpecs parses event with option", function() {
        const result = htmx.__parseTriggerSpecs('click delay:500');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click');
        assert.equal(result[0].delay, '500');
    })

    it("__parseTriggerSpecs parses event with multiple options", function() {
        const result = htmx.__parseTriggerSpecs('click delay:500 throttle:100');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click');
        assert.equal(result[0].delay, '500');
        assert.equal(result[0].throttle, '100');
    })

    it("__parseTriggerSpecs parses event with boolean opts", function() {
        const result = htmx.__parseTriggerSpecs('click once changed');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click');
        assert.equal(result[0].once, true);
        assert.equal(result[0].changed, true);
    })

    it("__parseTriggerSpecs parses event with options and boolean opts", function() {
        const result = htmx.__parseTriggerSpecs('click delay:1s once changed');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click');
        assert.equal(result[0].delay, '1s');
        assert.equal(result[0].once, true);
        assert.equal(result[0].changed, true);
    })

    it("__parseTriggerSpecs parses multiple events", function() {
        const result = htmx.__parseTriggerSpecs('click, submit');

        assert.equal(result.length, 2);
        assert.equal(result[0].name, 'click');
        assert.equal(result[1].name, 'submit');
    })

    it("__parseTriggerSpecs parses multiple events with options", function() {
        const result = htmx.__parseTriggerSpecs('click delay:500, keyup changed');

        assert.equal(result.length, 2);
        assert.equal(result[0].name, 'click');
        assert.equal(result[0].delay, '500');
        assert.equal(result[1].name, 'keyup');
        assert.equal(result[1].changed, true);
    })

    it("__parseTriggerSpecs parses event filter", function() {
        const result = htmx.__parseTriggerSpecs('click[ctrlKey]');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click[ctrlKey]');
    })

    it("__parseTriggerSpecs parses event filter with spaces", function() {
        const result = htmx.__parseTriggerSpecs('click[target.value == "test"]');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click[target.value=="test"]');
    })

    it("__parseTriggerSpecs parses event with from option", function() {
        const result = htmx.__parseTriggerSpecs('click from:body');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'click');
        assert.equal(result[0].from, 'body');
    })

    it("__parseTriggerSpecs throws on unterminated filter", function() {
        assert.throws(() => {
            htmx.__parseTriggerSpecs('click[ctrlKey');
        }, /unterminated/);
    })

    it("__parseTriggerSpecs handles complex real-world spec", function() {
        const result = htmx.__parseTriggerSpecs('keyup[target.value.length > 3] changed delay:500ms from:input');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'keyup[target.value.length>3]');
        assert.equal(result[0].changed, true);
        assert.equal(result[0].delay, '500ms');
        assert.equal(result[0].from, 'input');
    })

    it("__parseTriggerSpecs handles complex real-world spec w string and preserves spaces in string", function() {
        const result = htmx.__parseTriggerSpecs('keyup[target.value == "hello world"] changed delay:500ms from:input');

        assert.equal(result.length, 1);
        assert.equal(result[0].name, 'keyup[target.value=="hello world"]');
        assert.equal(result[0].changed, true);
        assert.equal(result[0].delay, '500ms');
        assert.equal(result[0].from, 'input');
    })

    it("public API surface remains stable", function() {
        // This test ensures the public API doesn't accidentally change
        const expectedPublicMethods = [
            'ajax',
            'find',
            'findAll',
            'forEvent',
            'on',
            'onLoad',
            'parseInterval',
            'process',
            'swap',
            'takeClass',
            'timeout',
            'defineExtension',
            'trigger',
        ].sort();

        const expectedPublicProperties = [
            'config'
        ].sort();

        // Get own properties (like config, eventSource)
        const ownProperties = Object.keys(htmx).filter(name => !name.startsWith("_") && typeof htmx[name] !== 'function').sort();

        // Get methods from the prototype
        const proto = Object.getPrototypeOf(htmx);
        const protoMethods = Object.getOwnPropertyNames(proto)
            .filter(name => !name.startsWith("_") && name !== 'constructor' && typeof htmx[name] === 'function')
            .sort();

        // Check methods
        assert.deepEqual(protoMethods, expectedPublicMethods,
            'Public methods have changed. Expected: ' + JSON.stringify(expectedPublicMethods) +
            ', Got: ' + JSON.stringify(protoMethods));

        // Check properties
        assert.deepEqual(ownProperties, expectedPublicProperties,
            'Public properties have changed. Expected: ' + JSON.stringify(expectedPublicProperties) +
            ', Got: ' + JSON.stringify(ownProperties));
    })
})
