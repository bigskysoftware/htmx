describe('Core htmx tokenizer tests', function() {
  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
  })

  function tokenize(str) {
    return htmx._('tokenizeString')(str)
  }

  function tokenizeTest(str, result) {
    return tokenize(str).should.deep.equal(result)
  }

  it('tokenizes properly', function() {
    tokenizeTest('', [])
    tokenizeTest('  ', [' ', ' '])
    tokenizeTest('(', ['('])
    tokenizeTest('()', ['(', ')'])
    tokenizeTest('(,)', ['(', ',', ')'])
    tokenizeTest(' ( ) ', [' ', '(', ' ', ')', ' '])
    tokenizeTest(' && ) ', [' ', '&', '&', ' ', ')', ' '])
    tokenizeTest(" && ) 'asdf'", [' ', '&', '&', ' ', ')', ' ', "'asdf'"])
    tokenizeTest(" && ) ',asdf'", [' ', '&', '&', ' ', ')', ' ', "',asdf'"])
    tokenizeTest('",asdf"', ['",asdf"'])
    tokenizeTest('&& ) ",asdf"', ['&', '&', ' ', ')', ' ', '",asdf"'])
  })

  it('generates conditionals property', function() {
    var tokens = tokenize('[code==4||(code==5&&foo==true)]')
    var conditional = htmx._('maybeGenerateConditional')(null, tokens)
    var func = eval(conditional)
    func({ code: 5, foo: true }).should.equal(true)
    func({ code: 5, foo: false }).should.equal(false)
    func({ code: 4, foo: false }).should.equal(true)
    func({ code: 3, foo: true }).should.equal(false)
  })
})
