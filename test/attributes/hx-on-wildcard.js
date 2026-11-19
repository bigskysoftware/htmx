describe('hx-on:* attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('can handle basic events w/ no other attributes', function() {
    var btn = make("<button hx-on:click='window.foo = true'>Foo</button>")
    btn.click()
    window.foo.should.equal(true)
    delete window.foo
  })

  for (const attribute of ['hx-on:click', 'hx-on-click', 'data-hx-on:click', 'data-hx-on-click']) {
    it('handles ' + attribute + ' on a form with an input named attributes', function() {
      var form = make('<form ' + attribute + '="this.dataset.calls = Number(this.dataset.calls || 0) + 1"><input name="attributes" value="kept"><button type="button">Click</button></form>')
      form.querySelector('button').click()
      should.equal(form.dataset.calls, '1')
      htmx.process(form)
      form.querySelector('button').click()
      form.dataset.calls.should.equal('2')
      form.setAttribute(attribute, 'this.dataset.calls = Number(this.dataset.calls || 0) + 10')
      htmx.process(form)
      form.querySelector('button').click()
      form.dataset.calls.should.equal('12')
      form.querySelector('input').value.should.equal('kept')
    })
  }

  it('handles form config-request when inputs named attributes are descendants', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = parseParams(xhr.requestBody)
      params.attributes.should.deep.equal(['first', 'second'])
      should.equal(params.extra, 'added')
      xhr.respond(200, {}, 'Done')
    })
    var wrapper = make('<div><form hx-post="/test" hx-on::config-request="event.detail.parameters.extra = \'added\'"><fieldset><input name="attributes" value="first"><input name="attributes" value="second"></fieldset><button>Submit</button></form></div>')
    wrapper.querySelector('button').click()
    this.server.respond()
    wrapper.querySelector('form').innerText.should.equal('Done')
  })

  it('reinitializes AJAX attributes on a form with an input named attributes', function() {
    this.server.respondWith('POST', '/first', 'First')
    this.server.respondWith('POST', '/second', 'Second')
    var form = make('<form hx-post="/first" hx-swap="none" hx-on::after-request="this.dataset.path = event.detail.pathInfo.requestPath"><input name="attributes"><button>Submit</button></form>')
    form.querySelector('button').click()
    this.server.respond()
    should.equal(form.dataset.path, '/first')
    form.setAttribute('hx-post', '/second')
    htmx.process(form)
    form.querySelector('button').click()
    this.server.respond()
    should.equal(form.dataset.path, '/second')
  })

  it('can use dashes rather than colons', function() {
    var btn = make("<button hx-on-click='window.foo = true'>Foo</button>")
    btn.click()
    window.foo.should.equal(true)
    delete window.foo
  })

  it('can modify a parameter via htmx:configRequest', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = parseParams(xhr.requestBody)
      xhr.respond(200, {}, params.foo)
    })
    var btn = make("<button hx-on:htmx:config-request='event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('bar')
  })

  it('can modify a parameter via htmx:configRequest with dashes', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = parseParams(xhr.requestBody)
      xhr.respond(200, {}, params.foo)
    })
    var btn = make("<button hx-on-htmx-config-request='event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('bar')
  })

  it('expands :: shorthand into htmx:', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = parseParams(xhr.requestBody)
      xhr.respond(200, {}, params.foo)
    })
    var btn = make("<button hx-on::config-request='event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('bar')
  })

  it('expands -- shorthand into htmx:', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = parseParams(xhr.requestBody)
      xhr.respond(200, {}, params.foo)
    })
    var btn = make("<button hx-on--config-request='event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('bar')
  })

  it('can cancel an event via preventDefault for htmx:config-request', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      xhr.respond(200, {}, '<button>Bar</button>')
    })
    var btn = make("<button hx-on:htmx:config-request='event.preventDefault()' hx-post='/test' hx-swap='outerHTML'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('Foo')
  })

  it('can respond to data-hx-on', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = parseParams(xhr.requestBody)
      xhr.respond(200, {}, params.foo)
    })
    var btn = make("<button data-hx-on:htmx:config-request='event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('bar')
  })

  it('has the this symbol set to the element', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      xhr.respond(200, {}, 'foo')
    })
    var btn = make("<button hx-on:htmx:config-request='window.elt = this' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('foo')
    btn.should.equal(window.elt)
    delete window.elt
  })

  it('can handle multi-line JSON', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      xhr.respond(200, {}, 'foo')
    })
    var btn = make("<button hx-on:htmx:config-request='window.elt = {foo: true,\n" +
            "                                                             bar: false}' hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('foo')
    var obj = { foo: true, bar: false }
    obj.should.deep.equal(window.elt)
    delete window.elt
  })

  it('can handle multiple event handlers in the presence of multi-line JSON', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      xhr.respond(200, {}, 'foo')
    })
    var btn = make("<button hx-on:htmx:config-request='window.elt = {foo: true,\n" +
            "                                                             bar: false}\n'" +
            " hx-on:htmx:after-request='window.foo = true'" +
            " hx-post='/test'>Foo</button>")
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('foo')

    var obj = { foo: true, bar: false }
    obj.should.deep.equal(window.elt)
    delete window.elt

    window.foo.should.equal(true)
    delete window.foo
  })

  it('should fire when triggered by load', function() {
    this.server.respondWith('POST', '/test', 'test')
    make("<div hx-trigger='load' hx-post='/test' hx-on:htmx:config-request='foo = true'></div>")
    window.foo.should.equal(true)
    delete window.foo
  })

  it('should fire when triggered by revealed', function() {
    this.server.respondWith('POST', '/test', 'test')
    make("<div hx-trigger='revealed' hx-post='/test' hx-on:htmx:config-request='foo = true' style='position: fixed; top: 1px; left: 1px; border: 3px solid red'></div>")
    window.foo.should.equal(true)
    delete window.foo
  })

  it('de-initializes hx-on-* content properly', function() {
    window.tempCount = 0
    this.server.respondWith('POST', '/test', function(xhr) {
      xhr.respond(200, {}, "<button id='foo' hx-on:click=\"window.tempCount++;\">increment</button>")
    })
    var div = make("<div hx-post='/test'>Foo</div>")

    // get response
    div.click()
    this.server.respond()

    // click button
    byId('foo').click()
    window.tempCount.should.equal(1)

    // get second response
    div.click()
    this.server.respond()

    // click button again
    byId('foo').click()
    window.tempCount.should.equal(2)

    delete window.tempCount
  })

  it('is not evaluated when allowEval is false', function() {
    var calledEvent = false
    var handler = htmx.on('htmx:evalDisallowedError', function() {
      calledEvent = true
    })
    htmx.config.allowEval = false
    try {
      var btn = make("<button hx-on:click='window.foo = true'>Foo</button>")
      btn.click()
      should.not.exist(window.foo)
    } finally {
      htmx.config.allowEval = true
      htmx.off('htmx:evalDisallowedError', handler)
      delete window.foo
    }
    calledEvent.should.equal(true)
  })

  it('can handle being swapped using innerHTML', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, '<button id="bar" hx-on:click="window.bar = true">Bar</button>')
    })

    make(
      '<div>' +
            '<button id="swap" hx-get="/test" hx-target="#baz" hx-swap="innerHTML">Swap</button>' +
            '<div id="baz"><button id="foo" hx-on:click="window.foo = true">Foo</button></div>' +
            '</div>'
    )

    var fooBtn = byId('foo')
    fooBtn.click()
    window.foo.should.equal(true)

    var swapBtn = byId('swap')
    swapBtn.click()
    this.server.respond()

    var barBtn = byId('bar')
    barBtn.click()
    window.bar.should.equal(true)

    delete window.foo
    delete window.bar
  })

  it('cleans up all handlers when the DOM updates', function() {
    // setup
    window.foo = 0
    window.bar = 0
    var div = make("<div hx-on:increment-foo='window.foo++' hx-on:increment-bar='window.bar++'>Foo</div>")
    make('<div>Another Div</div>') // sole purpose is to update the DOM

    // check there is just one handler against each event
    htmx.trigger(div, 'increment-foo')
    htmx.trigger(div, 'increment-bar')
    window.foo.should.equal(1)
    window.bar.should.equal(1)

    // teardown
    delete window.foo
    delete window.bar
  })
})
