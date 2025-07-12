describe('hx-request attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('basic hx-request timeout works', function(done) {
    var timedOut = false
    htmx.config.selfRequestsOnly = false
    var div = make("<div hx-post='https://hypermedia.systems/www/test' hx-request='\"timeout\":1'></div>")
    htmx.on(div, 'htmx:timeout', function() {
      timedOut = true
    })
    this.server.restore() // use real xhrs
    div.click()
    setTimeout(function() {
      htmx.config.selfRequestsOnly = true
      div.innerHTML.should.equal('')
      timedOut.should.equal(true)
      done()
    }, 30)
  })

  it('hx-request header works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      should.equal(xhr.requestHeaders['HX-Request'], undefined)
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-request='{\"noHeaders\":true}'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })
})
