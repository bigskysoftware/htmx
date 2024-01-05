var htmx = (function() {
  'use strict'

  // Public API
  //* * @type {import("./htmx").HtmxApi} */
  const htmx = {
    onLoad: onLoadHelper,
    process: processNode,
    on: addEventListenerImpl,
    off: removeEventListenerImpl,
    trigger: triggerEvent,
    ajax: ajaxHelper,
    find,
    findAll,
    closest,
    values: function(elt, type) {
      const inputValues = getInputValues(elt, type || 'post')
      return inputValues.values
    },
    remove: removeElement,
    addClass: addClassToElement,
    removeClass: removeClassFromElement,
    toggleClass: toggleClassOnElement,
    takeClass: takeClassForElement,
    defineExtension,
    removeExtension,
    logAll,
    logNone,
    logger: null,
    config: {
      historyEnabled: true,
      historyCacheSize: 10,
      refreshOnHistoryMiss: false,
      defaultSwapStyle: 'innerHTML',
      defaultSwapDelay: 0,
      defaultSettleDelay: 20,
      includeIndicatorStyles: true,
      indicatorClass: 'htmx-indicator',
      requestClass: 'htmx-request',
      addedClass: 'htmx-added',
      settlingClass: 'htmx-settling',
      swappingClass: 'htmx-swapping',
      allowEval: true,
      allowScriptTags: true,
      inlineScriptNonce: '',
      attributesToSettle: ['class', 'style', 'width', 'height'],
      withCredentials: false,
      timeout: 0,
      wsReconnectDelay: 'full-jitter',
      wsBinaryType: 'blob',
      disableSelector: '[hx-disable], [data-hx-disable]',
      scrollBehavior: 'instant',
      defaultFocusScroll: false,
      getCacheBusterParam: false,
      globalViewTransitions: false,
      methodsThatUseUrlParams: ['get', 'delete'],
      selfRequestsOnly: true,
      ignoreTitle: false,
      scrollIntoViewOnBoost: true,
      triggerSpecsCache: null,
      disableInheritance: false,
      head : {
        boost : "merge",
        other: "none",
      },
      responseHandling: [
        { code: '204', swap: false },
        { code: '[23]..', swap: true },
        { code: '[45]..', swap: false, error: true }
      ]
    },
    parseInterval,
    _: internalEval,
    version: '1.9.10'
  }

  /** @type {import("./htmx").HtmxInternalApi} */
  const internalAPI = {
    addTriggerHandler,
    bodyContains,
    canAccessLocalStorage,
    findThisElement,
    filterValues,
    hasAttribute,
    getAttributeValue,
    getClosestAttributeValue,
    getClosestMatch,
    getExpressionVars,
    getHeaders,
    getInputValues,
    getInternalData,
    getSwapSpecification,
    getTriggerSpecs,
    getTarget,
    makeFragment,
    mergeObjects,
    makeSettleInfo,
    oobSwap,
    querySelectorExt,
    selectAndSwap,
    settleImmediately,
    shouldCancel,
    triggerEvent,
    triggerErrorEvent,
    withExtensions
  }

  const VERBS = ['get', 'post', 'put', 'delete', 'patch']
  const VERB_SELECTOR = VERBS.map(function(verb) {
    return '[hx-' + verb + '], [data-hx-' + verb + ']'
  }).join(', ')

  const HEAD_TAG_REGEX = makeTagRegEx('head')

  //= ===================================================================
  // Utilities
  //= ===================================================================

  /**
   * @param {string} tag
   * @param {boolean} global
   * @returns {RegExp}
   */
  function makeTagRegEx(tag, global = false) {
    return new RegExp(`<${tag}(\\s[^>]*>|>)([\\s\\S]*?)<\\/${tag}>`,
      global ? 'gim' : 'im')
  }

  function parseInterval(str) {
    if (str == undefined) {
      return undefined
    }

    let interval = NaN
    if (str.slice(-2) == 'ms') {
      interval = parseFloat(str.slice(0, -2))
    } else if (str.slice(-1) == 's') {
      interval = parseFloat(str.slice(0, -1)) * 1000
    } else if (str.slice(-1) == 'm') {
      interval = parseFloat(str.slice(0, -1)) * 1000 * 60
    } else {
      interval = parseFloat(str)
    }
    return isNaN(interval) ? undefined : interval
  }

  /**
   * @param {HTMLElement} elt
   * @param {string} name
   * @returns {(string | null)}
   */
  function getRawAttribute(elt, name) {
    return elt.getAttribute && elt.getAttribute(name)
  }

  // resolve with both hx and data-hx prefixes
  function hasAttribute(elt, qualifiedName) {
    return elt.hasAttribute && (elt.hasAttribute(qualifiedName) ||
      elt.hasAttribute('data-' + qualifiedName))
  }

  /**
   *
   * @param {HTMLElement} elt
   * @param {string} qualifiedName
   * @returns {(string | null)}
   */
  function getAttributeValue(elt, qualifiedName) {
    return getRawAttribute(elt, qualifiedName) || getRawAttribute(elt, 'data-' + qualifiedName)
  }

  /**
   * @param {HTMLElement} elt
   * @returns {HTMLElement | ShadowRoot | null}
   */
  function parentElt(elt) {
    const parent = elt.parentElement
    if (!parent && elt.parentNode instanceof ShadowRoot) return elt.parentNode
    return parent
  }

  /**
   * @returns {Document}
   */
  function getDocument() {
    return document
  }

  /**
   * @returns {Document | ShadowRoot}
   */
  function getRootNode(elt, global) {
    return elt.getRootNode ? elt.getRootNode({ composed: global }) : getDocument()
  }

  /**
   * @param {HTMLElement} elt
   * @param {(e:HTMLElement) => boolean} condition
   * @returns {HTMLElement | null}
   */
  function getClosestMatch(elt, condition) {
    while (elt && !condition(elt)) {
      elt = parentElt(elt)
    }

    return elt || null
  }

  function getAttributeValueWithDisinheritance(initialElement, ancestor, attributeName) {
    const attributeValue = getAttributeValue(ancestor, attributeName)
    const disinherit = getAttributeValue(ancestor, 'hx-disinherit')
    var inherit = getAttributeValue(ancestor, 'hx-inherit')
    if (initialElement !== ancestor) {
      if (htmx.config.disableInheritance) {
        if (inherit && (inherit === '*' || inherit.split(' ').indexOf(attributeName) >= 0)) {
          return attributeValue
        } else {
          return null
        }
      }
      if (disinherit && (disinherit === '*' || disinherit.split(' ').indexOf(attributeName) >= 0)) {
        return 'unset'
      }
    }
    return attributeValue
  }

  /**
   * @param {HTMLElement} elt
   * @param {string} attributeName
   * @returns {string | null}
   */
  function getClosestAttributeValue(elt, attributeName) {
    let closestAttr = null
    getClosestMatch(elt, function(e) {
      return closestAttr = getAttributeValueWithDisinheritance(elt, e, attributeName)
    })
    if (closestAttr !== 'unset') {
      return closestAttr
    }
  }

  /**
   * @param {HTMLElement} elt
   * @param {string} selector
   * @returns {boolean}
   */
  function matches(elt, selector) {
    // @ts-ignore: non-standard properties for browser compatibility
    // noinspection JSUnresolvedVariable
    const matchesFunction = elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector
    return matchesFunction && matchesFunction.call(elt, selector)
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  function getStartTag(str) {
    const tagMatcher = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i
    const match = tagMatcher.exec(str)
    if (match) {
      return match[1].toLowerCase()
    } else {
      return ''
    }
  }

  /**
   *
   * @param {string} resp
   * @param {number} depth
   * @returns {Document}
   */
  function parseHTML(resp) {
    const parser = new DOMParser()
    return parser.parseFromString(resp, 'text/html')
  }

  function takeChildrenFor(fragment, elt) {
    while (elt.childNodes.length > 0) {
      fragment.append(elt.childNodes[0]);
    }
  }

  /**
   * @param {string} response HTML
   * @returns {DocumentFragment & {string:title, head:Element}} a document fragment representing the response HTML, including
   * a `head` property for any head content found
   */
  function makeFragment(response) {
    // strip head tag to determine shape of response we are dealing with
    let head = (HEAD_TAG_REGEX.exec(response) || [""])[0]
    let responseWithNoHead = response.replace(HEAD_TAG_REGEX, '')
    const startTag = getStartTag(responseWithNoHead)

    if (startTag === 'html') {

      // if it is a full document, parse it and return the body
      const fragment = new DocumentFragment();
      let doc = parseHTML(response);
      takeChildrenFor(fragment, doc.body)
      fragment.head = doc.head;
      fragment.title = doc.title;
      return fragment;
    } else if (startTag === 'body') {

      // body w/ a potential head, parse head & body w/o wrapping in template
      const fragment = new DocumentFragment();
      let doc = parseHTML(head + responseWithNoHead);
      takeChildrenFor(fragment, doc.body)
      fragment.head = doc.head;
      fragment.title = doc.title;
      return fragment;

    } else {

      // otherwise we have non-body content, so wrap it in a template and insert the head before the content
      const doc = parseHTML(head + '<body><template>' + responseWithNoHead + '</template></body>')
      var fragment = doc.querySelector('template').content;
      // extract head into fragment for later processing
      fragment.head = doc.head;
      fragment.title = doc.title;

      // for legacy reasons we support a title tag at the root level of non-body responses, so we need to handle it
      var rootTitleElt = fragment.querySelector(":scope title");
      if (rootTitleElt) {
        rootTitleElt.remove();
        fragment.title = rootTitleElt.innerText;
      }

      return fragment;
    }
  }

  /**
   * @param {Function} func
   */
  function maybeCall(func) {
    if (func) {
      func()
    }
  }

  /**
   * @param {any} o
   * @param {string} type
   * @returns
   */
  function isType(o, type) {
    return Object.prototype.toString.call(o) === '[object ' + type + ']'
  }

  /**
   * @param {*} o
   * @returns {o is Function}
   */
  function isFunction(o) {
    return isType(o, 'Function')
  }

  /**
   * @param {*} o
   * @returns {o is Object}
   */
  function isRawObject(o) {
    return isType(o, 'Object')
  }

  /**
   * getInternalData retrieves "private" data stored by htmx within an element
   * @param {HTMLElement} elt
   * @returns {*}
   */
  function getInternalData(elt) {
    const dataProp = 'htmx-internal-data'
    let data = elt[dataProp]
    if (!data) {
      data = elt[dataProp] = {}
    }
    return data
  }

  /**
   * toArray converts an ArrayLike object into a real array.
   * @param {ArrayLike} arr
   * @returns {any[]}
   */
  function toArray(arr) {
    const returnArr = []
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        returnArr.push(arr[i])
      }
    }
    return returnArr
  }

  function forEach(arr, func) {
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        func(arr[i])
      }
    }
  }

  function isScrolledIntoView(el) {
    const rect = el.getBoundingClientRect()
    const elemTop = rect.top
    const elemBottom = rect.bottom
    return elemTop < window.innerHeight && elemBottom >= 0
  }

  function bodyContains(elt) {
    // IE Fix
    if (elt.getRootNode && elt.getRootNode() instanceof window.ShadowRoot) {
      return getDocument().body.contains(elt.getRootNode().host)
    } else {
      return getDocument().body.contains(elt)
    }
  }

  function splitOnWhitespace(trigger) {
    return trigger.trim().split(/\s+/)
  }

  /**
   * mergeObjects takes all of the keys from
   * obj2 and duplicates them into obj1
   * @param {Object} obj1
   * @param {Object} obj2
   * @returns {Object}
   */
  function mergeObjects(obj1, obj2) {
    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        obj1[key] = obj2[key]
      }
    }
    return obj1
  }

  function parseJSON(jString) {
    try {
      return JSON.parse(jString)
    } catch (error) {
      logError(error)
      return null
    }
  }

  function canAccessLocalStorage() {
    const test = 'htmx:localStorageTest'
    try {
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  function normalizePath(path) {
    try {
      const url = new URL(path)
      if (url) {
        path = url.pathname + url.search
      }
      // remove trailing slash, unless index page
      if (!(/^\/$/.test(path))) {
        path = path.replace(/\/+$/, '')
      }
      return path
    } catch (e) {
      // be kind to IE11, which doesn't support URL()
      return path
    }
  }

  //= =========================================================================================
  // public API
  //= =========================================================================================

  function internalEval(str) {
    return maybeEval(getDocument().body, function() {
      return eval(str)
    })
  }

  function onLoadHelper(callback) {
    const value = htmx.on('htmx:load', function(evt) {
      callback(evt.detail.elt)
    })
    return value
  }

  function logAll() {
    htmx.logger = function(elt, event, data) {
      if (console) {
        console.log(event, elt, data)
      }
    }
  }

  function logNone() {
    htmx.logger = null
  }

  function find(eltOrSelector, selector) {
    if (selector) {
      return eltOrSelector.querySelector(selector)
    } else {
      return find(getDocument(), eltOrSelector)
    }
  }

  function findAll(eltOrSelector, selector) {
    if (selector) {
      return eltOrSelector.querySelectorAll(selector)
    } else {
      return findAll(getDocument(), eltOrSelector)
    }
  }

  function removeElement(elt, delay) {
    elt = resolveTarget(elt)
    if (delay) {
      setTimeout(function() {
        removeElement(elt)
        elt = null
      }, delay)
    } else {
      parentElt(elt).removeChild(elt)
    }
  }

  function addClassToElement(elt, clazz, delay) {
    elt = resolveTarget(elt)
    if (delay) {
      setTimeout(function() {
        addClassToElement(elt, clazz)
        elt = null
      }, delay)
    } else {
      elt.classList && elt.classList.add(clazz)
    }
  }

  function removeClassFromElement(elt, clazz, delay) {
    elt = resolveTarget(elt)
    if (delay) {
      setTimeout(function() {
        removeClassFromElement(elt, clazz)
        elt = null
      }, delay)
    } else {
      if (elt.classList) {
        elt.classList.remove(clazz)
        // if there are no classes left, remove the class attribute
        if (elt.classList.length === 0) {
          elt.removeAttribute('class')
        }
      }
    }
  }

  function toggleClassOnElement(elt, clazz) {
    elt = resolveTarget(elt)
    elt.classList.toggle(clazz)
  }

  function takeClassForElement(elt, clazz) {
    elt = resolveTarget(elt)
    forEach(elt.parentElement.children, function(child) {
      removeClassFromElement(child, clazz)
    })
    addClassToElement(elt, clazz)
  }

  function closest(elt, selector) {
    elt = resolveTarget(elt)
    if (elt.closest) {
      return elt.closest(selector)
    } else {
      // TODO remove when IE goes away
      do {
        if (elt == null || matches(elt, selector)) {
          return elt
        }
      }
      while (elt = elt && parentElt(elt))
      return null
    }
  }

  function startsWith(str, prefix) {
    return str.substring(0, prefix.length) === prefix
  }

  function endsWith(str, suffix) {
    return str.substring(str.length - suffix.length) === suffix
  }

  function normalizeSelector(selector) {
    const trimmedSelector = selector.trim()
    if (startsWith(trimmedSelector, '<') && endsWith(trimmedSelector, '/>')) {
      return trimmedSelector.substring(1, trimmedSelector.length - 2)
    } else {
      return trimmedSelector
    }
  }

  function querySelectorAllExt(elt, selector, global) {
    if (selector.indexOf('closest ') === 0) {
      return [closest(elt, normalizeSelector(selector.substr(8)))]
    } else if (selector.indexOf('find ') === 0) {
      return [find(elt, normalizeSelector(selector.substr(5)))]
    } else if (selector === 'next') {
      return [elt.nextElementSibling]
    } else if (selector.indexOf('next ') === 0) {
      return [scanForwardQuery(elt, normalizeSelector(selector.substr(5)), !!global)]
    } else if (selector === 'previous') {
      return [elt.previousElementSibling]
    } else if (selector.indexOf('previous ') === 0) {
      return [scanBackwardsQuery(elt, normalizeSelector(selector.substr(9)), !!global)]
    } else if (selector === 'document') {
      return [document]
    } else if (selector === 'window') {
      return [window]
    } else if (selector === 'body') {
      return [document.body]
    } else if (selector === 'root') {
      return [getRootNode(elt, !!global)]
    } else if (selector.indexOf('global ') === 0) {
      return querySelectorAllExt(elt, selector.slice(7), true)
    } else {
      return getRootNode(elt, !!global).querySelectorAll(normalizeSelector(selector))
    }
  }

  var scanForwardQuery = function(start, match, global) {
    const results = getRootNode(start, global).querySelectorAll(match)
    for (let i = 0; i < results.length; i++) {
      const elt = results[i]
      if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
        return elt
      }
    }
  }

  var scanBackwardsQuery = function(start, match, global) {
    const results = getRootNode(start, global).querySelectorAll(match)
    for (let i = results.length - 1; i >= 0; i--) {
      const elt = results[i]
      if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
        return elt
      }
    }
  }

  function querySelectorExt(eltOrSelector, selector) {
    if (selector) {
      return querySelectorAllExt(eltOrSelector, selector)[0]
    } else {
      return querySelectorAllExt(getDocument().body, eltOrSelector)[0]
    }
  }

  function resolveTarget(arg2, context) {
    if (isType(arg2, 'String')) {
      return find(context || document, arg2)
    } else {
      return arg2
    }
  }

  function processEventArgs(arg1, arg2, arg3) {
    if (isFunction(arg2)) {
      return {
        target: getDocument().body,
        event: arg1,
        listener: arg2
      }
    } else {
      return {
        target: resolveTarget(arg1),
        event: arg2,
        listener: arg3
      }
    }
  }

  function addEventListenerImpl(arg1, arg2, arg3) {
    ready(function() {
      const eventArgs = processEventArgs(arg1, arg2, arg3)
      eventArgs.target.addEventListener(eventArgs.event, eventArgs.listener)
    })
    const b = isFunction(arg2)
    return b ? arg2 : arg3
  }

  function removeEventListenerImpl(arg1, arg2, arg3) {
    ready(function() {
      const eventArgs = processEventArgs(arg1, arg2, arg3)
      eventArgs.target.removeEventListener(eventArgs.event, eventArgs.listener)
    })
    return isFunction(arg2) ? arg2 : arg3
  }

  //= ===================================================================
  // Node processing
  //= ===================================================================

  const DUMMY_ELT = getDocument().createElement('output') // dummy element for bad selectors
  function findAttributeTargets(elt, attrName) {
    const attrTarget = getClosestAttributeValue(elt, attrName)
    if (attrTarget) {
      if (attrTarget === 'this') {
        return [findThisElement(elt, attrName)]
      } else {
        const result = querySelectorAllExt(elt, attrTarget)
        if (result.length === 0) {
          logError('The selector "' + attrTarget + '" on ' + attrName + ' returned no matches!')
          return [DUMMY_ELT]
        } else {
          return result
        }
      }
    }
  }

  function findThisElement(elt, attribute) {
    return getClosestMatch(elt, function(elt) {
      return getAttributeValue(elt, attribute) != null
    })
  }

  function getTarget(elt) {
    const targetStr = getClosestAttributeValue(elt, 'hx-target')
    if (targetStr) {
      if (targetStr === 'this') {
        return findThisElement(elt, 'hx-target')
      } else {
        return querySelectorExt(elt, targetStr)
      }
    } else {
      const data = getInternalData(elt)
      if (data.boosted) {
        return getDocument().body
      } else {
        return elt
      }
    }
  }

  function shouldSettleAttribute(name) {
    const attributesToSettle = htmx.config.attributesToSettle
    for (let i = 0; i < attributesToSettle.length; i++) {
      if (name === attributesToSettle[i]) {
        return true
      }
    }
    return false
  }

  function cloneAttributes(mergeTo, mergeFrom) {
    forEach(mergeTo.attributes, function(attr) {
      if (!mergeFrom.hasAttribute(attr.name) && shouldSettleAttribute(attr.name)) {
        mergeTo.removeAttribute(attr.name)
      }
    })
    forEach(mergeFrom.attributes, function(attr) {
      if (shouldSettleAttribute(attr.name)) {
        mergeTo.setAttribute(attr.name, attr.value)
      }
    })
  }

  function isInlineSwap(swapStyle, target) {
    const extensions = getExtensions(target)
    for (let i = 0; i < extensions.length; i++) {
      const extension = extensions[i]
      try {
        if (extension.isInlineSwap(swapStyle)) {
          return true
        }
      } catch (e) {
        logError(e)
      }
    }
    return swapStyle === 'outerHTML'
  }

  /**
   *
   * @param {string} oobValue
   * @param {HTMLElement} oobElement
   * @param {*} settleInfo
   * @returns
   */
  function oobSwap(oobValue, oobElement, settleInfo) {
    let selector = '#' + getRawAttribute(oobElement, 'id')
    let swapStyle = 'outerHTML'
    if (oobValue === 'true') {
      // do nothing
    } else if (oobValue.indexOf(':') > 0) {
      swapStyle = oobValue.substr(0, oobValue.indexOf(':'))
      selector = oobValue.substr(oobValue.indexOf(':') + 1, oobValue.length)
    } else {
      swapStyle = oobValue
    }

    const targets = getDocument().querySelectorAll(selector)
    if (targets) {
      forEach(
        targets,
        function(target) {
          let fragment
          const oobElementClone = oobElement.cloneNode(true)
          fragment = getDocument().createDocumentFragment()
          fragment.appendChild(oobElementClone)
          if (!isInlineSwap(swapStyle, target)) {
            fragment = oobElementClone // if this is not an inline swap, we use the content of the node, not the node itself
          }

          const beforeSwapDetails = { shouldSwap: true, target, fragment }
          if (!triggerEvent(target, 'htmx:oobBeforeSwap', beforeSwapDetails)) return

          target = beforeSwapDetails.target // allow re-targeting
          if (beforeSwapDetails.shouldSwap) {
            swap(swapStyle, target, target, fragment, settleInfo)
          }
          forEach(settleInfo.elts, function(elt) {
            triggerEvent(elt, 'htmx:oobAfterSwap', beforeSwapDetails)
          })
        }
      )
      oobElement.parentNode.removeChild(oobElement)
    } else {
      oobElement.parentNode.removeChild(oobElement)
      triggerErrorEvent(getDocument().body, 'htmx:oobErrorNoTarget', { content: oobElement })
    }
    return oobValue
  }

  function findAndSwapOobElements(fragment, settleInfo) {
    forEach(findAll(fragment, '[hx-swap-oob], [data-hx-swap-oob]'), function(oobElement) {
      const oobValue = getAttributeValue(oobElement, 'hx-swap-oob')
      if (oobValue != null) {
        oobSwap(oobValue, oobElement, settleInfo)
      }
    })
  }

  function handleOutOfBandSwaps(elt, fragment, settleInfo) {
    const oobSelects = getClosestAttributeValue(elt, 'hx-select-oob')
    if (oobSelects) {
      const oobSelectValues = oobSelects.split(',')
      for (let i = 0; i < oobSelectValues.length; i++) {
        const oobSelectValue = oobSelectValues[i].split(':', 2)
        let id = oobSelectValue[0].trim()
        if (id.indexOf('#') === 0) {
          id = id.substring(1)
        }
        const oobValue = oobSelectValue[1] || 'true'
        const oobElement = fragment.querySelector('#' + id)
        if (oobElement) {
          oobSwap(oobValue, oobElement, settleInfo)
        }
      }
    }
    findAndSwapOobElements(fragment, settleInfo)
    forEach(findAll(fragment, 'template'), function(template) {
      findAndSwapOobElements(template.content, settleInfo)
      if (template.content.childElementCount === 0) {
        // Avoid polluting the DOM with empty templates that were only used to encapsulate oob swap
        template.remove()
      }
    })
  }

  function handlePreservedElements(fragment) {
    forEach(findAll(fragment, '[hx-preserve], [data-hx-preserve]'), function(preservedElt) {
      const id = getAttributeValue(preservedElt, 'id')
      const oldElt = getDocument().getElementById(id)
      if (oldElt != null) {
        preservedElt.parentNode.replaceChild(oldElt, preservedElt)
      }
    })
  }

  function handleAttributes(parentNode, fragment, settleInfo) {
    forEach(fragment.querySelectorAll('[id]'), function(newNode) {
      const id = getRawAttribute(newNode, 'id')
      if (id && id.length > 0) {
        const normalizedId = id.replace("'", "\\'")
        const normalizedTag = newNode.tagName.replace(':', '\\:')
        const oldNode = parentNode.querySelector(normalizedTag + "[id='" + normalizedId + "']")
        if (oldNode && oldNode !== parentNode) {
          const newAttributes = newNode.cloneNode()
          cloneAttributes(newNode, oldNode)
          settleInfo.tasks.push(function() {
            cloneAttributes(newNode, newAttributes)
          })
        }
      }
    })
  }

  function makeAjaxLoadTask(child) {
    return function() {
      removeClassFromElement(child, htmx.config.addedClass)
      processNode(child)
      processScripts(child)
      processFocus(child)
      triggerEvent(child, 'htmx:load')
    }
  }

  function processFocus(child) {
    const autofocus = '[autofocus]'
    const autoFocusedElt = matches(child, autofocus) ? child : child.querySelector(autofocus)
    if (autoFocusedElt != null) {
      autoFocusedElt.focus()
    }
  }

  function insertNodesBefore(parentNode, insertBefore, fragment, settleInfo) {
    handleAttributes(parentNode, fragment, settleInfo)
    while (fragment.childNodes.length > 0) {
      const child = fragment.firstChild
      addClassToElement(child, htmx.config.addedClass)
      parentNode.insertBefore(child, insertBefore)
      if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
        settleInfo.tasks.push(makeAjaxLoadTask(child))
      }
    }
  }

  // based on https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0,
  // derived from Java's string hashcode implementation
  function stringHash(string, hash) {
    let char = 0
    while (char < string.length) {
      hash = (hash << 5) - hash + string.charCodeAt(char++) | 0 // bitwise or ensures we have a 32-bit int
    }
    return hash
  }

  function attributeHash(elt) {
    let hash = 0
    // IE fix
    if (elt.attributes) {
      for (let i = 0; i < elt.attributes.length; i++) {
        const attribute = elt.attributes[i]
        if (attribute.value) { // only include attributes w/ actual values (empty is same as non-existent)
          hash = stringHash(attribute.name, hash)
          hash = stringHash(attribute.value, hash)
        }
      }
    }
    return hash
  }

  function deInitOnHandlers(elt) {
    const internalData = getInternalData(elt)
    if (internalData.onHandlers) {
      for (let i = 0; i < internalData.onHandlers.length; i++) {
        const handlerInfo = internalData.onHandlers[i]
        elt.removeEventListener(handlerInfo.event, handlerInfo.listener)
      }
      delete internalData.onHandlers
    }
  }

  function deInitNode(element) {
    const internalData = getInternalData(element)
    if (internalData.timeout) {
      clearTimeout(internalData.timeout)
    }
    if (internalData.listenerInfos) {
      forEach(internalData.listenerInfos, function(info) {
        if (info.on) {
          info.on.removeEventListener(info.trigger, info.listener)
        }
      })
    }
    deInitOnHandlers(element)
    forEach(Object.keys(internalData), function(key) { delete internalData[key] })
  }

  function cleanUpElement(element) {
    triggerEvent(element, 'htmx:beforeCleanupElement')
    deInitNode(element)
    if (element.children) { // IE
      forEach(element.children, function(child) { cleanUpElement(child) })
    }
  }

  function swapOuterHTML(target, fragment, settleInfo) {
    // @type {HTMLElement}
    let newElt
    const eltBeforeNewContent = target.previousSibling
    insertNodesBefore(parentElt(target), target, fragment, settleInfo)
    if (eltBeforeNewContent == null) {
      newElt = parentElt(target).firstChild
    } else {
      newElt = eltBeforeNewContent.nextSibling
    }
    settleInfo.elts = settleInfo.elts.filter(function(e) { return e !== target })
    while (newElt && newElt !== target) {
      if (newElt.nodeType === Node.ELEMENT_NODE) {
        settleInfo.elts.push(newElt)
      }
      newElt = newElt.nextElementSibling
    }
    cleanUpElement(target)
    target.remove();
  }

  function swapAfterBegin(target, fragment, settleInfo) {
    return insertNodesBefore(target, target.firstChild, fragment, settleInfo)
  }

  function swapBeforeBegin(target, fragment, settleInfo) {
    return insertNodesBefore(parentElt(target), target, fragment, settleInfo)
  }

  function swapBeforeEnd(target, fragment, settleInfo) {
    return insertNodesBefore(target, null, fragment, settleInfo)
  }

  function swapAfterEnd(target, fragment, settleInfo) {
    return insertNodesBefore(parentElt(target), target.nextSibling, fragment, settleInfo)
  }
  function swapDelete(target, fragment, settleInfo) {
    cleanUpElement(target)
    return parentElt(target).removeChild(target)
  }

  function swapInnerHTML(target, fragment, settleInfo) {
    const firstChild = target.firstChild
    insertNodesBefore(target, firstChild, fragment, settleInfo)
    if (firstChild) {
      while (firstChild.nextSibling) {
        cleanUpElement(firstChild.nextSibling)
        target.removeChild(firstChild.nextSibling)
      }
      cleanUpElement(firstChild)
      target.removeChild(firstChild)
    }
  }

  function maybeSelectFromResponse(elt, fragment, selectOverride) {
    const selector = selectOverride || getClosestAttributeValue(elt, 'hx-select')
    if (selector) {
      const newFragment = getDocument().createDocumentFragment()
      forEach(fragment.querySelectorAll(selector), function(node) {
        newFragment.appendChild(node)
      })
      fragment = newFragment
    }
    return fragment
  }

  function swap(swapStyle, elt, target, fragment, settleInfo) {
    switch (swapStyle) {
      case 'none':
        return
      case 'outerHTML':
        swapOuterHTML(target, fragment, settleInfo)
        return
      case 'afterbegin':
        swapAfterBegin(target, fragment, settleInfo)
        return
      case 'beforebegin':
        swapBeforeBegin(target, fragment, settleInfo)
        return
      case 'beforeend':
        swapBeforeEnd(target, fragment, settleInfo)
        return
      case 'afterend':
        swapAfterEnd(target, fragment, settleInfo)
        return
      case 'delete':
        swapDelete(target, fragment, settleInfo)
        return
      default:
        var extensions = getExtensions(elt)
        for (let i = 0; i < extensions.length; i++) {
          const ext = extensions[i]
          try {
            const newElements = ext.handleSwap(swapStyle, target, fragment, settleInfo)
            if (newElements) {
              if (typeof newElements.length !== 'undefined') {
                // if handleSwap returns an array (like) of elements, we handle them
                for (let j = 0; j < newElements.length; j++) {
                  const child = newElements[j]
                  if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
                    settleInfo.tasks.push(makeAjaxLoadTask(child))
                  }
                }
              }
              return
            }
          } catch (e) {
            logError(e)
          }
        }
        if (swapStyle === 'innerHTML') {
          swapInnerHTML(target, fragment, settleInfo)
        } else {
          swap(htmx.config.defaultSwapStyle, elt, target, fragment, settleInfo)
        }
    }
  }

  /**
   * @param fragment {DocumentFragment}
   * @returns String
   */
  function findTitle(fragment) {
    if (fragment.title) {
      return fragment.title.innerText;
    } else if (fragment.head) {
      var title = fragment.head.querySelector("title");
      if (title) {
        return title.innerText;
      }
    }
  }

  function selectAndSwap(swapStyle, target, elt, responseText, settleInfo, selectOverride) {
    let fragment = makeFragment(responseText)
    if (fragment) {
      // ugly :/
      settleInfo.title = fragment.title
      settleInfo.head = fragment.head
      handleOutOfBandSwaps(elt, fragment, settleInfo)
      fragment = maybeSelectFromResponse(elt, fragment, selectOverride)
      handlePreservedElements(fragment)
      return swap(swapStyle, elt, target, fragment, settleInfo)
    }
  }

  function handleHeadTag(head, strategy) {

    if (head && (strategy === "merge" || strategy === "append")) {
      // allow new head to override merge strategy
      let elementMergeStrategy = getAttributeValue(head, "hx-head") || strategy;
      if (elementMergeStrategy === "merge" || elementMergeStrategy === "append") {
        let removed = []
        let appended = []

        let currentHead = document.head;
        let newHeadElements = Array.from(head);

        let srcToNewHeadNodes = newHeadElements.reduce((m, elt) => m.set(elt.outerHTML, elt), new Map())

        for (const currentHeadElt of currentHead.children) {

          var inNewContent = srcToNewHeadNodes.has(currentHeadElt.outerHTML);
          var isReEvaluated = getAttributeValue(currentHeadElt,"hx-head") === "re-eval";
          var isPreserved = getAttributeValue(currentHeadElt, "hx-preserve") === "true";

          // If the current head element is in the map or is preserved
          if (isPreserved) {
            // remove from new content if it exists
            srcToNewHeadNodes.delete(currentHeadElt.outerHTML);
            if (isReEvaluated) {
              // remove the current version and let the new version replace it and re-execute
              appended.push(currentHeadElt);
            }
          } else if (inNewContent) {
            if (isReEvaluated) {
              // remove the current version and let the new version replace it and re-execute
              removed.push(currentHeadElt);
            } else {
              // this element already exists and should not be re-appended, so remove it from
              // the new content map, preserving it in the DOM
              srcToNewHeadNodes.delete(currentHeadElt.outerHTML);
            }
          } else {
            // the current existing head element is not in the new head
            if (elementMergeStrategy === "append") {
              // we are appending and this existing element is not new content
              // so if and only if it is marked for re-append do we do anything
              if (isReEvaluated) {
                appended.push(currentHeadElt);
              }
            } else {
              // if this is a merge, we remove this content since it is not in the new head
              if (triggerEvent(document.body, "htmx:removingHeadElement", {headElement: currentHeadElt}) !== false) {
                removed.push(currentHeadElt);
              }
            }
          }
        }

        // Push the remaining new head elements in the Map into the
        // nodes to append to the head tag
        appended.push(...srcToNewHeadNodes.values());

        for (const node of appended) {
          if (triggerEvent(document.body, "htmx:addingHeadElement", {headElement: node}) !== false) {
            currentHead.appendChild(node);
          }
        }

        // remove all removed elements, after we have appended the new elements to avoid
        // additional network requests for things like style sheets
        for (const removedElement of removed) {
          if (triggerEvent(document.body, "htmx:removingHeadElement", {headElement: removedElement}) !== false) {
            currentHead.removeChild(removedElement);
          }
        }
        triggerEvent(document.body, "htmx:afterHeadMerge", {appended: appended, removed: removed})
      }
    }
  }

  function handleTrigger(xhr, header, elt) {
    const triggerBody = xhr.getResponseHeader(header)
    if (triggerBody.indexOf('{') === 0) {
      const triggers = parseJSON(triggerBody)
      for (const eventName in triggers) {
        if (triggers.hasOwnProperty(eventName)) {
          let detail = triggers[eventName]
          if (!isRawObject(detail)) {
            detail = { value: detail }
          }
          triggerEvent(elt, eventName, detail)
        }
      }
    } else {
      const eventNames = triggerBody.split(',')
      for (let i = 0; i < eventNames.length; i++) {
        triggerEvent(elt, eventNames[i].trim(), [])
      }
    }
  }

  const WHITESPACE = /\s/
  const WHITESPACE_OR_COMMA = /[\s,]/
  const SYMBOL_START = /[_$a-zA-Z]/
  const SYMBOL_CONT = /[_$a-zA-Z0-9]/
  const STRINGISH_START = ['"', "'", '/']
  const NOT_WHITESPACE = /[^\s]/
  const COMBINED_SELECTOR_START = /[{(]/
  const COMBINED_SELECTOR_END = /[})]/
  function tokenizeString(str) {
    const tokens = []
    let position = 0
    while (position < str.length) {
      if (SYMBOL_START.exec(str.charAt(position))) {
        var startPosition = position
        while (SYMBOL_CONT.exec(str.charAt(position + 1))) {
          position++
        }
        tokens.push(str.substr(startPosition, position - startPosition + 1))
      } else if (STRINGISH_START.indexOf(str.charAt(position)) !== -1) {
        const startChar = str.charAt(position)
        var startPosition = position
        position++
        while (position < str.length && str.charAt(position) !== startChar) {
          if (str.charAt(position) === '\\') {
            position++
          }
          position++
        }
        tokens.push(str.substr(startPosition, position - startPosition + 1))
      } else {
        const symbol = str.charAt(position)
        tokens.push(symbol)
      }
      position++
    }
    return tokens
  }

  function isPossibleRelativeReference(token, last, paramName) {
    return SYMBOL_START.exec(token.charAt(0)) &&
      token !== 'true' &&
      token !== 'false' &&
      token !== 'this' &&
      token !== paramName &&
      last !== '.'
  }

  function maybeGenerateConditional(elt, tokens, paramName) {
    if (tokens[0] === '[') {
      tokens.shift()
      let bracketCount = 1
      let conditionalSource = ' return (function(' + paramName + '){ return ('
      let last = null
      while (tokens.length > 0) {
        const token = tokens[0]
        if (token === ']') {
          bracketCount--
          if (bracketCount === 0) {
            if (last === null) {
              conditionalSource = conditionalSource + 'true'
            }
            tokens.shift()
            conditionalSource += ')})'
            try {
              const conditionFunction = maybeEval(elt, function() {
                return Function(conditionalSource)()
              },
              function() { return true })
              conditionFunction.source = conditionalSource
              return conditionFunction
            } catch (e) {
              triggerErrorEvent(getDocument().body, 'htmx:syntax:error', { error: e, source: conditionalSource })
              return null
            }
          }
        } else if (token === '[') {
          bracketCount++
        }
        if (isPossibleRelativeReference(token, last, paramName)) {
          conditionalSource += '((' + paramName + '.' + token + ') ? (' + paramName + '.' + token + ') : (window.' + token + '))'
        } else {
          conditionalSource = conditionalSource + token
        }
        last = tokens.shift()
      }
    }
  }

  function consumeUntil(tokens, match) {
    let result = ''
    while (tokens.length > 0 && !match.test(tokens[0])) {
      result += tokens.shift()
    }
    return result
  }

  function consumeCSSSelector(tokens) {
    let result
    if (tokens.length > 0 && COMBINED_SELECTOR_START.test(tokens[0])) {
      tokens.shift()
      result = consumeUntil(tokens, COMBINED_SELECTOR_END).trim()
      tokens.shift()
    } else {
      result = consumeUntil(tokens, WHITESPACE_OR_COMMA)
    }
    return result
  }

  const INPUT_SELECTOR = 'input, textarea, select'

  /**
   * @param {HTMLElement} elt
   * @param {string} explicitTrigger
   * @param {cache} cache for trigger specs
   * @returns {import("./htmx").HtmxTriggerSpecification[]}
   */
  function parseAndCacheTrigger(elt, explicitTrigger, cache) {
    const triggerSpecs = []
    const tokens = tokenizeString(explicitTrigger)
    do {
      consumeUntil(tokens, NOT_WHITESPACE)
      const initialLength = tokens.length
      const trigger = consumeUntil(tokens, /[,\[\s]/)
      if (trigger !== '') {
        if (trigger === 'every') {
          const every = { trigger: 'every' }
          consumeUntil(tokens, NOT_WHITESPACE)
          every.pollInterval = parseInterval(consumeUntil(tokens, /[,\[\s]/))
          consumeUntil(tokens, NOT_WHITESPACE)
          var eventFilter = maybeGenerateConditional(elt, tokens, 'event')
          if (eventFilter) {
            every.eventFilter = eventFilter
          }
          triggerSpecs.push(every)
        } else {
          const triggerSpec = { trigger }
          var eventFilter = maybeGenerateConditional(elt, tokens, 'event')
          if (eventFilter) {
            triggerSpec.eventFilter = eventFilter
          }
          while (tokens.length > 0 && tokens[0] !== ',') {
            consumeUntil(tokens, NOT_WHITESPACE)
            const token = tokens.shift()
            if (token === 'changed') {
              triggerSpec.changed = true
            } else if (token === 'once') {
              triggerSpec.once = true
            } else if (token === 'consume') {
              triggerSpec.consume = true
            } else if (token === 'delay' && tokens[0] === ':') {
              tokens.shift()
              triggerSpec.delay = parseInterval(consumeUntil(tokens, WHITESPACE_OR_COMMA))
            } else if (token === 'from' && tokens[0] === ':') {
              tokens.shift()
              if (COMBINED_SELECTOR_START.test(tokens[0])) {
                var from_arg = consumeCSSSelector(tokens)
              } else {
                var from_arg = consumeUntil(tokens, WHITESPACE_OR_COMMA)
                if (from_arg === 'closest' || from_arg === 'find' || from_arg === 'next' || from_arg === 'previous') {
                  tokens.shift()
                  const selector = consumeCSSSelector(tokens)
                  // `next` and `previous` allow a selector-less syntax
                  if (selector.length > 0) {
                    from_arg += ' ' + selector
                  }
                }
              }
              triggerSpec.from = from_arg
            } else if (token === 'target' && tokens[0] === ':') {
              tokens.shift()
              triggerSpec.target = consumeCSSSelector(tokens)
            } else if (token === 'throttle' && tokens[0] === ':') {
              tokens.shift()
              triggerSpec.throttle = parseInterval(consumeUntil(tokens, WHITESPACE_OR_COMMA))
            } else if (token === 'queue' && tokens[0] === ':') {
              tokens.shift()
              triggerSpec.queue = consumeUntil(tokens, WHITESPACE_OR_COMMA)
            } else if (token === 'root' && tokens[0] === ':') {
              tokens.shift()
              triggerSpec[token] = consumeCSSSelector(tokens)
            } else if (token === 'threshold' && tokens[0] === ':') {
              tokens.shift()
              triggerSpec[token] = consumeUntil(tokens, WHITESPACE_OR_COMMA)
            } else {
              triggerErrorEvent(elt, 'htmx:syntax:error', { token: tokens.shift() })
            }
          }
          triggerSpecs.push(triggerSpec)
        }
      }
      if (tokens.length === initialLength) {
        triggerErrorEvent(elt, 'htmx:syntax:error', { token: tokens.shift() })
      }
      consumeUntil(tokens, NOT_WHITESPACE)
    } while (tokens[0] === ',' && tokens.shift())
    if (cache) {
      cache[explicitTrigger] = triggerSpecs
    }
    return triggerSpecs
  }

  /**
   * @param {HTMLElement} elt
   * @returns {import("./htmx").HtmxTriggerSpecification[]}
   */
  function getTriggerSpecs(elt) {
    const explicitTrigger = getAttributeValue(elt, 'hx-trigger')
    let triggerSpecs = []
    if (explicitTrigger) {
      const cache = htmx.config.triggerSpecsCache
      triggerSpecs = (cache && cache[explicitTrigger]) || parseAndCacheTrigger(elt, explicitTrigger, cache)
    }

    if (triggerSpecs.length > 0) {
      return triggerSpecs
    } else if (matches(elt, 'form')) {
      return [{ trigger: 'submit' }]
    } else if (matches(elt, 'input[type="button"], input[type="submit"]')) {
      return [{ trigger: 'click' }]
    } else if (matches(elt, INPUT_SELECTOR)) {
      return [{ trigger: 'change' }]
    } else {
      return [{ trigger: 'click' }]
    }
  }

  function cancelPolling(elt) {
    getInternalData(elt).cancelled = true
  }

  function processPolling(elt, handler, spec) {
    const nodeData = getInternalData(elt)
    nodeData.timeout = setTimeout(function() {
      if (bodyContains(elt) && nodeData.cancelled !== true) {
        if (!maybeFilterEvent(spec, elt, makeEvent('hx:poll:trigger', {
          triggerSpec: spec,
          target: elt
        }))) {
          handler(elt)
        }
        processPolling(elt, handler, spec)
      }
    }, spec.pollInterval)
  }

  function isLocalLink(elt) {
    return location.hostname === elt.hostname &&
      getRawAttribute(elt, 'href') &&
      getRawAttribute(elt, 'href').indexOf('#') !== 0
  }

  function boostElement(elt, nodeData, triggerSpecs) {
    if ((elt.tagName === 'A' && isLocalLink(elt) && (elt.target === '' || elt.target === '_self')) || elt.tagName === 'FORM') {
      nodeData.boosted = true
      let verb, path
      if (elt.tagName === 'A') {
        verb = 'get'
        path = getRawAttribute(elt, 'href')
      } else {
        const rawAttribute = getRawAttribute(elt, 'method')
        verb = rawAttribute ? rawAttribute.toLowerCase() : 'get'
        if (verb === 'get') {
        }
        path = getRawAttribute(elt, 'action')
      }
      triggerSpecs.forEach(function(triggerSpec) {
        addEventListener(elt, function(elt, evt) {
          if (closest(elt, htmx.config.disableSelector)) {
            cleanUpElement(elt)
            return
          }
          issueAjaxRequest(verb, path, elt, evt)
        }, nodeData, triggerSpec, true)
      })
    }
  }

  /**
   *
   * @param {Event} evt
   * @param {HTMLElement} elt
   * @returns
   */
  function shouldCancel(evt, elt) {
    if (evt.type === 'submit' || evt.type === 'click') {
      if (elt.tagName === 'FORM') {
        return true
      }
      if (matches(elt, 'input[type="submit"], button') && closest(elt, 'form') !== null) {
        return true
      }
      if (elt.tagName === 'A' && elt.href &&
        (elt.getAttribute('href') === '#' || elt.getAttribute('href').indexOf('#') !== 0)) {
        return true
      }
    }
    return false
  }

  function ignoreBoostedAnchorCtrlClick(elt, evt) {
    return getInternalData(elt).boosted && elt.tagName === 'A' && evt.type === 'click' && (evt.ctrlKey || evt.metaKey)
  }

  function maybeFilterEvent(triggerSpec, elt, evt) {
    const eventFilter = triggerSpec.eventFilter
    if (eventFilter) {
      try {
        return eventFilter.call(elt, evt) !== true
      } catch (e) {
        triggerErrorEvent(getDocument().body, 'htmx:eventFilter:error', { error: e, source: eventFilter.source })
        return true
      }
    }
    return false
  }

  function addEventListener(elt, handler, nodeData, triggerSpec, explicitCancel) {
    const elementData = getInternalData(elt)
    let eltsToListenOn
    if (triggerSpec.from) {
      eltsToListenOn = querySelectorAllExt(elt, triggerSpec.from)
    } else {
      eltsToListenOn = [elt]
    }
    // store the initial values of the elements, so we can tell if they change
    if (triggerSpec.changed) {
      eltsToListenOn.forEach(function(eltToListenOn) {
        const eltToListenOnData = getInternalData(eltToListenOn)
        eltToListenOnData.lastValue = eltToListenOn.value
      })
    }
    forEach(eltsToListenOn, function(eltToListenOn) {
      const eventListener = function(evt) {
        if (!bodyContains(elt)) {
          eltToListenOn.removeEventListener(triggerSpec.trigger, eventListener)
          return
        }
        if (ignoreBoostedAnchorCtrlClick(elt, evt)) {
          return
        }
        if (explicitCancel || shouldCancel(evt, elt)) {
          evt.preventDefault()
        }
        if (maybeFilterEvent(triggerSpec, elt, evt)) {
          return
        }
        const eventData = getInternalData(evt)
        eventData.triggerSpec = triggerSpec
        if (eventData.handledFor == null) {
          eventData.handledFor = []
        }
        if (eventData.handledFor.indexOf(elt) < 0) {
          eventData.handledFor.push(elt)
          if (triggerSpec.consume) {
            evt.stopPropagation()
          }
          if (triggerSpec.target && evt.target) {
            if (!matches(evt.target, triggerSpec.target)) {
              return
            }
          }
          if (triggerSpec.once) {
            if (elementData.triggeredOnce) {
              return
            } else {
              elementData.triggeredOnce = true
            }
          }
          if (triggerSpec.changed) {
            const eltToListenOnData = getInternalData(eltToListenOn)
            if (eltToListenOnData.lastValue === eltToListenOn.value) {
              return
            }
            eltToListenOnData.lastValue = eltToListenOn.value
          }
          if (elementData.delayed) {
            clearTimeout(elementData.delayed)
          }
          if (elementData.throttle) {
            return
          }

          if (triggerSpec.throttle > 0) {
            if (!elementData.throttle) {
              handler(elt, evt)
              elementData.throttle = setTimeout(function() {
                elementData.throttle = null
              }, triggerSpec.throttle)
            }
          } else if (triggerSpec.delay > 0) {
            elementData.delayed = setTimeout(function() { handler(elt, evt) }, triggerSpec.delay)
          } else {
            triggerEvent(elt, 'htmx:trigger')
            handler(elt, evt)
          }
        }
      }
      if (nodeData.listenerInfos == null) {
        nodeData.listenerInfos = []
      }
      nodeData.listenerInfos.push({
        trigger: triggerSpec.trigger,
        listener: eventListener,
        on: eltToListenOn
      })
      eltToListenOn.addEventListener(triggerSpec.trigger, eventListener)
    })
  }

  let windowIsScrolling = false // used by initScrollHandler
  let scrollHandler = null
  function initScrollHandler() {
    if (!scrollHandler) {
      scrollHandler = function() {
        windowIsScrolling = true
      }
      window.addEventListener('scroll', scrollHandler)
      setInterval(function() {
        if (windowIsScrolling) {
          windowIsScrolling = false
          forEach(getDocument().querySelectorAll("[hx-trigger*='revealed'],[data-hx-trigger*='revealed']"), function(elt) {
            maybeReveal(elt)
          })
        }
      }, 200)
    }
  }

  function maybeReveal(elt) {
    if (!hasAttribute(elt, 'data-hx-revealed') && isScrolledIntoView(elt)) {
      elt.setAttribute('data-hx-revealed', 'true')
      const nodeData = getInternalData(elt)
      if (nodeData.initHash) {
        triggerEvent(elt, 'revealed')
      } else {
        // if the node isn't initialized, wait for it before triggering the request
        elt.addEventListener('htmx:afterProcessNode', function(evt) { triggerEvent(elt, 'revealed') }, { once: true })
      }
    }
  }

  //= ===================================================================

  function loadImmediately(elt, handler, nodeData, delay) {
    const load = function() {
      if (!nodeData.loaded) {
        nodeData.loaded = true
        handler(elt)
      }
    }
    if (delay > 0) {
      setTimeout(load, delay)
    } else {
      load()
    }
  }

  function processVerbs(elt, nodeData, triggerSpecs) {
    let explicitAction = false
    forEach(VERBS, function(verb) {
      if (hasAttribute(elt, 'hx-' + verb)) {
        const path = getAttributeValue(elt, 'hx-' + verb)
        explicitAction = true
        nodeData.path = path
        nodeData.verb = verb
        triggerSpecs.forEach(function(triggerSpec) {
          addTriggerHandler(elt, triggerSpec, nodeData, function(elt, evt) {
            if (closest(elt, htmx.config.disableSelector)) {
              cleanUpElement(elt)
              return
            }
            issueAjaxRequest(verb, path, elt, evt)
          })
        })
      }
    })
    return explicitAction
  }

  function addTriggerHandler(elt, triggerSpec, nodeData, handler) {
    if (triggerSpec.trigger === 'revealed') {
      initScrollHandler()
      addEventListener(elt, handler, nodeData, triggerSpec)
      maybeReveal(elt)
    } else if (triggerSpec.trigger === 'intersect') {
      const observerOptions = {}
      if (triggerSpec.root) {
        observerOptions.root = querySelectorExt(elt, triggerSpec.root)
      }
      if (triggerSpec.threshold) {
        observerOptions.threshold = parseFloat(triggerSpec.threshold)
      }
      const observer = new IntersectionObserver(function(entries) {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]
          if (entry.isIntersecting) {
            triggerEvent(elt, 'intersect')
            break
          }
        }
      }, observerOptions)
      observer.observe(elt)
      addEventListener(elt, handler, nodeData, triggerSpec)
    } else if (triggerSpec.trigger === 'load') {
      if (!maybeFilterEvent(triggerSpec, elt, makeEvent('load', { elt }))) {
        loadImmediately(elt, handler, nodeData, triggerSpec.delay)
      }
    } else if (triggerSpec.pollInterval > 0) {
      nodeData.polling = true
      processPolling(elt, handler, triggerSpec)
    } else {
      addEventListener(elt, handler, nodeData, triggerSpec)
    }
  }

  function evalScript(script) {
    if (htmx.config.allowScriptTags && (script.type === 'text/javascript' || script.type === 'module' || script.type === '')) {
      const newScript = getDocument().createElement('script')
      forEach(script.attributes, function(attr) {
        newScript.setAttribute(attr.name, attr.value)
      })
      newScript.textContent = script.textContent
      newScript.async = false
      if (htmx.config.inlineScriptNonce) {
        newScript.nonce = htmx.config.inlineScriptNonce
      }
      const parent = script.parentElement

      try {
        parent.insertBefore(newScript, script)
      } catch (e) {
        logError(e)
      } finally {
        // remove old script element, but only if it is still in DOM
        if (script.parentElement) {
          script.parentElement.removeChild(script)
        }
      }
    }
  }

  function processScripts(elt) {
    if (matches(elt, 'script')) {
      evalScript(elt)
    }
    forEach(findAll(elt, 'script'), function(script) {
      evalScript(script)
    })
  }

  function shouldProcessHxOn(elt) {
    const attributes = elt.attributes
    for (let j = 0; j < attributes.length; j++) {
      const attrName = attributes[j].name
      if (startsWith(attrName, 'hx-on:') || startsWith(attrName, 'data-hx-on:') ||
        startsWith(attrName, 'hx-on-') || startsWith(attrName, 'data-hx-on-')) {
        return true
      }
    }
    return false
  }

  function findHxOnWildcardElements(elt) {
    let node = null
    const elements = []

    if (!(elt instanceof ShadowRoot)) {
      if (shouldProcessHxOn(elt)) {
        elements.push(elt)
      }

      const iter = document.evaluate('.//*[@*[ starts-with(name(), "hx-on:") or starts-with(name(), "data-hx-on:") or' +
        ' starts-with(name(), "hx-on-") or starts-with(name(), "data-hx-on-") ]]', elt)
      while (node = iter.iterateNext()) elements.push(node)
    }
    return elements
  }

  function findElementsToProcess(elt) {
    if (elt.querySelectorAll) {
      const boostedSelector = ', [hx-boost] a, [data-hx-boost] a, a[hx-boost], a[data-hx-boost]'
      const results = elt.querySelectorAll(VERB_SELECTOR + boostedSelector + ", form, [type='submit']," +
        ' [hx-ext], [data-hx-ext], [hx-trigger], [data-hx-trigger]')
      return results
    } else {
      return []
    }
  }

  // Handle submit buttons/inputs that have the form attribute set
  // see https://developer.mozilla.org/docs/Web/HTML/Element/button
  function maybeSetLastButtonClicked(evt) {
    const elt = closest(evt.target, "button, input[type='submit']")
    const internalData = getRelatedFormData(evt)
    if (internalData) {
      internalData.lastButtonClicked = elt
    }
  };
  function maybeUnsetLastButtonClicked(evt) {
    const internalData = getRelatedFormData(evt)
    if (internalData) {
      internalData.lastButtonClicked = null
    }
  }
  function getRelatedFormData(evt) {
    const elt = closest(evt.target, "button, input[type='submit']")
    if (!elt) {
      return
    }
    const form = resolveTarget('#' + getRawAttribute(elt, 'form'), elt.getRootNode()) || closest(elt, 'form')
    if (!form) {
      return
    }
    return getInternalData(form)
  }
  function initButtonTracking(elt) {
    // need to handle both click and focus in:
    //   focusin - in case someone tabs in to a button and hits the space bar
    //   click - on OSX buttons do not focus on click see https://bugs.webkit.org/show_bug.cgi?id=13724
    elt.addEventListener('click', maybeSetLastButtonClicked)
    elt.addEventListener('focusin', maybeSetLastButtonClicked)
    elt.addEventListener('focusout', maybeUnsetLastButtonClicked)
  }

  function countCurlies(line) {
    const tokens = tokenizeString(line)
    let netCurlies = 0
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (token === '{') {
        netCurlies++
      } else if (token === '}') {
        netCurlies--
      }
    }
    return netCurlies
  }

  function addHxOnEventHandler(elt, eventName, code) {
    const nodeData = getInternalData(elt)
    if (!Array.isArray(nodeData.onHandlers)) {
      nodeData.onHandlers = []
    }
    let func
    const listener = function(e) {
      return maybeEval(elt, function() {
        if (!func) {
          func = new Function('event', code)
        }
        func.call(elt, e)
      })
    }
    elt.addEventListener(eventName, listener)
    nodeData.onHandlers.push({ event: eventName, listener })
  }

  function processHxOnWildcard(elt) {
    // wipe any previous on handlers so that this function takes precedence
    deInitOnHandlers(elt)

    for (let i = 0; i < elt.attributes.length; i++) {
      const name = elt.attributes[i].name
      const value = elt.attributes[i].value
      if (startsWith(name, 'hx-on') || startsWith(name, 'data-hx-on')) {
        const afterOnPosition = name.indexOf('-on') + 3
        const nextChar = name.slice(afterOnPosition, afterOnPosition + 1)
        if (nextChar === '-' || nextChar === ':') {
          let eventName = name.slice(afterOnPosition + 1)
          // if the eventName starts with a colon or dash, prepend "htmx" for shorthand support
          if (startsWith(eventName, ':')) {
            eventName = 'htmx' + eventName
          } else if (startsWith(eventName, '-')) {
            eventName = 'htmx:' + eventName.slice(1)
          } else if (startsWith(eventName, 'htmx-')) {
            eventName = 'htmx:' + eventName.slice(5)
          }

          addHxOnEventHandler(elt, eventName, value)
        }
      }
    }
  }

  function initNode(elt) {
    if (closest(elt, htmx.config.disableSelector)) {
      cleanUpElement(elt)
      return
    }
    const nodeData = getInternalData(elt)
    if (nodeData.initHash !== attributeHash(elt)) {
      // clean up any previously processed info
      deInitNode(elt)

      nodeData.initHash = attributeHash(elt)

      triggerEvent(elt, 'htmx:beforeProcessNode')

      if (elt.value) {
        nodeData.lastValue = elt.value
      }

      const triggerSpecs = getTriggerSpecs(elt)
      const hasExplicitHttpAction = processVerbs(elt, nodeData, triggerSpecs)

      if (!hasExplicitHttpAction) {
        if (getClosestAttributeValue(elt, 'hx-boost') === 'true') {
          boostElement(elt, nodeData, triggerSpecs)
        } else if (hasAttribute(elt, 'hx-trigger')) {
          triggerSpecs.forEach(function(triggerSpec) {
            // For "naked" triggers, don't do anything at all
            addTriggerHandler(elt, triggerSpec, nodeData, function() {
            })
          })
        }
      }

      // Handle submit buttons/inputs that have the form attribute set
      // see https://developer.mozilla.org/docs/Web/HTML/Element/button
      if (elt.tagName === 'FORM' || (getRawAttribute(elt, 'type') === 'submit' && hasAttribute(elt, 'form'))) {
        initButtonTracking(elt)
      }

      triggerEvent(elt, 'htmx:afterProcessNode')
    }
  }

  function processNode(elt) {
    elt = resolveTarget(elt)
    if (closest(elt, htmx.config.disableSelector)) {
      cleanUpElement(elt)
      return
    }
    initNode(elt)
    forEach(findElementsToProcess(elt), function(child) { initNode(child) })
    forEach(findHxOnWildcardElements(elt), processHxOnWildcard)
  }

  //= ===================================================================
  // Event/Log Support
  //= ===================================================================

  function kebabEventName(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  }

  function makeEvent(eventName, detail) {
    let evt
    if (window.CustomEvent && typeof window.CustomEvent === 'function') {
      // TODO: `composed: true` here is a hack to make global event handlers work with events in shadow DOM
      // This breaks expected encapsulation but needs to be here until decided otherwise by core devs
      evt = new CustomEvent(eventName, { bubbles: true, cancelable: true, composed: true, detail })
    } else {
      evt = getDocument().createEvent('CustomEvent')
      evt.initCustomEvent(eventName, true, true, detail)
    }
    return evt
  }

  function triggerErrorEvent(elt, eventName, detail) {
    triggerEvent(elt, eventName, mergeObjects({ error: eventName }, detail))
  }

  function ignoreEventForLogging(eventName) {
    return eventName === 'htmx:afterProcessNode'
  }

  /**
   * `withExtensions` locates all active extensions for a provided element, then
   * executes the provided function using each of the active extensions.  It should
   * be called internally at every extendable execution point in htmx.
   *
   * @param {HTMLElement} elt
   * @param {(extension:import("./htmx").HtmxExtension) => void} toDo
   * @returns void
   */
  function withExtensions(elt, toDo) {
    forEach(getExtensions(elt), function(extension) {
      try {
        toDo(extension)
      } catch (e) {
        logError(e)
      }
    })
  }

  function logError(msg) {
    if (console.error) {
      console.error(msg)
    } else if (console.log) {
      console.log('ERROR: ', msg)
    }
  }

  function triggerEvent(elt, eventName, detail) {
    elt = resolveTarget(elt)
    if (detail == null) {
      detail = {}
    }
    detail.elt = elt
    const event = makeEvent(eventName, detail)
    if (htmx.logger && !ignoreEventForLogging(eventName)) {
      htmx.logger(elt, eventName, detail)
    }
    if (detail.error) {
      logError(detail.error)
      triggerEvent(elt, 'htmx:error', { errorInfo: detail })
    }
    let eventResult = elt.dispatchEvent(event)
    const kebabName = kebabEventName(eventName)
    if (eventResult && kebabName !== eventName) {
      const kebabedEvent = makeEvent(kebabName, event.detail)
      eventResult = eventResult && elt.dispatchEvent(kebabedEvent)
    }
    withExtensions(elt, function(extension) {
      eventResult = eventResult && (extension.onEvent(eventName, event) !== false && !event.defaultPrevented)
    })
    return eventResult
  }

  //= ===================================================================
  // History Support
  //= ===================================================================
  let currentPathForHistory = location.pathname + location.search

  function getHistoryElement() {
    const historyElt = getDocument().querySelector('[hx-history-elt],[data-hx-history-elt]')
    return historyElt || getDocument().body
  }

  function saveToHistoryCache(url, rootElt) {

    if (!canAccessLocalStorage()) {
      return
    }

    // get state to save
    let innerHTML = cleanInnerHtmlForHistory(rootElt)
    let head = getDocument().head.outerHTML
    let title = getDocument().title
    let scroll = window.scrollY

    if (htmx.config.historyCacheSize <= 0) {
      // make sure that an eventually already existing cache is purged
      localStorage.removeItem('htmx-history-cache')
      return
    }

    url = normalizePath(url)

    const historyCache = parseJSON(localStorage.getItem('htmx-history-cache')) || []
    for (let i = 0; i < historyCache.length; i++) {
      if (historyCache[i].url === url) {
        historyCache.splice(i, 1)
        break
      }
    }

    // final content will be the head tag + the inner HTML of the current history element
    let content = head + innerHTML;
    const newHistoryItem = { url, content, title, scroll }

    triggerEvent(getDocument().body, 'htmx:historyItemCreated', { item: newHistoryItem, cache: historyCache })

    historyCache.push(newHistoryItem)
    while (historyCache.length > htmx.config.historyCacheSize) {
      historyCache.shift()
    }

    // keep trying to save the cache until it succeeds or is empty
    while (historyCache.length > 0) {
      try {
        localStorage.setItem('htmx-history-cache', JSON.stringify(historyCache))
        break
      } catch (e) {
        triggerErrorEvent(getDocument().body, 'htmx:historyCacheError', { cause: e, cache: historyCache })
        historyCache.shift() // shrink the cache and retry
      }
    }
  }

  function getCachedHistory(url) {
    if (!canAccessLocalStorage()) {
      return null
    }

    url = normalizePath(url)

    const historyCache = parseJSON(localStorage.getItem('htmx-history-cache')) || []
    for (let i = 0; i < historyCache.length; i++) {
      if (historyCache[i].url === url) {
        return historyCache[i]
      }
    }
    return null
  }

  function cleanInnerHtmlForHistory(elt) {
    const className = htmx.config.requestClass
    const clone = elt.cloneNode(true)
    forEach(findAll(clone, '.' + className), function(child) {
      removeClassFromElement(child, className)
    })
    return clone.innerHTML
  }

  function saveCurrentPageToHistory() {
    const elt = getHistoryElement()
    const path = currentPathForHistory || location.pathname + location.search

    // Allow history snapshot feature to be disabled where hx-history="false"
    // is present *anywhere* in the current document we're about to save,
    // so we can prevent privileged data entering the cache.
    // The page will still be reachable as a history entry, but htmx will fetch it
    // live from the server onpopstate rather than look in the localStorage cache
    let disableHistoryCache
    try {
      disableHistoryCache = getDocument().querySelector('[hx-history="false" i],[data-hx-history="false" i]')
    } catch (e) {
    // IE11: insensitive modifier not supported so fallback to case sensitive selector
      disableHistoryCache = getDocument().querySelector('[hx-history="false"],[data-hx-history="false"]')
    }
    if (!disableHistoryCache) {
      triggerEvent(getDocument().body, 'htmx:beforeHistorySave', { path, historyElt: elt })
      saveToHistoryCache(path, elt);
    }

    if (htmx.config.historyEnabled) history.replaceState({ htmx: true }, getDocument().title, window.location.href)
  }

  function pushUrlIntoHistory(path) {
  // remove the cache buster parameter, if any
    if (htmx.config.getCacheBusterParam) {
      path = path.replace(/org\.htmx\.cache-buster=[^&]*&?/, '')
      if (endsWith(path, '&') || endsWith(path, '?')) {
        path = path.slice(0, -1)
      }
    }
    if (htmx.config.historyEnabled) {
      history.pushState({ htmx: true }, '', path)
    }
    currentPathForHistory = path
  }

  function replaceUrlInHistory(path) {
    if (htmx.config.historyEnabled) history.replaceState({ htmx: true }, '', path)
    currentPathForHistory = path
  }

  function settleImmediately(tasks) {
    forEach(tasks, function(task) {
      task.call()
    })
  }

  function loadHistoryFromServer(path) {
    const request = new XMLHttpRequest()
    const details = { path, xhr: request }
    triggerEvent(getDocument().body, 'htmx:historyCacheMiss', details)
    request.open('GET', path, true)
    request.setRequestHeader('HX-Request', 'true')
    request.setRequestHeader('HX-History-Restore-Request', 'true')
    request.setRequestHeader('HX-Current-URL', getDocument().location.href)
    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        triggerEvent(getDocument().body, 'htmx:historyCacheMissLoad', details)
        let fragment = makeFragment(this.response)
        // @ts-ignore
        let content = fragment.querySelector('[hx-history-elt],[data-hx-history-elt]') || fragment
        const historyElement = getHistoryElement()
        const settleInfo = makeSettleInfo(historyElement)
        handleTitle(fragment.title);
        handleHeadTag(fragment.head, htmx.config.head.boost);

        // @ts-ignore
        swapInnerHTML(historyElement, content, settleInfo)
        settleImmediately(settleInfo.tasks)
        currentPathForHistory = path
        triggerEvent(getDocument().body, 'htmx:historyRestore', { path, cacheMiss: true, serverResponse: this.response })
      } else {
        triggerErrorEvent(getDocument().body, 'htmx:historyCacheMissLoadError', details)
      }
    }
    request.send()
  }

  function restoreHistory(path) {
    saveCurrentPageToHistory()
    path = path || location.pathname + location.search
    const cached = getCachedHistory(path)
    if (cached) {
      const fragment = makeFragment(cached.content)
      const historyElement = getHistoryElement()
      const settleInfo = makeSettleInfo(historyElement)
      handleTitle(fragment.title);
      handleHeadTag(fragment.head, htmx.config.head.boost);
      swapInnerHTML(historyElement, fragment, settleInfo)
      settleImmediately(settleInfo.tasks);
      setTimeout(function() {
        window.scrollTo(0, cached.scroll)
      }, 0) // next 'tick', so browser has time to render layout
      currentPathForHistory = path
      triggerEvent(getDocument().body, 'htmx:historyRestore', { path, item: cached })
    } else {
      if (htmx.config.refreshOnHistoryMiss) {
      // @ts-ignore: optional parameter in reload() function throws error
        window.location.reload(true)
      } else {
        loadHistoryFromServer(path)
      }
    }
  }

  function addRequestIndicatorClasses(elt) {
    let indicators = findAttributeTargets(elt, 'hx-indicator')
    if (indicators == null) {
      indicators = [elt]
    }
    forEach(indicators, function(ic) {
      const internalData = getInternalData(ic)
      internalData.requestCount = (internalData.requestCount || 0) + 1
      ic.classList.add.call(ic.classList, htmx.config.requestClass)
    })
    return indicators
  }

  function disableElements(elt) {
    let disabledElts = findAttributeTargets(elt, 'hx-disabled-elt')
    if (disabledElts == null) {
      disabledElts = []
    }
    forEach(disabledElts, function(disabledElement) {
      const internalData = getInternalData(disabledElement)
      internalData.requestCount = (internalData.requestCount || 0) + 1
      disabledElement.setAttribute('disabled', '')
    })
    return disabledElts
  }

  function removeRequestIndicators(indicators, disabled) {
    forEach(indicators, function(ic) {
      const internalData = getInternalData(ic)
      internalData.requestCount = (internalData.requestCount || 0) - 1
      if (internalData.requestCount === 0) {
        ic.classList.remove.call(ic.classList, htmx.config.requestClass)
      }
    })
    forEach(disabled, function(disabledElement) {
      const internalData = getInternalData(disabledElement)
      internalData.requestCount = (internalData.requestCount || 0) - 1
      if (internalData.requestCount === 0) {
        disabledElement.removeAttribute('disabled')
      }
    })
  }

  //= ===================================================================
  // Input Value Processing
  //= ===================================================================

  function haveSeenNode(processed, elt) {
    for (let i = 0; i < processed.length; i++) {
      const node = processed[i]
      if (node.isSameNode(elt)) {
        return true
      }
    }
    return false
  }

  function shouldInclude(elt) {
    if (elt.name === '' || elt.name == null || elt.disabled) {
      return false
    }
    // ignore "submitter" types (see jQuery src/serialize.js)
    if (elt.type === 'button' || elt.type === 'submit' || elt.tagName === 'image' || elt.tagName === 'reset' || elt.tagName === 'file') {
      return false
    }
    if (elt.type === 'checkbox' || elt.type === 'radio') {
      return elt.checked
    }
    return true
  }

  function addValueToValues(name, value, values) {
  // This is a little ugly because both the current value of the named value in the form
  // and the new value could be arrays, so we have to handle all four cases :/
    if (name != null && value != null) {
      const current = values[name]
      if (current === undefined) {
        values[name] = value
      } else if (Array.isArray(current)) {
        if (Array.isArray(value)) {
          values[name] = current.concat(value)
        } else {
          current.push(value)
        }
      } else {
        if (Array.isArray(value)) {
          values[name] = [current].concat(value)
        } else {
          values[name] = [current, value]
        }
      }
    }
  }

  function processInputValue(processed, values, errors, elt, validate) {
    if (elt == null || haveSeenNode(processed, elt)) {
      return
    } else {
      processed.push(elt)
    }
    if (shouldInclude(elt)) {
      const name = getRawAttribute(elt, 'name')
      let value = elt.value
      if (elt.multiple && elt.tagName === 'SELECT') {
        value = toArray(elt.querySelectorAll('option:checked')).map(function(e) { return e.value })
      }
      // include file inputs
      if (elt.files) {
        value = toArray(elt.files)
      }
      addValueToValues(name, value, values)
      if (validate) {
        validateElement(elt, errors)
      }
    }
    if (matches(elt, 'form')) {
      const inputs = elt.elements
      forEach(inputs, function(input) {
        processInputValue(processed, values, errors, input, validate)
      })
    }
  }

  function validateElement(element, errors) {
    if (element.willValidate) {
      triggerEvent(element, 'htmx:validation:validate')
      if (!element.checkValidity()) {
        errors.push({ elt: element, message: element.validationMessage, validity: element.validity })
        triggerEvent(element, 'htmx:validation:failed', { message: element.validationMessage, validity: element.validity })
      }
    }
  }

  /**
 * @param {HTMLElement} elt
 * @param {string} verb
 */
  function getInputValues(elt, verb) {
    const processed = []
    let values = {}
    const formValues = {}
    const errors = []
    const internalData = getInternalData(elt)
    if (internalData.lastButtonClicked && !bodyContains(internalData.lastButtonClicked)) {
      internalData.lastButtonClicked = null
    }

    // only validate when form is directly submitted and novalidate or formnovalidate are not set
    // or if the element has an explicit hx-validate="true" on it
    let validate = (matches(elt, 'form') && elt.noValidate !== true) || getAttributeValue(elt, 'hx-validate') === 'true'
    if (internalData.lastButtonClicked) {
      validate = validate && internalData.lastButtonClicked.formNoValidate !== true
    }

    // for a non-GET include the closest form
    if (verb !== 'get') {
      processInputValue(processed, formValues, errors, closest(elt, 'form'), validate)
    }

    // include the element itself
    processInputValue(processed, values, errors, elt, validate)

    // if a button or submit was clicked last, include its value
    if (internalData.lastButtonClicked || elt.tagName === 'BUTTON' ||
    (elt.tagName === 'INPUT' && getRawAttribute(elt, 'type') === 'submit')) {
      const button = internalData.lastButtonClicked || elt
      const name = getRawAttribute(button, 'name')
      addValueToValues(name, button.value, formValues)
    }

    // include any explicit includes
    const includes = findAttributeTargets(elt, 'hx-include')
    forEach(includes, function(node) {
      processInputValue(processed, values, errors, node, validate)
      // if a non-form is included, include any input values within it
      if (!matches(node, 'form')) {
        forEach(node.querySelectorAll(INPUT_SELECTOR), function(descendant) {
          processInputValue(processed, values, errors, descendant, validate)
        })
      }
    })

    // form values take precedence, overriding the regular values
    values = mergeObjects(values, formValues)

    return { errors, values }
  }

  function appendParam(returnStr, name, realValue) {
    if (returnStr !== '') {
      returnStr += '&'
    }
    if (String(realValue) === '[object Object]') {
      realValue = JSON.stringify(realValue)
    }
    const s = encodeURIComponent(realValue)
    returnStr += encodeURIComponent(name) + '=' + s
    return returnStr
  }

  function urlEncode(values) {
    let returnStr = ''
    for (var name in values) {
      if (values.hasOwnProperty(name)) {
        const value = values[name]
        if (Array.isArray(value)) {
          forEach(value, function(v) {
            returnStr = appendParam(returnStr, name, v)
          })
        } else {
          returnStr = appendParam(returnStr, name, value)
        }
      }
    }
    return returnStr
  }

  function makeFormData(values) {
    const formData = new FormData()
    for (var name in values) {
      if (values.hasOwnProperty(name)) {
        const value = values[name]
        if (Array.isArray(value)) {
          forEach(value, function(v) {
            formData.append(name, v)
          })
        } else {
          formData.append(name, value)
        }
      }
    }
    return formData
  }

  //= ===================================================================
  // Ajax
  //= ===================================================================

  /**
 * @param {HTMLElement} elt
 * @param {HTMLElement} target
 * @param {string} prompt
 * @returns {Object} // TODO: Define/Improve HtmxHeaderSpecification
 */
  function getHeaders(elt, target, prompt) {
    const headers = {
      'HX-Request': 'true',
      'HX-Trigger': getRawAttribute(elt, 'id'),
      'HX-Trigger-Name': getRawAttribute(elt, 'name'),
      'HX-Target': getAttributeValue(target, 'id'),
      'HX-Current-URL': getDocument().location.href
    }
    getValuesForElement(elt, 'hx-headers', false, headers)
    if (prompt !== undefined) {
      headers['HX-Prompt'] = prompt
    }
    if (getInternalData(elt).boosted) {
      headers['HX-Boosted'] = 'true'
    }
    return headers
  }

  /**
 * filterValues takes an object containing form input values
 * and returns a new object that only contains keys that are
 * specified by the closest "hx-params" attribute
 * @param {Object} inputValues
 * @param {HTMLElement} elt
 * @returns {Object}
 */
  function filterValues(inputValues, elt) {
    const paramsValue = getClosestAttributeValue(elt, 'hx-params')
    if (paramsValue) {
      if (paramsValue === 'none') {
        return {}
      } else if (paramsValue === '*') {
        return inputValues
      } else if (paramsValue.indexOf('not ') === 0) {
        forEach(paramsValue.substr(4).split(','), function(name) {
          name = name.trim()
          delete inputValues[name]
        })
        return inputValues
      } else {
        const newValues = {}
        forEach(paramsValue.split(','), function(name) {
          name = name.trim()
          newValues[name] = inputValues[name]
        })
        return newValues
      }
    } else {
      return inputValues
    }
  }

  function isAnchorLink(elt) {
    return getRawAttribute(elt, 'href') && getRawAttribute(elt, 'href').indexOf('#') >= 0
  }

  /**
 *
 * @param {HTMLElement} elt
 * @param {string} swapInfoOverride
 * @returns {import("./htmx").HtmxSwapSpecification}
 */
  function getSwapSpecification(elt, swapInfoOverride) {
    const swapInfo = swapInfoOverride || getClosestAttributeValue(elt, 'hx-swap')
    const swapSpec = {
      swapStyle: getInternalData(elt).boosted ? 'innerHTML' : htmx.config.defaultSwapStyle,
      swapDelay: htmx.config.defaultSwapDelay,
      settleDelay: htmx.config.defaultSettleDelay
    }
    if (htmx.config.scrollIntoViewOnBoost && getInternalData(elt).boosted && !isAnchorLink(elt)) {
      swapSpec.show = 'top'
    }
    if (swapInfo) {
      const split = splitOnWhitespace(swapInfo)
      if (split.length > 0) {
        for (let i = 0; i < split.length; i++) {
          const value = split[i]
          if (value.indexOf('swap:') === 0) {
            swapSpec.swapDelay = parseInterval(value.substr(5))
          } else if (value.indexOf('settle:') === 0) {
            swapSpec.settleDelay = parseInterval(value.substr(7))
          } else if (value.indexOf('transition:') === 0) {
            swapSpec.transition = value.substr(11) === 'true'
          } else if (value.indexOf('ignoreTitle:') === 0) {
            swapSpec.ignoreTitle = value.substr(12) === 'true'
          } else if (value.indexOf('head:') === 0) {
            swapSpec.head = value.substr(5)
          } else if (value.indexOf('scroll:') === 0) {
            const scrollSpec = value.substr(7)
            var splitSpec = scrollSpec.split(':')
            const scrollVal = splitSpec.pop()
            var selectorVal = splitSpec.length > 0 ? splitSpec.join(':') : null
            swapSpec.scroll = scrollVal
            swapSpec.scrollTarget = selectorVal
          } else if (value.indexOf('show:') === 0) {
            const showSpec = value.substr(5)
            var splitSpec = showSpec.split(':')
            const showVal = splitSpec.pop()
            var selectorVal = splitSpec.length > 0 ? splitSpec.join(':') : null
            swapSpec.show = showVal
            swapSpec.showTarget = selectorVal
          } else if (value.indexOf('focus-scroll:') === 0) {
            const focusScrollVal = value.substr('focus-scroll:'.length)
            swapSpec.focusScroll = focusScrollVal == 'true'
          } else if (i == 0) {
            swapSpec.swapStyle = value
          } else {
            logError('Unknown modifier in hx-swap: ' + value)
          }
        }
      }
    }
    return swapSpec
  }

  function usesFormData(elt) {
    return getClosestAttributeValue(elt, 'hx-encoding') === 'multipart/form-data' ||
    (matches(elt, 'form') && getRawAttribute(elt, 'enctype') === 'multipart/form-data')
  }

  function encodeParamsForBody(xhr, elt, filteredParameters) {
    let encodedParameters = null
    withExtensions(elt, function(extension) {
      if (encodedParameters == null) {
        encodedParameters = extension.encodeParameters(xhr, filteredParameters, elt)
      }
    })
    if (encodedParameters != null) {
      return encodedParameters
    } else {
      if (usesFormData(elt)) {
        return makeFormData(filteredParameters)
      } else {
        return urlEncode(filteredParameters)
      }
    }
  }

  /**
 *
 * @param {Element} target
 * @returns {import("./htmx").HtmxSettleInfo}
 */
  function makeSettleInfo(target) {
    return { tasks: [], elts: [target] }
  }

  function updateScrollState(content, swapSpec) {
    const first = content[0]
    const last = content[content.length - 1]
    if (swapSpec.scroll) {
      var target = null
      if (swapSpec.scrollTarget) {
        target = querySelectorExt(first, swapSpec.scrollTarget)
      }
      if (swapSpec.scroll === 'top' && (first || target)) {
        target = target || first
        target.scrollTop = 0
      }
      if (swapSpec.scroll === 'bottom' && (last || target)) {
        target = target || last
        target.scrollTop = target.scrollHeight
      }
    }
    if (swapSpec.show) {
      var target = null
      if (swapSpec.showTarget) {
        let targetStr = swapSpec.showTarget
        if (swapSpec.showTarget === 'window') {
          targetStr = 'body'
        }
        target = querySelectorExt(first, targetStr)
      }
      if (swapSpec.show === 'top' && (first || target)) {
        target = target || first
        target.scrollIntoView({ block: 'start', behavior: htmx.config.scrollBehavior })
      }
      if (swapSpec.show === 'bottom' && (last || target)) {
        target = target || last
        target.scrollIntoView({ block: 'end', behavior: htmx.config.scrollBehavior })
      }
    }
  }

  /**
 * @param {HTMLElement} elt
 * @param {string} attr
 * @param {boolean=} evalAsDefault
 * @param {Object=} values
 * @returns {Object}
 */
  function getValuesForElement(elt, attr, evalAsDefault, values) {
    if (values == null) {
      values = {}
    }
    if (elt == null) {
      return values
    }
    const attributeValue = getAttributeValue(elt, attr)
    if (attributeValue) {
      let str = attributeValue.trim()
      let evaluateValue = evalAsDefault
      if (str === 'unset') {
        return null
      }
      if (str.indexOf('javascript:') === 0) {
        str = str.substr(11)
        evaluateValue = true
      } else if (str.indexOf('js:') === 0) {
        str = str.substr(3)
        evaluateValue = true
      }
      if (str.indexOf('{') !== 0) {
        str = '{' + str + '}'
      }
      let varsValues
      if (evaluateValue) {
        varsValues = maybeEval(elt, function() { return Function('return (' + str + ')')() }, {})
      } else {
        varsValues = parseJSON(str)
      }
      for (const key in varsValues) {
        if (varsValues.hasOwnProperty(key)) {
          if (values[key] == null) {
            values[key] = varsValues[key]
          }
        }
      }
    }
    return getValuesForElement(parentElt(elt), attr, evalAsDefault, values)
  }

  function maybeEval(elt, toEval, defaultVal) {
    if (htmx.config.allowEval) {
      return toEval()
    } else {
      triggerErrorEvent(elt, 'htmx:evalDisallowedError')
      return defaultVal
    }
  }

  /**
 * @param {HTMLElement} elt
 * @param {*} expressionVars
 * @returns
 */
  function getHXVarsForElement(elt, expressionVars) {
    return getValuesForElement(elt, 'hx-vars', true, expressionVars)
  }

  /**
 * @param {HTMLElement} elt
 * @param {*} expressionVars
 * @returns
 */
  function getHXValsForElement(elt, expressionVars) {
    return getValuesForElement(elt, 'hx-vals', false, expressionVars)
  }

  /**
 * @param {HTMLElement} elt
 * @returns {Object}
 */
  function getExpressionVars(elt) {
    return mergeObjects(getHXVarsForElement(elt), getHXValsForElement(elt))
  }

  function safelySetHeaderValue(xhr, header, headerValue) {
    if (headerValue !== null) {
      try {
        xhr.setRequestHeader(header, headerValue)
      } catch (e) {
      // On an exception, try to set the header URI encoded instead
        xhr.setRequestHeader(header, encodeURIComponent(headerValue))
        xhr.setRequestHeader(header + '-URI-AutoEncoded', 'true')
      }
    }
  }

  function getPathFromResponse(xhr) {
  // NB: IE11 does not support this stuff
    if (xhr.responseURL && typeof (URL) !== 'undefined') {
      try {
        const url = new URL(xhr.responseURL)
        return url.pathname + url.search
      } catch (e) {
        triggerErrorEvent(getDocument().body, 'htmx:badResponseUrl', { url: xhr.responseURL })
      }
    }
  }

  function hasHeader(xhr, regexp) {
    return regexp.test(xhr.getAllResponseHeaders())
  }

  function ajaxHelper(verb, path, context) {
    verb = verb.toLowerCase()
    if (context) {
      if (context instanceof Element || isType(context, 'String')) {
        return issueAjaxRequest(verb, path, null, null, {
          targetOverride: resolveTarget(context),
          returnPromise: true
        })
      } else {
        return issueAjaxRequest(verb, path, resolveTarget(context.source), context.event,
          {
            handler: context.handler,
            headers: context.headers,
            values: context.values,
            targetOverride: resolveTarget(context.target),
            swapOverride: context.swap,
            select: context.select,
            returnPromise: true
          })
      }
    } else {
      return issueAjaxRequest(verb, path, null, null, {
        returnPromise: true
      })
    }
  }

  function hierarchyForElt(elt) {
    const arr = []
    while (elt) {
      arr.push(elt)
      elt = elt.parentElement
    }
    return arr
  }

  function verifyPath(elt, path, requestConfig) {
    let sameHost
    let url
    if (typeof URL === 'function') {
      url = new URL(path, document.location.href)
      const origin = document.location.origin
      sameHost = origin === url.origin
    } else {
    // IE11 doesn't support URL
      url = path
      sameHost = startsWith(path, document.location.origin)
    }

    if (htmx.config.selfRequestsOnly) {
      if (!sameHost) {
        return false
      }
    }
    return triggerEvent(elt, 'htmx:validateUrl', mergeObjects({ url, sameHost }, requestConfig))
  }

  function issueAjaxRequest(verb, path, elt, event, etc, confirmed) {
    let resolve = null
    let reject = null
    etc = etc != null ? etc : {}
    if (etc.returnPromise && typeof Promise !== 'undefined') {
      var promise = new Promise(function(_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      })
    }
    if (elt == null) {
      elt = getDocument().body
    }
    const responseHandler = etc.handler || handleAjaxResponse
    const select = etc.select || null

    if (!bodyContains(elt)) {
    // do not issue requests for elements removed from the DOM
      maybeCall(resolve)
      return promise
    }
    const target = etc.targetOverride || getTarget(elt)
    if (target == null || target == DUMMY_ELT) {
      triggerErrorEvent(elt, 'htmx:targetError', { target: getAttributeValue(elt, 'hx-target') })
      maybeCall(reject)
      return promise
    }

    let eltData = getInternalData(elt)
    const submitter = eltData.lastButtonClicked

    if (submitter) {
      const buttonPath = getRawAttribute(submitter, 'formaction')
      if (buttonPath != null) {
        path = buttonPath
      }

      const buttonVerb = getRawAttribute(submitter, 'formmethod')
      if (buttonVerb != null) {
      // ignore buttons with formmethod="dialog"
        if (buttonVerb.toLowerCase() !== 'dialog') {
          verb = buttonVerb
        }
      }
    }

    const confirmQuestion = getClosestAttributeValue(elt, 'hx-confirm')
    // allow event-based confirmation w/ a callback
    if (confirmed === undefined) {
      const issueRequest = function(skipConfirmation) {
        return issueAjaxRequest(verb, path, elt, event, etc, !!skipConfirmation)
      }
      const confirmDetails = { target, elt, path, verb, triggeringEvent: event, etc, issueRequest, question: confirmQuestion }
      if (triggerEvent(elt, 'htmx:confirm', confirmDetails) === false) {
        maybeCall(resolve)
        return promise
      }
    }

    let syncElt = elt
    let syncStrategy = getClosestAttributeValue(elt, 'hx-sync')
    let queueStrategy = null
    let abortable = false
    if (syncStrategy) {
      const syncStrings = syncStrategy.split(':')
      const selector = syncStrings[0].trim()
      if (selector === 'this') {
        syncElt = findThisElement(elt, 'hx-sync')
      } else {
        syncElt = querySelectorExt(elt, selector)
      }
      // default to the drop strategy
      syncStrategy = (syncStrings[1] || 'drop').trim()
      eltData = getInternalData(syncElt)
      if (syncStrategy === 'drop' && eltData.xhr && eltData.abortable !== true) {
        maybeCall(resolve)
        return promise
      } else if (syncStrategy === 'abort') {
        if (eltData.xhr) {
          maybeCall(resolve)
          return promise
        } else {
          abortable = true
        }
      } else if (syncStrategy === 'replace') {
        triggerEvent(syncElt, 'htmx:abort') // abort the current request and continue
      } else if (syncStrategy.indexOf('queue') === 0) {
        const queueStrArray = syncStrategy.split(' ')
        queueStrategy = (queueStrArray[1] || 'last').trim()
      }
    }

    if (eltData.xhr) {
      if (eltData.abortable) {
        triggerEvent(syncElt, 'htmx:abort') // abort the current request and continue
      } else {
        if (queueStrategy == null) {
          if (event) {
            const eventData = getInternalData(event)
            if (eventData && eventData.triggerSpec && eventData.triggerSpec.queue) {
              queueStrategy = eventData.triggerSpec.queue
            }
          }
          if (queueStrategy == null) {
            queueStrategy = 'last'
          }
        }
        if (eltData.queuedRequests == null) {
          eltData.queuedRequests = []
        }
        if (queueStrategy === 'first' && eltData.queuedRequests.length === 0) {
          eltData.queuedRequests.push(function() {
            issueAjaxRequest(verb, path, elt, event, etc)
          })
        } else if (queueStrategy === 'all') {
          eltData.queuedRequests.push(function() {
            issueAjaxRequest(verb, path, elt, event, etc)
          })
        } else if (queueStrategy === 'last') {
          eltData.queuedRequests = [] // dump existing queue
          eltData.queuedRequests.push(function() {
            issueAjaxRequest(verb, path, elt, event, etc)
          })
        }
        maybeCall(resolve)
        return promise
      }
    }

    const xhr = new XMLHttpRequest()
    eltData.xhr = xhr
    eltData.abortable = abortable
    const endRequestLock = function() {
      eltData.xhr = null
      eltData.abortable = false
      if (eltData.queuedRequests != null &&
      eltData.queuedRequests.length > 0) {
        const queuedRequest = eltData.queuedRequests.shift()
        queuedRequest()
      }
    }
    const promptQuestion = getClosestAttributeValue(elt, 'hx-prompt')
    if (promptQuestion) {
      var promptResponse = prompt(promptQuestion)
      // prompt returns null if cancelled and empty string if accepted with no entry
      if (promptResponse === null ||
      !triggerEvent(elt, 'htmx:prompt', { prompt: promptResponse, target })) {
        maybeCall(resolve)
        endRequestLock()
        return promise
      }
    }

    if (confirmQuestion && !confirmed) {
      if (!confirm(confirmQuestion)) {
        maybeCall(resolve)
        endRequestLock()
        return promise
      }
    }

    let headers = getHeaders(elt, target, promptResponse)

    if (verb !== 'get' && !usesFormData(elt)) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    if (etc.headers) {
      headers = mergeObjects(headers, etc.headers)
    }
    const results = getInputValues(elt, verb)
    let errors = results.errors
    let rawParameters = results.values
    if (etc.values) {
      rawParameters = mergeObjects(rawParameters, etc.values)
    }
    const expressionVars = getExpressionVars(elt)
    const allParameters = mergeObjects(rawParameters, expressionVars)
    let filteredParameters = filterValues(allParameters, elt)

    if (htmx.config.getCacheBusterParam && verb === 'get') {
      filteredParameters['org.htmx.cache-buster'] = getRawAttribute(target, 'id') || 'true'
    }

    // behavior of anchors w/ empty href is to use the current URL
    if (path == null || path === '') {
      path = getDocument().location.href
    }

    const requestAttrValues = getValuesForElement(elt, 'hx-request')

    const eltIsBoosted = getInternalData(elt).boosted

    let useUrlParams = htmx.config.methodsThatUseUrlParams.indexOf(verb) >= 0

    const requestConfig = {
      boosted: eltIsBoosted,
      useUrlParams,
      parameters: filteredParameters,
      unfilteredParameters: allParameters,
      headers,
      target,
      verb,
      errors,
      withCredentials: etc.credentials || requestAttrValues.credentials || htmx.config.withCredentials,
      timeout: etc.timeout || requestAttrValues.timeout || htmx.config.timeout,
      path,
      triggeringEvent: event
    }

    if (!triggerEvent(elt, 'htmx:configRequest', requestConfig)) {
      maybeCall(resolve)
      endRequestLock()
      return promise
    }

    // copy out in case the object was overwritten
    path = requestConfig.path
    verb = requestConfig.verb
    headers = requestConfig.headers
    filteredParameters = requestConfig.parameters
    errors = requestConfig.errors
    useUrlParams = requestConfig.useUrlParams

    if (errors && errors.length > 0) {
      triggerEvent(elt, 'htmx:validation:halted', requestConfig)
      maybeCall(resolve)
      endRequestLock()
      return promise
    }

    const splitPath = path.split('#')
    const pathNoAnchor = splitPath[0]
    const anchor = splitPath[1]

    let finalPath = path
    if (useUrlParams) {
      finalPath = pathNoAnchor
      const values = Object.keys(filteredParameters).length !== 0
      if (values) {
        if (finalPath.indexOf('?') < 0) {
          finalPath += '?'
        } else {
          finalPath += '&'
        }
        finalPath += urlEncode(filteredParameters)
        if (anchor) {
          finalPath += '#' + anchor
        }
      }
    }

    if (!verifyPath(elt, finalPath, requestConfig)) {
      triggerErrorEvent(elt, 'htmx:invalidPath', requestConfig)
      maybeCall(reject)
      return promise
    };

    xhr.open(verb.toUpperCase(), finalPath, true)
    xhr.overrideMimeType('text/html')
    xhr.withCredentials = requestConfig.withCredentials
    xhr.timeout = requestConfig.timeout

    // request headers
    if (requestAttrValues.noHeaders) {
    // ignore all headers
    } else {
      for (const header in headers) {
        if (headers.hasOwnProperty(header)) {
          const headerValue = headers[header]
          safelySetHeaderValue(xhr, header, headerValue)
        }
      }
    }

    const responseInfo = {
      xhr,
      target,
      requestConfig,
      etc,
      boosted: eltIsBoosted,
      select,
      pathInfo: {
        requestPath: path,
        finalRequestPath: finalPath,
        anchor
      }
    }

    xhr.onload = function() {
      try {
        const hierarchy = hierarchyForElt(elt)
        responseInfo.pathInfo.responsePath = getPathFromResponse(xhr)
        responseHandler(elt, responseInfo)
        removeRequestIndicators(indicators, disableElts)
        triggerEvent(elt, 'htmx:afterRequest', responseInfo)
        triggerEvent(elt, 'htmx:afterOnLoad', responseInfo)
        // if the body no longer contains the element, trigger the event on the closest parent
        // remaining in the DOM
        if (!bodyContains(elt)) {
          let secondaryTriggerElt = null
          while (hierarchy.length > 0 && secondaryTriggerElt == null) {
            const parentEltInHierarchy = hierarchy.shift()
            if (bodyContains(parentEltInHierarchy)) {
              secondaryTriggerElt = parentEltInHierarchy
            }
          }
          if (secondaryTriggerElt) {
            triggerEvent(secondaryTriggerElt, 'htmx:afterRequest', responseInfo)
            triggerEvent(secondaryTriggerElt, 'htmx:afterOnLoad', responseInfo)
          }
        }
        maybeCall(resolve)
        endRequestLock()
      } catch (e) {
        triggerErrorEvent(elt, 'htmx:onLoadError', mergeObjects({ error: e }, responseInfo))
        throw e
      }
    }
    xhr.onerror = function() {
      removeRequestIndicators(indicators, disableElts)
      triggerErrorEvent(elt, 'htmx:afterRequest', responseInfo)
      triggerErrorEvent(elt, 'htmx:sendError', responseInfo)
      maybeCall(reject)
      endRequestLock()
    }
    xhr.onabort = function() {
      removeRequestIndicators(indicators, disableElts)
      triggerErrorEvent(elt, 'htmx:afterRequest', responseInfo)
      triggerErrorEvent(elt, 'htmx:sendAbort', responseInfo)
      maybeCall(reject)
      endRequestLock()
    }
    xhr.ontimeout = function() {
      removeRequestIndicators(indicators, disableElts)
      triggerErrorEvent(elt, 'htmx:afterRequest', responseInfo)
      triggerErrorEvent(elt, 'htmx:timeout', responseInfo)
      maybeCall(reject)
      endRequestLock()
    }
    if (!triggerEvent(elt, 'htmx:beforeRequest', responseInfo)) {
      maybeCall(resolve)
      endRequestLock()
      return promise
    }
    var indicators = addRequestIndicatorClasses(elt)
    var disableElts = disableElements(elt)

    forEach(['loadstart', 'loadend', 'progress', 'abort'], function(eventName) {
      forEach([xhr, xhr.upload], function(target) {
        target.addEventListener(eventName, function(event) {
          triggerEvent(elt, 'htmx:xhr:' + eventName, {
            lengthComputable: event.lengthComputable,
            loaded: event.loaded,
            total: event.total
          })
        })
      })
    })
    triggerEvent(elt, 'htmx:beforeSend', responseInfo)
    const params = useUrlParams ? null : encodeParamsForBody(xhr, elt, filteredParameters)
    xhr.send(params)
    return promise
  }

  function determineHistoryUpdates(elt, responseInfo) {
    const xhr = responseInfo.xhr

    //= ==========================================
    // First consult response headers
    //= ==========================================
    let pathFromHeaders = null
    let typeFromHeaders = null
    if (hasHeader(xhr, /HX-Push:/i)) {
      pathFromHeaders = xhr.getResponseHeader('HX-Push')
      typeFromHeaders = 'push'
    } else if (hasHeader(xhr, /HX-Push-Url:/i)) {
      pathFromHeaders = xhr.getResponseHeader('HX-Push-Url')
      typeFromHeaders = 'push'
    } else if (hasHeader(xhr, /HX-Replace-Url:/i)) {
      pathFromHeaders = xhr.getResponseHeader('HX-Replace-Url')
      typeFromHeaders = 'replace'
    }

    // if there was a response header, that has priority
    if (pathFromHeaders) {
      if (pathFromHeaders === 'false') {
        return {}
      } else {
        return {
          type: typeFromHeaders,
          path: pathFromHeaders
        }
      }
    }

    //= ==========================================
    // Next resolve via DOM values
    //= ==========================================
    const requestPath = responseInfo.pathInfo.finalRequestPath
    const responsePath = responseInfo.pathInfo.responsePath

    const pushUrl = getClosestAttributeValue(elt, 'hx-push-url')
    const replaceUrl = getClosestAttributeValue(elt, 'hx-replace-url')
    const elementIsBoosted = getInternalData(elt).boosted

    let saveType = null
    let path = null

    if (pushUrl) {
      saveType = 'push'
      path = pushUrl
    } else if (replaceUrl) {
      saveType = 'replace'
      path = replaceUrl
    } else if (elementIsBoosted) {
      saveType = 'push'
      path = responsePath || requestPath // if there is no response path, go with the original request path
    }

    if (path) {
    // false indicates no push, return empty object
      if (path === 'false') {
        return {}
      }

      // true indicates we want to follow wherever the server ended up sending us
      if (path === 'true') {
        path = responsePath || requestPath // if there is no response path, go with the original request path
      }

      // restore any anchor associated with the request
      if (responseInfo.pathInfo.anchor &&
      path.indexOf('#') === -1) {
        path = path + '#' + responseInfo.pathInfo.anchor
      }

      return {
        type: saveType,
        path
      }
    } else {
      return {}
    }
  }

  function codeMatches(responseHandlingConfig, status) {
    var regExp = new RegExp(responseHandlingConfig.code)
    return regExp.test(status)
  }

  function resolveResponseHandling(xhr) {
    for (var i = 0; i < htmx.config.responseHandling.length; i++) {
      var responseHandlingElement = htmx.config.responseHandling[i]
      if (codeMatches(responseHandlingElement, xhr.status)) {
        return responseHandlingElement
      }
    }
    // no matches, return no swap
    return {
      swap: false
    }
  }

  function handleTitle(title) {
    if (title) {
      const titleElt = find('title');
      if (titleElt) {
        titleElt.innerHTML = title
      } else {
        window.document.title = title
      }
    }
  }

  function handleAjaxResponse(elt, responseInfo) {
    const xhr = responseInfo.xhr
    let target = responseInfo.target
    const etc = responseInfo.etc
    const select = responseInfo.select

    if (!triggerEvent(elt, 'htmx:beforeOnLoad', responseInfo)) return

    if (hasHeader(xhr, /HX-Trigger:/i)) {
      handleTrigger(xhr, 'HX-Trigger', elt)
    }

    if (hasHeader(xhr, /HX-Location:/i)) {
      saveCurrentPageToHistory()
      let redirectPath = xhr.getResponseHeader('HX-Location')
      var swapSpec
      if (redirectPath.indexOf('{') === 0) {
        swapSpec = parseJSON(redirectPath)
        // what's the best way to throw an error if the user didn't include this
        redirectPath = swapSpec.path
        delete swapSpec.path
      }
      ajaxHelper('GET', redirectPath, swapSpec).then(function() {
        pushUrlIntoHistory(redirectPath)
      })
      return
    }

    const shouldRefresh = hasHeader(xhr, /HX-Refresh:/i) && xhr.getResponseHeader('HX-Refresh') === 'true'

    if (hasHeader(xhr, /HX-Redirect:/i)) {
      location.href = xhr.getResponseHeader('HX-Redirect')
      shouldRefresh && location.reload()
      return
    }

    if (shouldRefresh) {
      location.reload()
      return
    }

    if (hasHeader(xhr, /HX-Retarget:/i)) {
      if (xhr.getResponseHeader('HX-Retarget') === 'this') {
        responseInfo.target = elt
      } else {
        responseInfo.target = querySelectorExt(elt, xhr.getResponseHeader('HX-Retarget'))
      }
    }

    const historyUpdate = determineHistoryUpdates(elt, responseInfo)

    const responseHandling = resolveResponseHandling(xhr)
    const shouldSwap = responseHandling.swap
    let isError = !!responseHandling.error
    let ignoreTitle = htmx.config.ignoreTitle || responseHandling.ignoreTitle
    let head = responseInfo.boosted ? htmx.config.head.boost : htmx.config.head.other
    let selectOverride = responseHandling.select
    if (responseHandling.target) {
      responseInfo.target = querySelectorExt(elt, responseHandling.target)
    }
    var swapOverride = etc.swapOverride
    if (swapOverride == null && responseHandling.swapOverride) {
      swapOverride = responseHandling.swapOverride
    }

    // response headers override response handling config
    if (hasHeader(xhr, /HX-Retarget:/i)) {
      if (xhr.getResponseHeader('HX-Retarget') === 'this') {
        responseInfo.target = elt
      } else {
        responseInfo.target = querySelectorExt(elt, xhr.getResponseHeader('HX-Retarget'))
      }
    }
    if (hasHeader(xhr, /HX-Reswap:/i)) {
      swapOverride = xhr.getResponseHeader('HX-Reswap')
    }

    var serverResponse = xhr.response
    var beforeSwapDetails = mergeObjects({
      shouldSwap,
      serverResponse,
      isError,
      ignoreTitle,
      selectOverride,
      head
    }, responseInfo)

    if (responseHandling.event && !triggerEvent(target, responseHandling.event, beforeSwapDetails)) return

    if (!triggerEvent(target, 'htmx:beforeSwap', beforeSwapDetails)) return

    target = beforeSwapDetails.target // allow re-targeting
    serverResponse = beforeSwapDetails.serverResponse // allow updating content
    isError = beforeSwapDetails.isError // allow updating error
    ignoreTitle = beforeSwapDetails.ignoreTitle // allow updating ignoring title
    head = beforeSwapDetails.head // allow updating head algorithm
    selectOverride = beforeSwapDetails.selectOverride // allow updating select override

    responseInfo.target = target // Make updated target available to response events
    responseInfo.failed = isError // Make failed property available to response events
    responseInfo.successful = !isError // Make successful property available to response events

    if (beforeSwapDetails.shouldSwap) {
      if (xhr.status === 286) {
        cancelPolling(elt)
      }

      withExtensions(elt, function(extension) {
        serverResponse = extension.transformResponse(serverResponse, xhr, elt)
      })

      // Save current page if there will be a history update
      if (historyUpdate.type) {
        saveCurrentPageToHistory()
      }

      if (hasHeader(xhr, /HX-Reswap:/i)) {
        swapOverride = xhr.getResponseHeader('HX-Reswap')
      }
      var swapSpec = getSwapSpecification(elt, swapOverride)

      if (swapSpec.hasOwnProperty('ignoreTitle')) {
        ignoreTitle = swapSpec.ignoreTitle
      }
      if (swapSpec.hasOwnProperty('head')) {
        head = swapSpec.head
      }

      target.classList.add(htmx.config.swappingClass)

      // optional transition API promise callbacks
      let settleResolve = null
      let settleReject = null

      let doSwap = function() {
        try {
          const activeElt = document.activeElement
          let selectionInfo = {}
          try {
            selectionInfo = {
              elt: activeElt,
              // @ts-ignore
              start: activeElt ? activeElt.selectionStart : null,
              // @ts-ignore
              end: activeElt ? activeElt.selectionEnd : null
            }
          } catch (e) {
            // safari issue - see https://github.com/microsoft/playwright/issues/5894
          }

          if (select) {
            selectOverride = select
          }

          if (hasHeader(xhr, /HX-Reselect:/i)) {
            selectOverride = xhr.getResponseHeader('HX-Reselect')
          }

          // if we need to save history, do so, before swapping so that relative resources have the correct base URL
          if (historyUpdate.type) {
            triggerEvent(getDocument().body, 'htmx:beforeHistoryUpdate', mergeObjects({ history: historyUpdate }, responseInfo))
            if (historyUpdate.type === 'push') {
              pushUrlIntoHistory(historyUpdate.path)
              triggerEvent(getDocument().body, 'htmx:pushedIntoHistory', { path: historyUpdate.path })
            } else {
              replaceUrlInHistory(historyUpdate.path)
              triggerEvent(getDocument().body, 'htmx:replacedInHistory', { path: historyUpdate.path })
            }
          }

          const settleInfo = makeSettleInfo(target)
          selectAndSwap(swapSpec.swapStyle, target, elt, serverResponse, settleInfo, selectOverride)

          if (selectionInfo.elt &&
                  !bodyContains(selectionInfo.elt) &&
                  getRawAttribute(selectionInfo.elt, 'id')) {
            const newActiveElt = document.getElementById(getRawAttribute(selectionInfo.elt, 'id'))
            const focusOptions = { preventScroll: swapSpec.focusScroll !== undefined ? !swapSpec.focusScroll : !htmx.config.defaultFocusScroll }
            if (newActiveElt) {
              // @ts-ignore
              if (selectionInfo.start && newActiveElt.setSelectionRange) {
                // @ts-ignore
                try {
                  newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end)
                } catch (e) {
                  // the setSelectionRange method is present on fields that don't support it, so just let this fail
                }
              }
              newActiveElt.focus(focusOptions)
            }
          }

          target.classList.remove(htmx.config.swappingClass)
          forEach(settleInfo.elts, function(elt) {
            if (elt.classList) {
              elt.classList.add(htmx.config.settlingClass)
            }
            triggerEvent(elt, 'htmx:afterSwap', responseInfo)
          })

          if (!ignoreTitle) {
            handleTitle(settleInfo.title);
          }

          console.log("Here", head)
          // merge in new head after swap but before settle
          if (triggerEvent(document.body, "htmx:beforeHeadMerge", {head: settleInfo.head})) {
            handleHeadTag(settleInfo.head, head);
          }

          if (hasHeader(xhr, /HX-Trigger-After-Swap:/i)) {
            let finalElt = elt
            if (!bodyContains(elt)) {
              finalElt = getDocument().body
            }
            handleTrigger(xhr, 'HX-Trigger-After-Swap', finalElt)
          }

          const doSettle = function() {
            forEach(settleInfo.tasks, function(task) {
              task.call()
            })
            forEach(settleInfo.elts, function(elt) {
              if (elt.classList) {
                elt.classList.remove(htmx.config.settlingClass)
              }
              triggerEvent(elt, 'htmx:afterSettle', responseInfo)
            })

            if (responseInfo.pathInfo.anchor) {
              const anchorTarget = getDocument().getElementById(responseInfo.pathInfo.anchor)
              if (anchorTarget) {
                anchorTarget.scrollIntoView({ block: 'start', behavior: 'auto' })
              }
            }

            updateScrollState(settleInfo.elts, swapSpec)

            if (hasHeader(xhr, /HX-Trigger-After-Settle:/i)) {
              let finalElt = elt
              if (!bodyContains(elt)) {
                finalElt = getDocument().body
              }
              handleTrigger(xhr, 'HX-Trigger-After-Settle', finalElt)
            }
            maybeCall(settleResolve)
          }

          if (swapSpec.settleDelay > 0) {
            setTimeout(doSettle, swapSpec.settleDelay)
          } else {
            doSettle()
          }
        } catch (e) {
          triggerErrorEvent(elt, 'htmx:swapError', responseInfo)
          maybeCall(settleReject)
          throw e
        }
      }

      let shouldTransition = htmx.config.globalViewTransitions
      if (swapSpec.hasOwnProperty('transition')) {
        shouldTransition = swapSpec.transition
      }

      if (shouldTransition &&
              triggerEvent(elt, 'htmx:beforeTransition', responseInfo) &&
              typeof Promise !== 'undefined' && document.startViewTransition) {
        const settlePromise = new Promise(function(_resolve, _reject) {
          settleResolve = _resolve
          settleReject = _reject
        })
        // wrap the original doSwap() in a call to startViewTransition()
        const innerDoSwap = doSwap
        doSwap = function() {
          document.startViewTransition(function() {
            innerDoSwap()
            return settlePromise
          })
        }
      }

      if (swapSpec.swapDelay > 0) {
        setTimeout(doSwap, swapSpec.swapDelay)
      } else {
        doSwap()
      }
    }
    if (isError) {
      triggerErrorEvent(elt, 'htmx:responseError', mergeObjects({ error: 'Response Status Error Code ' + xhr.status + ' from ' + responseInfo.pathInfo.requestPath }, responseInfo))
    }
  }

  //= ===================================================================
  // Extensions API
  //= ===================================================================

  /** @type {Object<string, import("./htmx").HtmxExtension>} */
  const extensions = {}

  /**
 * extensionBase defines the default functions for all extensions.
 * @returns {import("./htmx").HtmxExtension}
 */
  function extensionBase() {
    return {
      init: function(api) { return null },
      onEvent: function(name, evt) { return true },
      transformResponse: function(text, xhr, elt) { return text },
      isInlineSwap: function(swapStyle) { return false },
      handleSwap: function(swapStyle, target, fragment, settleInfo) { return false },
      encodeParameters: function(xhr, parameters, elt) { return null }
    }
  }

  /**
 * defineExtension initializes the extension and adds it to the htmx registry
 *
 * @param {string} name
 * @param {import("./htmx").HtmxExtension} extension
 */
  function defineExtension(name, extension) {
    if (name === "head-support") return; // ignore the head support extension, now integrated into htmx
    if (extension.init) {
      extension.init(internalAPI);
    }
    extensions[name] = mergeObjects(extensionBase(), extension)
  }

  /**
 * removeExtension removes an extension from the htmx registry
 *
 * @param {string} name
 */
  function removeExtension(name) {
    delete extensions[name]
  }

  /**
 * getExtensions searches up the DOM tree to return all extensions that can be applied to a given element
 *
 * @param {HTMLElement} elt
 * @param {import("./htmx").HtmxExtension[]=} extensionsToReturn
 * @param {import("./htmx").HtmxExtension[]=} extensionsToIgnore
 */
  function getExtensions(elt, extensionsToReturn, extensionsToIgnore) {
    if (elt == undefined) {
      return extensionsToReturn
    }
    if (extensionsToReturn == undefined) {
      extensionsToReturn = []
    }
    if (extensionsToIgnore == undefined) {
      extensionsToIgnore = []
    }
    const extensionsForElement = getAttributeValue(elt, 'hx-ext')
    if (extensionsForElement) {
      forEach(extensionsForElement.split(','), function(extensionName) {
        extensionName = extensionName.replace(/ /g, '')
        if (extensionName.slice(0, 7) == 'ignore:') {
          extensionsToIgnore.push(extensionName.slice(7))
          return
        }
        if (extensionsToIgnore.indexOf(extensionName) < 0) {
          const extension = extensions[extensionName]
          if (extension && extensionsToReturn.indexOf(extension) < 0) {
            extensionsToReturn.push(extension)
          }
        }
      })
    }
    return getExtensions(parentElt(elt), extensionsToReturn, extensionsToIgnore)
  }

  //= ===================================================================
  // Initialization
  //= ===================================================================
  /**
 * We want to initialize the page elements after DOMContentLoaded
 * fires, but there isn't always a good way to tell whether
 * it has already fired when we get here or not.
 */
  function ready(functionToCall) {
  // call the function exactly once no matter how many times this is called
    const callReadyFunction = function() {
      if (!functionToCall) return
      functionToCall()
      functionToCall = null
    }

    if (getDocument().readyState === 'complete') {
    // DOMContentLoaded definitely fired, we can initialize the page
      callReadyFunction()
    } else {
    /* DOMContentLoaded *maybe* already fired, wait for
     * the next DOMContentLoaded or readystatechange event
     */
      getDocument().addEventListener('DOMContentLoaded', function() {
        callReadyFunction()
      })
      getDocument().addEventListener('readystatechange', function() {
        if (getDocument().readyState !== 'complete') return
        callReadyFunction()
      })
    }
  }

  function insertIndicatorStyles() {
    if (htmx.config.includeIndicatorStyles !== false) {
      getDocument().head.insertAdjacentHTML('beforeend',
        '<style>\
      .' + htmx.config.indicatorClass + '{opacity:0}\
      .' + htmx.config.requestClass + ' .' + htmx.config.indicatorClass + '{opacity:1; transition: opacity 200ms ease-in;}\
      .' + htmx.config.requestClass + '.' + htmx.config.indicatorClass + '{opacity:1; transition: opacity 200ms ease-in;}\
      </style>')
    }
  }

  function getMetaConfig() {
    const element = getDocument().querySelector('meta[name="htmx-config"]')
    if (element) {
    // @ts-ignore
      return parseJSON(element.content)
    } else {
      return null
    }
  }

  function mergeMetaConfig() {
    const metaConfig = getMetaConfig()
    if (metaConfig) {
      htmx.config = mergeObjects(htmx.config, metaConfig)
    }
  }

  // initialize the document
  ready(function() {
    mergeMetaConfig()
    insertIndicatorStyles()
    let body = getDocument().body
    processNode(body)
    const restoredElts = getDocument().querySelectorAll(
      "[hx-trigger='restored'],[data-hx-trigger='restored']"
    )
    body.addEventListener('htmx:abort', function(evt) {
      const target = evt.target
      const internalData = getInternalData(target)
      if (internalData && internalData.xhr) {
        internalData.xhr.abort()
      }
    })
    /** @type {(ev: PopStateEvent) => any} */
    const originalPopstate = window.onpopstate ? window.onpopstate.bind(window) : null
    /** @type {(ev: PopStateEvent) => any} */
    window.onpopstate = function(event) {
      if (event.state && event.state.htmx) {
        restoreHistory()
        forEach(restoredElts, function(elt) {
          triggerEvent(elt, 'htmx:restored', {
            document: getDocument(),
            triggerEvent
          })
        })
      } else {
        if (originalPopstate) {
          originalPopstate(event)
        }
      }
    }
    setTimeout(function() {
      triggerEvent(body, 'htmx:load', {}) // give ready handlers a chance to load up before firing this event
      body = null // kill reference for gc
    }, 0)
  })

  return htmx
})()
