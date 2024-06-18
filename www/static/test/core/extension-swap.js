describe('default extensions behavior', function() {
  var loadCalls, afterSwapCalls, afterSettleCalls

  beforeEach(function() {
    loadCalls = []
    this.server = makeServer()
    clearWorkArea()

    htmx.defineExtension('ext-testswap', {
      onEvent: function(name, evt) {
        if (name === 'htmx:load') {
          loadCalls.push(evt.detail.elt)
        }
      },
      handleSwap: function(swapStyle, target, fragment, settleInfo) {
        // simple outerHTML replacement for tests
        var parentEl = target.parentElement
        parentEl.removeChild(target)
        const arr = []
        for (const child of fragment.childNodes) {
          arr.push(parentEl.appendChild(child))
        }
        return arr // return the newly added elements
      }
    })
  })

  afterEach(function() {
    this.server.restore()
    clearWorkArea()
    htmx.removeExtension('ext-testswap')
  })

  it('handleSwap: afterSwap and afterSettle triggered if extension defined on parent', function() {
    this.server.respondWith('GET', '/test', '<button>Clicked!</button>')
    var div = make('<div hx-ext="ext-testswap"><button hx-get="/test" hx-swap="testswap">Click Me!</button></div>')
    var btn = div.firstChild
    btn.click()
    this.server.respond()
    loadCalls.length.should.equal(1)
    loadCalls[0].textContent.should.equal('Clicked!') // the new button is loaded
  })

  it('handleSwap: new content is handled by htmx', function() {
    this.server.respondWith('GET', '/test', '<button id="test-ext-testswap">Clicked!<span hx-get="/test-inner" hx-trigger="load"></span></button>')
    this.server.respondWith('GET', '/test-inner', 'Loaded!')
    make('<div hx-ext="ext-testswap"><button hx-get="/test" hx-swap="testswap">Click Me!</button></div>').querySelector('button').click()

    this.server.respond() // call /test via button trigger=click
    var btn = byId('test-ext-testswap')
    btn.textContent.should.equal('Clicked!')
    loadCalls.length.should.equal(1)
    loadCalls[0].textContent.should.equal('Clicked!') // the new button is loaded

    this.server.respond() // call /test-inner via span trigger=load
    btn.textContent.should.equal('Clicked!Loaded!')
    loadCalls.length.should.equal(1) // text should not trigger event
  })
})
