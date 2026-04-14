describe('Core htmx extension tests', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('should support event cancellation by returning false', function() {
    htmx.defineExtension('ext-prevent-request', {
      onEvent: function(name, evt) {
        if (name === 'htmx:beforeRequest') {
          return false
        }
      }
    })

    this.server.respondWith('GET', '/test', 'clicked!')
    var div = make('<div hx-get="/test" hx-ext="ext-prevent-request">Click Me!</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Click Me!')
  })

  it('should support event cancellation with preventDefault', function() {
    htmx.defineExtension('ext-prevent-request', {
      onEvent: function(name, evt) {
        if (name === 'htmx:beforeRequest') {
          evt.preventDefault()
        }
      }
    })

    this.server.respondWith('GET', '/test', 'clicked!')
    var div = make('<div hx-get="/test" hx-ext="ext-prevent-request">Click Me!</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Click Me!')
  })

  it('withExtensions catches and logs any exceptions', function() {
    htmx.defineExtension('ext-prevent-request', {
      onEvent: function(name, evt) {
        if (name === 'htmx:beforeRequest') {
          evt.preventDefault()
        }
      }
    })

    var div = make('<div hx-ext="ext-prevent-request">Foo</div>')
    htmx._('withExtensions')(div, function(extension) {
      throw new Error('throw error to catch and log')
    })
  })

  it('encodeParameters works as expected', function() {
    htmx.defineExtension('enc-param', {
      encodeParameters: function(xhr, parameters, elt) {
        return 'foo=bar'
      }
    })
    var values
    this.server.respondWith('Post', '/test', function(xhr) {
      values = getParameters(xhr)
      xhr.respond(200, {}, 'clicked!')
    })
    this.server.respondWith('GET', '/test', 'clicked!')
    var div = make('<div hx-post="/test" hx-ext="enc-param">Click Me!</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('clicked!')
    values.foo.should.equal('bar')
  })

  it('extensionBase return expected values', function() {
    var extBase = htmx._('extensionBase')()
    should.equal(extBase.init(), null)
    should.equal(extBase.getSelectors(), null)
    should.equal(extBase.onEvent(), true)
    should.equal(extBase.transformResponse('text'), 'text')
    should.equal(extBase.isInlineSwap(), false)
    should.equal(extBase.handleSwap(), false)
    should.equal(extBase.encodeParameters(), null)
  })
})
