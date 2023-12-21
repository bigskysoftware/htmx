describe('Core htmx client side validation tests', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('HTML5 required validation error prevents request', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '</form>')
    form.textContent.should.equal('No Request')
    form.click()
    this.server.respond()
    form.textContent.should.equal('No Request')
    byId('i1').value = 'foo'
    form.click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('Novalidate skips form validation', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test" hx-trigger="click" novalidate>' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '</form>')
    form.textContent.should.equal('No Request')
    form.click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('Validation skipped for indirect form submission', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '<button id="button" hx-post="/test" hx-target="form"></button>' +
            '</form>')
    form.textContent.should.equal('No Request')
    byId('button').click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('Formnovalidate skips form validation', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test">' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '<button id="button" type="submit" formnovalidate></button>' +
            '</form>')
    form.textContent.should.equal('No Request')
    byId('button').click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('HTML5 pattern validation error prevents request', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" pattern="abc" value="xyz">' +
            '</form>')
    byId('i1').value = 'xyz'
    form.textContent.should.equal('No Request')
    form.click()
    this.server.respond()
    form.textContent.should.equal('No Request')
    byId('i1').value = 'abc'
    form.click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('Custom validation error prevents request', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1">' +
            '</form>')
    byId('i1').setCustomValidity('Nope')
    form.textContent.should.equal('No Request')
    form.click()
    this.server.respond()
    form.textContent.should.equal('No Request')
    byId('i1').setCustomValidity('')
    form.click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('hyperscript validation error prevents request', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')

    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input _="on htmx:validation:validate if my.value != \'foo\' call me.setCustomValidity(\'Nope\') ' +
            '                                      else call me.setCustomValidity(\'\')" id="i1" name="i1">' +
            '</form>')
    htmx.trigger(form, 'htmx:load')
    byId('i1').value = 'boo'
    form.textContent.should.equal('No Request')
    form.click()
    this.server.respond()
    form.textContent.should.equal('No Request')
    byId('i1').value = 'foo'
    form.click()
    this.server.respond()
    form.textContent.should.equal('Clicked!')
  })

  it('calls htmx:validation:failed on failure', function() {
    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '</form>')
    var calledEvent = false
    var handler = htmx.on(form, 'htmx:validation:failed', function() {
      calledEvent = true
    })
    try {
      form.click()
      this.server.respond()
    } finally {
      htmx.off(form, handler)
    }
    calledEvent.should.equal(true)
  })

  it('calls htmx:validation:halted on failure', function() {
    var form = make('<form hx-post="/test" hx-trigger="click">' +
            'No Request' +
            '<input id="i1" name="i1" required>' +
            '</form>')
    var errors = null
    var handler = htmx.on(form, 'htmx:validation:halted', function(evt) {
      errors = evt.detail.errors
    })
    try {
      form.click()
      this.server.respond()
    } finally {
      htmx.off(form, handler)
    }
    errors.length.should.equal(1)
    byId('i1').should.equal(errors[0].elt)
    errors[0].validity.valueMissing.should.equal(true)
  })

  it('hx-validate can prevent a single input from submitting', function() {
    this.server.respondWith('POST', '/test', 'Clicked!')
    var div = make("<div id='d1'>No Request</div>")
    var form = make('<form><input type="text" hx-target="#d1" hx-post="/test" hx-trigger="click" id="i1" name="i1" pattern="[0-9]+" hx-validate="true"/></form>')
    var input = byId('i1')

    div.textContent.should.equal('No Request')

    input.value = 'abc'
    input.click()
    this.server.respond()
    div.textContent.should.equal('No Request')

    input.value = '1bc'
    input.click()
    this.server.respond()
    div.textContent.should.equal('No Request')

    input.value = '123'
    input.click()
    this.server.respond()
    div.textContent.should.equal('Clicked!')
  })
})
