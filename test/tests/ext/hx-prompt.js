describe('hx-prompt extension', function() {

    let extBackup;
    let originalPrompt;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        htmx.config.extensions = 'hx-prompt';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-prompt.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    beforeEach(() => {
        setupTest();
        originalPrompt = window.prompt;
    });

    afterEach(() => {
        cleanupTest();
        window.prompt = originalPrompt;
        delete window.htmxPrompt;
    });

    it('sends prompt response as HX-Prompt header', async function() {
        window.prompt = () => 'because';
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML('<button hx-delete="/items/1" hx-prompt="Reason for deletion?">Delete</button>');
        btn.click();
        await forRequest();

        assert.equal(lastFetch().request.headers['HX-Prompt'], 'because');
    });

    it('aborts the request when the user cancels', async function() {
        window.prompt = () => null;
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML('<button hx-delete="/items/1" hx-prompt="Reason for deletion?">Delete</button>');
        btn.click();
        await forRequest();

        assert.isUndefined(fetchMock.getLastCall());
    });

    it('accepts an empty string as a valid answer', async function() {
        window.prompt = () => '';
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML('<button hx-delete="/items/1" hx-prompt="Reason for deletion?">Delete</button>');
        btn.click();
        await forRequest();

        assert.equal(lastFetch().request.headers['HX-Prompt'], '');
    });

    it('does nothing when hx-prompt is absent', async function() {
        let prompted = false;
        window.prompt = () => { prompted = true; return 'x'; };
        mockResponse('GET', '/items/1', 'ok');

        let btn = createProcessedHTML('<button hx-get="/items/1">Go</button>');
        btn.click();
        await forRequest();

        assert.isFalse(prompted);
        assert.isUndefined(lastFetch().request.headers['HX-Prompt']);
    });

    it('inherits via :inherited from a container', async function() {
        window.prompt = () => 'inherited';
        mockResponse('DELETE', '/items/1', 'ok');

        createProcessedHTML(`
            <div hx-prompt:inherited="Reason?">
                <button hx-delete="/items/1">Delete</button>
                <button hx-delete="/items/2">Delete</button>
            </div>
        `);
        find('button').click();
        await forRequest();

        assert.equal(lastFetch().request.headers['HX-Prompt'], 'inherited');
    });

    it('composes with hx-confirm (both pass)', async function() {
        window.prompt = () => 'a reason';
        let originalConfirm = window.confirm;
        window.confirm = () => true;
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML(
            '<button hx-delete="/items/1" hx-prompt="Reason?" hx-confirm="Are you sure?">Delete</button>'
        );
        btn.click();
        await forRequest();

        assert.equal(lastFetch().request.headers['HX-Prompt'], 'a reason');
        window.confirm = originalConfirm;
    });

    it('cancelling hx-prompt skips hx-confirm and the request', async function() {
        window.prompt = () => null;
        let confirmShown = false;
        let originalConfirm = window.confirm;
        window.confirm = () => { confirmShown = true; return true; };
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML(
            '<button hx-delete="/items/1" hx-prompt="Reason?" hx-confirm="Are you sure?">Delete</button>'
        );
        btn.click();
        await forRequest();

        assert.isFalse(confirmShown);
        assert.isUndefined(fetchMock.getLastCall());
        window.confirm = originalConfirm;
    });

    it('exposes prompt and target on the htmx:prompt event detail', async function() {
        window.prompt = () => 'hello';
        mockResponse('DELETE', '/items/1', 'ok');

        let captured = null;
        let btn = createProcessedHTML('<button hx-delete="/items/1" hx-prompt="Q?">Delete</button>');
        btn.addEventListener('htmx:prompt', (e) => captured = e.detail);
        btn.click();
        await forRequest();

        assert.equal(captured.prompt, 'hello');
        assert.equal(captured.target, btn);
    });

    it('hx-on::prompt can preventDefault to abort the request', async function() {
        mockResponse('DELETE', '/items/1', 'ok');
        let btn = createProcessedHTML(
            '<button hx-delete="/items/1" hx-prompt="Reason?" hx-on::prompt="if (prompt.length < 3) event.preventDefault()">Delete</button>'
        );

        window.prompt = () => 'no';
        btn.click();
        await forRequest();
        assert.isUndefined(fetchMock.getLastCall());

        window.prompt = () => 'long enough';
        btn.click();
        await forRequest();
        assert.equal(lastFetch().request.headers['HX-Prompt'], 'long enough');
    });

    it('uses window.htmxPrompt when defined', async function() {
        window.htmxPrompt = (question) => 'answered: ' + question;
        window.prompt = () => { throw new Error('window.prompt should not be called'); };
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML('<button hx-delete="/items/1" hx-prompt="Q?">Delete</button>');
        btn.click();
        await forRequest();

        assert.equal(lastFetch().request.headers['HX-Prompt'], 'answered: Q?');
    });

    it('null from window.htmxPrompt aborts the request', async function() {
        window.htmxPrompt = () => null;
        mockResponse('DELETE', '/items/1', 'ok');

        let btn = createProcessedHTML('<button hx-delete="/items/1" hx-prompt="Q?">Delete</button>');
        btn.click();
        await forRequest();

        assert.isUndefined(fetchMock.getLastCall());
    });

    describe('hx-on recipe (no extension needed)', () => {
        const recipe = "ctx.request.headers['HX-Prompt'] = prompt('Reason?') ?? event.preventDefault()";

        it('sends HX-Prompt with the answer', async function() {
            window.prompt = () => 'a reason';
            mockResponse('DELETE', '/items/1', 'ok');

            let btn = createProcessedHTML(`<button hx-delete="/items/1" hx-on::config:request="${recipe}">Delete</button>`);
            btn.click();
            await forRequest();

            assert.equal(lastFetch().request.headers['HX-Prompt'], 'a reason');
        });

        it('aborts the request on cancel', async function() {
            window.prompt = () => null;
            mockResponse('DELETE', '/items/1', 'ok');

            let btn = createProcessedHTML(`<button hx-delete="/items/1" hx-on::config:request="${recipe}">Delete</button>`);
            btn.click();
            await forRequest();

            assert.isUndefined(fetchMock.getLastCall());
        });
    });
});
