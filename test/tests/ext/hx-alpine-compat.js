describe('hx-alpine-compat extension', function() {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        
        // Only load Alpine if not already loaded
        if (!window.Alpine) {
            let alpine = document.createElement('script');
            alpine.defer = true;
            alpine.src = '../test/lib/alpine.js';
            await new Promise(resolve => {
                // Wait for Alpine to fully initialize, not just script load
                document.addEventListener('alpine:init', resolve, { once: true });
                document.head.appendChild(alpine);
            });
        }
        
        let script = document.createElement('script');
        script.src = '../src/ext/hx-alpine-compat.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    })

    after(() => {
        restoreExtensions(extBackup);
    })

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('preserves Alpine x-show style attribute during Swap and Settle', async function () {
        mockResponse('GET', '/test', '<div id="content" x-show="show" class="inactive">Content</div>');
        const div = createProcessedHTML('<div x-data="{ show: false }"><div id="target" hx-get="/test" hx-swap="innerHTML"><div id="content" x-show="show" class="inactive">Content</div></div></div>');
        
        await htmx.timeout(50); // Let Alpine initialize and add style="display: none;"
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20); // Let Alpine reactivate after attributes are restored
        
        // Alpine should have re-applied style="display: none;" after morph
        const content = div.querySelector('#content');
        assert.equal(content.style.display, 'none');
    })

    it('preserves Alpine class binding during Swap and Settle', async function () {
        mockResponse('GET', '/test', '<div id="tab1" :class="{ \'active\': activeTab === \'tab1\' }">Tab 1</div>');
        const div = createProcessedHTML('<div x-data="{ activeTab: \'tab1\' }"><div id="target" hx-get="/test" hx-swap="innerHTML"><div id="tab1" :class="{ \'active\': activeTab === \'tab1\' }">Tab 1</div></div></div>');
        
        await htmx.timeout(50); // Let Alpine initialize and add "active" class
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20); // Let Alpine reactivate after attributes are restored
        
        // Alpine should have re-applied "active" class after morph
        const tab = div.querySelector('#tab1');
        assert.isTrue(tab.classList.contains('active'));
    })

    it('preserves Alpine x-show with outerHTML swap', async function () {
        mockResponse('GET', '/test', '<div id="content" x-show="show">New Content</div>');
        const div = createProcessedHTML('<div x-data="{ show: false }"><div id="content" hx-get="/test" hx-swap="outerHTML" x-show="show">Old Content</div></div>');
        
        await htmx.timeout(50);
        
        const content = div.querySelector('#content');
        content.click();
        await forRequest();
        await htmx.timeout(20);
        
        const newContent = div.querySelector('#content');
        assert.equal(newContent.style.display, 'none');
        assert.equal(newContent.textContent, 'New Content');
    })

    it('preserves Alpine state with innerMorph swap', async function () {
        mockResponse('GET', '/test', '<div id="item" x-show="visible">Morphed</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="innerMorph"><div id="item" x-show="visible">Original</div></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const item = div.querySelector('#item');
        assert.equal(item.style.display, 'none');
        assert.equal(item.textContent, 'Morphed');
    })

    it('preserves Alpine state with outerMorph swap', async function () {
        mockResponse('GET', '/test', '<div id="target" hx-get="/test" hx-swap="outerMorph"><div x-show="visible">Morphed</div></div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="outerMorph"><div x-show="visible">Original</div></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const newTarget = div.querySelector('#target');
        const item = newTarget.querySelector('[x-show]');
        assert.equal(item.style.display, 'none');
        assert.equal(item.textContent, 'Morphed');
    })

    it('preserves Alpine state with beforebegin swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">Before</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="beforebegin">Target</div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.previousElementSibling;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'Before');
    })

    it('preserves Alpine state with afterbegin swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">First Child</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="afterbegin"><span>Existing</span></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.firstElementChild;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'First Child');
    })

    it('preserves Alpine state with beforeend swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">Last Child</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="beforeend"><span>Existing</span></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.lastElementChild;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'Last Child');
    })

    it('preserves Alpine state with afterend swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">After</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="afterend">Target</div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.nextElementSibling;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'After');
    })

    it('preserves x-ref during innerMorph swap', async function () {
        mockResponse('GET', '/test', '<span x-ref="myRef">Morphed</span>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.myRef?.textContent; } }"><div id="target" hx-get="/test" hx-swap="innerMorph"><span x-ref="myRef">Original</span></div></div>');
        
        await htmx.timeout(50);
        
        const data = Alpine.$data(div);
        
        // Verify ref works before morph
        assert.equal(data.test(), 'Original');
        assert.equal(div._x_refs.myRef.textContent, 'Original');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        // Verify ref still works after morph
        assert.equal(data.test(), 'Morphed');
        assert.equal(div._x_refs.myRef.textContent, 'Morphed');
        assert.equal(div._x_refs.myRef, div.querySelector('[x-ref="myRef"]'));
    })

    it('preserves x-ref during outerMorph swap', async function () {
        mockResponse('GET', '/test', '<div id="target" hx-get="/test" hx-swap="outerMorph"><span x-ref="myRef">Morphed</span></div>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.myRef?.textContent; } }"><div id="target" hx-get="/test" hx-swap="outerMorph"><span x-ref="myRef">Original</span></div></div>');
        
        await htmx.timeout(50);
        
        const data = Alpine.$data(div);
        
        // Verify ref works before morph
        assert.equal(data.test(), 'Original');
        assert.equal(div._x_refs.myRef.textContent, 'Original');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        // Verify ref still works after morph (use same data reference)
        assert.equal(data.test(), 'Morphed');
        assert.equal(div._x_refs.myRef.textContent, 'Morphed');
        assert.equal(div._x_refs.myRef, div.querySelector('[x-ref="myRef"]'));
    })

    it('preserves x-ref when element tag changes from div to span', async function () {
        mockResponse('GET', '/test', '<span x-ref="myRef">Changed to Span</span>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.myRef?.textContent; } }"><div id="target" hx-get="/test" hx-swap="innerMorph"><div x-ref="myRef">Original Div</div></div></div>');
        
        await htmx.timeout(50);
        const data = Alpine.$data(div);
        assert.equal(data.test(), 'Original Div');
        assert.equal(div._x_refs.myRef.tagName, 'DIV');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        assert.equal(data.test(), 'Changed to Span');
        assert.equal(div.querySelector('[x-ref="myRef"]').tagName, 'SPAN');
        assert.equal(div._x_refs.myRef.tagName, 'SPAN');
        assert.equal(div._x_refs.myRef, div.querySelector('[x-ref="myRef"]'));
    })

    it('preserves x-ref when element is completely replaced', async function () {
        mockResponse('GET', '/test', '<button x-ref="myRef">Button</button>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.myRef?.textContent; } }"><div id="target" hx-get="/test" hx-swap="innerMorph"><span x-ref="myRef">Span</span></div></div>');
        
        await htmx.timeout(50);
        const data = Alpine.$data(div);
        assert.equal(data.test(), 'Span');
        assert.equal(div._x_refs.myRef.tagName, 'SPAN');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        assert.equal(data.test(), 'Button');
        assert.equal(div.querySelector('[x-ref="myRef"]').tagName, 'BUTTON');
        assert.equal(div._x_refs.myRef.tagName, 'BUTTON');
        assert.equal(div._x_refs.myRef, div.querySelector('[x-ref="myRef"]'));
    })

    it('preserves multiple x-refs during morph', async function () {
        mockResponse('GET', '/test', '<span x-ref="first">New First</span><span x-ref="second">New Second</span>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.first?.textContent + \'|\' + this.$refs.second?.textContent; } }"><div id="target" hx-get="/test" hx-swap="innerMorph"><span x-ref="first">Old First</span><span x-ref="second">Old Second</span></div></div>');
        
        await htmx.timeout(50);
        const data = Alpine.$data(div);
        assert.equal(data.test(), 'Old First|Old Second');
        assert.equal(div._x_refs.first.textContent, 'Old First');
        assert.equal(div._x_refs.second.textContent, 'Old Second');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        assert.equal(data.test(), 'New First|New Second');
        assert.equal(div._x_refs.first.textContent, 'New First');
        assert.equal(div._x_refs.second.textContent, 'New Second');
        assert.equal(div._x_refs.first, div.querySelector('[x-ref="first"]'));
        assert.equal(div._x_refs.second, div.querySelector('[x-ref="second"]'));
    })

    it('preserves x-ref when ref name changes', async function () {
        mockResponse('GET', '/test', '<span x-ref="newRef">New Ref Name</span>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.oldRef?.textContent || this.$refs.newRef?.textContent; } }"><div id="target" hx-get="/test" hx-swap="innerMorph"><span x-ref="oldRef">Old Ref Name</span></div></div>');
        
        await htmx.timeout(50);
        const data = Alpine.$data(div);
        assert.equal(data.test(), 'Old Ref Name');
        assert.equal(div._x_refs.oldRef.textContent, 'Old Ref Name');
        assert.isUndefined(div._x_refs.newRef);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        assert.equal(data.test(), 'New Ref Name');
        assert.isUndefined(div._x_refs.oldRef);
        assert.equal(div._x_refs.newRef.textContent, 'New Ref Name');
        assert.equal(div._x_refs.newRef, div.querySelector('[x-ref="newRef"]'));
    })

    it('preserves x-ref with nested structure changes', async function () {
        mockResponse('GET', '/test', '<div><p><span x-ref="nested">Deeply Nested</span></p></div>');
        const div = createProcessedHTML('<div x-data="{ test() { return this.$refs.nested?.textContent; } }"><div id="target" hx-get="/test" hx-swap="innerMorph"><span x-ref="nested">Flat</span></div></div>');
        
        await htmx.timeout(50);
        const data = Alpine.$data(div);
        assert.equal(data.test(), 'Flat');
        assert.equal(div._x_refs.nested.textContent, 'Flat');
        assert.equal(div._x_refs.nested.tagName, 'SPAN');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        assert.equal(data.test(), 'Deeply Nested');
        assert.equal(div._x_refs.nested.textContent, 'Deeply Nested');
        assert.equal(div._x_refs.nested, div.querySelector('[x-ref="nested"]'));
    })

    it('preserves x-ref when x-data parent is inside morph window', async function () {
        mockResponse('GET', '/test', '<div x-data="{ test() { return this.$refs.myRef?.textContent; } }"><span x-ref="myRef">Morphed</span></div>');
        const div = createProcessedHTML('<div><div id="target" hx-get="/test" hx-swap="innerMorph"><div x-data="{ test() { return this.$refs.myRef?.textContent; } }"><span x-ref="myRef">Original</span></div></div></div>');
        
        await htmx.timeout(50);
        
        const component = div.querySelector('[x-data]');
        const data = Alpine.$data(component);
        
        // Verify ref works before morph
        assert.equal(data.test(), 'Original');
        assert.equal(component._x_refs.myRef.textContent, 'Original');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        // After morph, get the new component
        const newComponent = div.querySelector('[x-data]');
        const newData = Alpine.$data(newComponent);
        
        // Verify ref still works after morph with new component
        assert.equal(newData.test(), 'Morphed');
        assert.equal(newComponent._x_refs.myRef.textContent, 'Morphed');
        assert.equal(newComponent._x_refs.myRef, newComponent.querySelector('[x-ref="myRef"]'));
    })

    it('preserves x-teleport during innerMorph swap', async function () {
        mockResponse('GET', '/test', '<template x-teleport="#teleport-target"><div id="teleported">Morphed Content</div></template>');
        const div = createProcessedHTML('<div><div id="teleport-target"></div><div id="target" hx-get="/test" hx-swap="innerMorph" x-data><template x-teleport="#teleport-target"><div id="teleported">Original Content</div></template></div></div>');
        
        await htmx.timeout(50);
        
        let teleportTarget = div.querySelector('#teleport-target');
        let teleported = teleportTarget.querySelector('#teleported');
        assert.equal(teleported?.textContent, 'Original Content');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        teleportTarget = div.querySelector('#teleport-target');
        teleported = teleportTarget.querySelector('#teleported');
        assert.equal(teleported?.textContent, 'Morphed Content');
    })

    it('preserves x-teleport when teleport target is outside morph window', async function () {
        mockResponse('GET', '/test', '<template x-teleport="body"><div id="body-teleported">Morphed to Body</div></template>');
        const div = createProcessedHTML('<div id="target" hx-get="/test" hx-swap="innerMorph" x-data><template x-teleport="body"><div id="body-teleported">Original to Body</div></template></div>');
        
        await htmx.timeout(50);
        
        let teleported = document.body.querySelector('#body-teleported');
        assert.equal(teleported?.textContent, 'Original to Body');
        
        div.click();
        await forRequest();
        await htmx.timeout(20);
        
        teleported = document.body.querySelector('#body-teleported');
        assert.equal(teleported?.textContent, 'Morphed to Body');
        
        teleported?.remove();
    })

    it('preserves x-teleport with multiple teleports', async function () {
        mockResponse('GET', '/test', '<template x-teleport="#target1"><span>New 1</span></template><template x-teleport="#target2"><span>New 2</span></template>');
        const div = createProcessedHTML('<div><div id="target1"></div><div id="target2"></div><div id="source" hx-get="/test" hx-swap="innerMorph" x-data><template x-teleport="#target1"><span>Old 1</span></template><template x-teleport="#target2"><span>Old 2</span></template></div></div>');
        
        await htmx.timeout(50);
        
        assert.equal(div.querySelector('#target1')?.textContent, 'Old 1');
        assert.equal(div.querySelector('#target2')?.textContent, 'Old 2');
        
        const source = div.querySelector('#source');
        source.click();
        await forRequest();
        await htmx.timeout(20);
        
        assert.equal(div.querySelector('#target1')?.textContent, 'New 1');
        assert.equal(div.querySelector('#target2')?.textContent, 'New 2');
    })

    it('removes teleported content when template is removed during morph', async function () {
        mockResponse('GET', '/test', '<div>No teleport anymore</div>');
        const div = createProcessedHTML('<div><div id="teleport-target"></div><div id="target" hx-get="/test" hx-swap="innerMorph" x-data><template x-teleport="#teleport-target"><div id="teleported">Original</div></template></div></div>');
        
        await htmx.timeout(50);
        
        // Verify teleported content exists
        let teleportTarget = div.querySelector('#teleport-target');
        assert.equal(teleportTarget.children.length, 1);
        assert.equal(teleportTarget.textContent, 'Original');
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        // Verify teleported content is removed
        teleportTarget = div.querySelector('#teleport-target');
        assert.equal(teleportTarget.children.length, 0);
        assert.equal(teleportTarget.textContent, '');
    })

    it('adds teleported content when template is added during morph', async function () {
        mockResponse('GET', '/test', '<template x-teleport="#teleport-target"><div id="teleported">New Teleport</div></template>');
        const div = createProcessedHTML('<div><div id="teleport-target"></div><div id="target" hx-get="/test" hx-swap="innerMorph" x-data><div>No teleport yet</div></div></div>');
        
        await htmx.timeout(50);
        
        let teleportTarget = div.querySelector('#teleport-target');
        assert.equal(teleportTarget.children.length, 0);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        teleportTarget = div.querySelector('#teleport-target');
        assert.equal(teleportTarget.children.length, 1);
        assert.equal(teleportTarget.textContent, 'New Teleport');
    })

    it('changes teleport target when selector changes during morph', async function () {
        mockResponse('GET', '/test', '<template x-teleport="#target2"><div id="teleported">Moved</div></template>');
        const div = createProcessedHTML('<div><div id="target1"></div><div id="target2"></div><div id="source" hx-get="/test" hx-swap="innerMorph" x-data><template x-teleport="#target1"><div id="teleported">Original</div></template></div></div>');
        
        await htmx.timeout(50);
        
        // Verify content in target1
        assert.equal(div.querySelector('#target1')?.textContent, 'Original');
        assert.equal(div.querySelector('#target2')?.textContent, '');
        
        const source = div.querySelector('#source');
        source.click();
        await forRequest();
        await htmx.timeout(20);
        
        // Verify content moved to target2
        assert.equal(div.querySelector('#target1')?.textContent, '');
        assert.equal(div.querySelector('#target2')?.textContent, 'Moved');
    })

    it('preserves Alpine x-for state during innerMorph swap', async function () {
        mockResponse('GET', '/todos', '<template x-for="item in items" :key="item"><div x-text="item + \' (morphed)\'"></div></template>');
        
        const div = createProcessedHTML(
            '<div x-data="{ items: [\'a\', \'b\', \'c\'] }">' +
            '  <div id="list" hx-get="/todos" hx-swap="innerMorph">' +
            '    <template x-for="item in items" :key="item">' +
            '      <div x-text="item"></div>' +
            '    </template>' +
            '  </div>' +
            '</div>'
        );
        
        await htmx.timeout(50);
        
        const data = Alpine.$data(div);
        const list = div.querySelector('#list');
        
        // Verify items rendered before morph
        assert.equal(list.querySelectorAll('div').length, 3);
        
        list.click();
        await forRequest();
        await htmx.timeout(20);
        
        // Verify Alpine state preserved and items still render
        assert.deepEqual(data.items, ['a', 'b', 'c']);
        assert.equal(list.querySelectorAll('div').length, 3);
        assert.include(list.textContent, '(morphed)');
    })

    it('preserves x-id generated IDs during innerMorph and morphs input value', async function () {
        mockResponse('GET', '/test', '<label :for="$id(\'email\')" :id="$id(\'label\')">Email (morphed):</label><input type="email" :id="$id(\'email\')">');
        
        const div = createProcessedHTML(
            '<div x-data x-id="[\'email\', \'label\']">' +
            '  <div id="target" hx-get="/test" hx-swap="innerMorph">' +
            '    <label :for="$id(\'email\')" :id="$id(\'label\')">Email:</label>' +
            '    <input type="email" :id="$id(\'email\')">' +
            '  </div>' +
            '</div>'
        );
        
        await htmx.timeout(50);
        
        const input = div.querySelector('input');
        const label = div.querySelector('label');
        const originalInputId = input.id;
        const originalLabelId = label.id;
        
        // User types in input
        input.value = 'user@test.com';
        
        // Verify IDs are generated
        assert.isTrue(originalInputId.length > 0);
        assert.isTrue(originalLabelId.length > 0);
        assert.equal(label.getAttribute('for'), originalInputId);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const newInput = div.querySelector('input');
        const newLabel = div.querySelector('label');
        
        // Verify IDs are preserved after morph
        assert.equal(newInput.id, originalInputId);
        assert.equal(newLabel.id, originalLabelId);
        assert.equal(newLabel.getAttribute('for'), originalInputId);
        
        // Verify input value was morphed (not replaced)
        assert.equal(newInput.value, 'user@test.com');
        assert.include(newLabel.textContent, '(morphed)');
    })

    it('preserves x-id generated IDs during outerMorph and morphs input value', async function () {
        mockResponse('GET', '/test', '<div id="target" hx-get="/test" hx-swap="outerMorph"><label :for="$id(\'email\')" :id="$id(\'label\')">Email (morphed):</label><input type="email" :id="$id(\'email\')"></div>');
        
        const div = createProcessedHTML(
            '<div x-data x-id="[\'email\', \'label\']">' +
            '  <div id="target" hx-get="/test" hx-swap="outerMorph">' +
            '    <label :for="$id(\'email\')" :id="$id(\'label\')">Email:</label>' +
            '    <input type="email" :id="$id(\'email\')">' +
            '  </div>' +
            '</div>'
        );
        
        await htmx.timeout(50);
        
        const input = div.querySelector('input');
        const label = div.querySelector('label');
        const originalInputId = input.id;
        const originalLabelId = label.id;
        
        // User types in input
        input.value = 'user@test.com';
        
        // Verify IDs are generated
        assert.isTrue(originalInputId.length > 0);
        assert.isTrue(originalLabelId.length > 0);
        assert.equal(label.getAttribute('for'), originalInputId);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const newInput = div.querySelector('input');
        const newLabel = div.querySelector('label');
        
        // Verify IDs are preserved after morph
        assert.equal(newInput.id, originalInputId);
        assert.equal(newLabel.id, originalLabelId);
        assert.equal(newLabel.getAttribute('for'), originalInputId);
        
        // Verify input value was morphed (not replaced)
        assert.equal(newInput.value, 'user@test.com');
        assert.include(newLabel.textContent, '(morphed)');
    })
})
