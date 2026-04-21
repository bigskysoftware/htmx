describe('hx-ext attribute', function() {
  var ext1Calls, ext2Calls, ext3Calls, ext4Calls, ext5Calls

  beforeEach(function() {
    ext1Calls = ext2Calls = ext3Calls = ext4Calls = ext5Calls = 0
    this.server = makeServer()
    clearWorkArea()
    htmx.defineExtension('ext-1', {
      onEvent: function(name, evt) {
        if (name === 'htmx:afterRequest') {
          ext1Calls++
        }
      }
    })
    htmx.defineExtension('ext-2', {
      onEvent: function(name, evt) {
        if (name === 'htmx:afterRequest') {
          ext2Calls++
        }
      }
    })
    htmx.defineExtension('ext-3', {
      onEvent: function(name, evt) {
        if (name === 'htmx:afterRequest') {
          ext3Calls++
        }
      },
      isInlineSwap: function(swapStyle) {
        if (swapStyle === 'invalid') throw new Error('simulate exception handling in isInlineSwap')
      },
      handleSwap: function(swapStyle) {
        if (swapStyle === 'invalid') throw new Error('simulate exception handling in handleSwap')
      }
    })
    htmx.defineExtension('ext-4', {
      onEvent: function(name, evt) {
        if (name === 'namespace:example') {
          ext4Calls++
        }
      },
      isInlineSwap: function(swapStyle) {
        return swapStyle === 'inline'
      },
      handleSwap: function(swapStyle, target, fragment, settleInfo) {
        if (swapStyle === 'inline') {
          const swapOuterHTML = htmx._('swapOuterHTML')
          swapOuterHTML(target, fragment, settleInfo)
        }
      }
    })
    htmx.defineExtension('ext-5', {
      getSelectors: function() { return ['[foo]'] },
      onEvent: function(name, evt) {
        if (name === 'htmx:beforeProcessNode' && evt.target.getAttribute('foo')) {
          ext5Calls++
        }
      }
    })
  })

  afterEach(function() {
    this.server.restore()
    clearWorkArea()
    htmx.removeExtension('ext-1')
    htmx.removeExtension('ext-2')
    htmx.removeExtension('ext-3')
    htmx.removeExtension('ext-4')
    htmx.removeExtension('ext-5')
  })

  it('A simple extension is invoked properly', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button hx-get="/test" hx-ext="ext-1">Click Me!</button>')
    btn.click()
    this.server.respond()
    ext1Calls.should.equal(1)
    ext2Calls.should.equal(0)
    ext3Calls.should.equal(0)
  })

  it('Extensions are merged properly', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    make('<div hx-ext="ext-1"><button id="btn-1" hx-get="/test" hx-ext="ext-2">Click Me!</button>' +
            '<button id="btn-2"  hx-get="/test" hx-ext="ext-3">Click Me!</button></div>')
    var btn1 = byId('btn-1')
    var btn2 = byId('btn-2')

    btn1.click()
    this.server.respond()
    ext1Calls.should.equal(1)
    ext2Calls.should.equal(1)
    ext3Calls.should.equal(0)

    btn2.click()
    this.server.respond()
    ext1Calls.should.equal(2)
    ext2Calls.should.equal(1)
    ext3Calls.should.equal(1)
  })

  it('supports comma separated lists', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    make('<div hx-ext="ext-1"><button id="btn-1" hx-get="/test" hx-ext="ext-2,  ext-3 ">Click Me!</button></div>')
    var btn1 = byId('btn-1')
    var btn2 = byId('btn-2')

    btn1.click()
    this.server.respond()
    ext1Calls.should.equal(1)
    ext2Calls.should.equal(1)
    ext3Calls.should.equal(1)
  })

  it('A simple extension is invoked properly  w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    var btn = make('<button data-hx-get="/test" data-hx-ext="ext-1">Click Me!</button>')
    btn.click()
    this.server.respond()
    ext1Calls.should.equal(1)
    ext2Calls.should.equal(0)
    ext3Calls.should.equal(0)
  })

  it('A simple extension is invoked properly when an HX-Trigger event w/ a namespace fires', function() {
    this.server.respondWith('GET', '/test', [200, { 'HX-Trigger': 'namespace:example' }, ''])
    var btn = make('<button data-hx-get="/test" data-hx-ext="ext-4">Click Me!</button>')
    btn.click()
    this.server.respond()
    ext1Calls.should.equal(0)
    ext2Calls.should.equal(0)
    ext3Calls.should.equal(0)
    ext4Calls.should.equal(1)
  })

  it('A simple extension is invoked properly for elements it specified in getSelectors', function() {
    this.server.respondWith('GET', '/test', [200, { 'HX-Trigger': 'namespace:example' }, ''])
    var btn = make('<div data-hx-ext="ext-5"><div foo="bar">test</div></div>')
    btn.click()
    this.server.respond()
    ext1Calls.should.equal(0)
    ext2Calls.should.equal(0)
    ext3Calls.should.equal(0)
    ext4Calls.should.equal(0)
    ext5Calls.should.equal(1)
  })

  it('Extensions are ignored properly', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')

    make('<div id="div-AA" hx-ext="ext-1,ext-2,ext-5"><button id="btn-AA" hx-get="/test" foo="foo">Click Me!</button>' +
            '<div id="div-BB" hx-ext="ignore:ext-1,ignore:ext-5"><button id="btn-BB" hx-get="/test" foo="foo"></button></div></div>')

    var btn1 = byId('btn-AA')
    var btn2 = byId('btn-BB')

    btn1.click()
    this.server.respond()
    ext1Calls.should.equal(1)
    ext2Calls.should.equal(1)
    ext3Calls.should.equal(0)

    btn2.click()
    this.server.respond()
    ext1Calls.should.equal(1)
    ext2Calls.should.equal(2)
    ext3Calls.should.equal(0)

    ext5Calls.should.equal(1)
  })

  it('oob swap via swap extension uses isInlineSwap correctly', function() {
    this.server.respondWith(
      'GET',
      '/test',
      '<div id="b1" hx-swap-oob="inline">Bar</div>'
    )
    var btn = make('<div hx-get="/test" hx-swap="none" data-hx-ext="ext-4"><div id="b1">Foo</div></div>')
    btn.click()
    this.server.respond()
    byId('b1').innerHTML.should.equal('Bar')
  })

  it('isInlineSwap/handleSwap handling catches, logs and ignores exceptions in extension code', function() {
    this.server.respondWith(
      'GET',
      '/test',
      '<div id="b1" hx-swap-oob="invalid">Bar</div>'
    )
    var btn = make('<div hx-get="/test" hx-swap="none" data-hx-ext="ext-3"><div id="b1">Foo</div></div>')
    btn.click()
    this.server.respond()
    byId('b1').innerHTML.should.equal('Bar')
  })
})
