describe('Core htmx internals Tests', function() {
  const chai = window.chai
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  it('makeFragment works with janky stuff', function() {
    htmx._('makeFragment')('<html></html>').children.length.should.equal(0)
    htmx._('makeFragment')('<html><body></body></html>').children.length.should.equal(0)

    // NB - the tag name should be the *parent* element hosting the HTML since we use the fragment children
    // for the swap
    htmx._('makeFragment')('<td></td>').firstElementChild.tagName.should.equal('TD')
    htmx._('makeFragment')('<thead></thead>').firstElementChild.tagName.should.equal('THEAD')
    htmx._('makeFragment')('<col></col>').firstElementChild.tagName.should.equal('COL')
    htmx._('makeFragment')('<tr></tr>').firstElementChild.tagName.should.equal('TR')
  })

  it('makeFragment works with template wrapping', function() {
    htmx._('makeFragment')('<html></html>').children.length.should.equal(0)
    htmx._('makeFragment')('<html><body></body></html>').children.length.should.equal(0)

    var fragment = htmx._('makeFragment')('<td></td>')
    fragment.firstElementChild.tagName.should.equal('TD')

    fragment = htmx._('makeFragment')('<thead></thead>')
    fragment.firstElementChild.tagName.should.equal('THEAD')

    fragment = htmx._('makeFragment')('<col></col>')
    fragment.firstElementChild.tagName.should.equal('COL')

    fragment = htmx._('makeFragment')('<tr></tr>')
    fragment.firstElementChild.tagName.should.equal('TR')
  })

  it('makeFragment works with template wrapping and funky combos', function() {
    htmx.config.useTemplateFragments = true
    try {
      var fragment = htmx._('makeFragment')('<td></td><div></div>')
      fragment.children[0].tagName.should.equal('TD')
      fragment.children[1].tagName.should.equal('DIV')
    } finally {
      htmx.config.useTemplateFragments = false
    }
  })

  it('set header works with non-ASCII values', function() {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', '/dummy')
    htmx._('safelySetHeaderValue')(xhr, 'Example', 'привет')
    // unfortunately I can't test the value :/
    // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
  })

  it('handles parseInterval correctly', function() {
    chai.expect(htmx.parseInterval('1ms')).to.be.equal(1)
    chai.expect(htmx.parseInterval('300ms')).to.be.equal(300)
    chai.expect(htmx.parseInterval('1s')).to.be.equal(1000)
    chai.expect(htmx.parseInterval('1.5s')).to.be.equal(1500)
    chai.expect(htmx.parseInterval('2s')).to.be.equal(2000)
    chai.expect(htmx.parseInterval('0ms')).to.be.equal(0)
    chai.expect(htmx.parseInterval('0s')).to.be.equal(0)
    chai.expect(htmx.parseInterval('0m')).to.be.equal(0)
    chai.expect(htmx.parseInterval('0')).to.be.equal(0)
    chai.expect(htmx.parseInterval('5')).to.be.equal(5)

    chai.expect(htmx.parseInterval(null)).to.be.undefined
    chai.expect(htmx.parseInterval('')).to.be.undefined
    chai.expect(htmx.parseInterval('undefined')).to.be.undefined
    chai.expect(htmx.parseInterval('true')).to.be.undefined
    chai.expect(htmx.parseInterval('false')).to.be.undefined
  })

  it('tokenizes correctly', function() {
    chai.expect(htmx._('tokenizeString')('a,')).to.be.deep.equal(['a', ','])
    chai.expect(htmx._('tokenizeString')('aa,')).to.be.deep.equal(['aa', ','])
    chai.expect(htmx._('tokenizeString')('aa,aa')).to.be.deep.equal(['aa', ',', 'aa'])
    chai.expect(htmx._('tokenizeString')('aa.aa')).to.be.deep.equal(['aa', '.', 'aa'])
  })

  it('tags respond correctly to shouldCancel', function() {
    var anchorThatShouldCancel = make("<a href='/foo'></a>")
    htmx._('shouldCancel')({ type: 'click' }, anchorThatShouldCancel).should.equal(true)

    var anchorThatShouldCancel = make("<a href='#'></a>")
    htmx._('shouldCancel')({ type: 'click' }, anchorThatShouldCancel).should.equal(true)

    var anchorThatShouldNotCancel = make("<a href='#foo'></a>")
    htmx._('shouldCancel')({ type: 'click' }, anchorThatShouldNotCancel).should.equal(false)

    var form = make('<form></form>')
    htmx._('shouldCancel')({ type: 'submit', target: document.createElement('form') }, form).should.equal(true)

    htmx._('shouldCancel')({ type: 'click', target: document.createElement('form') }, form).should.equal(true)

    // function works also when target isn't an Element
    htmx._('shouldCancel')({ type: 'click', target: null }, form).should.equal(false)

    var form = make("<form><input id='i1' type='submit'></form>")
    var input = byId('i1')
    htmx._('shouldCancel')({ type: 'click', target: document.createElement('input') }, input).should.equal(true)

    var form = make("<form><button id='b1' type='submit'></form>")
    var button = byId('b1')
    htmx._('shouldCancel')({ type: 'click', target: document.createElement('button') }, button).should.equal(true)
  })

  it('unset properly unsets a given attribute', function() {
    make("<div foo='1'><div foo='2'><div foo='unset' id='d1'></div></div></div>")
    var div = byId('d1')
    should.equal(undefined, htmx._('getClosestAttributeValue')(div, 'foo'))
  })

  it('unset properly unsets a given attribute on a parent', function() {
    make("<div foo='1'><div foo='unset'><div id='d1'></div></div></div>")
    var div = byId('d1')
    should.equal(undefined, htmx._('getClosestAttributeValue')(div, 'foo'))
  })

  it('unset does not unset a value below it in the hierarchy', function() {
    make("<div foo='unset'><div foo='2'><div id='d1'></div></div></div>")
    var div = byId('d1')
    should.equal('2', htmx._('getClosestAttributeValue')(div, 'foo'))
  })

  it('encoding values respects enctype on forms', function() {
    var form = make("<form enctype='multipart/form-data'></form>")
    var value = htmx._('encodeParamsForBody')(null, form, {});
    (value instanceof FormData).should.equal(true)
  })
})
