describe('htmx config test', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })

  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('swaps normally with no config update', function() {
    var responseCode = null
    this.server.respondWith('GET', '/test', function(xhr, id) {
      xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '' + responseCode)
    })

    responseCode = 200 // 200 should cause a swap by default
    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('200')

    responseCode = 204 // 204 should not cause a swap by default
    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Click Me!')

    responseCode = 300 // 300 should cause a swap by default
    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('300')

    responseCode = 400 // 400 should not cause a swap by default
    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Click Me!')

    responseCode = 500 // 500 should not cause a swap by default
    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Click Me!')
  })

  it('swap all config should swap everything', function() {
    var originalResponseHandling = htmx.config.responseHandling
    try {
      htmx.config.responseHandling = [{ code: '...', swap: true }]

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '' + responseCode)
      })

      responseCode = 200 // 200 should cause a swap by default
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('200')

      responseCode = 203 // 203 should not cause a swap by default
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('203')

      responseCode = 300 // 300 should cause a swap by default
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('300')

      responseCode = 400 // 400 should not cause a swap by default
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('400')

      responseCode = 500 // 500 should not cause a swap by default
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('500')
    } finally {
      htmx.config.responseHandling = originalResponseHandling
    }
  })

  it('can change the target of a given response code', function() {
    var originalResponseHandling = htmx.config.responseHandling
    try {
      htmx.config.responseHandling = originalResponseHandling.slice()
      htmx.config.responseHandling.unshift({ code: '444', swap: true, target: '#a-div' })

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '' + responseCode)
      })

      responseCode = 444
      var div = make('<div id="a-div">Another Div</div>')
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('Click Me!')
      div.innerHTML.should.equal('444')
    } finally {
      htmx.config.responseHandling = originalResponseHandling
    }
  })

  it('can change the swap type of a given response code', function() {
    var originalResponseHandling = htmx.config.responseHandling
    try {
      htmx.config.responseHandling = originalResponseHandling.slice()
      htmx.config.responseHandling.unshift({ code: '444', swap: true, target: '#a-div', swapOverride: 'outerHTML' })

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '' + responseCode)
      })

      responseCode = 444
      var div = make('<div><div id="a-div">Another Div</div></div>')
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('Click Me!')
      div.innerHTML.should.equal('444')
    } finally {
      htmx.config.responseHandling = originalResponseHandling
    }
  })

  it('can change the select of a given response code', function() {
    var originalResponseHandling = htmx.config.responseHandling
    try {
      htmx.config.responseHandling = originalResponseHandling.slice()
      htmx.config.responseHandling.unshift({ code: '444', swap: true, select: '.foo' })

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, "<div><a class='foo'>" + responseCode + '</a></div>')
      })

      responseCode = 444
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('<a class="foo">444</a>')
    } finally {
      htmx.config.responseHandling = originalResponseHandling
    }
  })

  it('can change if the title is ignored for a given response code', function() {
    var originalResponseHandling = htmx.config.responseHandling
    var originalTitle = document.title
    try {
      htmx.config.responseHandling = originalResponseHandling.slice()
      htmx.config.responseHandling.unshift({ code: '444', swap: true, ignoreTitle: true })

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '<title>Should Not Be Set</title>' + responseCode)
      })

      responseCode = 444
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('444')
      document.title.should.equal(originalTitle)
    } finally {
      htmx.config.responseHandling = originalResponseHandling
    }
  })

  it('can change if error for a given response code', function() {
    var originalResponseHandling = htmx.config.responseHandling
    var errorDetected = false
    var handler = htmx.on('htmx:responseError', function() {
      errorDetected = true
    })
    try {
      htmx.config.responseHandling = originalResponseHandling.slice()
      htmx.config.responseHandling.unshift({ code: '444', swap: true, error: false })

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '' + responseCode)
      })

      responseCode = 444
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('444')
      errorDetected.should.equal(false)
    } finally {
      htmx.off('htmx:responseError', handler)
      htmx.config.responseHandling = originalResponseHandling
    }
  })

  it('can trigger an event for a given response code', function() {
    var originalResponseHandling = htmx.config.responseHandling
    var myEventWasTriggered = false
    var handler = htmx.on('myEvent', function() {
      myEventWasTriggered = true
    })
    try {
      htmx.config.responseHandling = originalResponseHandling.slice()
      htmx.config.responseHandling.unshift({ code: '444', swap: false, error: false, event: 'myEvent' })

      var responseCode = null
      this.server.respondWith('GET', '/test', function(xhr, id) {
        xhr.respond(responseCode, { 'Content-Type': 'text/html' }, '' + responseCode)
      })

      responseCode = 444
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('Click Me!')
      myEventWasTriggered.should.equal(true)
    } finally {
      htmx.off('htmx:responseError', handler)
      htmx.config.responseHandling = originalResponseHandling
    }
  })
})
