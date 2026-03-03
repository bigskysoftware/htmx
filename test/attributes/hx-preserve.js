describe('hx-preserve attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('handles basic response properly', function() {
    this.server.respondWith('GET', '/test', "<div id='d1' hx-preserve>New Content</div><div id='d2'>New Content</div>")
    var div = make("<div hx-get='/test'><div id='d1' hx-preserve>Old Content</div><div id='d2'>Old Content</div></div>")
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Old Content')
    byId('d2').innerHTML.should.equal('New Content')
  })

  it('handles preserved element that might not be existing', function() {
    this.server.respondWith('GET', '/test', "<div id='d1' hx-preserve>New Content</div><div id='d2'>New Content</div>")
    var div = make("<div hx-get='/test'><div id='d2'>Old Content</div></div>")
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('New Content')
    byId('d2').innerHTML.should.equal('New Content')
  })

  it('preserved element should not be swapped if it lies outside of hx-select', function() {
    this.server.respondWith('GET', '/test', "<div id='d1' hx-preserve>New Content</div><div id='d2'>New Content</div>")
    var div = make("<div hx-get='/test' hx-target='#d2' hx-select='#d2' hx-swap='outerHTML'><div id='d1' hx-preserve>Old Content</div><div id='d2'>Old Content</div></div>")
    div.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Old Content')
    byId('d2').innerHTML.should.equal('New Content')
  })

  it('preserved element should not be swapped if it is part of a oob swap', function() {
    this.server.respondWith('GET', '/test', "Normal Content<div id='d2' hx-swap-oob='true'><div id='d3' hx-preserve>New oob Content</div><div id='d4'>New oob Content</div></div>")
    var div1 = make("<div id='d1' hx-get='/test'>Click Me!</div>")
    var div2 = make("<div id='d2'><div id='d3' hx-preserve>Old Content</div></div>")
    div1.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Normal Content')
    byId('d3').innerHTML.should.equal('Old Content')
    byId('d4').innerHTML.should.equal('New oob Content')
  })

  it('preserved element should not be swapped if it is part of a hx-select-oob swap', function() {
    this.server.respondWith('GET', '/test', "Normal Content<div id='d2'><div id='d3' hx-preserve>New oob Content</div><div id='d4'>New oob Content</div></div>")
    var div1 = make("<div id='d1' hx-get='/test' hx-select-oob='#d2'>Click Me!</div>")
    var div2 = make("<div id='d2'><div id='d3' hx-preserve>Old Content</div></div>")
    div1.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Normal Content')
    byId('d3').innerHTML.should.equal('Old Content')
    byId('d4').innerHTML.should.equal('New oob Content')
  })

  it('preserved element should relocated unchanged if it is part of a oob swap targeting a different loction', function() {
    this.server.respondWith('GET', '/test', "Normal Content<div id='d2' hx-swap-oob='innerHTML:#d5'><div id='d3' hx-preserve>New oob Content</div><div id='d4'>New oob Content</div></div>")
    var div1 = make("<div id='d1' hx-get='/test'>Click Me!</div>")
    var div2 = make("<div id='d2'><div id='d3' hx-preserve>Old Content</div></div>")
    var div5 = make("<div id='d5'></div>")
    div1.click()
    this.server.respond()
    byId('d1').innerHTML.should.equal('Normal Content')
    byId('d2').innerHTML.should.equal('')
    byId('d5').innerHTML.should.equal('<div id="d3" hx-preserve="">Old Content</div><div id="d4">New oob Content</div>')
  })

  it('when moveBefore is disabled/missing preseved content is copied into fragment instead of pantry', function() {
    var div = make("<div hx-get='/test'><div id='d1' hx-preserve>Old Content</div><div id='d2'>Old Content</div></div>")
    var fragment = htmx._('makeFragment')('<div id="d1" hx-preserve>New Content</div>')
    fragment.firstChild.moveBefore = undefined
    htmx._('handlePreservedElements')(fragment)
    fragment.firstChild.innerHTML.should.equal('Old Content')
  })
})
