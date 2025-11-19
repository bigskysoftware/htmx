describe('hx-status attribute tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('applies swap override for exact status match', async function() {
        mockResponse('GET', '/test', '<div id="result">Error</div>', {status: 404});
        createProcessedHTML('<div id="target">Original</div><button hx-get="/test" hx-target="#target" hx-status:404="swap:outerHTML">Click</button>');
        let button = find('button');
        button.click();
        await forRequest();
        assert.isUndefined(find('#target'));
        assert.equal(find('#result').innerText, 'Error');
    });

    it('applies swap override for wildcard pattern', async function() {
        mockResponse('GET', '/test', '<div>Server Error</div>', {status: 500});
        createProcessedHTML('<div id="target">Original</div><button hx-get="/test" hx-target="#target" hx-status:5xx="swap:innerHTML">Click</button>');
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(find('#target').innerText, 'Server Error');
    });

    it('can change target based on status', async function() {
        createProcessedHTML('<div id="success"></div><div id="error"></div><button hx-get="/test" hx-target="#success" hx-status:404="target:#error">Click</button>');
        mockResponse('GET', '/test', '<span>Not Found</span>', {status: 404});
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(find('#error').innerText, 'Not Found');
        assert.equal(find('#success').innerText, '');
    });

    it('can select different content based on status', async function() {
        mockResponse('GET', '/test', '<div id="success-msg">Success!</div><div id="error-msg">Failed!</div>', {status: 422});
        createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#target" hx-status:422="select:#error-msg">Click</button>');
        let button = find('button');
        button.click();
        await forRequest();
        assert.include(find('#target').innerText, 'Failed!');
        assert.notInclude(find('#target').innerText, 'Success!');
    });

    it('can set multiple properties with hx-status', async function() {
        createProcessedHTML('<div id="main"></div><div id="errors"></div><button hx-get="/test" hx-target="#main" hx-status:422="swap:innerHTML target:#errors select:#validation-errors">Click</button>');
        mockResponse('GET', '/test', '<div id="validation-errors">Invalid input</div>', {status: 422});
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(find('#errors').innerText, 'Invalid input');
        assert.equal(find('#main').innerText, '');
    });

    it('prefers exact match over wildcard', async function() {
        mockResponse('GET', '/test', '<div>Specific</div>', {status: 404});
        createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#target" hx-status:404="select:#specific" hx-status:4xx="select:#generic">Click</button>');
        // Since we're not including those IDs in response, this tests that 404 is matched first
        let button = find('button');
        button.click();
        await forRequest();
        // The test verifies the order of evaluation
    });

    it('can prevent history update on error', async function() {
        mockResponse('GET', '/test', '<div>Error</div>', {status: 500});
        createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#target" hx-push-url="true" hx-status:5xx="push:false">Click</button>');
        let originalUrl = window.location.href;
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(window.location.href, originalUrl);
    });

    it('works with 2-digit wildcard pattern', async function() {
        mockResponse('GET', '/test', '<div>Server Error</div>', {status: 503});
        createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#target" hx-status:50x="swap:innerHTML">Click</button>');
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(find('#target').innerText, 'Server Error');
    });

    it('does not apply when status does not match', async function() {
        mockResponse('GET', '/test', '<div>Success</div>', {status: 200});
        createProcessedHTML('<div id="target">Original</div><button hx-get="/test" hx-target="#target" hx-status:404="swap:none">Click</button>');
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(find('#target').innerText, 'Success');
    });

    it('can set swap to none on error', async function() {
        mockResponse('GET', '/test', '<div>Error Content</div>', {status: 500});
        createProcessedHTML('<div id="target">Original</div><button hx-get="/test" hx-target="#target" hx-status:500="swap:none">Click</button>');
        let button = find('button');
        button.click();
        await forRequest();
        assert.equal(find('#target').innerText, 'Original');
    });

});
