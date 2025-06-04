describe('hx-vals attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('basic hx-vals works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='\"i1\":\"test\"'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('basic hx-vals works with braces', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='{\"i1\":\"test\"}'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('multiple hx-vals works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.v1.should.equal('test')
      params.v2.should.equal('42')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='\"v1\":\"test\", \"v2\":42'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('Dynamic hx-vals using spread operator works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.v1.should.equal('test')
      params.v2.should.equal('42')
      xhr.respond(200, {}, 'Clicked!')
    })
    window.foo = function() {
      return { v1: 'test', v2: 42 }
    }
    var div = make("<div hx-post='/vars' hx-vals='js:{...foo()}'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
    delete window.foo
  })

  it('hx-vals can be on parents', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make("<div hx-vals='\"i1\":\"test\"'><div id='d1' hx-post='/vars'></div></div>")
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals can override parents', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    make("<div hx-vals='\"i1\":\"test\"'><div id='d1' hx-vals='\"i1\":\"best\"' hx-post='/vars'></div></div>")
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals overrides inputs', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-target='this'><input hx-post='/include' hx-vals='\"i1\":\"best\"' hx-trigger='click' id='i1' name='i1' value='test'/></div>")
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals overrides hx-vars', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='\"i1\":\"test\"' hx-vars='\"i1\":\"best\"'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('basic hx-vals javascript: works', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-vals="javascript:i1:\'test\'"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals works with braces', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-vals="javascript:{i1:\'test\'}"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('multiple hx-vals works with javascript', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.v1.should.equal('test')
      params.v2.should.equal('42')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-vals="javascript:v1:\'test\', v2:42"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals can be on parents with javascript', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div hx-vals="javascript:i1:\'test\'"><div id="d1" hx-post="/vars"></div></div>')
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals can override parents with javascript', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<div hx-vals="javascript:i1:\'test\'"><div id="d1" hx-vals="javascript:i1:\'best\'" hx-post="/vars"></div></div>')
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals overrides inputs with javascript', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('best')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-target="this"><input hx-post="/include" hx-vals="javascript:i1:\'best\'" hx-trigger="click" id="i1" name="i1" value="test"/></div>')
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals treats objects as JSON', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('{"i2":"test"}')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='\"i1\":{\"i2\" : \"test\"}'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('basic hx-vals can be unset', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.should.be.empty
      xhr.respond(200, {}, 'Clicked!')
    })
    make(
      "<div hx-vals='\"i1\":\"test\"'>\
                <div id='d1' hx-post='/vars' hx-vals='unset'></div>\
            </div>"
    )
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('basic hx-vals with braces can be unset', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.should.be.empty
      xhr.respond(200, {}, 'Clicked!')
    })
    make(
      "<div hx-vals='{\"i1\":\"test\"}'>\
                <div id='d1' hx-post='/vars' hx-vals='unset'></div>\
            </div>"
    )
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('multiple hx-vals can be unset', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.should.be.empty
      xhr.respond(200, {}, 'Clicked!')
    })
    make(
      "<div hx-vals='\"v1\":\"test\", \"v2\":42'>\
                <div id='d1' hx-post='/vars' hx-vals='unset'></div>\
            </div>"
    )
    var div = byId('d1')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('unsetting hx-vals maintains input values', function() {
    this.server.respondWith('POST', '/include', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make(
      "<div hx-target='this' hx-vals='\"i1\":\"best\"'>\
                <input hx-post='/include' hx-vals='unset' hx-trigger='click' id='i1' name='i1' value='test'/>\
            </div>"
    )
    var input = byId('i1')
    input.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('javascript: is not evaluated when allowEval is false', function() {
    var calledEvent = false
    var handler = htmx.on('htmx:evalDisallowedError', function() {
      calledEvent = true
    })
    try {
      htmx.config.allowEval = false
      this.server.respondWith('POST', '/vars', function(xhr) {
        var params = getParameters(xhr)
        should.not.exist(params.i1)
        xhr.respond(200, {}, 'Clicked!')
      })
      var div = make('<div hx-post="/vars" hx-vals="javascript:i1:\'test\'"></div>')
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.allowEval = true
      htmx.off('htmx:evalDisallowedError', handler)
    }
    calledEvent.should.equal(true)
  })

  it('js: is not evaluated when allowEval is false', function() {
    var calledEvent = false
    var handler = htmx.on('htmx:evalDisallowedError', function() {
      calledEvent = true
    })
    try {
      htmx.config.allowEval = false
      this.server.respondWith('POST', '/vars', function(xhr) {
        var params = getParameters(xhr)
        should.not.exist(params.i1)
        xhr.respond(200, {}, 'Clicked!')
      })
      var div = make('<div hx-post="/vars" hx-vals="js:i1:\'test\'"></div>')
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.allowEval = true
      htmx.off('htmx:evalDisallowedError', handler)
    }
    calledEvent.should.equal(true)
  })

  it('using js: with hx-vals has event available', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div id="test" hx-post="/vars" hx-vals="js:i1:event.target.id"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('using js: with hx-vals has event available when used with a delay', function(done) {
    var params = null
    var div = make('<div id="test" hx-post="/vars" hx-vals="js:{i1:event.target.id}" hx-trigger="click delay:10ms"></div>')
    htmx.on(div, 'htmx:configRequest', function(evt) {
      evt.preventDefault()
      params = evt.detail.parameters
    }, { once: true })
    div.click()
    new Promise(resolve => setTimeout(resolve, 20)).then(function() {
      params.i1.should.equal('test')
      done()
    }).catch(done)
  })

  it('hx-vals works with null values', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('null')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='{\"i1\": null }'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('hx-vals works with object values', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('{"a":"b"}')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div hx-post='/vars' hx-vals='{\"i1\": { \"a\": \"b\" } }'></div>")
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('js: this refers to the element with the hx-vals attribute', function() {
    this.server.respondWith('POST', '/vars', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make('<div hx-post="/vars" hx-vals="javascript:{ ...this.dataset }" data-i1="test"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })
})
