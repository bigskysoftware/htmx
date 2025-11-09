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
        assert.equal(htmx.__parseSwapSpec('prepend swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('append swap:20').style, 'beforeend')
        assert.equal(htmx.__parseSwapSpec('append swap:20').swapDelay, 20)
    })
    // end TODO move to __parseSwapSpec unit test

    it('swaps in plain content properly', async function () {
        await htmx.swap({"target":"#test-playground", "text":"Hello Swap"})
        playground().innerText.should.equal("Hello Swap")
    })

    it('swaps in html content properly', async function () {
        await htmx.swap({"target":"#test-playground", "text":"<a>Hello Swap</a>"})
        let child = playground().children[0];
        child.tagName.should.equal("A");
        child.innerText.should.equal("Hello Swap")
    })

    it('initializes htmx content properly', async function () {
        await htmx.swap({"target":"#test-playground", "text":"<a hx-get='/foo'>Hello Swap</a>"})
        let child = playground().children[0];
        child.tagName.should.equal("A");
        child.innerText.should.equal("Hello Swap")
        assert.isNotNull(child._htmx);
    })

    it('swaps in plain content properly w/outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"Hello Swap", "swap" : "outerHTML"})
        playground().innerText.should.equal("Hello Swap")
    })

    it('swaps in html content properly w/outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"<span>Hello Swap</span>", "swap" : "outerHTML"})
        let child = playground().children[0];
        child.tagName.should.equal("SPAN");
        child.innerText.should.equal("Hello Swap")
    })

    it('replaces target element w/outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div>")
        let original = find('#d1');
        await htmx.swap({"target":"#d1", "text":"<span id='d1'>Replaced</span>", "swap" : "outerHTML"})
        let replaced = find('#d1');
        replaced.should.not.equal(original);
        replaced.tagName.should.equal("SPAN");
    })

    it('inserts before target w/beforebegin', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap({"target":"#d1", "text":"<span>Before</span>", "swap" : "beforebegin"})
        let children = playground().children;
        children[0].tagName.should.equal("SPAN");
        children[0].innerText.should.equal("Before");
        children[1].innerText.should.equal("Target");
    })

    it('inserts plain text before target w/beforebegin', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap({"target":"#d1", "text":"Before", "swap" : "beforebegin"})
        playground().childNodes[0].textContent.should.equal("Before");
        find('#d1').innerText.should.equal("Target");
    })

    it('prepends content inside target w/afterbegin', async function () {
        createProcessedHTML("<div id='d1'><span>Existing</span></div>")
        await htmx.swap({"target":"#d1", "text":"<span>First</span>", "swap" : "afterbegin"})
        let children = find('#d1').children;
        children[0].innerText.should.equal("First");
        children[1].innerText.should.equal("Existing");
    })

    it('prepends plain text inside target w/afterbegin', async function () {
        createProcessedHTML("<div id='d1'>Existing</div>")
        await htmx.swap({"target":"#d1", "text":"First", "swap" : "afterbegin"})
        find('#d1').childNodes[0].textContent.should.equal("First");
    })

    it('appends content inside target w/beforeend', async function () {
        createProcessedHTML("<div id='d1'><span>Existing</span></div>")
        await htmx.swap({"target":"#d1", "text":"<span>Last</span>", "swap" : "beforeend"})
        let children = find('#d1').children;
        children[0].innerText.should.equal("Existing");
        children[1].innerText.should.equal("Last");
    })

    it('appends plain text inside target w/beforeend', async function () {
        createProcessedHTML("<div id='d1'>Existing</div>")
        await htmx.swap({"target":"#d1", "text":"Last", "swap" : "beforeend"})
        let target = find('#d1');
        target.childNodes[target.childNodes.length - 1].textContent.should.equal("Last");
    })

    it('inserts after target w/afterend', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap({"target":"#d1", "text":"<span>After</span>", "swap" : "afterend"})
        let children = playground().children;
        children[0].innerText.should.equal("Target");
        children[1].tagName.should.equal("SPAN");
        children[1].innerText.should.equal("After");
    })

    it('inserts plain text after target w/afterend', async function () {
        createProcessedHTML("<div id='d1'>Target</div>")
        await htmx.swap({"target":"#d1", "text":"After", "swap" : "afterend"})
        find('#d1').innerText.should.equal("Target");
        playground().childNodes[1].textContent.should.equal("After");
    })

    it('executes script w/innerHTML', async function () {
        window.testVar = 0;
        await htmx.swap({"target":"#test-playground", "text":"<script>window.testVar = 1</script>"})
        window.testVar.should.equal(1);
        delete window.testVar;
    })

    it('executes script w/outerHTML', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"<div><script>window.testVar = 2</script></div>", "swap" : "outerHTML"})
        window.testVar.should.equal(2);
        delete window.testVar;
    })

    it('executes script w/beforebegin', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"<script>window.testVar = 3</script>", "swap" : "beforebegin"})
        window.testVar.should.equal(3);
        delete window.testVar;
    })

    it('executes script w/afterbegin', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"<script>window.testVar = 4</script>", "swap" : "afterbegin"})
        window.testVar.should.equal(4);
        delete window.testVar;
    })

    it('executes script w/beforeend', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"<script>window.testVar = 5</script>", "swap" : "beforeend"})
        window.testVar.should.equal(5);
        delete window.testVar;
    })

    it('executes script w/afterend', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#d1", "text":"<script>window.testVar = 6</script>", "swap" : "afterend"})
        window.testVar.should.equal(6);
        delete window.testVar;
    })

    it('swaps oob content', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap({"target":"#d1", "text":"<div>Main</div><div id='d2' hx-swap-oob='true'>OOB</div>"})
        find('#d1').innerText.trim().should.equal("Main");
        find('#d2').innerText.should.equal("OOB");
    })

    it('swaps oob with outerHTML', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap({"target":"#d1", "text":"<div>Main</div><div id='d2' hx-swap-oob='outerHTML'>OOB</div>"})
        find('#d2').innerText.should.equal("OOB");
    })

    it('swaps oob with innerHTML', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'><span>Old</span></div>")
        await htmx.swap({"target":"#d1", "text":"<div>Main</div><div id='d2' hx-swap-oob='innerHTML'>OOB</div>"})
        find('#d2').innerText.should.equal("OOB");
        find('#d2').tagName.should.equal("DIV");
    })

    it('swaps partial with default target', async function () {
        await htmx.swap({"target":"#test-playground", "text":"<hx-partial hx-target='#test-playground'>Partial</hx-partial>"})
        playground().innerText.should.equal("Partial");
    })

    it('swaps partial with custom target', async function () {
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap({"target":"#d1", "text":"<hx-partial hx-target='#d2'>Partial</hx-partial>"})
        find('#d2').innerText.should.equal("Partial");
    })

    it('swaps partial with custom swap style', async function () {
        createProcessedHTML("<div id='d1'>Existing</div>")
        await htmx.swap({"target":"#test-playground", "text":"<hx-partial hx-target='#d1' hx-swap='beforeend'>Partial</hx-partial>"})
        find('#d1').innerText.should.equal("ExistingPartial");
    })

    it('executes script in oob swap', async function () {
        window.testVar = 0;
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap({"target":"#d1", "text":"<div>Main</div><div id='d2' hx-swap-oob='true'><script>window.testVar = 7</script></div>"})
        window.testVar.should.equal(7);
        delete window.testVar;
    })

    it('executes script in partial', async function () {
        window.testVar = 0;
        await htmx.swap({"target":"#test-playground", "text":"<hx-partial hx-target='#test-playground'><script>window.testVar = 8</script></hx-partial>"})
        window.testVar.should.equal(8);
        delete window.testVar;
    })

    it('replaces attributes when swapping element with same id', async function () {
        createProcessedHTML("<div id='d1' class='old' data-value='1'></div>")
        await htmx.swap({"target":"#d1", "text":"<div id='d1' class='new' data-value='2'>Content</div>", "swap":"outerHTML"})
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
        await htmx.swap({"target":"#d1", "text":"<div id='d1' style='opacity: 0.5;'>New</div>", "swap":"outerHTML"})
        await htmx.timeout(50);
        transitioned.should.be.true;
    })

    it('triggers htmx:before:swap event', async function () {
        let triggered = false;
        htmx.on('htmx:before:swap', () => {
            triggered = true;
        });
        await htmx.swap({"target":"#test-playground", "text":"<div>Content</div>"})
        triggered.should.be.true;
    })

    it('triggers htmx:after:swap event', async function () {
        let triggered = false;
        htmx.on('htmx:after:swap', () => {
            triggered = true;
        });
        await htmx.swap({"target":"#test-playground", "text":"<div>Content</div>"})
        triggered.should.be.true;
    })

    it('triggers htmx:after:restore event', async function () {
        let triggered = false;
        htmx.on('htmx:after:restore', () => {
            triggered = true;
        });
        await htmx.swap({"target":"#test-playground", "text":"<div>Content</div>"})
        triggered.should.be.true;
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

        await htmx.swap({"target":"#test-playground", "text":"<div id='d1'>Content</div>", "transition":true})
        beforeTriggered.should.be.true;
        afterTriggered.should.be.true;
    })

    it('sets document title from response', async function () {
        let originalTitle = document.title;
        await htmx.swap({"target":"#test-playground", "text":"<html><head><title>New Title</title></head><body><div>Content</div></body></html>"})
        document.title.should.equal('New Title');
        document.title = originalTitle;
    })

    it('ignores title when ignoreTitle:true modifier is set', async function () {
        let originalTitle = document.title;
        await htmx.swap({"target":"#test-playground", "text":"<html><head><title>Ignored Title</title></head><body><div>Content</div></body></html>", "swap":"innerHTML ignoreTitle:true"})
        document.title.should.equal(originalTitle);
    })

    it('sets title from fragment without html/body tags', async function () {
        let originalTitle = document.title;
        await htmx.swap({"target":"#test-playground", "text":"<title>Fragment Title</title><div>Content</div>"})
        document.title.should.equal('Fragment Title');
        document.title = originalTitle;
    })

    it('does not set title when response has no title tag', async function () {
        let originalTitle = document.title;
        await htmx.swap({"target":"#test-playground", "text":"<div>Content without title</div>"})
        document.title.should.equal(originalTitle);
    })

    it('sets title with oob swap', async function () {
        let originalTitle = document.title;
        createProcessedHTML("<div id='d1'></div><div id='d2'></div>")
        await htmx.swap({"target":"#d1", "text":"<title>OOB Title</title><div>Main</div><div id='d2' hx-swap-oob='true'>OOB</div>"})
        document.title.should.equal('OOB Title');
        document.title = originalTitle;
    })

    it('sets title with partial swap', async function () {
        let originalTitle = document.title;
        createProcessedHTML("<div id='d1'></div>")
        await htmx.swap({"target":"#test-playground", "text":"<title>Partial Title</title><hx-partial hx-target='#d1'>Partial Content</hx-partial>"})
        document.title.should.equal('Partial Title');
        document.title = originalTitle;
    })

    it('sets title from body tag response', async function () {
        let originalTitle = document.title;
        await htmx.swap({"target":"#test-playground", "text":"<body><title>Body Title</title><div>Content</div></body>"})
        document.title.should.equal('Body Title');
        document.title = originalTitle;
    })

    it('does not swap title tag into page content', async function () {
        await htmx.swap({"target":"#test-playground", "text":"<title>Test Title</title><div id='content'>Main Content</div>"})
        assert.isNull(playground().querySelector('title'));
        find('#content').innerText.should.equal('Main Content');
    })
})
