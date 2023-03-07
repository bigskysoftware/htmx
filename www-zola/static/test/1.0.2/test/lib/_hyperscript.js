//AMD insanity
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root._hyperscript = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    return (function () {
            'use strict';

            //====================================================================
            // Utilities
            //====================================================================

            function mergeObjects(obj1, obj2) {
                for (var key in obj2) {
                    if (obj2.hasOwnProperty(key)) {
                        obj1[key] = obj2[key];
                    }
                }
                return obj1;
            }

            function parseJSON(jString) {
                try {
                    return JSON.parse(jString);
                } catch(error) {
                    logError(error);
                    return null;
                }
            }

            function logError(msg) {
                if(console.error) {
                    console.error(msg);
                } else if (console.log) {
                    console.log("ERROR: ", msg);
                }
            }

            //====================================================================
            // Lexer
            //====================================================================
            var _lexer = function () {
                var OP_TABLE = {
                    '+': 'PLUS',
                    '-': 'MINUS',
                    '*': 'MULTIPLY',
                    '/': 'DIVIDE',
                    '.': 'PERIOD',
                    '\\': 'BACKSLASH',
                    ':': 'COLON',
                    '%': 'PERCENT',
                    '|': 'PIPE',
                    '!': 'EXCLAMATION',
                    '?': 'QUESTION',
                    '#': 'POUND',
                    '&': 'AMPERSAND',
                    ';': 'SEMI',
                    ',': 'COMMA',
                    '(': 'L_PAREN',
                    ')': 'R_PAREN',
                    '<': 'L_ANG',
                    '>': 'R_ANG',
                    '<=': 'LTE_ANG',
                    '>=': 'GTE_ANG',
                    '==': 'EQ',
                    '===': 'EQQ',
                    '!=': 'NEQ',
                    '!==': 'NEQQ',
                    '{': 'L_BRACE',
                    '}': 'R_BRACE',
                    '[': 'L_BRACKET',
                    ']': 'R_BRACKET',
                    '=': 'EQUALS'
                };

                function isValidCSSClassChar(c) {
                    return isAlpha(c) || isNumeric(c) || c === "-" || c === "_";
                }

                function isValidCSSIDChar(c) {
                    return isAlpha(c) || isNumeric(c) || c === "-" || c === "_" || c === ":";
                }

                function isWhitespace(c) {
                    return c === " " || c === "\t" || isNewline(c);
                }

                function positionString(token) {
                    return "[Line: " + token.line + ", Column: " + token.col + "]"
                }

                function isNewline(c) {
                    return c === '\r' || c === '\n';
                }

                function isNumeric(c) {
                    return c >= '0' && c <= '9';
                }

                function isAlpha(c) {
                    return (c >= 'a' && c <= 'z') ||
                        (c >= 'A' && c <= 'Z');
                }

                function isIdentifierChar(c) {
                    return (c === "_" || c === "$");
                }


                function makeTokensObject(tokens, consumed, source) {

                    var ignoreWhiteSpace = true;
                    matchTokenType("WHITESPACE"); // consume any initial whitespace

                    function raiseError(tokens, error) {
                        _parser.raiseParseError(tokens, error);
                    }

                    function requireOpToken(value) {
                        var token = matchOpToken(value);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value + "' but found '" + currentToken().value + "'");
                        }
                    }

                    function matchAnyOpToken(op1, op2, op3) {
                        for (var i = 0; i < arguments.length; i++) {
                            var opToken = arguments[i];
                            var match = matchOpToken(opToken);
                            if (match) {
                                return match;
                            }
                        }
                    }

                    function matchOpToken(value) {
                        if (currentToken() && currentToken().op && currentToken().value === value) {
                            return consumeToken();
                        }
                    }

                    function requireTokenType(type1, type2, type3, type4) {
                        var token = matchTokenType(type1, type2, type3, type4);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected one of " + JSON.stringify([type1, type2, type3]));
                        }
                    }

                    function matchTokenType(type1, type2, type3, type4) {
                        if (currentToken() && currentToken().type && [type1, type2, type3, type4].indexOf(currentToken().type) >= 0) {
                            return consumeToken();
                        }
                    }

                    function requireToken(value, type) {
                        var token = matchToken(value, type);
                        if (token) {
                            return token;
                        } else {
                            raiseError(this, "Expected '" + value + "' but found '" + currentToken().value + "'");
                        }
                    }

                    function matchToken(value, type) {
                        var type = type || "IDENTIFIER";
                        if (currentToken() && currentToken().value === value && currentToken().type === type) {
                            return consumeToken();
                        }
                    }

                    function consumeToken() {
                        var match = tokens.shift();
                        consumed.push(match);
                        if(ignoreWhiteSpace) {
                            matchTokenType("WHITESPACE"); // consume any whitespace until the next token
                        }
                        return match;
                    }

                    function consumeUntilWhitespace() {
                        var tokenList = [];
                        ignoreWhiteSpace = false;
                        while (currentToken() && currentToken().type !== "WHITESPACE") {
                            tokenList.push(consumeToken());
                        }
                        ignoreWhiteSpace = true;
                        return tokenList;
                    }

                    function hasMore() {
                        return tokens.length > 0;
                    }

                    function currentToken() {
                        return tokens[0];
                    }

                    return {
                        matchAnyOpToken: matchAnyOpToken,
                        matchOpToken: matchOpToken,
                        requireOpToken: requireOpToken,
                        matchTokenType: matchTokenType,
                        requireTokenType: requireTokenType,
                        consumeToken: consumeToken,
                        matchToken: matchToken,
                        requireToken: requireToken,
                        list: tokens,
                        source: source,
                        hasMore: hasMore,
                        currentToken: currentToken,
                        consumeUntilWhitespace: consumeUntilWhitespace
                    }
                }

                function tokenize(string) {
                    var source = string;
                    var tokens = [];
                    var position = 0;
                    var column = 0;
                    var line = 1;
                    var lastToken = "<START>";

                    while (position < source.length) {
                        if (currentChar() === "-" && nextChar() === "-") {
                            consumeComment();
                        } else {
                            if (isWhitespace(currentChar())) {
                                tokens.push(consumeWhitespace());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "." && isAlpha(nextChar())) {
                                tokens.push(consumeClassReference());
                            } else if (!possiblePrecedingSymbol() && currentChar() === "#" && isAlpha(nextChar())) {
                                tokens.push(consumeIdReference());
                            } else if (isAlpha(currentChar()) || isIdentifierChar(currentChar())) {
                                tokens.push(consumeIdentifier());
                            } else if (isNumeric(currentChar())) {
                                tokens.push(consumeNumber());
                            } else if (currentChar() === '"' || currentChar() === "'") {
                                tokens.push(consumeString());
                            } else if (OP_TABLE[currentChar()]) {
                                tokens.push(consumeOp());
                            } else {
                                if (position < source.length) {
                                    throw Error("Unknown token: " + currentChar() + " ");
                                }
                            }
                        }
                    }

                    return makeTokensObject(tokens, [], source);

                    function makeOpToken(type, value) {
                        var token = makeToken(type, value);
                        token.op = true;
                        return token;
                    }

                    function makeToken(type, value) {
                        return {
                            type: type,
                            value: value,
                            start: position,
                            end: position + 1,
                            column: column,
                            line: line
                        };
                    }

                    function consumeComment() {
                        while (currentChar() && !isNewline(currentChar())) {
                            consumeChar();
                        }
                        consumeChar();
                    }

                    function consumeClassReference() {
                        var classRef = makeToken("CLASS_REF");
                        var value = consumeChar();
                        while (isValidCSSClassChar(currentChar())) {
                            value += consumeChar();
                        }
                        classRef.value = value;
                        classRef.end = position;
                        return classRef;
                    }


                    function consumeIdReference() {
                        var idRef = makeToken("ID_REF");
                        var value = consumeChar();
                        while (isValidCSSIDChar(currentChar())) {
                            value += consumeChar();
                        }
                        idRef.value = value;
                        idRef.end = position;
                        return idRef;
                    }

                    function consumeIdentifier() {
                        var identifier = makeToken("IDENTIFIER");
                        var value = consumeChar();
                        while (isAlpha(currentChar()) || isIdentifierChar(currentChar())) {
                            value += consumeChar();
                        }
                        identifier.value = value;
                        identifier.end = position;
                        return identifier;
                    }

                    function consumeNumber() {
                        var number = makeToken("NUMBER");
                        var value = consumeChar();
                        while (isNumeric(currentChar())) {
                            value += consumeChar();
                        }
                        if (currentChar() === ".") {
                            value += consumeChar();
                        }
                        while (isNumeric(currentChar())) {
                            value += consumeChar();
                        }
                        number.value = value;
                        number.end = position;
                        return number;
                    }

                    function consumeOp() {
                        var value = consumeChar(); // consume leading char
                        while (currentChar() && OP_TABLE[value + currentChar()]) {
                            value += consumeChar();
                        }
                        var op = makeOpToken(OP_TABLE[value], value);
                        op.value = value;
                        op.end = position;
                        return op;
                    }

                    function consumeString() {
                        var string = makeToken("STRING");
                        var startChar = consumeChar(); // consume leading quote
                        var value = "";
                        while (currentChar() && currentChar() !== startChar) {
                            if (currentChar() === "\\") {
                                consumeChar(); // consume escape char and move on
                            }
                            value += consumeChar();
                        }
                        if (currentChar() !== startChar) {
                            throw Error("Unterminated string at " + positionString(string));
                        } else {
                            consumeChar(); // consume final quote
                        }
                        string.value = value;
                        string.end = position;
                        return string;
                    }

                    function currentChar() {
                        return source.charAt(position);
                    }

                    function nextChar() {
                        return source.charAt(position + 1);
                    }

                    function consumeChar() {
                        lastToken = currentChar();
                        position++;
                        column++;
                        return lastToken;
                    }

                    function possiblePrecedingSymbol() {
                        return isAlpha(lastToken) || isNumeric(lastToken) || lastToken === ")" || lastToken === "}" || lastToken === "]"
                    }

                    function consumeWhitespace() {
                        var whitespace = makeToken("WHITESPACE");
                        var value = "";
                        while (currentChar() && isWhitespace(currentChar())) {
                            if (isNewline(currentChar())) {
                                column = 0;
                                line++;
                            }
                            value += consumeChar();
                        }
                        whitespace.value = value;
                        whitespace.end = position;
                        return whitespace;
                    }
                }

                return {
                    tokenize: tokenize
                }
            }();

            //====================================================================
            // Parser
            //====================================================================
            var _parser = function () {

                var GRAMMAR = {}

                function addGrammarElement(name, definition) {
                    GRAMMAR[name] = definition;
                }

                function createParserContext(tokens) {
                    var currentToken = tokens.currentToken();
                    var source = tokens.source;
                    var lines = source.split("\n");
                    var line = currentToken ? currentToken.line - 1 : lines.length - 1;
                    var contextLine = lines[line];
                    var offset = currentToken ? currentToken.column : contextLine.length - 1;
                    return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
                }

                function raiseParseError(tokens, message) {
                    message = (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" +
                        createParserContext(tokens);
                    var error = new Error(message);
                    error.tokens = tokens;
                    throw error
                }

                function parseElement(type, tokens, root) {
                    var expressionDef = GRAMMAR[type];
                    if (expressionDef) return expressionDef(_parser, tokens, root);
                }

                function parseAnyOf(types, tokens) {
                    for (var i = 0; i < types.length; i++) {
                        var type = types[i];
                        var expression = parseElement(type, tokens);
                        if (expression) {
                            return expression;
                        }
                    }
                }

                function parseHyperScript(tokens) {
                    return parseElement("hyperscript", tokens)
                }

                function transpile(node, defaultVal) {
                    if (node == null) {
                        return defaultVal;
                    }
                    var src = node.transpile();
                    if (node.next) {
                        return src + "\n" + transpile(node.next)
                    } else {
                        return src;
                    }
                }

                return {
                    // parser API
                    parseElement: parseElement,
                    parseAnyOf: parseAnyOf,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addGrammarElement: addGrammarElement,
                    transpile: transpile
                }
            }();

            //====================================================================
            // Runtime
            //====================================================================
            var _runtime = function () {

                function matchesSelector(elt, selector) {
                    // noinspection JSUnresolvedVariable
                    var matchesFunction = elt.matches ||
                        elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                        || elt.webkitMatchesSelector || elt.oMatchesSelector;
                    return matchesFunction && matchesFunction.call(elt, selector);
                }

                function makeEvent(eventName, detail) {
                    var evt;
                    if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                        evt = new CustomEvent(eventName, {bubbles: true, cancelable: true, detail: detail});
                    } else {
                        evt = document.createEvent('CustomEvent');
                        evt.initCustomEvent(eventName, true, true, detail);
                    }
                    return evt;
                }

                function triggerEvent(elt, eventName, detail) {
                    var detail = detail || {};
                    detail["sentBy"] = elt;
                    var event = makeEvent(eventName, detail);
                    var eventResult = elt.dispatchEvent(event);
                    return eventResult;
                }

                function forEach(arr, func) {
                    if (arr.length) {
                        for (var i = 0; i < arr.length; i++) {
                            func(arr[i]);
                        }
                    } else {
                        func(arr);
                    }
                }

                function evalTarget(root, path) {
                    if (root.length) {
                        var last = root;
                    } else {
                        var last = [root];
                    }

                    while (path.length > 0) {
                        var prop = path.shift();
                        var next = []
                        // flat map
                        for (var i = 0; i < last.length; i++) {
                            var element = last[i];
                            var nextVal = element[prop];
                            if (nextVal && nextVal.length) {
                                next = next.concat(nextVal);
                            } else {
                                next.push(nextVal);
                            }
                        }
                        last = next;
                    }

                    return last;
                }

                var _scriptAttrs = null;
                function getScriptAttributes() {
                    if (_scriptAttrs == null) {
                        _scriptAttrs = _hyperscript.config.attributes.replace(/ /g,'').split(",")
                    }
                    return _scriptAttrs;
                }

                function getScript(elt) {
                    for (var i = 0; i < getScriptAttributes().length; i++) {
                        var scriptAttribute = getScriptAttributes()[i];
                        if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
                            return elt.getAttribute(scriptAttribute)
                        }
                    }
                    return null;
                }

                function applyEventListeners(hypeScript, elt) {
                    forEach(hypeScript.eventListeners, function (eventListener) {
                        eventListener(elt);
                    });
                }

                function getScriptSelector() {
                    return getScriptAttributes().map(function (attribute) {
                        return "[" + attribute + "]";
                    }).join(", ");
                }

                function isType(o, type) {
                    return Object.prototype.toString.call(o) === "[object " + type + "]";
                }

                function evaluate(typeOrSrc, srcOrCtx, ctxArg) {
                    if (isType(srcOrCtx, "Object")) {
                        var src = typeOrSrc;
                        var ctx = srcOrCtx;
                        var type = "expression"
                    } else if (isType(srcOrCtx, "String")) {
                        var src = srcOrCtx;
                        var type = typeOrSrc
                        var ctx = ctxArg;
                    } else {
                        var src = typeOrSrc;
                        var ctx = {};
                        var type = "expression";
                    }
                    ctx = ctx || {};
                    var compiled = _parser.parseElement(type, _lexer.tokenize(src) ).transpile();
                    var evalString = "(function(" + Object.keys(ctx).join(",") + "){return " + compiled + "})";
                    var args = Object.keys(ctx).map(function (key) {
                        return ctx[key]
                    });
                    return eval(evalString).apply(null, args);
                }

                function processNode(elt) {
                    var selector = _runtime.getScriptSelector();
                    if (matchesSelector(elt, selector)) {
                        initElement(elt);
                    }
                    forEach(elt.querySelectorAll(selector), function (elt) {
                        initElement(elt);
                    })
                }

                function initElement(elt) {
                    var internalData = getInternalData(elt);
                    if (!internalData.initialized) {
                        var src = getScript(elt);
                        if (src) {
                            internalData.initialized = true;
                            internalData.script = src;
                            var tokens = _lexer.tokenize(src);
                            var hyperScript = _parser.parseHyperScript(tokens);
                            var transpiled = _parser.transpile(hyperScript);
                            if (elt.getAttribute('debug') === "true") {
                                console.log(transpiled);
                            }
                            var hyperscriptObj = eval(transpiled);
                            hyperscriptObj.applyEventListenersTo(elt);
                        }
                    }
                }

                function getInternalData(elt) {
                    var dataProp = 'hyperscript-internal-data';
                    var data = elt[dataProp];
                    if (!data) {
                        data = elt[dataProp] = {};
                    }
                    return data;
                }


                function ajax(method, url, callback, data) {
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        callback(this.response, xhr);
                    };
                    xhr.open(method, url);
                    xhr.send(JSON.stringify(data));
                }

                function typeCheck(value, typeString, nullOk) {
                    if (value == null && nullOk) {
                        return value;
                    }
                    var typeName = Object.prototype.toString.call(value).slice(8, -1);
                    var typeCheckValue = value && typeName === typeString;
                    if (typeCheckValue) {
                        return value;
                    } else {
                        throw new Error("Typecheck failed!  Expected: " + typeString + ", Found: " + typeName);
                    }
                }

                return {
                    typeCheck: typeCheck,
                    forEach: forEach,
                    evalTarget: evalTarget,
                    triggerEvent: triggerEvent,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    applyEventListeners: applyEventListeners,
                    processNode: processNode,
                    evaluate: evaluate,
                    getScriptSelector: getScriptSelector,
                    ajax: ajax,
                }
            }();

            //====================================================================
            // Grammar
            //====================================================================
            {
                _parser.addGrammarElement("parenthesized", function (parser, tokens) {
                    if (tokens.matchOpToken('(')) {
                        var expr = parser.parseElement("expression", tokens);
                        tokens.requireOpToken(")");
                        return {
                            type: "parenthesized",
                            expr: expr,
                            transpile: function () {
                                return "(" + parser.transpile(expr) + ")";
                            }
                        }
                    }
                })

                _parser.addGrammarElement("string", function (parser, tokens) {
                    var stringToken = tokens.matchTokenType('STRING');
                    if (stringToken) {
                        return {
                            type: "string",
                            token: stringToken,
                            transpile: function () {
                                if (stringToken.value.indexOf("'") === 0) {
                                    return "'" + stringToken.value + "'";
                                } else {
                                    return '"' + stringToken.value + '"';
                                }
                            }
                        }
                    }
                })

                _parser.addGrammarElement("nakedString", function (parser, tokens) {
                    if (tokens.hasMore()) {
                        var tokenArr = tokens.consumeUntilWhitespace();
                        tokens.matchTokenType("WHITESPACE");
                        return {
                            type: "nakedString",
                            tokens: tokenArr,
                            transpile: function () {
                                return "'" + tokenArr.map(function (t) {
                                    return t.value
                                }).join("") + "'";
                            }
                        }
                    }
                })

                _parser.addGrammarElement("number", function (parser, tokens) {
                    var number = tokens.matchTokenType('NUMBER');
                    if (number) {
                        var numberToken = number;
                        var value = parseFloat(number.value)
                        return {
                            type: "number",
                            value: value,
                            numberToken: numberToken,
                            transpile: function () {
                                return numberToken.value;
                            }
                        }
                    }
                })

                _parser.addGrammarElement("idRef", function (parser, tokens) {
                    var elementId = tokens.matchTokenType('ID_REF');
                    if (elementId) {
                        return {
                            type: "idRef",
                            value: elementId.value.substr(1),
                            transpile: function () {
                                return "document.getElementById('" + this.value + "')"
                            }
                        };
                    }
                })

                _parser.addGrammarElement("classRef", function (parser, tokens) {
                    var classRef = tokens.matchTokenType('CLASS_REF');
                    if (classRef) {
                        return {
                            type: "classRef",
                            value: classRef.value,
                            className: function () {
                                return this.value.substr(1);
                            },
                            transpile: function () {
                                return "document.querySelectorAll('" + this.value + "')"
                            }
                        };
                    }
                })

                _parser.addGrammarElement("attributeRef", function (parser, tokens) {
                    if (tokens.matchOpToken("[")) {
                        var name = tokens.matchTokenType("IDENTIFIER");
                        var value = null;
                        if (tokens.matchOpToken("=")) {
                            value = parser.parseElement("expression", tokens);
                        }
                        tokens.requireOpToken("]");
                        return {
                            type: "attribute_expression",
                            name: name.value,
                            value: value,
                            transpile: function () {
                                if (this.value) {
                                    return "({name: '" + this.name + "', value: " + parser.transpile(this.value) + "})";
                                } else {
                                    return "({name: '" + this.name + "'})";
                                }
                            }
                        }
                    }
                })

                _parser.addGrammarElement("objectLiteral", function (parser, tokens) {
                    if (tokens.matchOpToken("{")) {
                        var fields = []
                        if (!tokens.matchOpToken("}")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER");
                                tokens.requireOpToken(":");
                                var value = parser.parseElement("expression", tokens);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("}");
                        }
                        return {
                            type: "objectLiteral",
                            fields: fields,
                            transpile: function () {
                                return "({" + fields.map(function (field) {
                                    return field.name.value + ":" + parser.transpile(field.value)
                                }).join(", ") + "})";
                            }
                        }
                    }


                })

                _parser.addGrammarElement("namedArgumentList", function (parser, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var fields = []
                        if (!tokens.matchOpToken(")")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER");
                                tokens.requireOpToken(":");
                                var value = parser.parseElement("expression", tokens);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }
                        return {
                            type: "namedArgumentList",
                            fields: fields,
                            transpile: function () {
                                return "({_namedArgList_:true, " + fields.map(function (field) {
                                    return field.name.value + ":" + parser.transpile(field.value)
                                }).join(", ") + "})";
                            }
                        }
                    }


                })

                _parser.addGrammarElement("symbol", function (parser, tokens) {
                    var identifier = tokens.matchTokenType('IDENTIFIER');
                    if (identifier) {
                        return {
                            type: "symbol",
                            name: identifier.value,
                            transpile: function () {
                                return identifier.value;
                            }
                        };
                    }
                });

                _parser.addGrammarElement("implicitMeTarget", function (parser, tokens) {
                    return {
                        type: "implicitMeTarget",
                        transpile: function () {
                            return "[me]"
                        }
                    };
                });

                _parser.addGrammarElement("implicitAllTarget", function (parser, tokens) {
                    return {
                        type: "implicitAllTarget",
                        transpile: function () {
                            return 'document.querySelectorAll("*")';
                        }
                    };
                });

                _parser.addGrammarElement("millisecondLiteral", function (parser, tokens) {
                    var number = tokens.requireTokenType(tokens, "NUMBER");
                    var factor = 1;
                    if (tokens.matchToken("s")) {
                        factor = 1000;
                    } else if (tokens.matchToken("ms")) {
                        // do nothing
                    }
                    return {
                        type: "millisecondLiteral",
                        number: number,
                        factor: factor,
                        transpile: function () {
                            return factor * parseFloat(this.number.value);
                        }
                    };
                });

                _parser.addGrammarElement("boolean", function (parser, tokens) {
                    var booleanLiteral = tokens.matchToken("true") || tokens.matchToken("false");
                    if (booleanLiteral) {
                        return {
                            type: "boolean",
                            transpile: function () {
                                return booleanLiteral.value;
                            }
                        }
                    }
                });

                _parser.addGrammarElement("null", function (parser, tokens) {
                    if (tokens.matchToken('null')) {
                        return {
                            type: "null",
                            transpile: function () {
                                return "null";
                            }
                        }
                    }
                });

                _parser.addGrammarElement("arrayLiteral", function (parser, tokens) {
                    if (tokens.matchOpToken('[')) {
                        var values = [];
                        if (!tokens.matchOpToken(']')) {
                            do {
                                var expr = parser.parseElement("expression", tokens);
                                if (expr == null) {
                                    parser.raiseParseError(tokens, "Expected an expression");
                                }
                                values.push(expr);
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("]");
                        }
                        return {
                            type: "arrayLiteral",
                            values: values,
                            transpile: function () {
                                return "[" + values.map(function (v) {
                                    return parser.transpile(v)
                                }).join(", ") + "]";
                            }
                        }
                    }
                });

                _parser.addGrammarElement("blockLiteral", function (parser, tokens) {
                    if (tokens.matchOpToken('\\')) {
                        var args = []
                        var arg1 = tokens.matchTokenType("IDENTIFIER");
                        if (arg1) {
                            args.push(arg1);
                            while (tokens.matchOpToken(",")) {
                                args.push(tokens.requireTokenType("IDENTIFIER"));
                            }
                        }
                        // TODO compound op token
                        tokens.requireOpToken("-");
                        tokens.requireOpToken(">");
                        var expr = parser.parseElement("expression", tokens);
                        if (expr == null) {
                            parser.raiseParseError(tokens, "Expected an expression");
                        }
                        return {
                            type: "blockLiteral",
                            args: args,
                            expr: expr,
                            transpile: function () {
                                return "function(" + args.map(function (arg) {
                                        return arg.value
                                    }).join(", ") + "){ return " +
                                    parser.transpile(expr) + " }";
                            }
                        }
                    }
                });

                _parser.addGrammarElement("leaf", function (parser, tokens) {
                    return parser.parseAnyOf(["parenthesized", "boolean", "null", "string", "number", "idRef", "classRef", "symbol", "propertyRef", "objectLiteral", "arrayLiteral", "blockLiteral"], tokens)
                });

                _parser.addGrammarElement("propertyAccess", function (parser, tokens, root) {
                    if (tokens.matchOpToken(".")) {
                        var prop = tokens.requireTokenType("IDENTIFIER");
                        var propertyAccess = {
                            type: "propertyAccess",
                            root: root,
                            prop: prop,
                            transpile: function () {
                                return parser.transpile(root) + "." + prop.value;
                            }
                        };
                        return _parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addGrammarElement("functionCall", function (parser, tokens, root) {
                    if (tokens.matchOpToken("(")) {
                        var args = [];
                        if (!tokens.matchOpToken(')')) {
                            do {
                                args.push(parser.parseElement("expression", tokens));
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }
                        var functionCall = {
                            type: "functionCall",
                            root: root,
                            args: args,
                            transpile: function () {
                                return parser.transpile(root) + "(" + args.map(function (arg) {
                                    return parser.transpile(arg)
                                }).join(",") + ")"
                            }
                        };
                        return _parser.parseElement("indirectExpression", tokens, functionCall);
                    }
                });

                _parser.addGrammarElement("indirectExpression", function (parser, tokens, root) {
                    var propAccess = parser.parseElement("propertyAccess", tokens, root);
                    if (propAccess) {
                        return propAccess;
                    }

                    var functionCall = parser.parseElement("functionCall", tokens, root);
                    if (functionCall) {
                        return functionCall;
                    }

                    return root;
                });

                _parser.addGrammarElement("primaryExpression", function (parser, tokens) {
                    var leaf = parser.parseElement("leaf", tokens);
                    if (leaf) {
                        return parser.parseElement("indirectExpression", tokens, leaf);
                    }
                    parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
                });

                _parser.addGrammarElement("postfixExpression", function (parser, tokens) {
                    var root = parser.parseElement("primaryExpression", tokens);
                    if (tokens.matchOpToken(":")) {
                        var typeName = tokens.requireTokenType("IDENTIFIER");
                        var nullOk = !tokens.matchOpToken("!");
                        return {
                            type: "typeCheck",
                            typeName: typeName,
                            root: root,
                            nullOk: nullOk,
                            transpile: function () {
                                return "_hyperscript.runtime.typeCheck(" + parser.transpile(root) + ", '" + typeName.value + "', " + nullOk + ")";
                            }
                        }
                    } else {
                        return root;
                    }
                });

                _parser.addGrammarElement("logicalNot", function (parser, tokens) {
                    if (tokens.matchToken("not")) {
                        var root = parser.parseElement("unaryExpression", tokens);
                        return {
                            type: "logicalNot",
                            root: root,
                            transpile: function () {
                                return "!" + parser.transpile(root);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("negativeNumber", function (parser, tokens) {
                    if (tokens.matchOpToken("-")) {
                        var root = parser.parseElement("unaryExpression", tokens);
                        return {
                            type: "negativeNumber",
                            root: root,
                            transpile: function () {
                                return "-" + parser.transpile(root);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("unaryExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["logicalNot", "negativeNumber", "postfixExpression"], tokens);
                });

                _parser.addGrammarElement("mathOperator", function (parser, tokens) {
                    var expr = parser.parseElement("unaryExpression", tokens);
                    var mathOp, initialMathOp = null;
                    mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    while (mathOp) {
                        initialMathOp = initialMathOp || mathOp;
                        if (initialMathOp.value !== mathOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize math operations with different operators")
                        }
                        var rhs = parser.parseElement("unaryExpression", tokens);
                        expr = {
                            type: "mathOperator",
                            operator: mathOp.value,
                            lhs: expr,
                            rhs: rhs,
                            transpile: function () {
                                return parser.transpile(this.lhs) + " " + this.operator + " " + parser.transpile(this.rhs);
                            }
                        }
                        mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    }
                    return expr;
                });

                _parser.addGrammarElement("mathExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
                });

                _parser.addGrammarElement("comparisonOperator", function (parser, tokens) {
                    var expr = parser.parseElement("mathExpression", tokens);
                    var comparisonOp, initialComparisonOp = null;
                    comparisonOp = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==")
                    while (comparisonOp) {
                        initialComparisonOp = initialComparisonOp || comparisonOp;
                        if (initialComparisonOp.value !== comparisonOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize comparison operations with different operators")
                        }
                        var rhs = parser.parseElement("mathExpression", tokens);
                        expr = {
                            type: "comparisonOperator",
                            operator: comparisonOp.value,
                            lhs: expr,
                            rhs: rhs,
                            transpile: function () {
                                return parser.transpile(this.lhs) + " " + this.operator + " " + parser.transpile(this.rhs);
                            }
                        }
                        comparisonOp = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==")
                    }
                    return expr;
                });

                _parser.addGrammarElement("comparisonExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("logicalOperator", function (parser, tokens) {
                    var expr = parser.parseElement("comparisonExpression", tokens);
                    var logicalOp, initialLogicalOp = null;
                    logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    while (logicalOp) {
                        initialLogicalOp = initialLogicalOp || logicalOp;
                        if (initialLogicalOp.value !== logicalOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize logical operations with different operators")
                        }
                        var rhs = parser.parseElement("comparisonExpression", tokens);
                        expr = {
                            type: "logicalOperator",
                            operator: logicalOp.value,
                            lhs: expr,
                            rhs: rhs,
                            transpile: function () {
                                return parser.transpile(this.lhs) + " " + (this.operator === "and" ? " && " : " || ") + " " + parser.transpile(this.rhs);
                            }
                        }
                        logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    }
                    return expr;
                });

                _parser.addGrammarElement("logicalExpression", function (parser, tokens) {
                    return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("expression", function (parser, tokens) {
                    return parser.parseElement("logicalExpression", tokens);
                });

                _parser.addGrammarElement("target", function (parser, tokens) {
                    var root = parser.parseAnyOf(["symbol", "classRef", "idRef"], tokens);
                    if (root == null) {
                        parser.raiseParseError(tokens, "Expected a valid target expression");
                    }

                    var propPath = []
                    while (tokens.matchOpToken(".")) {
                        propPath.push(tokens.requireTokenType("IDENTIFIER").value)
                    }

                    return {
                        type: "target",
                        propPath: propPath,
                        root: root,
                        transpile: function () {
                            return "_hyperscript.runtime.evalTarget(" + parser.transpile(root) + ", [" + propPath.map(function (prop) {
                                return "\"" + prop + "\""
                            }).join(", ") + "])";
                        }
                    };
                });

                _parser.addGrammarElement("command", function (parser, tokens) {
                    return parser.parseAnyOf(["onCmd", "addCmd", "removeCmd", "toggleCmd", "waitCmd", "sendCmd", "triggerCmd",
                        "takeCmd", "logCmd", "callCmd", "putCmd", "setCmd", "ifCmd", "ajaxCmd"], tokens);
                })

                _parser.addGrammarElement("commandList", function (parser, tokens) {
                    var cmd = parser.parseElement("command", tokens);
                    if (cmd) {
                        tokens.matchToken("then");
                        cmd.next = parser.parseElement("commandList", tokens);
                        return cmd;
                    }
                })

                _parser.addGrammarElement("hyperscript", function (parser, tokens) {
                    var eventListeners = []
                    do {
                        eventListeners.push(parser.parseElement("eventListener", tokens));
                    } while (tokens.matchToken("end") && tokens.hasMore())
                    if (tokens.hasMore()) {
                        parser.raiseParseError(tokens);
                    }
                    return {
                        type: "hyperscript",
                        eventListeners: eventListeners,
                        transpile: function () {
                            return "(function(){\n" +
                                "var eventListeners = []\n" +
                                eventListeners.map(function (el) {
                                    return "  eventListeners.push(" + parser.transpile(el) + ");\n"
                                }).join("") +
                                "      function applyEventListenersTo(elt) { _hyperscript.runtime.applyEventListeners(this, elt) }\n" +
                                "      return {eventListeners:eventListeners, applyEventListenersTo:applyEventListenersTo}\n" +
                                "})()"
                        }
                    };
                })

                _parser.addGrammarElement("eventListener", function (parser, tokens) {
                    tokens.requireToken("on");
                    var on = parser.parseElement("dotOrColonPath", tokens);
                    if (on == null) {
                        parser.raiseParseError(tokens, "Expected event name")
                    }
                    if (tokens.matchToken("from")) {
                        var from = parser.parseElement("target", tokens);
                        if (from == null) {
                            parser.raiseParseError(tokens, "Expected target value")
                        }
                    } else {
                        var from = parser.parseElement("implicitMeTarget", tokens);
                    }

                    var args = [];
                    if (tokens.matchOpToken("(")) {
                        do {
                            args.push(tokens.requireTokenType('IDENTIFIER'));
                        } while (tokens.matchOpToken(","))
                        tokens.requireOpToken(')')
                    }

                    var start = parser.parseElement("commandList", tokens);
                    var eventListener = {
                        type: "eventListener",
                        on: on,
                        from: from,
                        start: start,
                        transpile: function () {
                            return "(function(me){" +
                                "var my = me;\n" +
                                "_hyperscript.runtime.forEach( " + parser.transpile(from) + ", function(target){\n" +
                                "  target.addEventListener('" + parser.transpile(on) + "', function(event){\n" +
                                args.map(function (arg) {
                                    return "var " + arg.value + " = event.detail." + arg.value + ";"
                                }).join("\n") + "\n" +
                                parser.transpile(start) +
                                "  })\n" +
                                "})\n" +
                                "})"
                        }
                    };
                    return eventListener;
                });

                _parser.addGrammarElement("addCmd", function (parser, tokens) {
                    if (tokens.matchToken("add")) {
                        var classRef = parser.parseElement("classRef", tokens);
                        var attributeRef = null;
                        if (classRef == null) {
                            attributeRef = parser.parseElement("attributeRef", tokens);
                            if (attributeRef == null) {
                                parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                            }
                        }

                        if (tokens.matchToken("to")) {
                            var to = parser.parseElement("target", tokens);
                        } else {
                            var to = parser.parseElement("implicitMeTarget");
                        }

                        return {
                            type: "addCmd",
                            classRef: classRef,
                            attributeRef: attributeRef,
                            to: to,
                            transpile: function () {
                                if (this.classRef) {
                                    return "_hyperscript.runtime.forEach( " + parser.transpile(to) + ", function (target) {" +
                                        "  target.classList.add('" + classRef.className() + "')" +
                                        "})";
                                } else {
                                    return "_hyperscript.runtime.forEach( " + parser.transpile(to) + ", function (target) {" +
                                        "  target.setAttribute('" + attributeRef.name + "', " + parser.transpile(attributeRef) + ".value)" +
                                        "})";
                                }
                            }
                        }
                    }
                });

                _parser.addGrammarElement("removeCmd", function (parser, tokens) {
                    if (tokens.matchToken("remove")) {
                        var classRef = parser.parseElement("classRef", tokens);
                        var attributeRef = null;
                        var elementExpr = null;
                        if (classRef == null) {
                            attributeRef = parser.parseElement("attributeRef", tokens);
                            if (attributeRef == null) {
                                elementExpr = parser.parseElement("expression", tokens)
                                if (elementExpr == null) {
                                    parser.raiseParseError(tokens, "Expected either a class reference, attribute expression or value expression");
                                }
                            }
                        }
                        if (tokens.matchToken("from")) {
                            var from = parser.parseElement("target", tokens);
                        } else {
                            var from = parser.parseElement("implicitMeTarget");
                        }

                        return {
                            type: "removeCmd",
                            classRef: classRef,
                            attributeRef: attributeRef,
                            elementExpr: elementExpr,
                            from: from,
                            transpile: function () {
                                if (this.elementExpr) {
                                    return "_hyperscript.runtime.forEach( " + parser.transpile(elementExpr) + ", function (target) {" +
                                        "  target.parentElement.removeChild(target)" +
                                        "})";
                                } else {
                                    if (this.classRef) {
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(from) + ", function (target) {" +
                                            "  target.classList.remove('" + classRef.className() + "')" +
                                            "})";
                                    } else {
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(from) + ", function (target) {" +
                                            "  target.removeAttribute('" + attributeRef.name + "')" +
                                            "})";
                                    }
                                }
                            }
                        }
                    }
                });

                _parser.addGrammarElement("toggleCmd", function (parser, tokens) {
                    if (tokens.matchToken("toggle")) {
                        var classRef = parser.parseElement("classRef", tokens);
                        var attributeRef = null;
                        if (classRef == null) {
                            attributeRef = parser.parseElement("attributeRef", tokens);
                            if (attributeRef == null) {
                                parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                            }
                        }
                        if (tokens.matchToken("on")) {
                            var on = parser.parseElement("target", tokens);
                        } else {
                            var on = parser.parseElement("implicitMeTarget");
                        }
                        return {
                            type: "toggleCmd",
                            classRef: classRef,
                            attributeRef: attributeRef,
                            on: on,
                            transpile: function () {
                                if (this.classRef) {
                                    return "_hyperscript.runtime.forEach( " + parser.transpile(on) + ", function (target) {" +
                                        "  target.classList.toggle('" + classRef.className() + "')" +
                                        "})";
                                } else {
                                    return "_hyperscript.runtime.forEach( " + parser.transpile(on) + ", function (target) {" +
                                        "  if(target.hasAttribute('" + attributeRef.name + "')) {\n" +
                                        "    target.removeAttribute('" + attributeRef.name + "');\n" +
                                        "  } else { \n" +
                                        "    target.setAttribute('" + attributeRef.name + "', " + parser.transpile(attributeRef) + ".value)" +
                                        "  }" +
                                        "})";
                                }
                            }
                        }
                    }
                })

                _parser.addGrammarElement("waitCmd", function (parser, tokens) {
                    if (tokens.matchToken("wait")) {
                        var time = parser.parseElement('millisecondLiteral', tokens);
                        return {
                            type: "waitCmd",
                            time: time,
                            transpile: function () {
                                var capturedNext = this.next;
                                delete this.next;
                                return "setTimeout(function () { " + parser.transpile(capturedNext) + " }, " + parser.transpile(this.time) + ")";
                            }
                        }
                    }
                })

                // TODO  - colon path needs to eventually become part of ruby-style symbols
                _parser.addGrammarElement("dotOrColonPath", function (parser, tokens) {
                    var root = tokens.matchTokenType("IDENTIFIER");
                    if (root) {
                        var path = [root.value];

                        var separator = tokens.matchOpToken(".") || tokens.matchOpToken(":");
                        if (separator) {
                            do {
                                path.push(tokens.requireTokenType("IDENTIFIER").value);
                            } while (tokens.matchOpToken(separator.value))
                        }

                        return {
                            type: "dotOrColonPath",
                            path: path,
                            transpile: function () {
                                return path.join(separator ? separator.value : "");
                            }
                        }
                    }
                });

                _parser.addGrammarElement("sendCmd", function (parser, tokens) {
                    if (tokens.matchToken("send")) {

                        var eventName = parser.parseElement("dotOrColonPath", tokens);

                        var details = parser.parseElement("namedArgumentList", tokens);
                        if (tokens.matchToken("to")) {
                            var to = parser.parseElement("target", tokens);
                        } else {
                            var to = parser.parseElement("implicitMeTarget");
                        }

                        return {
                            type: "sendCmd",
                            eventName: eventName,
                            details: details,
                            to: to,
                            transpile: function () {
                                return "_hyperscript.runtime.forEach( " + parser.transpile(to) + ", function (target) {" +
                                    "  _hyperscript.runtime.triggerEvent(target, '" + parser.transpile(eventName) + "'," + parser.transpile(details, "{}") + ")" +
                                    "})";
                            }
                        }
                    }
                })

                _parser.addGrammarElement("triggerCmd", function (parser, tokens) {
                    if (tokens.matchToken("trigger")) {

                        var eventName = parser.parseElement("dotOrColonPath", tokens);
                        var details = parser.parseElement("namedArgumentList", tokens);

                        return {
                            type: "triggerCmd",
                            eventName: eventName,
                            details: details,
                            transpile: function () {
                                return "_hyperscript.runtime.triggerEvent(me, '" + parser.transpile(eventName) + "'," + parser.transpile(details, "{}") + ");";
                            }
                        }
                    }
                })

                _parser.addGrammarElement("takeCmd", function (parser, tokens) {
                    if (tokens.matchToken("take")) {
                        var classRef = tokens.requireTokenType(tokens, "CLASS_REF");

                        if (tokens.matchToken("from")) {
                            var from = parser.parseElement("target", tokens);
                        } else {
                            var from = parser.parseElement("implicitAllTarget")
                        }

                        if (tokens.matchToken("for")) {
                            var forElt = parser.parseElement("target", tokens);
                        } else {
                            var forElt = parser.parseElement("implicitMeTarget")
                        }

                        return {
                            type: "takeCmd",
                            classRef: classRef,
                            from: from,
                            forElt: forElt,
                            transpile: function () {
                                var clazz = this.classRef.value.substr(1);
                                return "  _hyperscript.runtime.forEach(" + parser.transpile(from) + ", function (target) { target.classList.remove('" + clazz + "') }); " +
                                    "_hyperscript.runtime.forEach( " + parser.transpile(forElt) + ", function (target) {" +
                                    "  target.classList.add('" + clazz + "')" +
                                    "})";
                            }
                        }
                    }
                })

                _parser.addGrammarElement("logCmd", function (parser, tokens) {
                    if (tokens.matchToken("log")) {
                        var exprs = [parser.parseElement("expression", tokens)];
                        while (tokens.matchOpToken(",")) {
                            exprs.push(parser.parseElement("expression", tokens));
                        }
                        if (tokens.matchToken("with")) {
                            var withExpr = parser.parseElement("expression", tokens);
                        }
                        return {
                            type: "logCmd",
                            exprs: exprs,
                            withExpr: withExpr,
                            transpile: function () {
                                if (withExpr) {
                                    return parser.transpile(withExpr) + "(" + exprs.map(function (expr) {
                                        return parser.transpile(expr)
                                    }).join(", ") + ")";
                                } else {
                                    return "console.log(" + exprs.map(function (expr) {
                                        return parser.transpile(expr)
                                    }).join(", ") + ")";
                                }
                            }
                        };
                    }
                })

                _parser.addGrammarElement("callCmd", function (parser, tokens) {
                    if (tokens.matchToken("call") || tokens.matchToken("get")) {
                        return {
                            type: "callCmd",
                            expr: parser.parseElement("expression", tokens),
                            transpile: function () {
                                return "var it = " + parser.transpile(this.expr);
                            }
                        }
                    }
                })

                _parser.addGrammarElement("putCmd", function (parser, tokens) {
                    if (tokens.matchToken("put")) {

                        var value = parser.parseElement("expression", tokens);

                        var operation = tokens.matchToken("into") ||
                            tokens.matchToken("before") ||
                            tokens.matchToken("after");

                        if (operation == null && tokens.matchToken("at")) {
                            operation = tokens.matchToken("start") ||
                                tokens.matchToken("end");
                            tokens.requireToken("of");
                        }

                        if (operation == null) {
                            parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
                        }
                        var target = parser.parseElement("target", tokens);

                        var directWrite = target.propPath.length === 0 && operation.value === "into";
                        var symbolWrite = directWrite && target.root.type === "symbol";
                        if (directWrite && !symbolWrite) {
                            parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                        }

                        return {
                            type: "putCmd",
                            target: target,
                            op: operation.value,
                            symbolWrite: symbolWrite,
                            value: value,
                            transpile: function () {
                                if (this.symbolWrite) {
                                    return "var " + target.root.name + " = " + parser.transpile(value);
                                } else {
                                    if (this.op === "into") {
                                        var lastProperty = target.propPath.pop(); // steal last property for assignment
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(target) + ", function (target) {" +
                                            "  target." + lastProperty + "=" + parser.transpile(value) +
                                            "})";
                                    } else if (this.op === "before") {
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(target) + ", function (target) {" +
                                            "  target.insertAdjacentHTML('beforebegin', " + parser.transpile(value) + ")" +
                                            "})";
                                    } else if (this.op === "start") {
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(target) + ", function (target) {" +
                                            "  target.insertAdjacentHTML('afterbegin', " + parser.transpile(value) + ")" +
                                            "})";
                                    } else if (this.op === "end") {
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(target) + ", function (target) {" +
                                            "  target.insertAdjacentHTML('beforeend', " + parser.transpile(value) + ")" +
                                            "})";
                                    } else if (this.op === "after") {
                                        return "_hyperscript.runtime.forEach( " + parser.transpile(target) + ", function (target) {" +
                                            "  target.insertAdjacentHTML('afterend', " + parser.transpile(value) + ")" +
                                            "})";
                                    }
                                }
                            }
                        }
                    }
                })

                _parser.addGrammarElement("setCmd", function (parser, tokens) {
                    if (tokens.matchToken("set")) {

                        var target = parser.parseElement("target", tokens);

                        tokens.requireToken("to");

                        var value = parser.parseElement("expression", tokens);

                        var directWrite = target.propPath.length === 0;
                        var symbolWrite = directWrite && target.root.type === "symbol";
                        if (directWrite && !symbolWrite) {
                            parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                        }

                        return {
                            type: "setCmd",
                            target: target,
                            symbolWrite: symbolWrite,
                            value: value,
                            transpile: function () {
                                if (this.symbolWrite) {
                                    return "var " + target.root.name + " = " + parser.transpile(value);
                                } else {
                                    var lastProperty = target.propPath.pop(); // steal last property for assignment
                                    return "_hyperscript.runtime.forEach( " + parser.transpile(target) + ", function (target) {" +
                                        "  target." + lastProperty + "=" + parser.transpile(value) +
                                        "})";
                                }
                            }
                        }
                    }
                })

                _parser.addGrammarElement("ifCmd", function (parser, tokens) {
                    if (tokens.matchToken("if")) {
                        var expr = parser.parseElement("expression", tokens);
                        tokens.matchToken("then"); // optional 'then'
                        var trueBranch = parser.parseElement("commandList", tokens);
                        if (tokens.matchToken("else")) {
                            var falseBranch = parser.parseElement("commandList", tokens);
                        }
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }
                        return {
                            type: "ifCmd",
                            expr: expr,
                            trueBranch: trueBranch,
                            falseBranch: falseBranch,
                            transpile: function () {
                                return "if(" + parser.transpile(expr) + "){" + "" + parser.transpile(trueBranch) + "}" +
                                    "   else {" + parser.transpile(falseBranch, "") + "}"

                            }
                        }
                    }
                })

                _parser.addGrammarElement("ajaxCmd", function (parser, tokens) {
                    if (tokens.matchToken("ajax")) {
                        var method = tokens.matchToken("GET") || tokens.matchToken("POST");
                        if (method == null) {
                            parser.raiseParseError(tokens, "Requires either GET or POST");
                        }
                        if (method.value !== "GET") {
                            if (!tokens.matchToken("to")) {
                                var data = parser.parseElement("expression", tokens);
                                tokens.requireToken("to");
                            }
                        }

                        var url = parser.parseElement("string", tokens);
                        if (url == null) {
                            var url = parser.parseElement("nakedString", tokens);
                        }

                        return {
                            type: "requestCommand",
                            method: method,
                            transpile: function () {
                                var capturedNext = this.next;
                                delete this.next;
                                return "_hyperscript.runtime.ajax('" + method.value + "', " +
                                    parser.transpile(url) + ", " +
                                    "function(response, xhr){ " + parser.transpile(capturedNext) + " }," +
                                    parser.transpile(data, "null") + ")";
                            }
                        };
                    }
                })
            }

            //====================================================================
            // API
            //====================================================================

            function processNode(elt) {
                _runtime.processNode(elt);
            }

            function evaluate(str) {
                return _runtime.evaluate(str);
            }

            //====================================================================
            // Initialization
            //====================================================================
            function ready(fn) {
                if (document.readyState !== 'loading') {
                    fn();
                } else {
                    document.addEventListener('DOMContentLoaded', fn);
                }
            }

            function getMetaConfig() {
                var element = document.querySelector('meta[name="htmx-config"]');
                if (element) {
                    return parseJSON(element.content);
                } else {
                    return null;
                }
            }

            function mergeMetaConfig() {
                var metaConfig = getMetaConfig();
                if (metaConfig) {
                    _hyperscript.config = mergeObjects(_hyperscript.config , metaConfig)
                }
            }

            var _hyperscript = {
                lexer: _lexer,
                parser: _parser,
                runtime: _runtime,
                evaluate: evaluate,
                processNode: processNode,
                config: {
                    attributes : "_, script, data-script"
                }
            };

            ready(function () {
                mergeMetaConfig();
                processNode(document.body);
                document.addEventListener("htmx:load", function(evt){
                    processNode(evt.detail.elt);
                })
            })

            return _hyperscript;
        }
    )()
}));