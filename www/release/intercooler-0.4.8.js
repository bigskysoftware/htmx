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
      def.newContent = function(parent, newContent, isReverse, replaceParent, after) {
        if(replaceParent) {
          after($(newContent).replaceAll(parent));
        } else {
          parent.html(newContent);
          after();
        }
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
    newContent : function(parent, newContent, isReverse, replaceParent, after){
      if(replaceParent) {
        parent.fadeOut('fast', function () {
          var newContentElts = $(newContent).hide();
          after(newContentElts.replaceAll(parent));
          newContentElts.fadeIn('fast');
        });
      } else {
        var fadeTarget = (parent.children().length == parent.contents().length & parent.contents().length > 0) ? parent.children() : parent;
        fadeTarget.fadeOut('fast', function () {
          parent.html(newContent);
          fadeTarget.hide();
          after();
          fadeTarget.fadeIn('fast');
        });
      }
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
    newContent : function(parent, newContent, isReverse, replaceParent, after){
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
    newContent : function(parent, newContent, isReverse, replaceParent, after){
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
    elt.trigger("log.ic", [msg, level, elt]);
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

  function currentUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  //============================================================
  // Request/Parameter/Include Processing
  //============================================================
  function getTarget(elt) {
    var targetValue = closestAttrValue(elt, 'ic-target');
    if(targetValue && targetValue.indexOf('this.') != 0) {
      if(targetValue.indexOf('closest ') == 0) {
        return elt.closest(targetValue.substr(8));
      } else {
        return $(targetValue);
      }
    } else {
      return elt;
    }
  }

  function handleHistory(elt, xhr, originalHtml) {
    if (xhr.getResponseHeader("X-IC-PushURL")) {
      log(elt, "X-IC-PushURL: pushing " + xhr.getResponseHeader("X-IC-PushURL"), "DEBUG");
      _historySupport.pushUrl(xhr.getResponseHeader("X-IC-SetLocation"), elt, originalHtml);
    } else {
      if(closestAttrValue(elt, 'ic-push-url') == "true") {
        _historySupport.pushUrl(elt.attr('ic-src'), elt, originalHtml);
      }
    }
  }

  function processHeaders(elt, xhr) {

    elt.trigger("beforeHeaders.ic", elt, xhr);
    log(elt, "response headers: " + xhr.getAllResponseHeaders(), "DEBUG");
    var target = null;
    if (xhr.getResponseHeader("X-IC-Refresh")) {
      var pathsToRefresh = xhr.getResponseHeader("X-IC-Refresh").split(",");
      log(elt, "X-IC-Refresh: refreshing " + pathsToRefresh, "DEBUG");
      $.each(pathsToRefresh, function (i, str) {
        refreshDependencies(str.replace(/ /g, ""), elt);
      });
    }
    if (xhr.getResponseHeader("X-IC-Script")) {
      log(elt, "X-IC-Script: evaling " + xhr.getResponseHeader("X-IC-Script"), "DEBUG");
      eval(xhr.getResponseHeader("X-IC-Script"));
    }
    if (xhr.getResponseHeader("X-IC-Redirect")) {
      log(elt, "X-IC-Redirect: redirecting to " + xhr.getResponseHeader("X-IC-Redirect"), "DEBUG");
      window.location = xhr.getResponseHeader("X-IC-Redirect");
    }
    if (xhr.getResponseHeader("X-IC-CancelPolling") == "true") {
      cancelPolling(elt);
    }
    if (xhr.getResponseHeader("X-IC-Open")) {
      log(elt, "X-IC-Open: opening " + xhr.getResponseHeader("X-IC-Open"), "DEBUG");
      window.open(xhr.getResponseHeader("X-IC-Open"));
    }
    if(xhr.getResponseHeader("X-IC-Transition")) {
      log(elt, "X-IC-Transition: setting transition to  " + xhr.getResponseHeader("X-IC-Transition"), "DEBUG");
      target = getTarget(elt);
      target.data("ic-tmp-transition", xhr.getResponseHeader("X-IC-Transition"));
    }
    if(xhr.getResponseHeader("X-IC-Trigger")) {
      log(elt, "X-IC-Trigger: found trigger " + xhr.getResponseHeader("X-IC-Trigger"), "DEBUG");
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
        log(elt, "X-IC-REMOVE header found.", "DEBUG");
        var transition = getTransition(elt, target);
        transition.remove(target);
      }
    }

    elt.trigger("afterHeaders.ic", elt, xhr);

    return true;
  }


  function beforeRequest(elt) {
    elt.addClass('disabled');
    elt.data('ic-request-in-flight', true);
  }

  function afterRequest(elt) {
    elt.removeClass('disabled');
    elt.data('ic-request-in-flight', false);
    if(elt.data('ic-next-request')) {
      elt.data('ic-next-request')();
      elt.data('ic-next-request', null);
    }
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

  function closestAttrValue(elt, attr) {
    var closestElt = $(elt).closest('[' + attr + ']');
    if(closestElt) {
      return closestElt.attr(attr);
    } else {
      return null;
    }
  }

  function handleRemoteRequest(elt, type, url, data, success) {

    beforeRequest(elt);

    data = replaceOrAddMethod(data, type);

    // Spinner support
    var indicator = findIndicator(elt);
    var indicatorTransition = getTransition(indicator, indicator);
    if(indicator.length > 0) {
      indicatorTransition.show(indicator);
    }

    var requestId = uuid();
    var requestStart = new Date();

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
        log(elt, "before AJAX request " + requestId + ": " + type + " to " + url, "DEBUG");
        var onBeforeSend = closestAttrValue(elt, 'ic-on-beforeSend');
        if(onBeforeSend) {
          globalEval('(function (data, settings, xhr) {' + onBeforeSend + '})')(data, settings, xhr);
        }
      },
      success: function (data, textStatus, xhr) {
        elt.trigger("success.ic", elt, data, textStatus, xhr);
        log(elt, "AJAX request " + requestId + " was successful.", "DEBUG");
        var onSuccess = closestAttrValue(elt, 'ic-on-success');
        if(onSuccess) {
          if(globalEval('(function (data, textStatus, xhr) {' + onSuccess + '})')(data, textStatus, xhr) == false) {
            return;
          }
        }

        var target = getTarget(elt);
        target.data("ic-tmp-transition",  closestAttrValue(elt, 'ic-transition')); // copy transition
        var beforeHeaders = new Date();
        if (processHeaders(elt, xhr)) {
          log(elt, "Processed headers for request " + requestId + " in " + (new Date() - beforeHeaders) + "ms", "DEBUG");
          var beforeSuccess = new Date();
          var originalHtml = target.html();
          success(data, textStatus, elt, xhr);
          handleHistory(elt, xhr, originalHtml);
          log(elt, "Process content for request " + requestId + " in " + (new Date() - beforeSuccess) + "ms", "DEBUG");
        }

        elt.trigger("after.success.ic", elt, data, textStatus, xhr);
        target.data("ic-tmp-transition", null);
      },
      error: function (xhr, status, str) {
        elt.trigger("error.ic", elt, status, str, xhr);
        var onError = closestAttrValue(elt, 'ic-on-error');
        if(onError) {
          globalEval('(function (status, str, xhr) {' + onError + '})')(status, str, xhr);
        }
        log(elt, "AJAX request " + requestId + " experienced an error: " + str, "ERROR");
      },
      complete : function(xhr, status){
        log(elt, "AJAX request " + requestId + " completed in " + (new Date() - requestStart) + "ms", "DEBUG");
        afterRequest(elt);
        elt.trigger("complete.ic", elt, data, status, xhr);
        var onComplete = closestAttrValue(elt, 'ic-on-complete');
        if(onComplete) {
          globalEval('(function (xhr, status) {' + onComplete + '})')(xhr, status);
        }
        if (indicator.length > 0) {
          indicatorTransition.hide(indicator);
        }
      }
    })
  }

  function findIndicator(elt) {
    var indicator = null;
    if ($(elt).attr('ic-indicator')) {
      indicator = $($(elt).attr('ic-indicator')).first();
    } else {
      indicator = $(elt).find(".ic-indicator").first();
      if (indicator.length == 0) {
        var parent = closestAttrValue(elt, 'ic-indicator');
        if (parent) {
          indicator = $(parent).first();
        }
      }
    }
    return indicator;
  }

  function processIncludes(str) {
    var returnString = "";
    $(str).each(function(){
      returnString += "&" + $(this).serialize();
    });
    return returnString;
  }

  function getParametersForElement(elt, triggerOrigin) {
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
    if (triggerOrigin && triggerOrigin.attr('id')) {
      str += "&ic-trigger-id=" + triggerOrigin.attr('id');
    }
    if (triggerOrigin && triggerOrigin.attr('name')) {
      str += "&ic-trigger-name=" + triggerOrigin.attr('name');
    }
    if (target.attr('ic-last-refresh')) {
      str += "&ic-last-refresh=" + target.attr('ic-last-refresh');
    }
    if (target.attr('ic-fingerprint')) {
      str += "&ic-fingerprint=" + target.attr('ic-fingerprint');
    }
    var includeAttr = closestAttrValue(elt, 'ic-include');
    if (includeAttr) {
      str += processIncludes(includeAttr);
    }
    str += "&ic-current-url=" + encodeURIComponent(currentUrl());
    log(elt, "request parameters " + str, "DEBUG");
    return str;
  }

  function maybeSetIntercoolerInfo(elt) {
    var target = getTarget(elt);
    getIntercoolerId(target);
    maybeSetIntercoolerMetadata(target);
    if(elt.data('elementAdded.ic') != true){
      elt.data('elementAdded.ic', true);
      elt.trigger("elementAdded.ic");
    }
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
    processTriggerOn(elt);
    $(elt).trigger('nodesProcessed.ic');
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
    log(src, "refreshing dependencies for path " + dest, "DEBUG");
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
      if(fired) {
        log($(this), "depends on path " + dest + ", refreshing...", "DEBUG")
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
        var triggerOn = $(elt).attr('ic-trigger-on').split(" ");
        $(elt).on(eventFor(triggerOn[0], $(elt)), function (e) {
          if(triggerOn[1] == 'changed') {
            var currentVal = $(elt).val();
            var previousVal = $(elt).data('ic-previous-val');
            $(elt).data('ic-previous-val', currentVal);
            if( currentVal != previousVal ) {
              fireICRequest($(elt));
            }
          } else {
            fireICRequest($(elt));
          }
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
      log(elt, "response content: \n" + newContent, "DEBUG");
      var target = getTarget(elt);

      // always update if the user tells us to or if there is a script (to reevaluate the script)
      var updateContent = closestAttrValue(elt, 'ic-always-update') == 'true' || newContent.indexOf("<script>") >= 0;
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
        var isReplaceParent = closestAttrValue(elt, 'ic-replace-target') == "true";
        transition.newContent(target, newContent, false, isReplaceParent, function (replacement) {
          if(replacement) {
            processNodes(replacement);
            updateIntercoolerMetaData(target);
          } else {
            $(target).children().each(function() {
              processNodes($(this));
            });
            updateIntercoolerMetaData(target);
          }
          updateIntercoolerMetaData(target);
        });
      }
    }
  }

  function getStyleTarget(elt) {
    var val = closestAttrValue(elt, 'ic-target');
    if(val && val.indexOf("this.style.") == 0) {
      return val.substr(11)
    } else {
      return null;
    }
  }

  function getAttrTarget(elt) {
    var val = closestAttrValue(elt, 'ic-target');
    if(val && val.indexOf("this.") == 0) {
      return val.substr(5)
    } else {
      return null;
    }
  }

  function fireICRequest(elt) {

    var triggerOrigin = elt;
    if(!elt.is('[ic-src]')) {
      elt = elt.closest('[ic-src]');
    }

    var confirmText = closestAttrValue(elt, 'ic-confirm');
    if(confirmText) {
      if(!confirm(confirmText)) {
        return;
      }
    }

    if(elt.length > 0) {
      var icEventId = uuid();
      elt.data('ic-event-id', icEventId);
      var invokeRequest = function () {

        // if an existing request is in flight for this element, push this request as the next to be executed
        if(elt.data('ic-request-in-flight') == true) {
          elt.data('ic-next-request', invokeRequest);
          return;
        }

        if (elt.data('ic-event-id') == icEventId) {
          var styleTarget = getStyleTarget(elt);
          var attrTarget = styleTarget ? null : getAttrTarget(elt);
          var verb = verbFor(elt);
          handleRemoteRequest(elt, verb, elt.attr('ic-src'), getParametersForElement(elt, triggerOrigin),
            function (data) {
              if (styleTarget) {
                elt.css(styleTarget, data);
              } else if (attrTarget) {
                elt.attr(attrTarget, data);
              } else {
                processICResponse(data, elt);
                if (verb != 'GET') {
                  refreshDependencies(elt.attr('ic-src'), elt);
                }
              }
            });
        }
      };

      var triggerDelay = closestAttrValue(elt, 'ic-trigger-delay');
      if (triggerDelay) {
        setTimeout(invokeRequest, parseInterval(triggerDelay));
      } else {
        invokeRequest();
      }
    }
  }

  //============================================================
  // History Support
  //============================================================

  var _historySupport = {

    currentRestorationId : null,

    /* functions */
    genId: function() {
      return "ic-hist-elt-" + Math.random().toString();
    },

    newRestorationData : function(id, html){
      var histSupport = JSON.parse(localStorage.getItem('ic-history-support'));
      if (histSupport == null) {
        histSupport = {};
      }
      var restorationData = {
        "id": _historySupport.genId(),
        "elementId": id,
        "content": html,
        "timestamp": new Date().getTime(),
        "previous": histSupport.last
      };
      // if there is no first, store this new element as first
      if (histSupport.first == null) {
        histSupport.first = restorationData.id;
      }
      // update last to point to the new element next
      if (histSupport.last) {
        var last = JSON.parse(localStorage.getItem(histSupport.last));
        last['next'] = restorationData.id;
        localStorage.setItem(histSupport.last, JSON.stringify(last));
      }
      // limit history to 100 items
      if (histSupport.count == null) {
        histSupport.count = 1;
      } else {
        histSupport.count++;
      }
      if (histSupport.count > 200) { // 200 entries works out to about 100 total history elements
        var first = JSON.parse(localStorage.getItem(histSupport.first));
        histSupport.first = first.next;
        localStorage.removeItem(first.id);
      }
      //save the new element and history support data
      localStorage.setItem(restorationData.id, JSON.stringify(restorationData));
      localStorage.setItem('ic-history-support', JSON.stringify(histSupport));
      return restorationData;
    },

    updateHistoryData : function(id, html){
      var restorationData = JSON.parse(localStorage.getItem(id));
      if (restorationData == null) {
        log($('body'), "Could not find restoration data with id " + id, "ERROR");
        return
      }
      restorationData.content = html;
      //save the new element and history support data
      localStorage.setItem(restorationData.id, JSON.stringify(restorationData));
    },

    onPageLoad: function () {
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

    pushUrl: function (url, elt, originalHtml) {
      log(elt, "pushing location into history: " + url, "DEBUG");

      var target = getTarget(elt);
      var id = target.attr('id');
      if(id == null) {
        log(elt, "To support history for a given element, you must have a valid id attribute on the element", "ERROR");
        return;
      }

      if(_historySupport.currentRestorationId != null) {
        _historySupport.updateHistoryData(_historySupport.currentRestorationId, originalHtml);
      } else {
        var originalData = _historySupport.newRestorationData(id, originalHtml);
        window.history.replaceState({"ic-id" : originalData.id}, "", "");
      }

      var restorationData = _historySupport.newRestorationData(id, target.html());
      window.history.pushState({'ic-id': restorationData.id}, "", url);
      _historySupport.currentRestorationId = restorationData.id;
      elt.trigger("pushUrl.ic", target, restorationData);
    },

    handlePop: function (event) {
      var data = event.state;
      if (data && data['ic-id']) {
        var historyData = JSON.parse(localStorage.getItem(data['ic-id']));
        var elt = findById(historyData["elementId"]);
        if(_historySupport.currentRestorationId != null) {
          _historySupport.updateHistoryData(_historySupport.currentRestorationId, elt.html());
        }
        processICResponse(historyData["content"], elt);
        _historySupport.currentRestorationId = historyData.id;
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
    if(location.search && location.search.indexOf("ic-launch-debugger=true") >= 0) {
      Intercooler.debug();
    }
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

    updateHistory: function(id) {
      var restoData = _historySupport.newRestorationData($(id).attr('id'), $(id).html());
      window.history.replaceState({"ic-id" : restoData.id}, "", "");
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

    debug: function() {
      var debugPanel = $(window).data('ic-debug-panel');
      if(debugPanel == null) {
        (function() {
          function generateDetailPanel(elt) {
            var dp = $("<div><div><strong>Details</strong></div>" +
              "<div><strong>URL: </strong>" + elt.attr('ic-src') + "</div>" +
              "<div><strong>Verb: </strong>" + verbFor(elt) + "</div>" +
              (elt.attr('ic-trigger-on') ? "<div><strong>Trigger: </strong>" + elt.attr('ic-trigger-on') + "</div>" : "") +
              "</div>"
            );
            if(elt.attr('ic-target')) {
              dp.append($("<div><strong>Target: </strong></div>").append(linkForElt(getTarget(elt))));
            }
            if(elt.attr('ic-deps')) {
              dp.append($("<div><strong>Dependencies: </strong></div>").append(elt.attr('ic-deps')));
            }
            if(verbFor(elt) != "GET") {
              var depsList = $("<div><strong>Dependant Elements:</strong><ul style='list-style-position: inside;font-size:12px;'></ul></div>")
                .appendTo(dp).find("ul");
              $('[ic-src]').each(function () {
                if(verbFor($(this)) == "GET" && $(this).attr('ic-deps') != 'ignore') {
                  if ((isDependent(elt.attr('ic-src'), $(this).attr('ic-src'))) ||
                    (isDependent(elt.attr('ic-src'), $(this).attr('ic-deps')) || $(this).attr('ic-deps') == "*")) {
                    if (elt == null || elt[0] != $(this)[0]) {
                      $("<li style='font-size:12px'></li>").append(linkForElt($(this))).appendTo(depsList);
                    }
                  }
                }
              });
            }
            return dp;
          }

          function linkForElt(that) {
            if(that && that.length > 0) {
              return $("<a style='border-bottom: 1px solid #d3d3d3'>&lt;" +
                that.prop("tagName").toLowerCase() +
                "&gt;" + (that.attr('ic-src') ? " - " + that.attr('ic-src') : "") +
                "</a>").data('ic-debug-elt', that);
            } else {
              return $("<span>no element</span>")
            }
          }

          function generateDebugPanel() {
            return $("<div id='ic-debug-panel' style='font-size: 14px;font-family: Arial;background:white;width:100%;height:200px;position:fixed;left:0;border-top: 1px solid #d3d3d3;'>" +
              "  <div style='padding:4px;width:100%;border-bottom: 1px solid #d3d3d3;background: #f5f5f5'><img src='/images/Intercooler_CMYK_noType_64.png' height='16px'> <strong>intercooler.js debugger</strong>" +
              "    <span style='float:right'><a>Hide</a> | <a>[x]</a></span>" +
              "  </div>" +
              "  <div style='padding:4px;width:100%;border-bottom: 1px solid #d3d3d3;'>" +
              "    <a style='font-weight: bold'>Elements</a> | <a>Logs</a> | <a>Errors</a>" +
              "  </div>" +
              "  <div>" +
              "    <div id='ic-debug-Elements'>" +
              "      <div id='ic-debug-Elements-list' style='width:200px;float: left;height: 142px;overflow-y: scroll;'>" +
              "      </div>" +
              "      <div id='ic-debug-Elements-detail' style='height: 142px;overflow-y: scroll;'>" +
              "      </div>" +
              "    </div>" +
              "    <div id='ic-debug-Logs' style='display:none;overflow-y: scroll;height: 142px'>" +
              "    </div>" +
              "    <div id='ic-debug-Errors' style='display:none;overflow-y: scroll;height: 142px'>" +
              "    </div>" +
              "  </div>" +
              "</div>");
          }

          function debugSourceElt(elt) {
            var eltLink = linkForElt(elt);
            eltLink.clone(true).css({'display' : 'block'}).appendTo($("#ic-debug-Elements-list"));
            if(elt.attr('ic-target') && getTarget(elt).length == 0) {
              $("<div> - bad target selector:" + elt.attr('ic-target') + "</div>").prepend(eltLink.clone(true)).appendTo($("#ic-debug-Errors"));
            }
            if(elt.attr('ic-indicator') && $(elt.attr('ic-indicator')).length == 0) {
              $("<div> - bad indicator selector:" + elt.attr('ic-indicator') + "</div>").prepend(eltLink.clone(true)).appendTo($("#ic-debug-Errors"));
            }
            if(elt.attr('ic-push-url') && getTarget($(elt)).attr('id') == null) {
              $("<div> - ic-push-url requires target to have id</div>").prepend(eltLink.clone(true)).appendTo($("#ic-debug-Errors"));
            }
          }

          function maybeCleanDebugInfo() {
            $('#ic-debug-Elements-list').find('a').each(function(){
              if($(this).data('ic-debug-elt') && $.contains( document.body, $(this).data('ic-debug-elt')[0])) {
                // you live
              } else {
                $(this).remove();
              }
            });
          }

          debugPanel = generateDebugPanel().appendTo($('body'));
          $(window).data('ic-debug-panel', debugPanel);
          var lastElt;
          $('#ic-debug-panel').on('click', 'a', function(){
            if($(this).text() == "Hide") {
              $("#ic-debug-panel").data('ic-minimized', true);
              $(this).text("Show");
              $(window).resize();
            } else if ($(this).text() == "Show") {
              $("#ic-debug-panel").data('ic-minimized', false);
              $(this).text("Hide");
              $(window).resize();
            } else if ($(this).text() == "[x]") {
              if(lastElt) {
                lastElt.css({'border': ''});
              }
              debugPanel.hide();
              $('html').css('margin-bottom', "0");
            } else if (["Elements", "Logs", "Errors"].indexOf($(this).text()) >= 0) {
              $(this).parent().find('a').css({"font-weight":"normal"});
              $(this).css({"font-weight":"bold"});
              $("#ic-debug-" + $(this).text()).parent().children().hide();
              $("#ic-debug-" + $(this).text()).show();
            } else if($(this).data('ic-debug-elt')) {
              var that = $(this);
              var newElt = that.data('ic-debug-elt');
              var delay = Math.min(newElt.offset().top - 75, 300);
              $('html, body').animate({ scrollTop: newElt.offset().top - 75 }, delay);
              if(lastElt) {
                lastElt.css({'border': ''});
              }
              lastElt = newElt;
              newElt.css({'border' : "2px solid red"});
              if(that.parent().attr('id') == 'ic-debug-Elements-list') {
                $('#ic-debug-Elements-detail').html(generateDetailPanel(newElt));
              }
            }
          });

          $('[ic-src]').each(function(){
            debugSourceElt($(this));
          });

          $(window).on('log.ic',function (e, msg, level) {
            $("<div style='border-bottom: 1px solid #d3d3d3'>] - " + msg.replace(/</g, '&lt;') + "</div>")
              .appendTo($("#ic-debug-Logs"))
              .prepend(linkForElt($(e.target)))
              .prepend(level + " [");
          }).on('elementAdded.ic',function (e) {
              debugSourceElt($(e.target));
            }).on('nodesProcessed.ic',function () {
              maybeCleanDebugInfo();
            }).on('resize', function () {
              if(!debugPanel.is(":hidden")) {
                var winOffset = $(window).height() - (debugPanel.data('ic-minimized') == true ? 29 : 200);
                debugPanel.css('top',  winOffset + "px");
                $('html').css('margin-bottom', (debugPanel.data('ic-minimized') == true ? 29 : 200) + "px");
              }
            });
        })();
      } else {
        debugPanel.show();
      }
      $(window).resize();
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
