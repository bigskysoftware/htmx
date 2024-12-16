describe('hx-headers attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('basic hx-headers works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-headers='\"i1\":\"test\"'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('basic hx-headers works with braces', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-headers='{\"i1\":\"test\"}'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('multiple hx-headers works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.v1.should.equal('test')
      xhr.requestHeaders.v2.should.equal('42')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-headers='\"v1\":\"test\", \"v2\":42'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers can be on parents', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make("<div hx-headers='\"i1\":\"test\"'><div id='d1' hx-post='/vars'></div></div>")
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers can override parents', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    make("<div hx-headers='\"i1\":\"test\"'><div id='d1' hx-headers='\"i1\":\"best\"' hx-post='/vars'></div></div>")
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers overrides inputs', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      xhr.requestHeaders.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-target='this'><input hx-post='/include' hx-headers='\"i1\":\"best\"' hx-trigger='click' id='i1' name='i1' value='test'/></div>")
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('basic hx-headers javascript: works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-headers="javascript:i1:\'test\'"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers works with braces', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-headers="javascript:{i1:\'test\'}"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('multiple hx-headers works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.v1.should.equal('test')
      xhr.requestHeaders.v2.should.equal('42')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-headers="javascript:v1:\'test\', v2:42"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers can be on parents', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div hx-headers="javascript:i1:\'test\'"><div id="d1" hx-post="/vars"></div></div>')
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers can override parents', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      xhr.requestHeaders.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div hx-headers="javascript:i1:\'test\'"><div id="d1" hx-headers="javascript:i1:\'best\'" hx-post="/vars"></div></div>')
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-headers overrides inputs', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      xhr.requestHeaders.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-target="this"><input hx-post="/include" hx-headers="javascript:i1:\'best\'" hx-trigger="click" id="i1" name="i1" value="test"/></div>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })
})
