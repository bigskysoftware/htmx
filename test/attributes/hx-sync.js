describe('hx-sync attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('can use drop strategy', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this:drop"><button id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    var b2 = byId('b2')
    b1.click()
    b2.click()
    this.server.respond()
    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
  })

  it('defaults to the drop strategy', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this"><button id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    var b2 = byId('b2')
    b1.click()
    b2.click()
    this.server.respond()
    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
  })

  it('can use replace strategy', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this:replace"><button id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    var b2 = byId('b2')
    b1.click()
    b2.click()
    this.server.respond()
    this.server.respond()
    b1.innerHTML.should.equal('Initial')
    b2.innerHTML.should.equal('Click 0')
  })

  it('can use queue all strategy', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this:queue all"><button id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button>' +
            '                                      <button id="b3" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    b1.click()

    var b2 = byId('b2')
    b2.click()

    var b3 = byId('b3')
    b3.click()

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
    b3.innerHTML.should.equal('Initial')

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Click 1')
    b3.innerHTML.should.equal('Initial')

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Click 1')
    b3.innerHTML.should.equal('Click 2')
  })

  it('can use queue last strategy', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this:queue last"><button id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button>' +
            '                                      <button id="b3" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    b1.click()

    var b2 = byId('b2')
    b2.click()

    var b3 = byId('b3')
    b3.click()

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
    b3.innerHTML.should.equal('Initial')

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
    b3.innerHTML.should.equal('Click 1')

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
    b3.innerHTML.should.equal('Click 1')
  })

  it('can use queue first strategy', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this:queue first"><button id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button>' +
            '                                      <button id="b3" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    b1.click()

    var b2 = byId('b2')
    b2.click()

    var b3 = byId('b3')
    b3.click()

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Initial')
    b3.innerHTML.should.equal('Initial')

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Click 1')
    b3.innerHTML.should.equal('Initial')

    this.server.respond()
    b1.innerHTML.should.equal('Click 0')
    b2.innerHTML.should.equal('Click 1')
    b3.innerHTML.should.equal('Initial')
  })

  it('can use abort strategy to end existing abortable request', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this"><button hx-sync="closest div:abort" id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    var b2 = byId('b2')
    b1.click()
    b2.click()
    this.server.respond()
    this.server.respond()
    b1.innerHTML.should.equal('Initial')
    b2.innerHTML.should.equal('Click 0')
  })

  it('can use abort strategy to drop abortable request when one is in flight', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div hx-sync="this"><button hx-sync="closest div:abort" id="b1" hx-get="/test">Initial</button>' +
            '                                      <button id="b2" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    var b2 = byId('b2')
    b2.click()
    b1.click()
    this.server.respond()
    this.server.respond()
    b1.innerHTML.should.equal('Initial')
    b2.innerHTML.should.equal('Click 0')
  })

  it('can abort a request programmatically', function() {
    var count = 0
    this.server.respondWith('GET', '/test', function(xhr) {
      xhr.respond(200, {}, 'Click ' + count++)
    })
    make('<div><button id="b1" hx-get="/test">Initial</button>' +
            '             <button id="b2" hx-get="/test">Initial</button></div>')
    var b1 = byId('b1')
    var b2 = byId('b2')
    b1.click()
    b2.click()

    htmx.trigger(b1, 'htmx:abort')

    this.server.respond()
    this.server.respond()
    b1.innerHTML.should.equal('Initial')
    b2.innerHTML.should.equal('Click 0')
  })
})
