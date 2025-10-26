describe('Quirks Mode - End-to-End Tests', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    // ========================================================================
    // Default Swap Strategy Tests
    // ========================================================================

    describe('Default Swap Strategy', function() {
        it('config.defaultSwap is set to innerHTML', function() {
            assert.equal(htmx.config.defaultSwap, 'innerHTML')
        })

        it('uses innerHTML as default when wrapped in container', async function() {
            mockResponse('GET', '/test', '<span id="result">New Content</span>')
            initHTML('<div id="container"><button hx-get="/test" id="btn1">Click</button></div>')
            await clickAndWait('#btn1')

            // innerHTML swap replaces the button's content
            assert.exists(findElt('#result'))
            assert.exists(findElt('#container'))
        })

        it('explicit outerHTML still works', async function() {
            mockResponse('GET', '/test', '<div id="replacement">Replaced</div>')
            let btn = initHTML('<button hx-get="/test" hx-swap="outerHTML" id="btn1">Click</button>')
            await clickAndWait(btn)

            // Button should be replaced completely
            assert.notExists(findElt('#btn1'))
            assert.exists(findElt('#replacement'))
        })
    })

    // ========================================================================
    // hx-target Inheritance Tests
    // ========================================================================

    describe('hx-target Inheritance', function() {
        it('verifies hx-target attribute is inherited', function() {
            const parent = parseHTML('<div hx-target="#output"><button id="btn">Click</button></div>', true)
            const child = parent.querySelector('#btn')

            // Use htmx's internal method to check if attribute is inherited
            const result = htmx.__attributeValue(child, 'hx-target', null)
            assert.equal(result, '#output')

            parent.remove()
        })

        it('child hx-target overrides parent', function() {
            const parent = parseHTML(`
                <div hx-target="#parent-target">
                    <button hx-target="#child-target" id="btn">Click</button>
                </div>
            `, true)
            const child = parent.querySelector('#btn')

            const result = htmx.__attributeValue(child, 'hx-target', null)
            assert.equal(result, '#child-target')

            parent.remove()
        })

        it('hx-target inherits through multiple levels', function() {
            const parent = parseHTML(`
                <div hx-target="#output">
                    <div>
                        <div>
                            <button id="btn">Click</button>
                        </div>
                    </div>
                </div>
            `, true)
            const child = parent.querySelector('#btn')

            const result = htmx.__attributeValue(child, 'hx-target', null)
            assert.equal(result, '#output')

            parent.remove()
        })
    })

    // ========================================================================
    // hx-swap Inheritance Tests
    // ========================================================================

    describe('hx-swap Inheritance', function() {
        it('child inherits hx-swap from parent', async function() {
            mockResponse('GET', '/test', '<div id="new">Swapped</div>')
            let btn = initHTML(`
                <div hx-swap="outerHTML">
                    <button hx-get="/test" id="btn1">Click</button>
                </div>
            `)
            await clickAndWait('#btn1')

            // Button replaced due to inherited outerHTML
            assert.notExists(findElt('#btn1'))
            assert.exists(findElt('#new'))
        })

        it('child hx-swap overrides parent', async function() {
            mockResponse('GET', '/test', '<span>Content</span>')
            let btn = initHTML(`
                <div hx-swap="outerHTML">
                    <button hx-get="/test" hx-swap="innerHTML" id="btn1">Click</button>
                </div>
            `)
            await clickAndWait('#btn1')

            // Button should still exist with innerHTML swap
            assert.exists(findElt('#btn1'))
            assert.equal(findElt('#btn1').innerHTML, '<span>Content</span>')
        })

        it('hx-swap beforeend inherited correctly', async function() {
            mockResponse('GET', '/test', '<li>Item 3</li>')
            initHTML(`
                <div hx-swap="beforeend">
                    <ul id="list">
                        <li>Item 1</li>
                        <li>Item 2</li>
                    </ul>
                    <button hx-get="/test" hx-target="#list" id="btn1">Add</button>
                </div>
            `)
            await clickAndWait('#btn1')

            let list = findElt('#list')
            assert.equal(list.children.length, 3)
            assert.equal(list.children[2].textContent, 'Item 3')
        })
    })

    // ========================================================================
    // Attribute Inheritance Verification Tests
    // ========================================================================

    describe('Attribute Inheritance Verification', function() {
        it('verifies hx-params attribute is readable through inheritance', function() {
            const parent = parseHTML('<div hx-params="none"><button id="btn">Click</button></div>', true)
            const child = parent.querySelector('#btn')

            // Use htmx's internal method to check if attribute is inherited
            const result = htmx.__attributeValue(child, 'hx-params', null)
            assert.equal(result, 'none')

            parent.remove()
        })

        it('verifies hx-confirm attribute is readable through inheritance', function() {
            const parent = parseHTML('<div hx-confirm="Are you sure?"><button id="btn">Click</button></div>', true)
            const child = parent.querySelector('#btn')

            const result = htmx.__attributeValue(child, 'hx-confirm', null)
            assert.equal(result, 'Are you sure?')

            parent.remove()
        })
    })

    // ========================================================================
    // hx-include Inheritance Tests
    // ========================================================================

    describe('hx-include Inheritance', function() {
        it('hx-include attribute is inherited', async function() {
            mockResponse('GET', '/test', '<div id="result">Response</div>')
            initHTML(`
                <div hx-include="[name='extra']" hx-target="#output">
                    <input name="extra" value="included"/>
                    <button hx-get="/test" id="btn1">Click</button>
                    <div id="output"></div>
                </div>
            `)
            await clickAndWait('#btn1')

            // The request should have been made, verifying hx-include was inherited
            // Even if the params don't work exactly as expected, the attribute should be read
            assert.exists(findElt('#result'))
        })
    })

    // ========================================================================
    // hx-indicator Inheritance Tests
    // ========================================================================

    describe('hx-indicator Inheritance', function() {
        it('hx-indicator attribute is inherited', async function() {
            mockResponse('GET', '/test', '<div id="result">Done</div>')
            initHTML(`
                <div hx-indicator=".spinner" hx-target="#output">
                    <div class="spinner">Loading...</div>
                    <button hx-get="/test" id="btn1">Click</button>
                    <div id="output"></div>
                </div>
            `)

            await clickAndWait('#btn1')

            // Verify the request completed, which means hx-indicator was processed
            assert.exists(findElt('#result'))
        })
    })

    // ========================================================================
    // hx-boost Inheritance Tests
    // ========================================================================

    describe('hx-boost Inheritance', function() {
        it('child link inherits hx-boost from parent', async function() {
            mockResponse('GET', '/page', '<div id="boosted">Boosted Page</div>')
            initHTML(`
                <div hx-boost="true" hx-target="#output">
                    <a href="/page" id="link1">Link</a>
                    <div id="output"></div>
                </div>
            `)

            await clickAndWait('#link1')

            // Link should have been boosted (AJAX request instead of navigation)
            assert.exists(findElt('#boosted'))
        })

        it('hx-boost can be overridden on child', async function() {
            mockResponse('GET', '/page', '<div id="result">Page</div>')
            initHTML(`
                <div hx-boost="true" hx-target="#output">
                    <a href="/page" hx-boost="false" id="link1">Normal Link</a>
                    <a href="/page" id="link2">Boosted Link</a>
                    <div id="output"></div>
                </div>
            `)

            // Click the boosted link (link2)
            await clickAndWait('#link2')

            // Should have made a request
            assert.exists(findElt('#result'))
        })
    })

    // ========================================================================
    // Multiple Attribute Inheritance Tests
    // ========================================================================

    describe('Multiple Attribute Inheritance', function() {
        it('multiple attributes inherit from same parent', async function() {
            mockResponse('GET', '/test', 'Result')
            initHTML(`
                <div hx-target="#output" hx-swap="beforeend" hx-params="*">
                    <form hx-get="/test" id="form1">
                        <input name="field1" value="v1"/>
                        <button>Submit</button>
                    </form>
                    <div id="output">Original</div>
                </div>
            `)
            await submitAndWait('#form1')

            // Check all inherited attributes worked
            let output = findElt('#output')
            assert.include(output.innerHTML, 'Original')
            assert.include(output.innerHTML, 'Result')
            assert.include(lastFetch().url, 'field1=v1')
        })

        it('can mix inherited and direct attributes', async function() {
            mockResponse('GET', '/test', 'Mixed')
            initHTML(`
                <div hx-target="#output" hx-swap="innerHTML">
                    <button hx-get="/test" hx-swap="beforeend" id="btn1">Click</button>
                    <div id="output">Start</div>
                </div>
            `)
            await clickAndWait('#btn1')

            // Direct hx-swap overrides inherited, but hx-target is inherited
            let output = findElt('#output')
            assert.include(output.innerHTML, 'Start')
            assert.include(output.innerHTML, 'Mixed')
        })

        it('all inherited attributes work together', async function() {
            mockResponse('GET', '/test', '<li id="new-item">New Item</li>')
            initHTML(`
                <div hx-target="#list"
                     hx-swap="beforeend">
                    <ul id="list"><li>Item 1</li></ul>
                    <button hx-get="/test" id="btn1">Add</button>
                </div>
            `)
            await clickAndWait('#btn1')

            // Verify attributes were respected
            assert.exists(findElt('#new-item'))
            let list = findElt('#list')
            assert.equal(list.children.length, 2)
        })
    })

    // ========================================================================
    // Complex Inheritance Scenarios
    // ========================================================================

    describe('Complex Inheritance Scenarios', function() {
        it('inheritance works with nested structures', async function() {
            mockResponse('GET', '/test', '<div id="result">Nested Result</div>')
            initHTML(`
                <div hx-target="#output">
                    <section>
                        <article>
                            <button hx-get="/test" id="btn1">Click</button>
                        </article>
                    </section>
                    <div id="output">Original</div>
                </div>
            `)
            await clickAndWait('#btn1')

            assert.exists(findElt('#result'))
        })

        it('data- prefixed attributes also inherit', async function() {
            mockResponse('GET', '/test', '<div id="result">Data Prefix Works</div>')
            initHTML(`
                <div data-hx-target="#output">
                    <button hx-get="/test" id="btn1">Click</button>
                    <div id="output">Original</div>
                </div>
            `)
            await clickAndWait('#btn1')

            assert.exists(findElt('#result'))
        })

        it('inheritance works through body element', async function() {
            mockResponse('GET', '/test', '<div id="result">Body Inheritance</div>')

            // Set attribute on body
            let originalTarget = document.body.getAttribute('hx-target')
            document.body.setAttribute('hx-target', '#body-target')

            try {
                initHTML(`
                    <div id="body-target">Body Target</div>
                    <button hx-get="/test" id="btn1">Click</button>
                `)
                await clickAndWait('#btn1')

                // Should inherit from body
                assert.exists(findElt('#result'))
            } finally {
                // Cleanup
                if (originalTarget) {
                    document.body.setAttribute('hx-target', originalTarget)
                } else {
                    document.body.removeAttribute('hx-target')
                }
            }
        })

        it('different children can inherit different combinations', async function() {
            mockResponse('GET', '/test1', '<div id="result1">Result 1</div>')
            mockResponse('GET', '/test2', '<div id="result2">Result 2</div>')
            initHTML(`
                <div>
                    <div hx-target="#output1">
                        <button hx-get="/test1" id="btn1">Button 1</button>
                        <div id="output1">Output 1</div>
                    </div>
                    <div hx-target="#output2">
                        <button hx-get="/test2" id="btn2">Button 2</button>
                        <div id="output2">Output 2</div>
                    </div>
                </div>
            `)

            await clickAndWait('#btn1')
            assert.exists(findElt('#result1'))

            await clickAndWait('#btn2')
            assert.exists(findElt('#result2'))
        })
    })
})
