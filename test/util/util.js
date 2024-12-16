/* Test Utilities */

function byId(id) {
  return document.getElementById(id)
}

function make(htmlStr) {
  htmlStr = htmlStr.trim()
  var makeFn = function() {
    var range = document.createRange()
    var fragment = range.createContextualFragment(htmlStr)
    var wa = getWorkArea()
    var child = null
    var children = fragment.children || fragment.childNodes // IE
    var appendedChildren = []
    while (children.length > 0) {
      child = children[0]
      wa.appendChild(child)
      appendedChildren.push(child)
    }
    for (var i = 0; i < appendedChildren.length; i++) {
      htmx.process(appendedChildren[i])
    }
    return child // return last added element
  }
  if (getWorkArea()) {
    return makeFn()
  } else {
    ready(makeFn)
  }
}

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

function getWorkArea() {
  return byId('work-area')
}

function clearWorkArea() {
  var workArea = getWorkArea()
  if (workArea) workArea.innerHTML = ''
}

function removeWhiteSpace(str) {
  return str.replace(/\s/g, '')
}

function getHTTPMethod(xhr) {
  return xhr.requestHeaders['X-HTTP-Method-Override'] || xhr.method
}

function makeServer() {
  var server = sinon.fakeServer.create()
  server.fakeHTTPMethods = true
  server.getHTTPMethod = function(xhr) {
    return getHTTPMethod(xhr)
  }
  return server
}

function parseParams(str) {
  var re = /([^&=]+)=?([^&]*)/g
  var decode = function(str) {
    return decodeURIComponent(str.replace(/\+/g, ' '))
  }
  var params = {}; var e
  if (str) {
    if (str.substr(0, 1) == '?') {
      str = str.substr(1)
    }
    while (e = re.exec(str)) {
      var k = decode(e[1])
      var v = decode(e[2])
      if (params[k] !== undefined) {
        if (!Array.isArray(params[k])) {
          params[k] = [params[k]]
        }
        params[k].push(v)
      } else {
        params[k] = v
      }
    }
  }
  return params
}

function getQuery(url) {
  var question = url.indexOf('?')
  var hash = url.indexOf('#')
  if (hash == -1 && question == -1) return ''
  if (hash == -1) hash = url.length
  return question == -1 || hash == question + 1
    ? url.substring(hash)
    : url.substring(question + 1, hash)
}

function getParameters(xhr) {
  if (getHTTPMethod(xhr) == 'GET') {
    return parseParams(getQuery(xhr.url))
  } else {
    return parseParams(xhr.requestBody)
  }
}

function log(val) {
  console.log(val)
  return val
}
