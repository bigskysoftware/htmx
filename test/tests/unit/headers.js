describe('Request Headers', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    describe('HX-Source header', function() {

        it('formats element with id', function() {
            let btn = createProcessedHTML('<button id="test-btn" hx-get="/test"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            ctx.request.headers['HX-Source'].should.equal('button#test-btn');
        });

        it('formats element with neither id nor name', function() {
            let btn = createProcessedHTML('<button hx-get="/test"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            ctx.request.headers['HX-Source'].should.equal('button');
        });

        it('formats div element', function() {
            let div = createProcessedHTML('<div id="content" hx-get="/test"></div>');
            let ctx = htmx.__createRequestContext(div, new Event('click'));
            ctx.request.headers['HX-Source'].should.equal('div#content');
        });

        it('formats form element', function() {
            let form = createProcessedHTML('<form id="my-form" name="contact" hx-post="/test"></form>');
            let ctx = htmx.__createRequestContext(form, new Event('submit'));
            ctx.request.headers['HX-Source'].should.equal('form#my-form');
        });

    });

    describe('HX-Target header', function() {

        it('formats target element with id', async function() {
            createProcessedHTML('<div id="result"></div><button hx-get="js:" hx-target="#result"></button>');
            let btn = document.querySelector('button');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Target'].should.equal('div#result');
        });

        it('formats target when targeting self', async function() {
            let btn = createProcessedHTML('<button id="self-btn" hx-get="js:"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Target'].should.equal('button#self-btn');
        });

        it('formats body target', async function() {
            let btn = createProcessedHTML('<button hx-get="js:" hx-target="body"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Target'].should.equal('body');
        });

    });

    describe('HX-Request-Type header', function() {

        it('sets to partial for regular element target', async function() {
            createProcessedHTML('<div id="result"></div><button hx-get="js:" hx-target="#result"></button>');
            let btn = document.querySelector('button');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Request-Type'].should.equal('partial');
        });

        it('sets to partial when targeting self', async function() {
            let btn = createProcessedHTML('<button hx-get="js:"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Request-Type'].should.equal('partial');
        });

        it('sets to full when targeting body', async function() {
            let btn = createProcessedHTML('<button hx-get="js:" hx-target="body"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Request-Type'].should.equal('full');
        });

        it('sets to full when hx-select is present', async function() {
            let btn = createProcessedHTML('<button hx-get="js:" hx-select="#content"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Request-Type'].should.equal('full');
        });

        it('sets to full when hx-select and body target both present', async function() {
            let btn = createProcessedHTML('<button hx-get="js:" hx-target="body" hx-select="#content"></button>');
            let ctx = htmx.__createRequestContext(btn, new Event('click'));
            await htmx.__handleTriggerEvent(ctx);
            ctx.request.headers['HX-Request-Type'].should.equal('full');
        });

    });

    describe('__buildIdentifier method', function() {

        it('builds identifier with id only', function() {
            let div = document.createElement('div');
            div.id = 'test';
            htmx.__buildIdentifier(div).should.equal('div#test');
        });

        it('builds identifier with neither id nor name', function() {
            let span = document.createElement('span');
            htmx.__buildIdentifier(span).should.equal('span');
        });

        it('handles body element', function() {
            htmx.__buildIdentifier(document.body).should.equal('body');
        });

    });

});
