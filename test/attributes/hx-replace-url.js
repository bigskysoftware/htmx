describe('hx-replace-url attribute', function() {
  var HTMX_HISTORY_CACHE_NAME = 'htmx-history-cache'

  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
    sessionStorage.removeItem(HTMX_HISTORY_CACHE_NAME)
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
    sessionStorage.removeItem(HTMX_HISTORY_CACHE_NAME)
  })

  it('navigation should replace an element into the cache when true', function() {
    this.server.respondWith('GET', '/test', 'second')
    getWorkArea().innerHTML.should.be.equal('')
    var div = make('<div hx-replace-url="true" hx-get="/test">first</div>')
    div.click()
    this.server.respond()
    div.click()
    this.server.respond()
    getWorkArea().textContent.should.equal('second')
    var cache = JSON.parse(sessionStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache[cache.length - 1].url.should.equal('/test')
  })

  it('should handle HX-Replace-Url response header', function() {
    var path
    var handler = htmx.on('htmx:replacedInHistory', function(event) {
      path = event.detail.path
    })
    this.server.respondWith('GET', '/test', [200, { 'HX-Replace-Url': '/pushpath' }, 'Result'])
    var div1 = make('<div id="d1" hx-get="/test"></div>')
    div1.click()
    this.server.respond()
    div1.innerHTML.should.equal('Result')
    var cache = JSON.parse(sessionStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(1)
    path.should.equal('/pushpath')
    htmx.off('htmx:replacedInHistory', handler)
  })
})
