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

  var _SRC_ATTRS = ['ic-src', 'ic-style-src', 'ic-attr-src', 'ic-prepend-from', 'ic-append-from'];
  var _DEST_ATTRS = ['ic-get-from', 'ic-post-to', 'ic-put-to', 'ic-delete-from'];

  var _remote = $;
  var _urlHandlers = [];
  var _logger = window.console;
  var _loggingLevel = null;
  var _loggingGrep = null;
  var _scrollHandler = null;

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
    return CryptoJS.SHA1(elt).toString();
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

  function findByICId(icId) {
    return $("[ic-id='" + icId + "']");
  }

  function findById(x) {
    return $("[id='" + x + "']");
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

  function processHeaders(elt, xhr, pop) {

    elt.trigger("ic.beforeHeaders", elt, xhr);

    if (xhr.getResponseHeader("X-IC-Refresh")) {
      var pathsToRefresh = xhr.getResponseHeader("X-IC-Refresh").split(",");
      log("IC HEADER: refreshing " + pathsToRefresh, _DEBUG);
      $.each(pathsToRefresh, function (i, str) {
        refreshDependencies(str.replace(/ /g, ""), elt);
      });
    }
    if (xhr.getResponseHeader("X-IC-Script")) {
      log("IC HEADER: evaling " + xhr.getResponseHeader("X-IC-Script"), _DEBUG);
      eval(xhr.getResponseHeader("X-IC-Script"));
    }
    if (xhr.getResponseHeader("X-IC-Redirect")) {
      log("IC HEADER: redirecting to " + xhr.getResponseHeader("X-IC-Redirect"), _DEBUG);
      window.location = xhr.getResponseHeader("X-IC-Redirect");
    }
    if (xhr.getResponseHeader("X-IC-CancelPolling") == "true") {
      cancelPolling(elt);
    }
    if (xhr.getResponseHeader("X-IC-Open")) {
      log("IC HEADER: opening " + xhr.getResponseHeader("X-IC-Open"), _DEBUG);
      window.open(xhr.getResponseHeader("X-IC-Open"));
    }
    if (xhr.getResponseHeader("X-IC-SetLocation") && pop != true) {
      log("IC HEADER: pushing " + xhr.getResponseHeader("X-IC-SetLocation"), _DEBUG);
      _historySupport.pushUrl(xhr.getResponseHeader("X-IC-SetLocation"), elt);
    }
    if(xhr.getResponseHeader("X-IC-Transition")) {
      log("IC HEADER: setting transition to  " + xhr.getResponseHeader("X-IC-Transition"), _DEBUG);
      var target = getTarget(elt);
      target.data("ic-tmp-transition", xhr.getResponseHeader("X-IC-Transition"));
    }
    if (xhr.getResponseHeader("X-IC-Remove")) {
      log("IC HEADER REMOVE COMMAND");
      if (elt) {
        var target = getTarget(elt);
        log("IC REMOVING: " + target.html(), _DEBUG);
        if (isTransition(target, "none")) {
          target.remove();
        } else {
          target.fadeOut('fast', function () {
            target.remove();
          });
        }
      }
    }

    elt.trigger("ic.afterHeaders", elt, xhr);

    return true;
  }

  function handleTestResponse(elt, success, returnVal) {
    var spinner = findSpinner(elt);
    spinner.fadeIn('fast');
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
    setTimeout(function(){ spinner.fadeOut('fast'); }, 800);
  }

  function beforeRequest(elt) {
    elt.addClass('disabled');
  }

  function afterRequest(elt) {
    elt.removeClass('disabled')
  }

  function replaceOrAddMethod(data, actualMethod) {
    var regex = /(&|^)_method=[^&]*/;
    var content = "&_method=" + actualMethod;
    if(regex.test(data)) {
      return data.replace(regex, content)
    } else {
      return data + "&" + content;
    }
  }

  function handleRemoteRequest(elt, type, url, data, success) {

    data = replaceOrAddMethod(data, type);

    var pop = data.indexOf("&ic-handle-pop=true") >= 0;

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

    beforeRequest(elt);

    // Spinner support
    var spinner = findSpinner(elt);
    spinner.fadeIn('fast');

    _remote.ajax({
      type: type,
      url: url,
      data: data,
      dataType: 'text',
      beforeSend : function(){
        elt.trigger("ic.beforeSend", elt, data);
      },
      success: function (data, textStatus, xhr) {
        elt.trigger("ic.success", elt, data, textStatus, xhr);
        var target = getTarget(elt);
        target.data("ic-tmp-transition",  elt.attr('ic-transition')); // copy transition
        if (processHeaders(elt, xhr, pop)) {
          success(data, textStatus, elt, xhr);
        }
        target.data("ic-tmp-transition", null);
      },
      error: function (req, status, str) {
        elt.trigger("ic.error", elt, req, status, str);
        log("An error occurred: " + str, _ERROR);
      },
      complete : function(){
        elt.trigger("ic.complete", elt, data);
        if(spinner.length > 0) {
          spinner.fadeOut('fast', function(){
            afterRequest(elt);
          });
        } else {
          afterRequest(elt);
        }
      }
    })
  }

  function findSpinner(elt) {
    var child = null;
    if ($(elt).attr('ic-indicator')) {
      child = $($(elt).attr('ic-indicator')).first();
    } else {
      var nearestParentWithSpinner = $(elt).closest("[ic-indicator]");
      if(nearestParentWithSpinner.length > 0) {
        child = $(nearestParentWithSpinner.first().attr('ic-indicator')).first();
      } else {
        child = $(elt).find(".ic-indicator").first();
      }
    }
    return child;
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

  function processIncludes(str) {
    var returnString = "";
    $(str).each(function(){
      returnString += "&" + $(this).serialize();
    });
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
    if (elt.attr('id')) {
      str += "&ic-element-id=" + elt.attr('id');
    }
    if (elt.attr('name')) {
      str += "&ic-element-name=" + elt.attr('name');
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
    getIntercoolerId(target);
    maybeSetIntercoolerMetadata(target);
  }

  function updateIntercoolerMetaData(elt) {
    elt.attr('ic-fingerprint', fp(elt.text()));
    elt.attr('ic-last-refresh', new Date().getTime());
  }

  function maybeSetIntercoolerMetadata(elt) {
    if (!elt.attr('ic-fingerprint')) {
      updateIntercoolerMetaData(elt);
    }
  }

  function getIntercoolerId(elt) {
    if (!elt.attr('ic-id')) {
      elt.attr('ic-id', uuid());
    }
    return elt.attr('ic-id');
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
    if(elt.data('ic-poll-interval-id') == null) {
      var interval = parseInterval(elt.attr('ic-poll'));
      if(interval != null) {
        var selector = icSelectorFor(elt);
        log("POLL: Starting poll for element " + selector, _DEBUG);
        var timerId = setInterval(function () {
          var target = $(selector);
          elt.trigger("ic.onPoll", target);
          if (target.length == 0) {
            log("POLL: Clearing poll for element " + selector, _DEBUG);
            clearTimeout(timerId);
          } else {
            updateElement(target);
          }
        }, interval);
        elt.data('ic-poll-interval-id', timerId);
      }
    }
  }

  function cancelPolling(elt) {
    if(elt.data('ic-poll-interval-id') != null) {
      clearTimeout(elt.data('ic-poll-interval-id'));
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

  function verbFor(elt, attr) {
    if(elt.attr('ic-verb')) {
      return elt.attr('ic-verb').toUpperCase();
    }
    if(attr == "ic-post-to") {
      return "POST";
    } else if(attr == "ic-put-to") {
      return "PUT";
    } else if (attr == "ic-delete-from") {
      return "DELETE";
    } else if (attr == "ic-get-from") {
      return "GET";
    } else {
      return "POST";
    }
  }

  function initButtonDestination(elt, attr) {
    var destinationStr = $(elt).attr(attr);
    $(elt).click(function (event) {
      event.preventDefault();
      handleRemoteRequest(elt, verbFor(elt, attr), destinationStr, getParametersForElement(elt),
        function (data) {
          processICResponse(data, elt);
          refreshDependencies(destinationStr);
        })
    });
  }

  function initInputDestination(elt, attr) {
    var destinationStr = $(elt).attr(attr);
    $(elt).change(function () {
      handleRemoteRequest(elt, verbFor(elt, attr), destinationStr, getParametersForElement(elt),
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

  function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    var inViewport = ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
      && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));

    return inViewport;
  }

  function handleLoadOn(elt) {
    if ($(elt).attr('ic-load-on')) {
      if($(elt).attr('ic-load-on') == 'load') {
        updateElement(elt);
      } else if($(elt).attr('ic-load-on') == 'scrolled-into-view') {
        if (_scrollHandler == null) {
          _scrollHandler = function () {
            $("[ic-load-on='scrolled-into-view']").each(function () {
              if (isScrolledIntoView($(this)) && $(this).data('ic-scrolled-into-view-loaded') != true) {
                $(this).data('ic-scrolled-into-view-loaded', true);
                updateElement($(this));
              }
            })
          };
          $(window).scroll(_scrollHandler);
        }
        setTimeout(function(){$(window).trigger('scroll');}, 100); // Trigger a scroll in case element is already viewable
      } else {
        $(elt).on($(elt).attr('ic-load-on'), function(){
          updateElement(elt);
        });
      }
    }
  }

  function processLoadOn(elt) {
    handleLoadOn(elt);
    $(elt).find('[ic-load-on]').each(function () {
      handleLoadOn($(this));
    });
  }

  function processNodes(elt) {
    processSources(elt);
    processPolling(elt);
    processDestinations(elt);
    processLoadOn(elt)
  }

  function isTransition(target, transitionName) {
    return target.attr('ic-transition') == transitionName ||
      target.data('ic-tmp-transition') == transitionName;
  }

  function processICResponse(data, elt) {
    if (data && /\S/.test(data)) {
      log("IC RESPONSE: Received: " + data, _DEBUG);
      var target = getTarget(elt);
      var dummy = $("<div></div>").html(data);
      if (fp(dummy.text()) != target.attr('ic-fingerprint') || target.attr('ic-always-update') == 'true') {
        if (isTransition(target, 'none')) {
          target.html(data);
          updateIntercoolerMetaData(target);
          processNodes(target);
        } else {
          target.fadeOut('fast', function () {
            target.html(data);
            updateIntercoolerMetaData(target);
            processNodes(target);
            target.fadeIn('fast');
          });
        }
      }
      dummy.remove();
    }
  }

  function updateElement(element) {
    var elt = element;
    if (elt.attr('ic-src')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-src'), getParametersForElement(elt),
        function (data) {
          processICResponse(data, elt);
        });
    } else if (elt.attr('ic-prepend-from')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-prepend-from'), getParametersForElement(elt),
        function (data) {
          var elts = $(data);
          elts.hide();
          var target = getTarget(elt);
          log("target is ");
          log(target);
          target.prepend(elts);
          elts.fadeIn();
          processNodes(elts);
          if (target.attr('ic-limit-children')) {
            var limit = parseInt(elt.attr('ic-limit-children'));
            if (elt.children().length > limit) {
              target.children().slice(limit, target.children().length).remove();
            }
          }
        });
    } else if (elt.attr('ic-append-from')) {
      handleRemoteRequest(element, "GET", elt.attr('ic-append-from'), getParametersForElement(elt),
        function (data) {
          var elts = $(data);
          elts.hide();
          var target = getTarget(elt);
          target.append(elts);
          elts.fadeIn();
          processNodes(elts);
          if (target.attr('ic-limit-children')) {
            var limit = parseInt(elt.attr('ic-limit-children'));
            if (target.children().length > limit) {
              target.children().slice(0, target.children().length - limit).remove();
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

  //============================================================
  // History Support
  //============================================================

  var _historySupport = {

    /* vars */
    stateCache: null,
    popping: false,

    /* functions */
    getRestorationURL: function (elt) {
      if (elt.attr('ic-restore-from')) {
        return elt.attr('ic-restore-from');
      } else {
        return window.location.pathname + window.location.search + window.location.hash;
      }
    },

    onPageLoad: function () {
      _historySupport.stateCache = {"ic-setlocation": true,
        "restore-from": window.location.pathname + window.location.search + window.location.hash,
        "timestamp": new Date().getTime()
      };
      if (window.onpopstate == null || window.onpopstate['ic-on-pop-state-handler'] != true) {
        var currentOnPopState = window.onpopstate;
        window.onpopstate = function(event) {
          if(!_historySupport.handlePop(event)){
            if(currentOnPopState) {
              currentOnPopState(event);
            }
          }
        };
        window.onpopstate['ic-on-pop-state-handler'] = true;
      }
    },

    pushUrl: function (url, elt) {
      log("IC HISTORY: pushing location " + url, _DEBUG);
      var target = getTarget(elt);
      var id = target.attr('id');
      if(id == null) {
        log("To support history for a given element, you must have a valid id attribute on the element", _ERROR);
        return;
      }
      _historySupport.initHistory(elt);
      var data = {
        "ic-setlocation": true,
        "id-to-restore": id.toString(),
        "restore-from": url,
        "timestamp": new Date().getTime()
      };
      elt.trigger("ic.pushUrl", target, data);
      window.history.pushState(data, "", url);
    },

    initHistory: function (elt) {
      if(_historySupport.stateCache) {
        var target = getTarget(elt);
        var id = target.attr('id');
        _historySupport.stateCache["id-to-restore"] = id.toString();
        window.history.replaceState(_historySupport.stateCache);
        _historySupport.stateCache = null;
      }
    },

    handlePop: function (event) {
      var data = event.state;
      if (data && data['ic-setlocation']) {
        var elt = findById(data["id-to-restore"]);
        var params = getParametersForElement(elt);
        params += "&ic-handle-pop=true"
        handleRemoteRequest(elt, "GET", data["restore-from"], params,
          function (data) {
            elt.trigger("ic.handlePop", elt, data);
            processICResponse(data, elt);
          });
        return true;
      }
      return false;
    }
  };

  /**
   * Process initial nodes
   */
  $(function () {
    processNodes('body');
    _historySupport.onPageLoad();
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
      if (!handler.url) {
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