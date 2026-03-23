describe('Class attribute cleanup after htmx operations', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('removes empty class attribute after settling class is removed', function() {
    this.server.respondWith('GET', '/test', 'Settled!')

    var div = make('<div hx-get="/test">Click Me!</div>')
    // Element starts with no class attribute
    should.not.exist(div.getAttribute('class'))

    div.click()
    this.server.respond()

    div.innerHTML.should.equal('Settled!')
    // After settle, the settling class should be gone and no empty class="" left behind
    should.not.exist(div.getAttribute('class'))
  })

  it('removes empty class attribute after swapping class is removed', function() {
    this.server.respondWith('GET', '/test', '<div id="target">Swapped!</div>')

    var div = make('<div id="target" hx-get="/test" hx-swap="outerHTML">Click Me!</div>')
    should.not.exist(div.getAttribute('class'))

    div.click()
    this.server.respond()

    var result = byId('target')
    result.innerHTML.should.equal('Swapped!')
    should.not.exist(result.getAttribute('class'))
  })

  it('preserves existing classes and only removes htmx utility classes', function() {
    this.server.respondWith('GET', '/test', 'Done!')

    var div = make('<div class="my-class" hx-get="/test">Click Me!</div>')
    div.getAttribute('class').should.equal('my-class')

    div.click()
    this.server.respond()

    div.innerHTML.should.equal('Done!')
    // Original class should remain, htmx utility classes should not
    div.getAttribute('class').should.equal('my-class')
  })

  it('removes empty class attribute from indicators after request completes', function() {
    this.server.respondWith('GET', '/test', 'Done!')

    var indicator = make('<div id="ind"></div>')
    var btn = make('<button hx-get="/test" hx-indicator="#ind">Click Me!</button>')

    should.not.exist(indicator.getAttribute('class'))

    btn.click()
    // During request, indicator should have the request class
    indicator.classList.contains(htmx.config.requestClass).should.equal(true)

    this.server.respond()

    // After request, indicator should not have an empty class attribute
    should.not.exist(indicator.getAttribute('class'))
  })
})
