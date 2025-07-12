describe('hx-boost attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('handles basic anchor properly', function() {
    this.server.respondWith('GET', '/test', 'Boosted')
    var div = make('<div hx-target="this" hx-boost="true"><a id="a1" href="/test">Foo</a></div>')
    var a = byId('a1')
    a.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('handles basic form post properly', function() {
    this.server.respondWith('POST', '/test', 'Boosted')
    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test" method="post"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('handles basic form post with button formaction properly', function() {
    this.server.respondWith('POST', '/test', 'Boosted')
    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" method="post"><button id="b1" formaction="/test">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('handles basic form post with button formmethod properly', function() {
    this.server.respondWith('POST', '/test', 'Boosted')
    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test"><button id="b1" formmethod="post">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('handles basic form post properly w/ explicit action', function() {
    this.server.respondWith('POST', '/test', 'Boosted')
    var div = make('<div hx-target="this"><form id="f1" action="/test" method="post"  hx-trigger="click" hx-boost="true"></form></div>')
    var form = byId('f1')
    form.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('handles basic form get properly', function() {
    this.server.respondWith('GET', '/test', 'Boosted')
    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test" method="get"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('handles basic form with no explicit method property', function() {
    this.server.respondWith('GET', '/test', 'Boosted')
    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('does not boost forms with method="dialog"', function() {
    make('<div hx-boost="true"><form id="f1" action="/test" method="dialog"><button id="b1">close</button></form></div>')
    var form = byId('f1')

    var internalData = htmx._('getInternalData')(form)
    should.equal(undefined, internalData.boosted)
  })

  it('handles basic anchor properly w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', 'Boosted')
    var div = make('<div data-hx-target="this" data-hx-boost="true"><a id="a1" href="/test">Foo</a></div>')
    var a = byId('a1')
    a.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted')
  })

  it('overriding default swap style does not effect boosting', function() {
    htmx.config.defaultSwapStyle = 'afterend'
    try {
      this.server.respondWith('GET', '/test', 'Boosted')
      var a = make('<a hx-target="this" hx-boost="true" id="a1" href="/test">Foo</a>')
      a.click()
      this.server.respond()
      a.innerHTML.should.equal('Boosted')
    } finally {
      htmx.config.defaultSwapStyle = 'innerHTML'
    }
  })

  it('anchors w/ explicit targets are not boosted', function() {
    var a = make('<a hx-target="this" hx-boost="true" id="a1" href="/test" target="_blank">Foo</a>')
    var internalData = htmx._('getInternalData')(a)
    should.equal(undefined, internalData.boosted)
  })

  it('includes an HX-Boosted Header', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      should.equal(xhr.requestHeaders['HX-Boosted'], 'true')
      xhr.respond(200, {}, 'Boosted!')
    })

    var btn = make('<a hx-boost="true" hx-target="this" href="/test">Click Me!</a>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Boosted!')
  })

  it('form get w/ search params in action property excludes search params', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      should.equal(undefined, getParameters(xhr).foo)
      xhr.respond(200, {}, 'Boosted!')
    })

    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test?foo=bar" method="get"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted!')
  })

  it('form post w/ query params in action property uses full url', function() {
    this.server.respondWith('POST', /\/test.*/, function(xhr) {
      should.equal(undefined, getParameters(xhr).foo)
      xhr.respond(200, {}, 'Boosted!')
    })
    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="/test?foo=bar" method="post"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted!')
  })

  it('form get with an unset action properly submits', function() {
    this.server.respondWith('GET', /\/*/, function(xhr) {
      xhr.respond(200, {}, 'Boosted!')
    })

    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" method="get"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted!')
  })

  it('form get with no action properly clears existing parameters on submit', function() {
    /// add a foo=bar to the current url
    var path = location.href
    if (!path.includes('foo=bar')) {
      if (!path.includes('?')) {
        path += '?foo=bar'
      } else {
        path += '&foo=bar'
      }
    }
    history.replaceState({ htmx: true }, '', path)

    this.server.respondWith('GET', /\/*/, function(xhr) {
      // foo should not be present because the form is a get with no action
      should.equal(undefined, getParameters(xhr).foo)
      xhr.respond(200, {}, 'Boosted!')
    })

    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" method="get"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted!')
  })

  it('form get with an empty action properly clears existing parameters on submit', function() {
    /// add a foo=bar to the current url
    var path = location.href
    if (!path.includes('foo=bar')) {
      if (!path.includes('?')) {
        path += '?foo=bar'
      } else {
        path += '&foo=bar'
      }
    }
    history.replaceState({ htmx: true }, '', path)

    this.server.respondWith('GET', /\/*/, function(xhr) {
      // foo should not be present because the form is a get with no action
      should.equal(undefined, getParameters(xhr).foo)
      xhr.respond(200, {}, 'Boosted!')
    })

    var div = make('<div hx-target="this" hx-boost="true"><form id="f1" action="" method="get"><button id="b1">Submit</button></form></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Boosted!')
  })

  if (window.__playwright__binding__ && /chrome/i.test(navigator.userAgent)) {
    it('ctrlKey mouse click does not boost', function() {
      // Test only works well in playwright with chome for code coverage as otherwise it opens a new tab breaking things
      this.server.respondWith('GET', '/test', 'Boosted')
      var div = make('<div hx-target="this" hx-boost="true"><a id="a1" href="/test">Foo</a></div>')
      var a = byId('a1')
      var evt = new MouseEvent('click', { ctrlKey: true })
      a.dispatchEvent(evt)
      this.server.respond()
      div.innerHTML.should.not.equal('Boosted')
    })
  }
})
