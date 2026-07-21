describe('swap() unit tests', function() {

    // TODO move to __parseSwapSpec unit test
    it('prepend normalizes to afterbegin', function () {
        assert.equal(htmx.__parseSwapSpec('prepend').style, 'afterbegin')
    })

    it('append normalizes to beforeend', function () {
        assert.equal(htmx.__parseSwapSpec('append').style, 'beforeend')
    })

    it('before normalizes to beforebegin', function () {
        assert.equal(htmx.__parseSwapSpec('before').style, 'beforebegin')
    })

    it('after normalizes to afterend', function () {
        assert.equal(htmx.__parseSwapSpec('after').style, 'afterend')
    })

    it('new terminology works with modifiers', function () {
        assert.equal(htmx.__parseSwapSpec('prepend swap:10').style, 'afterbegin')
        assert.equal(htmx.__parseSwapSpec('prepend swap:10').swapDelay, "10")
        assert.equal(htmx.__parseSwapSpec('append swap:20').style, 'beforeend')
        assert.equal(htmx.__parseSwapSpec('append swap:20').swapDelay, "20")
    })
    // end TODO move to __parseSwapSpec unit test

    it('swaps in plain content properly', async function () {
        await htmx.swap("Hello Swap", "#test-playground")
        playground().innerText.should.equal("Hello Swap")
    })

    it('swaps in html content properly', async function () {
        await htmx.swap("<a>Hello Swap</a>", "#test-playground")
        let child = playground().children[0];
        child.tagName.should.equal("A");
        child.innerText.should.equal("Hello Swap")
    })

    // The third argument accepts the same serialized form as hx-swap.
    it('accepts a serialized swap specification', async function () {
        createProcessedHTML('<div id="target">Old</div>')
        let finalSwap
        find('#target').addEventListener('htmx:before:swap', event => finalSwap = event.detail.ctx.swap)

        await htmx.swap('New', '#target', 'innerHTML transition:true')

        assert.equal(finalSwap.style, 'innerHTML')
        assert.isTrue(finalSwap.transition)
    })

    // Nested swap input composes with source and flat canonical overrides.
    it('composes swap input with options', async function () {
        createProcessedHTML('<button id="source">Source</button><div id="target">Old</div>')
        let finalSwap, eventSource
        find('#source').addEventListener('htmx:before:swap', event => {
            finalSwap = event.detail.ctx.swap
            eventSource = event.target
        })

        await htmx.swap('New', '#target', {
            swap: 'outerHTML transition:true',
            style: 'innerHTML',
            transition: false,
            source: '#source'
        })

        assert.equal(finalSwap.style, 'innerHTML')
        assert.isFalse(finalSwap.transition)
        assert.equal(eventSource, find('#source'))
        assert.equal(find('#target').innerText, 'New')
    })

    // Nested structured swap input normalizes through the same options boundary.
    it('accepts nested structured swap fields', async function () {
        createProcessedHTML('<div id="target">Old</div>')
        let finalSwap
        find('#target').addEventListener('htmx:before:swap', event => finalSwap = event.detail.ctx.swap)

        await htmx.swap('New', '#target', {
            swap: {
                style: 'innerHTML',
                transition: false
            }
        })

        assert.equal(finalSwap.style, 'innerHTML')
        assert.isFalse(finalSwap.transition)
    })

    // Positional content and target cannot be replaced by options.
    it('uses positional content and target', async function () {
        createProcessedHTML('<div id="target">Old</div><div id="other">Other</div>')

        await htmx.swap('New', '#target', {
            content: 'Wrong',
            target: '#other'
        })

        assert.equal(find('#target').innerText, 'New')
        assert.equal(find('#other').innerText, 'Other')
    })

    it('uses the resolved target as the default source', async function () {
        let target = createProcessedHTML('<div>Old</div>')
        let source, bubbledSource
        target.addEventListener('htmx:after:swap', e => source = e.target)
        document.addEventListener('htmx:after:swap', e => bubbledSource = e.target, {once: true})

        await htmx.swap('New', target)

        assert.equal(source, target)
        assert.equal(bubbledSource, target)
    })

    it('accepts an explicit source selector', async function () {
        createProcessedHTML('<button id="source">Source</button><div id="target">Old</div>')
        let eventSource
        find('#source').addEventListener('htmx:after:swap', e => eventSource = e.target)

        await htmx.swap('New', '#target', {source: '#source'})

        assert.equal(eventSource, find('#source'))
        assert.equal(find('#target').innerText, 'New')
    })

    it('rejects an unmatched source selector', async function () {
        try {
            await htmx.swap('New', '#test-playground', {source: '#missing'})
            assert.fail('Should have rejected')
        } catch (e) {
            assert.include(e.message, 'Source not found')
        }
    })

    it('dispatches after swap from document when outerHTML detaches the source', async function () {
        createProcessedHTML('<div id="target">Old</div>')
        let eventSource
        document.addEventListener('htmx:after:swap', e => eventSource = e.target, {once: true})

        await htmx.swap('<div id="target">New</div>', '#target', {style: 'outerHTML'})

        assert.equal(eventSource, document)
    })

    it('does not inherit boosted history behavior', async function () {
        createProcessedHTML('<a id="source" href="/next" hx-boost="true">Source</a><div id="target">Old</div>')
        await htmx.swap('New', find('#target'), {source: find('#source'), style: "innerHTML"})
        assert.equal(find('#target').innerText, 'New')
    })

    it('initializes htmx content properly', async function () {
        await htmx.swap("<a hx-get='/foo'>Hello Swap</a>", "#test-playground")
        let child = playground().children[0];
        child.tagName.should.equal("A");
        child.innerText.should.equal("Hello Swap")
        assert.isNotNull(child._htmx);
    })

    it('swaps in plain content properly w/outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("Hello Swap", "#d1", {style: "outerHTML"})
        playground().innerText.should.equal("Hello Swap")
    })

    it('swaps in html content properly w/outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<span>Hello Swap</span>", "#d1", {style: "outerHTML"})
        let child = playground().children[0];
        child.tagName.should.equal("SPAN");
        child.innerText.should.equal("Hello Swap")
    })

    it('replaces target element w/outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div>")
        let original = find('#d1');
        await htmx.swap("<span id='d1'>Replaced</span>", "#d1", {style: "outerHTML"})
        let replaced = find('#d1');
        replaced.should.not.equal(original);
        replaced.tagName.should.equal("SPAN");
    })

    it('inserts before target w/beforebegin', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap("<span>Before</span>", "#d1", {style: "beforebegin"})
        let children = playground().children;
        children[0].tagName.should.equal("SPAN");
        children[0].innerText.should.equal("Before");
        children[1].innerText.should.equal("Target");
    })

    it('inserts plain text before target w/beforebegin', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap("Before", "#d1", {style: "beforebegin"})
        playground().childNodes[0].textContent.should.equal("Before");
        find('#d1').innerText.should.equal("Target");
    })

    it('prepends content inside target w/afterbegin', async function () {
        createProcessedHTML("<div id='d1'><span>Existing</span></div>")
        await htmx.swap("<span>First</span>", "#d1", {style: "afterbegin"})
        let children = find('#d1').children;
        children[0].innerText.should.equal("First");
        children[1].innerText.should.equal("Existing");
    })

    it('prepends plain text inside target w/afterbegin', async function () {
        createProcessedHTML("<div id='d1'>Existing</div>")
        await htmx.swap("First", "#d1", {style: "afterbegin"})
        find('#d1').childNodes[0].textContent.should.equal("First");
    })

    it('appends content inside target w/beforeend', async function () {
        createProcessedHTML("<div id='d1'><span>Existing</span></div>")
        await htmx.swap("<span>Last</span>", "#d1", {style: "beforeend"})
        let children = find('#d1').children;
        children[0].innerText.should.equal("Existing");
        children[1].innerText.should.equal("Last");
    })

    it('appends plain text inside target w/beforeend', async function () {
        createProcessedHTML("<div id='d1'>Existing</div>")
        await htmx.swap("Last", "#d1", {style: "beforeend"})
        let target = find('#d1');
        target.childNodes[target.childNodes.length - 1].textContent.should.equal("Last");
    })

    it('inserts after target w/afterend', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap("<span>After</span>", "#d1", {style: "afterend"})
        let children = playground().children;
        children[0].innerText.should.equal("Target");
        children[1].tagName.should.equal("SPAN");
        children[1].innerText.should.equal("After");
    })

    it('inserts plain text after target w/afterend', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap("After", "#d1", {style: "afterend"})
        find('#d1').innerText.should.equal("Target");
        playground().childNodes[1].textContent.should.equal("After");
    })

    it('executes script w/innerHTML', async function () {
        window.testVar = 0;
        await htmx.swap("<script>window.testVar = 1</script>", "#test-playground")
        window.testVar.should.equal(1);
        delete window.testVar;
    })

    it('executes script w/outerHTML', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<div><script>window.testVar = 2</script></div>", "#d1", {style: "outerHTML"})
        window.testVar.should.equal(2);
        delete window.testVar;
    })

    it('executes script w/beforebegin', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<script>window.testVar = 3</script>", "#d1", {style: "beforebegin"})
        window.testVar.should.equal(3);
        delete window.testVar;
    })

    it('executes script w/afterbegin', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<script>window.testVar = 4</script>", "#d1", {style: "afterbegin"})
        window.testVar.should.equal(4);
        delete window.testVar;
    })

    it('executes script w/beforeend', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<script>window.testVar = 5</script>", "#d1", {style: "beforeend"})
        window.testVar.should.equal(5);
        delete window.testVar;
    })

    it('executes script w/afterend', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<script>window.testVar = 6</script>", "#d1", {style: "afterend"})
        window.testVar.should.equal(6);
        delete window.testVar;
    })

    it('swaps oob content', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap("<div>Main</div><div id='d2' hx-swap-oob='true'>OOB</div>", "#d1")
        find('#d1').innerText.trim().should.equal("Main");
        find('#d2').innerText.should.equal("OOB");
    })

    it('swaps oob with outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap("<div>Main</div><div id='d2' hx-swap-oob='outerHTML'>OOB</div>", "#d1")
        find('#d2').innerText.should.equal("OOB");
    })

    it('swaps oob with innerHTML', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'><span>Old</span></div>")
        await htmx.swap("<div>Main</div><div id='d2' hx-swap-oob='innerHTML'>OOB</div>", "#d1")
        find('#d2').innerText.should.equal("OOB");
        find('#d2').tagName.should.equal("DIV");
    })

    it('swaps partial with default target', async function () {
        await htmx.swap("<hx-partial hx-target='#test-playground'>Partial</hx-partial>", "#test-playground")
        playground().innerText.should.equal("Partial");
    })

    it('swaps partial with custom target', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap("<hx-partial hx-target='#d2'>Partial</hx-partial>", "#d1")
        find('#d2').innerText.should.equal("Partial");
    })

    it('swaps partial with custom swap style', async function () {
        createProcessedHTML("<div id='d1'>Existing</div>")
        await htmx.swap("<hx-partial hx-target='#d1' hx-swap='beforeend'>Partial</hx-partial>", "#test-playground")
        find('#d1').innerText.should.equal("ExistingPartial");
    })

    it('executes script in oob swap', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap("<div>Main</div><div id='d2' hx-swap-oob='true'><script>window.testVar = 7</script></div>", "#d1")
        window.testVar.should.equal(7);
        delete window.testVar;
    })

    it('executes script in partial', async function () {
        window.testVar = 0;
        await htmx.swap("<hx-partial hx-target='#test-playground'><script>window.testVar = 8</script></hx-partial>", "#test-playground")
        window.testVar.should.equal(8);
        delete window.testVar;
    })

    it('executes script when wrapped in html tag', async function () {
        window.testVar = 0;
        await htmx.swap("<html><body><script>window.testVar = 9</script><div>Content</div></body></html>", "#test-playground")
        window.testVar.should.equal(9);
        delete window.testVar;
    })

    it('executes script when wrapped in body tag', async function () {
        window.testVar = 0;
        await htmx.swap("<body><script>window.testVar = 10</script><div>Content</div></body>", "#test-playground")
        window.testVar.should.equal(10);
        delete window.testVar;
    })

    it('replaces attributes when swapping element with same id', async function () {
        createProcessedHTML("<div id='d1' class='old' data-value='1'></div>")
        await htmx.swap("<div id='d1' class='new' data-value='2'>Content</div>", "#d1", {style: "outerHTML"})
        let replaced = find('#d1');
        replaced.getAttribute('class').should.equal('new');
        replaced.getAttribute('data-value').should.equal('2');
    })

    it('triggers CSS transitions during swap', async function () {
        this.skip(); //fails on firefox for some reason
        createProcessedHTML("<style>#d1 { transition: opacity 100ms; }</style><div id='d1' style='opacity: 1;'>Old</div>")
        let transitioned = false;
        htmx.on('transitionstart', () => {
            transitioned = true;
        });
        await htmx.swap("<div id='d1' style='opacity: 0.5;'>New</div>", "#d1", {style: "outerHTML"})
        await htmx.timeout(50);
        transitioned.should.be.true;
    })

    it('triggers htmx:before:swap event', async function () {
        let triggered = false;
        htmx.on('htmx:before:swap', () => {
            triggered = true;
        });
        await htmx.swap("<div>Content</div>", "#test-playground")
        triggered.should.be.true;
    })

    it('triggers htmx:after:swap event', async function () {
        let triggered = false;
        htmx.on('htmx:after:swap', () => {
            triggered = true;
        });
        await htmx.swap("<div>Content</div>", "#test-playground")
        triggered.should.be.true;
    })

    it('triggers htmx:after:settle event', async function () {
        let triggered = false;
        htmx.on('htmx:after:settle', () => {
            triggered = true;
        });
        await htmx.swap("<div>Content</div>", "#test-playground")
        triggered.should.be.true;
    })

    it('bubbles settle events up from replacement element after outerHTML swap', async function () {
        createProcessedHTML("<div id='d1'>Original</div>")
        let beforeSettleTarget, afterSettleTarget;
        htmx.on('htmx:before:settle', (e) => { beforeSettleTarget = e.target; });
        htmx.on('htmx:after:settle', (e) => { afterSettleTarget = e.target; });
        await htmx.swap("<span id='replaced'>Replaced</span>", "#d1", {style: "outerHTML"})
        let replacement = find('#replaced');
        assert.isNotNull(replacement);
        beforeSettleTarget.should.equal(replacement);
        afterSettleTarget.should.equal(replacement);
        document.body.contains(beforeSettleTarget).should.be.true;
        document.body.contains(afterSettleTarget).should.be.true;
    })

    it('bubbles settle events after outerHTML swap when target has no previous sibling', async function () {
        createProcessedHTML("<div id='d1'>First</div><div id='d2'>Second</div>")
        let settleTarget;
        htmx.on('htmx:after:settle', (e) => { settleTarget = e.target; });
        await htmx.swap("<span id='new-first'>New</span>", "#d1", {style: "outerHTML"})
        let replacement = find('#new-first');
        assert.isNotNull(replacement);
        settleTarget.should.equal(replacement);
        document.body.contains(settleTarget).should.be.true;
    })

    it('bubbles settle events when outerHTML replacement content starts with a text node', async function () {
        createProcessedHTML("<div id='d1'>Original</div>")
        let settleTarget;
        htmx.on('htmx:after:settle', (e) => { settleTarget = e.target; });
        await htmx.swap("Hello <span id='replaced'>World</span>", "#d1", {style: "outerHTML"})
        playground().innerText.should.contain("Hello")
        playground().innerText.should.contain("World")
        assert.isOk(settleTarget);
        document.body.contains(settleTarget).should.be.true;
    })

    it('bubbles settle events when outerHTML target comes after a text node', async function () {
        playground().innerHTML = "Text before <div id='d1'>Original</div>";
        htmx.process(playground());
        let settleTarget;
        htmx.on('htmx:after:settle', (e) => { settleTarget = e.target; });
        await htmx.swap("<span id='replaced'>Replaced</span>", "#d1", {style: "outerHTML"})
        let replacement = find('#replaced');
        assert.isNotNull(replacement);
        settleTarget.should.equal(replacement);
        document.body.contains(settleTarget).should.be.true;
    })

    it('bubbles settle events when outerHTML swap empties the parent (empty fragment, sole child)', async function () {
        createProcessedHTML("<div id='wrapper'><div id='d1'>Original</div></div>")
        let wrapper = find('#wrapper');
        let beforeSettleTarget, afterSettleTarget;
        wrapper.addEventListener('htmx:before:settle', (e) => { beforeSettleTarget = e.target; });
        wrapper.addEventListener('htmx:after:settle', (e) => { afterSettleTarget = e.target; });
        await htmx.swap("", "#d1", {style: "outerHTML"})
        wrapper.children.length.should.equal(0);
        beforeSettleTarget.should.equal(wrapper);
        afterSettleTarget.should.equal(wrapper);
    })

    it('bubbles settle events when target follows a text node AND replacement starts with a text node', async function () {
        playground().innerHTML = "Before text <div id='d1'>Original</div>";
        htmx.process(playground());
        let settleTarget;
        htmx.on('htmx:after:settle', (e) => { settleTarget = e.target; });
        await htmx.swap("inserted text <span id='replaced'>After</span>", "#d1", {style: "outerHTML"})
        assert.isOk(settleTarget);
        document.body.contains(settleTarget).should.be.true;
        playground().innerText.should.contain("Before text inserted text After");
    })

    it('triggers view transition events with transition:true', async function () {
        if (!document.startViewTransition) {
            this.skip();
            return;
        }

        let beforeTriggered = false;
        let afterTriggered = false;
        htmx.on('htmx:before:viewTransition', () => {
            beforeTriggered = true;
        });
        htmx.on('htmx:after:viewTransition', () => {
            afterTriggered = true;
        });

        await htmx.swap("<div id='d1'>Content</div>", "#test-playground", {style: "innerHTML", transition: true})
        beforeTriggered.should.be.true;
        afterTriggered.should.be.true;
    })

    it('sets document title from response', async function () {
        let originalTitle = document.title;
        await htmx.swap("<html><head><title>New Title</title></head><body><div>Content</div></body></html>", "#test-playground")
        document.title.should.equal('New Title');
        document.title = originalTitle;
    })

    it('ignores title when ignoreTitle:true modifier is set', async function () {
        let originalTitle = document.title;
        await htmx.swap("<html><head><title>Ignored Title</title></head><body><div>Content</div></body></html>", "#test-playground", {style: "innerHTML", ignoreTitle: true})
        document.title.should.equal(originalTitle);
    })

    it('sets title from fragment without html/body tags', async function () {
        let originalTitle = document.title;
        await htmx.swap("<title>Fragment Title</title><div>Content</div>", "#test-playground")
        document.title.should.equal('Fragment Title');
        document.title = originalTitle;
    })

    it('does not set title when response has no title tag', async function () {
        let originalTitle = document.title;
        await htmx.swap("<div>Content without title</div>", "#test-playground")
        document.title.should.equal(originalTitle);
    })

    it('sets title with oob swap', async function () {
        let originalTitle = document.title;
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap("<title>OOB Title</title><div>Main</div><div id='d2' hx-swap-oob='true'>OOB</div>", "#d1")
        document.title.should.equal('OOB Title');
        document.title = originalTitle;
    })

    it('sets title with partial swap', async function () {
        let originalTitle = document.title;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap("<title>Partial Title</title><hx-partial hx-target='#d1'>Partial Content</hx-partial>", "#test-playground")
        document.title.should.equal('Partial Title');
        document.title = originalTitle;
    })

    it('sets title from body tag response', async function () {
        let originalTitle = document.title;
        await htmx.swap("<body><title>Body Title</title><div>Content</div></body>", "#test-playground")
        document.title.should.equal('Body Title');
        document.title = originalTitle;
    })

    it('decodes HTML entities in title', async function () {
        let originalTitle = document.title;
        await htmx.swap("<title>&lt;/&gt; htmx &amp; friends</title><div>Content</div>", "#test-playground")
        document.title.should.equal('</> htmx & friends');
        document.title = originalTitle;
    })

    it('does not swap title tag into page content', async function () {
        await htmx.swap("<title>Test Title</title><div id='content'>Main Content</div>", "#test-playground")
        assert.isNull(playground().querySelector('title'));
        find('#content').innerText.should.equal('Main Content');
    })

    it('supports autofocus', async function () {
        let originalTitle = document.title;
        await htmx.swap("<input id='i1' autofocus>", "#test-playground")
        document.activeElement.id.should.equal("i1")
    })

    it('swaps both main target and partial target when both are present', async function () {
        createProcessedHTML("<div id='target'>Hello</div><div id='target_oob'>OOB</div>")
        await htmx.swap("<div>Hello me!</div><hx-partial hx-target='#target_oob' hx-swap='innerHTML'><div>OOB swap!</div></hx-partial>", "#target")
        find('#target').textContent.should.equal("Hello me!");
        find('#target_oob').textContent.should.equal("OOB swap!");
    })

    it('swaps only partial target when response contains only partial', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='target_oob'>OOB Original</div>")
        await htmx.swap("<hx-partial hx-target='#target_oob' hx-swap='innerHTML'><div>OOB Updated</div></hx-partial>", "#target")
        find('#target').textContent.should.equal("Original");
        find('#target_oob').textContent.should.equal("OOB Updated");
    })

    it('does not swap main target when only whitespace and partial present', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='target_oob'>OOB</div>")
        await htmx.swap("\n  <hx-partial hx-target='#target_oob' hx-swap='innerHTML'><div>OOB swap!</div></hx-partial>  \n", "#target")
        find('#target').textContent.should.equal("Original");
        find('#target_oob').textContent.should.equal("OOB swap!");
    })

    it('swaps both targets when empty element and partial present', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='target_oob'>OOB</div>")
        await htmx.swap("<p></p><hx-partial hx-target='#target_oob' hx-swap='innerHTML'><div>OOB swap!</div></hx-partial>", "#target")
        find('#target').querySelector('p').should.not.be.null;
        find('#target_oob').textContent.should.equal("OOB swap!");
    })
  
    it('swaps both targets when plain text and partial present', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='target_oob'>OOB</div>")
        await htmx.swap("Hello<hx-partial hx-target='#target_oob' hx-swap='innerHTML'><div>OOB swap!</div></hx-partial>", "#target")
        find('#target').textContent.should.equal("Hello");
        find('#target_oob').innerText.should.equal("OOB swap!");
    })

    it('restores focus after innerHTML swap when element has same id', async function () {
        createProcessedHTML("<input id='focused-input' value='test'>")
        let input = find('#focused-input')
        input.focus()
        input.setSelectionRange(2, 2)
        
        await htmx.swap("<input id='focused-input' value='test'>", "#test-playground")
        
        document.activeElement.id.should.equal('focused-input')
        document.activeElement.selectionStart.should.equal(2)
        document.activeElement.selectionEnd.should.equal(2)
    })

    it('focusScroll:true scrolls the restored focused element into view', async function () {
        createProcessedHTML("<input id='focused-input' value='test'>")
        let input = find('#focused-input')
        input.focus()

        let focusOptions
        let originalFocus = HTMLElement.prototype.focus
        HTMLElement.prototype.focus = function(options) {
            focusOptions = options
            originalFocus.call(this, options)
        }

        try {
            await htmx.swap(
                "<input id='focused-input' value='test'>",
                '#test-playground',
                'innerHTML focusScroll:true'
            )
            focusOptions.preventScroll.should.equal(false)
        } finally {
            HTMLElement.prototype.focus = originalFocus
        }
    })

    it('restores focus after outerHTML swap when element has same id', async function () {
        createProcessedHTML("<div id='container'><input id='focused-input' value='test'></div>")
        let input = find('#focused-input')
        input.focus()
        input.setSelectionRange(1, 3)
        
        await htmx.swap("<div id='container'><input id='focused-input' value='test'></div>", "#container", {style: "outerHTML"})
        
        document.activeElement.id.should.equal('focused-input')
        document.activeElement.selectionStart.should.equal(1)
        document.activeElement.selectionEnd.should.equal(3)
    })

    it('does not restore focus when focused element has no id', async function () {
        createProcessedHTML("<input value='test'>")
        let input = playground().querySelector('input')
        input.focus()
        
        await htmx.swap("<input value='test'>", "#test-playground")
        
        document.activeElement.should.not.equal(input)
    })

    it('does not restore focus when new content lacks matching id', async function () {
        createProcessedHTML("<input id='focused-input' value='test'>")
        let input = find('#focused-input')
        input.focus()
        
        await htmx.swap("<input id='different-input' value='test'>", "#test-playground")
        
        document.activeElement.id.should.not.equal('focused-input')
    })

    it('does not restore focus for morph swaps', async function () {
        createProcessedHTML("<input id='focused-input' value='test'>")
        let input = find('#focused-input')
        input.focus()
        input.setSelectionRange(2, 2)
        
        await htmx.swap("<input id='focused-input' value='test'>", "#test-playground", {style: "innerMorph"})
        
        // Morph should maintain focus naturally, not through restoration
        document.activeElement.should.equal(input)
    })

    it('__insertContent accepts string swapSpec', async function () {
        createProcessedHTML("<div id='d1'>Old</div>")
        let fragment = document.createDocumentFragment()
        fragment.append(document.createTextNode('New'))
        await htmx.__insertContent({target: find('#d1'), swapSpec: 'innerHTML', fragment})
        find('#d1').innerText.should.equal('New')
    })

    it('outerSync cleans up powered children before replacing them', async function() {
        mockResponse('GET', '/endpoint', 'response')
        createProcessedHTML("<div id='target'><button id='btn' hx-get='/endpoint' hx-swap='innerHTML'>click</button></div>")
        const btn = find('#btn')
        assert.isNotNull(btn._htmx?.initialized, 'child should start initialized')

        await htmx.swap('<div id="target"><span>replaced</span></div>', '#target', {style: "outerSync", source: find('#target')})

        assert.isNull(btn.getAttribute('data-htmx-powered'), 'old child should be cleaned up')
        assert.isNotOk(find('#btn'), 'old button should be gone')
        assert.equal(find('#target').textContent, 'replaced')
    })

    it('outerSync adds hx-get to root element and initializes it', async function () {
        createProcessedHTML("<div id='target'><p>static</p></div>")
        mockResponse('GET', '/dynamic', 'fetched')

        await htmx.swap('<div id="target" hx-get="/dynamic" hx-trigger="click" hx-swap="innerHTML"><p>now interactive</p></div>', '#target', {style: "outerSync", source: find('#target')})

        let target = find('#target')
        target.getAttribute('hx-get').should.equal('/dynamic')
        assert.isNotNull(target._htmx?.initialized, 'target root should be initialized with htmx')
        target.click()
        await forRequest()
        target.textContent.should.equal('fetched')
    })

    it('outerSync removes hx-get from root element and old handler no longer fires', async function () {
        mockResponse('GET', '/should-not-fire', 'bad')
        createProcessedHTML("<div id='target' hx-get='/should-not-fire' hx-trigger='click' hx-swap='innerHTML'>interactive</div>")
        let target = find('#target')
        assert.isNotNull(target._htmx?.initialized, 'target should start initialized')

        // outerSync removes hx-get from the root
        await htmx.swap('<div id="target">no longer interactive</div>', '#target', {style: "outerSync", source: target})

        target = find('#target')
        target.textContent.should.equal('no longer interactive')
        assert.isNull(target.getAttribute('hx-get'), 'hx-get should be removed')

        // clicking should NOT issue a request — track via event
        let requestFired = false
        let handler = () => { requestFired = true }
        document.addEventListener('htmx:before:request', handler)
        target.click()
        await htmx.timeout(50)
        document.removeEventListener('htmx:before:request', handler)
        assert.isFalse(requestFired, 'no request should fire after hx-get removed')
    })

    it('outerSync changes hx-trigger on root element and new trigger fires', async function () {
        mockResponse('GET', '/endpoint', 'response')
        createProcessedHTML("<div id='target' hx-get='/endpoint' hx-trigger='click' hx-swap='innerHTML'>original</div>")

        // Change trigger from click to mousedown
        await htmx.swap('<div id="target" hx-get="/endpoint" hx-trigger="mousedown" hx-swap="innerHTML">updated</div>', '#target', {style: "outerSync", source: find('#target')})

        let target = find('#target')
        target.getAttribute('hx-trigger').should.equal('mousedown')

        // click should no longer trigger a request
        let requestFired = false
        let handler = () => { requestFired = true }
        document.addEventListener('htmx:before:request', handler)
        target.click()
        await htmx.timeout(50)
        document.removeEventListener('htmx:before:request', handler)
        assert.isFalse(requestFired, 'click should not trigger after hx-trigger changed to mousedown')

        // mousedown should trigger the request
        target.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
        await forRequest()
        target.textContent.should.equal('response')
    })

    // HX-Reswap replaces request swap modifiers without dropping independent selection state.
    it('replaces the swap spec and preserves selection through HX-Reswap', async function () {
        mockResponse('GET', '/test', '<div id="selected">Selected</div><div id="oob">OOB</div>', {
            headers: { 'HX-Reswap': 'innerHTML responseOnly:true' }
        })
        createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#target" hx-select="#selected" hx-select-oob="#oob" hx-swap="outerHTML transition:true requestOnly:true"></button>')
        let finalSwap
        find('button').addEventListener('htmx:before:swap', event => finalSwap = event.detail.ctx.swap)

        find('button').click()
        await forRequest()

        assert.equal(finalSwap.style, 'innerHTML')
        assert.isFalse(finalSwap.transition)
        assert.isUndefined(finalSwap.requestOnly)
        assert.isTrue(finalSwap.responseOnly)
        assert.equal(finalSwap.select, '#selected')
        assert.equal(finalSwap.selectOOB, '#oob')
    })

    // HX-Reswap falls back to the global transition preference when it does not specify one.
    it('preserves global transitions through HX-Reswap', async function () {
        let originalTransitions = htmx.config.transitions
        try {
            htmx.config.transitions = true
            mockResponse('GET', '/test', 'New', {
                headers: { 'HX-Reswap': 'innerHTML' }
            })
            createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#target" hx-swap="outerHTML transition:false"></button>')
            let finalSwap
            find('button').addEventListener('htmx:before:swap', event => finalSwap = event.detail.ctx.swap)

            find('button').click()
            await forRequest()

            assert.isTrue(finalSwap.transition)
        } finally {
            htmx.config.transitions = originalTransitions
        }
    })

    it('swaps partial to all elements matching a class selector', async function () {
        createProcessedHTML("<div class='target'>A</div><div class='target'>B</div>")
        await htmx.swap("<hx-partial hx-target='.target' hx-swap='innerHTML'>Updated</hx-partial>", "#test-playground")
        playground().querySelectorAll('.target').forEach(el => el.innerText.should.equal('Updated'))
    })

    it('swapEmpty:false prevents main swap when response is only oob', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='oob'>OOB</div>")
        await htmx.swap("<div id='oob' hx-swap-oob='true'>Updated</div>", "#target", {style: "innerHTML", swapEmpty: false})
        find('#target').innerText.should.equal('Original');
        find('#oob').innerText.should.equal('Updated');
    })

    it('swapEmpty:false prevents main swap when response is only partials', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='partial'>Partial</div>")
        await htmx.swap("<hx-partial hx-target='#partial'>Updated</hx-partial>", "#target", {style: "innerHTML", swapEmpty: false})
        find('#target').innerText.should.equal('Original');
        find('#partial').innerText.should.equal('Updated');
    })

    it('swapEmpty:true forces main swap even on empty response with partials', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='partial'>Partial</div>")
        await htmx.swap("<hx-partial hx-target='#partial'>Updated</hx-partial>", "#target", {style: "innerHTML", swapEmpty: true})
        find('#target').innerText.should.equal('');
        find('#partial').innerText.should.equal('Updated');
    })

    it('swapEmpty:false still swaps main target when response has real content alongside oob', async function () {
        createProcessedHTML("<div id='target'>Original</div><div id='oob'>OOB</div>")
        await htmx.swap("<div>New Content</div><div id='oob' hx-swap-oob='true'>Updated</div>", "#target", {style: "innerHTML", swapEmpty: false})
        find('#target').innerText.trim().should.equal('New Content');
        find('#oob').innerText.should.equal('Updated');
    })

    it('restores focus to textarea after innerHTML swap', async function () {
        createProcessedHTML("<textarea id='focused-textarea'>hello world</textarea>")
        let textarea = find('#focused-textarea')
        textarea.focus()
        textarea.setSelectionRange(6, 11)
        
        await htmx.swap("<textarea id='focused-textarea'>hello world</textarea>", "#test-playground")
        
        document.activeElement.id.should.equal('focused-textarea')
        document.activeElement.selectionStart.should.equal(6)
        document.activeElement.selectionEnd.should.equal(11)
    })

})
