(function(chaiDom) {
  if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
    module.exports = chaiDom
  } else if (typeof define === 'function' && define.amd) {
    define(function() {
      return chaiDom
    })
  } else {
    chai.use(chaiDom)
  }
}(function(chai, utils) {
  var flag = utils.flag,

  elToString = function(el) {
    var desc
    if (isNodeList(el)) {
      if (el.length === 0) {
        return 'empty NodeList'
      }

      desc = Array.prototype.slice.call(el, 0, 5).map(elToString).join(', ')
      return el.length > 5 ? desc + '... (+' + (el.length - 5) + ' more)' : desc
    }
    if (!isHTMLElement(el)) {
      return String(el)
    }

    desc = el.tagName.toLowerCase()
    if (el.id) {
      desc += '#' + el.id
    }
    if (el.className) {
      desc += '.' + String(el.className).replace(/\s+/g, '.')
    }
    Array.prototype.forEach.call(el.attributes, function(attr) {
      if (attr.name !== 'class' && attr.name !== 'id') {
        desc += '[' + attr.name + (attr.value ? '="' + attr.value + '"]' : ']')
      }
    })
    return desc
  },

  attrAssert = function(name, val) {
    var el = flag(this, 'object'), actual = el.getAttribute(name)

    if (!flag(this, 'negate') || undefined === val) {
      this.assert(
        !!el.attributes[name]
        , 'expected ' + elToString(el) + ' to have an attribute #{exp}'
        , 'expected ' + elToString(el) + ' not to have an attribute #{exp}'
        , name
      )
    }

    if (undefined !== val) {
      this.assert(
        val === actual
        , 'expected ' + elToString(el) + ' to have an attribute ' + utils.inspect(name) + ' with the value #{exp}, but the value was #{act}'
        , 'expected ' + elToString(el) + ' not to have an attribute ' + utils.inspect(name) + ' with the value #{act}'
        , val
        , actual
      )
    }

    flag(this, 'object', actual)
  },

  isHTMLElement = function(el) {
    return el.nodeType === 1 // window.Node.ELEMENT_NODE
  },

  isNodeList = function(obj) {
    return Object.prototype.toString.call(obj) === '[object NodeList]'
  }

  utils.elToString = elToString
  chai.Assertion.addMethod('attr', attrAssert)
  chai.Assertion.addMethod('attribute', attrAssert)

  chai.Assertion.addMethod('class', function(className) {
    var el = flag(this, 'object')

    if (className instanceof RegExp) {
      return this.assert(
        Array.from(el.classList).some(function(cls) { return className.test(cls) })
        , 'expected ' + elToString(el) + ' to have class matching #{exp}'
        , 'expected ' + elToString(el) + ' not to have class matching #{exp}'
        , className
      )
    }

    this.assert(
      el.classList.contains(className)
      , 'expected ' + elToString(el) + ' to have class #{exp}'
      , 'expected ' + elToString(el) + ' not to have class #{exp}'
      , className
    )
  })

  chai.Assertion.addMethod('id', function(id) {
    var el = flag(this, 'object')
    this.assert(
      el.id == id
      , 'expected ' + elToString(el) + ' to have id #{exp}'
      , 'expected ' + elToString(el) + ' not to have id #{exp}'
      , id
    )
  })

  chai.Assertion.addMethod('html', function(html) {
    var el = flag(this, 'object'), actual = flag(this, 'object').innerHTML

    if (flag(this, 'contains')) {
      this.assert(
        actual.indexOf(html) >= 0
        , 'expected #{act} to contain HTML #{exp}'
        , 'expected #{act} not to contain HTML #{exp}'
        , html
        , actual
      )
    } else {
      this.assert(
        actual === html
        , 'expected ' + elToString(el) + ' to have HTML #{exp}, but the HTML was #{act}'
        , 'expected ' + elToString(el) + ' not to have HTML #{exp}'
        , html
        , actual
      )
    }
  })

  chai.Assertion.addChainableMethod('trimmed', null, function() {
    flag(this, 'trim-text', true)
  })

  chai.Assertion.addProperty('rendered', function() {
    flag(this, 'rendered-text', true)
  })

  chai.Assertion.addMethod('text', function(text) {
    var obj = flag(this, 'object'), contains = flag(this, 'contains'),
        trim = flag(this, 'trim-text'), actual, result
    var property = flag(this, 'rendered-text') ? 'innerText' : 'textContent'

    if (isNodeList(obj)) {
      actual = Array.prototype.map.call(obj, function(el) { return trim ? el[property].trim() : el[property] })
      if (Array.isArray(text)) {
        result = contains ?
          text[flag(this, 'negate') ? 'some' : 'every'](function(t) {
            return Array.prototype.some.call(obj, function(el) {
              return (trim ? el[property].trim() : el[property]) === t
            })
          })
          :
          utils.eql(actual, text)

        actual = actual.join()
        text = text.join()
      } else {
        actual = actual.join('')
        result = contains ? actual.indexOf(text) >= 0 : actual === text
      }
    } else {
      actual = trim ? obj[property].trim() : obj[property]
      result = contains ? actual.indexOf(text) >= 0 : actual === text
    }

    var objDesc = elToString(obj)
    var textMsg = ''

    if (trim) {
      textMsg += 'trimmed '
    }
    if (flag(this, 'rendered-text')) {
      textMsg += 'rendered '
    }
    textMsg += 'text'

    if (contains) {
      this.assert(
        result
        , 'expected ' + objDesc + ' to contain #{exp}, but the ' + textMsg + ' was #{act}'
        , 'expected ' + objDesc + ' not to contain #{exp}, but the ' + textMsg + ' was #{act}'
        , text
        , actual
      )
    } else {
      this.assert(
        result
        , 'expected ' + objDesc + ' to have ' + textMsg + ' #{exp}, but the ' + textMsg + ' was #{act}'
        , 'expected ' + objDesc + ' not to have ' + textMsg + ' #{exp}'
        , text
        , actual
      )
    }
  })

  chai.Assertion.addMethod('value', function(value) {
    var el = flag(this, 'object'), actual = flag(this, 'object').value
    this.assert(
      flag(this, 'object').value === value
      , 'expected ' + elToString(el) + ' to have value #{exp}, but the value was #{act}'
      , 'expected ' + elToString(el) + ' not to have value #{exp}'
      , value
      , actual
    )
  })

  chai.Assertion.overwriteProperty('exist', function(_super) {
    return function() {
      var obj = flag(this, 'object')
      if (isNodeList(obj)) {
        this.assert(
          obj.length > 0
          , 'expected an empty NodeList to have nodes'
          , 'expected ' + elToString(obj) + ' to not exist')
      } else {
        _super.apply(this, arguments)
      }
    }
  })

  chai.Assertion.overwriteProperty('empty', function(_super) {
    return function() {
      var obj = flag(this, 'object')
      if (isHTMLElement(obj)) {
        this.assert(
          obj.children.length === 0
          , 'expected ' + elToString(obj) + ' to be empty'
          , 'expected ' + elToString(obj) + ' to not be empty')
      } else if (isNodeList(obj)) {
        this.assert(
          obj.length === 0
          , 'expected ' + elToString(obj) + ' to be empty'
          , 'expected ' + elToString(obj) + ' to not be empty')
      } else {
        _super.apply(this, arguments)
      }
    }
  })

  chai.Assertion.overwriteChainableMethod('length',
    function(_super) {
      return function(length) {
        var obj = flag(this, 'object')
        if (isNodeList(obj) || isHTMLElement(obj)) {
          var actualLength = obj.children ? obj.children.length : obj.length
          this.assert(
              actualLength === length
            , 'expected ' + elToString(obj) + ' to have #{exp} children but it had #{act} children'
            , 'expected ' + elToString(obj) + ' to not have #{exp} children'
            , length
            , actualLength
          )
        } else {
          _super.apply(this, arguments)
        }
      }
    },
    function(_super) {
      return function() {
        _super.call(this)
      }
    }
  )


  chai.Assertion.overwriteMethod('match', function(_super) {
    return function(selector) {
      var obj = flag(this, 'object')
      if (isHTMLElement(obj)) {
        this.assert(
          obj.matches(selector)
          , 'expected ' + elToString(obj) + ' to match #{exp}'
          , 'expected ' + elToString(obj) + ' to not match #{exp}'
          , selector
        )
      } else if (isNodeList(obj)) {
        this.assert(
          (!!obj.length && Array.prototype.every.call(obj, function(el) { return el.matches(selector) }))
          , 'expected ' + elToString(obj) + ' to match #{exp}'
          , 'expected ' + elToString(obj) + ' to not match #{exp}'
          , selector
        )
      } else {
        _super.apply(this, arguments)
      }
    }
  })

  chai.Assertion.overwriteChainableMethod('contain',
    function(_super) {
      return function(subitem) {
        var obj = flag(this, 'object')
        if (isHTMLElement(obj)) {
          if (typeof subitem === 'string') {
            this.assert(
              !!obj.querySelector(subitem)
              , 'expected ' + elToString(obj) + ' to contain #{exp}'
              , 'expected ' + elToString(obj) + ' to not contain #{exp}'
              , subitem)
          } else {
            this.assert(
              obj.contains(subitem)
              , 'expected ' + elToString(obj) + ' to contain ' + elToString(subitem)
              , 'expected ' + elToString(obj) + ' to not contain ' + elToString(subitem))
          }
        } else {
          _super.apply(this, arguments)
        }
      }
    },
    function(_super) {
      return function() {
        _super.call(this)
      }
    }
  )

  chai.Assertion.addMethod('descendant', function(subitem) {
    var obj = flag(this, 'object'), actual = subitem

    if (typeof subitem === 'string') {
      actual = obj.querySelector(subitem)
      this.assert(
        !!actual
        , 'expected ' + elToString(obj) + ' to have descendant #{exp}'
        , 'expected ' + elToString(obj) + ' to not have descendant #{exp}'
        , subitem)
    } else {
      this.assert(
        obj.contains(subitem)
        , 'expected ' + elToString(obj) + ' to contain ' + elToString(subitem)
        , 'expected ' + elToString(obj) + ' to not contain ' + elToString(subitem))
    }

    flag(this, 'object', actual)
  })

  chai.Assertion.addMethod('descendants', function(selector) {
    var obj = flag(this, 'object'),
        actual = obj.querySelectorAll(selector)
    this.assert(
      !!actual.length
      , 'expected ' + elToString(obj) + ' to have descendants #{exp}'
      , 'expected ' + elToString(obj) + ' to not have descendants #{exp}'
      , selector)
    flag(this, 'object', actual)
  })

  chai.Assertion.addProperty('displayed', function() {
    var el = flag(this, 'object'),
        isAttached = el.getRootNode ? el.getRootNode({ composed: true }) === document : document.body.contains(el),
        actual = isAttached ? window.getComputedStyle(el).display : el.style.display

    this.assert(
      actual !== 'none'
      , 'expected ' + elToString(el) + ' to be displayed, but it was not'
      , 'expected ' + elToString(el) + ' to not be displayed, but it was as ' + actual
      , actual
    )
  })

  chai.Assertion.addProperty('visible', function() {
    var el = flag(this, 'object'),
        isAttached = el.getRootNode ? el.getRootNode({ composed: true }) === document : document.body.contains(el),
        actual = isAttached ? window.getComputedStyle(el).visibility : el.style.visibility

    this.assert(
      actual !== 'hidden' && actual !== 'collapse'
      , 'expected ' + elToString(el) + ' to be visible, but it was ' + (actual === 'hidden' ? 'hidden' : 'collapsed')
      , 'expected ' + elToString(el) + ' to not be visible, but it was'
      , actual
    )
  })

  chai.Assertion.addMethod('tagName', function(tagName) {
    var el = flag(this, 'object'),
        actual = el.tagName;

    this.assert(
      actual.toUpperCase() === tagName.toUpperCase()
      , 'expected ' + elToString(el) + ' to have tagName ' + tagName + ', but it was ' + actual
      , 'expected ' + elToString(el) + ' to not have tagName ' + tagName + ', but it was ' + actual
      , actual
    )
  })

  chai.Assertion.addMethod('style', function (styleProp, styleValue) {
    var el = flag(this, 'object'),
        style = window.getComputedStyle(el),
        actual = style.getPropertyValue(styleProp).trim();

    this.assert(
      actual === styleValue
      , 'expected ' + elToString(el) + ' to have style property ' + styleProp + ' equal to ' + styleValue + ', but it was equal to ' + actual
      , 'expected ' + elToString(el) + ' to not have style property ' + styleProp + ' equal to ' + styleValue + ', but it was equal to ' + actual
      , actual
    )
  })

  chai.Assertion.overwriteProperty('focus', function() {
    return function () {
      var el = flag(this, 'object'), actual = el.ownerDocument.activeElement

      this.assert(
        el === el.ownerDocument.activeElement
        , 'expected #{this} to have focus'
        , 'expected #{this} not to have focus'
        , el
        , actual
      )

    }
  })

  chai.Assertion.overwriteProperty('checked', function() {
    return function () {
      var el = flag(this, 'object')

      if(!(el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio'))) {
        throw new TypeError(elToString(el) + ' is not a checkbox or radio input');
      }

      this.assert(
        el.checked
        , 'expected ' + elToString(el) + ' to be checked'
        , 'expected ' + elToString(el) + ' to not be checked')
    }
  })
}));
