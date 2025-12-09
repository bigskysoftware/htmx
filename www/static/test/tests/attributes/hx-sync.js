describe('hx-sync attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })


    it('defaults to queue first strategy', async function() {
        createProcessedHTML('<div hx-sync:inherited="this">' +
            '<button id="b1" hx-get="/test1">Initial</button>' +
            '<button id="b2" hx-get="/test2">Initial</button>' +
            '<button id="b3" hx-get="/test3">Initial</button></div>')

        let b1 = find('#b1')
        let b2 = find('#b2')
        let b3 = find('#b3')
        b1.click()
        b2.click()
        b3.click()
        await forRequest()
        b1.innerHTML.should.equal('Click 1')
        b2.innerHTML.should.equal('Initial')
        b3.innerHTML.should.equal('Initial')
        await forRequest()
        b1.innerHTML.should.equal('Click 1')
        b2.innerHTML.should.equal('Click 2')
        b3.innerHTML.should.equal('Initial')
    })

    // it('can use replace strategy', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-get="/test" hx-sync="#sync-container:replace">Initial</button>' +
    //         '<button id="b2" hx-get="/test" hx-sync="#sync-container:replace">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     b1.click()
    //     b2.click()
    //     await forRequest()
    //     b1.innerHTML.should.equal('Initial')
    //     b2.innerHTML.should.equal('Click 0')
    // })
    //
    // it('can use queue all strategy', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-get="/test" hx-sync="#sync-container:queue all">Initial</button>' +
    //         '<button id="b2" hx-get="/test" hx-sync="#sync-container:queue all">Initial</button>' +
    //         '<button id="b3" hx-get="/test" hx-sync="#sync-container:queue all">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     let b3 = find('#b3')
    //
    //     b1.click()
    //     b2.click()
    //     b3.click()
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Initial')
    //     b3.innerHTML.should.equal('Initial')
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Click 1')
    //     b3.innerHTML.should.equal('Initial')
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Click 1')
    //     b3.innerHTML.should.equal('Click 2')
    // })
    //
    // it('can use queue last strategy', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-get="/test" hx-sync="#sync-container:queue last">Initial</button>' +
    //         '<button id="b2" hx-get="/test" hx-sync="#sync-container:queue last">Initial</button>' +
    //         '<button id="b3" hx-get="/test" hx-sync="#sync-container:queue last">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     let b3 = find('#b3')
    //
    //     b1.click()
    //     b2.click()
    //     b3.click()
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Initial')
    //     b3.innerHTML.should.equal('Initial')
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Initial')
    //     b3.innerHTML.should.equal('Click 1')
    // })
    //
    // it('can use queue first strategy', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-get="/test" hx-sync="#sync-container:queue first">Initial</button>' +
    //         '<button id="b2" hx-get="/test" hx-sync="#sync-container:queue first">Initial</button>' +
    //         '<button id="b3" hx-get="/test" hx-sync="#sync-container:queue first">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     let b3 = find('#b3')
    //
    //     b1.click()
    //     b2.click()
    //     b3.click()
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Initial')
    //     b3.innerHTML.should.equal('Initial')
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Click 1')
    //     b3.innerHTML.should.equal('Initial')
    // })
    //
    // it('can use abort strategy to end existing abortable request', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-sync="#sync-container:abort" hx-get="/test">Initial</button>' +
    //         '<button id="b2" hx-sync="#sync-container:drop" hx-get="/test">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     b1.click()
    //     b2.click()
    //     await forRequest()
    //     b1.innerHTML.should.equal('Initial')
    //     b2.innerHTML.should.equal('Click 0')
    // })
    //
    // it('can use abort strategy to drop abortable request when one is in flight', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-sync="#sync-container:abort" hx-get="/test">Initial</button>' +
    //         '<button id="b2" hx-sync="#sync-container:drop" hx-get="/test">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     b2.click()
    //     b1.click()
    //     await forRequest()
    //     b1.innerHTML.should.equal('Initial')
    //     b2.innerHTML.should.equal('Click 0')
    // })
    //
    // it('can abort a request programmatically', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div><button id="b1" hx-get="/test">Initial</button>' +
    //         '<button id="b2" hx-get="/test">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     b1.click()
    //     b2.click()
    //
    //     htmx.trigger(b1, 'htmx:abort')
    //
    //     await forRequest()
    //     b1.innerHTML.should.equal('Initial')
    //     b2.innerHTML.should.equal('Click 0')
    // })
    //
    // it('can use drop strategy', async function() {
    //     let count = 0
    //     mockResponse('GET', '/test', () => 'Click ' + count++)
    //     createProcessedHTML('<div id="sync-container">' +
    //         '<button id="b1" hx-get="/test" hx-sync="#sync-container:drop">Initial</button>' +
    //         '<button id="b2" hx-get="/test" hx-sync="#sync-container:drop">Initial</button></div>')
    //
    //     let b1 = find('#b1')
    //     let b2 = find('#b2')
    //     b1.click()
    //     b2.click()
    //     await forRequest()
    //     b1.innerHTML.should.equal('Click 0')
    //     b2.innerHTML.should.equal('Initial')
    // })

})
