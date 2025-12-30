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
            await htmx.forEvent('htmx:after:swap', 100);
            
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
            await htmx.forEvent('htmx:after:swap', 100);
            
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

        it('processes new htmx attributes on inserted elements during outerMorph', async function() {
            mockResponse('GET', '/test', '<div id="target"><button id="existing">Existing</button><button id="new" hx-get="/new">New Button</button></div>');
            const container = createProcessedHTML('<div><div id="target"><button id="existing">Existing</button></div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'outerMorph'});
            
            const newBtn = container.querySelector('#new');
            assert.isNotNull(newBtn);
            assert.equal(newBtn.getAttribute('data-htmx-powered'), 'true', 'New inserted element should be processed');
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
            await htmx.forEvent('htmx:after:swap', 100);
            
            assert.equal(result.textContent, 'Clicked!', 'htmx functionality should still work');
        });
    });

    describe('morphSkip config', function() {
        afterEach(function() {
            htmx.config.morphSkip = null;
        });

        it('skips morphing elements matching selector', async function() {
            htmx.config.morphSkip = '.no-morph';
            mockResponse('GET', '/test', '<div class="no-morph" data-value="new">new content</div>');
            const div = createProcessedHTML('<div id="target"><div class="no-morph" data-value="old">old content</div></div>');
            const noMorph = div.querySelector('.no-morph');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(noMorph.getAttribute('data-value'), 'old', 'Attributes should not be updated');
            assert.equal(noMorph.textContent, 'old content', 'Content should not be updated');
        });

        it('skips morphing custom elements', async function() {
            htmx.config.morphSkip = 'custom-element';
            mockResponse('GET', '/test', '<custom-element id="ce" data-value="new"><span>new</span></custom-element>');
            const div = createProcessedHTML('<div id="target"><custom-element id="ce" data-value="old"><span>old</span></custom-element></div>');
            const ce = div.querySelector('custom-element');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(ce.getAttribute('data-value'), 'old');
            assert.equal(ce.querySelector('span').textContent, 'old');
        });

        it('morphs other elements when some are skipped', async function() {
            htmx.config.morphSkip = '.skip';
            mockResponse('GET', '/test', '<div class="skip" data-value="new">skip</div><div class="morph" data-value="new">morph</div>');
            const div = createProcessedHTML('<div id="target"><div class="skip" data-value="old">skip</div><div class="morph" data-value="old">morph</div></div>');
            const skip = div.querySelector('.skip');
            const morph = div.querySelector('.morph');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(skip.getAttribute('data-value'), 'old');
            assert.equal(morph.getAttribute('data-value'), 'new');
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

    describe('morphSkipChildren config', function() {
        afterEach(function() {
            htmx.config.morphSkipChildren = null;
        });

        it('updates attributes but skips children morphing', async function() {
            htmx.config.morphSkipChildren = '.skip-children';
            mockResponse('GET', '/test', '<div class="skip-children" data-value="new"><span>new child</span></div>');
            const div = createProcessedHTML('<div id="target"><div class="skip-children" data-value="old"><span>old child</span></div></div>');
            const skipChildren = div.querySelector('.skip-children');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(skipChildren.getAttribute('data-value'), 'new', 'Attributes should be updated');
            assert.equal(skipChildren.querySelector('span').textContent, 'old child', 'Children should not be morphed');
        });

        it('preserves Light DOM children in custom elements', async function() {
            htmx.config.morphSkipChildren = 'lit-component';
            mockResponse('GET', '/test', '<lit-component id="lc" value="new"><div class="internal">new</div></lit-component>');
            const div = createProcessedHTML('<div id="target"><lit-component id="lc" value="old"><div class="internal">old</div></lit-component></div>');
            const lc = div.querySelector('lit-component');
            const internal = lc.querySelector('.internal');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(lc.getAttribute('value'), 'new', 'Attributes should update');
            assert.equal(internal.textContent, 'old', 'Light DOM children should be preserved');
        });

        it('works with multiple selectors', async function() {
            htmx.config.morphSkipChildren = '.skip1, .skip2';
            mockResponse('GET', '/test', '<div class="skip1" data-value="new"><span>new1</span></div><div class="skip2" data-value="new"><span>new2</span></div>');
            const div = createProcessedHTML('<div id="target"><div class="skip1" data-value="old"><span>old1</span></div><div class="skip2" data-value="old"><span>old2</span></div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('.skip1').getAttribute('data-value'), 'new');
            assert.equal(div.querySelector('.skip1 span').textContent, 'old1');
            assert.equal(div.querySelector('.skip2').getAttribute('data-value'), 'new');
            assert.equal(div.querySelector('.skip2 span').textContent, 'old2');
        });

        it('allows normal morphing for non-matching elements', async function() {
            htmx.config.morphSkipChildren = '.skip-children';
            mockResponse('GET', '/test', '<div class="normal" data-value="new"><span>new</span></div><div class="skip-children" data-value="new"><span>new</span></div>');
            const div = createProcessedHTML('<div id="target"><div class="normal" data-value="old"><span>old</span></div><div class="skip-children" data-value="old"><span>old</span></div></div>');
            
            await htmx.ajax('GET', '/test', {target: '#target', swap: 'innerMorph'});
            
            assert.equal(div.querySelector('.normal span').textContent, 'new', 'Normal elements should morph children');
            assert.equal(div.querySelector('.skip-children span').textContent, 'old', 'Skip elements should preserve children');
        });
    });
    
});