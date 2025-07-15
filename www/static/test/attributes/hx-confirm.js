describe('hx-confirm attribute', function() {
  var confirm
  beforeEach(function() {
    this.server = makeServer()
    confirm = sinon.stub(window, 'confirm')
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    confirm.restore()
    clearWorkArea()
  })

  it('prompts using window.confirm when hx-confirm is set', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    confirm.returns(true)
    var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
    btn.click()
    confirm.calledOnce.should.equal(true)
    this.server.respond()
    btn.innerHTML.should.equal('Clicked!')
  })

  it('stops the request if confirm is cancelled', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    confirm.returns(false)
    var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
    btn.click()
    confirm.calledOnce.should.equal(true)
    this.server.respond()
    btn.innerHTML.should.equal('Click Me!')
  })

  it('uses the value of hx-confirm as the prompt', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    confirm.returns(false)
    var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
    btn.click()
    confirm.firstCall.args[0].should.equal('Sure?')
    this.server.respond()
    btn.innerHTML.should.equal('Click Me!')
  })

  it('should prompt when htmx:confirm handler calls issueRequest', function() {
    try {
      var btn = make('<button hx-get="/test" hx-confirm="Surely?">Click Me!</button>')
      var handler = htmx.on('htmx:confirm', function(evt) {
        evt.preventDefault()
        evt.detail.issueRequest()
      })
      btn.click()
      confirm.calledOnce.should.equal(true)
    } finally {
      htmx.off('htmx:confirm', handler)
    }
  })

  it('should include the question in htmx:confirm event', function() {
    var stub = sinon.stub()
    try {
      var btn = make('<button hx-get="/test" hx-confirm="Surely?">Click Me!</button>')
      var handler = htmx.on('htmx:confirm', stub)
      btn.click()
      stub.calledOnce.should.equal(true)
      stub.firstCall.args[0].detail.should.have.property('question', 'Surely?')
    } finally {
      htmx.off('htmx:confirm', handler)
    }
  })

  it('should allow skipping built-in window.confirm when using issueRequest', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    try {
      var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
      var handler = htmx.on('htmx:confirm', function(evt) {
        evt.detail.question.should.equal('Sure?')
        evt.preventDefault()
        evt.detail.issueRequest(true)
      })
      btn.click()
      confirm.called.should.equal(false)
      this.server.respond()
      btn.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.off('htmx:confirm', handler)
    }
  })

  it('should allow htmx:confirm even when no hx-confirm is set', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    try {
      var btn = make('<button hx-get="/test">Click Me!</button>')
      var handler = htmx.on('htmx:confirm', function(evt) {
        evt.detail.should.have.property('question', null)
        evt.preventDefault()
        evt.detail.issueRequest()
      })
      btn.click()
      confirm.called.should.equal(false) // no hx-confirm means no window.confirm
      this.server.respond()
      btn.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.off('htmx:confirm', handler)
    }
  })
})
