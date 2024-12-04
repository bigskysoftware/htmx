////////////////////////////////////

/**
 * Intercooler.js - there is no need to be upset.
 */
var Intercooler = Intercooler || (function() {
  'use strict'; // inside function for better merging

  //--------------------------------------------------
  // Vars
  //--------------------------------------------------
  var USE_DATA = $('meta[name="intercoolerjs:use-data-prefix"]').attr("content") == "true";

  var _MACROS = $.map(['ic-get-from', 'ic-post-to', 'ic-put-to', 'ic-patch-to', 'ic-delete-from',
                       'ic-style-src', 'ic-attr-src', 'ic-prepend-from', 'ic-append-from', 'ic-action'],
                      function(elt){ return fixICAttributeName(elt) });

  var _scrollHandler = null;
  var _UUID = 1;
  var _readyHandlers = [];

  var _isDependentFunction = function(src, dest) {
    if (!src || !dest)
      return false;

    // For two urls to be considered dependant, either one must contain all
    // of the path arguments the other has, like so:
    //  - chomp off everything after ? or #. This is a design decision, so this
    //    function will fail to determine dependencies for sites that store
    //    their model IDs in query/hash params. If your usecase is not covered
    //    by this you need to implement this function yourself by overriding
    //    Intercooler.setIsDependentFunction(function(src, dest) { return bool; });
    //  - split by / to get the individual path elements, clear out empty values,
    //    then simply compare them
    var asrc = src.split(/[\?#]/, 1)[0].split("/").filter(function(e) {
      return e != "";
    });

    var adest = dest.split(/[\?#]/, 1)[0].split("/").filter(function(e) {
      return e != "";
    });

    // ignore purely local tags (local transport)
    if (asrc == "" || adest == "") {
      return false;
    }
    return adest.slice(0, asrc.length).join("/") == asrc.join("/") ||
    asrc.slice(0, adest.length).join("/") == adest.join("/");
  };

  //============================================================
  // Base Swap Definitions
  //============================================================
  function remove(elt) {
    elt.remove();
  }

  function showIndicator(elt) {
    if (elt.closest('.ic-use-transition').length > 0) {
      elt.data('ic-use-transition', true);
      elt.removeClass('ic-use-transition');
    } else {
      elt.show();
    }
  }

  function hideIndicator(elt) {
    if (elt.data('ic-use-transition')) {
      elt.data('ic-use-transition', null);
      elt.addClass('ic-use-transition');
    } else {
      elt.hide();
    }
  }

  function fixICAttributeName(s) {
    if (USE_DATA) {
      return 'data-' + s;
    } else {
      return s;
    }
  }

  function getICAttribute(element, attributeName) {
    return element.attr(fixICAttributeName(attributeName));
  }

  function setICAttribute(element, attributeName, attributeValue) {
    element.attr(fixICAttributeName(attributeName), attributeValue);
  }

  function prepend(parent, responseContent) {
    try {
      parent.prepend(responseContent);
    } catch (e) {
      log(parent, formatError(e), "ERROR");
    }
    if (getICAttribute(parent, 'ic-limit-children')) {
      var limit = parseInt(getICAttribute(parent, 'ic-limit-children'));
      if (parent.children().length > limit) {
        parent.children().slice(limit, parent.children().length).remove();
      }
    }
  }

  function append(parent, responseContent) {
    try {
      parent.append(responseContent);
    } catch (e) {
      log(parent, formatError(e), "ERROR");
    }
    if (getICAttribute(parent, 'ic-limit-children')) {
      var limit = parseInt(getICAttribute(parent, 'ic-limit-children'));
      if (parent.children().length > limit) {
        parent.children().slice(0, parent.children().length - limit).remove();
      }
    }
  }

  //============================================================
  // Utility Methods
  //============================================================
  function log(elt, msg, level) {
    if (elt == null) {
      elt = $('body');
    }
    elt.trigger("log.ic", [msg, level, elt]);
    if (level == "ERROR") {
      if (window.console) {
        window.console.log("Intercooler Error : " + msg);
      }
      var errorUrl = closestAttrValue($('body'), 'ic-post-errors-to');
      if (errorUrl) {
        $.post(errorUrl, {'error': msg})
      }
    }
  }

  function uuid() {
    return _UUID++;
  }

  function icSelectorFor(elt) {
    return getICAttributeSelector("ic-id='" + getIntercoolerId(elt) + "'");
  }

  function parseInterval(str) {
    log(null, "POLL: Parsing interval string " + str, 'DEBUG');
    if (str == "null" || str == "false" || str == "") {
      return null;
    } else if (str.lastIndexOf("ms") == str.length - 2) {
      return parseFloat(str.substr(0, str.length - 2));
    } else if (str.lastIndexOf("s") == str.length - 1) {
      return parseFloat(str.substr(0, str.length - 1)) * 1000;
    } else {
      return 1000;
    }
  }

  function getICAttributeSelector(attribute) {
    return "[" + fixICAttributeName(attribute) + "]";
  }

  function initScrollHandler() {
    if (_scrollHandler == null) {
      _scrollHandler = function() {
        $(getICAttributeSelector("ic-trigger-on='scrolled-into-view'")).each(function() {
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

  // taken from turbolinks.js
  function createDocument(html) {
    var doc = null;
    if (/<(html|body)/i.test(html)) {
      doc = document.documentElement.cloneNode();
      doc.innerHTML = html;
    } else {
      doc = document.documentElement.cloneNode(true);
      doc.querySelector('body').innerHTML = html;
    }
    return $(doc);
  }

  //============================================================
  // Request/Parameter/Include Processing
  //============================================================
  function getTarget(elt) {
    var closest = $(elt).closest(getICAttributeSelector('ic-target'));
    var targetValue = getICAttribute(closest, 'ic-target');
    if (targetValue == 'this') {
      return closest;
    } else if (targetValue && targetValue.indexOf('this.') != 0) {
      if (targetValue.indexOf('closest ') == 0) {
        return elt.closest(targetValue.substr(8));
      } else if (targetValue.indexOf('find ') == 0) {
        return elt.find(targetValue.substr(5));
      } else {
        return $(targetValue);
      }
    } else {
      return elt;
    }
  }

  function processHeaders(elt, xhr) {

    elt.trigger("beforeHeaders.ic", [elt, xhr]);
    log(elt, "response headers: " + xhr.getAllResponseHeaders(), "DEBUG");
    var target = null;

    if (xhr.getResponseHeader("X-IC-Refresh")) {
      var pathsToRefresh = xhr.getResponseHeader("X-IC-Refresh").split(",");
      log(elt, "X-IC-Refresh: refreshing " + pathsToRefresh, "DEBUG");
      $.each(pathsToRefresh, function(i, str) {
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
      cancelPolling($(elt).closest(getICAttributeSelector('ic-poll')));
    }

    if (xhr.getResponseHeader("X-IC-ResumePolling") == "true") {
      var pollingElt = $(elt).closest(getICAttributeSelector('ic-poll'));
      setICAttribute(pollingElt, 'ic-pause-polling', null);
      startPolling(pollingElt);
    }

    if (xhr.getResponseHeader("X-IC-SetPollInterval")) {
      var pollingElt = $(elt).closest(getICAttributeSelector('ic-poll'));
      cancelPolling(pollingElt);
      setICAttribute(pollingElt, 'ic-poll', xhr.getResponseHeader("X-IC-SetPollInterval"));
      startPolling(pollingElt);
    }

    if (xhr.getResponseHeader("X-IC-Open")) {
      log(elt, "X-IC-Open: opening " + xhr.getResponseHeader("X-IC-Open"), "DEBUG");
      window.open(xhr.getResponseHeader("X-IC-Open"));
    }

    var triggerValue = xhr.getResponseHeader("X-IC-Trigger");
    if (triggerValue) {
      log(elt, "X-IC-Trigger: found trigger " + triggerValue, "DEBUG");
      target = getTarget(elt);
      // Deprecated API
      if (xhr.getResponseHeader("X-IC-Trigger-Data")) {
        var triggerArgs = $.parseJSON(xhr.getResponseHeader("X-IC-Trigger-Data"));
        target.trigger(triggerValue, triggerArgs);
      } else {
        if (triggerValue.indexOf("{") >= 0) {
          $.each($.parseJSON(triggerValue), function(event, args) {
            target.trigger(event, args);
          });
        } else {
          target.trigger(triggerValue, []);
        }
      }
    }

    if (xhr.getResponseHeader("X-IC-Remove")) {
      if (elt) {
        target = getTarget(elt);
        log(elt, "X-IC-Remove header found.", "DEBUG");
        remove(target);
      }
    }

    elt.trigger("afterHeaders.ic", [elt, xhr]);

    return true;
  }


  function beforeRequest(elt) {
    elt.addClass('disabled');
    elt.data('ic-request-in-flight', true);
  }

  function requestCleanup(indicator, elt) {
    if (indicator.length > 0) {
      hideIndicator(indicator);
    }
    elt.removeClass('disabled');
    elt.data('ic-request-in-flight', false);
    if (elt.data('ic-next-request')) {
      elt.data('ic-next-request')();
      elt.data('ic-next-request', null);
    }
  }

  function replaceOrAddMethod(data, actualMethod) {
    if ($.type(data) === "string") {
      var regex = /(&|^)_method=[^&]*/;
      var content = "&_method=" + actualMethod;
      if (regex.test(data)) {
        return data.replace(regex, content)
      } else {
        return data + content;
      }
    } else {
      data.append("_method", actualMethod);
      return data;
    }
  }

  function globalEval(script) {
    return window["eval"].call(window, script);
  }

  function closestAttrValue(elt, attr) {
    var closestElt = $(elt).closest(getICAttributeSelector(attr));
    if (closestElt.length > 0) {
      return getICAttribute(closestElt, attr);
    } else {
      return null;
    }
  }

  function formatError(e) {
    var msg = e.toString() + "\n";
    try {
      msg += e.stack;
    } catch (e) {
      // ignore
    }
    return msg;
  }

  function handleRemoteRequest(elt, type, url, data, success) {

    beforeRequest(elt);

    data = replaceOrAddMethod(data, type);

    // Spinner support
    var indicator = findIndicator(elt);
    if (indicator.length > 0) {
      showIndicator(indicator);
    }

    var requestId = uuid();
    var requestStart = new Date();
    var actualRequestType = type == 'GET' ? 'GET' : 'POST';

    var ajaxSetup = {
      type: actualRequestType,
      url: url,
      data: data,
      dataType: 'text',
      headers: {
        "Accept": "text/html-partial, */*; q=0.9",
        "X-IC-Request": true,
        "X-HTTP-Method-Override": type
      },
      beforeSend: function(xhr, settings) {
        elt.trigger("beforeSend.ic", [elt, data, settings, xhr, requestId]);
        log(elt, "before AJAX request " + requestId + ": " + type + " to " + url, "DEBUG");
        var onBeforeSend = closestAttrValue(elt, 'ic-on-beforeSend');
        if (onBeforeSend) {
          globalEval('(function (data, settings, xhr) {' + onBeforeSend + '})')(data, settings, xhr);
        }
      },
      success: function(data, textStatus, xhr) {
        elt.trigger("success.ic", [elt, data, textStatus, xhr, requestId]);
        log(elt, "AJAX request " + requestId + " was successful.", "DEBUG");
        var onSuccess = closestAttrValue(elt, 'ic-on-success');
        if (onSuccess) {
          if (globalEval('(function (data, textStatus, xhr) {' + onSuccess + '})')(data, textStatus, xhr) == false) {
            return;
          }
        }

        var beforeHeaders = new Date();
        try {
          if (processHeaders(elt, xhr)) {
            log(elt, "Processed headers for request " + requestId + " in " + (new Date() - beforeHeaders) + "ms", "DEBUG");
            var beforeSuccess = new Date();

            if (xhr.getResponseHeader("X-IC-PushURL") || closestAttrValue(elt, 'ic-push-url') == "true") {
              try {
                requestCleanup(indicator, elt); // clean up before snap-shotting HTML
                var newUrl = xhr.getResponseHeader("X-IC-PushURL") || closestAttrValue(elt, 'ic-src');
                _history.snapshotForHistory(newUrl);
              } catch (e) {
                log(elt, "Error during history snapshot for " + requestId + ": " + formatError(e), "ERROR");
              }
            }

            success(data, textStatus, elt, xhr);

            log(elt, "Process content for request " + requestId + " in " + (new Date() - beforeSuccess) + "ms", "DEBUG");
          }
          elt.trigger("after.success.ic", [elt, data, textStatus, xhr, requestId]);
        } catch (e) {
          log(elt, "Error processing successful request " + requestId + " : " + formatError(e), "ERROR");
        }
      },
      error: function(xhr, status, str) {
        elt.trigger("error.ic", [elt, status, str, xhr]);
        var onError = closestAttrValue(elt, 'ic-on-error');
        if (onError) {
          globalEval('(function (status, str, xhr) {' + onError + '})')(status, str, xhr);
        }
        log(elt, "AJAX request " + requestId + " experienced an error: " + str, "ERROR");
      },
      complete: function(xhr, status) {
        log(elt, "AJAX request " + requestId + " completed in " + (new Date() - requestStart) + "ms", "DEBUG");
        requestCleanup(indicator, elt);
        try {
          if ($.contains(document, elt[0])) {
            $(elt).trigger("complete.ic", [elt, data, status, xhr, requestId]);
          } else {
            $('body').trigger("complete.ic", [elt, data, status, xhr, requestId]);
          }
        } catch (e) {
          log(elt, "Error during complete.ic event for " + requestId + " : " + formatError(e), "ERROR");
        }
        var onComplete = closestAttrValue(elt, 'ic-on-complete');
        if (onComplete) {
          globalEval('(function (xhr, status) {' + onComplete + '})')(xhr, status);
        }
      }
    };
    if ($.type(data) != "string") {
      ajaxSetup.dataType = null;
      ajaxSetup.processData = false;
      ajaxSetup.contentType = false;
    }

    $(document).trigger("beforeAjaxSend.ic", ajaxSetup);

    $.ajax(ajaxSetup)
  }

  function findIndicator(elt) {
    var indicator = null;
    if (getICAttribute($(elt), 'ic-indicator')) {
      indicator = $(getICAttribute($(elt), 'ic-indicator')).first();
    } else {
      indicator = $(elt).find(".ic-indicator").first();
      if (indicator.length == 0) {
        var parent = closestAttrValue(elt, 'ic-indicator');
        if (parent) {
          indicator = $(parent).first();
        } else {
          if ($(elt).next().is('.ic-indicator')) {
            indicator = $(elt).next();
          }
        }
      }
    }
    return indicator;
  }

  function processIncludes(data, str) {
    if ($.trim(str).indexOf("{") == 0) {
      var obj = $.parseJSON(str);
      $.each(obj, function(name, value) {
        data = appendData(data, name, value);
      });
    } else {
      $(str).each(function() {
        var obj = $(this).serializeArray();
        $.each(obj, function(i, input) {
          data = appendData(data, input.name, input.value);
        });
      });
    }
    return data;
  }

  function appendData(data, string, value) {
    if ($.type(data) === "string") {
      return data + "&" + string + "=" + encodeURIComponent(value);
    } else {
      data.append(string, value);
      return data;
    }
  }

  function getParametersForElement(verb, elt, triggerOrigin) {
    var target = getTarget(elt);
    var data = null;

    if (elt.is('form') && elt.attr('enctype') == 'multipart/form-data') {
      data = new FormData(elt[0]);
      data = appendData(data, 'ic-request', true);
    } else {
      data = "ic-request=true";
      // if the element is in a form, include the entire form
      if (verb != "GET" && elt.closest('form').length > 0) {
        data += "&" + elt.closest('form').serialize();
      } else { // otherwise include the element
        data += "&" + elt.serialize();
      }
    }

    var promptText = closestAttrValue(elt, 'ic-prompt');
    if (promptText) {
      var promptVal = prompt(promptText);
      if (promptVal) {
        var promptParamName = closestAttrValue(elt, 'ic-prompt-name') || 'ic-prompt-value';
        data = appendData(data, promptParamName, promptVal);
      } else {
        return null;
      }
    }

    if (elt.attr('id')) {
      data = appendData(data, 'ic-element-id', elt.attr('id'));
    }
    if (elt.attr('name')) {
      data = appendData(data, 'ic-element-name', elt.attr('name'));
    }
    if (getICAttribute(target, 'ic-id')) {
      data = appendData(data, 'ic-id', getICAttribute(target, 'ic-id'));
    }
    if (target.attr('id')) {
      data = appendData(data, 'ic-target-id', target.attr('id'));
    }
    if (triggerOrigin && triggerOrigin.attr('id')) {
      data = appendData(data, 'ic-trigger-id', triggerOrigin.attr('id'));
    }
    if (triggerOrigin && triggerOrigin.attr('name')) {
      data = appendData(data, 'ic-trigger-name', triggerOrigin.attr('name'));
    }
    var includeAttr = closestAttrValue(elt, 'ic-include');
    if (includeAttr) {
      data = processIncludes(data, includeAttr);
    }
    $(getICAttributeSelector('ic-global-include')).each(function() {
      data = processIncludes(data, getICAttribute($(this), 'ic-global-include'));
    });
    data = appendData(data, 'ic-current-url', currentUrl());

    log(elt, "request parameters " + data, "DEBUG");

    return data;
  }

  function maybeSetIntercoolerInfo(elt) {
    var target = getTarget(elt);
    getIntercoolerId(target);
    if (elt.data('elementAdded.ic') != true) {
      elt.data('elementAdded.ic', true);
      elt.trigger("elementAdded.ic");
    }
  }

  function getIntercoolerId(elt) {
    if (!getICAttribute(elt, 'ic-id')) {
      setICAttribute(elt, 'ic-id', uuid());
    }
    return getICAttribute(elt, 'ic-id');
  }

  //============================================================
  // Tree Processing
  //============================================================

  function processNodes(elt) {
    if (elt.length > 1) {
      elt.each(function() {
        processNodes($(this));
      })
    } else {
      processMacros(elt);
      processSources(elt);
      processPolling(elt);
      processTriggerOn(elt);
      processRemoveAfter(elt);
      processAddClasses(elt);
      processRemoveClasses(elt);
    }
  }

  function fireReadyStuff(elt) {
    elt.trigger('nodesProcessed.ic');
    $.each(_readyHandlers, function(i, handler) {
      try {
        handler(elt);
      } catch (e) {
        log(elt, formatError(e), "ERROR");
      }
    });
  }

  function processMacros(elt) {
    $.each(_MACROS, function(i, macro) {
      if ($(elt).closest('.ic-ignore').length == 0) {
        if ($(elt).is('[' + macro + ']')) {
          processMacro(macro, $(elt));
        }
        $(elt).find('[' + macro + ']').each(function() {
          if ($(this).closest('.ic-ignore').length == 0) {
            processMacro(macro, $(this));
          }
        });
      }
    });
  }

  function processSources(elt) {
    if ($(elt).closest('.ic-ignore').length == 0) {
      if ($(elt).is(getICAttributeSelector("ic-src"))) {
        maybeSetIntercoolerInfo($(elt));
      }
      $(elt).find(getICAttributeSelector("ic-src")).each(function() {
        if ($(this).closest('.ic-ignore').length == 0) {
          maybeSetIntercoolerInfo($(this));
        }
      });
    }
  }

  function processPolling(elt) {
    if ($(elt).closest('.ic-ignore').length == 0) {
      if ($(elt).is(getICAttributeSelector("ic-poll"))) {
        maybeSetIntercoolerInfo($(elt));
        startPolling(elt);
      }
      $(elt).find(getICAttributeSelector("ic-poll")).each(function() {
        if ($(this).closest('.ic-ignore').length == 0) {
          maybeSetIntercoolerInfo($(this));
          startPolling($(this));
        }
      });
    }
  }

  function processTriggerOn(elt) {
    if ($(elt).closest('.ic-ignore').length == 0) {
      handleTriggerOn(elt);
      $(elt).find(getICAttributeSelector('ic-trigger-on')).each(function() {
        if ($(this).closest('.ic-ignore').length == 0) {
          handleTriggerOn($(this));
        }
      });
    }
  }

  function processRemoveAfter(elt) {
    if ($(elt).closest('.ic-ignore').length == 0) {
      handleRemoveAfter(elt);
      $(elt).find(getICAttributeSelector('ic-remove-after')).each(function() {
        if ($(this).closest('.ic-ignore').length == 0) {
          handleRemoveAfter($(this));
        }
      });
    }
  }

  function processAddClasses(elt) {
    if ($(elt).closest('.ic-ignore').length == 0) {
      handleAddClasses(elt);
      $(elt).find(getICAttributeSelector('ic-add-class')).each(function() {
        if ($(this).closest('.ic-ignore').length == 0) {
          handleAddClasses($(this));
        }
      });
    }
  }

  function processRemoveClasses(elt) {
    if ($(elt).closest('.ic-ignore').length == 0) {
      handleRemoveClasses(elt);
      $(elt).find(getICAttributeSelector('ic-remove-class')).each(function() {
        if ($(this).closest('.ic-ignore').length == 0) {
          handleRemoveClasses($(this));
        }
      });
    }
  }

  //============================================================
  // Polling support
  //============================================================

  function startPolling(elt) {
    if (elt.data('ic-poll-interval-id') == null && getICAttribute($(elt), 'ic-pause-polling') != 'true') {
      var interval = parseInterval(getICAttribute(elt, 'ic-poll'));
      if (interval != null) {
        var selector = icSelectorFor(elt);
        var repeats = parseInt(getICAttribute(elt, 'ic-poll-repeats')) || -1;
        var currentIteration = 0;
        log(elt, "POLL: Starting poll for element " + selector, "DEBUG");
        var timerId = setInterval(function() {
          var target = $(selector);
          elt.trigger("onPoll.ic", target);
          if ((target.length == 0) || (currentIteration == repeats) || elt.data('ic-poll-interval-id') != timerId) {
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
    if (elt.data('ic-poll-interval-id') != null) {
      clearTimeout(elt.data('ic-poll-interval-id'));
      elt.data('ic-poll-interval-id', null);
    }
  }

  //============================================================----
  // Dependency support
  //============================================================----

  function refreshDependencies(dest, src) {
    log(src, "refreshing dependencies for path " + dest, "DEBUG");
    $(getICAttributeSelector('ic-src')).each(function() {
      var fired = false;
      if (verbFor($(this)) == "GET" && getICAttribute($(this), 'ic-deps') != 'ignore' && typeof(getICAttribute($(this), 'ic-poll')) == 'undefined') {
        if (isDependent(dest, getICAttribute($(this), 'ic-src'))) {
          if (src == null || $(src)[0] != $(this)[0]) {
            fireICRequest($(this));
            fired = true;
          }
        } else if (isDependent(dest, getICAttribute($(this), 'ic-deps')) || getICAttribute($(this), 'ic-deps') == "*") {
          if (src == null || $(src)[0] != $(this)[0]) {
            fireICRequest($(this));
            fired = true;
          }
        }
      }
      if (fired) {
        log($(this), "depends on path " + dest + ", refreshing...", "DEBUG")
      }
    });
  }

  function isDependent(src, dest) {
    return !!_isDependentFunction(src, dest);
  }

  //============================================================----
  // Trigger-On support
  //============================================================----

  function verbFor(elt) {
    if (getICAttribute(elt, 'ic-verb')) {
      return getICAttribute(elt, 'ic-verb').toUpperCase();
    }
    return "GET";
  }

  function eventFor(attr, elt) {
    if (attr == "default") {
      if ($(elt).is('button')) {
        return 'click';
      } else if ($(elt).is('form')) {
        return 'submit';
      } else if ($(elt).is(':input')) {
        return 'change';
      } else {
        return 'click';
      }
    } else {
      return attr;
    }
  }

  function preventDefault(elt, evt) {
    return elt.is('form') || (elt.is(':submit') && elt.closest('form').length == 1) || elt.is('a');
  }

  function handleRemoveAfter(elt) {
    if (getICAttribute($(elt), 'ic-remove-after')) {
      var interval = parseInterval(getICAttribute($(elt), 'ic-remove-after'));
      setTimeout(function() {
        remove(elt);
      }, interval);
    }
  }

  function parseAndApplyClass(classInfo, elt, operation) {
    var cssClass = "";
    var delay = 50;
    if (classInfo.indexOf(":") > 0) {
      var split = classInfo.split(':');
      cssClass = split[0];
      delay = parseInterval(split[1]);
    } else {
      cssClass = classInfo;
    }
    setTimeout(function() {
      elt[operation](cssClass)
    }, delay);
  }

  function handleAddClasses(elt) {
    if (getICAttribute($(elt), 'ic-add-class')) {
      var values = getICAttribute($(elt), 'ic-add-class').split(",");
      var arrayLength = values.length;
      for (var i = 0; i < arrayLength; i++) {
        parseAndApplyClass($.trim(values[i]), elt, 'addClass');
      }
    }
  }

  function handleRemoveClasses(elt) {
    if (getICAttribute($(elt), 'ic-remove-class')) {
      var values = getICAttribute($(elt), 'ic-remove-class').split(",");
      var arrayLength = values.length;
      for (var i = 0; i < arrayLength; i++) {
        parseAndApplyClass($.trim(values[i]), elt, 'removeClass');
      }
    }
  }

  function handleTriggerOn(elt) {

    if (getICAttribute($(elt), 'ic-trigger-on')) {
      if (getICAttribute($(elt), 'ic-trigger-on') == 'load') {
        fireICRequest(elt);
      } else if (getICAttribute($(elt), 'ic-trigger-on') == 'scrolled-into-view') {
        initScrollHandler();
        setTimeout(function() {
          $(window).trigger('scroll');
        }, 100); // Trigger a scroll in case element is already viewable
      } else {
        var triggerOn = getICAttribute($(elt), 'ic-trigger-on').split(" ");
        $(elt).on(eventFor(triggerOn[0], $(elt)), function(e) {

          var onBeforeTrigger = closestAttrValue(elt, 'ic-on-beforeTrigger');
          if (onBeforeTrigger) {
            if (globalEval('(function (evt, elt) {' + onBeforeTrigger + '})')(e, $(elt)) == false) {
              log($(elt), "ic-trigger cancelled by ic-on-beforeTrigger", "DEBUG");
              return false;
            }
          }

          if (triggerOn[1] == 'changed') {
            var currentVal = $(elt).val();
            var previousVal = $(elt).data('ic-previous-val');
            $(elt).data('ic-previous-val', currentVal);
            if (currentVal != previousVal) {
              fireICRequest($(elt));
            }
          } else {
            fireICRequest($(elt));
          }
          if (preventDefault(elt, e)) {
            e.preventDefault();
            return false;
          }
          return true;
        });
      }
    }
  }

  //============================================================----
  // Macro support
  //============================================================----

  function macroIs(macro, constant) {
    return macro == fixICAttributeName(constant);
  }

  function processMacro(macro, elt) {
    // action attributes
    if (macroIs(macro, 'ic-post-to')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-post-to'));
      setIfAbsent(elt, 'ic-verb', 'POST');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if (macroIs(macro, 'ic-put-to')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-put-to'));
      setIfAbsent(elt, 'ic-verb', 'PUT');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if (macroIs(macro, 'ic-patch-to')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-patch-to'));
      setIfAbsent(elt, 'ic-verb', 'PATCH');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if (macroIs(macro, 'ic-get-from')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-get-from'));
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if (macroIs(macro, 'ic-delete-from')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-delete-from'));
      setIfAbsent(elt, 'ic-verb', 'DELETE');
      setIfAbsent(elt, 'ic-trigger-on', 'default');
      setIfAbsent(elt, 'ic-deps', 'ignore');
    }
    if (macroIs(macro, 'ic-action')) {
      setIfAbsent(elt, 'ic-trigger-on', 'default');
    }

    // non-action attributes
    var value = null;
    var url = null;
    if (macroIs(macro, 'ic-style-src')) {
      value = getICAttribute(elt, 'ic-style-src').split(":");
      var styleAttribute = value[0];
      url = value[1];
      setIfAbsent(elt, 'ic-src', url);
      setIfAbsent(elt, 'ic-target', 'this.style.' + styleAttribute);
    }
    if (macroIs(macro, 'ic-attr-src')) {
      value = getICAttribute(elt, 'ic-attr-src').split(":");
      var attribute = value[0];
      url = value[1];
      setIfAbsent(elt, 'ic-src', url);
      setIfAbsent(elt, 'ic-target', 'this.' + attribute);
    }
    if (macroIs(macro, 'ic-prepend-from')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-prepend-from'));
    }
    if (macroIs(macro, 'ic-append-from')) {
      setIfAbsent(elt, 'ic-src', getICAttribute(elt, 'ic-append-from'));
    }
  }

  function setIfAbsent(elt, attr, value) {
    if (getICAttribute(elt, attr) == null) {
      setICAttribute(elt, attr, value);
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

  function maybeScrollToTarget(elt, target) {
    if (closestAttrValue(elt, 'ic-scroll-to-target') != "false" &&
    (closestAttrValue(elt, 'ic-scroll-to-target') == 'true' ||
    closestAttrValue(target, 'ic-scroll-to-target') == 'true')) {
      var offset = -50; // -50 px default offset padding
      if (closestAttrValue(elt, 'ic-scroll-offset')) {
        offset = parseInt(closestAttrValue(elt, 'ic-scroll-offset'));
      } else if (closestAttrValue(target, 'ic-scroll-offset')) {
        offset = parseInt(closestAttrValue(target, 'ic-scroll-offset'));
      }
      var currentPosition = target.offset().top;
      var portalTop = $(window).scrollTop();
      var portalEnd = portalTop + window.innerHeight;
      //if the current top of this element is not visible, scroll it to the top position
      if (currentPosition < portalTop || currentPosition > portalEnd) {
        offset += currentPosition;
        $('html,body').animate({scrollTop: offset}, 400);
      }
    }
  }

  function getTransitionDuration(elt, target) {
    var transitionDuration = closestAttrValue(elt, 'ic-transition-duration');
    if (transitionDuration) {
      return parseInterval(transitionDuration);
    }
    transitionDuration = closestAttrValue(target, 'ic-transition-duration');
    if (transitionDuration) {
      return parseInterval(transitionDuration);
    }
    var duration = 0;
    var durationStr = $(target).css('transition-duration');
    if (durationStr) {
      duration += parseInterval(durationStr);
    }
    var delayStr = $(target).css('transition-delay');
    if (delayStr) {
      duration += parseInterval(delayStr);
    }
    return duration;
  }

  function processICResponse(responseContent, elt, forHistory) {
    if (responseContent && responseContent != "" && responseContent != " ") {

      log(elt, "response content: \n" + responseContent, "DEBUG");
      var target = getTarget(elt);

      var contentToSwap = maybeFilter(responseContent, closestAttrValue(elt, 'ic-select-from-response'));

      var doSwap = function() {
        if (closestAttrValue(elt, 'ic-replace-target') == "true") {
          try {
            target.replaceWith(contentToSwap);
          } catch (e) {
            log(elt, formatError(e), "ERROR");
          }
          processNodes(contentToSwap);
          fireReadyStuff($(target));
        } else {
          if (elt.is(getICAttributeSelector('ic-prepend-from'))) {
            prepend(target, contentToSwap);
            processNodes(contentToSwap);
            fireReadyStuff($(target));
          } else if (elt.is(getICAttributeSelector('ic-append-from'))) {
            append(target, contentToSwap);
            processNodes(contentToSwap);
            fireReadyStuff($(target));
          } else {
            try {
              target.empty().append(contentToSwap);
            } catch (e) {
              log(elt, formatError(e), "ERROR");
            }
            $(target).children().each(function() {
              processNodes($(this));
            });
            fireReadyStuff($(target));
          }
          if (forHistory != true) {
            maybeScrollToTarget(elt, target);
          }
        }
      };

      if (target.length == 0) {
        //TODO cgross - refactor getTarget to return printable string here
        log(elt, "Invalid target for element: " + getICAttribute($(elt).closest(getICAttributeSelector('ic-target')), 'ic-target'), "ERROR");
        return;
      }

      var delay = getTransitionDuration(elt, target);
      target.addClass('ic-transitioning');
      setTimeout(function() {
        try {
          doSwap();
        } catch (e) {
          log(elt, "Error during content swaop : " + formatError(e), "ERROR");
        }
        setTimeout(function() {
          try {
            target.removeClass('ic-transitioning');
            _history.updateHistory();
            target.trigger("complete_transition.ic", [target]);
          } catch (e) {
            log(elt, "Error during transition complete : " + formatError(e), "ERROR");
          }
        }, 20);
      }, delay);
    } else {
      log(elt, "Empty response, nothing to do here.", "DEBUG");
    }
  }

  function maybeFilter(newContent, filter) {
    var content = $.parseHTML(newContent, null, true);
    var asQuery = $(content);
    if (filter) {
      return asQuery.filter(filter).add(asQuery.find(filter)).contents();
    } else {
      return asQuery;
    }
  }

  function getStyleTarget(elt) {
    var val = closestAttrValue(elt, 'ic-target');
    if (val && val.indexOf("this.style.") == 0) {
      return val.substr(11)
    } else {
      return null;
    }
  }

  function getAttrTarget(elt) {
    var val = closestAttrValue(elt, 'ic-target');
    if (val && val.indexOf("this.") == 0) {
      return val.substr(5)
    } else {
      return null;
    }
  }

  function fireICRequest(elt, alternateHandler) {

    var triggerOrigin = elt;
    if (!elt.is(getICAttributeSelector('ic-src')) && getICAttribute(elt, 'ic-action') == undefined) {
      elt = elt.closest(getICAttributeSelector('ic-src'));
    }

    var confirmText = closestAttrValue(elt, 'ic-confirm');
    if (confirmText) {
      if (!confirm(confirmText)) {
        return;
      }
    }

    if (elt.length > 0) {
      var icEventId = uuid();
      elt.data('ic-event-id', icEventId);
      var invokeRequest = function() {

        // if an existing request is in flight for this element, push this request as the next to be executed
        if (elt.data('ic-request-in-flight') == true) {
          elt.data('ic-next-request', invokeRequest);
          return;
        }

        if (elt.data('ic-event-id') == icEventId) {
          var styleTarget = getStyleTarget(elt);
          var attrTarget = styleTarget ? null : getAttrTarget(elt);
          var verb = verbFor(elt);
          var url = getICAttribute(elt, 'ic-src');
          if (url) {
            var success = alternateHandler || function(data) {
              if (styleTarget) {
                elt.css(styleTarget, data);
              } else if (attrTarget) {
                elt.attr(attrTarget, data);
              } else {
                processICResponse(data, elt);
                if (verb != 'GET') {
                  refreshDependencies(getICAttribute(elt, 'ic-src'), elt);
                }
              }
            };
            var data = getParametersForElement(verb, elt, triggerOrigin);
            if(data) {
              handleRemoteRequest(elt, verb, url, data, success);
            }
          }

          var actions = getICAttribute(elt, 'ic-action');
          if (actions) {
            invokeLocalAction(elt, actions);
          }
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

  function invokeLocalAction(elt, actions) {
    var target = getTarget(elt);
    var actionArr = actions.split(";");

    var actionsArr = [];
    var delay = 0;

    $.each(actionArr, function(i, actionStr) {
      var actionDef = $.trim(actionStr);
      var action = actionDef;
      var actionArgs = [];
      if (actionDef.indexOf(":") > 0) {
        action = actionDef.substr(0, actionDef.indexOf(":"));
        actionArgs = computeArgs(actionDef.substr(actionDef.indexOf(":") + 1, actionDef.length));
      }
      if (action == "") {
        // ignore blanks
      } else if (action == "delay") {
        if (delay == null) {
          delay = 0;
        }
        delay += parseInterval(actionArgs[0] + "");  // custom interval increase
      } else {
        if (delay == null) {
          delay = 420; // 420ms default interval increase (400ms jQuery default + 20ms slop)
        }
        actionsArr.push([delay, makeApplyAction(target, action, actionArgs)]);
        delay = null;
      }
    });

    delay = 0;
    $.each(actionsArr, function(i, action) {
      delay += action[0];
      setTimeout(action[1], delay);
    });
  }

  function computeArgs(args) {
    try {
      return eval("[" + args + "]")
    } catch (e) {
      return [$.trim(args)];
    }
  }

  function makeApplyAction(target, action, args) {
    return function() {
      var func = target[action];
      if (func) {
        func.apply(target, args);
      } else {
        log(target, "Action " + action + " was not found", "ERROR");
      }
    };
  }

  //============================================================
  // History Support
  //============================================================

  function newIntercoolerHistory(storage, history, slotLimit, historyVersion) {

    /* Constants */
    var HISTORY_SUPPORT_SLOT = 'ic-history-support';
    var HISTORY_SLOT_PREFIX = "ic-hist-elt-";

    /* Instance Vars */
    var historySupportData = JSON.parse(storage.getItem(HISTORY_SUPPORT_SLOT));
    var _snapshot = null;

    // Reset history if the history config has changed
    if (historyConfigHasChanged(historySupportData)) {
      log(getTargetForHistory($('body')), "Intercooler History configuration changed, clearing history", "INFO");
      clearHistory();
    }

    if (historySupportData == null) {
      historySupportData = {
        slotLimit: slotLimit,
        historyVersion: historyVersion,
        lruList: []
      };
    }

    /* Instance Methods  */
    function historyConfigHasChanged(historySupportData) {
      return historySupportData == null ||
      historySupportData.slotLimit != slotLimit ||
      historySupportData.historyVersion != historyVersion ||
      historySupportData.lruList == null
    }

    function clearHistory() {
      var keys = [];
      for (var i = 0; i < storage.length; i++) {
        if (storage.key(i).indexOf(HISTORY_SLOT_PREFIX) == 0) {
          keys.push(storage.key(i));
        }
      }
      for (var j = 0; j < keys.length; j++) {
        storage.removeItem(keys[j]);
      }
      storage.removeItem(HISTORY_SUPPORT_SLOT);
      historySupportData = {
        slotLimit: slotLimit,
        historyVersion: historyVersion,
        lruList: []
      };
    }

    function updateLRUList(url) {
      var lruList = historySupportData.lruList;
      var currentIndex = lruList.indexOf(url);
      var t = getTargetForHistory($('body'));
      // found in current list, shift it to the end
      if (currentIndex >= 0) {
        log(t, "URL found in LRU list, moving to end", "INFO");
        lruList.splice(currentIndex, 1);
        lruList.push(url);
      } else {
        // not found, add and shift if necessary
        log(t, "URL not found in LRU list, adding", "INFO");
        lruList.push(url);
        if (lruList.length > historySupportData.slotLimit) {
          var urlToDelete = lruList.shift();
          log(t, "History overflow, removing local history for " + urlToDelete, "INFO");
          storage.removeItem(HISTORY_SLOT_PREFIX + urlToDelete);
        }
      }

      // save history metadata
      storage.setItem(HISTORY_SUPPORT_SLOT, JSON.stringify(historySupportData));
      return lruList;
    }

    function saveHistoryData(restorationData) {
      var content = JSON.stringify(restorationData);
      try {
        storage.setItem(restorationData.id, content);
      } catch (e) {
        //quota error, nuke local cache
        try {
          clearHistory();
          storage.setItem(restorationData.id, content);
        } catch (e) {
          log(getTargetForHistory($('body')), "Unable to save intercooler history with entire history cleared, is something else eating " +
          "local storage? History Limit:" + slotLimit, "ERROR");
        }
      }
    }

    function makeHistoryEntry(html, yOffset, url) {
      var restorationData = {
        "url": url,
        "id": HISTORY_SLOT_PREFIX + url,
        "content": html,
        "yOffset": yOffset,
        "timestamp": new Date().getTime()
      };
      updateLRUList(url);
      // save to the history slot
      saveHistoryData(restorationData);
      return restorationData;
    }

    function addPopStateHandler(windowToAdd) {
      if (windowToAdd.onpopstate == null || windowToAdd.onpopstate['ic-on-pop-state-handler'] != true) {
        var currentOnPopState = windowToAdd.onpopstate;
        windowToAdd.onpopstate = function(event) {
          getTargetForHistory($('body')).trigger('handle.onpopstate.ic');
          if (!handleHistoryNavigation(event)) {
            if (currentOnPopState) {
              currentOnPopState(event);
            }
          }
          getTargetForHistory($('body')).trigger('pageLoad.ic');
        };
        windowToAdd.onpopstate['ic-on-pop-state-handler'] = true;
      }
    }

    function updateHistory() {
      if (_snapshot) {
        pushUrl(_snapshot.newUrl, currentUrl(), _snapshot.oldHtml, _snapshot.yOffset);
        _snapshot = null;
      }
    }

    function pushUrl(newUrl, originalUrl, originalHtml, yOffset) {

      var historyEntry = makeHistoryEntry(originalHtml, yOffset, originalUrl);
      history.replaceState({"ic-id": historyEntry.id}, "", "");

      var t = getTargetForHistory($('body'));
      var restorationData = makeHistoryEntry(t.html(), window.pageYOffset, newUrl);
      history.pushState({'ic-id': restorationData.id}, "", newUrl);

      t.trigger("pushUrl.ic", [t, restorationData]);
    }

    function handleHistoryNavigation(event) {
      var data = event.state;
      if (data && data['ic-id']) {
        var historyData = JSON.parse(storage.getItem(data['ic-id']));
        if (historyData) {
          processICResponse(historyData["content"], getTargetForHistory($('body')), true);
          if (historyData["yOffset"]) {
            window.scrollTo(0, historyData["yOffset"])
          }
          return true;
        } else {
          $.get(currentUrl(), {'ic-restore-history': true}, function(data, status) {
            var newDoc = createDocument(data);
            var replacementHtml = getTargetForHistory(newDoc).html();
            processICResponse(replacementHtml, getTargetForHistory($('body')), true);
          });
        }
      }
      return false;
    }

    function getTargetForHistory(elt) {
      var explicitHistoryTarget = elt.find(getICAttributeSelector('ic-history-elt'));
      if (explicitHistoryTarget.length > 0) {
        return explicitHistoryTarget;
      } else {
        return elt;
      }
    }

    function snapshotForHistory(newUrl) {
      var t = getTargetForHistory($('body'));
      t.trigger("beforeHistorySnapshot.ic", [t]);
      _snapshot = {
        newUrl: newUrl,
        oldHtml: t.html(),
        yOffset: window.pageYOffset
      }
    }

    function dumpLocalStorage() {
      var str = "";
      var keys = [];
      for (var x in storage) {
        keys.push(x);
      }
      keys.sort();
      var total = 0;
      for (var i in keys) {
        var size = (storage[keys[i]].length * 2);
        total += size;
        str += keys[i] + "=" + (size / 1024 / 1024).toFixed(2) + " MB\n";
      }
      return str + "\nTOTAL LOCAL STORAGE: " + (total / 1024 / 1024).toFixed(2) + " MB";
    }

    function supportData() {
      return historySupportData;
    }

    /* API */
    return {
      clearHistory: clearHistory,
      updateHistory: updateHistory,
      addPopStateHandler: addPopStateHandler,
      snapshotForHistory: snapshotForHistory,
      _internal: {
        addPopStateHandler: addPopStateHandler,
        supportData: supportData,
        dumpLocalStorage: dumpLocalStorage,
        updateLRUList: updateLRUList
      }
    }
  }

  function getSlotLimit() {
    return 20;
  }

  function refresh(val) {
    if (typeof val == 'string' || val instanceof String) {
      refreshDependencies(val);
    } else {
      fireICRequest(val);
    }
    return Intercooler;
  }

  var _history = newIntercoolerHistory(localStorage, window.history, getSlotLimit(), .1);

  //============================================================
  // Local references transport
  //============================================================

  $.ajaxTransport("text", function(options, origOptions) {
    if (origOptions.url[0] == "#") {
      var ltAttr = fixICAttributeName("ic-local-");
      var src = $(origOptions.url);
      var rsphdr = [];
      var status = 200;
      var statusText = "OK";
      src.each(function(i, el) {
        $.each(el.attributes, function(j, attr) {
          if (attr.name.substr(0, ltAttr.length) == ltAttr) {
            var lhName = attr.name.substring(ltAttr.length);
            if (lhName == "status") {
              var statusLine = attr.value.match(/(\d+)\s?(.*)/);
              if (statusLine != null) {
                status = statusLine[1];
                statusText = statusLine[2];
              } else {
                status = "500";
                statusText = "Attribute Error";
              }
            } else {
              rsphdr.push(lhName + ": " + attr.value);
            }
          }
        });
      });
      var rsp = src.length > 0 ? src.html() : "";
      return {
        send: function(reqhdr, completeCallback) {
          completeCallback(status, statusText, {html: rsp}, rsphdr.join("\n"));
        },
        abort: function() {
        }
      }
    } else {
      return null;
    }
  }
  );

  //============================================================
  // Bootstrap
  //============================================================

  function init() {
    var elt = $('body');
    processNodes(elt);
    fireReadyStuff(elt);
    _history.addPopStateHandler(window);
    if (location.search && location.search.indexOf("ic-launch-debugger=true") >= 0) {
      Intercooler.debug();
    }
  }

  $(function() {
    init();
  });

  /* ===================================================
   * API
   * =================================================== */
  return {
    refresh: refresh,
    history: _history,
    triggerRequest: fireICRequest,
    processNodes: processNodes,
    closestAttrValue: closestAttrValue,
    verbFor: verbFor,
    isDependent: isDependent,
    getTarget: getTarget,
    processHeaders: processHeaders,
    setIsDependentFunction: function(func) {
      _isDependentFunction = func;
    },
    ready: function(readyHandler) {
      _readyHandlers.push(readyHandler);
    },
    debug: function() {
      var debuggerUrl = closestAttrValue('body', 'ic-debugger-url') ||
      "https://intercoolerreleases-leaddynocom.netdna-ssl.com/intercooler-debugger.js";
      $.getScript(debuggerUrl)
      .fail(function(jqxhr, settings, exception) {
        log($('body'), formatError(exception), "ERROR");
      });
    },
    _internal: {
      init: init,
      replaceOrAddMethod: replaceOrAddMethod
    }
  }
})();
