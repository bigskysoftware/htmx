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

  var _MACROS = ['ic-get-from', 'ic-post-to', 'ic-put-to', 'ic-delete-from',
                 'ic-style-src', 'ic-attr-src', 'ic-prepend-from', 'ic-append-from'];

  var _remote = $;
  var _scrollHandler = null;

  var _UUID = 1;

  //============================================================
  // Base Transition Definitions
  //============================================================
  var _transitions = {};
  var _defaultTransition = 'fadeFast';
  function _defineTransition(name, def) {
    if(def.newContent == null) {
      //noinspection JSUnusedLocalSymbols
      def.newContent = function(parent, newContent, isReverse, after) {
        parent.html(newContent);
        after();
      }
    }
    if(def.remove == null) {
      def.remove = function(elt) {
        elt.remove();
      }
    }
    if(def.show == null){
      def.show = function(elt) {
        elt.show();
      }
    }
    if(def.hide == null){
      def.hide = function(elt) {
        elt.hide();
      }
    }
    _transitions[name] = def;
  }
  _defineTransition('none', {});
  _defineTransition('fadeFast', {
    newContent : function(parent, newContent, isReverse, after){
      parent.fadeOut('fast', function(){
        parent.html(newContent);
        after();
        parent.fadeIn('fast');
      })
    },
    remove : function(elt) {
      elt.fadeOut('fast', function(){ elt.remove(); })
    },
    show : function(elt) {
      elt.fadeIn('fast');
    },
    hide : function(elt) {
      elt.fadeOut('fast');
    }
  });
  _defineTransition('prepend', {
    newContent : function(parent, newContent, isReverse, after){
      var children = $(newContent);
      children.hide();
      parent.prepend(children);
      after();
      children.fadeIn();
      if (parent.attr('ic-limit-children')) {
        var limit = parseInt(parent.attr('ic-limit-children'));
        if (parent.children().length > limit) {
          parent.children().slice(limit, parent.children().length).remove();
        }
      }
    }
  });
  _defineTransition('append', {
    newContent : function(parent, newContent, isReverse, after){
      var children = $(newContent);
      children.hide();
      parent.append(children);
      after();
      children.fadeIn();
      if (parent.attr('ic-limit-children')) {
        var limit = parseInt(parent.attr('ic-limit-children'));
        if (parent.children().length > limit) {
          parent.children().slice(0, parent.children().length - limit).remove();
        }
      }
    }
  });

  //============================================================
  // Utility Methods
  //============================================================

  function fingerprint(elt) {
    if(elt == null || elt == undefined) {
      return 0;
    }
    var str = elt.toString();
    var fp = 0, i, chr, len;
    if (str.length == 0) return fp;
    for (i = 0, len = str.length; i < len; i++) {
      chr = str.charCodeAt(i);
      fp = ((fp << 5) - fp) + chr;
      fp |= 0; // Convert to 32bit integer
    }
    return fp;
  }

  function log(elt, msg, level) {
    if(elt == null) {
      elt = $('body');
    }
    elt.trigger("log.ic", msg, level, elt);
  }

  function uuid() {
    return _UUID++;
  }

  function icSelectorFor(elt) {
    return "[ic-id='" + getIntercoolerId(elt) + "']";
  }

  function findById(x) {
    return $("#" + x);
  }

  function parseInterval(str) {
    log(null, "POLL: Parsing interval string " + str, 'DEBUG');
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

  function initScrollHandler() {
    if (_scrollHandler == null) {
      _scrollHandler = function () {
        $("[ic-trigger-on='scrolled-into-view']").each(function () {
          if (isScrolledIntoView($(this)) && $(this).data('ic-scrolled-into-view-loaded') != true) {
            $(this).data('ic-scrolled-into-view-loaded', true);
            fireICRequest($(this));
          }
        })
      };
      $(window).scroll(_scrollHandler);
    }
  }

  //============================================================
  // Request/Parameter/Include Processing
  //============================================================
  function getTarget(elt) {
    if(elt.attr('ic-target') && elt.attr('ic-target').indexOf('this.') != 0) {
      return $(elt.attr('ic-target'));
    } else {
      return elt;
    }
  }

  function processHeaders(elt, xhr, pop) {

    elt.trigger("beforeHeaders.ic", elt, xhr);
    var target = null;
    if (xhr.getResponseHeader("X-IC-Refresh")) {
      var pathsToRefresh = xhr.getResponseHeader("X-IC-Refresh").split(",");
      log(elt, "IC HEADER: refreshing " + pathsToRefresh, "DEBUG");
      $.each(pathsToRefresh, function (i, str) {
        refreshDependencies(str.replace(/ /g, ""), elt);
      });
    }
    if (xhr.getResponseHeader("X-IC-Script")) {
      log(elt, "IC HEADER: evaling " + xhr.getResponseHeader("X-IC-Script"), "DEBUG");
      eval(xhr.getResponseHeader("X-IC-Script"));
    }
    if (xhr.getResponseHeader("X-IC-Redirect")) {
      log(elt, "IC HEADER: redirecting to " + xhr.getResponseHeader("X-IC-Redirect"), "DEBUG");
      window.location = xhr.getResponseHeader("X-IC-Redirect");
    }
    if (xhr.getResponseHeader("X-IC-CancelPolling") == "true") {
      cancelPolling(elt);
    }
    if (xhr.getResponseHeader("X-IC-Open")) {
      log(elt, "IC HEADER: opening " + xhr.getResponseHeader("X-IC-Open"), "DEBUG");
      window.open(xhr.getResponseHeader("X-IC-Open"));
    }
    if (xhr.getResponseHeader("X-IC-SetLocation") && pop != true) {
      log(elt, "IC HEADER: pushing " + xhr.getResponseHeader("X-IC-SetLocation"), "DEBUG");
      _historySupport.pushUrl(xhr.getResponseHeader("X-IC-SetLocation"), elt);
    }
    if(xhr.getResponseHeader("X-IC-Transition")) {
      log(elt, "IC HEADER: setting transition to  " + xhr.getResponseHeader("X-IC-Transition"), "DEBUG");
      target = getTarget(elt);
      target.data("ic-tmp-transition", xhr.getResponseHeader("X-IC-Transition"));
    }
    if(xhr.getResponseHeader("X-IC-Trigger")) {
      log(elt, "IC HEADER: found trigger " + xhr.getResponseHeader("X-IC-Trigger"), "DEBUG");
      target = getTarget(elt);
      var triggerArgs = [];
      if(xhr.getResponseHeader("X-IC-Trigger-Data")){
        triggerArgs = $.parseJSON(xhr.getResponseHeader("X-IC-Trigger-Data"))
      }
      target.trigger(xhr.getResponseHeader("X-IC-Trigger"), triggerArgs);
    }
    if (xhr.getResponseHeader("X-IC-Remove")) {
      if (elt) {
        target = getTarget(elt);
        log(elt, "IC REMOVE", "DEBUG");
        var transition = getTransition(elt, target);
        transition.remove(target);
      }
    }

    elt.trigger("afterHeaders.ic", elt, xhr);

    return true;
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

  function globalEval(script) {
    return window[ "eval" ].call(window, script);
  }

  function handleRemoteRequest(elt, type, url, data, success) {

    if($(elt).attr('ic-confirm')) {
      if(!confirm($(elt).attr('ic-confirm'))) {
        return;
      }
    }

    data = replaceOrAddMethod(data, type);

    var pop = data.indexOf("&ic-handle-pop=true") >= 0;

    beforeRequest(elt);

    // Spinner support
    var indicator = findIndicator(elt);
    var indicatorTransition = getTransition(indicator, indicator);
    if(indicator.length > 0) {
      indicatorTransition.show(indicator);
    }

    _remote.ajax({
      type: type,
      url: url,
      data: data,
      dataType: 'text',
      headers: {
        "Accept": "text/html-partial, */*; q=0.9",
        "X-IC-Request": true,
        "X-HTTP-Method-Override": type
      },
      beforeSend : function(xhr, settings){
        elt.trigger("beforeSend.ic", elt, data, settings, xhr);
        var onBeforeSend = $(elt).closest('[ic-on-beforeSend]').attr('ic-on-beforeSend');
        if(onBeforeSend) {
          globalEval('(function (data, settings, xhr) {' + onBeforeSend + '})')(data, settings, xhr);
        }
      },
      success: function (data, textStatus, xhr) {
        elt.trigger("success.ic", elt, data, textStatus, xhr);
        var onSuccess = $(elt).closest('[ic-on-success]').attr('ic-on-success');
        if(onSuccess) {
          if(globalEval('(function (data, textStatus, xhr) {' + onSuccess + '})')(data, textStatus, xhr) == false) {
            return;
          }
        }

        var target = getTarget(elt);
        target.data("ic-tmp-transition",  elt.attr('ic-transition')); // copy transition
        if (processHeaders(elt, xhr, pop)) {
          success(data, textStatus, elt, xhr);
        }

        target.data("ic-tmp-transition", null);
      },
      error: function (xhr, status, str) {
        elt.trigger("error.ic", elt, status, str, xhr);
        var onError = $(elt).closest('[ic-on-error]').attr('ic-on-error');
        if(onError) {
          globalEval('(function (status, str, xhr) {' + onError + '})')(status, str, xhr);
        }
        log(elt, "An error occurred: " + str, "ERROR");
      },
      complete : function(xhr, status){
        elt.trigger("complete.ic", elt, data, status, xhr);
        var onComplete = $(elt).closest('[ic-on-complete]').attr('ic-on-complete');
        if(onComplete) {
          globalEval('(function (xhr, status) {' + onComplete + '})')(xhr, status);
        }
        if (indicator.length > 0) {
          indicatorTransition.hide(indicator);
        }
        afterRequest(elt);
      }
    })
  }

  function findIndicator(elt) {
    var child = null;
    if ($(elt).attr('ic-indicator')) {
      child = $($(elt).attr('ic-indicator')).first();
    } else {
      child = $(elt).find(".ic-indicator").first();
      if (child.length == 0) {
        var parent = $(elt).closest("[ic-indicator]");
        if (parent.length > 0) {
          child = $(parent.first().attr('ic-indicator')).first();
        }
      }
    }
    return child;
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
    log(elt, "PARAMS: Returning parameters " + str + " for " + elt, "DEBUG");
    return str;
  }

  function maybeSetIntercoolerInfo(elt) {
    var target = getTarget(elt);
    log(elt, 'Setting IC info', 'DEBUG');
    getIntercoolerId(target);
    maybeSetIntercoolerMetadata(target);
  }

  function updateIntercoolerMetaData(elt) {
    elt.attr('ic-fingerprint', fingerprint(elt.html()));
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

  //============================================================
  // Tree Processing
  //============================================================

  function processNodes(elt) {
    processMacros(elt);
    processSources(elt);
    processPolling(elt);
    processTriggerOn(elt)
  }

  function processSources(elt) {
    if ($(elt).is("[ic-src]")) {
      maybeSetIntercoolerInfo($(elt));
    }
    $(elt).find("[ic-src]").each(function () {
      maybeSetIntercoolerInfo($(this));
    });
  }

  //============================================================
  // Polling support
  //============================================================

  function startPolling(elt) {
    if(elt.data('ic-poll-interval-id') == null) {
      var interval = parseInterval(elt.attr('ic-poll'));
      if(interval != null) {
        var selector = icSelectorFor(elt);
        var repeats =  parseInt(elt.attr('ic-poll-repeats')) || -1;
        var currentIteration = 0;
        log(elt, "POLL: Starting poll for element " + selector, "DEBUG");
        var timerId = setInterval(function () {
          var target = $(selector);
          elt.trigger("onPoll.ic", target);
          if ((target.length == 0) || (currentIteration == repeats)) {
            log(elt, "POLL: Clearing poll for element " + selector, "DEBUG");
            clearTimeout(timerId);
          } else {
            fireICRequest(target);
          }
          currentIteration++;
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

  //============================================================----
  // Dependency support
  //============================================================----

  function refreshDependencies(dest, src) {
    log(src, "Refreshing Dependencies for " + dest, "DEBUG");
    $('[ic-src]').each(function () {
      var fired = false;
      if(verbFor($(this)) == "GET" && $(this).attr('ic-deps') != 'ignore') {
        if (isDependent(dest, $(this).attr('ic-src'))) {
          if (src == null || $(src)[0] != $(this)[0]) {
            fireICRequest($(this));
            fired = true;
          }
        } else if (isDependent(dest, $(this).attr('ic-deps')) || $(this).attr('ic-deps') == "*") {
          if (src == null || $(src)[0] != $(this)[0]) {
            fireICRequest($(this));
            fired = true;
          }
        }
      }
      if(!fired) {
        log($(this), "Does not depend on " + dest, "DEBUG")
      }
    });
  }

  function isDependent(src, dest) {
    return (src && dest) && (dest.indexOf(src) == 0 || src.indexOf(dest) == 0);
  }

  //============================================================----
  // Trigger-On support
  //============================================================----

  function verbFor(elt) {
    if (elt.attr('ic-verb')) {
      return elt.attr('ic-verb').toUpperCase();
    }
    return "GET";
  }

  function eventFor(attr, elt) {
    if(attr == "default") {
      if($(elt).is('button')) {
        return 'click';
      } else if($(elt).is('form')) {
        return 'submit';
      } else if($(elt).is(':input')) {
        return 'change';
      } else {
        return 'click';
      }
    } else {
      return attr;
    }
  }

  function preventDefault(elt) {
    return elt.is('form') || (elt.is(':submit') && elt.closest('form').length == 1);
  }

  function handleTriggerOn(elt) {

    if ($(elt).attr('ic-trigger-on')) {
      if ($(elt).attr('ic-trigger-on') == 'load') {
        fireICRequest(elt);
      } else if ($(elt).attr('ic-trigger-on') == 'scrolled-into-view') {
        initScrollHandler();
        setTimeout(function () { $(window).trigger('scroll'); }, 100); // Trigger a scroll in case element is already viewable
      } else {
        $(elt).on(eventFor($(elt).attr('ic-trigger-on'), $(elt)), function (e) {
          fireICRequest($(elt));
          if(preventDefault(elt)){
            e.preventDefault();
            return false;
          }
          return true;
        });
      }
    }
  }

  function processTriggerOn(elt) {
    handleTriggerOn(elt);
    $(elt).find('[ic-trigger-on]').each(function () {
      handleTriggerOn($(this));
    });
  }

  //============================================================----
  // Macro support
  //============================================================----

  function processMacros(elt) {
    $.each(_MACROS, function (i, macro) {
      if ($(elt).is('[' + macro + ']')) {
        processMacro(macro, $(elt));
      }
      $(elt).find('[' + macro + ']').each(function () {
        processMacro(macro, $(this));
      });
    });
  }

  function processMacro(macro, elt) {
    // action attributes
    if(macro == 'ic-post-to') {
      setIfAbsent(elt, 'ic-src', elt.attr('ic-post-to'));
      setIfAbsent(elt, 'ic-verb', 'POST');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if(macro == 'ic-put-to') {
      setIfAbsent(elt, 'ic-src', elt.attr('ic-put-to'));
      setIfAbsent(elt, 'ic-verb', 'PUT');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if(macro == 'ic-get-from') {
      setIfAbsent(elt, 'ic-src', elt.attr('ic-get-from'));
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if(macro == 'ic-delete-from') {
      setIfAbsent(elt, 'ic-src', elt.attr('ic-delete-from'));
      setIfAbsent(elt, 'ic-verb', 'DELETE');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    // non-action attributes
    var value = null;
    var url = null;
    if(macro == 'ic-style-src') {
      value = elt.attr('ic-style-src').split(":");
      var styleAttribute = value[0];
      url = value[1];
      setIfAbsent(elt, 'ic-src', url);
      setIfAbsent(elt, 'ic-target', 'this.style.' + styleAttribute);
    }
    if(macro == 'ic-attr-src') {
      value = elt.attr('ic-attr-src').split(":");
      var attribute = value[0];
      url = value[1];
      setIfAbsent(elt, 'ic-src', url);
      setIfAbsent(elt, 'ic-target', 'this.' + attribute);
    }
    if(macro == 'ic-prepend-from') {
      setIfAbsent(elt, 'ic-src', elt.attr('ic-prepend-from'));
      setIfAbsent(elt, 'ic-transition', 'prepend');
    }
    if(macro == 'ic-append-from') {
      setIfAbsent(elt, 'ic-src', elt.attr('ic-append-from'));
      setIfAbsent(elt, 'ic-transition', 'append');
    }
  }

  function setIfAbsent(elt, attr, value) {
    if(elt.attr(attr) == null) {
      elt.attr(attr, value);
    }
  }

  //============================================================----
  // Utilities
  //============================================================----

  function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
      && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  }

  function getTransition(elt, target) {
    var transition = null;
    if(elt.attr('ic-transition')) {
      transition = _transitions[elt.attr('ic-transition')]
    }
    if(target.attr('ic-transition')) {
      transition = _transitions[target.attr('ic-transition')]
    }
    if(target.data('ic-tmp-transition')) {
      transition = _transitions[target.data('ic-tmp-transition')]
    }
    if(transition == null) {
      transition = _transitions[_defaultTransition];
    }
    if(transition == null) {
      transition = _transitions['none'];
    }
    return transition;
  }

  function processICResponse(newContent, elt) {
    if (newContent && /\S/.test(newContent)) {
      log(elt, "IC RESPONSE: Received: " + newContent, "DEBUG");
      var target = getTarget(elt);

      // always update if the user tells us to or if there is a script (to reevaluate the script)
      var updateContent = target.attr('ic-always-update') == 'true' || newContent.indexOf("<script>") >= 0;
      if(updateContent == false) {
        var dummy = document.createElement('div');
        dummy.innerHTML = newContent;
        processMacros(dummy);
        updateContent = fingerprint($(dummy).html()) != target.attr('ic-fingerprint');
        if(dummy.remove) { //mobile fix
          dummy.remove();
        }
      }

      if (updateContent) {
        var transition = getTransition(elt, target);
        transition.newContent(target, newContent, false, function () {
          $(target).children().each(function() {
            processNodes($(this));
          });
          updateIntercoolerMetaData(target);
        });
      }
    }
  }

  function getStyleTarget(elt) {
    if(elt.attr('ic-target') && elt.attr('ic-target').indexOf("this.style.") == 0) {
      return elt.attr('ic-target').substr(11)
    } else {
      return null;
    }
  }

  function getAttrTarget(elt) {
    if(elt.attr('ic-target') && elt.attr('ic-target').indexOf("this.") == 0) {
      return elt.attr('ic-target').substr(5)
    } else {
      return null;
    }
  }

  function fireICRequest(elt) {
    var styleTarget = getStyleTarget(elt);
    var attrTarget = styleTarget ? null : getAttrTarget(elt);
    if (elt.attr('ic-src')) {
      var verb = verbFor(elt);
      handleRemoteRequest(elt, verb, elt.attr('ic-src'), getParametersForElement(elt),
        function (data) {
          if (styleTarget) {
            elt.css(styleTarget, data);
          } else if (attrTarget) {
            elt.attr(attrTarget, data);
          } else {
            processICResponse(data, elt);
            if(verb != 'GET') {
              refreshDependencies(elt.attr('ic-src'), elt);
            }
          }
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
      log(elt, "IC HISTORY: pushing location " + url, "DEBUG");
      var target = getTarget(elt);
      var id = target.attr('id');
      if(id == null) {
        log(elt, "To support history for a given element, you must have a valid id attribute on the element", "ERROR");
        return;
      }
      _historySupport.initHistory(elt);
      var data = {
        "ic-setlocation": true,
        "id-to-restore": id.toString(),
        "restore-from": url,
        "timestamp": new Date().getTime()
      };
      elt.trigger("pushUrl.ic", target, data);
      window.history.pushState(data, "", url);
    },

    initHistory: function (elt) {
      if(_historySupport.stateCache) {
        var target = getTarget(elt);
        var id = target.attr('id');
        _historySupport.stateCache["id-to-restore"] = id.toString();
        window.history.replaceState(_historySupport.stateCache, "", _historySupport.stateCache['restore-from']);
        _historySupport.stateCache = null;
      }
    },

    handlePop: function (event) {
      var data = event.state;
      if (data && data['ic-setlocation']) {
        var elt = findById(data["id-to-restore"]);
        var params = getParametersForElement(elt);
        params += "&ic-handle-pop=true";
        handleRemoteRequest(elt, "GET", data["restore-from"], params,
          function (data) {
            elt.trigger("handlePop.ic", elt, data);
            processICResponse(data, elt);
          });
        return true;
      }
      return false;
    }
  };

  //============================================================
  // Bootstrap
  //============================================================

  $(function () {
    processNodes('body');
    _historySupport.onPageLoad();
  });

  return {

    /* ===================================================
     * Core API
     * =================================================== */
    refresh: function (val) {
      if (typeof val == 'string' || val instanceof String) {
        refreshDependencies(val);
      } else {
        fireICRequest(val);
      }
      return Intercooler;
    },
    
    processNodes: function(elt) {
      return processNodes(elt);
    },

    defaultTransition: function (name) {
      _defaultTransition = name;
    },

    defineTransition: function (name, def) {
      _defineTransition(name, def);
    },

    /* ===================================================
     * Mock Testing API
     * =================================================== */
    addURLHandler: function () {
      throw "This method is no longer supported.  Please use the jQuery mockjax plugin instead: https://github.com/jakerella/jquery-mockjax";
    },

    setRemote: function (remote) {
      _remote = remote;
      return Intercooler;
    }
  }
})();
