describe('Morph Swap Styles Tests', function() {
    
    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    describe('innerMorph', function() {
        it('morphs children while preserving element with matching id', async function() {
            mockResponse('GET', '/test', '<div id="child1">updated</div><div id="child2">new</div>');
            const div = createProcessedHTML('<div id="target"><div id="child1">original</div></div>');
            const child1 = div.querySelector('#child1');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#child1'), child1, 'Element with id should be preserved');
            assert.equal(child1.textContent, 'updated');
            assert.isNotNull(div.querySelector('#child2'));
        });

        it('morphs text content', async function() {
            mockResponse('GET', '/test', '<p>new text</p>');
            const div = createProcessedHTML('<div id="target"><p>old text</p></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.include(div.innerHTML, 'new text');
            assert.notInclude(div.innerHTML, 'old text');
        });

        it('morphs attributes', async function() {
            mockResponse('GET', '/test', '<div id="child" class="new-class" data-value="123">content</div>');
            const div = createProcessedHTML('<div id="target"><div id="child" class="old-class">content</div></div>');
            const child = div.querySelector('#child');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(child.className, 'new-class');
            assert.equal(child.getAttribute('data-value'), '123');
        });

        it('removes old elements not in new content', async function() {
            mockResponse('GET', '/test', '<div id="keep">kept</div>');
            const div = createProcessedHTML('<div id="target"><div id="keep">kept</div><div id="remove">removed</div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.isNotNull(div.querySelector('#keep'));
            assert.isNull(div.querySelector('#remove'));
        });

        it('adds new elements', async function() {
            mockResponse('GET', '/test', '<div id="old">old</div><div id="new">new</div>');
            const div = createProcessedHTML('<div id="target"><div id="old">old</div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.isNotNull(div.querySelector('#old'));
            assert.isNotNull(div.querySelector('#new'));
        });

        it('preserves element references with matching ids', async function() {
            mockResponse('GET', '/test', '<input id="input1" value="new"><input id="input2" value="added">');
            const div = createProcessedHTML('<div id="target"><input id="input1" value="old"></div>');
            const input1 = div.querySelector('#input1');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#input1'), input1, 'Input element should be same reference');
            assert.equal(input1.value, 'new');
            assert.isNotNull(div.querySelector('#input2'));
        });

        it('handles nested elements with ids', async function() {
            mockResponse('GET', '/test', '<div id="outer"><div id="inner">updated</div></div>');
            const div = createProcessedHTML('<div id="target"><div id="outer"><div id="inner">original</div></div></div>');
            const outer = div.querySelector('#outer');
            const inner = div.querySelector('#inner');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#outer'), outer);
            assert.equal(div.querySelector('#inner'), inner);
            assert.equal(inner.textContent, 'updated');
        });

        it('morphs without ids using tag matching', async function() {
            mockResponse('GET', '/test', '<p>new paragraph</p><span>new span</span>');
            const div = createProcessedHTML('<div id="target"><p>old paragraph</p><span>old span</span></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.include(div.innerHTML, 'new paragraph');
            assert.include(div.innerHTML, 'new span');
        });
    });

    describe('outerMorph', function() {
        it('morphs the target element itself', async function() {
            mockResponse('GET', '/test', '<div id="target" class="new-class">updated</div>');
            const container = createProcessedHTML('<div><div id="target" class="old-class">original</div></div>');
            const target = container.querySelector('#target');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});
            
            const newTarget = container.querySelector('#target');
            assert.equal(newTarget, target, 'Target element should be morphed, not replaced');
            assert.equal(newTarget.className, 'new-class');
            assert.equal(newTarget.textContent, 'updated');
        });

        it('morphs target attributes', async function() {
            mockResponse('GET', '/test', '<div id="target" data-value="123" class="morphed">content</div>');
            const container = createProcessedHTML('<div><div id="target" class="original">content</div></div>');
            const target = container.querySelector('#target');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});
            
            assert.equal(container.querySelector('#target'), target);
            assert.equal(target.className, 'morphed');
            assert.equal(target.getAttribute('data-value'), '123');
        });

        it('morphs target children', async function() {
            mockResponse('GET', '/test', '<div id="target"><span id="child">new child</span></div>');
            const container = createProcessedHTML('<div><div id="target"><span id="child">old child</span></div></div>');
            const target = container.querySelector('#target');
            const child = target.querySelector('#child');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});
            
            assert.equal(container.querySelector('#target'), target);
            assert.equal(target.querySelector('#child'), child);
            assert.equal(child.textContent, 'new child');
        });

        it('preserves element identity during morph', async function() {
            mockResponse('GET', '/test', '<button id="btn" class="updated">Click Me</button>');
            const container = createProcessedHTML('<div><button id="btn" class="original">Click</button></div>');
            const btn = container.querySelector('#btn');
            let clicked = false;
            btn.addEventListener('click', () => clicked = true);
            
            await htmx.ajax('GET', '/test', {target: '#btn', swap: 'outerMorph'});
            
            const newBtn = container.querySelector('#btn');
            assert.equal(newBtn, btn, 'Button should be same element');
            newBtn.click();
            assert.isTrue(clicked, 'Event listener should still work');
        });
    });

    describe('innerMorph vs innerHTML comparison', function() {
        it('innerMorph preserves elements, innerHTML replaces', async function() {
            mockResponse('GET', '/test', '<input id="field" value="new">');
            
            // Test innerHTML
            const div1 = createProcessedHTML('<div id="target1"><input id="field" value="old"></div>');
            const input1 = div1.querySelector('#field');
            await htmx.ajax('GET', '/test', {target: '#target1', swap: 'innerHTML'});
            const newInput1 = div1.querySelector('#field');
            assert.notEqual(newInput1, input1, 'innerHTML should create new element');
            
            // Test innerMorph
            mockResponse('GET', '/test', '<input id="field" value="new">');
            const div2 = createProcessedHTML('<div id="target2"><input id="field" value="old"></div>');
            const input2 = div2.querySelector('#field');
            await htmx.ajax('GET', '/test', {target: '#target2', swap: 'innerMorph'});
            const newInput2 = div2.querySelector('#field');
            assert.equal(newInput2, input2, 'innerMorph should preserve element');
        });
    });

    describe('outerMorph vs outerHTML comparison', function() {
        it('outerMorph preserves target, outerHTML replaces', async function() {
            mockResponse('GET', '/test', '<div id="target" class="new">updated</div>');
            
            // Test outerHTML
            const container1 = createProcessedHTML('<div><div id="target" class="old">original</div></div>');
            const target1 = container1.querySelector('#target');
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerHTML'});
            const newTarget1 = container1.querySelector('#target');
            assert.notEqual(newTarget1, target1, 'outerHTML should create new element');
            
            // Test outerMorph
            mockResponse('GET', '/test', '<div id="target" class="new">updated</div>');
            const container2 = createProcessedHTML('<div><div id="target" class="old">original</div></div>');
            const target2 = container2.querySelector('#target');
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});
            const newTarget2 = container2.querySelector('#target');
            assert.equal(newTarget2, target2, 'outerMorph should preserve element');
        });
    });

    describe('edge cases', function() {
        it('handles empty content', async function() {
            mockResponse('GET', '/test', '');
            const div = createProcessedHTML('<div id="target"><p>content</p></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.innerHTML, '');
        });

        it('handles complex nested structures', async function() {
            mockResponse('GET', '/test', 
                '<div id="a"><div id="b"><div id="c">updated</div></div></div>');
            const div = createProcessedHTML(
                '<div id="target"><div id="a"><div id="b"><div id="c">original</div></div></div></div>');
            const a = div.querySelector('#a');
            const b = div.querySelector('#b');
            const c = div.querySelector('#c');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#a'), a);
            assert.equal(div.querySelector('#b'), b);
            assert.equal(div.querySelector('#c'), c);
            assert.equal(c.textContent, 'updated');
        });

        it('handles mixed content with and without ids', async function() {
            mockResponse('GET', '/test', 
                '<div id="with-id">has id</div><div>no id</div><span id="another">another</span>');
            const div = createProcessedHTML(
                '<div id="target"><div id="with-id">old</div><p>paragraph</p></div>');
            const withId = div.querySelector('#with-id');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#with-id'), withId);
            assert.equal(withId.textContent, 'has id');
            assert.isNotNull(div.querySelector('#another'));
        });

        it('handles numeric ids', async function() {
            mockResponse('GET', '/test', '<div><hr id="1"></div>');
            const div = createProcessedHTML('<div id="target"><hr id="1"></div>');
            const hr = div.querySelector('#\\31');

            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

            assert.equal(div.querySelector('#\\31'), hr);
        });

        it('does not re-execute identical script tags during morph', async function() {
            window._scriptMorphCount = 0;
            createProcessedHTML('<div id="target"></div>');
            await htmx.swap({target: '#target', text: '<script>window._scriptMorphCount++<\/script><div id="content">original</div>', swap: 'innerHTML'});
            assert.equal(window._scriptMorphCount, 1, 'Script should run once after initial swap');

            await htmx.swap({target: '#target', text: '<script>window._scriptMorphCount++<\/script><div id="content">updated</div>', swap: 'innerMorph'});

            assert.equal(window._scriptMorphCount, 1, 'Identical script should not re-execute after morph');
            delete window._scriptMorphCount;
        });

        it('executes changed script tags once when replaced during morph', async function() {
            window._scriptMorphCount = 0;
            createProcessedHTML('<div id="target"></div>');
            await htmx.swap({target: '#target', text: '<script>window._scriptMorphCount++<\/script>', swap: 'innerHTML'});
            assert.equal(window._scriptMorphCount, 1, 'Original script should run once after initial swap');

            await htmx.swap({target: '#target', text: '<script>window._scriptMorphCount += 10<\/script>', swap: 'innerMorph'});

            assert.equal(window._scriptMorphCount, 11, 'Changed script should execute exactly once after morph');
            delete window._scriptMorphCount;
        });

        it('does not treat empty id="" as a persistent id', async function() {
            // When both old and new content have <h1 id="">, the empty string should NOT
            // be treated as a persistent ID that needs to be preserved/matched.
            // Previously this caused HierarchyRequestError when sibling elements differed,
            // because the algorithm tried to reuse the h1 based on the "" id match.
            mockResponse('GET', '/test', '<h1 id="">B</h1><div>Y</div>');
            const div = createProcessedHTML('<div id="target"><h1 id="">A</h1><section>X</section></div>');

            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

            assert.equal(div.querySelector('h1').textContent, 'B');
            assert.isNotNull(div.querySelector('div'));
            assert.isNull(div.querySelector('section'));
        });
    });

    describe('input value preservation', function() {
        it('preserves input value when attribute unchanged', async function() {
            mockResponse('GET', '/test', '<input id="field" value="old" class="updated">');
            const div = createProcessedHTML('<div id="target"><input id="field" value="old"></div>');
            const input = div.querySelector('#field');
            input.value = 'user-typed';
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(input.value, 'user-typed', 'Preserves user input when value attribute unchanged');
            assert.equal(input.className, 'updated');
        });

        it('updates input value when attribute changes', async function() {
            mockResponse('GET', '/test', '<input id="field" value="new">');
            const div = createProcessedHTML('<div id="target"><input id="field" value="old"></div>');
            const input = div.querySelector('#field');
            input.value = 'user-typed';
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(input.value, 'new', 'Updates value when attribute changes');
        });

        it('preserves textarea value when content unchanged', async function() {
            mockResponse('GET', '/test', '<textarea id="field" class="updated">old</textarea>');
            const div = createProcessedHTML('<div id="target"><textarea id="field">old</textarea></div>');
            const textarea = div.querySelector('#field');
            textarea.value = 'user-typed';
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(textarea.value, 'user-typed', 'Preserves user input when content unchanged');
            assert.equal(textarea.className, 'updated');
        });

        it('updates textarea value when content changes', async function() {
            mockResponse('GET', '/test', '<textarea id="field">new</textarea>');
            const div = createProcessedHTML('<div id="target"><textarea id="field">old</textarea></div>');
            const textarea = div.querySelector('#field');
            textarea.value = 'user-typed';
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(textarea.value, 'new', 'Updates value when content changes');
        });

        it('preserves checkbox state when attribute unchanged', async function() {
            mockResponse('GET', '/test', '<input id="cb" type="checkbox" checked class="updated">');
            const div = createProcessedHTML('<div id="target"><input id="cb" type="checkbox" checked></div>');
            const checkbox = div.querySelector('#cb');
            checkbox.checked = false;
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(checkbox.checked, false, 'Preserves user state when checked attribute unchanged');
            assert.equal(checkbox.className, 'updated');
        });


    });

    describe('element reordering with ids', function() {
        it('reorders elements with ids correctly', async function() {
            mockResponse('GET', '/test', '<div id="c">C</div><div id="b">B</div><div id="a">A</div>');
            const div = createProcessedHTML('<div id="target"><div id="a">A</div><div id="b">B</div><div id="c">C</div></div>');
            const a = div.querySelector('#a');
            const b = div.querySelector('#b');
            const c = div.querySelector('#c');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#a'), a, 'Element A should be preserved');
            assert.equal(div.querySelector('#b'), b, 'Element B should be preserved');
            assert.equal(div.querySelector('#c'), c, 'Element C should be preserved');
            assert.equal(div.children[0].id, 'c');
            assert.equal(div.children[1].id, 'b');
            assert.equal(div.children[2].id, 'a');
        });

        it('moves id node into nested div correctly', async function() {
            mockResponse('GET', '/test', '<div><input id="first"></div>');
            const div = createProcessedHTML('<div id="target"><input id="first"></div>');
            const input = div.querySelector('#first');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#first'), input);
            assert.equal(input.parentElement.tagName, 'DIV');
        });

        it('handles complex id reordering with nesting', async function() {
            mockResponse('GET', '/test', '<br><a id="a"><b id="b"></b></a>');
            const div = createProcessedHTML('<div id="target"><a id="a"></a><br><b id="b"></b></div>');
            const a = div.querySelector('#a');
            const b = div.querySelector('#b');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('#a'), a);
            assert.equal(div.querySelector('#b'), b);
            assert.equal(b.parentElement, a, 'b should be inside a');
        });
    });

    describe('attribute morphing edge cases', function() {
        it('morphs multiple attributes correctly', async function() {
            mockResponse('GET', '/test', 
                '<section id="s" class="thing" data-one="1" data-two="2" data-three="3" data-four="4" fizz="buzz" foo="bar">B</section>');
            const container = createProcessedHTML('<div><section id="s" class="child">A</section></div>');
            const section = container.querySelector('#s');
            
            await htmx.ajax('GET', '/test', {target: '#s', swap: 'outerMorph'});
            
            assert.equal(section.className, 'thing');
            assert.equal(section.getAttribute('data-one'), '1');
            assert.equal(section.getAttribute('data-four'), '4');
            assert.equal(section.getAttribute('fizz'), 'buzz');
            assert.equal(section.textContent, 'B');
        });

        it('removes attributes correctly', async function() {
            mockResponse('GET', '/test', '<section id="s" class="child">A</section>');
            const container = createProcessedHTML(
                '<div><section id="s" class="thing" data-one="1" data-two="2" fizz="buzz">B</section></div>');
            const section = container.querySelector('#s');
            
            await htmx.ajax('GET', '/test', {target: '#s', swap: 'outerMorph'});
            
            assert.equal(section.className, 'child');
            assert.isNull(section.getAttribute('data-one'));
            assert.isNull(section.getAttribute('fizz'));
            assert.equal(section.textContent, 'A');
        });

        it('handles fieldset disabled property correctly', async function() {
            mockResponse('GET', '/test', '<fieldset id="fs">hello</fieldset>');
            const container = createProcessedHTML('<div><fieldset id="fs" class="foo" disabled></fieldset></div>');
            const fieldset = container.querySelector('#fs');
            
            await htmx.ajax('GET', '/test', {target: '#fs', swap: 'outerMorph'});
            
            assert.equal(fieldset.innerHTML, 'hello');
            assert.equal(fieldset.classList.length, 0);
            assert.equal(fieldset.disabled, false);
        });
    });

    describe('htmx processing during morph', function() {
        it('processes new htmx attributes added during innerMorph', async function() {
            mockResponse('GET', '/test', '<button id="btn" hx-get="/click" hx-target="#result">Updated</button><div id="result"></div>');
            const div = createProcessedHTML('<div id="target"><button id="btn">Original</button><div id="result"></div></div>');
            const btn = div.querySelector('#btn');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(btn.getAttribute('data-htmx-powered'), 'true', 'New htmx attributes should be processed');
            
            mockResponse('GET', '/click', 'Clicked!');
            btn.click();
            await waitForEvent('htmx:after:swap', 100);
            
            assert.equal(div.querySelector('#result').textContent, 'Clicked!', 'New htmx functionality should work');
        });

        it('processes new htmx attributes added during outerMorph', async function() {
            mockResponse('GET', '/test', '<button id="btn" hx-get="/click" hx-target="#result">Updated</button>');
            const container = createProcessedHTML('<div><button id="btn">Original</button><div id="result"></div></div>');
            const btn = container.querySelector('#btn');
            
            await htmx.ajax('GET', '/test', {target: '#btn', swap: 'outerMorph'});
            
            assert.equal(btn.getAttribute('data-htmx-powered'), 'true', 'New htmx attributes should be processed');
            
            mockResponse('GET', '/click', 'Clicked!');
            btn.click();
            await waitForEvent('htmx:after:swap', 100);
            
            assert.equal(container.querySelector('#result').textContent, 'Clicked!', 'New htmx functionality should work');
        });

        it('processes new htmx attributes on inserted elements during innerMorph', async function() {
            mockResponse('GET', '/test', '<button id="existing">Existing</button><button id="new" hx-get="/new">New Button</button>');
            const div = createProcessedHTML('<div id="target"><button id="existing">Existing</button></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            const newBtn = div.querySelector('#new');
            assert.isNotNull(newBtn);
            assert.equal(newBtn.getAttribute('data-htmx-powered'), 'true', 'New inserted element should be processed');
        });

        it('reinitializes element when hx-get is added during innerMorph', async function() {
            mockResponse('GET', '/dynamic', 'fetched');
            const div = createProcessedHTML('<div id="target"><div id="child"><p>static</p></div></div>');

            await htmx.swap({target: '#target', text: '<div id="child" hx-get="/dynamic" hx-trigger="click" hx-swap="innerHTML"><p>now interactive</p></div>', swap: 'innerMorph', sourceElement: div});

            const child = div.querySelector('#child');
            assert.isNotNull(child._htmx?.initialized, 'child should be initialized');
            child.click();
            await forRequest();
            assert.equal(child.textContent, 'fetched');
        });

        it('reinitializes element when hx-get is removed during innerMorph', async function() {
            mockResponse('GET', '/should-not-fire', 'bad');
            const div = createProcessedHTML('<div id="target"><div id="child" hx-get="/should-not-fire" hx-trigger="click" hx-swap="innerHTML">interactive</div></div>');
            const child = div.querySelector('#child');
            assert.isNotNull(child._htmx?.initialized, 'child should start initialized');

            await htmx.swap({target: '#target', text: '<div id="child">no longer interactive</div>', swap: 'innerMorph', sourceElement: div});

            assert.isNull(child.getAttribute('hx-get'), 'hx-get should be removed');
            let requestFired = false;
            let handler = () => { requestFired = true; };
            document.addEventListener('htmx:before:request', handler);
            child.click();
            await htmx.timeout(50);
            document.removeEventListener('htmx:before:request', handler);
            assert.isFalse(requestFired, 'no request should fire after hx-get removed');
        });

        it('reinitializes element when hx-trigger changes during innerMorph', async function() {
            mockResponse('GET', '/endpoint', 'response');
            const div = createProcessedHTML('<div id="target"><div id="child" hx-get="/endpoint" hx-trigger="click" hx-swap="innerHTML">original</div></div>');

            await htmx.swap({target: '#target', text: '<div id="child" hx-get="/endpoint" hx-trigger="mousedown" hx-swap="innerHTML">updated</div>', swap: 'innerMorph', sourceElement: div});

            const child = div.querySelector('#child');
            assert.equal(child.getAttribute('hx-trigger'), 'mousedown');

            let requestFired = false;
            let handler = () => { requestFired = true; };
            document.addEventListener('htmx:before:request', handler);
            child.click();
            await htmx.timeout(50);
            document.removeEventListener('htmx:before:request', handler);
            assert.isFalse(requestFired, 'click should not trigger after hx-trigger changed to mousedown');

            child.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
            await forRequest();
            assert.equal(child.textContent, 'response');
        });

        it('processes new htmx attributes on inserted elements during outerMorph', async function() {
            mockResponse('GET', '/test', '<div id="target"><button id="existing">Existing</button><button id="new" hx-get="/new">New Button</button></div>');
            const container = createProcessedHTML('<div><div id="target"><button id="existing">Existing</button></div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});
            
            const newBtn = container.querySelector('#new');
            assert.isNotNull(newBtn);
            assert.equal(newBtn.getAttribute('data-htmx-powered'), 'true', 'New inserted element should be processed');
        });

        it('does not process detached fragment children during outerMorph', async function() {
            mockResponse('GET', '/test', '<div id="target"><span class="child" hx-get="/x">new</span></div>');
            const container = createProcessedHTML('<div><div id="target"><span class="child">old</span></div></div>');

            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});

            assert.equal(container.querySelector('#target .child').getAttribute('data-htmx-powered'), 'true',
                'live nested child should still be initialized');
        });

        it('does not attach htmx state to detached fragment children during outerMorph', async function() {
            mockResponse('GET', '/test', '<div id="target"><span class="child" hx-get="/x">new</span></div>');
            const container = createProcessedHTML('<div><div id="target"><span class="child">old</span></div></div>');

            let fragmentChild;
            document.addEventListener('htmx:before:swap', (e) => {
                const mainTask = (e.detail.tasks || []).find(t => t.type === 'main');
                fragmentChild = mainTask && mainTask.fragment && mainTask.fragment.querySelector('.child');
            }, { once: true });

            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});

            assert.isOk(fragmentChild, 'captured the fragment child before morph');
            assert.isFalse(fragmentChild.isConnected,
                'same-tag outerMorph leaves fragment children detached as templates');
            assert.equal(typeof fragmentChild._htmx, 'undefined',
                'process() should not have attached _htmx state to the detached fragment child');
            assert.isNull(fragmentChild.getAttribute('data-htmx-powered'),
                'detached fragment child should not be marked data-htmx-powered');
        });

        it('processes new htmx attributes on tag-changing outerMorph (span to div)', async function() {
            mockResponse('GET', '/test', '<div id="target" hx-get="/click" hx-target="#result">Updated</div>');
            const container = createProcessedHTML('<div><span id="target">Original</span><div id="result"></div></div>');

            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});

            const newDiv = container.querySelector('#target');
            assert.isNotNull(newDiv, 'New div should exist in DOM');
            assert.equal(newDiv.tagName, 'DIV', 'Element should now be a div');
            assert.equal(newDiv.getAttribute('data-htmx-powered'), 'true', 'New div should be processed');

            mockResponse('GET', '/click', 'Clicked!');
            newDiv.click();
            await waitForEvent('htmx:after:swap', 100);

            assert.equal(container.querySelector('#result').textContent, 'Clicked!', 'htmx actions on new div should work');
        });

        it('does not stack hx-on:click handlers across innerMorph', async function() {
            window._calls = 0;
            mockResponse('GET', '/test', '<button id="btn" hx-on:click="window._calls++">v</button>');
            createProcessedHTML('<div id="target"><button id="btn" hx-on:click="window._calls++">v</button></div>');
            for (let i = 0; i < 3; i++) {
                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            }
            document.getElementById('btn').click();
            assert.equal(window._calls, 1, 'click should fire handler exactly once');
            delete window._calls;
        });

        it('does not stack hx-on:click handlers across outerMorph', async function() {
            window._calls = 0;
            mockResponse('GET', '/test', '<button id="btn" hx-on:click="window._calls++">v</button>');
            createProcessedHTML('<button id="btn" hx-on:click="window._calls++">v</button>');
            for (let i = 0; i < 3; i++) {
                await htmx.ajax('GET', '/test', {target: '#btn', swap: 'outerMorph'});
            }
            document.getElementById('btn').click();
            assert.equal(window._calls, 1, 'click should fire handler exactly once');
            delete window._calls;
        });

        it('handles multiple hx-on attributes after morph', async function() {
            window._log = [];
            mockResponse('GET', '/test', '<button id="b" hx-on:click="window._log.push(\'c\')" hx-on:focus="window._log.push(\'f\')">b</button>');
            createProcessedHTML('<div id="wrap"><button id="b" hx-on:click="window._log.push(\'c\')" hx-on:focus="window._log.push(\'f\')">b</button></div>');
            await htmx.ajax('GET', '/test', {target: '#wrap', swap: 'innerMorph'});
            const b = document.getElementById('b');
            b.dispatchEvent(new Event('focus'));
            b.click();
            assert.deepEqual(window._log, ['f', 'c'], 'both handlers should fire exactly once');
            delete window._log;
        });

        it('picks up hx-trigger value change across innerMorph', async function() {
            mockResponse('GET', '/x', '<span/>');
            mockResponse('GET', '/test', '<button id="b" hx-get="/x" hx-trigger="keyup">b</button>');
            createProcessedHTML('<div id="wrap"><button id="b" hx-get="/x" hx-trigger="click">b</button></div>');

            await htmx.ajax('GET', '/test', {target: '#wrap', swap: 'innerMorph'});

            const b = document.getElementById('b');
            let fired = 0;
            b.addEventListener('htmx:before:request', () => fired++);

            b.click();
            await new Promise(r => setTimeout(r, 20));
            assert.equal(fired, 0, 'click should no longer fire after morph');
            b.dispatchEvent(new KeyboardEvent('keyup'));
            await waitForEvent('htmx:after:request', 100);
            assert.equal(fired, 1, 'keyup should fire after morph');
        });

    });

    describe('htmx integration', function() {
        it('preserves data-htmx-powered attribute during innerMorph', async function() {
            mockResponse('GET', '/test', '<button id="btn" hx-get="/click">Updated</button>');
            const div = createProcessedHTML('<div id="target"><button id="btn" hx-get="/click">Original</button></div>');
            const btn = div.querySelector('#btn');
            htmx.process(btn);
            
            assert.equal(btn.getAttribute('data-htmx-powered'), 'true');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(btn.getAttribute('data-htmx-powered'), 'true', 'data-htmx-powered should be preserved');
            assert.equal(btn.textContent, 'Updated');
        });

        it('preserves data-htmx-powered attribute during outerMorph', async function() {
            mockResponse('GET', '/test', '<button id="btn" hx-get="/click" class="new">Updated</button>');
            const container = createProcessedHTML('<div><button id="btn" hx-get="/click">Original</button></div>');
            const btn = container.querySelector('#btn');
            htmx.process(btn);
            
            assert.equal(btn.getAttribute('data-htmx-powered'), 'true');
            
            await htmx.ajax('GET', '/test', {target: '#btn', swap: 'outerMorph'});
            
            const newBtn = container.querySelector('#btn');
            assert.equal(newBtn, btn, 'Button should be same element');
            assert.equal(newBtn.getAttribute('data-htmx-powered'), 'true', 'data-htmx-powered should be preserved');
            assert.equal(newBtn.className, 'new');
        });

        it('preserves htmx event listeners during morph', async function() {
            mockResponse('GET', '/click', 'Clicked!');
            mockResponse('GET', '/test', '<button id="btn" hx-get="/click" hx-target="#result">Updated</button><div id="result"></div>');
            const div = createProcessedHTML('<div id="target"><button id="btn" hx-get="/click" hx-target="#result">Original</button><div id="result"></div></div>');
            const btn = div.querySelector('#btn');
            const result = div.querySelector('#result');
            htmx.process(btn);
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            btn.click();
            await waitForEvent('htmx:after:swap', 100);
            
            assert.equal(result.textContent, 'Clicked!', 'htmx functionality should still work');
        });
    });

    describe('text node handling', function() {
        it('removes text nodes during morph without error', async function() {
            mockResponse('GET', '/test', '<div id="child">content</div>');
            const div = createProcessedHTML('<div id="target">text node<div id="child">old</div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.isNotNull(div.querySelector('#child'));
            assert.equal(div.querySelector('#child').textContent, 'content');
        });

        it('handles mixed text nodes and elements', async function() {
            mockResponse('GET', '/test', '<span>new</span>');
            const div = createProcessedHTML('<div id="target">text1<span>old</span>text2</div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.isNotNull(div.querySelector('span'));
            assert.equal(div.querySelector('span').textContent, 'new');
        });

        it('replaces text nodes with elements', async function() {
            mockResponse('GET', '/test', '<div id="new">element</div>');
            const div = createProcessedHTML('<div id="target">just text</div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.isNotNull(div.querySelector('#new'));
            assert.equal(div.querySelector('#new').textContent, 'element');
        });
    });

    describe('morphPreserve config', function() {
        afterEach(function() {
            htmx.config.morphPreserve = null;
            htmx.config.morphPreserveChildrenOf = null;
            htmx.config.morphPreserveAttributes = null;
        });

        describe('morphPreserve (element scope)', function() {
            it('freezes matching elements deep (attrs and children untouched)', async function() {
                htmx.config.morphPreserve = '.frozen';
                mockResponse('GET', '/test', '<div class="frozen" data-value="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div class="frozen" data-value="old"><span>old</span></div></div>');
                const frozen = div.querySelector('.frozen');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(frozen.getAttribute('data-value'), 'old');
                assert.equal(frozen.querySelector('span').textContent, 'old');
            });

            it('comma-joined selectors all match (native CSS)', async function() {
                htmx.config.morphPreserve = '.a, .b';
                mockResponse('GET', '/test', '<div class="a" data-v="new">a</div><div class="b" data-v="new">b</div><div class="c" data-v="new">c</div>');
                const div = createProcessedHTML('<div id="target"><div class="a" data-v="old">a</div><div class="b" data-v="old">b</div><div class="c" data-v="old">c</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('.a').getAttribute('data-v'), 'old');
                assert.equal(div.querySelector('.b').getAttribute('data-v'), 'old');
                assert.equal(div.querySelector('.c').getAttribute('data-v'), 'new');
            });
        });

        describe('morphPreserveChildrenOf (children scope)', function() {
            it('preserves children, attrs still morph', async function() {
                htmx.config.morphPreserveChildrenOf = 'lit-component';
                mockResponse('GET', '/test', '<lit-component id="lc" value="new"><div class="internal">new</div></lit-component>');
                const div = createProcessedHTML('<div id="target"><lit-component id="lc" value="old"><div class="internal">old</div></lit-component></div>');
                const lc = div.querySelector('lit-component');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(lc.getAttribute('value'), 'new', 'attrs update');
                assert.equal(lc.querySelector('.internal').textContent, 'old', 'children preserved');
            });

            it('allows normal morphing for non-matching elements', async function() {
                htmx.config.morphPreserveChildrenOf = '.skip-children';
                mockResponse('GET', '/test', '<div class="normal" data-v="new"><span>new</span></div><div class="skip-children" data-v="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div class="normal" data-v="old"><span>old</span></div><div class="skip-children" data-v="old"><span>old</span></div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('.normal span').textContent, 'new', 'normal morphs children');
                assert.equal(div.querySelector('.skip-children span').textContent, 'old', 'preserved children stay');
            });
        });

        describe('morphPreserveAttributes (attrs scope)', function() {
            it('exact name match (no wildcard)', async function() {
                htmx.config.morphPreserveAttributes = ['data-keep'];
                mockResponse('GET', '/test', '<div id="child" data-keep="new" data-keep-extra="new" data-other="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-keep="old" data-keep-extra="old" data-other="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-keep'), 'old', 'exact match preserved');
                assert.equal(child.getAttribute('data-keep-extra'), 'new', 'no longer matched');
                assert.equal(child.getAttribute('data-other'), 'new');
            });

            it('star wildcard matches by prefix', async function() {
                htmx.config.morphPreserveAttributes = ['data-keep*'];
                mockResponse('GET', '/test', '<div id="child" data-keep="new" data-keep-extra="new" data-other="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-keep="old" data-keep-extra="old" data-other="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-keep'), 'old');
                assert.equal(child.getAttribute('data-keep-extra'), 'old');
                assert.equal(child.getAttribute('data-other'), 'new');
            });

            it('star wildcard matches by suffix', async function() {
                htmx.config.morphPreserveAttributes = ['*-id'];
                mockResponse('GET', '/test', '<div id="child" user-id="new" post-id="new" data-foo="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" user-id="old" post-id="old" data-foo="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('user-id'), 'old');
                assert.equal(child.getAttribute('post-id'), 'old');
                assert.equal(child.getAttribute('data-foo'), 'new');
            });

            it('star wildcard in the middle of a pattern', async function() {
                htmx.config.morphPreserveAttributes = ['data-*-foo'];
                mockResponse('GET', '/test', '<div id="child" data-x-foo="new" data-y-foo="new" data-x-bar="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-x-foo="old" data-y-foo="old" data-x-bar="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-x-foo'), 'old');
                assert.equal(child.getAttribute('data-y-foo'), 'old');
                assert.equal(child.getAttribute('data-x-bar'), 'new');
            });

            it('alternation pattern (a|b)', async function() {
                htmx.config.morphPreserveAttributes = ['aria-(label|hidden)'];
                mockResponse('GET', '/test', '<div id="child" aria-label="new" aria-hidden="new" aria-describedby="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" aria-label="old" aria-hidden="old" aria-describedby="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('aria-label'), 'old');
                assert.equal(child.getAttribute('aria-hidden'), 'old');
                assert.equal(child.getAttribute('aria-describedby'), 'new');
            });

            it('regex special chars in pattern are escaped (treated literally)', async function() {
                htmx.config.morphPreserveAttributes = ['data.x'];
                mockResponse('GET', '/test', '<div id="child" data.x="new" data-x="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data.x="old" data-x="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data.x'), 'old', 'literal dot match preserved');
                assert.equal(child.getAttribute('data-x'), 'new', 'dot not treated as regex any-char');
            });

            it('regex literal as a pattern', async function() {
                htmx.config.morphPreserveAttributes = [/^x-[0-9]+$/];
                mockResponse('GET', '/test', '<div id="child" x-1="new" x-99="new" x-foo="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" x-1="old" x-99="old" x-foo="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('x-1'), 'old');
                assert.equal(child.getAttribute('x-99'), 'old');
                assert.equal(child.getAttribute('x-foo'), 'new');
            });

            it('does not remove a preserved attr absent from source', async function() {
                htmx.config.morphPreserveAttributes = ['data-keep'];
                mockResponse('GET', '/test', '<div id="child">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-keep="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-keep'), 'old');
            });

            it('comma-delimited string is split into patterns (HCON ergonomics)', async function() {
                htmx.config.morphPreserveAttributes = 'data-keep, data-other*, aria-(label|hidden)';
                mockResponse('GET', '/test', '<div id="child" data-keep="new" data-other-foo="new" aria-label="new" aria-describedby="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-keep="old" data-other-foo="old" aria-label="old" aria-describedby="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-keep'), 'old');
                assert.equal(child.getAttribute('data-other-foo'), 'old');
                assert.equal(child.getAttribute('aria-label'), 'old');
                assert.equal(child.getAttribute('aria-describedby'), 'new');
            });

            it('whitespace-only delimiter also works in the string form', async function() {
                htmx.config.morphPreserveAttributes = 'data-keep aria-label';
                mockResponse('GET', '/test', '<div id="child" data-keep="new" aria-label="new" data-other="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-keep="old" aria-label="old" data-other="old">x</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-keep'), 'old');
                assert.equal(child.getAttribute('aria-label'), 'old');
                assert.equal(child.getAttribute('data-other'), 'new');
            });
        });

        describe('data-htmx-powered preservation', function() {
            it('preserved by default with no user config', async function() {
                mockResponse('GET', '/test', '<div id="child">new</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-htmx-powered="true">old</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-htmx-powered'), 'true');
            });

            it('preserved even when user sets an unrelated morphPreserveAttributes', async function() {
                htmx.config.morphPreserveAttributes = ['data-keep'];
                mockResponse('GET', '/test', '<div id="child">new</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-htmx-powered="true">old</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-htmx-powered'), 'true');
            });

            it('preserved even when user sets an empty list', async function() {
                htmx.config.morphPreserveAttributes = [];
                mockResponse('GET', '/test', '<div id="child">new</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-htmx-powered="true">old</div></div>');
                const child = div.querySelector('#child');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(child.getAttribute('data-htmx-powered'), 'true');
            });
        });

        describe('combinations and edge cases', function() {
            it('all three scopes set together', async function() {
                htmx.config.morphPreserve            = '.frozen';
                htmx.config.morphPreserveChildrenOf    = '.shallow';
                htmx.config.morphPreserveAttributes  = ['data-keep'];

                mockResponse('GET', '/test',
                    '<div class="frozen" data-value="new">f-new</div>' +
                    '<div class="shallow" data-value="new"><span>new</span></div>' +
                    '<div id="normal" data-keep="new" data-other="new">n-new</div>');
                const div = createProcessedHTML('<div id="target">' +
                    '<div class="frozen" data-value="old">f-old</div>' +
                    '<div class="shallow" data-value="old"><span>old</span></div>' +
                    '<div id="normal" data-keep="old" data-other="old">n-old</div>' +
                    '</div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('.frozen').getAttribute('data-value'), 'old');
                assert.equal(div.querySelector('.shallow').getAttribute('data-value'), 'new');
                assert.equal(div.querySelector('.shallow span').textContent, 'old');
                assert.equal(div.querySelector('#normal').getAttribute('data-keep'), 'old');
                assert.equal(div.querySelector('#normal').getAttribute('data-other'), 'new');
            });

            it('children preservation uses pre-morph state when selector depends on attrs that morph changes', async function() {
                // Selector matches via data-component, which morph would strip from old. Check must run pre-morph.
                htmx.config.morphPreserveChildrenOf = '[data-component]';
                mockResponse('GET', '/test', '<div id="x" value="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div id="x" data-component value="old"><span>old</span></div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                const element = div.querySelector('#x');
                assert.equal(element.getAttribute('value'), 'new', 'attrs morphed');
                assert.isNull(element.getAttribute('data-component'), 'data-component removed by morph');
                assert.equal(element.querySelector('span').textContent, 'old', 'children preserved using pre-morph match');
            });

            it('null config behaves as if no rules were set', async function() {
                htmx.config.morphPreserve            = null;
                htmx.config.morphPreserveChildrenOf    = null;
                htmx.config.morphPreserveAttributes  = null;

                mockResponse('GET', '/test', '<div class="x" data-v="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div class="x" data-v="old"><span>old</span></div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('.x').getAttribute('data-v'), 'new');
                assert.equal(div.querySelector('span').textContent, 'new');
            });
        });

        describe('bare hx-preserve in morph', function() {
            it('preserves element fully when old has hx-preserve and response does not', async function() {
                // Response lacks hx-preserve (server doesn't know about it). Old has it.
                // Without our __morphNode check, the pantry mechanism wouldn't fire and morph would change attrs/children.
                mockResponse('GET', '/test', '<div id="x" data-v="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div id="x" hx-preserve data-v="old"><span>old</span></div></div>');
                const preserved = div.querySelector('#x');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(preserved.getAttribute('data-v'), 'old', 'attrs not changed');
                assert.equal(preserved.querySelector('span').textContent, 'old', 'children not changed');
            });

            it('works without an id (morph does not require pantry)', async function() {
                mockResponse('GET', '/test', '<div class="x" data-v="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div class="x" hx-preserve data-v="old"><span>old</span></div></div>');
                const preserved = div.querySelector('.x');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(preserved.getAttribute('data-v'), 'old');
                assert.equal(preserved.querySelector('span').textContent, 'old');
            });

            it('preserves other elements normally when only some have hx-preserve', async function() {
                mockResponse('GET', '/test', '<div id="a" data-v="new">a</div><div id="b" data-v="new">b</div>');
                const div = createProcessedHTML('<div id="target"><div id="a" hx-preserve data-v="old">a</div><div id="b" data-v="old">b</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('#a').getAttribute('data-v'), 'old', 'a preserved');
                assert.equal(div.querySelector('#b').getAttribute('data-v'), 'new', 'b morphed normally');
            });

            it('hx-preserve="true" also preserves (any value triggers preservation)', async function() {
                mockResponse('GET', '/test', '<div id="x" data-v="new">new</div>');
                const div = createProcessedHTML('<div id="target"><div id="x" hx-preserve="true" data-v="old">old</div></div>');
                const preserved = div.querySelector('#x');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(preserved.getAttribute('data-v'), 'old');
                assert.equal(preserved.textContent, 'old');
            });

            it('takes precedence over hx-preserve:children (full freeze, not just children)', async function() {
                mockResponse('GET', '/test', '<div id="x" data-v="new"><span>new</span></div>');
                const div = createProcessedHTML('<div id="target"><div id="x" hx-preserve hx-preserve:children data-v="old"><span>old</span></div></div>');
                const preserved = div.querySelector('#x');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(preserved.getAttribute('data-v'), 'old', 'attrs preserved (not just children)');
                assert.equal(preserved.querySelector('span').textContent, 'old');
            });
        });

        describe('hx-preserve modifiers (per-element)', function() {
            it('hx-preserve:children preserves the children list', async function() {
                mockResponse('GET', '/test', '<lit-component value="new"><div class="internal">new</div></lit-component>');
                const div = createProcessedHTML('<div id="target"><lit-component value="old" hx-preserve:children><div class="internal">old</div></lit-component></div>');
                const lc = div.querySelector('lit-component');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(lc.getAttribute('value'), 'new', 'attrs still morph');
                assert.equal(lc.querySelector('.internal').textContent, 'old', 'children preserved');
            });

            it('hx-preserve:attributes preserves named attrs on this element only', async function() {
                mockResponse('GET', '/test', '<div id="a" state="new" data-x="new">x</div><div id="b" state="new" data-x="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="a" state="old" data-x="old" hx-preserve:attributes="state">x</div><div id="b" state="old" data-x="old">x</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('#a').getAttribute('state'), 'old', 'preserved on this element');
                assert.equal(div.querySelector('#a').getAttribute('data-x'), 'new', 'other attrs morph');
                assert.equal(div.querySelector('#b').getAttribute('state'), 'new', 'no attr → no preservation');
            });

            it('hx-preserve:attributes accepts comma or whitespace separators', async function() {
                mockResponse('GET', '/test', '<div id="child" state="new" value="new" data-x="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" state="old" value="old" data-x="old" hx-preserve:attributes="state, value">x</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('#child').getAttribute('state'), 'old');
                assert.equal(div.querySelector('#child').getAttribute('value'), 'old');
                assert.equal(div.querySelector('#child').getAttribute('data-x'), 'new');
            });

            it('hx-preserve:attributes supports glob patterns (shares the engine)', async function() {
                mockResponse('GET', '/test', '<div id="child" data-a="new" data-b="new" other="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-a="old" data-b="old" other="old" hx-preserve:attributes="data-*">x</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('#child').getAttribute('data-a'), 'old');
                assert.equal(div.querySelector('#child').getAttribute('data-b'), 'old');
                assert.equal(div.querySelector('#child').getAttribute('other'), 'new');
            });

            it('per-element attrs compose with global morphPreserveAttributes', async function() {
                htmx.config.morphPreserveAttributes = ['global-attr'];
                mockResponse('GET', '/test', '<div id="child" global-attr="new" state="new" other="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" global-attr="old" state="old" other="old" hx-preserve:attributes="state">x</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('#child').getAttribute('global-attr'), 'old', 'global rule applies');
                assert.equal(div.querySelector('#child').getAttribute('state'), 'old', 'per-element rule applies');
                assert.equal(div.querySelector('#child').getAttribute('other'), 'new');
            });

            it('honors the configured prefix (data-hx-preserve:children works)', async function() {
                mockResponse('GET', '/test', '<lit-component value="new"><div class="internal">new</div></lit-component>');
                const div = createProcessedHTML('<div id="target"><lit-component value="old" data-hx-preserve:children><div class="internal">old</div></lit-component></div>');
                const lc = div.querySelector('lit-component');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(lc.getAttribute('value'), 'new', 'attrs still morph');
                assert.equal(lc.querySelector('.internal').textContent, 'old', 'children preserved via prefixed attribute');
            });

            it('honors the configured prefix (data-hx-preserve:attributes works)', async function() {
                mockResponse('GET', '/test', '<div id="child" data-a="new" data-b="new" other="new">x</div>');
                const div = createProcessedHTML('<div id="target"><div id="child" data-a="old" data-b="old" other="old" data-hx-preserve:attributes="data-*">x</div></div>');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(div.querySelector('#child').getAttribute('data-a'), 'old', 'data-a preserved via prefixed attribute');
                assert.equal(div.querySelector('#child').getAttribute('data-b'), 'old', 'data-b preserved via prefixed attribute');
                assert.equal(div.querySelector('#child').getAttribute('other'), 'new', 'unmatched attr morphs');
            });

            it('honors a custom config.prefix for hx-preserve:children', async function() {
                const originalPrefix = htmx.config.prefix;
                htmx.config.prefix = 'x-';
                try {
                    mockResponse('GET', '/test', '<lit-component value="new"><div class="internal">new</div></lit-component>');
                    const div = createProcessedHTML('<div id="target"><lit-component value="old" x-preserve:children><div class="internal">old</div></lit-component></div>');
                    const lc = div.querySelector('lit-component');

                    await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                    assert.equal(lc.getAttribute('value'), 'new', 'attrs still morph');
                    assert.equal(lc.querySelector('.internal').textContent, 'old', 'children preserved via custom-prefix attribute');
                } finally {
                    htmx.config.prefix = originalPrefix;
                }
            });

            it('honors a custom config.prefix for hx-preserve:attributes with patterns', async function() {
                const originalPrefix = htmx.config.prefix;
                htmx.config.prefix = 'x-';
                try {
                    mockResponse('GET', '/test', '<div id="child" data-a="new" data-b="new" other="new">x</div>');
                    const div = createProcessedHTML('<div id="target"><div id="child" data-a="old" data-b="old" other="old" x-preserve:attributes="data-*">x</div></div>');

                    await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                    assert.equal(div.querySelector('#child').getAttribute('data-a'), 'old', 'data-a preserved via custom-prefix attribute');
                    assert.equal(div.querySelector('#child').getAttribute('data-b'), 'old', 'data-b preserved via custom-prefix attribute');
                    assert.equal(div.querySelector('#child').getAttribute('other'), 'new', 'unmatched attr morphs');
                } finally {
                    htmx.config.prefix = originalPrefix;
                }
            });

            it('hx-preserve:children and hx-preserve:attributes compose on same element', async function() {
                mockResponse('GET', '/test', '<lit-component state="new" value="new"><div class="internal">new</div></lit-component>');
                const div = createProcessedHTML('<div id="target"><lit-component state="old" value="old" hx-preserve:children hx-preserve:attributes="state"><div class="internal">old</div></lit-component></div>');
                const lc = div.querySelector('lit-component');

                await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});

                assert.equal(lc.getAttribute('state'), 'old', 'attr preserved');
                assert.equal(lc.getAttribute('value'), 'new', 'other attr morphs');
                assert.equal(lc.querySelector('.internal').textContent, 'old', 'children preserved');
            });
        });
    });

});