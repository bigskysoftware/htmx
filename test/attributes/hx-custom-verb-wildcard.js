describe('hx-custom-verb attribute', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('issues a custom verb request', function() {
    this.server.respondWith('RESET_PASSWORD', '/test', function(xhr) {
      xhr.respond(200, {}, 'Password reset!')
    })
    make('<script lang="js">htmx.config.customVerbs.push(\'reset_password\')</script>')

    var btn = make('<button hx-custom-verb-reset_password="/test">Click me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Password reset!')

    make('<script lang="js">htmx.config.customVerbs = htmx.config.customVerbs.filter((verb) => verb !== \'reset_password\')</script>')
  })

  it('issues a custom verb request w/ data-* prefix', function() {
    this.server.respondWith('RESET_PASSWORD', '/test', function(xhr) {
      xhr.respond(200, {}, 'Password reset!')
    })
    make('<script lang="js">htmx.config.customVerbs.push(\'reset_password\')</script>')

    var btn = make('<button data-hx-custom-verb-reset_password="/test">Click me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.equal('Password reset!')

    make('<script lang="js">htmx.config.customVerbs = htmx.config.customVerbs.filter((verb) => verb !== \'reset_password\')</script>')
  })

  it('does not issues a custom verb request if the config is not set', function() {
    this.server.respondWith('RESET_PASSWORD', '/test', function(xhr) {
      xhr.respond(200, {}, 'Password reset!')
    })

    // Do not add configuration to prove effectiveness
    var btn = make('<button hx-custom-verb-reset_password="/test">Click me!</button>')
    btn.click()
    this.server.respond()
    btn.innerHTML.should.not.equal('Password reset!')
    btn.innerHTML.should.equal('Click me!')
  })
})
