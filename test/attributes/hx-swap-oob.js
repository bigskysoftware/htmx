describe('hx-swap-oob attribute', function() {
  const savedConfig = htmx.config
  beforeEach(function() {
    this.server = makeServer()
    htmx.config = Object.assign({}, savedConfig)
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    htmx.config = savedConfig
    clearWorkArea()
  })

  // Repeat the same test to make sure it works with different configurations
  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('handles basic response properly with config ' + JSON.stringify(config), function() {
      Object.assign(htmx.config, config)
      this.server.respondWith('GET', '/test', "Clicked<div id='d1' hx-swap-oob='true'>Swapped0</div>")
      var div = make('<div hx-get="/test">click me</div>')
      make('<div id="d1"></div>')
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked')
      byId('d1').innerHTML.should.equal('Swapped0')
    })
  }

  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('oob swap works when the response has a body tag with config ' + JSON.stringify(config), function() {
      Object.assign(htmx.config, config)
      this.server.respondWith('GET', '/test', "<body>Clicked<div id='d2' hx-swap-oob='true'>Swapped0</div></body>")
      var div = make('<div hx-get="/test">click me</div>')
      make('<div id="d2"></div>')
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked')
      byId('d2').innerHTML.should.equal('Swapped0')
    })
  }

  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('oob swap works when the response has html and body tags with config ' + JSON.stringify(config), function() {
      Object.assign(htmx.config, config)
      this.server.respondWith('GET', '/test', "<html><body>Clicked<div id='d3' hx-swap-oob='true'>Swapped0</div></body></html>")
      var div = make('<div hx-get="/test">click me</div>')
      make('<div id="d3"></div>')
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked')
      byId('d3').innerHTML.should.equal('Swapped0')
    })
  }

  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('handles more than one oob swap properly with config ' + JSON.stringify(config), function() {
      Object.assign(htmx.config, config)
      this.server.respondWith('GET', '/test', "Clicked<div id='d1' hx-swap-oob='true'>Swapped1</div><div id='d2' hx-swap-oob='true'>Swapped2</div>")
      var div = make('<div hx-get="/test">click me</div>')
      make('<div id="d1"></div>')
      make('<div id="d2"></div>')
      div.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked')
      byId('d1').innerHTML.should.equal('Swapped1')
      byId('d2').innerHTML.should.equal('Swapped2')
    })
  }

  it('handles no id match properly', function() {
    this.server.respondWith('GET', '/test', "Clicked<div id='d1' hx-swap-oob='true'>Swapped2</div>")
    var div = make('<div hx-get="/test">click me</div>')
    div.click()
    this.server.respond()
    div.innerText.should.equal('Clicked')
  })

  it('handles basic response properly w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', "Clicked<div id='d1' data-hx-swap-oob='true'>Swapped3</div>")
    var div = make('<div data-hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked')
    byId('d1').innerHTML.should.equal('Swapped3')
  })

  it('handles outerHTML response properly', function() {
    this.server.respondWith('GET', '/test', "Clicked<div id='d1' foo='bar' hx-swap-oob='outerHTML'>Swapped4</div>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    byId('d1').getAttribute('foo').should.equal('bar')
    div.innerHTML.should.equal('Clicked')
    byId('d1').innerHTML.should.equal('Swapped4')
  })

  it('handles innerHTML response properly', function() {
    this.server.respondWith('GET', '/test', "Clicked<div id='d1' foo='bar' hx-swap-oob='innerHTML'>Swapped5</div>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    should.equal(byId('d1').getAttribute('foo'), null)
    div.innerHTML.should.equal('Clicked')
    byId('d1').innerHTML.should.equal('Swapped5')
  })

  it('oob swaps can be nested in content with config {"allowNestedOobSwaps": true}', function() {
    htmx.config.allowNestedOobSwaps = true
    this.server.respondWith('GET', '/test', "<div>Clicked<div id='d1' foo='bar' hx-swap-oob='innerHTML'>Swapped6</div></div>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    should.equal(byId('d1').getAttribute('foo'), null)
    div.innerHTML.should.equal('<div>Clicked</div>')
    byId('d1').innerHTML.should.equal('Swapped6')
  })

  it('oob swaps in nested content are ignored and stripped with config {"allowNestedOobSwaps": false}', function() {
    htmx.config.allowNestedOobSwaps = false
    this.server.respondWith('GET', '/test', '<div>Clicked<div hx-swap-oob="innerHTML:#d1">Swapped6.1</div></div>')
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('')
    div.innerHTML.should.equal('<div>Clicked<div>Swapped6.1</div></div>')
  })

  it('oob swaps can use selectors to match up', function() {
    this.server.respondWith('GET', '/test', "<div>Clicked<div hx-swap-oob='innerHTML:[oob-foo]'>Swapped7</div></div>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1" oob-foo="bar"></div>')
    div.click()
    this.server.respond()
    should.equal(byId('d1').getAttribute('oob-foo'), 'bar')
    div.innerHTML.should.equal('<div>Clicked</div>')
    byId('d1').innerHTML.should.equal('Swapped7')
  })

  it('swaps into all targets that match the selector (innerHTML)', function() {
    this.server.respondWith('GET', '/test', "<div>Clicked</div><div class='target' hx-swap-oob='innerHTML:.target'>Swapped8</div>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1">No swap</div>')
    make('<div id="d2" class="target">Not swapped</div>')
    make('<div id="d3" class="target">Not swapped</div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('No swap')
    byId('d2').innerHTML.should.equal('Swapped8')
    byId('d3').innerHTML.should.equal('Swapped8')
  })

  it('swaps into all targets that match the selector (outerHTML)', function() {
    var oobSwapContent = '<div class="new-target" hx-swap-oob="outerHTML:.target">Swapped9</div>'
    this.server.respondWith('GET', '/test', '<div>Clicked</div>' + oobSwapContent)
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"><div>No swap</div></div>')
    make('<div id="d2"><div class="target">Not swapped</div></div>')
    make('<div id="d3"><div class="target">Not swapped</div></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('<div>No swap</div>')
    byId('d2').innerHTML.should.equal(oobSwapContent)
    byId('d3').innerHTML.should.equal(oobSwapContent)
  })

  it('oob swap delete works properly', function() {
    this.server.respondWith('GET', '/test', '<div hx-swap-oob="delete" id="d1"></div>')

    var div = make('<div id="d1" hx-get="/test">Foo</div>')
    div.click()
    this.server.respond()
    should.equal(byId('d1'), null)
  })

  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('oob swap supports table row in fragment along other oob swap elements with config ' + JSON.stringify(config), function() {
      Object.assign(htmx.config, config)
      this.server.respondWith('GET', '/test',
        `Clicked
      <div hx-swap-oob="innerHTML" id="d1">Test</div>
      <button type="button" hx-swap-oob="true" id="b2">Another button</button>
      <template>
        <tr hx-swap-oob="true" id="r1"><td>bar</td></tr>
      </template>
      <template>
        <td hx-swap-oob="true" id="td1">hey</td>
      </template>`)

      make(`<div id="d1">Bar</div>
      <button id="b2">Foo</button>
      <table id="table">
        <tbody id="tbody">
          <tr id="r1">
           <td>foo</td>
          </tr>
          <tr>
            <td id="td1">Bar</td>
          </tr>
        </tbody>
      </table>`)

      var btn = make('<button id="b1" type="button" hx-get="/test">Click me</button>')
      btn.click()
      this.server.respond()
      btn.innerText.should.equal('Clicked')
      byId('r1').innerHTML.should.equal('<td>bar</td>')
      byId('b2').innerHTML.should.equal('Another button')
      byId('d1').innerHTML.should.equal('Test')
      byId('td1').innerHTML.should.equal('hey')
    })
  }
})
