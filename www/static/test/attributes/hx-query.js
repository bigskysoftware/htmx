describe('hx-query attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('issues a QUERY request', function() {
    this.server.respondWith('QUERY', '/test', function(xhr) {
      xhr.respond(200, {}, 'Queried!')
    })

    var btn = make('<button hx-query="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Queried!')
  })

  it('issues a QUERY request w/ data-* prefix', function() {
    this.server.respondWith('QUERY', '/test', function(xhr) {
      xhr.respond(200, {}, 'Queried!')
    })

    var btn = make('<button data-hx-query="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Queried!')
  })
})
