describe('logger unit tests', function() {

    let savedLogger;
    let savedLogAll;
    let captured;
    let consoleStubs;

    beforeEach(() => {
        savedLogger = htmx.logger;
        savedLogAll = htmx.config.logAll;
        captured = [];
        consoleStubs = {
            log: console.log,
            warn: console.warn,
            error: console.error,
        };
        console.log = (...args) => captured.push(['log', ...args]);
        console.warn = (...args) => captured.push(['warn', ...args]);
        console.error = (...args) => captured.push(['error', ...args]);
    });

    afterEach(() => {
        htmx.logger = savedLogger;
        htmx.config.logAll = savedLogAll;
        Object.assign(console, consoleStubs);
    });

    it('htmx.logger is a function by default', function() {
        assert.isFunction(htmx.logger);
    });

    it('default logger silences event-level output unless logAll is set', function() {
        htmx.config.logAll = false;
        htmx.logger('event', 'htmx:test', { elt: document.body });
        assert.equal(captured.length, 0);
    });

    it('default logger emits event-level output when logAll is set', function() {
        htmx.config.logAll = true;
        htmx.logger('event', 'htmx:test', { foo: 1 });
        assert.equal(captured.length, 1);
        assert.equal(captured[0][0], 'log');
        assert.equal(captured[0][1], 'htmx: htmx:test');
    });

    it('default logger routes warn to console.warn regardless of logAll', function() {
        htmx.config.logAll = false;
        htmx.logger('warn', 'something fishy', { detail: 1 });
        assert.equal(captured.length, 1);
        assert.equal(captured[0][0], 'warn');
        assert.equal(captured[0][1], 'htmx: something fishy');
    });

    it('default logger routes error to console.error regardless of logAll', function() {
        htmx.config.logAll = false;
        htmx.logger('error', 'boom', { detail: 1 });
        assert.equal(captured.length, 1);
        assert.equal(captured[0][0], 'error');
    });

    it('default logger inlines an Error so devtools renders the stack', function() {
        let err = new Error('boom');
        htmx.logger('error', 'caught it', { error: err, ctx: 'whatever' });
        assert.equal(captured.length, 1);
        assert.equal(captured[0][0], 'error');
        // arg shape: [level, prefix, error, fullContext]
        assert.equal(captured[0][2], err);
    });

    it('logNone() installs a no-op logger', function() {
        htmx.logNone();
        htmx.logger('error', 'should be silent');
        htmx.logger('warn', 'also silent');
        assert.equal(captured.length, 0);
    });

    it('logAll() flips config.logAll on', function() {
        htmx.config.logAll = false;
        htmx.logAll();
        assert.equal(htmx.config.logAll, true);
    });

    it('triggering event with detail.error logs at error level', function() {
        htmx.config.logAll = false;
        let div = document.createElement('div');
        document.body.appendChild(div);
        try {
            let err = new Error('explode');
            htmx.__trigger(div, 'htmx:custom', { error: err });
            let errs = captured.filter(c => c[0] === 'error');
            assert.equal(errs.length, 1);
            assert.include(errs[0][1], 'htmx:custom');
            assert.include(errs[0][1], 'explode');
        } finally {
            div.remove();
        }
    });

    it('triggering event with detail.warn logs at warn level', function() {
        htmx.config.logAll = false;
        let div = document.createElement('div');
        document.body.appendChild(div);
        try {
            htmx.__trigger(div, 'htmx:custom', { warn: 'odd thing happened' });
            let warns = captured.filter(c => c[0] === 'warn');
            assert.equal(warns.length, 1);
            assert.include(warns[0][1], 'htmx:custom');
            assert.include(warns[0][1], 'odd thing happened');
        } finally {
            div.remove();
        }
    });

    it('triggering normal event does not log unless logAll is set', function() {
        htmx.config.logAll = false;
        let div = document.createElement('div');
        document.body.appendChild(div);
        try {
            htmx.__trigger(div, 'htmx:custom', { foo: 1 });
            assert.equal(captured.length, 0);
        } finally {
            div.remove();
        }
    });

    it('replacing htmx.logger routes through the custom function', function() {
        let received = [];
        htmx.logger = (level, message, context) => received.push([level, message, context]);
        let div = document.createElement('div');
        document.body.appendChild(div);
        try {
            htmx.__trigger(div, 'htmx:custom', { error: new Error('e') });
            assert.equal(received.length, 1);
            assert.equal(received[0][0], 'error');
        } finally {
            div.remove();
        }
    });

});
