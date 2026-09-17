describe('hx-partial', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('swaps partial with explicit hx-target', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='#d1'>Partial</hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Partial')
  })

  it('swaps partial with custom swap style', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='#d1' hx-swap='beforeend'>Appended</hx-partial>")
    make('<div id="d1">Existing</div>')
    var div = make('<div hx-get="/test">click me</div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('ExistingAppended')
  })

  it('swaps main target and partial target when both present', function() {
    this.server.respondWith('GET', '/test', "<div>Main</div><hx-partial hx-target='#d2' hx-swap='innerHTML'><span>Partial</span></hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d2">Old</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('<div>Main</div>')
    byId('d2').innerHTML.should.equal('<span>Partial</span>')
  })

  it('does not swap main target when response contains only partial', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='#d2'>Updated</hx-partial>")
    var div = make('<div hx-get="/test">Original</div>')
    make('<div id="d2">OOB</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Original')
    byId('d2').innerHTML.should.equal('Updated')
  })

  it('does not swap main target when only whitespace and partial present', function() {
    this.server.respondWith('GET', '/test', "\n  <hx-partial hx-target='#d1'>Updated</hx-partial>  \n")
    var div = make('<div hx-get="/test">Original</div>')
    make('<div id="d1">Old</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Original')
    byId('d1').innerHTML.should.equal('Updated')
  })

  it('swaps both targets when empty element and partial present', function() {
    this.server.respondWith('GET', '/test', "<p></p><hx-partial hx-target='#d1'>Updated</hx-partial>")
    var div = make('<div hx-get="/test">Original</div>')
    make('<div id="d1">Old</div>')
    div.click()
    this.server.respond()
    div.querySelector('p').should.not.equal(null)
    byId('d1').innerHTML.should.equal('Updated')
  })

  it('swaps both targets when plain text and partial present', function() {
    this.server.respondWith('GET', '/test', "Hello<hx-partial hx-target='#d1'>Updated</hx-partial>")
    var div = make('<div hx-get="/test">Original</div>')
    make('<div id="d1">Old</div>')
    div.click()
    this.server.respond()
    div.textContent.should.equal('Hello')
    byId('d1').innerHTML.should.equal('Updated')
  })

  it('swaps partial to all elements matching a class selector', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='.target' hx-swap='innerHTML'>Updated</hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1" class="target">A</div>')
    make('<div id="d2" class="target">B</div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Updated')
    byId('d2').innerHTML.should.equal('Updated')
  })

  it('resolves closest selector relative to triggering element', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='closest li' hx-swap='innerHTML'>Updated</hx-partial>")
    var li = make('<ul><li id="item-1">Item 1 <button id="btn" hx-get="/test">Edit</button></li></ul>')
    byId('btn').click()
    this.server.respond()
    byId('item-1').innerHTML.should.equal('Updated')
  })

  it('executes script in partial', function() {
    window.testVar = 0
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='#d1'><script>window.testVar = 42<\/script></hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    window.testVar.should.equal(42)
    delete window.testVar
  })

  it('template fallback form works identically', function() {
    this.server.respondWith('GET', '/test', '<template hx type="partial" hx-target="#d1">Partial</template>')
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Partial')
  })

  it('multiple partials in one response all execute', function() {
    this.server.respondWith('GET', '/test',
      "<hx-partial hx-target='#d1'>One</hx-partial><hx-partial hx-target='#d2'>Two</hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    make('<div id="d2"></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('One')
    byId('d2').innerHTML.should.equal('Two')
  })

  it('swaps partial using element id as implicit target', function() {
    this.server.respondWith('GET', '/test', "<hx-partial id='d1'>ByID</hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('ByID')
  })

  it('partial with no matching target does not throw', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='#nonexistent'>Content</hx-partial>")
    var div = make('<div hx-get="/test">Original</div>')
    div.click()
    this.server.respond()
    div.innerHTML.should.equal('Original')
  })

  it('swaps partial content independently to each matched target', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='.target' hx-swap='innerHTML'><b>Updated</b></hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1" class="target">A</div>')
    make('<div id="d2" class="target">B</div>')
    make('<div id="d3" class="target">C</div>')
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('<b>Updated</b>')
    byId('d2').innerHTML.should.equal('<b>Updated</b>')
    byId('d3').innerHTML.should.equal('<b>Updated</b>')
    // each target must have its own node, not the same shared reference
    byId('d1').querySelector('b').should.not.equal(byId('d2').querySelector('b'))
    byId('d2').querySelector('b').should.not.equal(byId('d3').querySelector('b'))
  })

  it('fires htmx:processTemplate for unknown hx-xxx tags allowing custom handling', function() {
    this.server.respondWith('GET', '/test', "<hx-toast message='Hello'></hx-toast>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    var fired = false
    var detail = null
    var listener = htmx.on('htmx:processTemplate', function(evt) {
      fired = true
      detail = evt.detail
      byId('d1').textContent = detail.template.getAttribute('message')
    })
    div.click()
    this.server.respond()
    fired.should.equal(true)
    detail.type.should.equal('toast')
    byId('d1').textContent.should.equal('Hello')
    htmx.off('htmx:processTemplate', listener)
  })

  it('partial initializes htmx attributes in swapped content', function() {
    this.server.respondWith('GET', '/test', "<hx-partial hx-target='#d1'><button id='btn2' hx-get='/other'>Go</button></hx-partial>")
    var div = make('<div hx-get="/test">click me</div>')
    make('<div id="d1"></div>')
    div.click()
    this.server.respond()
    should.exist(byId('btn2'))
    byId('btn2').getAttribute('hx-get').should.equal('/other')
  })
})
