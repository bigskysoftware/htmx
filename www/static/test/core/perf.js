describe('Core htmx perf Tests', function() {
  const chai = window.chai
  var HTMX_HISTORY_CACHE_NAME = 'htmx-history-cache'

  beforeEach(function() {
    this.server = makeServer()
    clearWorkArea()
    localStorage.removeItem(HTMX_HISTORY_CACHE_NAME)
  })
  afterEach(function() {
    this.server.restore()
    clearWorkArea()
    localStorage.removeItem(HTMX_HISTORY_CACHE_NAME)
  })

  function stringRepeat(str, num) {
    num = Number(num)

    var result = ''
    while (true) {
      if (num & 1) { // (1)
        result += str
      }
      num >>>= 1 // (2)
      if (num <= 0) break
      str += str
    }

    return result
  }

  it('history implementation should be fast', function() {
    // create an entry with a large content string (256k) and see how fast we can write and read it
    // to local storage as a single entry
    var entry = { url: stringRepeat('x', 32), content: stringRepeat('x', 256 * 1024) }
    var array = []
    for (var i = 0; i < 10; i++) {
      array.push(entry)
    }
    var start = performance.now()
    var string = JSON.stringify(array)
    localStorage.setItem(HTMX_HISTORY_CACHE_NAME, string)
    var reReadString = localStorage.getItem(HTMX_HISTORY_CACHE_NAME)
    var finalJson = JSON.parse(reReadString)
    var end = performance.now()
    var timeInMs = end - start
    chai.assert(timeInMs < 300, 'Should take less than 300ms on most platforms')
  })

  it('history snapshot cleaning should be fast', function() {
    var size = 5 * 1024 // ~350K in size, about the size of CNN's body tag :p
    var workArea = getWorkArea()
    var html = "<div class='foo bar'>Yay, really large HTML documents are fun!</div>\n"
    html = stringRepeat(html, size)
    workArea.insertAdjacentHTML('beforeend', html)
    var start = performance.now()
    htmx._('cleanInnerHtmlForHistory')(workArea)
    var end = performance.now()
    var timeInMs = end - start
    chai.assert(timeInMs < 50, 'Should take less than 50ms on most platforms')
  })
})
