describe('__shouldCancel() unit tests', function() {

    it('anchor with href should cancel click event', function() {
        const anchor = createDisconnectedHTML('<a href="/foo"></a>');
        const evt = { type: 'click', currentTarget: anchor, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('anchor with # href should cancel click event', function() {
        const anchor = createDisconnectedHTML('<a href="#"></a>');
        const evt = { type: 'click', currentTarget: anchor, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('anchor with #foo href should not cancel click event', function() {
        const evt = { type: 'click', currentTarget: createDisconnectedHTML('<a href="#foo"></a>'), button: 0 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('div should not cancel click event', function() {
        const evt = { type: 'click', currentTarget: createDisconnectedHTML('<div></div>'), button: 0 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('form should cancel submit event', function() {
        const evt = { type: 'submit', currentTarget: createDisconnectedHTML('<form></form>') };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('button inside form should cancel click event', function() {
        const form = createDisconnectedHTML('<form><button></button></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('submit button inside form should cancel click event', function() {
        const form = createDisconnectedHTML('<form><button type="submit"></button></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('input type=submit inside form should cancel click event', function() {
        const form = createDisconnectedHTML('<form><input type="submit"></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('input type=image inside form should cancel click event', function() {
        const form = createDisconnectedHTML('<form><input type="image"></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('button type=reset inside form should not cancel click event', function() {
        const form = createDisconnectedHTML('<form><button type="reset"></button></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('button type=button inside form should not cancel click event', function() {
        const form = createDisconnectedHTML('<form><button type="button"></button></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('button with form attribute should cancel click event', function() {
        const container = createHTMLNoProcessing('<div><form id="f1"></form><button form="f1"></button></div>');
        try {
            const evt = { type: 'click', currentTarget: container.querySelector('button'), button: 0 };
            assert.equal(htmx.__shouldCancel(evt), true);
        } finally {
            container.remove();
        }
    });

    it('button with form attribute and type=submit should cancel click event', function() {
        const container = createHTMLNoProcessing('<div><form id="f1"></form><button form="f1" type="submit"></button></div>');
        try {
            const evt = { type: 'click', currentTarget: container.querySelector('button'), button: 0 };
            assert.equal(htmx.__shouldCancel(evt), true);
        } finally {
            container.remove();
        }
    });

    it('button with form attribute and type=button should not cancel click event', function() {
        const container = createHTMLNoProcessing('<div><form id="f1"></form><button form="f1" type="button"></button></div>');
        try {
            const evt = { type: 'click', currentTarget: container.querySelector('button'), button: 0 };
            assert.equal(htmx.__shouldCancel(evt), false);
        } finally {
            container.remove();
        }
    });

    it('button with form attribute and type=reset should not cancel click event', function() {
        const container = createHTMLNoProcessing('<div><form id="f1"></form><button form="f1" type="reset"></button></div>');
        try {
            const evt = { type: 'click', currentTarget: container.querySelector('button'), button: 0 };
            assert.equal(htmx.__shouldCancel(evt), false);
        } finally {
            container.remove();
        }
    });

    it('button without form should not cancel click event', function() {
        const evt = { type: 'click', currentTarget: createDisconnectedHTML('<button></button>'), button: 0 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('disabled button should not cancel click event', function() {
        const form = createDisconnectedHTML('<form><button disabled></button></form>');
        const evt = { type: 'click', currentTarget: form.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('right-click (button !== 0) should not cancel', function() {
        const evt = { type: 'click', currentTarget: createDisconnectedHTML('<a href="/foo"></a>'), button: 2 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('middle-click (button !== 0) should not cancel', function() {
        const evt = { type: 'click', currentTarget: createDisconnectedHTML('<a href="/foo"></a>'), button: 1 };
        assert.equal(htmx.__shouldCancel(evt), false);
    });

    it('button inside htmx-enabled link should cancel', function() {
        const link = createDisconnectedHTML('<a href="/foo"><button></button></a>');
        const evt = { type: 'click', currentTarget: link.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('htmx-enabled button inside link should cancel', function() {
        const link = createDisconnectedHTML('<a href="/foo"><button></button></a>');
        const evt = { type: 'click', currentTarget: link.firstElementChild, button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('span inside button in form should cancel', function() {
        const form = createDisconnectedHTML('<form><button><span></span></button></form>');
        const evt = { type: 'click', currentTarget: form.querySelector('span'), button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('element inside form button should cancel', function() {
        const form = createDisconnectedHTML('<form><button><span></span></button></form>');
        const evt = { type: 'click', currentTarget: form.querySelector('span'), button: 0 };
        assert.equal(htmx.__shouldCancel(evt), true);
    });

    it('submit button with form attribute outside form should cancel', function() {
        const container = createHTMLNoProcessing('<div><form id="test-form"></form><button type="submit" form="test-form"></button></div>');
        try {
            const evt = { type: 'click', currentTarget: container.querySelector('button'), button: 0 };
            assert.equal(htmx.__shouldCancel(evt), true);
        } finally {
            container.remove();
        }
    });

    it('input type=submit with form attribute outside form should cancel', function() {
        const container = createHTMLNoProcessing('<div><form id="test-form"></form><input type="submit" form="test-form"></div>');
        try {
            const evt = { type: 'click', currentTarget: container.querySelector('input'), button: 0 };
            assert.equal(htmx.__shouldCancel(evt), true);
        } finally {
            container.remove();
        }
    });
});
