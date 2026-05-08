describe('logger unit tests', function() {

    let savedLogAll;
    let captured;
    let consoleStubs;

    beforeEach(() => {
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
        htmx.config.logAll = savedLogAll;
        Object.assign(console, consoleStubs);
    });

    it('triggering event with detail.error logs at error level with the Error inlined for devtools', function() {
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
            // arg shape: ['error', prefix, error, context]
            assert.equal(errs[0][2], err);
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

    it('triggering normal event logs at log level when logAll is set', function() {
        htmx.config.logAll = true;
        let div = document.createElement('div');
        document.body.appendChild(div);
        try {
            htmx.__trigger(div, 'htmx:custom', { foo: 1 });
            let logs = captured.filter(c => c[0] === 'log');
            assert.equal(logs.length, 1);
            assert.include(logs[0][1], 'htmx:custom');
        } finally {
            div.remove();
        }
    });

});
