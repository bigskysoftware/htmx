describe('Strip Modifier', function() {
    afterEach(function() {
        cleanupTest()
    })

    // ========================================================================
    // Main Swap Tests
    // ========================================================================

    it('Main swap with strip:true extracts children', async function() {
        mockResponse('GET', '/api', '<wrapper><p>A</p><p>B</p></wrapper>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-swap="innerHTML strip:true">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Should have both paragraphs, no wrapper
        const target = find('#target');
        assert.equal(target.children.length, 2);
        assert.equal(target.children[0].tagName, 'P');
        assert.equal(target.children[0].textContent, 'A');
        assert.equal(target.children[1].tagName, 'P');
        assert.equal(target.children[1].textContent, 'B');
        assert.isUndefined(find('#target wrapper'));
    })

    it('Main swap with strip:false keeps wrapper', async function() {
        mockResponse('GET', '/api', '<wrapper><p>A</p><p>B</p></wrapper>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-swap="innerHTML strip:false">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Should have wrapper
        const wrapper = find('#target wrapper');
        assert.exists(wrapper);
        assert.equal(wrapper.children.length, 2);
    })

    it('Main swap without strip modifier keeps wrapper (default)', async function() {
        mockResponse('GET', '/api', '<wrapper><p>A</p><p>B</p></wrapper>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-swap="innerHTML">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Should have wrapper (default is no strip)
        const wrapper = find('#target wrapper');
        assert.exists(wrapper);
    })

    // ========================================================================
    // hx-select Tests
    // ========================================================================

    it('hx-select with strip:true extracts children', async function() {
        mockResponse('GET', '/api', '<div class="content"><span>X</span><span>Y</span></div>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-select=".content" hx-swap="innerHTML strip:true">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Default strip:true for hx-select - should have spans, no .content wrapper
        const target = find('#target');
        assert.equal(target.children.length, 2);
        assert.equal(target.children[0].tagName, 'SPAN');
        assert.isUndefined(find('#target .content'));
    })

    it('hx-select with default keeps selected element', async function() {
        mockResponse('GET', '/api', '<div class="content"><span>X</span><span>Y</span></div>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-select=".content">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Should keep the .content wrapper
        const content = find('#target .content');
        assert.exists(content);
        assert.equal(content.children.length, 2);
    })

    // ========================================================================
    // OOB Swap Tests
    // ========================================================================

    it('OOB innerHTML with default strip extracts children', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><div hx-swap-oob="innerHTML:#oob"><p>OOB A</p><p>OOB B</p></div>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="oob">Original</div>');
        find('#btn').click()
        await forRequest();
        
        // Default strip:true for OOB innerHTML - strips the OOB div, inserts its children
        const oob = find('#oob');
        assert.equal(oob.children.length, 2);
        assert.equal(oob.children[0].tagName, 'P');
        assert.equal(oob.children[0].textContent, 'OOB A');
    })

    it('OOB innerHTML with strip:false keeps wrapper', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><article hx-swap-oob="innerHTML target:#oob strip:false"><h1>Title</h1><p>Text</p></article>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="oob">Original</div>');
        find('#btn').click()
        await forRequest();
        
        // Should keep the article wrapper
        const article = find('#oob article');
        assert.exists(article);
        assert.equal(article.children.length, 2);
    })

    it('OOB beforeend with default strip extracts children', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><div hx-swap-oob="beforeend:#list"><li>Item A</li><li>Item B</li></div>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><ul id="list"><li>Existing</li></ul>');
        find('#btn').click()
        await forRequest();
        
        // Default strip:true - strips the OOB div, inserts its children
        const list = find('#list');
        assert.equal(list.children.length, 3); // Existing + 2 new
        assert.equal(list.children[1].tagName, 'LI');
        assert.equal(list.children[1].textContent, 'Item A');
    })

    it('OOB beforeend with strip:false keeps wrapper element', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><li hx-swap-oob="beforeend target:#list strip:false"><strong>Item</strong></li>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><ul id="list"><li>Existing</li></ul>');
        find('#btn').click()
        await forRequest();
        
        // Should keep the li wrapper
        const list = find('#list');
        assert.equal(list.children.length, 2);
        assert.equal(list.children[1].tagName, 'LI');
        assert.equal(list.children[1].children[0].tagName, 'STRONG');
    })

    it('OOB outerHTML with default (no strip) keeps wrapper', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><wrapper hx-swap-oob="outerHTML:#target"><section>A</section><section>B</section></wrapper>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="target">Old</div>');
        find('#btn').click()
        await forRequest();
        
        // Default strip:false for outerHTML - should have wrapper
        const wrapper = find('wrapper');
        assert.exists(wrapper);
        assert.equal(wrapper.children.length, 2);
    })

    it('OOB outerHTML with strip:true replaces with multiple children', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><wrapper hx-swap-oob="outerHTML strip:true target:#target"><section>A</section><section>B</section><aside>C</aside></wrapper>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="target">Old</div>');
        find('#btn').click()
        await forRequest();
        
        // Should replace #target with all children (no wrapper)
        assert.isUndefined(find('#target'));
        assert.isUndefined(find('wrapper'));
        const sections = playground().querySelectorAll('section');
        assert.equal(sections.length, 2);
        const aside = find('aside');
        assert.exists(aside);
    })

    // ========================================================================
    // SVG Namespace Tests
    // ========================================================================

    it('OOB with SVG and default strip preserves namespace', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><svg hx-swap-oob="beforeend:#canvas"><circle cx="50" cy="50" r="20"></circle><circle cx="100" cy="100" r="30"><circle></svg>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg>');
        find('#btn').click()
        await forRequest();
        
        // Default strip:true - strips the g element, inserts circles in SVG namespace
        const canvas = find('#canvas');
        assert.equal(canvas.children.length, 2);
        assert.equal(canvas.children[0].tagName, 'circle');
        assert.equal(canvas.children[0].namespaceURI, 'http://www.w3.org/2000/svg');
    })

    it('OOB with SVG and strip:false creates nested SVG', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><svg hx-swap-oob="beforeend target:#canvas strip:false" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20"></circle></svg>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg>');
        find('#btn').click()
        await forRequest();
        
        // Should have nested svg
        const canvas = find('#canvas');
        const nestedSvg = canvas.querySelector('svg');
        assert.exists(nestedSvg);
        assert.equal(nestedSvg.children.length, 1);
        assert.equal(nestedSvg.children[0].tagName, 'circle');
    })

    // ========================================================================
    // Partial Tests
    // ========================================================================

    it('Partial with strip:true extracts children', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><hx-partial hx-target="#target" hx-swap="innerHTML strip:true"><wrapper><span>A</span><span>B</span></wrapper></hx-partial>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="target">Original</div>');
        find('#btn').click()
        await forRequest();
        
        // Should have spans, no wrapper
        const target = find('#target');
        assert.equal(target.children.length, 2);
        assert.equal(target.children[0].tagName, 'SPAN');
        assert.isUndefined(find('#target wrapper'));
    })

    it('Partial with strip:false keeps wrapper', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><hx-partial hx-target="#target" hx-swap="innerHTML strip:false"><wrapper><span>A</span><span>B</span></wrapper></hx-partial>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="target">Original</div>');
        find('#btn').click()
        await forRequest();
        
        // Should keep wrapper
        const wrapper = find('#target wrapper');
        assert.exists(wrapper);
        assert.equal(wrapper.children.length, 2);
    })

    it('Partial without strip modifier keeps wrapper (default)', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><hx-partial hx-target="#target" hx-swap="innerHTML"><wrapper><span>A</span><span>B</span></wrapper></hx-partial>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><div id="target">Original</div>');
        find('#btn').click()
        await forRequest();
        
        // Default is no strip for partials
        const wrapper = find('#target wrapper');
        assert.exists(wrapper);
    })

    it('Partial with SVG and strip:true extracts circles', async function() {
        mockResponse('GET', '/api', '<div id="main">Main</div><hx-partial hx-target="#canvas" hx-swap="innerHTML strip:true"><svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20"/><circle cx="100" cy="100" r="30"/></svg></hx-partial>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#main">Get</button><svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg>');
        find('#btn').click()
        await forRequest();
        
        // Should strip svg wrapper, insert circles in SVG namespace
        const canvas = find('#canvas');
        assert.equal(canvas.children.length, 2);
        assert.equal(canvas.children[0].tagName, 'circle');
        assert.equal(canvas.children[0].namespaceURI, 'http://www.w3.org/2000/svg');
    })

    // ========================================================================
    // Edge Cases
    // ========================================================================

    it('Strip with single text node extracts text', async function() {
        mockResponse('GET', '/api', '<wrapper>Just text</wrapper>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-swap="innerHTML strip:true">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Should extract text node
        const target = find('#target');
        assert.equal(target.textContent, 'Just text');
        assert.equal(target.children.length, 0); // No element children
    })

    it('Strip only removes one level', async function() {
        mockResponse('GET', '/api', '<outer><inner><p>Content</p></inner></outer>');
        createProcessedHTML('<button id="btn" hx-get="/api" hx-target="#target" hx-swap="innerHTML strip:true">Get</button><div id="target"></div>');
        find('#btn').click()
        await forRequest();
        
        // Should only strip outer, keep inner
        const target = find('#target');
        const inner = find('#target inner');
        assert.exists(inner);
        assert.isUndefined(find('#target outer'));
        assert.equal(inner.children[0].tagName, 'P');
    })
})
