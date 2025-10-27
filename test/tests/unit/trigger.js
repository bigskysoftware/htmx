describe('__initializeTriggers behavior', function() {

    function mockTriggerButton(triggerSpec, callback) {
        const btn = parseHTML(`<button hx-trigger="${triggerSpec}">Demo</button>`);
        btn.__htmx = {}
        htmx.__initializeTriggers(btn, callback)
        return btn;
    }

    it('basic trigger should would', function() {
        let called = false
        const btn = mockTriggerButton("", () => called = true);
        btn.click()
        assert.equal(true, called)
    });

    it('once should only trigger once', function() {
        let called = 0
        const btn = mockTriggerButton("click once", () => called++);
        btn.click()
        assert.equal(1, called)
        btn.click()
        assert.equal(1, called)
    });

});