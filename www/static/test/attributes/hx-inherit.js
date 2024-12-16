describe('hx-inherit attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
    htmx.config.disableInheritance = true
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
    htmx.config.disableInheritance = false
  })

  it('can disable inheritance', function() {
    this.server.respondWith('GET', '/test', 'Test')
    var div = make('<div hx-target="#cta">' +
            '<button id="btn1" hx-get="/test"></button>' +
            '<span id="cta">Click Me!</span>' +
            '</div>')
    var btn = byId('btn1')
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('Test')
  })

  it('can enable inheritance for all', function() {
    this.server.respondWith('GET', '/test', 'Test')
    var div = make('<div hx-target="#cta" hx-inherit="*">' +
            '<button id="btn1" hx-get="/test"></button>' +
            '<span id="cta">Click Me!</span>' +
            '</div>')
    var btn = byId('btn1')
    var span = byId('cta')
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('')
    span.innerText.should.equal('Test')
  })

  it('can enable inheritance by name', function() {
    this.server.respondWith('GET', '/test', 'Test')
    var div = make('<div hx-target="#cta" hx-inherit="hx-target">' +
            '<button id="btn1" hx-get="/test"></button>' +
            '<span id="cta">Click Me!</span>' +
            '</div>')
    var btn = byId('btn1')
    var span = byId('cta')
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('')
    span.innerText.should.equal('Test')
  })

  it('can enable inheritance by name (bad name, no inheritance)', function() {
    this.server.respondWith('GET', '/test', 'Test')
    var div = make('<div hx-target="#cta" hx-inherit="hx-swap">' +
            '<button id="btn1" hx-get="/test"></button>' +
            '<span id="cta">Click Me!</span>' +
            '</div>')
    var btn = byId('btn1')
    var span = byId('cta')
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('Test')
    span.innerText.should.equal('Click Me!')
  })

  it('can enable inheritance by name with multiple attributes', function() {
    this.server.respondWith('GET', '/test', 'Test')
    var div = make('<div hx-target="#cta" hx-swap="outerHTML" hx-inherit="hx-target hx-swap">' +
            '<button id="btn1" hx-get="/test"></button>' +
            '<div id="d2"><span id="cta">Click Me!</span></div>' +
            '</div>')
    var btn = byId('btn1')
    var div = byId('d2')
    btn.click()
    this.server.respond()
    div.innerHTML.should.equal('Test')
  })
})
