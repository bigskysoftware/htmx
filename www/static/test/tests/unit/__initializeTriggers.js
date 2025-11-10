describe('__initializeTriggers unit tests', function() {

    function mockTriggerButton(triggerSpec, callback) {
        const btn = createHTMLNoProcessing(`<button hx-trigger="${triggerSpec}">Demo</button>`);
        btn._htmx = {}
        htmx.__initializeTriggers(btn, callback)
        return btn;
    }

    function mockTriggerElement(html, callback) {
        const elt = createDisconnectedHTML(html);
        elt._htmx = {}
        htmx.__initializeTriggers(elt, callback)
        return elt;
    }

    it('basic trigger should work', function() {
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

    it('default trigger for button is click', function() {
        let called = 0
        const btn = mockTriggerElement('<button>Test</button>', () => called++);
        btn.click()
        assert.equal(1, called)
    });

    it('default trigger for form is submit', function() {
        let called = 0
        const form = mockTriggerElement('<form></form>', () => called++);
        form.dispatchEvent(new Event('submit'))
        assert.equal(1, called)
    });

    it('default trigger for input is change', function() {
        let called = 0
        const input = mockTriggerElement('<input type="text">', () => called++);
        input.dispatchEvent(new Event('change'))
        assert.equal(1, called)
    });

    it('default trigger for select is change', function() {
        let called = 0
        const select = mockTriggerElement('<select></select>', () => called++);
        select.dispatchEvent(new Event('change'))
        assert.equal(1, called)
    });

    it('default trigger for textarea is change', function() {
        let called = 0
        const textarea = mockTriggerElement('<textarea></textarea>', () => called++);
        textarea.dispatchEvent(new Event('change'))
        assert.equal(1, called)
    });

    it('delay modifier delays execution', function(done) {
        let called = false
        const btn = mockTriggerButton("click delay:50ms", () => called = true);
        btn.click()
        assert.equal(false, called)
        setTimeout(() => {
            assert.equal(true, called)
            done()
        }, 100)
    });

    it('delay modifier resets on subsequent triggers', function(done) {
        let called = 0
        const btn = mockTriggerButton("click delay:50ms", () => called++);
        btn.click()
        setTimeout(() => btn.click(), 30)
        setTimeout(() => {
            assert.equal(1, called)
            done()
        }, 120)
    });

    it('throttle modifier limits execution frequency', function(done) {
        let called = 0
        const btn = mockTriggerButton("click throttle:100ms", () => called++);
        btn.click()
        btn.click()
        btn.click()
        assert.equal(1, called)
        setTimeout(() => {
            assert.equal(2, called)
            done()
        }, 150)
    });

    it('target modifier filters events by target selector', function() {
        let called = 0
        const div = createProcessedHTML('<div hx-trigger="click target:.target" hx-action="js:null"><button class="target">Target</button><button>Other</button></div>');
        htmx.__initializeTriggers(div, () => called++);
        div.querySelector('.target').click()
        assert.equal(1, called)
        div.querySelector('button:not(.target)').click()
        assert.equal(1, called)
    });

    it('consume modifier stops event propagation', function() {
        let innerCalled = 0;
        let outerCalled = 0;

        const outer = createProcessedHTML('<div id="outer"><button hx-action="js:null" hx-trigger="click consume" id="inner">Test</button></div>');
        outer.addEventListener('click', () => outerCalled++)

        const inner = outer.querySelector('#inner')
        inner.addEventListener('click', () => innerCalled++)

        inner.click()
        assert.equal(1, innerCalled)
        assert.equal(0, outerCalled)
    });

    it('changed modifier only triggers when value changes', function() {
        let called = 0
        const input = mockTriggerElement('<input type="text" hx-trigger="input changed">', () => called++);

        input.value = 'test'
        input.dispatchEvent(new Event('input'))
        assert.equal(1, called)

        input.dispatchEvent(new Event('input'))
        assert.equal(1, called)

        input.value = 'changed'
        input.dispatchEvent(new Event('input'))
        assert.equal(2, called)
    });

    it('event filter evaluates condition', function() {
        let called = 0
        const btn = mockTriggerButton("click[shiftKey]", () => called++);

        let mouseEvent1 = new CustomEvent('click');
        mouseEvent1.shiftKey = false
        btn.dispatchEvent(mouseEvent1)
        assert.equal(0, called)

        let mouseEvent = new CustomEvent('click');
        mouseEvent.shiftKey = true
        btn.dispatchEvent(mouseEvent)
        assert.equal(1, called)
    });

    it('from modifier listens on different element', function() {
        let called = 0
        const container = createHTMLNoProcessing('<div><button id="source">Source</button><div id="target"></div></div>');

        const target = container.querySelector('#target')
        const source = container.querySelector('#source')

        target._htmx = {}
        target.setAttribute('hx-trigger', 'click from:#source')
        htmx.__initializeTriggers(target, () => called++);

        target.click()
        assert.equal(0, called)

        source.click()
        assert.equal(1, called)
    });

    it('multiple triggers separated by comma', function() {
        let called = 0
        const btn = mockTriggerButton("click, mouseenter", () => called++);

        btn.click()
        assert.equal(1, called)

        btn.dispatchEvent(new Event('mouseenter'))
        assert.equal(2, called)
    });

    it('every trigger polls at interval', async function () {
        let called = 0
        mockTriggerButton("every 10ms", () => called++);
        await htmx.timeout(50);
        assert.isAtLeast(called, 2)
    });

    it('revealed trigger fires once on revealed', function() {
        let called = 0;
        const div = createProcessedHTML('<div hx-action="js:null" hx-trigger="revealed">Test</div>');
        htmx.__initializeTriggers(div, () => called++);
        htmx.trigger(div, "intersect");
        assert.equal(1, called)
    });

    it('revealed trigger fires multiple times on on intersection', function() {
        let called = 0;
        const div = createProcessedHTML('<div hx-action="js:null" hx-trigger="intersect">Test</div>');
        htmx.__initializeTriggers(div, () => called++);
        htmx.trigger(div, "intersect");
        assert.equal(1, called)
        htmx.trigger(div, "intersect");
        assert.equal(2, called)
    });

});