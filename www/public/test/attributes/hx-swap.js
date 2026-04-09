describe('hx-swap attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('swap innerHTML properly', function() {
    this.server.respondWith('GET', '/test', '<a hx-get="/test2">Click Me</a>')
    this.server.respondWith('GET', '/test2', 'Clicked!')

    var div = make('<div hx-get="/test"></div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('<a hx-get="/test2">Click Me</a>')
    var a = div.querySelector('a')
    a.click()
    this.server.respond()
    a.innerHTML.should.equal('Clicked!')
  })

  it('swap textContent properly with HTML tags', function() {
    this.server.respondWith('GET', '/test', '<a id="a1" hx-get="/test2">Click Me</a>')

    var d1 = make('<div id="d1" hx-get="/test" hx-swap="textContent"></div>')
    d1.click()
    should.equal(byId('d1'), d1)
    this.server.respond()
    d1.textContent.should.equal('<a id="a1" hx-get="/test2">Click Me</a>')
    should.equal(byId('a1'), null)
  })

  it('swap textContent properly with HTML tags and text', function() {
    this.server.respondWith('GET', '/test', 'text content <a id="a1" hx-get="/test2">Click Me</a>')

    var d1 = make('<div id="d1" hx-get="/test" hx-swap="textContent"></div>')
    d1.click()
    should.equal(byId('d1'), d1)
    this.server.respond()
    d1.textContent.should.equal('text content <a id="a1" hx-get="/test2">Click Me</a>')
    should.equal(byId('a1'), null)
  })

  it('swap textContent ignores OOB swaps', function() {
    this.server.respondWith('GET', '/test', '<span id="d2" hx-swap-oob="true">hi</span> <a id="a1" hx-get="/test2">Click Me</a>')

    var d1 = make('<div id="d1" hx-get="/test" hx-swap="textContent"></div>')
    var d2 = make('<div id="d2">some text</div>')
    d1.click()
    should.equal(byId('d1'), d1)
    should.equal(byId('d2'), d2)
    this.server.respond()
    d1.textContent.should.equal('<span id="d2" hx-swap-oob="true">hi</span> <a id="a1" hx-get="/test2">Click Me</a>')
    d2.outerHTML.should.equal('<div id="d2">some text</div>')
    should.equal(byId('a1'), null)
  })

  it('swap textContent properly with text', function() {
    this.server.respondWith('GET', '/test', 'plain text')

    var div = make('<div id="d1" hx-get="/test" hx-swap="textContent"></div>')
    div.click()
    should.equal(byId('d1'), div)
    this.server.respond()
    div.textContent.should.equal('plain text')
    should.equal(byId('a1'), null)
  })

  it('swap outerHTML properly', function() {
    this.server.respondWith('GET', '/test', '<a id="a1" hx-get="/test2">Click Me</a>')
    this.server.respondWith('GET', '/test2', 'Clicked!')

    var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
    div.click()
    should.equal(byId('d1'), div)
    this.server.respond()
    should.equal(byId('d1'), null)
    byId('a1').click()
    this.server.respond()
    byId('a1').innerHTML.should.equal('Clicked!')
  })

  it('swap outerHTML on body falls back to innerHTML properly', function() {
    var fakebody = htmx._('parseHTML')('<body id="b1">Old Content</body>')
    var wa = getWorkArea()
    var fragment = htmx._('makeFragment')('<body hx-get="/test" hx-swap="outerHTML">Changed!</body>')
    wa.append(fakebody.querySelector('body'))
    htmx._('swapOuterHTML')(byId('b1'), fragment, {})
    byId('b1').innerHTML.should.equal('Changed!')
  })

  it('swap beforebegin properly', function() {
    var i = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      i++
      xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>')
    })
    this.server.respondWith('GET', '/test2', '*')

    var div = make('<div hx-get="/test" hx-swap="beforebegin">*</div>')
    var parent = div.parentElement
    div.click()
    this.server.respond()
    div.innerText.should.equal('*')
    removeWhiteSpace(parent.innerText).should.equal('1*')

    byId('a1').click()
    this.server.respond()
    removeWhiteSpace(parent.innerText).should.equal('**')

    div.click()
    this.server.respond()
    div.innerText.should.equal('*')
    removeWhiteSpace(parent.innerText).should.equal('*2*')

    byId('a2').click()
    this.server.respond()
    removeWhiteSpace(parent.innerText).should.equal('***')
  })

  it('swap afterbegin properly', function() {
    var i = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      i++
      xhr.respond(200, {}, '' + i)
    })

    var div = make('<div hx-get="/test" hx-swap="afterbegin">*</div>')

    div.click()
    this.server.respond()
    div.innerText.should.equal('1*')

    div.click()
    this.server.respond()
    div.innerText.should.equal('21*')

    div.click()
    this.server.respond()
    div.innerText.should.equal('321*')
  })

  it('swap afterbegin properly with no initial content', function() {
    var i = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      i++
      xhr.respond(200, {}, '' + i)
    })

    var div = make('<div hx-get="/test" hx-swap="afterbegin"></div>')

    div.click()
    this.server.respond()
    div.innerText.should.equal('1')

    div.click()
    this.server.respond()
    div.innerText.should.equal('21')

    div.click()
    this.server.respond()
    div.innerText.should.equal('321')
  })

  it('swap afterend properly', function() {
    var i = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      i++
      xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>')
    })
    this.server.respondWith('GET', '/test2', '*')

    var div = make('<div hx-get="/test" hx-swap="afterend">*</div>')
    var parent = div.parentElement
    div.click()
    this.server.respond()
    div.innerText.should.equal('*')
    removeWhiteSpace(parent.innerText).should.equal('*1')

    byId('a1').click()
    this.server.respond()
    removeWhiteSpace(parent.innerText).should.equal('**')

    div.click()
    this.server.respond()
    div.innerText.should.equal('*')
    removeWhiteSpace(parent.innerText).should.equal('*2*')

    byId('a2').click()
    this.server.respond()
    removeWhiteSpace(parent.innerText).should.equal('***')
  })

  it('handles beforeend properly', function() {
    var i = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      i++
      xhr.respond(200, {}, '' + i)
    })

    var div = make('<div hx-get="/test" hx-swap="beforeend">*</div>')

    div.click()
    this.server.respond()
    div.innerText.should.equal('*1')

    div.click()
    this.server.respond()
    div.innerText.should.equal('*12')

    div.click()
    this.server.respond()
    div.innerText.should.equal('*123')
  })

  it('handles beforeend properly with no initial content', function() {
    var i = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      i++
      xhr.respond(200, {}, '' + i)
    })

    var div = make('<div hx-get="/test" hx-swap="beforeend"></div>')

    div.click()
    this.server.respond()
    div.innerText.should.equal('1')

    div.click()
    this.server.respond()
    div.innerText.should.equal('12')

    div.click()
    this.server.respond()
    div.innerText.should.equal('123')
  })

  it('properly parses various swap specifications', function() {
    var swapSpec = htmx._('getSwapSpecification') // internal function for swap spec
    swapSpec(make('<div/>')).swapStyle.should.equal('innerHTML')
    swapSpec(make("<div hx-swap='innerHTML'/>")).swapStyle.should.equal('innerHTML')
    swapSpec(make("<div hx-swap='innerHTML'/>")).swapDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML'/>")).settleDelay.should.equal(0) // set to 0 in tests
    swapSpec(make("<div hx-swap='innerHTML swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML swap:0'/>")).swapDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML swap:0ms'/>")).swapDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML settle:10'/>")).settleDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML settle:0'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML settle:0s'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML swap:10 settle:11'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML swap:10 settle:11'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='innerHTML settle:11 swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='innerHTML settle:11 swap:10'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='innerHTML settle:0 swap:0'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML settle:0 swap:0'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML settle:0s swap:0ms'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML settle:0s swap:0ms'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='innerHTML nonsense settle:11 swap:10'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='innerHTML   nonsense   settle:11   swap:10  '/>")).settleDelay.should.equal(11)

    swapSpec(make("<div hx-swap='swap:10'/>")).swapStyle.should.equal('innerHTML')
    swapSpec(make("<div hx-swap='swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='swap:0'/>")).swapDelay.should.equal(0)
    swapSpec(make("<div hx-swap='swap:0s'/>")).swapDelay.should.equal(0)

    swapSpec(make("<div hx-swap='settle:10'/>")).swapStyle.should.equal('innerHTML')
    swapSpec(make("<div hx-swap='settle:10'/>")).settleDelay.should.equal(10)
    swapSpec(make("<div hx-swap='settle:0'/>")).settleDelay.should.equal(0)
    swapSpec(make("<div hx-swap='settle:0s'/>")).settleDelay.should.equal(0)

    swapSpec(make("<div hx-swap='swap:10 settle:11'/>")).swapStyle.should.equal('innerHTML')
    swapSpec(make("<div hx-swap='swap:10 settle:11'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='swap:10 settle:11'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='swap:0s settle:0'/>")).swapDelay.should.equal(0)
    swapSpec(make("<div hx-swap='swap:0s settle:0'/>")).settleDelay.should.equal(0)

    swapSpec(make("<div hx-swap='settle:11 swap:10'/>")).swapStyle.should.equal('innerHTML')
    swapSpec(make("<div hx-swap='settle:11 swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='settle:11 swap:10'/>")).settleDelay.should.equal(11)
    swapSpec(make("<div hx-swap='settle:0s swap:10'/>")).swapDelay.should.equal(10)
    swapSpec(make("<div hx-swap='settle:0s swap:10'/>")).settleDelay.should.equal(0)

    swapSpec(make("<div hx-swap='transition:true'/>")).transition.should.equal(true)

    swapSpec(make("<div hx-swap='customstyle settle:11 swap:10'/>")).swapStyle.should.equal('customstyle')
  })

  it('works with a swap delay', function(done) {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make("<div hx-get='/test' hx-swap='innerHTML swap:10ms'></div>")
    div.click()
    this.server.respond()
    div.innerText.should.equal('')
    setTimeout(function() {
      div.innerText.should.equal('Clicked!')
      done()
    }, 30)
  })

  it('works immediately with no swap delay', function(done) {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make(
      "<div hx-get='/test' hx-swap='innerHTML swap:0ms'></div>"
    )
    div.click()
    this.server.respond()
    div.innerText.should.equal('Clicked!')
    done()
  })

  if (/chrome/i.test(navigator.userAgent)) {
    it('works with transition:true', function(done) {
      this.server.respondWith('GET', '/test', 'Clicked!')
      var div = make(
        "<div hx-get='/test' hx-swap='innerHTML transition:true'></div>"
      )
      div.click()
      this.server.respond()
      div.innerText.should.equal('')
      setTimeout(function() {
        div.innerText.should.equal('Clicked!')
        done()
      }, 50)
    })
  }
  it('works with a settle delay', function(done) {
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML settle:10ms'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML settle:10ms'></div>")
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      done()
    }, 30)
  })

  it('works with no settle delay', function(done) {
    this.server.respondWith(
      'GET',
      '/test',
      "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML settle:0ms'></div>"
    )
    var div = make(
      "<div id='d1' hx-get='/test' hx-swap='outerHTML settle:0ms'></div>"
    )
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      done()
    }, 30)
  })

  it('works with scroll:top', function(done) {
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML scroll:#container:top'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML scroll:#container:top'></div>")
    var container = make('<div id="container" style="overflow: scroll; height: 150px; width: 150px;">' +
      '<p>' +
        'Far out in the uncharted backwaters of the unfashionable end of the western' +
        'spiral arm of the Galaxy lies a small unregarded yellow sun. Orbiting this' +
        'at a distance of roughly ninety-two million miles is an utterly' +
        'insignificant little blue green planet whose ape-descended life forms are so' +
        'amazingly primitive that they still think digital watches are a pretty neat' +
        'idea.' +
      '</p>' +
    '</div>')
    container.scrollTop = 10
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      container.scrollTop.should.equal(0)
      done()
    }, 30)
  })

  it('works with scroll:bottom', function(done) {
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML scroll:#container:bottom'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML scroll:#container:bottom'></div>")
    var container = make('<div id="container" style="overflow: scroll; height: 150px; width: 150px;">' +
      '<p>' +
        'Far out in the uncharted backwaters of the unfashionable end of the western' +
        'spiral arm of the Galaxy lies a small unregarded yellow sun. Orbiting this' +
        'at a distance of roughly ninety-two million miles is an utterly' +
        'insignificant little blue green planet whose ape-descended life forms are so' +
        'amazingly primitive that they still think digital watches are a pretty neat' +
        'idea.' +
      '</p>' +
    '</div>')
    container.scrollTop = 10
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      container.scrollTop.should.not.equal(10)
      done()
    }, 30)
  })

  it('works with show:top', function(done) {
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML show:top'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML show:#d2:top'></div>")
    var div2 = make("<div id='d2'></div>")
    var scrollOptions
    div2.scrollIntoView = function(options) { scrollOptions = options }
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      scrollOptions.block.should.equal('start')
      done()
    }, 30)
  })

  it('works with show:bottom', function(done) {
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML show:bottom'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML show:#d2:bottom'></div>")
    var div2 = make("<div id='d2'></div>")
    var scrollOptions
    div2.scrollIntoView = function(options) { scrollOptions = options }
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      scrollOptions.block.should.equal('end')
      done()
    }, 30)
  })

  it('works with show:window:bottom', function(done) {
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML show:window:bottom'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML show:window:bottom'></div>")
    var scrollOptions
    document.body.scrollIntoView = function(options) { scrollOptions = options }
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      scrollOptions.block.should.equal('end')
      done()
    }, 30)
  })

  it('works with focus-scroll:true', function(done) {
    // no easy way to tell if the scroll worked as expected
    this.server.respondWith('GET', '/test', "<div id='d1' class='foo' hx-get='/test' hx-swap='outerHTML focus-scroll:true'><input id='i2' type='text'></div>")
    var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML focus-scroll:true'><input id='i2' type='text'></div>")
    byId('i2').focus()
    div.click()
    this.server.respond()
    div.classList.contains('foo').should.equal(false)
    setTimeout(function() {
      byId('d1').classList.contains('foo').should.equal(true)
      done()
    }, 30)
  })

  it('swap outerHTML properly  w/ data-* prefix', function() {
    this.server.respondWith('GET', '/test', '<a id="a1" data-hx-get="/test2">Click Me</a>')
    this.server.respondWith('GET', '/test2', 'Clicked!')

    var div = make('<div id="d1" data-hx-get="/test" data-hx-swap="outerHTML"></div>')
    div.click()
    should.equal(byId('d1'), div)
    this.server.respond()
    should.equal(byId('d1'), null)
    byId('a1').click()
    this.server.respond()
    byId('a1').innerHTML.should.equal('Clicked!')
  })

  it('swap none works properly', function() {
    this.server.respondWith('GET', '/test', 'Ooops, swapped')

    var div = make('<div hx-swap="none" hx-get="/test">Foo</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Foo')
  })

  it('swap outerHTML does not trigger htmx:afterSwap on original element', function() {
    this.server.respondWith('GET', '/test', 'Clicked!')
    var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
    div.addEventListener('htmx:afterSwap', function() {
      count++
    })
    div.click()
    var count = 0
    should.equal(byId('d1'), div)
    this.server.respond()
    should.equal(byId('d1'), null)
    count.should.equal(0)
  })
  it('swap delete works properly', function() {
    this.server.respondWith('GET', '/test', 'Oops, deleted!')

    var div = make('<div id="d1" hx-swap="delete" hx-get="/test">Foo</div>')
    div.click()
    this.server.respond()
    should.equal(byId('d1'), null)
  })

  it('in presence of bad swap spec, it uses the default swap strategy', function() {
    var initialSwapStyle = htmx.config.defaultSwapStyle
    htmx.config.defaultSwapStyle = 'outerHTML'
    try {
      this.server.respondWith('GET', '/test', 'Clicked!')

      var div = make('<div><button id="b1" hx-swap="foo" hx-get="/test">Initial</button></div>')
      var b1 = byId('b1')
      b1.click()
      this.server.respond()
      div.innerHTML.should.equal('Clicked!')
    } finally {
      htmx.config.defaultSwapStyle = initialSwapStyle
    }
  })

  it('hx-swap ignoreTitle works', function() {
    window.document.title = 'Test Title'
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, "<title class=''>htmx rocks!</title>Clicked!")
    })
    var btn = make('<button hx-get="/test" hx-swap="innerHTML ignoreTitle:true">Click Me!</button>')
    btn.click()
    this.server.respond()
    btn.innerText.should.equal('Clicked!')
    window.document.title.should.equal('Test Title')
  })

  it('swapError fires if swap throws exception', function() {
    try {
      // override makeSettleInfo to cause swap function to throw exception
      htmx._('htmx.backupMakeSettleInfo = makeSettleInfo')
      htmx._('makeSettleInfo = function() { throw new Error("throw") }')
      var error = false
      var handler = htmx.on('htmx:swapError', function(evt) {
        error = true
      })

      this.server.respondWith('GET', '/test', 'Clicked!')
      var div = make("<div hx-get='/test'></div>")
      div.click()
      this.server.respond()
    } catch (e) {
    } finally {
      div.innerHTML.should.equal('')
      error.should.equal(true)
      htmx.off('htmx:swapError', handler)
      htmx._('makeSettleInfo = htmx.backupMakeSettleInfo')
    }
  })
})
