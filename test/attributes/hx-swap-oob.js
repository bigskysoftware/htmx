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

  it('handles remvoing hx-swap-oob tag', function() {
    this.server.respondWith('GET', '/test', "Clicked<div id='d1' data-hx-swap-oob='true'>Swapped3</div>")
    var div = make('<div data-hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked')
    byId('d1').innerHTML.should.equal('Swapped3')
    byId('d1').hasAttribute('hx-swap-oob').should.equal(false)
  })

  it('handles remvoing data-hx-swap-oob tag', function() {
    this.server.respondWith('GET', '/test', "Clicked<div id='d1' data-hx-swap-oob='true'>Swapped3</div>")
    var div = make('<div data-hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Clicked')
    byId('d1').innerHTML.should.equal('Swapped3')
    byId('d1').hasAttribute('data-hx-swap-oob').should.equal(false)
  })

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
    var finalContent = '<div class="new-target">Swapped9</div>'
    this.server.respondWith('GET', '/test', '<div>Clicked</div>' + oobSwapContent)
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"><div>No swap</div></div>')
    make('<div id="d2"><div class="target">Not swapped</div></div>')
    make('<div id="d3"><div class="target">Not swapped</div></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('<div>No swap</div>')
    byId('d2').innerHTML.should.equal(finalContent)
    byId('d3').innerHTML.should.equal(finalContent)
  })

  it('oob swap delete works properly', function() {
    this.server.respondWith('GET', '/test', '<div hx-swap-oob="delete" id="d1"></div>')

    var div = make('<div id="d1" hx-get="/test">Foo</div>')
    div.click()
    this.server.respond()
    should.equal(byId('d1'), null)
  })

  it('oob swap removes templates used for oob encapsulation only properly', function() {
    this.server.respondWith('GET', '/test', '' +
        'Clicked<template><div hx-swap-oob="outerHTML" id="d1">Foo</div></template>')
    var div = make('<button hx-get="/test" id="b1">Click Me</button>' +
        '<div id="d1" ></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    should.equal(byId('b1').innerHTML, 'Clicked')
    should.equal(byId('d1').innerHTML, 'Foo')
  })

  it('oob swap keeps templates not used for oob swap encapsulation', function() {
    this.server.respondWith('GET', '/test', '' +
        'Clicked<template></template>')
    var div = make('<button hx-get="/test" id="b1">Click Me</button>' +
        '<div id="d1" ></div>')
    var btn = byId('b1')
    btn.click()
    this.server.respond()
    should.equal(byId('b1').innerHTML, 'Clicked<template></template>')
    should.equal(byId('d1').innerHTML, '')
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
  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('handles oob target in web components with both inside shadow root and config ' + JSON.stringify(config), function() {
      this.server.respondWith('GET', '/test', '<div hx-swap-oob="innerHTML:#oob-swap-target">new contents</div>Clicked')
      class TestElement extends HTMLElement {
        connectedCallback() {
          const root = this.attachShadow({ mode: 'open' })
          root.innerHTML = `
            <button hx-get="/test" hx-target="next div">Click me!</button>
            <div id="main-target"></div>
            <div id="oob-swap-target">this should get swapped</div>
          `
          htmx.process(root) // Tell HTMX about this component's shadow DOM
        }
      }
      var elementName = 'test-oobswap-inside-' + config.allowNestedOobSwaps
      customElements.define(elementName, TestElement)
      var div = make(`<div><div id="oob-swap-target">this should not get swapped</div><${elementName}/></div>`)
      var badTarget = div.querySelector('#oob-swap-target')
      var webComponent = div.querySelector(elementName)
      var btn = webComponent.shadowRoot.querySelector('button')
      var goodTarget = webComponent.shadowRoot.querySelector('#oob-swap-target')
      var mainTarget = webComponent.shadowRoot.querySelector('#main-target')
      btn.click()
      this.server.respond()
      should.equal(mainTarget.textContent, 'Clicked')
      should.equal(goodTarget.textContent, 'new contents')
      should.equal(badTarget.textContent, 'this should not get swapped')
    })
  }
  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('handles oob target in web components with main target outside web component config ' + JSON.stringify(config), function() {
      this.server.respondWith('GET', '/test', '<div hx-swap-oob="innerHTML:#oob-swap-target">new contents</div>Clicked')
      class TestElement extends HTMLElement {
        connectedCallback() {
          const root = this.attachShadow({ mode: 'open' })
          root.innerHTML = `
            <button hx-get="/test" hx-target="global #main-target">Click me!</button>
            <div id="main-target"></div>
            <div id="oob-swap-target">this should get swapped</div>
          `
          htmx.process(root) // Tell HTMX about this component's shadow DOM
        }
      }
      var elementName = 'test-oobswap-global-main-' + config.allowNestedOobSwaps
      customElements.define(elementName, TestElement)
      var div = make(`<div><div id="main-target"></div><div id="oob-swap-target">this should not get swapped</div><${elementName}/></div>`)
      var badTarget = div.querySelector('#oob-swap-target')
      var webComponent = div.querySelector(elementName)
      var btn = webComponent.shadowRoot.querySelector('button')
      var goodTarget = webComponent.shadowRoot.querySelector('#oob-swap-target')
      var mainTarget = div.querySelector('#main-target')
      btn.click()
      this.server.respond()
      should.equal(mainTarget.textContent, 'Clicked')
      should.equal(goodTarget.textContent, 'new contents')
      should.equal(badTarget.textContent, 'this should not get swapped')
    })
  }
  for (const config of [{ allowNestedOobSwaps: true }, { allowNestedOobSwaps: false }]) {
    it('handles global oob target in web components with main target inside web component config ' + JSON.stringify(config), function() {
      this.server.respondWith('GET', '/test', '<div hx-swap-oob="innerHTML:global #oob-swap-target">new contents</div>Clicked')
      class TestElement extends HTMLElement {
        connectedCallback() {
          const root = this.attachShadow({ mode: 'open' })
          root.innerHTML = `
            <button hx-get="/test" hx-target="next div">Click me!</button>
            <div id="main-target"></div>
            <div id="oob-swap-target">this should not get swapped</div>
          `
          htmx.process(root) // Tell HTMX about this component's shadow DOM
        }
      }
      var elementName = 'test-oobswap-global-oob-' + config.allowNestedOobSwaps
      customElements.define(elementName, TestElement)
      var div = make(`<div><div id="main-target"></div><div id="oob-swap-target">this should get swapped</div><${elementName}/></div>`)
      var webComponent = div.querySelector(elementName)
      var badTarget = webComponent.shadowRoot.querySelector('#oob-swap-target')
      var btn = webComponent.shadowRoot.querySelector('button')
      var goodTarget = div.querySelector('#oob-swap-target')
      var mainTarget = webComponent.shadowRoot.querySelector('#main-target')
      btn.click()
      this.server.respond()
      should.equal(mainTarget.textContent, 'Clicked')
      should.equal(goodTarget.textContent, 'new contents')
      should.equal(badTarget.textContent, 'this should not get swapped')
    })
  }

  it.skip('triggers htmx:oobErrorNoTarget when no targets found', function(done) {
    // this test fails right now because when targets not found it returns an empty array which makes it miss the event as it should be if (targets.lenght)
    this.server.respondWith('GET', '/test', "Clicked<div id='nonexistent' hx-swap-oob='true'>Swapped</div>")
    var div = make('<div hx-get="/test">click me</div>')

    // Define the event listener function so it can be removed later
    var eventListenerFunction = function(event) {
      event.detail.content.innerHTML.should.equal('Swapped')
      document.body.removeEventListener('htmx:oobErrorNoTarget', eventListenerFunction)
      done()
    }

    document.body.addEventListener('htmx:oobErrorNoTarget', eventListenerFunction)
    div.click()
    this.server.respond()
  })

  it('handles elements with IDs containing special characters properly', function() {
    this.server.respondWith('GET', '/test', '<div id="foo-/bar/" hx-swap-oob="innerHTML">Swapped10</div>')
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="foo-/bar/">Existing Content</div>')
    div.click()
    this.server.respond()
    var swappedElement = document.querySelector('[id="foo-/bar/"]')
    swappedElement.innerHTML.should.equal('Swapped10')
  })

  it('handles one swap into multiple elements with the same ID properly', function() {
    this.server.respondWith('GET', '/test', '<div id="foo-/bar/" hx-swap-oob="innerHTML">Swapped11</div>')
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="foo-/bar/">Existing Content 1</div>')
    make('<div id="foo-/bar/">Existing Content 2</div>')
    div.click()
    this.server.respond()
    var swappedElements = document.querySelectorAll('[id="foo-/bar/"]')
    swappedElements.forEach(function(element) {
      element.innerHTML.should.equal('Swapped11')
    })
  })
})
