describe('hx-push-url attribute', function() {
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

  it('navigation should push an element into the cache when true', function() {
    this.server.respondWith('GET', '/test', 'second')
    getWorkArea().innerHTML.should.be.equal('')
    var div = make('<div hx-push-url="true" hx-get="/test">first</div>')
    div.click()
    this.server.respond()
    div.click()
    this.server.respond()
    getWorkArea().textContent.should.equal('second')
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache[cache.length - 1].url.should.equal('/test')
  })

  it('navigation should push an element into the cache when string', function() {
    this.server.respondWith('GET', '/test', 'second')
    getWorkArea().innerHTML.should.be.equal('')
    var div = make('<div hx-push-url="/abc123" hx-get="/test">first</div>')
    div.click()
    this.server.respond()
    div.click()
    this.server.respond()
    getWorkArea().textContent.should.equal('second')
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(2)
    cache[1].url.should.equal('/abc123')
  })

  it('restore should return old value', function() {
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

    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))

    cache.length.should.equal(2)
    htmx._('restoreHistory')('/test1')
    getWorkArea().textContent.should.equal('test1')
  })

  it('history restore should not have htmx support classes in content', function() {
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

    htmx._('restoreHistory')('/test1')
    getWorkArea().getElementsByClassName('htmx-request').length.should.equal(0)
  })

  it('cache should only store 10 entries', function() {
    var x = 0
    this.server.respondWith('GET', /test.*/, function(xhr) {
      x++
      xhr.respond(200, {}, '<div id="d1" hx-push-url="true" hx-get="/test' + x + '" hx-swap="outerHTML settle:0"></div>')
    })
    getWorkArea().innerHTML.should.be.equal('')
    make('<div id="d1" hx-push-url="true" hx-get="/test" hx-swap="outerHTML settle:0"></div>')
    for (var i = 0; i < 20; i++) { // issue 20 requests
      byId('d1').click()
      this.server.respond()
    }
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(10) // should only be 10 elements
  })

  it('cache miss should issue another GET', function() {
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

    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))

    cache.length.should.equal(2)
    localStorage.removeItem(HTMX_HISTORY_CACHE_NAME) // clear cache
    htmx._('restoreHistory')('/test1')
    this.server.respond()
    getWorkArea().textContent.should.equal('test1')
  })

  it('navigation should push an element into the cache  w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', 'second')
    getWorkArea().innerHTML.should.be.equal('')
    var div = make('<div data-hx-push-url="true" data-hx-get="/test">first</div>')
    div.click()
    this.server.respond()
    getWorkArea().textContent.should.equal('second')
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(1)
  })

  it('deals with malformed JSON in history cache when getting', function() {
    localStorage.setItem(HTMX_HISTORY_CACHE_NAME, 'Invalid JSON')
    var history = htmx._('getCachedHistory')('url')
    should.equal(history, null)
  })

  it('deals with malformed JSON in history cache when saving', function() {
    localStorage.setItem(HTMX_HISTORY_CACHE_NAME, 'Invalid JSON')
    htmx._('saveToHistoryCache')('url', make('<div>'))
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(1)
  })

  it('does not blow out cache when saving a URL twice', function() {
    htmx._('saveToHistoryCache')('url1', make('<div>'))
    htmx._('saveToHistoryCache')('url2', make('<div>'))
    htmx._('saveToHistoryCache')('url3', make('<div>'))
    htmx._('saveToHistoryCache')('url2', make('<div>'))
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(3)
  })

  it('history cache is LRU', function() {
    htmx._('saveToHistoryCache')('url1', make('<div>'))
    htmx._('saveToHistoryCache')('url2', make('<div>'))
    htmx._('saveToHistoryCache')('url3', make('<div>'))
    htmx._('saveToHistoryCache')('url2', make('<div>'))
    htmx._('saveToHistoryCache')('url1', make('<div>'))
    var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME))
    cache.length.should.equal(3)
    cache[0].url.should.equal('url3')
    cache[1].url.should.equal('url2')
    cache[2].url.should.equal('url1')
  })

  it('htmx:afterSettle is called when replacing outerHTML', function() {
    var called = false
    var handler = htmx.on('htmx:afterSettle', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterSettle', handler)
    }
  })

  it('should include parameters on a get', function() {
    var path = ''
    var handler = htmx.on('htmx:pushedIntoHistory', function(evt) {
      path = evt.detail.path
    })
    try {
      this.server.respondWith('GET', /test.*/, function(xhr) {
        xhr.respond(200, {}, 'second')
      })
      var form = make('<form hx-trigger="click" hx-push-url="true" hx-get="/test"><input type="hidden" name="foo" value="bar"/>first</form>')
      form.click()
      this.server.respond()
      form.textContent.should.equal('second')
      path.should.equal('/test?foo=bar')
    } finally {
      htmx.off('htmx:pushedIntoHistory', handler)
    }
  })

  it('saveToHistoryCache should not throw', function() {
    var bigContent = 'Dummy'
    for (var i = 0; i < 20; i++) {
      bigContent += bigContent
    }
    try {
      localStorage.removeItem('htmx-history-cache')
      htmx._('saveToHistoryCache')('/dummy', make('<div>' + bigContent + '</div>'), 'Foo', 0)
      should.equal(localStorage.getItem('htmx-history-cache'), null)
    } finally {
      // clear history cache afterwards
      localStorage.removeItem('htmx-history-cache')
    }
  })
})
