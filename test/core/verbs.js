describe('Core htmx AJAX Verbs', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('handles basic posts properly', function() {
    this.server.respondWith('POST', '/test', 'post')
    var div = make('<div hx-post="/test">click me</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('post')
  })

  it('handles basic put properly', function() {
    this.server.respondWith('PUT', '/test', 'put')
    var div = make('<div hx-put="/test">click me</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('put')
  })

  it('handles basic patch properly', function() {
    this.server.respondWith('PATCH', '/test', 'patch')
    var div = make('<div hx-patch="/test">click me</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('patch')
  })

  it('handles basic delete properly', function() {
    this.server.respondWith('DELETE', '/test', 'delete')
    var div = make('<div hx-delete="/test">click me</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('delete')
  })
})
