describe('hx-get attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('issues a GET request on click and swaps content', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('GET does not include surrounding data by default', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      should.equal(getParameters(xhr).i1, undefined)
      xhr.respond(200, {}, 'Clicked!')
    })
    make('<form><input name="i1" value="value"/><button id="b1" hx-get="/test">Click Me!</button></form>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('GET on form includes its own data by default', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      getParameters(xhr).i1.should.equal('value')
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-get="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('GET on form with existing parameters works properly', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      getParameters(xhr).foo.should.equal('bar')
      getParameters(xhr).i1.should.equal('value')
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-get="/test?foo=bar"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('GET on form with anchor works properly', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      getParameters(xhr).foo.should.equal('bar')
      getParameters(xhr).i1.should.equal('value')
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-get="/test?foo=bar#foo"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('GET on form with anchor works properly and scrolls to anchor id', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      getParameters(xhr).foo.should.equal('bar')
      getParameters(xhr).i1.should.equal('value')
      xhr.respond(200, {}, '<div id="foo">Clicked</div>')
    })
    var form = make('<form hx-trigger="click" hx-get="/test?foo=bar#foo"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('<div id="foo">Clicked</div>')
  })

  it('issues a GET request on click and swaps content w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button data-hx-get="/test">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('does not include a cache-busting parameter when not enabled', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      should.not.exist(getParameters(xhr)['org.htmx.cache-buster'])
      xhr.respond(200, {}, 'Clicked!')
    })

    try {
      htmx.config.getCacheBusterParam = false
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.getCacheBusterParam = false
    }
  })

  it('includes a cache-busting parameter when enabled w/ value "true" if no id on target', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      getParameters(xhr)['org.htmx.cache-buster'].should.equal('true')
      xhr.respond(200, {}, 'Clicked!')
    })

    try {
      htmx.config.getCacheBusterParam = true
      var btn = make('<button hx-get="/test">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.getCacheBusterParam = false
    }
  })

  it('includes a cache-busting parameter when enabled w/ the id of the target if there is one', function() {
    this.server.respondWith('GET', /\/test.*/, function(xhr) {
      getParameters(xhr)['org.htmx.cache-buster'].should.equal('foo')
      xhr.respond(200, {}, 'Clicked!')
    })

    try {
      htmx.config.getCacheBusterParam = true
      var btn = make('<button hx-get="/test" id="foo">Click Me!</button>')
      btn.click()
      this.server.respond()
      btn.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.getCacheBusterParam = false
    }
  })
})
