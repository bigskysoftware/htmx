/*! jQuery Mockjax
 * A Plugin providing simple and flexible mocking of ajax requests and responses
 * 
 * Version: 2.2.1
 * Home: https://github.com/jakerella/jquery-mockjax
 * Copyright (c) 2016 Jordan Kasper, formerly appendTo;
 * NOTE: This repository was taken over by Jordan Kasper (@jakerella) October, 2014
 * 
 * Dual licensed under the MIT or GPL licenses.
 * http://opensource.org/licenses/MIT OR http://www.gnu.org/licenses/gpl-2.0.html
 */
(function(root, factory) {
	'use strict';

	// AMDJS module definition
	if ( typeof define === 'function' && define.amd && define.amd.jQuery ) {
		define(['jquery'], function($) {
			return factory($, root);
		});

	// CommonJS module definition
	} else if ( typeof exports === 'object') {

		// NOTE: To use Mockjax as a Node module you MUST provide the factory with
		// a valid version of jQuery and a window object (the global scope):
		// var mockjax = require('jquery.mockjax')(jQuery, window);

		module.exports = factory;

	// Global jQuery in web browsers
	} else {
		return factory(root.jQuery || root.$, root);
	}
}(this, function($, window) {
	'use strict';

	var _ajax = $.ajax,
		mockHandlers = [],
		mockedAjaxCalls = [],
		unmockedAjaxCalls = [],
		CALLBACK_REGEX = /=\?(&|$)/,
		jsc = (new Date()).getTime(),
		DEFAULT_RESPONSE_TIME = 500;

	// Parse the given XML string.
	function parseXML(xml) {
		if ( window.DOMParser === undefined && window.ActiveXObject ) {
			window.DOMParser = function() { };
			DOMParser.prototype.parseFromString = function( xmlString ) {
				var doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = 'false';
				doc.loadXML( xmlString );
				return doc;
			};
		}

		try {
			var xmlDoc = ( new DOMParser() ).parseFromString( xml, 'text/xml' );
			if ( $.isXMLDoc( xmlDoc ) ) {
				var err = $('parsererror', xmlDoc);
				if ( err.length === 1 ) {
					throw new Error('Error: ' + $(xmlDoc).text() );
				}
			} else {
				throw new Error('Unable to parse XML');
			}
			return xmlDoc;
		} catch( e ) {
			var msg = ( e.name === undefined ? e : e.name + ': ' + e.message );
			$(document).trigger('xmlParseError', [ msg ]);
			return undefined;
		}
	}

	// Check if the data field on the mock handler and the request match. This
	// can be used to restrict a mock handler to being used only when a certain
	// set of data is passed to it.
	function isMockDataEqual( mock, live ) {
		logger.debug( mock, ['Checking mock data against request data', mock, live] );
		var identical = true;

		if ( $.isFunction(mock) ) {
			return !!mock(live);
		}

		// Test for situations where the data is a querystring (not an object)
		if (typeof live === 'string') {
			// Querystring may be a regex
			if ($.isFunction( mock.test )) {
				return mock.test(live);
			} else if (typeof mock === 'object') {
				live = getQueryParams(live);
			} else {
				return mock === live;
			}
		}

		$.each(mock, function(k) {
			if ( live[k] === undefined ) {
				identical = false;
				return identical;
			} else {
				if ( typeof live[k] === 'object' && live[k] !== null ) {
					if ( identical && $.isArray( live[k] ) ) {
						identical = $.isArray( mock[k] ) && live[k].length === mock[k].length;
					}
					identical = identical && isMockDataEqual(mock[k], live[k]);
				} else {
					if ( mock[k] && $.isFunction( mock[k].test ) ) {
						identical = identical && mock[k].test(live[k]);
					} else {
						identical = identical && ( mock[k] === live[k] );
					}
				}
			}
		});

		return identical;
	}

	function getQueryParams(queryString) {
		var i, l, param, tmp,
			paramsObj = {},
			params = String(queryString).split(/&/);

		for (i=0, l=params.length; i<l; ++i) {
			param = params[i];
			try {
				param = decodeURIComponent(param.replace(/\+/g, ' '));
				param = param.split(/=/);
			} catch(e) {
				// Can't parse this one, so let it go?
				continue;
			}

			if (paramsObj[param[0]]) {
				// this is an array query param (more than one entry in query)
				if (!paramsObj[param[0]].splice) {
					// if not already an array, make it one
					tmp = paramsObj[param[0]];
					paramsObj[param[0]] = [];
					paramsObj[param[0]].push(tmp);
				}
				paramsObj[param[0]].push(param[1]);
			} else {
				paramsObj[param[0]] = param[1];
			}
		}

		logger.debug( null, ['Getting query params from string', queryString, paramsObj] );

		return paramsObj;
	}

	// See if a mock handler property matches the default settings
	function isDefaultSetting(handler, property) {
		return handler[property] === $.mockjaxSettings[property];
	}

	// Check the given handler should mock the given request
	function getMockForRequest( handler, requestSettings ) {
		// If the mock was registered with a function, let the function decide if we
		// want to mock this request
		if ( $.isFunction(handler) ) {
			return handler( requestSettings );
		}

		// Inspect the URL of the request and check if the mock handler's url
		// matches the url for this ajax request
		if ( $.isFunction(handler.url.test) ) {
			// The user provided a regex for the url, test it
			if ( !handler.url.test( requestSettings.url ) ) {
				return null;
			}
		} else {

			// Apply namespace prefix to the mock handler's url.
			var namespace = handler.namespace || $.mockjaxSettings.namespace;
			if (!!namespace) {
				var namespacedUrl = [namespace, handler.url].join('/');
				namespacedUrl = namespacedUrl.replace(/(\/+)/g, '/');
				handler.url = namespacedUrl;
			}

			// Look for a simple wildcard '*' or a direct URL match
			var star = handler.url.indexOf('*');
			if (handler.url !== requestSettings.url && star === -1 ||
					!new RegExp(handler.url.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&').replace(/\*/g, '.+')).test(requestSettings.url)) {
				return null;
			}
		}

		// Inspect the request headers submitted
		if ( handler.requestHeaders ) {
			//No expectation for headers, do not mock this request
			if (requestSettings.headers === undefined) {
				return null;
			} else {
				var headersMismatch = false;
				$.each(handler.requestHeaders, function(key, value) {
					var v = requestSettings.headers[key];
					if(v !== value) {
						headersMismatch = true;
						return false;
					}
				});
				//Headers do not match, do not mock this request
				if (headersMismatch) {
					return null;
				}
			}
		}

		// Inspect the data submitted in the request (either POST body or GET query string)
		if ( handler.data ) {
			if ( !requestSettings.data || !isMockDataEqual(handler.data, requestSettings.data) ) {
				// They're not identical, do not mock this request
				return null;
			}
		}
		// Inspect the request type
		if ( handler && handler.type &&
				handler.type.toLowerCase() !== requestSettings.type.toLowerCase() ) {
			// The request type doesn't match (GET vs. POST)
			return null;
		}

		return handler;
	}

	function isPosNum(value) {
		return typeof value === 'number' && value >= 0;
	}

	function parseResponseTimeOpt(responseTime) {
		if ($.isArray(responseTime) && responseTime.length === 2) {
			var min = responseTime[0];
			var max = responseTime[1];
			if(isPosNum(min) && isPosNum(max)) {
				return Math.floor(Math.random() * (max - min)) + min;
			}
		} else if(isPosNum(responseTime)) {
			return responseTime;
		}
		return DEFAULT_RESPONSE_TIME;
	}

	// Process the xhr objects send operation
	function _xhrSend(mockHandler, requestSettings, origSettings) {
		logger.debug( mockHandler, ['Sending fake XHR request', mockHandler, requestSettings, origSettings] );

		// This is a substitute for < 1.4 which lacks $.proxy
		var process = (function(that) {
			return function() {
				return (function() {
					// The request has returned
					this.status = mockHandler.status;
					this.statusText = mockHandler.statusText;
					this.readyState	= 1;

					var finishRequest = function () {
						this.readyState	= 4;

						var onReady;
						// Copy over our mock to our xhr object before passing control back to
						// jQuery's onreadystatechange callback
						if ( requestSettings.dataType === 'json' && ( typeof mockHandler.responseText === 'object' ) ) {
							this.responseText = JSON.stringify(mockHandler.responseText);
						} else if ( requestSettings.dataType === 'xml' ) {
							if ( typeof mockHandler.responseXML === 'string' ) {
								this.responseXML = parseXML(mockHandler.responseXML);
								//in jQuery 1.9.1+, responseXML is processed differently and relies on responseText
								this.responseText = mockHandler.responseXML;
							} else {
								this.responseXML = mockHandler.responseXML;
							}
						} else if (typeof mockHandler.responseText === 'object' && mockHandler.responseText !== null) {
							// since jQuery 1.9 responseText type has to match contentType
							mockHandler.contentType = 'application/json';
							this.responseText = JSON.stringify(mockHandler.responseText);
						} else {
							this.responseText = mockHandler.responseText;
						}
						if( typeof mockHandler.status === 'number' || typeof mockHandler.status === 'string' ) {
							this.status = mockHandler.status;
						}
						if( typeof mockHandler.statusText === 'string') {
							this.statusText = mockHandler.statusText;
						}
						// jQuery 2.0 renamed onreadystatechange to onload
						onReady = this.onload || this.onreadystatechange;

						// jQuery < 1.4 doesn't have onreadystate change for xhr
						if ( $.isFunction( onReady ) ) {
							if( mockHandler.isTimeout) {
								this.status = -1;
							}
							onReady.call( this, mockHandler.isTimeout ? 'timeout' : undefined );
						} else if ( mockHandler.isTimeout ) {
							// Fix for 1.3.2 timeout to keep success from firing.
							this.status = -1;
						}
					};

					// We have an executable function, call it to give
					// the mock handler a chance to update it's data
					if ( $.isFunction(mockHandler.response) ) {
						// Wait for it to finish
						if ( mockHandler.response.length === 2 ) {
							mockHandler.response(origSettings, function () {
								finishRequest.call(that);
							});
							return;
						} else {
							mockHandler.response(origSettings);
						}
					}

					finishRequest.call(that);
				}).apply(that);
			};
		})(this);

		if ( mockHandler.proxy ) {
			logger.info( mockHandler, ['Retrieving proxy file: ' + mockHandler.proxy, mockHandler] );
			// We're proxying this request and loading in an external file instead
			_ajax({
				global: false,
				url: mockHandler.proxy,
				type: mockHandler.proxyType,
				data: mockHandler.data,
				async: requestSettings.async,
				dataType: requestSettings.dataType === 'script' ? 'text/plain' : requestSettings.dataType,
				complete: function(xhr) {
					// Fix for bug #105
					// jQuery will convert the text to XML for us, and if we use the actual responseXML here
					// then some other things don't happen, resulting in no data given to the 'success' cb
					mockHandler.responseXML = mockHandler.responseText = xhr.responseText;

					// Don't override the handler status/statusText if it's specified by the config
					if (isDefaultSetting(mockHandler, 'status')) {
						mockHandler.status = xhr.status;
					}
					if (isDefaultSetting(mockHandler, 'statusText')) {
						mockHandler.statusText = xhr.statusText;
					}

					if ( requestSettings.async === false ) {
						// TODO: Blocking delay
						process();
					} else {
						this.responseTimer = setTimeout(process, parseResponseTimeOpt(mockHandler.responseTime));
					}
				}
			});
		} else {
			// type === 'POST' || 'GET' || 'DELETE'
			if ( requestSettings.async === false ) {
				// TODO: Blocking delay
				process();
			} else {
				this.responseTimer = setTimeout(process, parseResponseTimeOpt(mockHandler.responseTime));
			}
		}

	}

	// Construct a mocked XHR Object
	function xhr(mockHandler, requestSettings, origSettings, origHandler) {
		logger.debug( mockHandler, ['Creating new mock XHR object', mockHandler, requestSettings, origSettings, origHandler] );

		// Extend with our default mockjax settings
		mockHandler = $.extend(true, {}, $.mockjaxSettings, mockHandler);

		if (typeof mockHandler.headers === 'undefined') {
			mockHandler.headers = {};
		}
		if (typeof requestSettings.headers === 'undefined') {
			requestSettings.headers = {};
		}
		if ( mockHandler.contentType ) {
			mockHandler.headers['content-type'] = mockHandler.contentType;
		}

		return {
			status: mockHandler.status,
			statusText: mockHandler.statusText,
			readyState: 1,
			open: function() { },
			send: function() {
				origHandler.fired = true;
				_xhrSend.call(this, mockHandler, requestSettings, origSettings);
			},
			abort: function() {
				clearTimeout(this.responseTimer);
			},
			setRequestHeader: function(header, value) {
				requestSettings.headers[header] = value;
			},
			getResponseHeader: function(header) {
				// 'Last-modified', 'Etag', 'content-type' are all checked by jQuery
				if ( mockHandler.headers && mockHandler.headers[header] ) {
					// Return arbitrary headers
					return mockHandler.headers[header];
				} else if ( header.toLowerCase() === 'last-modified' ) {
					return mockHandler.lastModified || (new Date()).toString();
				} else if ( header.toLowerCase() === 'etag' ) {
					return mockHandler.etag || '';
				} else if ( header.toLowerCase() === 'content-type' ) {
					return mockHandler.contentType || 'text/plain';
				}
			},
			getAllResponseHeaders: function() {
				var headers = '';
				// since jQuery 1.9 responseText type has to match contentType
				if (mockHandler.contentType) {
					mockHandler.headers['Content-Type'] = mockHandler.contentType;
				}
				$.each(mockHandler.headers, function(k, v) {
					headers += k + ': ' + v + '\n';
				});
				return headers;
			}
		};
	}

	// Process a JSONP mock request.
	function processJsonpMock( requestSettings, mockHandler, origSettings ) {
		// Handle JSONP Parameter Callbacks, we need to replicate some of the jQuery core here
		// because there isn't an easy hook for the cross domain script tag of jsonp

		processJsonpUrl( requestSettings );

		requestSettings.dataType = 'json';
		if(requestSettings.data && CALLBACK_REGEX.test(requestSettings.data) || CALLBACK_REGEX.test(requestSettings.url)) {
			createJsonpCallback(requestSettings, mockHandler, origSettings);

			// We need to make sure
			// that a JSONP style response is executed properly

			var rurl = /^(\w+:)?\/\/([^\/?#]+)/,
				parts = rurl.exec( requestSettings.url ),
				remote = parts && (parts[1] && parts[1] !== location.protocol || parts[2] !== location.host);

			requestSettings.dataType = 'script';
			if(requestSettings.type.toUpperCase() === 'GET' && remote ) {
				var newMockReturn = processJsonpRequest( requestSettings, mockHandler, origSettings );

				// Check if we are supposed to return a Deferred back to the mock call, or just
				// signal success
				if(newMockReturn) {
					return newMockReturn;
				} else {
					return true;
				}
			}
		}
		return null;
	}

	// Append the required callback parameter to the end of the request URL, for a JSONP request
	function processJsonpUrl( requestSettings ) {
		if ( requestSettings.type.toUpperCase() === 'GET' ) {
			if ( !CALLBACK_REGEX.test( requestSettings.url ) ) {
				requestSettings.url += (/\?/.test( requestSettings.url ) ? '&' : '?') +
					(requestSettings.jsonp || 'callback') + '=?';
			}
		} else if ( !requestSettings.data || !CALLBACK_REGEX.test(requestSettings.data) ) {
			requestSettings.data = (requestSettings.data ? requestSettings.data + '&' : '') + (requestSettings.jsonp || 'callback') + '=?';
		}
	}

	// Process a JSONP request by evaluating the mocked response text
	function processJsonpRequest( requestSettings, mockHandler, origSettings ) {
		logger.debug( mockHandler, ['Performing JSONP request', mockHandler, requestSettings, origSettings] );

		// Synthesize the mock request for adding a script tag
		var callbackContext = origSettings && origSettings.context || requestSettings,
			// If we are running under jQuery 1.5+, return a deferred object
			newMock = ($.Deferred) ? (new $.Deferred()) : null;

		// If the response handler on the moock is a function, call it
		if ( mockHandler.response && $.isFunction(mockHandler.response) ) {

			mockHandler.response(origSettings);


		} else if ( typeof mockHandler.responseText === 'object' ) {
			// Evaluate the responseText javascript in a global context
			$.globalEval( '(' + JSON.stringify( mockHandler.responseText ) + ')');

		} else if (mockHandler.proxy) {
			logger.info( mockHandler, ['Performing JSONP proxy request: ' + mockHandler.proxy, mockHandler] );

			// This handles the unique case where we have a remote URL, but want to proxy the JSONP
			// response to another file (not the same URL as the mock matching)
			_ajax({
				global: false,
				url: mockHandler.proxy,
				type: mockHandler.proxyType,
				data: mockHandler.data,
				dataType: requestSettings.dataType === 'script' ? 'text/plain' : requestSettings.dataType,
				complete: function(xhr) {
					$.globalEval( '(' + xhr.responseText + ')');
					completeJsonpCall( requestSettings, mockHandler, callbackContext, newMock );
				}
			});

			return newMock;

		} else {
			$.globalEval( '(' +
				((typeof mockHandler.responseText === 'string') ?
					('"' + mockHandler.responseText + '"') : mockHandler.responseText) +
			')');
		}

		completeJsonpCall( requestSettings, mockHandler, callbackContext, newMock );

		return newMock;
	}

	function completeJsonpCall( requestSettings, mockHandler, callbackContext, newMock ) {
		var json;

		// Successful response
		setTimeout(function() {
			jsonpSuccess( requestSettings, callbackContext, mockHandler );
			jsonpComplete( requestSettings, callbackContext );

			if ( newMock ) {
				try {
					json = $.parseJSON( mockHandler.responseText );
				} catch (err) { /* just checking... */ }

				newMock.resolveWith( callbackContext, [json || mockHandler.responseText] );
				logger.log( mockHandler, ['JSONP mock call complete', mockHandler, newMock] );
			}
		}, parseResponseTimeOpt( mockHandler.responseTime ));
	}


	// Create the required JSONP callback function for the request
	function createJsonpCallback( requestSettings, mockHandler, origSettings ) {
		var callbackContext = origSettings && origSettings.context || requestSettings;
		var jsonp = (typeof requestSettings.jsonpCallback === 'string' && requestSettings.jsonpCallback) || ('jsonp' + jsc++);

		// Replace the =? sequence both in the query string and the data
		if ( requestSettings.data ) {
			requestSettings.data = (requestSettings.data + '').replace(CALLBACK_REGEX, '=' + jsonp + '$1');
		}

		requestSettings.url = requestSettings.url.replace(CALLBACK_REGEX, '=' + jsonp + '$1');


		// Handle JSONP-style loading
		window[ jsonp ] = window[ jsonp ] || function() {
			jsonpSuccess( requestSettings, callbackContext, mockHandler );
			jsonpComplete( requestSettings, callbackContext );
			// Garbage collect
			window[ jsonp ] = undefined;

			try {
				delete window[ jsonp ];
			} catch(e) {}
		};
		requestSettings.jsonpCallback = jsonp;
	}

	// The JSONP request was successful
	function jsonpSuccess(requestSettings, callbackContext, mockHandler) {
		// If a local callback was specified, fire it and pass it the data
		if ( requestSettings.success ) {
			requestSettings.success.call( callbackContext, mockHandler.responseText || '', 'success', {} );
		}

		// Fire the global callback
		if ( requestSettings.global ) {
			(requestSettings.context ? $(requestSettings.context) : $.event).trigger('ajaxSuccess', [{}, requestSettings]);
		}
	}

	// The JSONP request was completed
	function jsonpComplete(requestSettings, callbackContext) {
		if ( requestSettings.complete ) {
			requestSettings.complete.call( callbackContext, {
				statusText: 'success',
				status: 200
			} , 'success' );
		}

		// The request was completed
		if ( requestSettings.global ) {
			(requestSettings.context ? $(requestSettings.context) : $.event).trigger('ajaxComplete', [{}, requestSettings]);
		}

		// Handle the global AJAX counter
		if ( requestSettings.global && ! --$.active ) {
			$.event.trigger( 'ajaxStop' );
		}
	}


	// The core $.ajax replacement.
	function handleAjax( url, origSettings ) {
		var mockRequest, requestSettings, mockHandler, overrideCallback;

		logger.debug( null, ['Ajax call intercepted', url, origSettings] );

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === 'object' ) {
			origSettings = url;
			url = undefined;
		} else {
			// work around to support 1.5 signature
			origSettings = origSettings || {};
			origSettings.url = url || origSettings.url;
		}

		// Extend the original settings for the request
		requestSettings = $.ajaxSetup({}, origSettings);
		requestSettings.type = requestSettings.method = requestSettings.method || requestSettings.type;

		// Generic function to override callback methods for use with
		// callback options (onAfterSuccess, onAfterError, onAfterComplete)
		overrideCallback = function(action, mockHandler) {
			var origHandler = origSettings[action.toLowerCase()];
			return function() {
				if ( $.isFunction(origHandler) ) {
					origHandler.apply(this, [].slice.call(arguments));
				}
				mockHandler['onAfter' + action]();
			};
		};

		// Iterate over our mock handlers (in registration order) until we find
		// one that is willing to intercept the request
		for(var k = 0; k < mockHandlers.length; k++) {
			if ( !mockHandlers[k] ) {
				continue;
			}

			mockHandler = getMockForRequest( mockHandlers[k], requestSettings );
			if(!mockHandler) {
				logger.debug( mockHandlers[k], ['Mock does not match request', url, requestSettings] );
				// No valid mock found for this request
				continue;
			}

			if ($.mockjaxSettings.retainAjaxCalls) {
				mockedAjaxCalls.push(requestSettings);
			}

			// If logging is enabled, log the mock to the console
			logger.info( mockHandler, [
				'MOCK ' + requestSettings.type.toUpperCase() + ': ' + requestSettings.url,
				$.ajaxSetup({}, requestSettings)
			] );


			if ( requestSettings.dataType && requestSettings.dataType.toUpperCase() === 'JSONP' ) {
				if ((mockRequest = processJsonpMock( requestSettings, mockHandler, origSettings ))) {
					// This mock will handle the JSONP request
					return mockRequest;
				}
			}

			// We are mocking, so there will be no cross domain request, however, jQuery
			// aggressively pursues this if the domains don't match, so we need to
			// explicitly disallow it. (See #136)
			origSettings.crossDomain = false;

			// Removed to fix #54 - keep the mocking data object intact
			//mockHandler.data = requestSettings.data;

			mockHandler.cache = requestSettings.cache;
			mockHandler.timeout = requestSettings.timeout;
			mockHandler.global = requestSettings.global;

			// In the case of a timeout, we just need to ensure
			// an actual jQuery timeout (That is, our reponse won't)
			// return faster than the timeout setting.
			if ( mockHandler.isTimeout ) {
				if ( mockHandler.responseTime > 1 ) {
					origSettings.timeout = mockHandler.responseTime - 1;
				} else {
					mockHandler.responseTime = 2;
					origSettings.timeout = 1;
				}
			}

			// Set up onAfter[X] callback functions
			if ( $.isFunction( mockHandler.onAfterSuccess ) ) {
				origSettings.success = overrideCallback('Success', mockHandler);
			}
			if ( $.isFunction( mockHandler.onAfterError ) ) {
				origSettings.error = overrideCallback('Error', mockHandler);
			}
			if ( $.isFunction( mockHandler.onAfterComplete ) ) {
				origSettings.complete = overrideCallback('Complete', mockHandler);
			}

			copyUrlParameters(mockHandler, origSettings);

			/* jshint loopfunc:true */
			(function(mockHandler, requestSettings, origSettings, origHandler) {

				mockRequest = _ajax.call($, $.extend(true, {}, origSettings, {
					// Mock the XHR object
					xhr: function() { return xhr( mockHandler, requestSettings, origSettings, origHandler ); }
				}));
			})(mockHandler, requestSettings, origSettings, mockHandlers[k]);
			/* jshint loopfunc:false */

			return mockRequest;
		}

		// We don't have a mock request
		logger.log( null, ['No mock matched to request', url, origSettings] );
		if ($.mockjaxSettings.retainAjaxCalls) {
			unmockedAjaxCalls.push(origSettings);
		}
		if($.mockjaxSettings.throwUnmocked === true) {
			throw new Error('AJAX not mocked: ' + origSettings.url);
		}
		else { // trigger a normal request
			return _ajax.apply($, [origSettings]);
		}
	}

	/**
	* Copies URL parameter values if they were captured by a regular expression
	* @param {Object} mockHandler
	* @param {Object} origSettings
	*/
	function copyUrlParameters(mockHandler, origSettings) {
		//parameters aren't captured if the URL isn't a RegExp
		if (!(mockHandler.url instanceof RegExp)) {
			return;
		}
		//if no URL params were defined on the handler, don't attempt a capture
		if (!mockHandler.hasOwnProperty('urlParams')) {
			return;
		}
		var captures = mockHandler.url.exec(origSettings.url);
		//the whole RegExp match is always the first value in the capture results
		if (captures.length === 1) {
			return;
		}
		captures.shift();
		//use handler params as keys and capture resuts as values
		var i = 0,
		capturesLength = captures.length,
		paramsLength = mockHandler.urlParams.length,
		//in case the number of params specified is less than actual captures
		maxIterations = Math.min(capturesLength, paramsLength),
		paramValues = {};
		for (i; i < maxIterations; i++) {
			var key = mockHandler.urlParams[i];
			paramValues[key] = captures[i];
		}
		origSettings.urlParams = paramValues;
	}

	/**
	 * Clears handlers that mock given url
	 * @param url
	 * @returns {Array}
	 */
	function clearByUrl(url) {
		var i, len,
			handler,
			results = [],
			match=url instanceof RegExp ?
				function(testUrl) { return url.test(testUrl); } :
				function(testUrl) { return url === testUrl; };
		for (i=0, len=mockHandlers.length; i<len; i++) {
			handler = mockHandlers[i];
			if (!match(handler.url)) {
				results.push(handler);
			} else {
				logger.log( handler, [
					'Clearing mock: ' + (handler && handler.url),
					handler
				] );
			}
		}
		return results;
	}


	// Public

	$.extend({
		ajax: handleAjax
	});

	var logger = {
		_log: function logger( mockHandler, args, level ) {
			var loggerLevel = $.mockjaxSettings.logging;
			if (mockHandler && typeof mockHandler.logging !== 'undefined') {
				loggerLevel = mockHandler.logging;
			}
			level = ( level === 0 ) ? level : ( level || logLevels.LOG );
			args = (args.splice) ? args : [ args ];

			// Is logging turned off for this mock or mockjax as a whole?
			// Or is this log message above the desired log level?
			if ( loggerLevel === false || loggerLevel < level ) {
				return;
			}

			if ( $.mockjaxSettings.log ) {
				return $.mockjaxSettings.log( mockHandler, args[1] || args[0] );
			} else if ( $.mockjaxSettings.logger && $.mockjaxSettings.logger[$.mockjaxSettings.logLevelMethods[level]] ) {
				return $.mockjaxSettings.logger[$.mockjaxSettings.logLevelMethods[level]].apply( $.mockjaxSettings.logger, args );
			}
		},
		/**
		 * Convenience method for logging a DEBUG level message
		 * @param  {Object} m  The mock handler in question
		 * @param  {Array|String|Object} a  The items to log
		 * @return {?}  Will return whatever the $.mockjaxSettings.logger method for this level would return (generally 'undefined')
		 */
		debug: function(m,a) { return logger._log(m,a,logLevels.DEBUG); },
		/**
		 * @see logger.debug
		 */
		log: function(m,a) { return logger._log(m,a,logLevels.LOG); },
		/**
		 * @see logger.debug
		 */
		info: function(m,a) { return logger._log(m,a,logLevels.INFO); },
		/**
		 * @see logger.debug
		 */
		warn: function(m,a) { return logger._log(m,a,logLevels.WARN); },
		/**
		 * @see logger.debug
		 */
		error: function(m,a) { return logger._log(m,a,logLevels.ERROR); }
	};

	var logLevels = {
		DEBUG: 4,
		LOG: 3,
		INFO: 2,
		WARN: 1,
		ERROR: 0
	};

	/**
	 * Default settings for mockjax. Some of these are used for defaults of
	 * individual mock handlers, and some are for the library as a whole.
	 * For individual mock handler settings, please see the README on the repo:
	 * https://github.com/jakerella/jquery-mockjax#api-methods
	 *
	 * @type {Object}
	 */
	$.mockjaxSettings = {
		log:				null, // this is only here for historical purposes... use $.mockjaxSettings.logger
		logger:				window.console,
		logging:			2,
		logLevelMethods:	['error', 'warn', 'info', 'log', 'debug'],
		namespace:			null,
		status:				200,
		statusText:			'OK',
		responseTime:		DEFAULT_RESPONSE_TIME,
		isTimeout:			false,
		throwUnmocked:		false,
		retainAjaxCalls:	true,
		contentType:		'text/plain',
		response:			'',
		responseText:		'',
		responseXML:		'',
		proxy:				'',
		proxyType:			'GET',

		lastModified:		null,
		etag:				'',
		headers:			{
								etag: 'IJF@H#@923uf8023hFO@I#H#',
								'content-type' : 'text/plain'
							}
	};

	/**
	 * Create a new mock Ajax handler. When a mock handler is matched during a
	 * $.ajax() call this library will intercept that request and fake a response
	 * using the data and methods in the mock. You can see all settings in the
	 * README of the main repository:
	 * https://github.com/jakerella/jquery-mockjax#api-methods
	 *
	 * @param  {Object} settings The mock handelr settings: https://github.com/jakerella/jquery-mockjax#api-methods
	 * @return {Number}		  The id (index) of the mock handler suitable for clearing (see $.mockjax.clear())
	 */
	$.mockjax = function(settings) {
		// Multiple mocks.
		if ( $.isArray(settings) ) {
			return $.map(settings, function(s) {
				return $.mockjax(s);
			});
		}

		var i = mockHandlers.length;
		mockHandlers[i] = settings;
		logger.log( settings, ['Created new mock handler', settings] );
		return i;
	};

	$.mockjax._logger = logger;

	/**
	 * Remove an Ajax mock from those held in memory. This will prevent any
	 * future Ajax request mocking for matched requests.
	 * NOTE: Clearing a mock will not prevent the resolution of in progress requests
	 *
	 * @param  {Number|String|RegExp} i  OPTIONAL The mock to clear. If not provided, all mocks are cleared,
	 *                                   if a number it is the index in the in-memory cache. If a string or
	 *                                   RegExp, find a mock that matches that URL and clear it.
	 * @return {void}
	 */
	$.mockjax.clear = function(i) {
		if ( typeof i === 'string' || i instanceof RegExp) {
			mockHandlers = clearByUrl(i);
		} else if ( i || i === 0 ) {
			logger.log( mockHandlers[i], [
				'Clearing mock: ' + (mockHandlers[i] && mockHandlers[i].url),
				mockHandlers[i]
			] );
			mockHandlers[i] = null;
		} else {
			logger.log( null, 'Clearing all mocks' );
			mockHandlers = [];
		}
		mockedAjaxCalls = [];
		unmockedAjaxCalls = [];
	};

	/**
	 * By default all Ajax requests performed after loading Mockjax are recorded
	 * so that we can see which requests were mocked and which were not. This
	 * method allows the developer to clear those retained requests.
	 *
	 * @return {void}
	 */
	$.mockjax.clearRetainedAjaxCalls = function() {
		mockedAjaxCalls = [];
		unmockedAjaxCalls = [];
		logger.debug( null, 'Cleared retained ajax calls' );
	};

	/**
	 * Retrive the mock handler with the given id (index).
	 *
	 * @param  {Number} i  The id (index) to retrieve
	 * @return {Object}	The mock handler settings
	 */
	$.mockjax.handler = function(i) {
		if ( arguments.length === 1 ) {
			return mockHandlers[i];
		}
	};

	/**
	 * Retrieve all Ajax calls that have been mocked by this library during the
	 * current session (in other words, only since you last loaded this file).
	 *
	 * @return {Array}  The mocked Ajax calls (request settings)
	 */
	$.mockjax.mockedAjaxCalls = function() {
		return mockedAjaxCalls;
	};

	/**
	 * Return all mock handlers that have NOT been matched against Ajax requests
	 *
	 * @return {Array}  The mock handlers
	 */
	$.mockjax.unfiredHandlers = function() {
		var results = [];
		for (var i=0, len=mockHandlers.length; i<len; i++) {
			var handler = mockHandlers[i];
			if (handler !== null && !handler.fired) {
				results.push(handler);
			}
		}
		return results;
	};

	/**
	 * Retrieve all Ajax calls that have NOT been mocked by this library during
	 * the current session (in other words, only since you last loaded this file).
	 *
	 * @return {Array}  The mocked Ajax calls (request settings)
	 */
	$.mockjax.unmockedAjaxCalls = function() {
		return unmockedAjaxCalls;
	};

	return $.mockjax;

}));
