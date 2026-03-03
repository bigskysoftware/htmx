describe('BOOTSTRAP - htmx AJAX Tests', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('properly handles a partial of HTML', function() {
    var i = 1
    this.server.respondWith('GET', '/test', "<div id='d1'>foo</div><div id='d2'>bar</div>")
    var div = make('<div hx-get="/test" hx-select="#d1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('<div id="d1">foo</div>')
  })

  it('properly handles a full HTML document', function() {
    var i = 1
    this.server.respondWith('GET', '/test', "<html><body><div id='d1'>foo</div><div id='d2'>bar</div></body></html>")
    var div = make('<div hx-get="/test" hx-select="#d1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('<div id="d1">foo</div>')
  })

  it('properly handles a full HTML document  w/ data-* prefix', function() {
    var i = 1
    this.server.respondWith('GET', '/test', "<html><body><div id='d1'>foo</div><div id='d2'>bar</div></body></html>")
    var div = make('<div hx-get="/test" data-hx-select="#d1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('<div id="d1">foo</div>')
  })
})
