'use strict';
////////////////////////////////////

/**
 * Intercooler.js
 *
 * A javascript library for people who don't don't want to write a lot
 * of javascript.
 *
 */
var Intercooler = Intercooler || (function () {

  //--------------------------------------------------
  // Vars
  //--------------------------------------------------

  // Logging constants
  var _DEBUG = 1;
  var _INFO = 2;
  var _WARN = 3;
  var _ERROR = 4;

  var _SRC_ATTRS = ['ic-src', 'ic-style-src', 'ic-attr-src', 'ic-prepend-from', 'ic-append-from', 'ic-text-src'];
  var _DEST_ATTRS = ['ic-post-to', 'ic-put-to', 'ic-delete-from'];

  var _remote = $;
  var _urlHandlers = [];
  var _logger = window.console;
  var _loggingLevel = null;
  var _loggingGrep = null;

  //============================================================
  // Utility Methods
  //============================================================

  /*
  CryptoJS v3.1.2
  code.google.com/p/crypto-js
  (c) 2009-2013 by Jeff Mott. All rights reserved.
  code.google.com/p/crypto-js/wiki/License
  */
  var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
  n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
  32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
  2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
  k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
  a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
  f)).finalize(b)}}});var s=p.algo={};return p}(Math);
  (function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
  k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();

  function fp(elt) {
    return CryptoJS.SHA1(elt.html()).toString();
  }

  function levelPrefix(level) {
    if(level == _DEBUG) {
      return "IC DEBUG: ";
    } else if(level == _INFO) {
      return "IC INFO: ";
    } else if(level == _WARN) {
      return "IC WARN: ";
    } else if(level == _ERROR) {
      return "IC ERROR: ";
    } else {
      return "IC UNKNOWN: ";
    }
  }

  function log(msg, level) {
    var srcLevel = level || _INFO;
    var targetLevel = _loggingLevel || _ERROR;
    if (_logger && (srcLevel >= targetLevel) && (_loggingGrep == null || _loggingGrep.test(msg))) {
      _logger.log(levelPrefix(srcLevel), msg);
    }
  }

  function uuid() {
    var d = new Date().getTime();
    //noinspection UnnecessaryLocalVariableJS
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
  }

  function icSelectorFor(elt) {
    return "[ic-id='" + elt.attr("ic-id") + "']";
  }

  function parseInterval(str) {
    log("POLL: Parsing interval string " + str, _DEBUG);
    if (str == "null" || str == "false" || str == "") {
      return null;
    } else if (str.lastIndexOf("ms") == str.length - 2) {
      return parseInt(str.substr(0, str.length - 2));
    } else if (str.lastIndexOf("s") == str.length - 1) {
      return parseInt(str.substr(0, str.length - 1)) * 1000;
    } else {
      return 1000;
    }
  }

  //============================================================
  // Request/Parameter/Include Processing
  //============================================================

  function getTarget(elt) {
    if(elt.attr('ic-target')) {
      return $(elt.attr('ic-target'));
    } else {
      return elt;
    }
  }

  function processHeaders(elt, xhr) {
    if (xhr.getResponseHeader("X-ic-refresh")) {
      var pathsToRefresh = xhr.getResponseHeader("X-ic-refresh").split(",");
      log("IC HEADER: refreshing " + pathsToRefresh, _DEBUG);
      $.each(pathsToRefresh, function (i, str) {
        refreshDependencies(str.replace(/ /g, ""), elt);
      });
    } else if (xhr.getResponseHeader("X-ic-script")) {
      log("IC HEADER: evaling " + xhr.getResponseHeader("X-ic-script"), _DEBUG);
      eval(xhr.getResponseHeader("X-ic-script"));
    } else if (xhr.getResponseHeader("X-ic-redirect")) {
      log("IC HEADER: redirecting to " + xhr.getResponseHeader("X-ic-redirect"), _DEBUG);
      window.location = xhr.getResponseHeader("X-ic-redirect");
    } else if (xhr.getResponseHeader("X-ic-open")) {
      log("IC HEADER: opening " + xhr.getResponseHeader("X-ic-open"), _DEBUG);
      window.open(xhr.getResponseHeader("X-ic-open"));
    } else if (xhr.getResponseHeader("X-ic-remove")) {
      log("IC HEADER REMOVE COMMAND");
      if (elt) {
        var target = getTarget(elt);
        log("IC REMOVING: " + target.html(), _DEBUG);
        if (target.attr('ic-transition') == "none") {
          target.remove();
        } else {
          target.fadeOut('fast', function () {
            target.remove();
          });
        }
      }
    }

    return true;
  }

  function handleTestResponse(elt, success, returnVal) {
    var headers = {};
    if(returnVal && returnVal.headers) {
      headers = returnVal.headers;
    }
    var body = "";
    if (returnVal) {
      if(typeof returnVal == 'string' || returnVal instanceof String) {
        body = returnVal;
      } else if(typeof returnVal.body == 'string' || returnVal.body instanceof String) {
        body = returnVal.body;
      }
    }
    processHeaders(elt, {
      getResponseHeader: function (key) {
        return headers[key];
      }
    });
    success(body, "", elt);
  }

  function handleRemoteRequest(elt, type, url, data, success) {
    if(type == "PUT") {
      data += "&_method=PUT";
    }
    if(type == "DELETE") {
      data += "&_method=DELETE";
    }
    for (var i = 0, l = _urlHandlers.length; i < l; i++) {
      var handler = _urlHandlers[i];
      var returnVal = null;
      if(handler.url == null || new RegExp(handler.url.replace(/\*/g, ".*").replace(/\//g, "\\/")).test(url)) {
        if (type == "GET" && handler.get) {
          if(handler.get) {
            returnVal = handler.get(url, parseParams(data));
          }
          handleTestResponse(elt, success, returnVal)
        }
        if (type == "POST") {
          if(handler.post) {
            returnVal = handler.post(url, parseParams(data));
          }
          handleTestResponse(elt, success, returnVal)
        }
        if (type == "PUT") {
          if(handler.put) {
            //noinspection JSCheckFunctionSignatures
            returnVal = handler.put(url, parseParams(data));
          }
          handleTestResponse(elt, success, returnVal)
        }
        if (type == "DELETE") {
          if(handler.delete) {
            returnVal = handler.delete(url, parseParams(data));
          }
          handleTestResponse(elt, success, returnVal)
        }
        return;
      }
    }
    _remote.ajax({
      type: type,
      url: url,
      data: data,
      dataType: 'text',
      success: function(data, textStatus, xhr) {
        if(processHeaders(elt, xhr)){
          success(data, textStatus, elt, xhr)
        }
      },
      error: function (req, status, str) {
        log("An error occurred: " + str, _ERROR);
      }
    })
  }

  // Taken from https://gist.github.com/kares/956897
  function parseParams(str) {
    var re = /([^&=]+)=?([^&]*)/g;
    var decode = function (str) {
      return decodeURIComponent(str.replace(/\+/g, ' '));
    };
    var params = {}, e;
    if (str) {
      if (str.substr(0, 1) == '?') {
        str = str.substr(1);
      }
      while (e = re.exec(str)) {
        var k = decode(e[1]);
        var v = decode(e[2]);
        if (params[k] !== undefined) {
          if (!$.isArray(params[k])) {
            params[k] = [params[k]];
          }
          params[k].push(v);
        } else {
          params[k] = v;
        }
      }
    }
    return params;
  }

  function processInclude(str) {
    if (str.indexOf('$') == 0) {
      return eval(str).serialize();
    } else {
      if (str.indexOf(":")) {
        var name = str.split(":")[0];
        var val = str.split(":")[1];
        var result = eval(val);
        if(result) {
          return encodeURIComponent(name) + "=" + encodeURIComponent(result.toString());
        }
      }
      return "";
    }
  }

  function processIncludes(str) {
    var returnString = "";
    var strs = str.split(','); //TODO handle commas in jquery selectors
    for (var i = 0, l = strs.length; i < l; i++) {
      returnString += "&" + processInclude(strs[i]);
    }
    return returnString;
  }

  function getParametersForElement(elt) {
    var target = getTarget(elt);
    var str = "ic-request=true";

    // if the element is in a form, include the entire form
    if(elt.closest('form').length > 0) {
      str += "&" + elt.closest('form').serialize();
    } else { // otherwise include the element
      str += "&" + elt.serialize();
    }
    if (target.attr('id')) {
      str += "&ic-element-id=" + target.attr('id');
    }
    if (target.attr('name')) {
      str += "&ic-element-name=" + target.attr('name');
    }
    if (target.attr('ic-id')) {
      str += "&ic-id=" + target.attr('ic-id');
    }
    if (target.attr('ic-id')) {
      str += "&ic-id=" + target.attr('ic-id');
    }
    if (target.attr('ic-last-refresh')) {
      str += "&ic-last-refresh=" + target.attr('ic-last-refresh');
    }
    if (target.attr('ic-fingerprint')) {
      str += "&ic-fingerprint=" + target.attr('ic-fingerprint');
    }
    if (elt.attr('ic-include')) {
      str += processIncludes(elt.attr('ic-include'));
    }
    log("PARAMS: Returning parameters " + str + " for " + elt);
    return str;
  }

  //============================================================
  // Tree Processing
  //============================================================

  function maybeSetIntercoolerInfo(elt) {
    var target = getTarget(elt);
    if (!target.data('ic-id')) {
      var eltFingerPrint = fp(elt);
      var icId = uuid();
      var lastRefresh = new Date().getTime();
      target.attr('ic-id', icId);
      target.attr('ic-last-refresh', lastRefresh);
      target.attr('ic-fingerprint', eltFingerPrint);
    }
  }

  function withAttrs(attributes, func) {
    $.each(attributes, function(i, attr) {
      func(attr);
    });
  }

  function processSources(elt) {
    withAttrs(_SRC_ATTRS, function (attr) {
      if ($(elt).is("[" + attr + "]")) {
        maybeSetIntercoolerInfo($(elt));
      }
      $(elt).find("[" + attr + "]").each(function () {
        maybeSetIntercoolerInfo($(this));
      });
    });
  }

  function startPolling(elt) {
    var interval = parseInterval(elt.attr('ic-poll'));
    if(interval != null) {
      var selector = icSelectorFor(elt);
      log("POLL: Starting poll for element " + selector, _DEBUG);
      var timerId = setInterval(function () {
        var target = $(selector);
        if (target.length == 0) {
          log("POLL: Clearing poll for element " + selector, _DEBUG);
          clearTimeout(timerId);
        } else {
          updateElement(target);
        }
      }, interval);
    }
  }

  function processPolling(elt) {
    if ($(elt).is('[ic-poll]')) {
      maybeSetIntercoolerInfo($(elt));
      startPolling(elt);
    }
    $(elt).find('[ic-poll]').each(function () {
      maybeSetIntercoolerInfo($(this));
      startPolling($(this));
    });
  }

  function isDependent(src, dest) {
    return (src && dest) && (dest.indexOf(src) == 0 || src.indexOf(dest) == 0);
  }

  function refreshDependencies(dest, src) {
    withAttrs(_SRC_ATTRS, function (attr) {
      $('[' + attr + ']').each(function () {
        if (isDependent(dest, $(this).attr(attr))) {
          if(src == null || $(src)[0] != $(this)[0]) {
            updateElement($(this));
          }
        } else if (isDependent(dest, $(this).attr('ic-deps')) || $(this).attr('ic-deps') == "*") {
          if(src == null || $(src)[0] != $(this)[0]) {
            updateElement($(this));
          }
        }
      });
    });
  }

  function verbFor(attr) {
    if(attr == "ic-post-to") {
      return "POST";
    } else if(attr == "ic-put-to") {
      return "PUT";
    } else if (attr == "ic-delete-from") {
      return "DELETE";
    } else {
      return "POST";
    }
  }

  function initButtonDestination(elt, attr) {
    var destinationStr = $(elt).attr(attr);
    $(elt).click(function (event) {
      event.preventDefault();
      handleRemoteRequest(elt, verbFor(attr), destinationStr, getParametersForElement(elt),
        function (data) {
          processICResponse(data, elt);
          refreshDependencies(destinationStr);
        })
    });
  }

  function initInputDestination(elt, attr) {
    var destinationStr = $(elt).attr(attr);
    $(elt).change(function () {
      handleRemoteRequest(elt, verbFor(attr), destinationStr, getParametersForElement(elt),
        function (data) {
          processICResponse(data, elt);
          refreshDependencies(destinationStr);
        })
    });
  }

  function initDestination(elt, attr) {
    if ($(elt).is('button, a, div, span')) {
      initButtonDestination(elt, attr);
    } else if ($(elt).is('input, select')) {
      initInputDestination(elt, attr);
    }
  }

  function processDestinations(elt) {
    withAttrs(_DEST_ATTRS, function(attr){
      if ($(elt).is('[' + attr + ']')) {
        maybeSetIntercoolerInfo($(elt));
        initDestination(elt, attr);
      }
      $(elt).find('[' + attr + ']').each(function () {
        maybeSetIntercoolerInfo($(this));
        initDestination($(this), attr);
      });
    });
  }

  function processNodes(elt) {
    processSources(elt);
    processPolling(elt);
    processDestinations(elt);
  }

  function processICResponse(data, elt) {
    if (data && (data != '')) {
      log("IC RESPONSE: Received: " + data, _DEBUG);
      var newElt = $(data);
      var target = getTarget(elt);
      maybeSetIntercoolerInfo(newElt);
      if (newElt.attr('ic-fingerprint') != target.attr('ic-fingerprint')) {
        if (target.attr('ic-transition') == "none") {
          target.replaceWith(newElt);
          processNodes(newElt);
          log("IC RESPONSE: Replacing " + target.html() + " with " + newElt.html(), _DEBUG);
        } else {
          target.fadeOut('fast', function () {
            newElt.hide();
            target.replaceWith(newElt);
            log("IC RESPONSE:  Replacing " + target.html() + " with " + newElt.html(), _DEBUG);
            processNodes(newElt);
            newElt.fadeIn('slow');
          });
        }
      } else {
        newElt.remove();
      }
    }
  }

  function updateElement(element) {
    var elt = element;
    if (elt.attr('ic-src')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-src'), getParametersForElement(elt),
        function (data) {
          processICResponse(data, elt);
        });
    } else if (elt.attr('ic-text-src')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-text-src'), getParametersForElement(elt),
        function (data) {
          if(data != elt.text()) {
            elt.fadeOut('fast', function(){
              elt.text(data);
              elt.fadeIn('fast');
            })
          }
        });
    } else if (elt.attr('ic-prepend-from')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-prepend-from'), getParametersForElement(elt),
        function (data) {
          var elts = $(data);
          if (elts.is('tr')) {
            //noinspection JSCheckFunctionSignatures
            elts.children().hide();
          } else {
            elts.hide();
          }
          elt.prepend(elts);
          log("elt is ");
          log(elt);
          if (elts.is('tr')) {
            //noinspection JSCheckFunctionSignatures
            elts.children().slideDown();
          } else {
            elts.slideDown();
          }
          processNodes(elts);
          if (elt.attr('ic-limit-children')) {
            var limit = parseInt(elt.attr('ic-limit-children'));
            if (elt.children().length > limit) {
              elt.children().slice(limit, elt.children().length).remove();
            }
          }
        });
    } else if (elt.attr('ic-append-from')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-append-from'), getParametersForElement(elt),
        function (data) {
          var elts = $(data);
          elts.hide();
          elt.append(elts);
          if (elts.is('tr')) {
            //noinspection JSCheckFunctionSignatures
            elts.children().slideDown();
          } else {
            elts.slideDown();
          }
          processNodes(elts);
          if (elt.attr('ic-limit-children')) {
            var limit = parseInt(elt.attr('ic-limit-children'));
            if (elt.children().length > limit) {
              elt.children().slice(0, elt.children().length - limit).remove();
            }
          }
        });
    } else if (elt.attr('ic-style-src')) {
      var styleSrc = elt.attr('ic-style-src').split(":");
      handleRemoteRequest(element, "GET", styleSrc[1], getParametersForElement(elt),
        function (data) {
          elt.css(styleSrc[0], data);
        });
    } else if (elt.attr('ic-attr-src')) {
      var attrSrc = elt.attr('ic-attr-src').split(":");
      handleRemoteRequest(element, "GET", attrSrc[1], getParametersForElement(elt),
        function (data) {
          elt.attr(attrSrc[0], data);
        });
    }
  }

  /**
   * Process initial nodes
   */
  $(function () {
    processNodes('body');
  });

  /**
   * Public API
   */
  return {

    /* ===================================================
     * Core API
     * =================================================== */

    refresh: function (elt) {
      updateElement(elt);
      return Intercooler;
    },

    /* ===================================================
     * Mock Testing API
     * =================================================== */
    addURLHandler: function (handler) {
      if(!handler.url) {
        throw "Handlers must include a URL pattern"
      }
      _urlHandlers.push(handler);
      return Intercooler;
    },

    setRemote: function (remote) {
      _remote = remote;
      return Intercooler;
    },

    /* ===================================================
     * Logging API
     * =================================================== */
    setLogger: function (logger, level, grep) {
      _logger = logger;
      if (level) {
        _loggingLevel = level;
      }
      if (grep) {
        _loggingGrep = grep;
      }
      return Intercooler;
    },
    log: function (msg, level) {
      log(msg, level);
      return Intercooler;
    },
    /* LOGGING LEVELS */
    setLogLevel: function (level) {
      _loggingLevel = level;
      return Intercooler;
    },
    logLevels: {
      DEBUG: _DEBUG,
      INFO: _INFO,
      WARNING: _WARN,
      ERROR: _ERROR
    }
  }
})();