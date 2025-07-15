describe('hx-history attribute', function() {
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

  it('content of hx-history-elt is used during history replacment', function() {
    this.server.respondWith('GET', '/test1', '<div id="d2" hx-push-url="true" hx-get="/test2" hx-swap="outerHTML settle:0">test1</div>')
    this.server.respondWith('GET', '/test2', '<div id="d3" hx-push-url="true" hx-get="/test3" hx-swap="outerHTML settle:0">test2</div>')

    make('<div id="d1" hx-push-url="true" hx-get="/test1" hx-swap="outerHTML settle:0">init</div>')

    byId('d1').click()
    this.server.respond()
    var workArea = getWorkArea()
    workArea.textContent.should.equal('test1')

    byId('d2').click()
    this.server.respond()
    workArea.textContent.should.equal('test2')

    this.server.respondWith('GET', '/test1', '<div>content outside of hx-history-elt not included</div><div id="work-area" hx-history-elt><div id="d2" hx-push-url="true" hx-get="/test2" hx-swap="outerHTML settle:0">test3</div></div>')
    // clear cache so it makes a full page request on history restore
    sessionStorage.removeItem(HTMX_HISTORY_CACHE_NAME)

    htmx._('restoreHistory')('/test1')
    this.server.respond()
    getWorkArea().textContent.should.equal('test3')
  })
})
