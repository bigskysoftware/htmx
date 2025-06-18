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

    anchorThatShouldCancel = make("<a href='#'></a>")
    htmx._('shouldCancel')({ type: 'click' }, anchorThatShouldCancel).should.equal(true)

    var anchorThatShouldNotCancel = make("<a href='#foo'></a>")
    htmx._('shouldCancel')({ type: 'click' }, anchorThatShouldNotCancel).should.equal(false)

    var divThatShouldNotCancel = make('<div></div>')
    htmx._('shouldCancel')({ type: 'click' }, divThatShouldNotCancel).should.equal(false)

    var form = make('<form></form>')
    htmx._('shouldCancel')({ type: 'submit', target: form }, form).should.equal(true)
    htmx._('shouldCancel')({ type: 'click', target: form }, form).should.equal(true)

    // falls back to check elt tag when target is not an element
    htmx._('shouldCancel')({ type: 'click', target: null }, form).should.equal(true)

    // check that events targeting elements that shouldn't cancel don't cancel
    htmx._('shouldCancel')({ type: 'submit', target: anchorThatShouldNotCancel }, form).should.equal(false)
    htmx._('shouldCancel')({ type: 'click', target: divThatShouldNotCancel }, form).should.equal(false)

    form = make('<form id="f1">' +
        '<input id="insideInput" type="submit">' +
        '<button id="insideFormBtn"></button>' +
        '<button id="insideSubmitBtn" type="submit"></button>' +
        '<button id="insideResetBtn" type="reset"></button>' +
        '<button id="insideButtonBtn" type="button"></button>' +
        '</form>' +
        '<input id="outsideInput" form="f1" type="submit">' +
        '<button id="outsideFormBtn" form="f1"></button>' +
        '<button id="outsideSubmitBtn" form="f1" type="submit"></button>")' +
        '<button id="outsideButtonBtn" form="f1" type="button"></button>")' +
        '<button id="outsideResetBtn" form="f1" type="reset"></button>")' +
        '<button id="outsideNoFormBtn"></button>")')
    htmx._('shouldCancel')({ type: 'click' }, byId('insideInput')).should.equal(true)
    htmx._('shouldCancel')({ type: 'click' }, byId('insideFormBtn')).should.equal(true)
    htmx._('shouldCancel')({ type: 'click' }, byId('insideSubmitBtn')).should.equal(true)
    htmx._('shouldCancel')({ type: 'click' }, byId('insideResetBtn')).should.equal(false)
    htmx._('shouldCancel')({ type: 'click' }, byId('insideButtonBtn')).should.equal(false)

    htmx._('shouldCancel')({ type: 'click' }, byId('outsideInput')).should.equal(true)
    htmx._('shouldCancel')({ type: 'click' }, byId('outsideFormBtn')).should.equal(true)
    htmx._('shouldCancel')({ type: 'click' }, byId('outsideSubmitBtn')).should.equal(true)
    htmx._('shouldCancel')({ type: 'click' }, byId('outsideButtonBtn')).should.equal(false)
    htmx._('shouldCancel')({ type: 'click' }, byId('outsideResetBtn')).should.equal(false)
    htmx._('shouldCancel')({ type: 'click' }, byId('outsideNoFormBtn')).should.equal(false)
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

  it('Calling onpopstate to trigger backup and restore of page triggers htmx:restored event', function() {
    var restored
    var handler = htmx.on('htmx:restored', function(event) {
      restored = true
    })
    make('<div hx-get="/test" hx-trigger="restored">Not Called</div>')
    window.onpopstate({ state: { htmx: true } })
    restored.should.equal(true)
    htmx.off('htmx:restored', handler)
  })

  it('scroll position is restored from history restore', function() {
    make('<div style="height: 1000px;" hx-get="/test" hx-trigger="restored">Not Called</div>')
    window.scrollTo(0, 50)
    window.onpopstate({ state: { htmx: true } })
    parseInt(window.scrollY).should.equal(50)
  })

  it('calling onpopstate with no htmx state not true calls original popstate', function() {
    window.onpopstate({ state: { htmx: false } })
  })

  it('getPathFromResponse returns paths when valid', function() {
    var path = htmx._('getPathFromResponse')({ responseURL: 'https://htmx.org/somepath?a=b#fragment' })
    should.equal(path, '/somepath?a=b')
    path = htmx._('getPathFromResponse')({ responseURL: 'notvalidurl' })
    should.equal(path, undefined)
  })

  it('appendParam can process objects', function() {
    var param = htmx._('appendParam')('a=b', 'jim', 'foo')
    should.equal(param, 'a=b&jim=foo')
    param = htmx._('appendParam')('a=b', 'jim', '{"foo":"bar"}')
    should.equal(param, 'a=b&jim=%7B%22foo%22%3A%22bar%22%7D')
    param = htmx._('appendParam')('a=b', 'jim', { foo: 'bar' })
    should.equal(param, 'a=b&jim=%7B%22foo%22%3A%22bar%22%7D')
  })

  it('handleTitle falls back to setting document.title when no title head element', function() {
    var oldTitle = window.document.title
    document.querySelector('title').remove()
    htmx._('handleTitle')('update title')
    window.document.title.should.equal('update title')
    window.document.title = oldTitle
  })

  it('without meta config getMetaConfig returns null', function() {
    document.querySelector('meta[name="htmx-config"]').remove()
    should.equal(htmx._('getMetaConfig')(), null)
  })

  it('internalAPI settleImmediately completes settle tasks', function() {
    // settleImmediately is no longer used internally and may no longer be needed at all
    // as swapping without settleing does not seem via internalAPI
    const fragment = htmx._('makeFragment')('<div>Content</div>')
    const historyElement = htmx._('getHistoryElement')()
    const settleInfo = htmx._('makeSettleInfo')(historyElement)
    htmx._('swapInnerHTML')(historyElement, fragment, settleInfo)
    historyElement.firstChild.className.should.equal('htmx-added')
    htmx._('settleImmediately')(settleInfo.tasks)
    historyElement.firstChild.className.should.equal('')
  })
})
