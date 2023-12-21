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
})
