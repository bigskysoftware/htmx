describe('hx-indicator attribute', function() {
  beforeEach(function() {
    this.server = sinon.fakeServer.create()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('Indicator classes are properly put on element with no explicit indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
  })

  it('Indicator classes are properly put on element with explicit indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var btn = make('<button hx-get="/test" hx-indicator="#a1, #a2">Click Me!</button>')
    var a1 = make('<a id="a1"></a>')
    var a2 = make('<a id="a2"></a>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)
    a2.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
    a2.classList.contains('htmx-request').should.equal(false)
  })

  it('Indicator classes are properly put on element with relative indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var btn = make('<button hx-get="/test" hx-indicator="next a">Click Me!</button>')
    var a1 = make('<a id="a1"></a>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
  })

  it('Indicator classes are properly put on element with explicit indicator w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var btn = make('<button hx-get="/test" data-hx-indicator="#a1, #a2">Click Me!</button>')
    var a1 = make('<a id="a1"></a>')
    var a2 = make('<a id="a2"></a>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)
    a2.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
    a2.classList.contains('htmx-request').should.equal(false)
  })

  it('allows closest syntax in hx-indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make('<div id="d1"><button id="b1" hx-get="/test" hx-indicator="closest div">Click Me!</button></div>')
    var btn = byId('b1')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    div.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    div.classList.contains('htmx-request').should.equal(false)
  })

  it('is removed when initiating element is removed from the DOM', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var indicator = make('<div id="ind1">Indicator</div>')
    var div = make('<div id="d1" hx-target="this" hx-indicator="#ind1"><button id="b1" hx-get="/test">Click Me!</button></div>')
    var btn = byId('b1')
    btn.click()
    indicator.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    indicator.classList.contains('htmx-request').should.equal(false)
  })

  it('allows this syntax in hx-indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make('<div id="d1" hx-indicator="this"><button id="b1" hx-get="/test">Click Me!</button></div>')
    var btn = byId('b1')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    div.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    div.classList.contains('htmx-request').should.equal(false)
  })

  it('multiple requests with same indicator are handled properly', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var b1 = make('<button hx-get="/test" hx-indicator=".a1">Click Me!</button>')
    var b2 = make('<button hx-get="/test" hx-indicator=".a1">Click Me!</button>')
    var a1 = make('<a class="a1"></a>')

    b1.click()
    b1.classList.contains('htmx-request').should.equal(false)
    b2.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)

    b2.click()
    b1.classList.contains('htmx-request').should.equal(false)
    b2.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)

    // hack to make sinon process only one response
    this.server.processRequest(this.server.queue.shift())

    b1.classList.contains('htmx-request').should.equal(false)
    b2.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)

    this.server.respond()

    b1.classList.contains('htmx-request').should.equal(false)
    b2.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
  })

  it('`inherit` can be used to expand parent hx-indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    make('<div hx-indicator="#a1">' +
      '   <button id="btn" hx-get="/test" hx-indicator="inherit, #a2">Click Me!</button>' +
      '</div>')
    var btn = byId('btn')
    var a1 = make('<a id="a1"></a>')
    var a2 = make('<a id="a2"></a>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)
    a2.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
    a2.classList.contains('htmx-request').should.equal(false)
  })

  it('`inherit` can be used to expand multiple parents hx-indicator', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    make('<div hx-indicator="#a1">' +
      '   <div hx-indicator="inherit, #a2">' +
      '       <button id="btn" hx-get="/test" hx-indicator="inherit, #a3">Click Me!</button>' +
      '   </div>' +
      '</div>')
    var btn = byId('btn')
    var a1 = make('<a id="a1"></a>')
    var a2 = make('<a id="a2"></a>')
    var a3 = make('<a id="a3"></a>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(true)
    a2.classList.contains('htmx-request').should.equal(true)
    a3.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
    a2.classList.contains('htmx-request').should.equal(false)
    a3.classList.contains('htmx-request').should.equal(false)
  })

  it('`inherit` chain breaks properly', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    make('<div hx-indicator="#a1">' +
      '   <div hx-indicator="#a2">' +
      '       <button id="btn" hx-get="/test" hx-indicator="inherit, #a3">Click Me!</button>' +
      '   </div>' +
      '</div>')
    var btn = byId('btn')
    var a1 = make('<a id="a1"></a>')
    var a2 = make('<a id="a2"></a>')
    var a3 = make('<a id="a3"></a>')
    btn.click()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
    a2.classList.contains('htmx-request').should.equal(true)
    a3.classList.contains('htmx-request').should.equal(true)
    this.server.respond()
    btn.classList.contains('htmx-request').should.equal(false)
    a1.classList.contains('htmx-request').should.equal(false)
    a2.classList.contains('htmx-request').should.equal(false)
    a3.classList.contains('htmx-request').should.equal(false)
  })
})
