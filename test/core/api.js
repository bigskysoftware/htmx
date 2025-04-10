describe('Core htmx API test', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('should find properly', function() {
    var div = make("<div id='d1' class='c1 c2'>")
    div.should.equal(htmx.find('#d1'))
    div.should.equal(htmx.find('.c1'))
    div.should.equal(htmx.find('.c2'))
    div.should.equal(htmx.find('.c1.c2'))
  })

  it('should find properly from elt', function() {
    var div = make("<div><a id='a1'></a><a id='a2'></a></div>")
    htmx.find(div, 'a').id.should.equal('a1')
  })

  it('should find all properly', function() {
    var div = make("<div class='c1 c2 c3'><div class='c1 c2'><div class='c1'>")
    htmx.findAll('.c1').length.should.equal(3)
    htmx.findAll('.c2').length.should.equal(2)
    htmx.findAll('.c3').length.should.equal(1)
  })

  it('should find all properly from elt', function() {
    var div = make("<div><div class='c1 c2 c3'><div class='c1 c2'><div class='c1'></div>")
    htmx.findAll(div, '.c1').length.should.equal(3)
    htmx.findAll(div, '.c2').length.should.equal(2)
    htmx.findAll(div, '.c3').length.should.equal(1)
  })

  it('should find closest element properly', function() {
    var div = make("<div><a id='a1'></a><a id='a2'></a></div>")
    var a = htmx.find(div, 'a')
    htmx.closest(a, 'div').should.equal(div)
  })

  it('should remove element properly', function() {
    var div = make('<div><a></a></div>')
    var a = htmx.find(div, 'a')
    htmx.remove(a)
    div.innerHTML.should.equal('')
  })

  it('should remove element properly w/ selector', function() {
    var div = make("<div><a id='a1'></a></div>")
    var a = htmx.find(div, 'a')
    htmx.remove('#a1')
    div.innerHTML.should.equal('')
  })

  it('should add class properly', function() {
    var div = make('<div></div>')
    div.classList.contains('foo').should.equal(false)
    htmx.addClass(div, 'foo')
    div.classList.contains('foo').should.equal(true)
  })

  it('should add class properly w/ selector', function() {
    var div = make("<div id='div1'></div>")
    div.classList.contains('foo').should.equal(false)
    htmx.addClass('#div1', 'foo')
    div.classList.contains('foo').should.equal(true)
  })

  it('should add class properly after delay', function(done) {
    var div = make('<div></div>')
    div.classList.contains('foo').should.equal(false)
    htmx.addClass(div, 'foo', 10)
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      div.classList.contains('foo').should.equal(true)
      done()
    }, 20)
  })

  it('should remove class properly', function() {
    var div = make('<div></div>')
    htmx.addClass(div, 'foo')
    div.classList.contains('foo').should.equal(true)
    htmx.removeClass(div, 'foo')
    div.classList.contains('foo').should.equal(false)
  })

  it('should remove class properly w/ selector', function() {
    var div = make("<div id='div1'></div>")
    htmx.addClass(div, 'foo')
    div.classList.contains('foo').should.equal(true)
    htmx.removeClass('#div1', 'foo')
    div.classList.contains('foo').should.equal(false)
  })

  it('should add class properly after delay', function(done) {
    var div = make('<div></div>')
    htmx.addClass(div, 'foo')
    div.classList.contains('foo').should.equal(true)
    htmx.removeClass(div, 'foo', 10)
    div.classList.contains('foo').should.equal(true)
    setTimeout(function() {
      div.classList.contains('foo').should.equal(false)
      done()
    }, 20)
  })

  it('should toggle class properly', function() {
    var div = make('<div></div>')
    div.classList.contains('foo').should.equal(false)
    htmx.toggleClass(div, 'foo')
    div.classList.contains('foo').should.equal(true)
    htmx.toggleClass(div, 'foo')
    div.classList.contains('foo').should.equal(false)
  })

  it('should toggle class properly w/ selector', function() {
    var div = make("<div id='div1'></div>")
    div.classList.contains('foo').should.equal(false)
    htmx.toggleClass('#div1', 'foo')
    div.classList.contains('foo').should.equal(true)
    htmx.toggleClass('#div1', 'foo')
    div.classList.contains('foo').should.equal(false)
  })

  it('should take class properly', function() {
    var div1 = make('<div></div>')
    var div2 = make('<div></div>')
    var div3 = make('<div></div>')

    div1.classList.contains('foo').should.equal(false)
    div2.classList.contains('foo').should.equal(false)
    div3.classList.contains('foo').should.equal(false)

    htmx.takeClass(div1, 'foo')

    div1.classList.contains('foo').should.equal(true)
    div2.classList.contains('foo').should.equal(false)
    div3.classList.contains('foo').should.equal(false)

    htmx.takeClass(div2, 'foo')

    div1.classList.contains('foo').should.equal(false)
    div2.classList.contains('foo').should.equal(true)
    div3.classList.contains('foo').should.equal(false)

    htmx.takeClass(div3, 'foo')

    div1.classList.contains('foo').should.equal(false)
    div2.classList.contains('foo').should.equal(false)
    div3.classList.contains('foo').should.equal(true)
  })

  it('should take class properly w/ selector', function() {
    var div1 = make("<div id='div1'></div>")
    var div2 = make("<div id='div2'></div>")
    var div3 = make("<div id='div3'></div>")

    div1.classList.contains('foo').should.equal(false)
    div2.classList.contains('foo').should.equal(false)
    div3.classList.contains('foo').should.equal(false)

    htmx.takeClass('#div1', 'foo')

    div1.classList.contains('foo').should.equal(true)
    div2.classList.contains('foo').should.equal(false)
    div3.classList.contains('foo').should.equal(false)

    htmx.takeClass('#div2', 'foo')

    div1.classList.contains('foo').should.equal(false)
    div2.classList.contains('foo').should.equal(true)
    div3.classList.contains('foo').should.equal(false)

    htmx.takeClass('#div3', 'foo')

    div1.classList.contains('foo').should.equal(false)
    div2.classList.contains('foo').should.equal(false)
    div3.classList.contains('foo').should.equal(true)
  })

  it('eval can be suppressed', function() {
    var calledEvent = false
    var handler = htmx.on('htmx:evalDisallowedError', function() {
      calledEvent = true
    })
    try {
      htmx.config.allowEval = false
      should.equal(htmx._('tokenizeString'), undefined)
    } finally {
      htmx.config.allowEval = true
      htmx.off('htmx:evalDisallowedError', handler)
    }
    calledEvent.should.equal(true)
  })

  it('ajax api works', function() {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make('<div></div>')
    htmx.ajax('GET', '/test', div)
    this.server.respond()
    div.innerHTML.should.equal('foo!')
  })

  it('ajax api works by ID', function() {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make("<div id='d1'></div>")
    htmx.ajax('GET', '/test', '#d1')
    this.server.respond()
    div.innerHTML.should.equal('foo!')
  })

  it('ajax api does not fall back to body when target invalid', function() {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make("<div id='d1'></div>")
    htmx.ajax('GET', '/test', '#d2')
    this.server.respond()
    document.body.innerHTML.should.not.equal('foo!')
  })

  it('ajax api fails when target invalid', function(done) {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make("<div id='d1'></div>")
    htmx.ajax('GET', '/test', '#d2').then(
      (value) => {
      },
      (reason) => {
        done()
      }
    )
    this.server.respond()
    div.innerHTML.should.equal('')
  })

  it('ajax api fails when target invalid even if source set', function(done) {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make("<div id='d1'></div>")
    htmx.ajax('GET', '/test', {
      source: div,
      target: '#d2'
    }).then(
      (value) => {
      },
      (reason) => {
        done()
      }
    )
    this.server.respond()
    div.innerHTML.should.equal('')
  })

  it('ajax api fails when source invalid and no target set', function(done) {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make("<div id='d1'></div>")
    htmx.ajax('GET', '/test', {
      source: '#d2'
    }).then(
      (value) => {
      },
      (reason) => {
        done()
      }
    )
    this.server.respond()
    div.innerHTML.should.equal('')
  })

  it('ajax api falls back to targeting source if target not set', function() {
    this.server.respondWith('GET', '/test', 'foo!')
    var div = make("<div id='d1'></div>")
    htmx.ajax('GET', '/test', {
      source: div
    })
    this.server.respond()
    div.innerHTML.should.equal('foo!')
  })

  // it('ajax api falls back to targeting body if target and source not set', function() {
  //   this.server.respondWith('GET', '/test', 'foo!')
  //   var div = make("<div id='d1'></div>")
  //   const saveBody = document.body.innerHTML
  //   htmx.ajax('GET', '/test', {})
  //   this.server.respond()
  //   document.body.innerHTML.should.equal('foo!')
  //   document.body.innerHTML = saveBody
  // })

  it('ajax api works with swapSpec', function() {
    this.server.respondWith('GET', '/test', "<p class='test'>foo!</p>")
    var div = make("<div><div id='target'></div></div>")
    htmx.ajax('GET', '/test', { target: '#target', swap: 'outerHTML' })
    this.server.respond()
    div.innerHTML.should.equal('<p class="test">foo!</p>')
  })

  it('ajax api works with select', function() {
    this.server.respondWith('GET', '/test', "<div id='d1'>foo</div><div id='d2'>bar</div>")
    var div = make("<div id='target'></div>")
    htmx.ajax('GET', '/test', { target: '#target', select: '#d2' })
    this.server.respond()
    div.innerHTML.should.equal('<div id="d2">bar</div>')
  })

  it('ajax api works with Hx-Select overrides select', function() {
    this.server.respondWith('GET', '/test', [200, { 'HX-Reselect': '#d2' }, "<div id='d1'>foo</div><div id='d2'>bar</div>"])
    var div = make("<div id='target'></div>")
    htmx.ajax('GET', '/test', { target: '#target', select: '#d1' })
    this.server.respond()
    div.innerHTML.should.equal('<div id="d2">bar</div>')
  })

  it('ajax returns a promise', function(done) {
    // in IE we do not return a promise
    if (typeof Promise !== 'undefined') {
      this.server.respondWith('GET', '/test', 'foo!')
      var div = make("<div id='d1'></div>")
      var promise = htmx.ajax('GET', '/test', '#d1')
      this.server.respond()
      div.innerHTML.should.equal('foo!')
      promise.then(function() {
        done()
      })
    } else {
      done()
    }
  })

  it('ajax api can pass parameters', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = getParameters(xhr)
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div id='d1'></div>")
    htmx.ajax('POST', '/test', { target: '#d1', values: { i1: 'test' } })
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('ajax api Content-Type header is application/x-www-form-urlencoded', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = getParameters(xhr)
      xhr.requestHeaders['Content-Type'].should.equal('application/x-www-form-urlencoded;charset=utf-8')
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })
    var div = make("<div id='d1'></div>")
    htmx.ajax('POST', '/test', { target: '#d1', values: { i1: 'test' } })
    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('ajax api Content-Type header override to application/json', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      var params = getParameters(xhr)
      xhr.requestHeaders['Content-Type'].should.equal('application/json;charset=utf-8')
      params.i1.should.equal('test')
      xhr.respond(200, {}, 'Clicked!')
    })

    var div = make("<div id='d1'></div>")
    htmx.ajax('POST', '/test', {
      target: '#d1',
      swap: 'innerHTML',
      headers: {
        'Content-Type': 'application/json'
      },
      values: { i1: 'test' }
    })

    this.server.respond()
    div.innerHTML.should.equal('Clicked!')
  })

  it('can re-init with new attributes', function() {
    this.server.respondWith('PATCH', '/test', 'patch')
    this.server.respondWith('DELETE', '/test', 'delete')

    var div = make('<div hx-patch="/test">click me</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('patch')

    div.removeAttribute('hx-patch')
    div.setAttribute('hx-delete', '/test')
    htmx.process(div)

    div.click()
    this.server.respond()
    div.innerHTML.should.equal('delete')
  })

  it('does not trigger load on re-init of an existing element', function() {
    this.server.respondWith('GET', '/test', 'test')
    var div = make('<div hx-get="/test" hx-trigger="load" hx-swap="beforeend"></div>')
    this.server.respond()
    div.innerHTML.should.equal('test')
    div.setAttribute('hx-swap', 'afterbegin')
    htmx.process(div)
    this.server.respond()
    div.innerHTML.should.equal('test')
  })

  it('onLoad is called... onLoad', function() {
    // also tests on/off
    this.server.respondWith('GET', '/test', "<div id='d1' hx-get='/test'></div>")
    var helper = htmx.onLoad(function(elt) {
      elt.setAttribute('foo', 'bar')
    })

    try {
      var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML'></div>")
      div.click()
      this.server.respond()
      byId('d1').getAttribute('foo').should.equal('bar')
      htmx.off('htmx:load', helper)
    } catch (error) {
      // Clean up the event if the test fails, then throw it again
      htmx.off('htmx:load', helper)
      throw error
    }
  })

  it('triggers properly', function() {
    var div = make('<div/>')
    var myEventCalled = false
    var detailStr = ''
    htmx.on('myEvent', function(evt) {
      myEventCalled = true
      detailStr = evt.detail.str
    })
    htmx.trigger(div, 'myEvent', { str: 'foo' })

    myEventCalled.should.equal(true)
    detailStr.should.equal('foo')
  })

  it('triggers properly w/ selector', function() {
    var div = make("<div id='div1'/>")
    var myEventCalled = false
    var detailStr = ''
    htmx.on('myEvent', function(evt) {
      myEventCalled = true
      detailStr = evt.detail.str
    })
    htmx.trigger('#div1', 'myEvent', { str: 'foo' })

    myEventCalled.should.equal(true)
    detailStr.should.equal('foo')
  })

  it('triggers with no details properly', function() {
    var div = make('<div/>')
    var myEventCalled = false
    htmx.on('myEvent', function(evt) {
      myEventCalled = true
    })
    htmx.trigger(div, 'myEvent')
    myEventCalled.should.equal(true)
  })

  it('swaps content properly (basic)', function() {
    var output = make('<output id="output"/>')
    htmx.swap('#output', '<div>Swapped!</div>', { swapStyle: 'innerHTML' })
    output.innerHTML.should.be.equal('<div>Swapped!</div>')
  })

  it('swaps content properly (with select)', function() {
    var output = make('<output id="output"/>')
    htmx.swap('#output', '<div><p id="select-me">Swapped!</p></div>', { swapStyle: 'innerHTML' }, { select: '#select-me' })
    output.innerHTML.should.be.equal('<p id="select-me">Swapped!</p>')
  })

  it('swaps content properly (with oob)', function() {
    var output = make('<output id="output"/>')
    var oobDiv = make('<div id="oob"/>')
    htmx.swap('#output', '<div id="oob" hx-swap-oob="innerHTML">OOB Swapped!</div><div>Swapped!</div>', { swapStyle: 'innerHTML' })
    output.innerHTML.should.be.equal('<div>Swapped!</div>')
    oobDiv.innerHTML.should.be.equal('OOB Swapped!')
  })

  it('swaps content properly (with select oob)', function() {
    var output = make('<output id="output"/>')
    var oobDiv = make('<div id="oob"/>')
    htmx.swap('#output', '<div id="oob">OOB Swapped!</div><div>Swapped!</div>', { swapStyle: 'innerHTML' }, { selectOOB: '#oob:innerHTML' })
    output.innerHTML.should.be.equal('<div>Swapped!</div>')
    oobDiv.innerHTML.should.be.equal('OOB Swapped!')
  })

  it('swap delete works when parent is removed', function() {
    this.server.respondWith('DELETE', '/test', 'delete')

    var parent = make('<div><div id="d1" hx-swap="delete" hx-delete="/test">click me</div></div>')
    var div = htmx.find(parent, '#d1')
    div.click()
    div.remove()
    parent.remove()
    this.server.respond()
    parent.children.length.should.equal(0)
  })

  it('swap outerHTML works when parent is removed', function() {
    this.server.respondWith('GET', '/test', 'delete')

    var parent = make('<div><div id="d1" hx-swap="outerHTML" hx-get="/test">click me</div></div>')
    var div = htmx.find(parent, '#d1')
    div.click()
    div.remove()
    parent.remove()
    this.server.respond()
    parent.children.length.should.equal(0)
  })
})
