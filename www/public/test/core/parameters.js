describe('Core htmx Parameter Handling', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })

  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('Input includes value', function() {
    var input = make('<input name="foo" value="bar"/>')
    var vals = htmx._('getInputValues')(input).values
    vals.foo.should.equal('bar')
  })

  it('Input includes value on get', function() {
    var input = make('<input name="foo" value="bar"/>')
    var vals = htmx._('getInputValues')(input, 'get').values
    vals.foo.should.equal('bar')
  })

  it('Input includes form', function() {
    var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>')
    var input = byId('i1')
    var vals = htmx._('getInputValues')(input).values
    vals.foo.should.equal('bar')
    vals.do.should.equal('rey')
  })

  it('Input doesnt include form on get', function() {
    var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>')
    var input = byId('i1')
    var vals = htmx._('getInputValues')(input, 'get').values
    vals.foo.should.equal('bar')
    should.equal(vals.do, undefined)
  })

  it('non-input includes form', function() {
    var form = make('<form><div id="d1"/><input id="i2" name="do" value="rey"/></form>')
    var div = byId('d1')
    var vals = htmx._('getInputValues')(div, 'post').values
    vals.do.should.equal('rey')
  })

  it('non-input doesnt include form on get', function() {
    var form = make('<form><div id="d1"/><input id="i2" name="do" value="rey"/></form>')
    var div = byId('d1')
    var vals = htmx._('getInputValues')(div, 'get').values
    should.equal(vals.do, undefined)
  })

  it('Basic form works on get', function() {
    var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>')
    var vals = htmx._('getInputValues')(form, 'get').values
    vals.foo.should.equal('bar')
    vals.do.should.equal('rey')
  })

  it('Basic form works on non-get', function() {
    var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>')
    var vals = htmx._('getInputValues')(form, 'post').values
    vals.foo.should.equal('bar')
    vals.do.should.equal('rey')
  })

  it('Double values are included as array', function() {
    var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>')
    var vals = htmx._('getInputValues')(form).values
    vals.foo.should.equal('bar')
    vals.do.should.deep.equal(['rey', 'rey'])
  })

  it('Double values are included as array in correct order', function() {
    var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey1"/><input id="i3" name="do" value="rey2"/></form>')
    var vals = htmx._('getInputValues')(byId('i3')).values
    vals.foo.should.equal('bar')
    vals.do.should.deep.equal(['rey1', 'rey2'])
  })

  it('Double empty values are included as array in correct order', function() {
    var form = make('<form><input id="i1" name="do" value=""/><input id="i2" name="do" value="rey"/><input id="i3" name="do" value=""/></form>')
    var vals = htmx._('getInputValues')(byId('i3')).values
    vals.do.should.deep.equal(['', 'rey', ''])
  })

  it('hx-include works with form', function() {
    var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>')
    var div = make('<div hx-include="#f1"></div>')
    var vals = htmx._('getInputValues')(div).values
    vals.foo.should.equal('bar')
    vals.do.should.deep.equal(['rey', 'rey'])
  })

  it('hx-include works with input', function() {
    var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>')
    var div = make('<div hx-include="#i1"></div>')
    var vals = htmx._('getInputValues')(div).values
    vals.foo.should.equal('bar')
    should.equal(vals.do, undefined)
  })

  it('hx-include works with two inputs', function() {
    var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>')
    var div = make('<div hx-include="#i1, #i2"></div>')
    var vals = htmx._('getInputValues')(div).values
    vals.foo.should.equal('bar')
    vals.do.should.deep.equal(['rey', 'rey'])
  })

  it('hx-include works with two inputs, plus form', function() {
    var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>')
    var div = make('<div hx-include="#i1, #i2, #f1"></div>')
    var vals = htmx._('getInputValues')(div).values
    vals.foo.should.equal('bar')
    vals.do.should.deep.equal(['rey', 'rey'])
  })

  it('correctly URL escapes values', function() {
    htmx._('urlEncode')({}).should.equal('')
    htmx._('urlEncode')({ foo: 'bar' }).should.equal('foo=bar')
    htmx._('urlEncode')({ foo: 'bar', do: 'rey' }).should.equal('foo=bar&do=rey')
    htmx._('urlEncode')({ foo: 'bar', do: ['rey', 'blah'] }).should.equal('foo=bar&do=rey&do=blah')
  })

  it('form includes last focused button', function(done) {
    var form = make('<form hx-get="/foo"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><button id="b1" name="btn" value="bar"></button></form>')
    var input = byId('i1')
    var button = byId('b1')
    // Listen for focusin on form as it'll bubble up from the button, and htmx binds on the form itself
    form.addEventListener('focusin', function() {
      var vals = htmx._('getInputValues')(form).values
      vals.foo.should.equal('bar')
      vals.do.should.equal('rey')
      vals.btn.should.equal('bar')
      done()
    }, { once: true })
    button.focus()
    // Headless / Hardly-throttled CPU might result in 'focusin' not being fired, double it just in case
    htmx.trigger(button, 'focusin')
  })

  it('form includes last focused submit', function(done) {
    var form = make('<form hx-get="/foo"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input type="submit" id="s1" name="s1" value="bar"/></form>')
    var input = byId('i1')
    var button = byId('s1')
    // Listen for focusin on form as it'll bubble up from the button, and htmx binds on the form itself
    form.addEventListener('focusin', function() {
      var vals = htmx._('getInputValues')(form).values
      vals.foo.should.equal('bar')
      vals.do.should.equal('rey')
      vals.s1.should.equal('bar')
      done()
    }, { once: true })
    button.focus()
    // Headless / Hardly-throttled CPU might result in 'focusin' not being fired, double it just in case
    htmx.trigger(button, 'focusin')
  })

  it('form does not include button when focus is lost', function() {
    var form = make('<form hx-get="/foo"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input type="submit" id="s1" name="s1" value="bar"/></form>')
    var input = byId('i1')
    var button = byId('s1')
    button.focus()
    input.focus()
    var vals = htmx._('getInputValues')(form).values
    vals.foo.should.equal('bar')
    vals.do.should.equal('rey')
    should.equal(vals.s1, undefined)
  })

  it('form does not include button when focus is lost outside of form', function() {
    var form = make('<form hx-get="/foo"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input type="submit" id="s1" name="s1" value="bar"/></form>')
    var anchor = make('<button id="a1"></button>')
    var button = byId('s1')
    button.focus()
    anchor.focus()
    var vals = htmx._('getInputValues')(form).values
    vals.foo.should.equal('bar')
    vals.do.should.equal('rey')
    should.equal(vals.s1, undefined)
  })

  it('form includes button name and value if button has nested elements when clicked', function() {
    var form = make('<form hx-get="/foo"><input id="i1" name="foo" value="bar"/><button type="submit" id="btn1" name="do" value="rey"><div id="div1"><span id="span1"></span></div></button></form>')
    var nestedElt = byId('span1')
    nestedElt.click()
    var vals = htmx._('getInputValues')(form).values
    vals.do.should.equal('rey')
  })

  it('it puts GET params in the URL by default', function() {
    this.server.respondWith('GET', '/test?i1=value', function(xhr) {
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-get="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('it puts GET params in the body if methodsThatUseUrlParams is empty', function() {
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.requestBody.should.equal('i1=value')
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-get="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')

    try {
      htmx.config.methodsThatUseUrlParams = []
      form.click()
      this.server.respond()
      form.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.methodsThatUseUrlParams = ['get']
    }
  })

  it('it puts DELETE params in the body by default', function() {
    this.server.respondWith('DELETE', '/test', function(xhr) {
      xhr.requestBody.should.equal('i1=value')
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-delete="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('it puts DELETE params in the URL if methodsThatUseUrlParams contains "delete"', function() {
    this.server.respondWith('DELETE', '/test?i1=value', function(xhr) {
      xhr.respond(200, {}, 'Clicked!')
    })
    var form = make('<form hx-trigger="click" hx-delete="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>')

    try {
      htmx.config.methodsThatUseUrlParams.push('delete')
      form.click()
      this.server.respond()
      form.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.methodsThatUseUrlParams = ['get']
    }
  })

  it('Input within disabled fieldset is excluded', function() {
    var input = make('<form><input name="foo" value="bar"/><fieldset disabled><input name="do" value="rey"/></fieldset></form>')
    var vals = htmx._('getInputValues')(input, 'get').values
    vals.foo.should.equal('bar')
    should.equal(vals.do, undefined)
  })

  it('formdata works along web components', function() {
    // See https://web.dev/articles/more-capable-form-controls
    class TestElement extends HTMLElement {
      static formAssociated = true
      constructor() {
        super()
        this._form = null
      }

      formAssociatedCallback(form) {
        if (this._form) {
          this._form.removeEventListener('formdata', this.handleFormData)
        }
        this._form = form
        this._form.addEventListener('formdata', this.handleFormData)
      }

      handleFormData({
        formData
      }) {
        formData.append('foo', 'bar')
      }
    }
    customElements.define('test-element', TestElement)

    var form = make('<form hx-post="/test"><test-element></test-element></form>')
    var vals = htmx._('getInputValues')(form, 'get').values
    vals.foo.should.equal('bar')
  })

  it('formdata works with null values', function() {
    var form = make('<form hx-post="/test"><input name="foo" value="bar"/></form>')
    var vals = htmx._('getInputValues')(form, 'get').values
    function updateToNull() { vals.foo = null }
    updateToNull.should.not.throw()
    vals.foo.should.equal('null')
  })

  it('formdata can be used to construct a URLSearchParams instance', function() {
    var form = make('<input name="foo" value="bar"/>')
    var vals = htmx._('getInputValues')(form, 'get').values
    function makeSearchParams() { return new URLSearchParams(vals).toString() }
    makeSearchParams.should.not.throw()
    makeSearchParams().should.equal('foo=bar')
  })

  it('order of parameters follows order of input elements', function() {
    this.server.respondWith('GET', '/test?foo=bar&bar=foo&foo=bar&foo2=bar2', function(xhr) {
      xhr.respond(200, {}, 'Clicked!')
    })

    var form = make('<form hx-get="/test">' +
      '<input name="foo" value="bar">' +
      '<input name="bar" value="foo">' +
      '<input name="foo" value="bar">' +
      '<input name="foo2" value="bar2">' +
      '<button id="b1">Click Me!</button>' +
      '</form>')

    byId('b1').click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('order of parameters follows order of input elements with POST', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      xhr.requestBody.should.equal('foo=bar&bar=foo&foo=bar&foo2=bar2')
      xhr.respond(200, {}, 'Clicked!')
    })

    var form = make('<form hx-post="/test">' +
      '<input name="foo" value="bar">' +
      '<input name="bar" value="foo">' +
      '<input name="foo" value="bar">' +
      '<input name="foo2" value="bar2">' +
      '<button id="b1">Click Me!</button>' +
      '</form>')

    byId('b1').click()
    this.server.respond()
    form.innerHTML.should.equal('Clicked!')
  })

  it('file is correctly uploaded with file input', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      should.equal(xhr.requestHeaders['Content-Type'], undefined)

      const file = xhr.requestBody.get('file')
      file.should.instanceOf(File)
      file.name.should.equal('test.txt')

      xhr.respond(200, {}, 'OK')
    })

    const form = make('<form hx-post="/test" hx-target="#result" hx-encoding="multipart/form-data">' +
      '<input type="file" name="file">' +
      '<button type="submit"></button>' +
      '</form>')
    const input = form.querySelector('input')
    const file = new File(['Test'], 'test.txt', { type: 'text/plain' })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    input.files = dataTransfer.files

    const result = make('<div id="result"></div>')

    form.querySelector('button').click()
    this.server.respond()
    result.innerHTML.should.equal('OK')
  })

  it('file is not uploaded with blank filename', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      should.equal(xhr.requestHeaders['Content-Type'], undefined)

      const file = xhr.requestBody.get('file')
      should.equal(file, null)

      xhr.respond(200, {}, 'OK')
    })

    const form = make('<form hx-post="/test" hx-target="#result" hx-encoding="multipart/form-data">' +
      '<input type="file" name="file">' +
      '<button type="submit"></button>' +
      '</form>')
    const input = form.querySelector('input')
    const file = new File(['Test'], '', { type: 'text/plain' })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    input.files = dataTransfer.files

    const result = make('<div id="result"></div>')

    form.querySelector('button').click()
    this.server.respond()
    result.innerHTML.should.equal('OK')
  })

  it('file is correctly uploaded with htmx.ajax', function() {
    this.server.respondWith('POST', '/test', function(xhr) {
      should.equal(xhr.requestHeaders['Content-Type'], undefined)

      const file = xhr.requestBody.get('file')
      file.should.instanceOf(File)
      file.name.should.equal('test.txt')

      xhr.respond(200, {}, 'OK')
    })

    const div = make('<div hx-encoding="multipart/form-data"></div>')

    htmx.ajax('POST', '/test', {
      source: div,
      values: {
        file: new File(['Test'], 'test.txt', { type: 'text/plain' })
      }
    })

    this.server.respond()
    div.innerHTML.should.equal('OK')
  })
})
