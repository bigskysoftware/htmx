describe('hx-prompt attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('hx-prompt should set request header to prompt response', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      should.equal(xhr.requestHeaders['HX-Prompt'], 'foo')
      xhr.respond(200, {}, 'Clicked!')
    })
    var promptSave = window.prompt
    window.prompt = function() { return 'foo' }
    var btn = make('<button hx-get="/test" hx-prompt="test prompt">Click Me!</a>')
    btn.click()
    this.server.respond()
    window.prompt = promptSave
    btn.innerHTML.should.equal('Clicked!')
  })

  it('hx-prompt that is cancled returns null and blocks the request', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Clicked!')
    })
    var promptSave = window.prompt
    window.prompt = function() { return null }
    var btn = make('<button hx-get="/test" hx-prompt="test prompt">Click Me!</a>')
    btn.click()
    this.server.respond()
    window.prompt = promptSave
    btn.innerHTML.should.equal('Click Me!')
  })
})
