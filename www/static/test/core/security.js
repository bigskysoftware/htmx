describe('security options', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('can disable a single elt', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button hx-disable hx-get="/test">Initial</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Initial')
  })

  it('can disable a parent elt', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var div = make('<div hx-disable><button id="b1" hx-get="/test">Initial</button></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Initial')
  })

  it('can disable a child elt', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var div = make('<div><button id="b1" hx-disable hx-get="/test">Initial</button></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Initial')
  })

  it('can disable a single elt dynamically', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button id="b1" hx-get="/test">Initial</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    this.server.respondWith('GET', '/test', 'Clicked a second time')

    btn.setAttribute('hx-disable', '')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('can disable a single elt dynamically & enable it back', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button id="b1" hx-get="/test">Initial</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    this.server.respondWith('GET', '/test', 'Clicked a second time')

    btn.setAttribute('hx-disable', '')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    btn.removeAttribute('hx-disable')
    htmx.process(btn)
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked a second time')
  })

  it('can disable a single a tag dynamically & enable it back with boost', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<a id="b1" hx-boost="true" href="/test" hx-target="this">Initial</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    this.server.respondWith('GET', '/test', 'Clicked a second time')

    btn.setAttribute('hx-disable', '')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    btn.removeAttribute('hx-disable')
    htmx.process(btn)
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked a second time')
  })

  it('can disable a single parent elt dynamically', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var div = make('<div><button id="b1" hx-get="/test">Initial</button></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    this.server.respondWith('GET', '/test', 'Clicked a second time')

    div.setAttribute('hx-disable', '')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('can disable a single parent elt dynamically & enable it back', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var div = make('<div><button id="b1" hx-get="/test">Initial</button></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    this.server.respondWith('GET', '/test', 'Clicked a second time')

    div.setAttribute('hx-disable', '')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')

    div.removeAttribute('hx-disable')
    htmx.process(div)
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked a second time')
  })

  it('can make egress cross site requests when htmx.config.selfRequestsOnly is disabled', function(done) {
    this.timeout(4000)
    htmx.config.selfRequestsOnly = false
    // should trigger send error, rather than reject
    var listener = htmx.on('htmx:sendError', function() {
      htmx.config.selfRequestsOnly = true
      htmx.off('htmx:sendError', listener)
      done()
    })
    this.server.restore() // use real xhrs
    // will 404, but should respond
    var btn = make('<button hx-get="https://hypermedia.systems/www/test">Initial</button>')
    btn.click()
  })

  it('can make a real local data uri request when selfRequestOnly false', function(done) {
    htmx.config.selfRequestsOnly = false
    var pathVerifier = htmx.on('htmx:validateUrl', function(evt) {
      if (evt.detail.sameHost === false && evt.detail.url.protocol !== 'data:') {
        evt.preventDefault()
      }
    })
    this.server.restore() // use real xhrs
    var btn = make('<button hx-get="data:,foo">Initial</button>')
    btn.click()
    htmx.config.selfRequestsOnly = true
    setTimeout(function() {
      htmx.off('htmx:validateUrl', pathVerifier)
      btn.innerHTML.should.equal('foo')
      done()
    }, 30)
  })

  it('can disable hx-on on a single elt', function() {
    var btn = make("<button hx-disable hx-on:click='window.foo = true'>Foo</button>")
    btn.click()
    should.equal(window.foo, undefined)
    delete window.foo
  })

  it('can disable hx-on on a parent elt', function() {
    var div = make("<div hx-disable><button id='b1' hx-on:click='window.foo = true'>Foo</button></div>")
    var btn = byId('b1')
    btn.click()
    should.equal(window.foo, undefined)
    delete window.foo
  })

  it('can disable hx-on on a single elt dynamically', function() {
    var btn = make("<button hx-on:click='window.foo = true'>Foo</button>")
    btn.click()
    should.equal(window.foo, true)
    delete window.foo

    btn.setAttribute('hx-disable', '')

    btn.click()
    should.equal(window.foo, undefined)
    delete window.foo
  })

  it('can disable hx-on on a parent elt dynamically', function() {
    var div = make("<div><button id='b1' hx-on:click='window.foo = true'>Foo</button></div>")
    var btn = byId('b1')
    btn.click()
    should.equal(window.foo, true)
    delete window.foo

    div.setAttribute('hx-disable', '')

    btn.click()
    should.equal(window.foo, undefined)
    delete window.foo
  })

  it("can't make egress cross site requests when htmx.config.selfRequestsOnly is true", function(done) {
    this.timeout(4000)
    // should trigger send error, rather than reject
    var listener = htmx.on('htmx:invalidPath', function() {
      htmx.off('htmx:invalidPath', listener)
      done()
    })
    this.server.restore() // use real xhrs
    // will 404, but should respond
    var btn = make('<button hx-get="https://hypermedia.systems/www/test">Initial</button>')
    btn.click()
  })

  it('can cancel egress request based on htmx:validateUrl event', function(done) {
    this.timeout(4000)
    htmx.config.selfRequestsOnly = false
    // should trigger send error, rather than reject
    var pathVerifier = htmx.on('htmx:validateUrl', function(evt) {
      evt.preventDefault()
    })
    var listener = htmx.on('htmx:invalidPath', function() {
      htmx.off('htmx:invalidPath', listener)
      htmx.off('htmx:validateUrl', pathVerifier)
      done()
    })
    this.server.restore() // use real xhrs
    // will 404, but should respond
    var btn = make('<button hx-get="https://hypermedia.systems/www/test">Initial</button>')
    btn.click()
    htmx.config.selfRequestsOnly = true
  })

  it('can cancel egress request based on htmx:validateUrl event, sameHost is false', function(done) {
    this.timeout(4000)
    htmx.config.selfRequestsOnly = false
    // should trigger send error, rather than reject
    var pathVerifier = htmx.on('htmx:validateUrl', function(evt) {
      if (evt.detail.sameHost === false) {
        evt.preventDefault()
      }
    })
    var listener = htmx.on('htmx:invalidPath', function() {
      htmx.off('htmx:validateUrl', pathVerifier)
      htmx.off('htmx:invalidPath', listener)
      done()
    })
    this.server.restore() // use real xhrs
    // will 404, but should respond
    var btn = make('<button hx-get="https://hypermedia.systems/www/test">Initial</button>')
    btn.click()
    htmx.config.selfRequestsOnly = true
  })

  it('can cancel egress request based on htmx:validateUrl event and then allow a request', function(done) {
    htmx.config.selfRequestsOnly = false
    var requestCount = 0
    var pathVerifier = htmx.on('htmx:validateUrl', function(evt) {
      requestCount = requestCount + 1
      if (requestCount === 1) {
        evt.preventDefault()
      }
    })
    this.server.restore() // use real xhrs
    var btn = make('<button hx-get="data:,foo">Initial</button>')
    btn.click()
    setTimeout(function() {
      btn.innerHTML.should.not.equal('foo')
      btn.click()
      setTimeout(function() {
        htmx.off('htmx:validateUrl', pathVerifier)
        htmx.config.selfRequestsOnly = true
        btn.innerHTML.should.equal('foo')
        done()
      }, 30)
    }, 30)
  })

  it('can disable script tag support with htmx.config.allowScriptTags', function() {
    var globalWasCalled = false
    window.callGlobal = function() {
      globalWasCalled = true
    }
    try {
      htmx.config.allowScriptTags = false
      this.server.respondWith('GET', '/test', '<div><script>callGlobal()</script></div>')
      var div = make("<div hx-get='/test'></div>")
      div.click()
      this.server.respond()
      globalWasCalled.should.equal(false)
    } finally {
      htmx.config.allowScriptTags = true
      delete window.callGlobal
    }
  })
})
