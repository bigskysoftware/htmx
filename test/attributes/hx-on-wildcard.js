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

  ;['hx-on--validation-validate', 'hx-on-htmx-validation-validate', 'data-hx-on--validation-validate'].forEach(function(attribute) {
    it('can perform custom validation with ' + attribute, function() {
      var requests = 0
      this.server.respondWith('POST', '/test', function(xhr) {
        requests++
        xhr.respond(200, {}, 'saved')
      })
      var form = make('<form hx-post="/test"><input name="value" ' + attribute + '="this.setCustomValidity(\'Invalid value\')"></form>')
      htmx.trigger(form, 'submit')
      this.server.respond()
      requests.should.equal(0)
      form.querySelector('input').validationMessage.should.equal('Invalid value')
    })
  })

  it('can handle colon-free XHR progress events', function() {
    var input = make('<input hx-on--xhr-progress="this.value = event.detail.loaded">')
    htmx.trigger(input, 'htmx:xhr:progress', { loaded: 42 })
    input.value.should.equal('42')
  })

  it('can cancel a colon-free htmx event', function() {
    var input = make('<input hx-on--validation-validate="event.preventDefault()">')
    htmx.trigger(input, 'htmx:validation:validate').should.equal(false)
  })

  it('preserves colon spellings without invoking them twice', function() {
    var input = make('<input value="0" hx-on::validation:validate="this.value++">')
    htmx.trigger(input, 'htmx:validation:validate')
    input.value.should.equal('1')
  })

  it('does not dispatch the dash alias when the original event is canceled', function() {
    var input = make('<input value="0" hx-on::validation:validate="event.preventDefault()" hx-on--validation-validate="this.value++">')
    htmx.trigger(input, 'htmx:validation:validate').should.equal(false)
    input.value.should.equal('0')
  })

  it('retains camel case and kebab case aliases for compound events', function() {
    var elt = make('<div></div>')
    var names = []
    ;['htmx:custom:someEvent', 'htmx:custom:some-event', 'htmx:custom-some-event'].forEach(function(name) {
      elt.addEventListener(name, function(event) {
        names.push(event.type)
        event.detail.value++
      })
    })
    var detail = { value: 0 }
    htmx.trigger(elt, 'htmx:custom:someEvent', detail).should.equal(true)
    names.should.deep.equal(['htmx:custom:someEvent', 'htmx:custom:some-event', 'htmx:custom-some-event'])
    detail.value.should.equal(3)
  })

  it('does not rewrite colons in custom events', function() {
    var input = make('<input value="0" hx-on:custom:event="this.value++" hx-on:custom-event="this.value += 10">')
    htmx.trigger(input, 'custom:event')
    input.value.should.equal('1')
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
