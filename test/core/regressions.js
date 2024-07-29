describe('Core htmx Regression Tests', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('SVGs process properly in IE11', function() {
    var btn = make('<svg onclick="document.getElementById(\'contents\').classList.toggle(\'show\')" class="hamburger" viewBox="0 0 100 80" width="25" height="25" style="margin-bottom:-5px">\n' +
            '<rect width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>\n' +
            '<rect y="30" width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>\n' +
            '<rect y="60" width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>\n' +
            '</svg>')
  })

  it('Handles https://github.com/bigskysoftware/htmx/issues/4 properly', function() {
    this.server.respondWith('GET', '/index2a.php',
      "<div id='message' hx-swap-oob='true'>I came from message oob swap I should be second</div>" +
            "<div id='message2' hx-swap-oob='true'>I came from a message2 oob swap I should be third  but I am in the wrong spot</div>" +
            "I'm page2 content (non-swap) I should be first")

    var h1 = make('' +
            "<div id='page2' ></div>" +
            "<div id='message'></div>" +
            "<div id='message2'></div>" +
        "<h1 hx-get='/index2a.php' hx-target='#page2' hx-trigger='click'>Kutty CLICK ME</h1>")
    h1.click()
    this.server.respond()
    htmx.find('#page2').innerHTML.should.equal("I'm page2 content (non-swap) I should be first")
    htmx.find('#message').innerHTML.should.equal('I came from message oob swap I should be second')
    htmx.find('#message2').innerHTML.should.equal('I came from a message2 oob swap I should be third  but I am in the wrong spot')
  })

  it('Handles https://github.com/bigskysoftware/htmx/issues/33 "empty values" properly', function() {
    this.server.respondWith('POST', '/htmx.php', function(xhr) {
      xhr.respond(200, {}, xhr.requestBody)
    })

    var form = make('<form hx-trigger="click" hx-post="/htmx.php">\n' +
            '<input type="text" name="variable" value="">\n' +
            '<button type="submit">Submit</button>\n' +
            '</form>')
    form.click()
    this.server.respond()
    form.innerHTML.should.equal('variable=')
  })

  it('name=id doesnt cause an error', function() {
    this.server.respondWith('GET', '/test', 'Foo<form><input name="id"/></form>')
    var div = make('<div hx-get="/test">Get It</div>')
    div.click()
    this.server.respond()
    div.innerText.should.contain('Foo')
  })

  it('empty id doesnt cause an error', function() {
    this.server.respondWith('GET', '/test', "Foo\n<div id=''></div>")
    var div = make('<div hx-get="/test">Get It</div>')
    div.click()
    this.server.respond()
    div.innerText.should.contain('Foo')
  })

  it('id with dot in value doesnt cause an error', function() {
    this.server.respondWith('GET', '/test', "Foo <div id='ViewModel.Test'></div>")
    var div = make('<div hx-get="/test">Get It</div>')
    div.click()
    this.server.respond()
    div.innerText.should.contain('Foo')
  })

  it('@ symbol in attributes does not break requests', function() {
    this.server.respondWith('GET', '/test', "<div id='d1' @foo='bar'>Foo</div>")
    var div = make('<div hx-get="/test">Get It</div>')
    div.click()
    this.server.respond()
    byId('d1').getAttribute('@foo').should.equal('bar')
  })

  it('@ symbol in attributes does not break attribute settling requests', function() {
    this.server.respondWith('GET', '/test', "<div id='d1' @foo='bar'>Foo</div>")
    var div = make('<div hx-get="/test"><div id="d1">Foo</div></div>')
    div.click()
    this.server.respond()
    byId('d1').getAttribute('@foo').should.equal('bar')
  })

  it('selected element with ID does not cause NPE when it disappears', function() {
    this.server.respondWith('GET', '/test', "<div id='d1'>Replaced</div>")
    var input = make('<input hx-trigger="click" hx-get="/test" id="i1" hx-swap="outerHTML">')
    input.focus()
    input.click()
    this.server.respond()
    byId('d1').innerText.should.equal('Replaced')
  })

  it('does not submit with a false condition on a form', function() {
    this.server.respondWith('POST', '/test', 'Submitted')
    var defaultPrevented = false
    htmx.on('click', function(evt) {
      defaultPrevented = evt.defaultPrevented
    })
    var form = make('<form hx-post="/test" hx-trigger="click[false]"></form>')
    form.click()
    this.server.respond()
    defaultPrevented.should.equal(true)
  })

  it('two elements can listen for the same event on another element', function() {
    this.server.respondWith('GET', '/test', 'triggered')

    make('<div id="d1" hx-trigger="click from:body" hx-get="/test"></div>' +
            '        <div id="d2" hx-trigger="click from:body" hx-get="/test"></div>')

    var div1 = byId('d1')
    var div2 = byId('d2')

    document.body.click()
    this.server.respond()

    div2.innerHTML.should.equal('triggered')
    div1.innerHTML.should.equal('triggered')
  })

  it('a form can reset based on the htmx:afterRequest event', function() {
    this.server.respondWith('POST', '/test', 'posted')

    var form = make('<div id="d1"></div><form _="on htmx:afterRequest reset() me" hx-post="/test" hx-target="#d1">' +
            '  <input type="text" name="input" id="i1"/>' +
            '  <input type="submit" id="s1"/>' +
            '</form>')
    htmx.trigger(form, 'htmx:load') // have to manually trigger the load event for non-AJAX dynamic content

    var div1 = byId('d1')
    var input = byId('i1')
    input.value = 'foo'
    var submit = byId('s1')

    input.value.should.equal('foo')
    submit.click()
    this.server.respond()

    div1.innerHTML.should.equal('posted')
    input.value.should.equal('') // form should be reset
  })

  it('supports image maps', function() {
    this.server.respondWith('GET', '/test', 'triggered')

    make('<div>' +
            '    <div id="d1"></div>' +
            '    <img src="img/bars.svg" usemap="#workmap" width="400" height="379">' +
            '' +
            '    <map name="workmap">' +
            '        <area shape="rect" coords="34,44,270,350" alt="Computer" hx-get="/test" hx-target="#d1">' +
            '    </map>' +
            '</div>')

    var div1 = byId('d1')
    var area = document.getElementsByTagName('area')[0]

    area.click()
    this.server.respond()

    div1.innerHTML.should.equal('triggered')
  })

  it('supports unset on hx-select', function() {
    this.server.respondWith('GET', '/test', "Foo<span id='example'>Bar</span>")
    make('<form hx-select="#example">\n' +
            '      <button id="b1" hx-select="unset" hx-get="/test">Initial</button>\n' +
            '</form>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()

    btn.innerText.should.equal('FooBar')
  })

  it("can trigger swaps from fields that don't support setSelectionRange", function() {
    const template = '<form id="formtest"> \n' +
              '<input hx-get="/test" hx-target="#formtest" hx-trigger="click" type="text" id="id_email" value="test@test.com" />\n' +
              '</form>'

    const response = '<form id="formtest">\n' +
              '<input hx-get="/test" hx-target="#formtest" hx-trigger="click" type="email" id="id_email" value="supertest@test.com" />\n' +
              '</form>'
    this.server.respondWith('GET', '/test', response)
    make(template)
    var input = byId('id_email')
    // HTMX only attempts to restore the selection on inputs that have a current selection and are active.
    // additionally we can't set the selection on email inputs (that's the whole bug) so start as a text input where you can set selection
    // and replace with an email
    input.focus()
    input.selectionStart = 3
    input.selectionEnd = 3
    input.click()
    this.server.respond()
    var input = byId('id_email')
    input.value.should.equal('supertest@test.com')
  })

  it('script tags only execute once', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<script>console.trace(); window.i++</script>') // increment the count by 1

    // make a div w/ a short settle delay to make the problem more obvious
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(1)
      delete window.i
      done()
    }, 50)
  })

  it('script tags only execute once when nested', function(done) {
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<p>foo</p><div><script>console.trace(); window.i++</script></div>') // increment the count by 1

    // make a div w/ a short settle delay to make the problem more obvious
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(1)
      delete window.i
      done()
    }, 50)
  })

  it('htmx.config.allowScriptTags properly disables script tags', function(done) {
    htmx.config.allowScriptTags = false
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<script>console.trace(); window.i++</script>') // increment the count by 1

    // make a div w/ a short settle delay to make the problem more obvious
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      htmx.config.allowScriptTags = true
      delete window.i
      done()
    }, 50)
  })

  it('htmx.config.allowScriptTags properly disables script tags when nested', function(done) {
    htmx.config.allowScriptTags = false
    window.i = 0 // set count to 0
    this.server.respondWith('GET', '/test', '<div><script>console.trace(); window.i++</script></div>') // increment the count by 1

    // make a div w/ a short settle delay to make the problem more obvious
    var div = make('<div hx-get="/test" hx-swap="innerHTML settle:5ms"/>')
    div.click()
    this.server.respond()

    setTimeout(function() {
      window.i.should.equal(0)
      htmx.config.allowScriptTags = true
      delete window.i
      done()
    }, 50)
  })
})

it('a modified click trigger on a form does not prevent the default behaviour of other elements - https://github.com/bigskysoftware/htmx/issues/2755', function(done) {
  var defaultPrevented = 'unset'
  make('<input type="date" id="datefield">')
  make('<form hx-trigger="click from:body"></form>')

  htmx.on('#datefield', 'click', function(evt) {
    // we need to wait so the state of the evt is finalized
    setTimeout(() => {
      defaultPrevented = evt.defaultPrevented
      try {
        defaultPrevented.should.equal(false)
        done()
      } catch (err) {
        done(err)
      }
    }, 0)
  })

  byId('datefield').click()
})
