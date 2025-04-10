describe('hx-include attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('By default an input includes itself', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-target="this"><input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/></div>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('non-GET includes closest form', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<form hx-target="this"><div id="d1" hx-post="/include"></div><input name="i1" value="test"/></form>')
    var input = byId('d1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('non-GET includes closest form and overrides values included that exist outside the form', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-include="*" hx-target="this">' +
            '<input name="i1" value="before"/>' +
            '<form><div id="d1" hx-post="/include"></div><input name="i1" value="test"/></form>' +
            '<input name="i1" value="after"/>')
    var input = byId('d1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('GET does not include closest form by default', function() {
    this.server.respondWith('GET', '/include', function(xhr) {
      var params = getParameters(xhr)
      should.equal(params.i1, undefined)
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<form hx-target="this"><div id="d1" hx-get="/include"></div><input name="i1" value="test"/></form>')
    var input = byId('d1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Single input not included twice when in form', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<form hx-target="this"><input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/></form>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Two inputs are included twice when they have the same name', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.deep.equal(['test', 'test2'])
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-include="*" hx-target="this">' +
            '<input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/>' +
            '<input name="i1" value="test2"/>' +
            '</div>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Two inputs are included twice when in form when they have the same name', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.deep.equal(['test', 'test2'])
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<form hx-target="this">' +
            '<input hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/>' +
            '<input name="i1" value="test2"/>' +
            '</form>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Input not included twice when it explicitly refers to parent form', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<form id="f1" hx-target="this">' +
            '<input hx-include="#f1" hx-post="/include" hx-trigger="click" id="i1" name="i1" value="test"/>' +
            '</form>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Input can be referred to externally', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<input id="i1" name="i1" value="test"/>')
    var div = make('<div hx-post="/include" hx-include="#i1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Two inputs can be referred to externally', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<input id="i1" name="i1" value="test"/>')
    make('<input id="i2" name="i2" value="test"/>')
    var div = make('<div hx-post="/include" hx-include="#i1, #i2"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('A form can be referred to externally', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<form id="f1">' +
            '<input name="i1" value="test"/>' +
            '<input  name="i2" value="test"/>' +
            '</form> ')
    var div = make('<div hx-post="/include" hx-include="#f1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('By default an input includes itself w/ data-* prefix', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div data-hx-target="this"><input data-hx-post="/include" data-hx-trigger="click" id="i1" name="i1" value="test"/></div>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('If the element is not includeable, its descendant inputs are included', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div id="i"><input name="i1" value="test"/><input name="i2" value="test"/></div>')
    var div = make('<div hx-post="/include" hx-include="#i"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('The `closest` modifier can be used in the hx-include selector', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div id="i"><input name="i1" value="test"/><input name="i2" value="test"/>' +
            '<button id="btn" hx-post="/include" hx-include="closest div"></button></div>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('The `this` modifier can be used in the hx-include selector', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div id="i" hx-include="this"><input name="i1" value="test"/><input name="i2" value="test"/>' +
            '<button id="btn" hx-post="/include"></button></div>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('Multiple extended selectors can be used in hx-include', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('foo')
      params.i3.should.equal('bar')
      params.i4.should.equal('test2')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<input name="i4" value="test2" id="i4"/>' +
      '<div id="i">' +
      '<input name="i1" value="test"/>' +
      '<input name="i2" value="foo"/>' +
      '<button id="btn" hx-post="/include" hx-include="closest div, next input, #i4"></button>' +
      '</div>' +
      '<input name="i3" value="bar"/>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('hx-include processes extended selector in between standard selectors', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      should.equal(params.i2, undefined)
      params.i3.should.equal('bar')
      params.i4.should.equal('test2')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<input name="i4" value="test2" id="i4"/>' +
      '<div id="i">' +
      '<input name="i1" value="test" id="i1"/>' +
      '<input name="i2" value="foo"/>' +
      '<button id="btn" hx-post="/include" hx-include="#i1, next input, #i4"></button>' +
      '</div>' +
      '<input name="i3" value="bar"/>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('hx-include processes nested standard selectors correctly', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      params.i2.should.equal('foo')
      params.i3.should.equal('bar')
      should.equal(params.i4, undefined)
      should.equal(params.i5, undefined)
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<input name="i4" value="test2" id="i4"/>' +
      '<div id="i">' +
      '<input name="i1" value="test" id="i1"/>' +
      '<input name="i2" value="foo"/>' +
      '<input name="i5" value="test"/>' +
      '<button id="btn" hx-post="/include" hx-include="next input, #i > :is([name=\'i1\'], [name=\'i2\'])"></button>' +
      '</div>' +
      '<input name="i3" value="bar"/>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('hx-include processes wrapped next/previous selectors correctly', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      should.equal(params.i1, undefined)
      params.i2.should.equal('foo')
      params.i3.should.equal('bar')
      should.equal(params.i4, undefined)
      should.equal(params.i5, undefined)
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<input name="i4" value="test2" id="i4"/>' +
      '<div id="i">' +
      '<input name="i1" value="test" id="i1"/>' +
      '<input name="i2" value="foo"/>' +
      '<button id="btn" hx-post="/include" hx-include="next <#nonexistent, input/>, previous <#i5, [name=\'i2\'], #i4/>"></button>' +
      '</div>' +
      '<input name="i3" value="bar"/>' +
      '<input name="i5" value="test"/>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('hx-include processes wrapped closest selector correctly', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      should.equal(params.i1, undefined)
      params.i2.should.equal('bar')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<section>' +
      '<input name="i1" value="foo"/>' +
      '<div>' +
      '<input name="i2" value="bar"/>' +
      '<button id="btn" hx-post="/include" hx-include="closest <section, div/>"></button>' +
      '</div>' +
      '</section>')
    var btn = byId('btn')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })
})
