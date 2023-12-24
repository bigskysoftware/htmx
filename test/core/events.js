describe('Core htmx Events', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('htmx:load fires properly', function() {
    var called = false
    var handler = htmx.on('htmx:load', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('GET', '/test', '')
      this.server.respondWith('GET', '/test', '<div></div>')
      var div = make("<div hx-get='/test'></div>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:load', handler)
    }
  })

  it('htmx:configRequest allows attribute addition', function() {
    var handler = htmx.on('htmx:configRequest', function(evt) {
      evt.detail.parameters.param = 'true'
    })
    try {
      var param = null
      this.server.respondWith('POST', '/test', function(xhr) {
        param = getParameters(xhr).param
        xhr.respond(200, {}, '')
      })
      var div = make("<div hx-post='/test'></div>")
      div.click()
      this.server.respond()
      param.should.equal('true')
    } finally {
      htmx.off('htmx:configRequest', handler)
    }
  })

  it('htmx:configRequest is also dispatched in kebab-case', function() {
    var handler = htmx.on('htmx:config-request', function(evt) {
      evt.detail.parameters.param = 'true'
    })
    try {
      var param = null
      this.server.respondWith('POST', '/test', function(xhr) {
        param = getParameters(xhr).param
        xhr.respond(200, {}, '')
      })
      var div = make("<div hx-post='/test'></div>")
      div.click()
      this.server.respond()
      param.should.equal('true')
    } finally {
      htmx.off('htmx:config-request', handler)
    }
  })

  it('events are only dispatched once if kebab and camel case match', function() {
    var invoked = 0
    var handler = htmx.on('custom', function() {
      invoked = invoked + 1
    })
    try {
      var div = make("<div hx-post='/test'></div>")
      htmx.trigger(div, 'custom')
      invoked.should.equal(1)
    } finally {
      htmx.off('custom', handler)
    }
  })

  it('htmx:configRequest allows attribute removal', function() {
    var param = 'foo'
    var handler = htmx.on('htmx:configRequest', function(evt) {
      delete evt.detail.parameters.param
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        param = getParameters(xhr).param
        xhr.respond(200, {}, '')
      })
      var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>")
      div.click()
      this.server.respond()
      should.equal(param, undefined)
    } finally {
      htmx.off('htmx:configRequest', handler)
    }
  })

  it('htmx:configRequest allows header tweaking', function() {
    var header = 'foo'
    var handler = htmx.on('htmx:configRequest', function(evt) {
      evt.detail.headers['X-My-Header'] = 'bar'
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        header = xhr.requestHeaders['X-My-Header']
        xhr.respond(200, {}, '')
      })
      var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>")
      div.click()
      this.server.respond()
      should.equal(header, 'bar')
    } finally {
      htmx.off('htmx:configRequest', handler)
    }
  })

  it('htmx:configRequest on form gives access to submit event', function() {
    var skip = false
    var submitterId
    var handler = htmx.on('htmx:configRequest', function(evt) {
      // submitter may be null, but undefined means the browser doesn't support it
      if (typeof evt.detail.triggeringEvent.submitter === 'undefined') {
        skip = true
        return
      }
      evt.detail.headers['X-Submitter-Id'] = evt.detail.triggeringEvent.submitter.id
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        submitterId = xhr.requestHeaders['X-Submitter-Id']
        xhr.respond(200, {}, '')
      })
      make('<div hx-target="this" hx-boost="true"><form action="/test" method="post"><button type="submit" id="b1">Submit</button><button type="submit" id="b2">Submit</button></form></div>')
      var btn = byId('b1')
      btn.click()
      this.server.respond()
      if (skip) {
        this._runnable.title += " - Skipped as IE11 doesn't support submitter"
        this.skip()
      }
      should.equal(submitterId, 'b1')
    } finally {
      htmx.off('htmx:configRequest', handler)
    }
  })

  it('htmx:afterSwap is called when replacing outerHTML', function() {
    var called = false
    var handler = htmx.on('htmx:afterSwap', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterSwap', handler)
    }
  })

  it('htmx:oobBeforeSwap is called before swap', function() {
    var called = false
    var handler = htmx.on('htmx:oobBeforeSwap', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='d1'>Baz</div>")
      })
      var oob = make('<div id="d1">Blip</div>')
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      byId('d1').innerHTML.should.equal('Baz')
      should.equal(called, true)
    } finally {
      htmx.off('htmx:oobBeforeSwap', handler)
    }
  })

  it('htmx:oobBeforeSwap can abort a swap', function() {
    var called = false
    var handler = htmx.on('htmx:oobBeforeSwap', function(evt) {
      called = true
      evt.preventDefault()
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='d1'>Baz</div>")
      })
      var oob = make('<div id="d1">Blip</div>')
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      byId('d1').innerHTML.should.equal('Blip')
      should.equal(called, true)
    } finally {
      htmx.off('htmx:oobBeforeSwap', handler)
    }
  })

  it('htmx:oobBeforeSwap is not called on an oob miss', function() {
    var called = false
    var handler = htmx.on('htmx:oobBeforeSwap', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='test'>Baz</div>")
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, false)
    } finally {
      htmx.off('htmx:oobBeforeSwap', handler)
    }
  })

  it('htmx:oobAfterSwap is called after swap', function() {
    var called = false
    var handler = htmx.on('htmx:oobAfterSwap', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='d1'>Baz</div>")
      })
      var oob = make('<div id="d1">Blip</div>')
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      byId('d1').innerHTML.should.equal('Baz')
      should.equal(called, true)
    } finally {
      htmx.off('htmx:oobAfterSwap', handler)
    }
  })

  it('htmx:oobAfterSwap is not called on an oob miss', function() {
    var called = false
    var handler = htmx.on('htmx:oobAfterSwap', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='test'>Baz</div>")
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, false)
    } finally {
      htmx.off('htmx:oobAfterSwap', handler)
    }
  })

  it('htmx:afterSettle is called once when replacing outerHTML', function() {
    var called = 0
    var handler = htmx.on('htmx:afterSettle', function(evt) {
      called++
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, 1)
    } finally {
      htmx.off('htmx:afterSettle', handler)
    }
  })

  it('htmx:afterSettle is called once when replacing outerHTML with whitespace', function() {
    var called = 0
    var handler = htmx.on('htmx:afterSettle', function(evt) {
      called++
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>\n')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, 1)
    } finally {
      htmx.off('htmx:afterSettle', handler)
    }
  })

  it('htmx:afterSettle is called twice when replacing outerHTML with whitespace separated elements', function() {
    var called = 0
    var handler = htmx.on('htmx:afterSettle', function(evt) {
      called++
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>\n <a>Foo</a>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, 2)
    } finally {
      htmx.off('htmx:afterSettle', handler)
    }
  })

  it('htmx:afterSettle is called multiple times when doing OOB outerHTML swaps', function() {
    var called = 0
    var handler = htmx.on('htmx:afterSettle', function(evt) {
      called++
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, "<button>Bar</button>\n <div id='t1' hx-swap-oob='true'>t1</div><div id='t2' hx-swap-oob='true'>t2</div>")
      })
      var div = make("<button id='button' hx-post='/test' hx-target='#t'>Foo</button><div id='t'></div><div id='t1'></div><div id='t2'></div>")
      var button = byId('button')
      button.click()
      this.server.respond()
      should.equal(called, 3)
    } finally {
      htmx.off('htmx:afterSettle', handler)
    }
  })

  it('htmx:afterRequest is called after a successful request', function() {
    var called = false
    var handler = htmx.on('htmx:afterRequest', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '')
      })
      var div = make("<button hx-post='/test'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterRequest', handler)
    }
  })

  it('htmx:afterOnLoad is called after a successful request', function() {
    var called = false
    var handler = htmx.on('htmx:afterOnLoad', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '')
      })
      var div = make("<button hx-post='/test'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterOnLoad', handler)
    }
  })

  it('htmx:afterRequest is called after a failed request', function() {
    var called = false
    var handler = htmx.on('htmx:afterRequest', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(500, {}, '')
      })
      var div = make("<button hx-post='/test'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterRequest', handler)
    }
  })

  it('htmx:sendError is called after a failed request', function(done) {
    htmx.config.selfRequestsOnly = false // turn off self requests only
    var called = false
    var handler = htmx.on('htmx:sendError', function(evt) {
      called = true
    })
    this.server.restore() // turn off server mock so connection doesn't work
    var div = make("<button hx-post='file://foo'>Foo</button>")
    div.click()
    setTimeout(function() {
      htmx.off('htmx:sendError', handler)
      should.equal(called, true)
      htmx.config.selfRequestsOnly = true // restore self requests only
      done()
    }, 30)
  })

  it('htmx:afterRequest is called when replacing outerHTML', function() {
    var called = false
    var handler = htmx.on('htmx:afterRequest', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterRequest', handler)
    }
  })

  it('htmx:afterOnLoad is called when replacing outerHTML', function() {
    var called = false
    var handler = htmx.on('htmx:afterOnLoad', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterOnLoad', handler)
    }
  })

  it('htmx:beforeProcessNode is called when replacing outerHTML', function() {
    var called = false
    var handler = htmx.on('htmx:beforeProcessNode', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:beforeProcessNode', handler)
    }
  })

  it('htmx:beforeProcessNode allows htmx attribute tweaking', function() {
    var called = false
    var handler = htmx.on('htmx:beforeProcessNode', function(evt) {
      evt.target.setAttribute('hx-post', '/success')
      called = true
    })
    try {
      this.server.respondWith('POST', '/success', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/fail' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:beforeProcessNode', handler)
    }
  })

  it('htmx:afterProcessNode is called after replacing outerHTML', function() {
    var called = false
    var handler = htmx.on('htmx:afterProcessNode', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterProcessNode', handler)
    }
  })

  it('htmx:afterRequest is called when targeting a parent div', function() {
    var called = false
    var handler = htmx.on('htmx:afterRequest', function(evt) {
      called = true
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<div hx-target='this'><button id='b1' hx-post='/test' hx-swap='outerHTML'>Foo</button></div>")
      var button = byId('b1')
      button.click()
      this.server.respond()
      should.equal(called, true)
    } finally {
      htmx.off('htmx:afterRequest', handler)
    }
  })

  it('adding an error in htmx:configRequest stops the request', function() {
    try {
      var handler = htmx.on('htmx:configRequest', function(evt) {
        evt.detail.errors.push('An error')
      })
      var request = false
      this.server.respondWith('POST', '/test', function(xhr) {
        request = true
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(request, false)
    } finally {
      htmx.off('htmx:configRequest', handler)
    }
  })

  it('preventDefault() in htmx:configRequest stops the request', function() {
    try {
      var handler = htmx.on('htmx:configRequest', function(evt) {
        evt.preventDefault()
      })
      var request = false
      this.server.respondWith('POST', '/test', function(xhr) {
        request = true
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(request, false)
    } finally {
      htmx.off('htmx:configRequest', handler)
    }
  })

  it('preventDefault() in the htmx:beforeRequest event cancels the request', function() {
    try {
      var handler = htmx.on('htmx:beforeRequest', function(evt) {
        evt.preventDefault()
      })
      var request = false
      this.server.respondWith('POST', '/test', function(xhr) {
        request = true
        xhr.respond(200, {}, '<button>Bar</button>')
      })
      var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(request, false)
    } finally {
      htmx.off('htmx:beforeRequest', handler)
    }
  })

  it('preventDefault() in the htmx:beforeOnLoad event cancels the swap', function() {
    try {
      var handler = htmx.on('htmx:beforeOnLoad', function(evt) {
        evt.preventDefault()
      })
      var request = false
      this.server.respondWith('POST', '/test', function(xhr) {
        request = true
        xhr.respond(200, {}, 'Bar')
      })
      var div = make("<button hx-post='/test'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(request, true)
      div.innerText.should.equal('Foo')
    } finally {
      htmx.off('htmx:beforeOnLoad', handler)
    }
  })

  it("htmx:afterRequest event contains 'successful' and 'failed' properties indicating success after successful request", function() {
    var successful = false
    var failed = true
    var handler = htmx.on('htmx:afterRequest', function(evt) {
      successful = evt.detail.successful
      failed = evt.detail.failed
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(200, {}, '')
      })
      var div = make("<button hx-post='/test'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(successful, true)
      should.equal(failed, false)
    } finally {
      htmx.off('htmx:afterRequest', handler)
    }
  })

  it("htmx:afterRequest event contains 'successful' and 'failed' properties indicating failure after failed request", function() {
    var successful = true
    var failed = false
    var handler = htmx.on('htmx:afterRequest', function(evt) {
      successful = evt.detail.successful
      failed = evt.detail.failed
    })
    try {
      this.server.respondWith('POST', '/test', function(xhr) {
        xhr.respond(500, {}, '')
      })
      var div = make("<button hx-post='/test'>Foo</button>")
      div.click()
      this.server.respond()
      should.equal(successful, false)
      should.equal(failed, true)
    } finally {
      htmx.off('htmx:afterRequest', handler)
    }
  })

  it('htmx:confirm can cancel request', function() {
    var allow = false
    var handler = htmx.on('htmx:confirm', function(evt) {
      evt.preventDefault()
      if (allow) {
        evt.detail.issueRequest()
      }
    })

    try {
      this.server.respondWith('GET', '/test', 'updated')
      var div = make("<div hx-get='/test'></div>")
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('')
      allow = true
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('updated')
    } finally {
      htmx.off('htmx:confirm', handler)
    }
  })

  it('has updated target available when target set via htmx:beforeSwap', function() {
    var targetWasUpdatedInAfterSwapHandler = false

    var beforeSwapHandler = htmx.on('htmx:beforeSwap', function(evt) {
      console.log('beforeSwap', evt.detail.target, byId('d2'))
      evt.detail.target = byId('d2')
    })
    var afterSwapHandler = htmx.on('htmx:afterSwap', function(evt) {
      console.log('afterSwap', evt.detail.target, byId('d2'))
      targetWasUpdatedInAfterSwapHandler = evt.detail.target === byId('d2')
    })

    try {
      this.server.respondWith('GET', '/test', 'updated')
      make("<div id='d0' hx-get='/test' hx-target='#d1'></div><div id='d1'></div><div id='d2'></div>")
      var div = byId('d0')
      div.click()
      this.server.respond()
      targetWasUpdatedInAfterSwapHandler.should.equal(true)
    } finally {
      htmx.off('htmx:beforeSwap', beforeSwapHandler)
      htmx.off('htmx:afterSwap', afterSwapHandler)
    }
  })
})
