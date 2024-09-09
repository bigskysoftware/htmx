describe('hx-disinherit attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('basic inheritance sanity-check', function() {
    var response_inner = '<div id="snowflake" class="">Hello world</div>'
    var response = '<div id="unique" class="">' + response_inner + '</div>'
    this.server.respondWith('GET', '/test', response)

    var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="outerHTML"><button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button></div>')
    var btn = byId('bx1')
    btn.click()
    this.server.respond()
    btn.firstChild.id.should.equal('snowflake')
    btn.innerText.should.equal('Hello world')
  })

  it('disinherit exclude single attribute', function() {
    var response_inner = '<div id="snowflake">Hello world</div>'
    var response = '<div id="unique">' + response_inner + '</div>'
    this.server.respondWith('GET', '/test', response)

    var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="beforebegin" hx-disinherit="hx-select"><button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button></div>')
    var btn = byId('bx1')
    btn.click()
    this.server.respond()
    btn.firstChild.id.should.equal('unique')
    btn.firstChild.firstChild.id.should.equal('snowflake')
    btn.childNodes[1].innerText.should.equal('Click Me!')
  })

  it('disinherit exclude multiple attributes', function() {
    var response_inner = '<div id="snowflake">Hello world</div>'
    var response = '<div id="unique">' + response_inner + '</div>'
    this.server.respondWith('GET', '/test', response)

    var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="beforebegin" hx-disinherit="hx-select hx-swap">' +
            '  <button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button>' +
            '</div>')
    var btn = byId('bx1')
    btn.click()
    this.server.respond()
    console.log(btn.innerHTML)
    console.log(response)
    btn.firstChild.id.should.equal('cta')
    btn.firstChild.firstChild.id.should.equal('unique')
    btn.firstChild.firstChild.firstChild.id.should.equal('snowflake')
  })

  it('disinherit exclude all attributes', function() {
    var response_inner = '<div id="snowflake">Hello world</div>'
    var response = '<div id="unique">' + response_inner + '</div>'
    this.server.respondWith('GET', '/test', response)
    var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="beforebegin" hx-disinherit="*">' +
            '  <button id="bx1" hx-get="/test">' +
            '    <span id="cta">Click Me!</span>' +
            '  </button>' +
            '</div>')
    var btn = byId('bx1')
    btn.click()
    this.server.respond()
    btn.firstChild.id.should.equal('unique')
    btn.firstChild.firstChild.id.should.equal('snowflake')
  })

  it('same-element inheritance disable', function() {
    var response_inner = '<div id="snowflake" class="">Hello world</div>'
    var response = '<div id="unique">' + response_inner + '</div>'
    this.server.respondWith('GET', '/test', response)

    var btn = make('<button hx-select="#snowflake" hx-target="#container" hx-trigger="click" hx-get="/test" hx-swap="outerHTML" hx-disinherit="*"><div id="container"></div></button>')
    btn.click()
    this.server.respond()
    btn.firstChild.id.should.equal('snowflake')
    btn.firstChild.innerText.should.equal('Hello world')
  })

  it('same-element inheritance disable with child nodes', function() {
    var response_inner = '<div id="snowflake" class="">Hello world</div>'
    var response = '<div id="unique">' + response_inner + '</div>'
    this.server.respondWith('GET', '/test', response)
    this.server.respondWith('GET', '/test2', 'unique-snowflake')

    var div = make('<div hx-select="#snowflake" hx-target="#container" hx-get="/test" hx-swap="outerHTML" hx-trigger="keyup" hx-disinherit="*"><div id="container"><button id="bx1" hx-get="/test2" hx-trigger="click" hx-target="#target"><div id="target"></div></button></div></div>')
    var btn = byId('bx1')
    btn.click()
    this.server.respond()
    btn.firstChild.id.should.equal('target')
    btn.firstChild.innerText.should.equal('unique-snowflake')
    var count = (div.parentElement.innerHTML.match(/snowflake/g) || []).length
    count.should.equal(2) // hx-select of parent div and newly loaded inner content
  })

  it('boosted element hx-disinherit sanity check', function() {
    try {
      var request
      var handler = htmx.on('htmx:beforeRequest', function(evt) {
        request = evt
      })
      var div = make('<div hx-boost="true" hx-disinherit="false"><a id="a1" href="/test">Click me</a></div>')
      var link = byId('a1')
      link.click()
      // should match the fully resolved href of the boosted element
      should.equal(request.detail.requestConfig.path, '/test')
      should.equal(request.detail.elt['htmx-internal-data'].boosted, true)
    } finally {
      htmx.off('htmx:beforeRequest', handler)
    }
  })

  it('boosted element inheritance manual unset', function() {
    try {
      var request
      var handler = htmx.on('htmx:beforeRequest', function(evt) {
        request = evt
      })
      var div = make('<div hx-boost="true" hx-get="/test"><div hx-boost="unset"><a id="a1" href="/test">Click me</a></div></div>')
      var link = byId('a1')
      should.equal(link['htmx-internal-data'].boosted, undefined)
    } finally {
      htmx.off('htmx:beforeRequest', handler)
    }
  })

  it('nested htmx-node with boosting parent', function() {
    try {
      var request
      var handler = htmx.on('htmx:beforeRequest', function(evt) {
        request = evt
      })
      var div = make('<div hx-boost="true" hx-target="#test" hx-disinherit="*"><div id="test"></div><a id="a1" href="/test" hx-get="/test2">Click me</a></div>')
      var link = byId('a1')
      link.click()
      should.equal(request.detail.requestConfig.path, '/test2')
      should.equal(request.detail.elt['htmx-internal-data'].boosted, undefined)
      should.equal(request.detail.target.id, 'a1')
    } finally {
      htmx.off('htmx:beforeRequest', handler)
    }
  })
})
