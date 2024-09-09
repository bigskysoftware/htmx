describe('hx-history attribute', function() {
  var HTMX_HISTORY_CACHE_NAME = 'htmx-history-cache'

  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
    localStorage.removeItem(HTMX_HISTORY_CACHE_NAME)
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
    localStorage.removeItem(HTMX_HISTORY_CACHE_NAME)
  })

  it('history cache should not contain embargoed content', function() {
    this.server.respondWith('GET', '/test1', '<div id="d2" hx-push-url="true" hx-get="/test2" hx-swap="outerHTML settle:0" hx-history="true">test1</div>')
    this.server.respondWith('GET', '/test2', '<div id="d3" hx-push-url="true" hx-get="/test3" hx-swap="outerHTML settle:0" hx-history="false">test2</div>')
    this.server.respondWith('GET', '/test3', '<div id="d4" hx-push-url="true" hx-get="/test3" hx-swap="outerHTML settle:0" hx-history="true">test3</div>')

    make('<div id="d1" hx-push-url="true" hx-get="/test1" hx-swap="outerHTML settle:0">init</div>')

    byId('d1').click()
    this.server.respond()
    var workArea = getWorkArea()
    workArea.textContent.should.equal('test1')

    byId('d2').click()
    this.server.respond()
    workArea.textContent.should.equal('test2')

    byId('d3').click()
    this.server.respond()
    workArea.textContent.should.equal('test3')

    // embargoed content should NOT be in the localStorage cache
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(2)

    // on history navigation, embargoed content is retrieved from server
    htmx._('restoreHistory')('/test2')
    this.server.respond()
    getWorkArea().textContent.should.equal('test2')
  })
})
