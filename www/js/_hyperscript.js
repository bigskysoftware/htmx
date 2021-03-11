///=========================================================================
/// This module provides the core runtime and grammar for hyperscript
///=========================================================================
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

            // https://stackoverflow.com/a/8843181
            function varargConstructor(Cls, args) {
                return new (Cls.bind.apply(Cls, [Cls].concat(args)));
            }

            var globalScope = typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : this;

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
                    '$': 'DOLLAR',
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

                function isIdentifierChar(c, dollarIsOp) {
                    return (c === "_" || (!dollarIsOp && c === "$"));
                }

                function isReservedChar(c) {
                    return (c === "`" || c === "^");
                }


                function makeTokensObject(tokens, consumed, source) {

                    consumeWhitespace(); // consume initial whitespace

                    function consumeWhitespace(){
                        while(token(0, true).type === "WHITESPACE") {
                            consumed.push(tokens.shift());
                        }
                    }

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
                        consumeWhitespace(); // consume any whitespace
                        return match;
                    }

                    function consumeUntil(value, type) {
                        var tokenList = [];
                        var currentToken = token(0, true);
                        while ((type == null || currentToken.type !== type) &&
                        (value == null || currentToken.value !== value) &&
                        currentToken.type !== "EOF") {
                            var match = tokens.shift();
                            consumed.push(match);
                            tokenList.push(currentToken);
                            currentToken = token(0, true);
                        }
                        consumeWhitespace(); // consume any whitespace
                        return tokenList;
                    }

                    function lastWhitespace() {
                        if (consumed[consumed.length - 1] && consumed[consumed.length - 1].type === "WHITESPACE") {
                            return consumed[consumed.length - 1].value;
                        } else {
                            return "";
                        }
                    }

                    function consumeUntilWhitespace() {
                        return consumeUntil(null, "WHITESPACE");
                    }

                    function hasMore() {
                        return tokens.length > 0;
                    }

                    function token(n, dontIgnoreWhitespace) {
                        var token;
                        var i = 0;
                        do {
                            if (!dontIgnoreWhitespace) {
                                while (tokens[i] && tokens[i].type === "WHITESPACE") {
                                    i++;
                                }
                            }
                            token = tokens[i];
                            n--;
                            i++;
                        } while (n > -1)
                        if (token) {
                            return token;
                        } else {
                            return {
                                type:"EOF",
                                value:"<<<EOF>>>"
                            }
                        }
                    }

                    function currentToken() {
                        return token(0);
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
                        consumed: consumed,
                        source: source,
                        hasMore: hasMore,
                        currentToken: currentToken,
                        token: token,
                        consumeUntil: consumeUntil,
                        consumeUntilWhitespace: consumeUntilWhitespace,
                        lastWhitespace: lastWhitespace
                    }
                }

                function tokenize(string, noDollarStart) {
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
                            } else if (isAlpha(currentChar()) || isIdentifierChar(currentChar(), noDollarStart)) {
                                tokens.push(consumeIdentifier());
                            } else if (isNumeric(currentChar())) {
                                tokens.push(consumeNumber());
                            } else if (currentChar() === '"' || currentChar() === "'" || currentChar() === "`") {
                                tokens.push(consumeString());
                            } else if (OP_TABLE[currentChar()]) {
                                tokens.push(consumeOp());
                            } else if (isReservedChar(currentChar())) {
                                tokens.push(makeToken('RESERVED', currentChar()))
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
                        string.template = startChar === "`";
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
                    tokenize: tokenize,
                    makeTokensObject: makeTokensObject
                }
            }();

            //====================================================================
            // Parser
            //====================================================================
            var _parser = function () {

                var GRAMMAR = {}
                var COMMANDS = {}
                var FEATURES = {}
                var LEAF_EXPRESSIONS = [];
                var INDIRECT_EXPRESSIONS = [];

                function parseElement(type, tokens, root) {
                    var elementDefinition = GRAMMAR[type];
                    if (elementDefinition) return elementDefinition(_parser, _runtime, tokens, root);
                }

                function requireElement(type, tokens, message, root) {
                    var result = parseElement(type, tokens, root);
                    return result || raiseParseError(tokens, message || "Expected " + type);
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

                function addGrammarElement(name, definition) {
                    GRAMMAR[name] = definition;
                }

                function addCommand(keyword, definition) {
                    var commandGrammarType = keyword + "Command";
                    var commandDefinitionWrapper = function (parser, runtime, tokens) {
                        var commandElement = definition(parser, runtime, tokens);
                        if (commandElement) {
                            commandElement.type = commandGrammarType;
                            commandElement.execute = function (context) {
                                return runtime.unifiedExec(this, context);
                            }
                            return commandElement;
                        }
                    };
                    GRAMMAR[commandGrammarType] = commandDefinitionWrapper;
                    COMMANDS[keyword] = commandDefinitionWrapper;
                }

                function addFeature(keyword, definition) {
                    var featureGrammarType = keyword + "Feature";
                    var featureDefinitionWrapper = function (parser, runtime, tokens) {
                        var featureElement = definition(parser, runtime, tokens);
                        if (featureElement) {
                            featureElement.keyword = keyword;
                            featureElement.type = featureGrammarType;
                            return featureElement;
                        }
                    };
                    GRAMMAR[featureGrammarType] = featureDefinitionWrapper;
                    FEATURES[keyword] = featureDefinitionWrapper;
                }

                function addLeafExpression(name, definition) {
                    LEAF_EXPRESSIONS.push(name);
                    addGrammarElement(name, definition);
                }

                function addIndirectExpression(name, definition) {
                    INDIRECT_EXPRESSIONS.push(name);
                    addGrammarElement(name, definition);
                }

                /* ============================================================================================ */
                /* Core hyperscript Grammar Elements                                                            */
                /* ============================================================================================ */
                addGrammarElement("feature", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var featureDefinition = parser.requireElement("feature", tokens);
                        tokens.requireOpToken(")");
                        return featureDefinition;
                    } else {
                        var featureDefinition = FEATURES[tokens.currentToken().value];
                        if (featureDefinition) {
                            return featureDefinition(parser, runtime, tokens);
                        }
                    }
                })

                addGrammarElement("command", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var commandDefinition = parser.requireElement("command", tokens);
                        tokens.requireOpToken(")");
                        return commandDefinition;
                    } else {
                        var commandDefinition = COMMANDS[tokens.currentToken().value];
                        if (commandDefinition) {
                            return commandDefinition(parser, runtime, tokens);
                        } else if (tokens.currentToken().type === "IDENTIFIER" && tokens.token(1).value === "(") {
                            return parser.requireElement("pseudoCommand", tokens);
                        }
                    }
                })

                addGrammarElement("commandList", function(parser, runtime, tokens) {
                    var cmd = parser.parseElement("command", tokens);
                    if (cmd) {
                        tokens.matchToken("then");
                        cmd.next = parser.parseElement("commandList", tokens);
                        return cmd;
                    }
                })

                addGrammarElement("leaf", function(parser, runtime, tokens) {
                    var result = parseAnyOf(LEAF_EXPRESSIONS, tokens);
                    // symbol is last so it doesn't consume any constants
                    if (result == null) {
                        return parseElement('symbol', tokens);
                    } else {
                        return result;
                    }
                })

                addGrammarElement("indirectExpression", function(parser, runtime, tokens, root) {
                    for (var i = 0; i < INDIRECT_EXPRESSIONS.length; i++) {
                        var indirect = INDIRECT_EXPRESSIONS[i];
                        var result = parser.parseElement(indirect, tokens, root);
                        if(result){
                            return result;
                        }
                    }
                    return root;
                });

                addGrammarElement("primaryExpression", function(parser, runtime, tokens) {
                    var leaf = parser.parseElement("leaf", tokens);
                    if (leaf) {
                        return parser.parseElement("indirectExpression", tokens, leaf);
                    }
                    parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
                });
                /* ============================================================================================ */
                /* END Core hyperscript Grammar Elements                                                        */
                /* ============================================================================================ */


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

                function parseHyperScript(tokens) {
                    return parseElement("hyperscript", tokens)
                }

                function setParent(elt, parent) {
                    if (elt) {
                        elt.parent = parent;
                        setParent(elt.next, parent);
                    }
                }

                function commandStart(token){
                    return COMMANDS[token.value];
                }

                function featureStart(token){
                    return FEATURES[token.value];
                }

                function commandBoundary(token) {
                    if (token.value == "end" ||
                        token.value == "then" ||
                        token.value == "else" ||
                        token.value == ")" ||
                        commandStart(token) ||
                        featureStart(token) ||
                        token.type == "EOF") {
                        return true;
                    }
                }

                function parseStringTemplate(tokens) {
                    var returnArr = [""];
                    do {
                        returnArr.push(tokens.lastWhitespace());
                        if (tokens.currentToken().value === "$") {
                            tokens.consumeToken();
                            var startingBrace = tokens.matchOpToken('{');
                            returnArr.push(requireElement("expression", tokens));
                            if(startingBrace){
                                tokens.requireOpToken("}");
                            }
                            returnArr.push("");
                        } else if (tokens.currentToken().value === "\\") {
                            tokens.consumeToken(); // skip next
                            tokens.consumeToken()
                        } else {
                            var token = tokens.consumeToken();
                            returnArr[returnArr.length - 1] += token.value;
                        }
                    } while (tokens.hasMore())
                    returnArr.push(tokens.lastWhitespace());
                    return returnArr;
                }

                return {
                    // parser API
                    setParent: setParent,
                    requireElement: requireElement,
                    parseElement: parseElement,
                    featureStart: featureStart,
                    commandStart: commandStart,
                    commandBoundary: commandBoundary,
                    parseAnyOf: parseAnyOf,
                    parseHyperScript: parseHyperScript,
                    raiseParseError: raiseParseError,
                    addGrammarElement: addGrammarElement,
                    addCommand: addCommand,
                    addFeature: addFeature,
                    addLeafExpression: addLeafExpression,
                    addIndirectExpression: addIndirectExpression,
                    parseStringTemplate: parseStringTemplate,
                }
            }();

            //====================================================================
            // Runtime
            //====================================================================
            var CONVERSIONS = {
                dynamicResolvers : [],
                "String" : function(val){
                    if(val.toString){
                        return val.toString();
                    } else {
                        return "" + val;
                    }
                },
                "Int" : function(val){
                    return parseInt(val);
                },
                "Float" : function(val){
                    return parseFloat(val);
                },
                "Number" : function(val){
                    return Number(val);
                },
                "Date" : function(val){
                    return Date(val);
                },
                "Array" : function(val){
                    return Array.from(val);
                },
                "JSON" : function(val){
                    return JSON.stringify(val);
                },
                "Object" : function(val){
                    if (typeof val === 'string' || val instanceof String) {
                        return JSON.parse(val);
                    } else {
                        return mergeObjects({}, val);
                    }
                }
            }
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

                function isArrayLike(value) {
                    return Array.isArray(value) || value instanceof NodeList;
                }

                function forEach(value, func) {
                    if (value == null) {
                        // do nothing
                    } else if (isArrayLike(value)) {
                        for (var i = 0; i < value.length; i++) {
                            func(value[i]);
                        }
                    } else {
                        func(value);
                    }
                }

                var ARRAY_SENTINEL = {array_sentinel:true}
                function linearize(args) {
                    var arr = [];
                    for (var i = 0; i < args.length; i++) {
                        var arg = args[i];
                        if (Array.isArray(arg)) {
                            arr.push(ARRAY_SENTINEL);
                            for (var j = 0; j < arg.length; j++) {
                                arr.push(arg[j]);
                            }
                            arr.push(ARRAY_SENTINEL);
                        } else {
                            arr.push(arg);
                        }
                    }
                    return arr;
                }

                function delinearize(values){
                    var arr = [];
                    for (var i = 0; i < values.length; i++) {
                        var value = values[i];
                        if (value === ARRAY_SENTINEL) {
                            value = values[++i];
                            var valueArray = [];
                            arr.push(valueArray);
                            while (value !== ARRAY_SENTINEL) {
                                valueArray.push(value);
                                value = values[++i];
                            }
                        } else {
                            arr.push(value);
                        }
                    }
                    return arr;

                }

                function unwrapAsyncs(values) {
                    for (var i = 0; i < values.length; i++) {
                        var value = values[i];
                        if (value.asyncWrapper) {
                            values[i] = value.value;
                        }
                        if (Array.isArray(value)) {
                            for (var j = 0; j < value.length; j++) {
                                var valueElement = value[j];
                                if (valueElement.asyncWrapper) {
                                    value[j] = valueElement.value;
                                }
                            }
                        }
                    }
                }

                var HALT = {halt_flag:true};
                function unifiedExec(command,  ctx) {
                    while(true) {
                        try {
                            var next = unifiedEval(command, ctx);
                        } catch(e) {
                            _runtime.registerHyperTrace(ctx, e);
                            if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                                ctx.meta.handlingError = true;
                                ctx[ctx.meta.errorSymmbol] = e;
                                command = ctx.meta.errorHandler;
                                continue;
                            } else if (ctx.meta.reject) {
                                ctx.meta.reject(e);
                                next = HALT;
                            } else {
                                throw e;
                            }
                        }
                        if (next == null) {
                            console.error(command, " did not return a next element to execute! context: " , ctx)
                            return;
                        } else if (next.then) {
                            next.then(function (resolvedNext) {
                                unifiedExec(resolvedNext, ctx);
                            }).catch(function(reason){
                                _runtime.registerHyperTrace(ctx, reason);
                                if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                                    ctx.meta.handlingError = true;
                                    ctx[ctx.meta.errorSymmbol] = reason;
                                    unifiedExec(ctx.meta.errorHandler, ctx);
                                } else if(ctx.meta.reject) {
                                    ctx.meta.reject(reason);
                                } else {
                                    throw reason;
                                }
                            });
                            return;
                        } else if (next === HALT) {
                            // done
                            return;
                        }  else {
                            command = next; // move to the next command
                        }
                    }
                }

                function unifiedEval(parseElement,  ctx) {
                    var async = false;
                    var wrappedAsyncs = false;
                    var args = [ctx];
                    if (parseElement.args) {
                        for (var i = 0; i < parseElement.args.length; i++) {
                            var argument = parseElement.args[i];
                            if (argument == null) {
                                args.push(null);
                            } else if (Array.isArray(argument)) {
                                var arr = [];
                                for (var j = 0; j < argument.length; j++) {
                                    var element = argument[j];
                                    var value = element ? element.evaluate(ctx) : null; // OK
                                    if (value) {
                                        if (value.then) {
                                            async = true;
                                        } else if (value.asyncWrapper) {
                                            wrappedAsyncs = true;
                                        }
                                    }
                                    arr.push(value);
                                }
                                args.push(arr);
                            } else if (argument.evaluate) {
                                var value = argument.evaluate(ctx); // OK
                                if (value) {
                                    if (value.then) {
                                        async = true;
                                    } else if (value.asyncWrapper) {
                                        wrappedAsyncs = true;
                                    }
                                }
                                args.push(value);
                            } else {
                                args.push(argument);
                            }
                        }
                    }
                    if (async) {
                        return new Promise(function(resolve, reject){
                            var linearized = linearize(args);
                            Promise.all(linearized).then(function(values){
                                values = delinearize(values);
                                if (wrappedAsyncs) {
                                    unwrapAsyncs(values);
                                }
                                try{
                                    var apply = parseElement.op.apply(parseElement, values);
                                    resolve(apply);
                                } catch(e) {
                                    reject(e);
                                }
                            }).catch(function(reason){
                                if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                                    ctx.meta.handlingError = true;
                                    ctx[ctx.meta.errorSymmbol] = reason;
                                    unifiedExec(ctx.meta.errorHandler, ctx);
                                } else if(ctx.meta.reject) {
                                    ctx.meta.reject(reason);
                                } else {
                                    // TODO: no meta context to reject with, trigger event?
                                }
                            })
                        })
                    } else {
                        if (wrappedAsyncs) {
                            unwrapAsyncs(args);
                        }
                        return parseElement.op.apply(parseElement, args);
                    }
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
                    if (elt.type === "text/hyperscript") {
                        return elt.innerText;
                    }
                    return null;
                }

                function makeContext(owner, feature, hyperscriptTarget, event) {
                    var ctx = {
                        meta: {
                            parser: _parser,
                            lexer: _lexer,
                            runtime: _runtime,
                            owner: owner,
                            feature: feature,
                            iterators: {}
                        },
                        me: hyperscriptTarget,
                        event: event,
                        target: event ? event.target : null,
                        detail: event ? event.detail : null,
                        body: 'document' in globalScope ? document.body : null
                    }
                    ctx.meta.ctx = ctx;
                    return ctx;
                }

                function getScriptSelector() {
                    return getScriptAttributes().map(function (attribute) {
                        return "[" + attribute + "]";
                    }).join(", ");
                }

                function convertValue(value,  type) {

                    var dynamicResolvers = CONVERSIONS.dynamicResolvers;
                    for (var i = 0; i < dynamicResolvers.length; i++) {
                        var dynamicResolver = dynamicResolvers[i];
                        var converted = dynamicResolver(type, value);
                        if (converted !== undefined) {
                            return converted;
                        }
                    }

                    if (value == null) {
                        return null;
                    }
                    var converter = CONVERSIONS[type];
                    if (converter) {
                        return converter(value);
                    }

                    throw "Unknown conversion : " + type;
                }


                function isType(o, type) {
                    return Object.prototype.toString.call(o) === "[object " + type + "]";
                }

                function evaluate(src, ctx) {
                    ctx = ctx || {};
                    var tokens = _lexer.tokenize(src);
                    if (_parser.commandStart(tokens.currentToken())) {
                        var commandList = _parser.parseElement("commandList", tokens);
                        var last = commandList;
                        while (last.next) {
                            last = last.next;
                        }
                        last.next = {
                            op : function() {
                                return HALT;
                            }
                        }
                        commandList.execute(ctx);
                    } else if (_parser.featureStart(tokens.currentToken())) {
                        var hyperscript = _parser.parseElement("hyperscript", tokens);
                        hyperscript.apply(document.body, null);
                        return null;
                    } else {
                        var expression = _parser.parseElement("expression", tokens);
                        return expression.evaluate(ctx);
                    }
                }

                function processNode(elt) {
                    var selector = _runtime.getScriptSelector();
                    if (matchesSelector(elt, selector)) {
                        initElement(elt);
                    }
                    if (elt.querySelectorAll) {
                        forEach(elt.querySelectorAll(selector), function (elt) {
                            initElement(elt);
                        });
                    }
                    if (elt.type === "text/hyperscript") {
                        initElement(elt, document.body);
                    }
                    if (elt.querySelectorAll) {
                        forEach(elt.querySelectorAll("[type=\'text/hyperscript\']"), function (elt) {
                            initElement(elt, document.body);
                        });
                    }
                }

                function initElement(elt, target) {
                    var internalData = getInternalData(elt);
                    if (!internalData.initialized) {
                        var src = getScript(elt);
                        if (src) {
                            try {
                                internalData.initialized = true;
                                internalData.script = src;
                                var tokens = _lexer.tokenize(src);
                                var hyperScript = _parser.parseHyperScript(tokens);
                                hyperScript.apply(target || elt, elt);
                                setTimeout(function () {
                                    triggerEvent(target || elt, 'load');
                                }, 1);
                            } catch(e) {
                                console.error("hyperscript errors were found on the following element:", elt, "\n\n", e.message, e.stack);
                            }
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

                function resolveSymbol(str, context) {
                    if (str === "me" || str === "my" || str === "I") {
                        return context["me"];
                    } if (str === "it" || str === "its") {
                        return context["result"];
                    } else {
                        if (context.meta && context.meta.context) {
                            var fromMetaContext = context.meta.context[str];
                            if (typeof fromMetaContext !== "undefined") {
                                return fromMetaContext;
                            }
                        }
                        var fromContext = context[str];
                        if (typeof fromContext !== "undefined") {
                            return fromContext;
                        } else {
                            return globalScope[str];
                        }
                    }
                }

                function findNext(command, context) {
                    if (command) {
                        if (command.resolveNext) {
                            return command.resolveNext(context);
                        } else if (command.next) {
                            return command.next;
                        } else {
                            return findNext(command.parent, context)
                        }
                    }
                }

                function resolveProperty(root, property) {
                    if (root != null) {
                        var val = root[property];
                        if (typeof val !== 'undefined') {
                            return val;
                        } else {
                            if (isArrayLike(root)) {
                                if (property === "first") {
                                    return root[0];
                                } else if (property === "last") {
                                    return root[root.length - 1];
                                } else if (property === "random") {
                                    return root[Math.floor(root.length * Math.random())]
                                } else {
                                    // flat map
                                    var result = [];
                                    for (var i = 0; i < root.length; i++) {
                                        var component = root[i];
                                        var componentValue = component[property];
                                        if (componentValue) {
                                            result.push(componentValue);
                                        }
                                    }
                                    return result;
                                }
                            }
                        }
                    }
                }

                function assignToNamespace(nameSpace, name, value) {
                    var root = globalScope;
                    while (nameSpace.length > 0) {
                        var propertyName = nameSpace.shift();
                        var newRoot = root[propertyName];
                        if (newRoot == null) {
                            newRoot = {};
                            root[propertyName] = newRoot;
                        }
                        root = newRoot;
                    }

                    root[name] = value;
                }

                function getHyperTrace(ctx, thrown) {
                    var trace = [];
                    var root = ctx;
                    while(root.meta.caller) {
                        root = root.meta.caller;
                    }
                    if (root.meta.traceMap) {
                        return root.meta.traceMap.get(thrown, trace);
                    }
                }

                function registerHyperTrace(ctx, thrown) {
                    var trace = [];
                    var root = null;
                    while(ctx != null) {
                        trace.push(ctx);
                        root = ctx;
                        ctx = ctx.meta.caller;
                    }
                    if (root.meta.traceMap == null) {
                        root.meta.traceMap = new Map(); // TODO - WeakMap?
                    }
                    if (!root.meta.traceMap.get(thrown)) {
                        var traceEntry = {
                            trace: trace,
                            print : function(logger) {
                                logger = logger || console.error;
                                logger("hypertrace /// ")
                                var maxLen = 0;
                                for (var i = 0; i < trace.length; i++) {
                                    maxLen = Math.max(maxLen, trace[i].meta.feature.displayName.length);
                                }
                                for (var i = 0; i < trace.length; i++) {
                                    var traceElt = trace[i];
                                    logger("  ->", traceElt.meta.feature.displayName.padEnd(maxLen + 2), "-", traceElt.meta.owner)
                                }
                            }
                        };
                        root.meta.traceMap.set(thrown, traceEntry);
                    }
                }

                var hyperscriptUrl = 'document' in globalScope ? document.currentScript.src : null

                return {
                    typeCheck: typeCheck,
                    forEach: forEach,
                    triggerEvent: triggerEvent,
                    matchesSelector: matchesSelector,
                    getScript: getScript,
                    processNode: processNode,
                    evaluate: evaluate,
                    getScriptSelector: getScriptSelector,
                    resolveSymbol: resolveSymbol,
                    makeContext: makeContext,
                    findNext: findNext,
                    unifiedEval: unifiedEval,
                    convertValue: convertValue,
                    unifiedExec: unifiedExec,
                    resolveProperty: resolveProperty,
                    assignToNamespace: assignToNamespace,
                    registerHyperTrace: registerHyperTrace,
                    getHyperTrace: getHyperTrace,
                    getInternalData: getInternalData,
                    hyperscriptUrl: hyperscriptUrl,
                    HALT: HALT
                }
            }();

            //====================================================================
            // Grammar
            //====================================================================
            {
                _parser.addLeafExpression("parenthesized", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken('(')) {
                        var expr = parser.requireElement("expression", tokens);
                        tokens.requireOpToken(")");
                        return {
                            type: "parenthesized",
                            expr: expr,
                            evaluate: function (context) {
                                return expr.evaluate(context); //OK
                            }
                        }
                    }
                })

                _parser.addLeafExpression("string", function(parser, runtime, tokens) {
                    var stringToken = tokens.matchTokenType('STRING');
                    if (stringToken) {
                        var rawValue = stringToken.value;
                        if (stringToken.template) {
                            var innerTokens = _lexer.tokenize(rawValue, true);
                            var args = parser.parseStringTemplate(innerTokens);
                        } else {
                            var args = [];
                        }
                        return {
                            type: "string",
                            token: stringToken,
                            args: args,
                            op: function (context) {
                                var returnStr = "";
                                for (var i = 1; i < arguments.length; i++) {
                                    var val = arguments[i];
                                    if (val) {
                                        returnStr += val;
                                    }
                                }
                                return returnStr;
                            },
                            evaluate: function (context) {
                                if (args.length === 0) {
                                    return rawValue;
                                } else {
                                    return runtime.unifiedEval(this, context);
                                }
                            }
                        };
                    }
                })

                _parser.addGrammarElement("nakedString", function(parser, runtime, tokens) {
                    if (tokens.hasMore()) {
                        var tokenArr = tokens.consumeUntilWhitespace();
                        tokens.matchTokenType("WHITESPACE");
                        return {
                            type: "nakedString",
                            tokens: tokenArr,
                            evaluate: function (context) {
                                return tokenArr.map(function (t) {return t.value}).join("");
                            }
                        }
                    }
                })

                _parser.addLeafExpression("number", function(parser, runtime, tokens) {
                    var number = tokens.matchTokenType('NUMBER');
                    if (number) {
                        var numberToken = number;
                        var value = parseFloat(number.value)
                        return {
                            type: "number",
                            value: value,
                            numberToken: numberToken,
                            evaluate: function () {
                                return value;
                            }
                        }
                    }
                })

                _parser.addLeafExpression("idRef", function(parser, runtime, tokens) {
                    var elementId = tokens.matchTokenType('ID_REF');
                    if (elementId) {
                        return {
                            type: "idRef",
                            css: elementId.value,
                            value: elementId.value.substr(1),
                            evaluate: function (context) {
                                return document.getElementById(this.value);
                            }
                        };
                    }
                })

                _parser.addLeafExpression("classRef", function(parser, runtime, tokens) {
                    var classRef = tokens.matchTokenType('CLASS_REF');
                    if (classRef) {
                        return {
                            type: "classRef",
                            css: classRef.value,
                            className: function () {
                                return this.css.substr(1);
                            },
                            evaluate: function () {
                                return document.querySelectorAll(this.css);
                            }
                        };
                    }
                })

                _parser.addLeafExpression("queryRef", function(parser, runtime, tokens) {
                    var queryStart = tokens.matchOpToken('<');
                    if (queryStart) {
                        var queryTokens = tokens.consumeUntil("/");
                        tokens.requireOpToken("/");
                        tokens.requireOpToken(">");
                        var queryValue = queryTokens.map(function(t){return t.value}).join("");
                        return {
                            type: "queryRef",
                            css: queryValue,
                            evaluate: function () {
                                return document.querySelectorAll(this.css);
                            }
                        };
                    }
                })

                _parser.addGrammarElement("attributeRef", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("[")) {
                        var content = tokens.consumeUntil("]");
                        var contentStr = content.map(function (t) {
                            return t.value
                        }).join("");
                        var values = contentStr.split("=");
                        var name = values[0];
                        var value = values[1];
                        tokens.requireOpToken("]");

                        return {
                            type: "attribute_expression",
                            name: name,
                            value: value,
                            args: [value],
                            op:function(context, value){
                                if (this.value) {
                                    return {name:this.name, value:value}
                                } else {
                                    return {name:this.name};
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }
                })

                _parser.addLeafExpression("objectLiteral", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("{")) {
                        var fields = []
                        var valueExpressions = []
                        if (!tokens.matchOpToken("}")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER", "STRING");
                                tokens.requireOpToken(":");
                                var value = parser.requireElement("expression", tokens);
                                valueExpressions.push(value);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("}");
                        }
                        return {
                            type: "objectLiteral",
                            fields: fields,
                            args: [valueExpressions],
                            op:function(context, values){
                                var returnVal = {};
                                for (var i = 0; i < values.length; i++) {
                                    var field = fields[i];
                                    returnVal[field.name.value] = values[i];
                                }
                                return returnVal;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }
                })

                _parser.addGrammarElement("namedArgumentList", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("(")) {
                        var fields = []
                        var valueExpressions = []
                        if (!tokens.matchOpToken(")")) {
                            do {
                                var name = tokens.requireTokenType("IDENTIFIER");
                                tokens.requireOpToken(":");
                                var value = parser.requireElement("expression", tokens);
                                valueExpressions.push(value);
                                fields.push({name: name, value: value});
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }
                        return {
                            type: "namedArgumentList",
                            fields: fields,
                            args:[valueExpressions],
                            op:function(context, values){
                                var returnVal = {_namedArgList_:true};
                                for (var i = 0; i < values.length; i++) {
                                    var field = fields[i];
                                    returnVal[field.name.value] = values[i];
                                }
                                return returnVal;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }


                })

                _parser.addGrammarElement("symbol", function(parser, runtime, tokens) {
                    var identifier = tokens.matchTokenType('IDENTIFIER');
                    if (identifier) {
                        return {
                            type: "symbol",
                            token: identifier,
                            name: identifier.value,
                            evaluate: function (context) {
                                return runtime.resolveSymbol(identifier.value, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("implicitMeTarget", function(parser, runtime, tokens) {
                    return {
                        type: "implicitMeTarget",
                        evaluate: function (context) {
                            return context.me
                        }
                    };
                });

                _parser.addGrammarElement("implicitAllTarget", function(parser, runtime, tokens) {
                    return {
                        type: "implicitAllTarget",
                        evaluate: function (context) {
                            return document.querySelectorAll("*");
                        }
                    };
                });

                _parser.addLeafExpression("boolean", function(parser, runtime, tokens) {
                    var booleanLiteral = tokens.matchToken("true") || tokens.matchToken("false");
                    if (booleanLiteral) {
                        return {
                            type: "boolean",
                            evaluate: function (context) {
                                return booleanLiteral.value === "true";
                            }
                        }
                    }
                });

                _parser.addLeafExpression("null", function(parser, runtime, tokens) {
                    if (tokens.matchToken('null')) {
                        return {
                            type: "null",
                            evaluate: function (context) {
                                return null;
                            }
                        }
                    }
                });

                _parser.addLeafExpression("arrayLiteral", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken('[')) {
                        var values = [];
                        if (!tokens.matchOpToken(']')) {
                            do {
                                var expr = parser.requireElement("expression", tokens);
                                values.push(expr);
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken("]");
                        }
                        return {
                            type: "arrayLiteral",
                            values: values,
                            args: [values],
                            op:function(context, values){
                                return values;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    }
                });

                _parser.addLeafExpression("blockLiteral", function(parser, runtime, tokens) {
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
                        var expr = parser.requireElement("expression", tokens);
                        return {
                            type: "blockLiteral",
                            args: args,
                            expr: expr,
                            evaluate: function (ctx) {
                                var returnFunc = function(){
                                    //TODO - push scope
                                    for (var i = 0; i < args.length; i++) {
                                        ctx[args[i].value] = arguments[i];
                                    }
                                    return expr.evaluate(ctx) //OK
                                }
                                return returnFunc;
                            }
                        }
                    }
                });

                _parser.addGrammarElement("timeExpression", function(parser, runtime, tokens){
                    var time = parser.requireElement("expression", tokens);
                    var factor = 1;
                    if (tokens.matchToken("s") || tokens.matchToken("seconds")) {
                        factor = 1000;
                    } else if (tokens.matchToken("ms") || tokens.matchToken("milliseconds")) {
                        // do nothing
                    }
                    return {
                        type:"timeExpression",
                        time: time,
                        factor: factor,
                        args: [time],
                        op: function (context, val) {
                            return val * this.factor
                        },
                        evaluate: function (context) {
                            return runtime.unifiedEval(this, context);
                        }
                    }
                })

                _parser.addIndirectExpression("propertyAccess", function(parser, runtime, tokens, root) {
                    if (tokens.matchOpToken(".")) {
                        var prop = tokens.requireTokenType("IDENTIFIER");
                        var propertyAccess = {
                            type: "propertyAccess",
                            root: root,
                            prop: prop,
                            args: [root],
                            op:function(context, rootVal){
                                var value = runtime.resolveProperty(rootVal, prop.value);
                                return value;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("of", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken("of")) {
                        var newRoot = parser.requireElement('expression', tokens);
                        // find the urroot
                        var childOfUrRoot = null;
                        var urRoot = root;
                        while (urRoot.root) {
                            childOfUrRoot = urRoot;
                            urRoot = urRoot.root;
                        }
                        if (urRoot.type !== 'symbol') {
                            parser.raiseParseError(tokens, "Cannot take a property of a non-symbol");
                        }
                        var prop = urRoot.name;
                        var propertyAccess = {
                            type: "ofExpression",
                            prop: urRoot.token,
                            root: newRoot,
                            expression: root,
                            args: [newRoot],
                            op:function(context, rootVal){
                                return runtime.resolveProperty(rootVal, prop);
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };

                        if (childOfUrRoot) {
                            childOfUrRoot.root = propertyAccess;
                            childOfUrRoot.args = [propertyAccess];
                        } else {
                            root = propertyAccess;
                        }

                        return parser.parseElement("indirectExpression", tokens, root);
                    }
                });

                _parser.addIndirectExpression("inExpression", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken("in")) {
                        if (root.type !== "idRef" && root.type === "queryRef" || root.type === "classRef") {
                            var query = true;
                        }
                        var target = parser.requireElement("expression", tokens);
                        var propertyAccess = {
                            type: "inExpression",
                            root: root,
                            args: [query ? null : root, target],
                            op:function(context, rootVal, target){
                                var returnArr = [];
                                if(query){
                                    runtime.forEach(target, function (targetElt) {
                                        var results = targetElt.querySelectorAll(root.css);
                                        for (var i = 0; i < results.length; i++) {
                                            returnArr.push(results[i]);
                                        }
                                    })
                                } else {
                                    runtime.forEach(rootVal, function(rootElt){
                                        runtime.forEach(target, function(targetElt){
                                            if (rootElt === targetElt) {
                                                returnArr.push(rootElt);
                                            }
                                        })
                                    })
                                }
                                if (returnArr.length > 0) {
                                    return returnArr;
                                } else {
                                    return null;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("asExpression", function(parser, runtime, tokens, root) {
                    if (tokens.matchToken("as")) {
                        var conversion = parser.requireElement('dotOrColonPath', tokens).evaluate(); // OK No promise
                        var propertyAccess = {
                            type: "asExpression",
                            root: root,
                            args: [root],
                            op:function(context, rootVal){
                                return runtime.convertValue(rootVal, conversion);
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                        return parser.parseElement("indirectExpression", tokens, propertyAccess);
                    }
                });

                _parser.addIndirectExpression("functionCall", function(parser, runtime, tokens, root) {
                    if (tokens.matchOpToken("(")) {
                        var args = [];
                        if (!tokens.matchOpToken(')')) {
                            do {
                                args.push(parser.requireElement("expression", tokens));
                            } while (tokens.matchOpToken(","))
                            tokens.requireOpToken(")");
                        }

                        if (root.root) {
                            var functionCall = {
                                type: "functionCall",
                                root: root,
                                argExressions: args,
                                args: [root.root, args],
                                op: function (context, rootRoot, args) {
                                    var func = rootRoot[root.prop.value];
                                    if (func.hyperfunc) {
                                        args.push(context);
                                    }
                                    return func.apply(rootRoot, args);
                                },
                                evaluate: function (context) {
                                    return runtime.unifiedEval(this, context);
                                }
                            }
                        } else {
                            var functionCall = {
                                type: "functionCall",
                                root: root,
                                argExressions: args,
                                args: [root, args],
                                op: function(context, func, argVals){
                                    if (func.hyperfunc) {
                                        argVals.push(context);
                                    }
                                    var apply = func.apply(null, argVals);
                                    return apply;
                                },
                                evaluate: function (context) {
                                    return runtime.unifiedEval(this, context);
                                }
                            }
                        }
                        return parser.parseElement("indirectExpression", tokens, functionCall);
                    }
                });

                _parser.addIndirectExpression("arrayIndex", function (parser, runtime, tokens, root) {
                    if (tokens.matchOpToken("[")) {
                        var index = parser.requireElement("expression", tokens);
                        tokens.requireOpToken("]")

                        var arrayIndex = {
                            type: "arrayIndex",
                            root: root,
                            index: index,
                            args: [root, index],
                            op: function(ctx, root, index) {
                                return root[index]
                            },
                            evaluate: function(context){
                                return _runtime.unifiedEval(this, context);
                            }
                        };

                        return _parser.parseElement("indirectExpression", tokens, arrayIndex);
                    }
                });

                _parser.addGrammarElement("postfixExpression", function(parser, runtime, tokens) {
                    var root = parser.parseElement("primaryExpression", tokens);
                    if (tokens.matchOpToken(":")) {
                        var typeName = tokens.requireTokenType("IDENTIFIER");
                        var nullOk = !tokens.matchOpToken("!");
                        return {
                            type: "typeCheck",
                            typeName: typeName,
                            root: root,
                            nullOk: nullOk,
                            args: [root],
                            op: function (context, val) {
                                return runtime.typeCheck(val, this.typeName.value, this.nullOk);
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                    } else {
                        return root;
                    }
                });

                _parser.addGrammarElement("logicalNot", function(parser, runtime, tokens) {
                    if (tokens.matchToken("not")) {
                        var root = parser.requireElement("unaryExpression", tokens);
                        return {
                            type: "logicalNot",
                            root: root,
                            args: [root],
                            op: function (context, val) {
                                return !val;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("noExpression", function(parser, runtime, tokens) {
                    if (tokens.matchToken("no")) {
                        var root = parser.requireElement("unaryExpression", tokens);
                        return {
                            type: "noExpression",
                            root: root,
                            args: [root],
                            op: function (context, val) {
                                return val == null || val.length === 0;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("negativeNumber", function(parser, runtime, tokens) {
                    if (tokens.matchOpToken("-")) {
                        var root = parser.requireElement("unaryExpression", tokens);
                        return {
                            type: "negativeNumber",
                            root: root,
                            args: [root],
                            op:function(context, value){
                                return -1 * value;
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                });

                _parser.addGrammarElement("unaryExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["logicalNot", "noExpression", "negativeNumber", "postfixExpression"], tokens);
                });

                _parser.addGrammarElement("mathOperator", function(parser, runtime, tokens) {
                    var expr = parser.parseElement("unaryExpression", tokens);
                    var mathOp, initialMathOp = null;
                    mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    while (mathOp) {
                        initialMathOp = initialMathOp || mathOp;
                        var operator = mathOp.value;
                        if (initialMathOp.value !== operator) {
                            parser.raiseParseError(tokens, "You must parenthesize math operations with different operators")
                        }
                        var rhs = parser.parseElement("unaryExpression", tokens);
                        expr = {
                            type: "mathOperator",
                            lhs: expr,
                            rhs: rhs,
                            operator: operator,
                            args: [expr, rhs],
                            op:function (context, lhsVal, rhsVal) {
                                if (this.operator === "+") {
                                    return lhsVal + rhsVal;
                                } else if (this.operator === "-") {
                                    return lhsVal - rhsVal;
                                } else if (this.operator === "*") {
                                    return lhsVal * rhsVal;
                                } else if (this.operator === "/") {
                                    return lhsVal / rhsVal;
                                } else if (this.operator === "%") {
                                    return lhsVal % rhsVal;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                        mathOp = tokens.matchAnyOpToken("+", "-", "*", "/", "%")
                    }
                    return expr;
                });

                _parser.addGrammarElement("mathExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
                });

                _parser.addGrammarElement("comparisonOperator", function(parser, runtime, tokens) {
                    var expr = parser.parseElement("mathExpression", tokens);
                    var comparisonToken = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==")
                    var comparisonStr = comparisonToken ? comparisonToken.value : null;
                    if (comparisonStr == null) {
                        if (tokens.matchToken("is") || tokens.matchToken("am")) {
                            if (tokens.matchToken("not")) {
                                if (tokens.matchToken("in")) {
                                    comparisonStr = "not in";
                                } else {
                                    comparisonStr = "!=";
                                }
                            } else {
                                if (tokens.matchToken("in")) {
                                    comparisonStr = "in";
                                } else {
                                    comparisonStr = "==";
                                }
                            }
                        } else if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                            comparisonStr = "match";
                        } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                            comparisonStr = "contain";
                        } else if (tokens.matchToken("do") || tokens.matchToken("does")) {
                            tokens.requireToken('not');
                            if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                                comparisonStr = "not match";
                            } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                                comparisonStr = "not contain";
                            } else {
                                parser.raiseParseError(tokens, "Expected matches or contains");
                            }
                        }
                    }

                    if (comparisonStr) { // Do not allow chained comparisons, which is dumb
                        var rhs = parser.requireElement("mathExpression", tokens);
                        if (comparisonStr === "match" || comparisonStr === "not match") {
                            rhs = rhs.css ? rhs.css : rhs;
                        }
                        expr = {
                            type: "comparisonOperator",
                            operator: comparisonStr,
                            lhs: expr,
                            rhs: rhs,
                            args: [expr, rhs],
                            op:function (context, lhsVal, rhsVal) {
                                if (this.operator === "==") {
                                    return lhsVal == rhsVal;
                                } else if (this.operator === "!=") {
                                    return lhsVal != rhsVal;
                                } if (this.operator === "in") {
                                    return (rhsVal != null) && Array.from(rhsVal).indexOf(lhsVal) >= 0;
                                } if (this.operator === "not in") {
                                    return (rhsVal == null) || Array.from(rhsVal).indexOf(lhsVal) < 0;
                                } if (this.operator === "match") {
                                    return (lhsVal != null) && lhsVal.matches(rhsVal);
                                } if (this.operator === "not match") {
                                    return (lhsVal == null) || !lhsVal.matches(rhsVal);
                                } if (this.operator === "contain") {
                                    return (lhsVal != null) && lhsVal.contains(rhsVal);
                                } if (this.operator === "not contain") {
                                    return (lhsVal == null) || !lhsVal.contains(rhsVal);
                                } if (this.operator === "===") {
                                    return lhsVal === rhsVal;
                                } else if (this.operator === "!==") {
                                    return lhsVal !== rhsVal;
                                } else if (this.operator === "<") {
                                    return lhsVal < rhsVal;
                                } else if (this.operator === ">") {
                                    return lhsVal > rhsVal;
                                } else if (this.operator === "<=") {
                                    return lhsVal <= rhsVal;
                                } else if (this.operator === ">=") {
                                    return lhsVal >= rhsVal;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        };
                    }
                    return expr;
                });

                _parser.addGrammarElement("comparisonExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("logicalOperator", function(parser, runtime, tokens) {
                    var expr = parser.parseElement("comparisonExpression", tokens);
                    var logicalOp, initialLogicalOp = null;
                    logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    while (logicalOp) {
                        initialLogicalOp = initialLogicalOp || logicalOp;
                        if (initialLogicalOp.value !== logicalOp.value) {
                            parser.raiseParseError(tokens, "You must parenthesize logical operations with different operators")
                        }
                        var rhs = parser.requireElement("comparisonExpression", tokens);
                        expr = {
                            type: "logicalOperator",
                            operator: logicalOp.value,
                            lhs: expr,
                            rhs: rhs,
                            args: [expr, rhs],
                            op: function (context, lhsVal, rhsVal) {
                                if (this.operator === "and") {
                                    return lhsVal && rhsVal;
                                } else {
                                    return lhsVal || rhsVal;
                                }
                            },
                            evaluate: function (context) {
                                return runtime.unifiedEval(this, context);
                            }
                        }
                        logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
                    }
                    return expr;
                });

                _parser.addGrammarElement("logicalExpression", function(parser, runtime, tokens) {
                    return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
                });

                _parser.addGrammarElement("asyncExpression", function(parser, runtime, tokens) {
                    if (tokens.matchToken('async')) {
                        var value = parser.requireElement("logicalExpression", tokens);
                        var expr = {
                            type: "asyncExpression",
                            value: value,
                            evaluate: function (context) {
                                return {
                                    asyncWrapper: true,
                                    value: this.value.evaluate(context) //OK
                                }
                            }
                        }
                        return expr;
                    } else {
                        return parser.parseElement("logicalExpression", tokens);
                    }
                });

                _parser.addGrammarElement("expression", function(parser, runtime, tokens) {
                    tokens.matchToken("the"); // optional the
                    return parser.parseElement("asyncExpression", tokens);
                });

                _parser.addGrammarElement("target", function(parser, runtime, tokens) {
                    var expr = _parser.parseElement("expression", tokens);
                    if (expr.type === "symbol" || expr.type === "idRef" || expr.type === "inExpression" ||
                        expr.type === "queryRef" || expr.type === "classRef" || expr.type === "ofExpression" ||
                        expr.type === "propertyAccess") {
                        return expr;
                    } else {
                        _parser.raiseParseError(tokens, "A target expression must be writable");
                    }
                    return expr;
                });

                _parser.addGrammarElement("hyperscript", function(parser, runtime, tokens) {

                    var features = [];

                    if (tokens.hasMore()) {
                        do {
                            var feature = parser.requireElement("feature", tokens);
                            features.push(feature);
                            tokens.matchToken("end"); // optional end
                        } while (parser.featureStart(tokens.currentToken()) || tokens.currentToken().value === "(")
                        if (tokens.hasMore()) {
                            parser.raiseParseError(tokens);
                        }
                    }
                    return {
                        type: "hyperscript",
                        features: features,
                        apply: function (target, source) {
                            // no op
                            _runtime.forEach(features, function(feature){
                                feature.install(target, source);
                            })
                        }
                    };
                })

                _parser.addFeature("on", function(parser, runtime, tokens) {
                    if (tokens.matchToken('on')) {
                        var every = false;
                        if (tokens.matchToken("every")) {
                            every = true;
                        }
                        var events = [];
                        var displayName = null;
                        do {

                            var on = parser.requireElement("dotOrColonPath", tokens, "Expected event name");

                            var eventName = on.evaluate(); // OK No Promise
                            if (displayName) {
                                displayName = displayName + " or " + eventName;
                            } else {
                                displayName = "on " + eventName;
                            }
                            var args = [];
                            // handle argument list (look ahead 3)
                            if (tokens.token(0).value === "(" &&
                                (tokens.token(1).value === ")" ||
                                    tokens.token(2).value === "," ||
                                    tokens.token(2).value === ")")) {
                                tokens.matchOpToken("(");
                                do {
                                    args.push(tokens.requireTokenType('IDENTIFIER'));
                                } while (tokens.matchOpToken(","))
                                tokens.requireOpToken(')')
                            }

                            var filter = null;
                            if (tokens.matchOpToken('[')) {
                                filter = parser.requireElement("expression", tokens);
                                tokens.requireOpToken(']');
                            }

                            if (tokens.currentToken().type === "NUMBER") {
                                var startCountToken = tokens.consumeToken();
                                var startCount = parseInt(startCountToken.value);
                                if (tokens.matchToken("to")) {
                                    var endCountToken = tokens.consumeToken();
                                    var endCount = parseInt(endCountToken.value);
                                } else if (tokens.matchToken("and")) {
                                    var unbounded = true;
                                    tokens.requireToken("on");
                                }
                            }

                            var from = null;
                            var elsewhere = false;
                            if (tokens.matchToken("from")) {
                                if (tokens.matchToken('elsewhere')) {
                                    elsewhere = true;
                                } else {
                                    from = parser.parseElement("target", tokens)
                                    if (!from) {
                                        parser.raiseParseError('Expected either target value or "elsewhere".', tokens);
                                    }
                                }
                            }
                            // support both "elsewhere" and "from elsewhere"
                            if (from === null && elsewhere === false && tokens.matchToken("elsewhere")) {
                                elsewhere = true;
                            }

                            if (tokens.matchToken('in')) {
                                var inExpr = parser.parseAnyOf(["idRef", "queryRef", "classRef"], tokens);
                            }

                            if (tokens.matchToken('debounced')) {
                                tokens.requireToken("at");
                                var timeExpr = parser.requireElement("timeExpression", tokens);
                                var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                            } else if (tokens.matchToken('throttled')) {
                                tokens.requireToken("at");
                                var timeExpr = parser.requireElement("timeExpression", tokens);
                                var throttleTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                            }

                            events.push({
                                execCount: 0,
                                every: every,
                                on: eventName,
                                args: args,
                                filter: filter,
                                from:from,
                                inExpr:inExpr,
                                elsewhere:elsewhere,
                                startCount : startCount,
                                endCount : endCount,
                                unbounded : unbounded,
                                debounceTime : debounceTime,
                                throttleTime : throttleTime,
                            })
                        } while (tokens.matchToken("or"))


                        var queue = [];
                        var queueLast = true;
                        if (!every) {
                            if (tokens.matchToken("queue")) {
                                if (tokens.matchToken("all")) {
                                    var queueAll = true;
                                    var queueLast = false;
                                } else if(tokens.matchToken("first")) {
                                    var queueFirst = true;
                                } else if(tokens.matchToken("none")) {
                                    var queueNone = true;
                                } else {
                                    tokens.requireToken("last");
                                }
                            }
                        }

                        var start = parser.requireElement("commandList", tokens);

                        var implicitReturn = {
                            type: "implicitReturn",
                            op: function (context) {
                                // automatically resolve at the end of an event handler if nothing else does
                                context.meta.resolve();
                                return runtime.HALT;
                            },
                            execute: function (ctx) {
                                // do nothing
                            }
                        };
                        if (start) {
                            var end = start;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        } else {
                            start = implicitReturn
                        }

                        var onFeature = {
                            displayName: displayName,
                            events:events,
                            start: start,
                            every: every,
                            executing: false,
                            execCount: 0,
                            queue: queue,
                            execute: function (ctx) {
                                if (this.executing && this.every === false) {
                                    if (queueNone || (queueFirst && queue.length > 0)) {
                                        return;
                                    }
                                    if (queueLast) {
                                        onFeature.queue.length = 0;
                                    }
                                    onFeature.queue.push(ctx);
                                    return;
                                }
                                this.execCount++;
                                this.executing = true;
                                ctx.meta.resolve = function () {
                                    onFeature.executing = false;
                                    var queued = onFeature.queue.shift();
                                    if (queued) {
                                        setTimeout(function () {
                                            onFeature.execute(queued);
                                        }, 1);
                                    }
                                }
                                ctx.meta.reject = function (err) {
                                    console.error(err.message ? err.message : err);
                                    var hypertrace = runtime.getHyperTrace(ctx, err);
                                    if (hypertrace) {
                                        hypertrace.print();
                                    }
                                    runtime.triggerEvent(ctx.me, 'exception', {error: err})
                                    onFeature.executing = false;
                                    var queued = onFeature.queue.shift();
                                    if (queued) {
                                        setTimeout(function () {
                                            onFeature.execute(queued);
                                        }, 1);
                                    }
                                }
                                start.execute(ctx);
                            },
                            install: function (elt, source) {
                                runtime.forEach(onFeature.events, function(eventSpec) {
                                    var targets;
                                    if (eventSpec.elsewhere) {
                                        targets = [document];
                                    } else if (eventSpec.from) {
                                        targets = eventSpec.from.evaluate({});
                                    } else {
                                        targets = [elt];
                                    }
                                    runtime.forEach(targets, function (target) { // OK NO PROMISE
                                        target.addEventListener(eventSpec.on, function (evt) { // OK NO PROMISE
                                            var ctx = runtime.makeContext(elt, onFeature, elt, evt);
                                            if (eventSpec.elsewhere && elt.contains(evt.target)) {
                                                return
                                            }

                                            // establish context
                                            runtime.forEach(eventSpec.args, function (arg) {
                                                ctx[arg.value] = ctx.event[arg.value] || (ctx.event.detail ? ctx.event.detail[arg.value] : null);
                                            });

                                            // apply filter
                                            if (eventSpec.filter) {
                                                var initialCtx = ctx.meta.context;
                                                ctx.meta.context = ctx.event;
                                                try {
                                                    var value = eventSpec.filter.evaluate(ctx); //OK NO PROMISE
                                                    if (value) {
                                                        // match the javascript semantics for if statements
                                                    } else {
                                                        return;
                                                    }
                                                } finally {
                                                    ctx.meta.context = initialCtx;
                                                }
                                            }

                                            if (eventSpec.inExpr) {
                                                var inElement = evt.target;
                                                while(true) {
                                                    if (inElement.matches && inElement.matches(eventSpec.inExpr.css)) {
                                                        ctx.result = inElement;
                                                        break;
                                                    } else {
                                                        inElement = inElement.parentElement;
                                                        if (inElement == null) {
                                                            return; // no match found
                                                        }
                                                    }
                                                }
                                            }

                                            // verify counts
                                            eventSpec.execCount++;
                                            if (eventSpec.startCount) {
                                                if (eventSpec.endCount) {
                                                    if (eventSpec.execCount < eventSpec.startCount ||
                                                        eventSpec.execCount > eventSpec.endCount) {
                                                        return;
                                                    }
                                                } else if (eventSpec.unbounded) {
                                                    if (eventSpec.execCount < eventSpec.startCount) {
                                                        return;
                                                    }
                                                } else if (eventSpec.execCount !== eventSpec.startCount) {
                                                    return;
                                                }
                                            }

                                            //debounce
                                            if (eventSpec.debounceTime) {
                                                if (eventSpec.debounced) {
                                                    clearTimeout(eventSpec.debounced);
                                                }
                                                eventSpec.debounced = setTimeout(function () {
                                                    onFeature.execute(ctx);
                                                }, eventSpec.debounceTime);
                                                return;
                                            }

                                            // throttle
                                            if (eventSpec.throttleTime) {
                                                if (eventSpec.lastExec && Date.now() < eventSpec.lastExec + eventSpec.throttleTime) {
                                                    return;
                                                } else {
                                                    eventSpec.lastExec = Date.now();
                                                }
                                            }

                                            // apply execute
                                            onFeature.execute(ctx);
                                        });
                                    })
                                });
                            }
                        };
                        parser.setParent(start, onFeature);
                        return onFeature;
                    }
                });

                _parser.addFeature("def", function(parser, runtime, tokens) {
                    if (tokens.matchToken('def')) {
                        var functionName = parser.requireElement("dotOrColonPath", tokens);
                        var nameVal = functionName.evaluate(); // OK
                        var nameSpace = nameVal.split(".");
                        var funcName = nameSpace.pop();

                        var args = [];
                        if (tokens.matchOpToken("(")) {
                            if (tokens.matchOpToken(")")) {
                                // emtpy args list
                            } else {
                                do {
                                    args.push(tokens.requireTokenType('IDENTIFIER'));
                                } while (tokens.matchOpToken(","))
                                tokens.requireOpToken(')')
                            }
                        }

                        var start = parser.parseElement("commandList", tokens);
                        if (tokens.matchToken('catch')) {
                            var errorSymbol = tokens.requireTokenType('IDENTIFIER').value;
                            var errorHandler = parser.parseElement("commandList", tokens);
                        }
                        var functionFeature = {
                            displayName: funcName + "(" + args.map(function(arg){ return arg.value }).join(", ") + ")",
                            name: funcName,
                            args: args,
                            start: start,
                            errorHandler: errorHandler,
                            errorSymbol: errorSymbol,
                            install: function (target, source) {
                                var func = function () {
                                    // null, worker
                                    var elt = 'document' in globalScope ? document.body : globalScope
                                    var ctx = runtime.makeContext(source, functionFeature, elt, null);

                                    // install error handler if any
                                    ctx.meta.errorHandler = errorHandler;
                                    ctx.meta.errorSymmbol = errorSymbol;

                                    for (var i = 0; i < args.length; i++) {
                                        var name = args[i];
                                        var argumentVal = arguments[i];
                                        if (name) {
                                            ctx[name.value] = argumentVal;
                                        }
                                    }
                                    ctx.meta.caller = arguments[args.length];
                                    var resolve, reject = null;
                                    var promise = new Promise(function (theResolve, theReject) {
                                        resolve = theResolve;
                                        reject = theReject;
                                    });
                                    start.execute(ctx);
                                    if (ctx.meta.returned) {
                                        return ctx.meta.returnValue;
                                    } else {
                                        ctx.meta.resolve = resolve;
                                        ctx.meta.reject = reject;
                                        return promise
                                    }
                                };
                                func.hyperfunc = true;
                                runtime.assignToNamespace(nameSpace, funcName, func);
                            }
                        };

                        var implicitReturn = {
                            type: "implicitReturn",
                            op: function (context) {
                                // automatically return at the end of the function if nothing else does
                                context.meta.returned = true;
                                if (context.meta.resolve) {
                                    context.meta.resolve();
                                }
                                return runtime.HALT;
                            },
                            execute: function (context) {
                                // do nothing
                            }
                        }
                        // terminate body
                        if (start) {
                            var end = start;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        } else {
                            functionFeature.start = implicitReturn
                        }

                        // terminate error handler
                        if (errorHandler) {
                            var end = errorHandler;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        }

                        parser.setParent(start, functionFeature);
                        return functionFeature;
                    }
                });

                _parser.addFeature("init", function(parser, runtime, tokens) {
                    if (tokens.matchToken('init')) {
                        var start = parser.parseElement("commandList", tokens);
                        var initFeature = {
                            start: start,
                            install: function (target, source) {
                                setTimeout(function () {
                                    start.execute(runtime.makeContext(target, this, target));
                                }, 0);
                            }
                        };

                        var implicitReturn = {
                            type: "implicitReturn",
                            op: function (context) {
                                return runtime.HALT;
                            },
                            execute: function (context) {
                                // do nothing
                            }
                        }
                        // terminate body
                        if (start) {
                            var end = start;
                            while (end.next) {
                                end = end.next;
                            }
                            end.next = implicitReturn
                        } else {
                            initFeature.start = implicitReturn
                        }
                        parser.setParent(start, initFeature);
                        return initFeature;
                    }
                });

                _parser.addFeature("worker", function (parser, runtime, tokens) {
                    if (tokens.matchToken("worker")) {
                        parser.raiseParseError(tokens,
                            "In order to use the 'worker' feature, include " +
                            "the _hyperscript worker plugin. See " +
                            "https://hyperscript.org/features/worker/ for " +
                            "more info.")
                    }
                })

                _parser.addGrammarElement("jsBody", function(parser, runtime, tokens) {
                    var jsSourceStart = tokens.currentToken().start;
                    var jsLastToken = tokens.currentToken();

                    var funcNames = [];
                    var funcName = "";
                    var expectFunctionDeclaration = false;
                    while (tokens.hasMore()) {
                        jsLastToken = tokens.consumeToken();
                        var peek = tokens.currentToken(true);
                        if (peek.type === "IDENTIFIER"
                            && peek.value === "end") {
                            break;
                        }
                        if (expectFunctionDeclaration) {
                            if (jsLastToken.type === "IDENTIFIER"
                                || jsLastToken.type === "NUMBER") {
                                funcName += jsLastToken.value;
                            } else {
                                if (funcName !== "") funcNames.push(funcName);
                                funcName = "";
                                expectFunctionDeclaration = false;
                            }
                        } else if (jsLastToken.type === "IDENTIFIER"
                            && jsLastToken.value === "function") {
                            expectFunctionDeclaration = true;
                        }
                    }
                    var jsSourceEnd = jsLastToken.end + 1;

                    return {
                        type: 'jsBody',
                        exposedFunctionNames: funcNames,
                        jsSource: tokens.source.substring(jsSourceStart, jsSourceEnd),
                    }
                })

                _parser.addFeature("js", function(parser, runtime, tokens) {
                    if (tokens.matchToken('js')) {

                        var jsBody = parser.parseElement('jsBody', tokens);

                        var jsSource = jsBody.jsSource +
                            "\nreturn { " +
                            jsBody.exposedFunctionNames.map(function (name) {
                                return name+":"+name;
                            }).join(",") +
                            " } ";
                        var func = new Function(jsSource);

                        return {
                            jsSource: jsSource,
                            function: func,
                            exposedFunctionNames: jsBody.exposedFunctionNames,
                            install: function() {
                                mergeObjects(globalScope, func())
                            }
                        }
                    }
                })

                _parser.addCommand("js", function (parser, runtime, tokens) {
                    if (tokens.matchToken("js")) {
                        // Parse inputs
                        var inputs = [];
                        if (tokens.matchOpToken("(")) {
                            if (tokens.matchOpToken(")")) {
                                // empty input list
                            } else {
                                do {
                                    var inp = tokens.requireTokenType('IDENTIFIER');
                                    inputs.push(inp.value);
                                } while (tokens.matchOpToken(","));
                                tokens.requireOpToken(')');
                            }
                        }

                        var jsBody = parser.parseElement('jsBody', tokens);
                        tokens.matchToken('end');

                        var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

                        return {
                            jsSource: jsBody.jsSource,
                            function: func,
                            inputs: inputs,
                            op: function (context) {
                                var args = [];
                                inputs.forEach(function (input) {
                                    args.push(runtime.resolveSymbol(input, context))
                                });
                                var result = func.apply(globalScope, args)
                                if (result && typeof result.then === 'function') {
                                    return Promise(function (resolve) {
                                        result.then(function (actualResult) {
                                            context.result = actualResult
                                            resolve(runtime.findNext(this, context));
                                        })
                                    })
                                } else {
                                    context.result = result
                                    return runtime.findNext(this, context);
                                }
                            }
                        };
                    }
                })

                _parser.addCommand("async", function (parser, runtime, tokens) {
                    if (tokens.matchToken("async")) {
                        if (tokens.matchToken("do")) {
                            var body = parser.requireElement('commandList', tokens)
                            tokens.requireToken("end")
                        } else {
                            var body = parser.requireElement('command', tokens)
                        }
                        return {
                            body: body,
                            op: function (context) {
                                setTimeout(function(){
                                    body.execute(context);
                                })
                                return runtime.findNext(this, context);
                            }
                        };
                    }
                })

                _parser.addCommand("with", function (parser, runtime, tokens) {
                    var startToken = tokens.currentToken();
                    if (tokens.matchToken("with")) {
                        var value = parser.requireElement("expression", tokens);
                        var body = parser.requireElement('commandList', tokens)
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }
                        var slot = "with_" + startToken.start;
                        var withCmd = {
                            value: value,
                            body: body,
                            args: [value],
                            resolveNext: function (context) {
                                var iterator = context.meta.iterators[slot];
                                if (iterator.index < iterator.value.length) {
                                    context.me = iterator.value[iterator.index++];
                                    return body;
                                } else {
                                    // restore original me
                                    context.me = iterator.originalMe;
                                    if (this.next) {
                                        return this.next;
                                    } else {
                                        return runtime.findNext(this.parent, context);
                                    }
                                }
                            },
                            op: function (context, value) {
                                if (value == null) {
                                    value = [];
                                } else if (!(Array.isArray(value) || value instanceof NodeList)) {
                                    value = [value];
                                }
                                context.meta.iterators[slot] = {
                                    originalMe: context.me,
                                    index: 0,
                                    value: value
                                };
                                return this.resolveNext(context);
                            }
                        };
                        parser.setParent(body, withCmd);
                        return withCmd;
                    }
                })

                _parser.addCommand("wait", function(parser, runtime, tokens) {
                    if (tokens.matchToken("wait")) {
                        // wait on event
                        if (tokens.matchToken("for")) {
                            tokens.matchToken("a"); // optional "a"
                            var evt = _parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                            if (tokens.matchToken("from")) {
                                var on = parser.requireElement("expression", tokens);
                            }
                            // wait on event
                            var waitCmd = {
                                event: evt,
                                on: on,
                                args: [evt, on],
                                op: function (context, eventName, on) {
                                    var target = on ? on : context.me;
                                    return new Promise(function (resolve) {
                                        var listener = function () {
                                            resolve(runtime.findNext(waitCmd, context));
                                        };
                                        target.addEventListener(eventName, listener, {once: true});
                                    });
                                }
                            };
                        } else {
                            var time = _parser.requireElement("timeExpression", tokens);
                            var waitCmd = {
                                type: "waitCmd",
                                time: time,
                                args: [time],
                                op: function (context, timeValue) {
                                    return new Promise(function (resolve) {
                                        setTimeout(function () {
                                            resolve(runtime.findNext(waitCmd, context));
                                        }, timeValue);
                                    });
                                },
                                execute: function (context) {
                                    return runtime.unifiedExec(this, context);
                                }
                            };
                        }
                        return waitCmd
                    }
                })

                // TODO  - colon path needs to eventually become part of ruby-style symbols
                _parser.addGrammarElement("dotOrColonPath", function(parser, runtime, tokens) {
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
                            evaluate: function () {
                                return path.join(separator ? separator.value : "");
                            }
                        }
                    }
                });

                _parser.addCommand("send", function(parser, runtime, tokens) {
                    if (tokens.matchToken('send')) {
                        var eventName = parser.requireElement("dotOrColonPath", tokens);

                        var details = parser.parseElement("namedArgumentList", tokens);
                        if (tokens.matchToken("to")) {
                            var to = parser.requireElement("target", tokens);
                        } else {
                            var to = parser.requireElement("implicitMeTarget");
                        }


                        var sendCmd = {
                            eventName: eventName,
                            details: details,
                            to: to,
                            args: [to, eventName, details],
                            op: function (context, to, eventName, details) {
                                runtime.forEach(to, function (target) {
                                    runtime.triggerEvent(target, eventName, details ? details : {});
                                });
                                return runtime.findNext(sendCmd, context);
                            }
                        };
                        return sendCmd
                    }
                })

                _parser.addCommand("return", function(parser, runtime, tokens) {
                    if (tokens.matchToken('return')) {
                        var value = parser.requireElement("expression", tokens);

                        var returnCmd = {
                            value: value,
                            args: [value],
                            op: function (context, value) {
                                var resolve = context.meta.resolve;
                                context.meta.returned = true;
                                if (resolve) {
                                    if (value) {
                                        resolve(value);
                                    } else {
                                        resolve()
                                    }
                                } else {
                                    context.meta.returned = true;
                                    context.meta.returnValue = value;
                                }
                                return runtime.HALT;
                            }
                        };
                        return returnCmd
                    }
                })

                _parser.addCommand("log", function(parser, runtime, tokens) {
                    if (tokens.matchToken('log')) {
                        var exprs = [parser.parseElement("expression", tokens)];
                        while (tokens.matchOpToken(",")) {
                            exprs.push(parser.requireElement("expression", tokens));
                        }
                        if (tokens.matchToken("with")) {
                            var withExpr = parser.requireElement("expression", tokens);
                        }
                        var logCmd = {
                            exprs: exprs,
                            withExpr: withExpr,
                            args: [withExpr, exprs],
                            op: function (ctx, withExpr, values) {
                                if (withExpr) {
                                    withExpr.apply(null, values);
                                } else {
                                    console.log.apply(null, values);
                                }
                                return runtime.findNext(this, ctx);
                            }
                        };
                        return logCmd;
                    }
                })

                _parser.addCommand("throw", function(parser, runtime, tokens) {
                    if (tokens.matchToken('throw')) {
                        var expr = parser.requireElement("expression", tokens);
                        var throwCmd = {
                            expr: expr,
                            args: [expr],
                            op: function (ctx, expr) {
                                runtime.registerHyperTrace(ctx, expr);
                                var reject = ctx.meta && ctx.meta.reject;
                                if (reject) {
                                    reject(expr);
                                    return runtime.HALT;
                                } else {
                                    throw expr;
                                }
                            }
                        };
                        return throwCmd;
                    }
                })

                var parseCallOrGet = function(parser, runtime, tokens) {
                    var expr = parser.requireElement("expression", tokens);
                    var callCmd = {
                        expr: expr,
                        args: [expr],
                        op: function (context, result) {
                            context.result = result;
                            return runtime.findNext(callCmd, context);
                        }
                    };
                    return callCmd
                }
                _parser.addCommand("call", function(parser, runtime, tokens) {
                    if (tokens.matchToken('call')) {
                        var call = parseCallOrGet(parser, runtime, tokens);
                        if (call.expr && call.expr.type !== "functionCall") {
                            parser.raiseParseError(tokens, "Must be a function invocation");
                        }
                        return call;
                    }
                })
                _parser.addCommand("get", function(parser, runtime, tokens) {
                    if (tokens.matchToken('get')) {
                        return parseCallOrGet(parser, runtime, tokens);
                    }
                })

                _parser.addGrammarElement("pseudoCommand", function(parser, runtime, tokens) {
                    var expr = parser.requireElement("primaryExpression", tokens);
                    if (expr.type !== 'functionCall' && expr.root.type !== "symbol") {
                        parser.raiseParseError("Implicit function calls must start with a simple function", tokens);
                    }
                    // optional "with"
                    if (!tokens.matchToken("with") && parser.commandBoundary(tokens.currentToken())) {
                        var target = parser.requireElement("implicitMeTarget", tokens);
                    } else {
                        var target = parser.requireElement("expression", tokens);
                    }
                    var functionName = expr.root.name;
                    var functionArgs = expr.argExressions;

                    var pseudoCommand = {
                        type: "pseudoCommand",
                        expr: expr,
                        args: [target, functionArgs],
                        op: function (context, target, args) {
                            var func = target[functionName];
                            if (func.hyperfunc) {
                                args.push(context);
                            }
                            var result = func.apply(target, args);
                            context.result = result;
                            return runtime.findNext(pseudoCommand, context);
                        },
                        execute : function (context) {
                            return runtime.unifiedExec(this, context);
                        }
                    };

                    return pseudoCommand;
                })

                _parser.addCommand("set", function(parser, runtime, tokens) {
                    if (tokens.matchToken('set')) {
                        var target = parser.requireElement("target", tokens);

                        tokens.requireToken("to");

                        var value = parser.requireElement("expression", tokens);

                        var symbolWrite = target.type === "symbol";
                        if (target.type !== "symbol" && target.root == null) {
                            parser.raiseParseError(tokens, "Can only put directly into symbols, not references")
                        }

                        var root = null;
                        var prop = null;
                        if (symbolWrite) {
                            // root is null
                        } else {
                            prop = target.prop.value;
                            root = target.root;
                        }

                        var setCmd = {
                            target: target,
                            symbolWrite: symbolWrite,
                            value: value,
                            args: [root, value],
                            op: function (context, root, valueToSet) {
                                if (symbolWrite) {
                                    context[target.name] = valueToSet;
                                } else {
                                    runtime.forEach(root, function (elt) {
                                        elt[prop] = valueToSet;
                                    })
                                }
                                return runtime.findNext(this, context);
                            }
                        };
                        return setCmd
                    }
                })

                _parser.addCommand("if", function(parser, runtime, tokens) {
                    if (tokens.matchToken('if')) {
                        var expr = parser.requireElement("expression", tokens);
                        tokens.matchToken("then"); // optional 'then'
                        var trueBranch = parser.parseElement("commandList", tokens);
                        if (tokens.matchToken("else")) {
                            var falseBranch = parser.parseElement("commandList", tokens);
                        }
                        if (tokens.hasMore()) {
                            tokens.requireToken("end");
                        }
                        var ifCmd = {
                            expr: expr,
                            trueBranch: trueBranch,
                            falseBranch: falseBranch,
                            args: [expr],
                            op: function (context, expr) {
                                if (expr) {
                                    return trueBranch;
                                } else if (falseBranch) {
                                    return falseBranch;
                                } else {
                                    return runtime.findNext(this, context);
                                }
                            }
                        };
                        parser.setParent(trueBranch, ifCmd);
                        parser.setParent(falseBranch, ifCmd);
                        return ifCmd
                    }
                })

                var parseRepeatExpression = function(parser, tokens, runtime, startedWithForToken) {
                    var innerStartToken = tokens.currentToken();
                    if (tokens.matchToken("for") || startedWithForToken) {
                        var identifierToken = tokens.requireTokenType('IDENTIFIER');
                        var identifier = identifierToken.value;
                        tokens.requireToken("in");
                        var expression = parser.requireElement("expression", tokens);
                    } else if (tokens.matchToken("in")) {
                        var identifier = "it";
                        var expression = parser.requireElement("expression", tokens);
                    } else if (tokens.matchToken("while")) {
                        var whileExpr = parser.requireElement("expression", tokens);
                    } else if (tokens.matchToken("until")) {
                        var isUntil = true;
                        if (tokens.matchToken("event")) {
                            var evt = _parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                            if (tokens.matchToken("from")) {
                                var on = parser.requireElement("expression", tokens);
                            }
                        } else {
                            var whileExpr = parser.requireElement("expression", tokens);
                        }
                    } else if (tokens.matchTokenType('NUMBER')) {
                        var times = parseFloat(innerStartToken.value);
                        tokens.requireToken('times');
                    } else {
                        tokens.matchToken("forever"); // consume optional forever
                        var forever = true;
                    }

                    if (tokens.matchToken("index")) {
                        var identifierToken = tokens.requireTokenType('IDENTIFIER');
                        var indexIdentifier = identifierToken.value
                    }

                    var loop = parser.parseElement("commandList", tokens);
                    if (tokens.hasMore()) {
                        tokens.requireToken("end");
                    }

                    if (identifier == null) {
                        identifier = "_implicit_repeat_" + innerStartToken.start;
                        var slot = identifier;
                    } else {
                        var slot = identifier + "_" + innerStartToken.start;
                    }

                    var repeatCmd = {
                        identifier: identifier,
                        indexIdentifier: indexIdentifier,
                        slot: slot,
                        expression: expression,
                        forever: forever,
                        times: times,
                        until: isUntil,
                        event: evt,
                        on: on,
                        whileExpr: whileExpr,
                        resolveNext: function () {
                            return this;
                        },
                        loop: loop,
                        args: [whileExpr],
                        op: function (context, whileValue) {
                            var iterator = context.meta.iterators[slot];
                            var keepLooping = false;
                            if (this.forever) {
                                keepLooping = true;
                            } else if (this.until) {
                                if (evt) {
                                    keepLooping = context.meta.iterators[slot].eventFired === false;
                                } else {
                                    keepLooping = whileValue !== true;
                                }
                            } else if (whileValue) {
                                keepLooping = true;
                            } else if (times) {
                                keepLooping = iterator.index < this.times;
                            } else {
                                keepLooping = iterator.value !== null && iterator.index < iterator.value.length
                            }

                            if (keepLooping) {
                                if (iterator.value) {
                                    context[identifier] = iterator.value[iterator.index];
                                    context.result = iterator.value[iterator.index];
                                } else {
                                    context.result = iterator.index;
                                }
                                if (indexIdentifier) {
                                    context[indexIdentifier] = iterator.index;
                                }
                                iterator.index++;
                                return loop;
                            } else {
                                context.meta.iterators[slot] = null;
                                return runtime.findNext(this.parent, context);
                            }
                        }
                    };
                    parser.setParent(loop, repeatCmd);
                    var repeatInit = {
                        name: "repeatInit",
                        args: [expression, evt, on],
                        op: function (context, value, event, on) {
                            context.meta.iterators[slot] = {
                                index: 0,
                                value: value,
                                eventFired: false
                            };
                            if (evt) {
                                var target = on || context.me;
                                target.addEventListener(event, function (e) {
                                    context.meta.iterators[slot].eventFired = true;
                                }, {once: true});
                            }
                            return repeatCmd; // continue to loop
                        },
                        execute: function (context) {
                            return runtime.unifiedExec(this, context);
                        }
                    }
                    parser.setParent(repeatCmd, repeatInit);
                    return repeatInit
                }

                _parser.addCommand("repeat", function(parser, runtime, tokens) {
                    if (tokens.matchToken('repeat')) {
                        return parseRepeatExpression(parser, tokens, runtime,false);
                    }
                })

                _parser.addCommand("for", function(parser, runtime, tokens) {
                    if (tokens.matchToken('for')) {
                        return parseRepeatExpression(parser, tokens, runtime, true);
                    }
                })


                _parser.addGrammarElement("stringLike", function(parser, runtime, tokens) {
                    return _parser.parseAnyOf(["string", "nakedString"], tokens);
                });

                _parser.addCommand("fetch", function(parser, runtime, tokens) {
                    if (tokens.matchToken('fetch')) {


                        var url = parser.requireElement("stringLike", tokens);
                        var args = parser.parseElement("objectLiteral", tokens);

                        var type = "text";
                        if (tokens.matchToken("as")) {
                            if (tokens.matchToken("json")) {
                                type = "json";
                            } else if (tokens.matchToken("response")) {
                                type = "response";
                            } else if (tokens.matchToken("text")) {
                            } else {
                                parser.raiseParseError(tokens, "Unknown response type: " + tokens.currentToken());
                            }
                        }

                        var fetchCmd = {
                            url:url,
                            argExrepssions:args,
                            args: [url, args],
                            op: function (context, url, args) {
                                return new Promise(function (resolve, reject) {
                                    fetch(url, args)
                                        .then(function (value) {
                                            if (type === "response") {
                                                context.result = value;
                                                resolve(runtime.findNext(fetchCmd, context));
                                            } else if (type === "json") {
                                                value.json().then(function (result) {
                                                    context.result = result;
                                                    resolve(runtime.findNext(fetchCmd, context));
                                                })
                                            } else {
                                                value.text().then(function (result) {
                                                    context.result = result;
                                                    resolve(runtime.findNext(fetchCmd, context));
                                                })
                                            }
                                        })
                                        .catch(function (reason) {
                                            runtime.triggerEvent(context.me, "fetch:error", {
                                                reason: reason
                                            })
                                            reject(reason);
                                        })
                                })
                            }
                        };
                        return fetchCmd;
                    }
                })
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

            if ('document' in globalScope) {
                ready(function () {
                    mergeMetaConfig();
                    _runtime.processNode(document.body);
                    document.addEventListener("htmx:load", function(evt){
                        _runtime.processNode(evt.detail.elt);
                    })
                })
            }

            //====================================================================
            // API
            //====================================================================
            return mergeObjects(function (str, ctx) {
                    return _runtime.evaluate(str, ctx); //OK
                }, {
                    internals: {
                        lexer: _lexer,
                        parser: _parser,
                        runtime: _runtime,
                    },
                    addFeature: function (keyword, definition) {
                        _parser.addFeature(keyword, definition)
                    },
                    addCommand: function (keyword, definition) {
                        _parser.addCommand(keyword, definition)
                    },
                    addLeafExpression: function (keyword, definition) {
                        _parser.addLeafExpression(definition)
                    },
                    addIndirectExpression: function (keyword, definition) {
                        _parser.addIndirectExpression(definition)
                    },
                    evaluate: function (str, ctx) { //OK
                        return _runtime.evaluate(str, ctx); //OK
                    },
                    processNode: function (elt) {
                        _runtime.processNode(elt);
                    },
                    config: {
                        attributes: "_, script, data-script",
                        defaultTransition: "all 500ms ease-in",
                        conversions: CONVERSIONS
                    }
                }
            )
        }
    )()
}));
///=========================================================================
/// This module provides the core web functionality for hyperscript
///=========================================================================
(function(){

    function mergeObjects(obj1, obj2) {
        for (var key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                obj1[key] = obj2[key];
            }
        }
        return obj1;
    }

    _hyperscript.addCommand("settle", function(parser, runtime, tokens) {
        if (tokens.matchToken("settle")) {

            if (!parser.commandBoundary(tokens.currentToken())) {
                var on = parser.requireElement("expression", tokens);
            } else {
                var on = parser.requireElement("implicitMeTarget");
            }

            var settleCommand = {
                type: "settleCmd",
                args: [on],
                op: function (context, on) {
                    var resolve = null;
                    var resolved = false;
                    var transitionStarted = false;

                    var promise = new Promise(function (r) {
                        resolve = r;
                    });

                    // listen for a transition begin
                    on.addEventListener('transitionstart', function () {
                        transitionStarted = true;
                    }, {once: true});

                    // if no transition begins in 500ms, cancel
                    setTimeout(function () {
                        if (!transitionStarted && !resolved) {
                            resolve(runtime.findNext(settleCommand, context));
                        }
                    }, 500);

                    // continue on a transition emd
                    on.addEventListener('transitionend', function () {
                        if (!resolved) {
                            resolve(runtime.findNext(settleCommand, context));
                        }
                    }, {once: true});
                    return promise;

                },
                execute: function (context) {
                    return runtime.unifiedExec(this, context);
                }
            };
            return settleCommand
        }
    })

    _hyperscript.addCommand("add", function(parser, runtime, tokens) {
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
                var to = parser.requireElement("target", tokens);
            } else {
                var to = parser.parseElement("implicitMeTarget");
            }

            if (classRef) {
                var addCmd = {
                    classRef: classRef,
                    attributeRef: attributeRef,
                    to: to,
                    args: [to],
                    op: function (context, to) {
                        runtime.forEach(to, function (target) {
                            target.classList.add(classRef.className());
                        })
                        return runtime.findNext(this, context);
                    }
                }
            } else {
                var addCmd = {
                    type: "addCmd",
                    classRef: classRef,
                    attributeRef: attributeRef,
                    to: to,
                    args: [to, attributeRef],
                    op: function (context, to, attrRef) {
                        runtime.forEach(to, function (target) {
                            target.setAttribute(attrRef.name, attrRef.value);
                        })
                        return runtime.findNext(addCmd, context);
                    },
                    execute: function (ctx) {
                        return runtime.unifiedExec(this, ctx);
                    }
                };
            }
            return addCmd
        }
    });

    _hyperscript.addCommand("remove", function(parser, runtime, tokens) {
        if (tokens.matchToken('remove')) {
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
                var from = parser.requireElement("target", tokens);
            } else {
                var from = parser.requireElement("implicitMeTarget");
            }

            if (elementExpr) {
                var removeCmd = {
                    classRef: classRef,
                    attributeRef: attributeRef,
                    elementExpr: elementExpr,
                    from: from,
                    args: [elementExpr],
                    op: function (context, element) {
                        runtime.forEach(element, function (target) {
                            target.parentElement.removeChild(target);
                        })
                        return runtime.findNext(this, context);
                    }
                };
            } else {
                var removeCmd = {
                    classRef: classRef,
                    attributeRef: attributeRef,
                    elementExpr: elementExpr,
                    from: from,
                    args: [from],
                    op: function (context, from) {
                        if (this.classRef) {
                            runtime.forEach(from, function (target) {
                                target.classList.remove(classRef.className());
                            })
                        } else {
                            runtime.forEach(from, function (target) {
                                target.removeAttribute(attributeRef.name);
                            })
                        }
                        return runtime.findNext(this, context);
                    }
                };

            }
            return removeCmd
        }
    });

    _hyperscript.addCommand("toggle", function(parser, runtime, tokens) {
        if (tokens.matchToken('toggle')) {

            if (tokens.matchToken('between')) {
                var between = true;
                var classRef = parser.parseElement("classRef", tokens);
                tokens.requireToken("and");
                var classRef2 = parser.requireElement("classRef", tokens);
            } else {
                var classRef = parser.parseElement("classRef", tokens);
                var attributeRef = null;
                if (classRef == null) {
                    attributeRef = parser.parseElement("attributeRef", tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression")
                    }
                }
            }

            if (tokens.matchToken("on")) {
                var on = parser.requireElement("target", tokens);
            } else {
                var on = parser.requireElement("implicitMeTarget");
            }

            if (tokens.matchToken("for")) {
                var time = parser.requireElement("timeExpression", tokens);
            } else if (tokens.matchToken("until")) {
                var evt = parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                if (tokens.matchToken("from")) {
                    var from = parser.requireElement("expression", tokens);
                }
            }

            var toggleCmd = {
                classRef: classRef,
                classRef2: classRef2,
                attributeRef: attributeRef,
                on: on,
                time: time,
                evt: evt,
                from: from,
                toggle: function (on, value) {
                    if (this.classRef) {
                        if (between) {
                            runtime.forEach(on, function (target) {
                                if (target.classList.contains(classRef.className())) {
                                    target.classList.remove(classRef.className());
                                    target.classList.add(classRef2.className());
                                } else {
                                    target.classList.add(classRef.className());
                                    target.classList.remove(classRef2.className());
                                }
                            });
                        } else {
                            runtime.forEach(on, function (target) {
                                target.classList.toggle(classRef.className())
                            });
                        }
                    } else {
                        runtime.forEach(on, function (target) {
                            if (target.hasAttribute(attributeRef.name)) {
                                target.removeAttribute(attributeRef.name);
                            } else {
                                target.setAttribute(attributeRef.name, value)
                            }
                        });
                    }
                },
                args: [on, attributeRef ? attributeRef.value : null, time, evt, from],
                op: function (context, on, value, time, evt, from) {
                    if (time) {
                        return new Promise(function (resolve) {
                            toggleCmd.toggle(on, value);
                            setTimeout(function () {
                                toggleCmd.toggle(on, value);
                                resolve(runtime.findNext(toggleCmd, context));
                            }, time);
                        });
                    } else if (evt) {
                        return new Promise(function (resolve) {
                            var target = from || context.me;
                            target.addEventListener(evt, function () {
                                toggleCmd.toggle(on, value);
                                resolve(runtime.findNext(toggleCmd, context));
                            }, {once: true})
                            toggleCmd.toggle(on, value);
                        });
                    } else {
                        this.toggle(on, value);
                        return runtime.findNext(toggleCmd, context);
                    }
                }
            };
            return toggleCmd
        }
    })

    var HIDE_SHOW_STRATEGIES = {
        "display": function (op, element, arg) {
            if(arg){
                element.style.display = arg;
            } else if (op === 'hide') {
                element.style.display = 'none';
            } else {
                element.style.display = 'block';
            }
        },
        "visibility": function (op, element, arg) {
            if(arg){
                element.style.visibility = arg;
            } else if (op === 'hide') {
                element.style.visibility = 'hidden';
            } else {
                element.style.visibility = 'visible';
            }
        },
        "opacity": function (op, element, arg) {
            if(arg){
                element.style.opacity = arg;
            } else if (op === 'hide') {
                element.style.opacity = '0';
            } else {
                element.style.opacity = '1';
            }
        }
    }

    var parseShowHideTarget = function (parser, runtime, tokens) {
        var target;
        var currentTokenValue = tokens.currentToken();
        if (currentTokenValue.value === "with" || parser.commandBoundary(currentTokenValue)) {
            target = parser.parseElement("implicitMeTarget", tokens);
        } else {
            target = parser.parseElement("target", tokens);
        }
        return target;
    }

    var resolveStrategy = function (parser, tokens, name) {
        var configDefault = _hyperscript.config.defaultHideShowStrategy;
        var strategies = HIDE_SHOW_STRATEGIES;
        if (_hyperscript.config.hideShowStrategies) {
            strategies = mergeObjects(strategies, _hyperscript.config.hideShowStrategies); // merge in user provided strategies
        }
        name = name || configDefault || "display";
        var value = strategies[name];
        if (value == null) {
            parser.raiseParseError(tokens, 'Unknown show/hide strategy : ' + name);
        }
        return value;
    }

    _hyperscript.addCommand("hide", function (parser, runtime, tokens) {
        if (tokens.matchToken("hide")) {
            var target = parseShowHideTarget(parser, runtime, tokens);

            var name = null;
            if (tokens.matchToken("with")) {
                name = tokens.requireTokenType("IDENTIFIER").value;
            }
            var hideShowStrategy = resolveStrategy(parser, tokens, name);

            return {
                target: target,
                args: [target],
                op: function (ctx, target) {
                    runtime.forEach(target, function (elt) {
                        hideShowStrategy('hide', elt);
                    });
                    return runtime.findNext(this, ctx);
                }
            }
        }
    });

    _hyperscript.addCommand("show", function (parser, runtime, tokens) {
        if (tokens.matchToken("show")) {
            var target = parseShowHideTarget(parser, runtime, tokens);

            var name = null;
            if (tokens.matchToken("with")) {
                name = tokens.requireTokenType("IDENTIFIER").value;
            }
            var arg = null;
            if (tokens.matchOpToken(":")) {
                var tokenArr = tokens.consumeUntilWhitespace();
                tokens.matchTokenType("WHITESPACE");
                arg = tokenArr.map(function (t) {
                    return t.value
                }).join("");
            }
            var hideShowStrategy = resolveStrategy(parser, tokens, name);

            return {
                target: target,
                args: [target],
                op: function (ctx, target) {
                    runtime.forEach(target, function (elt) {
                        hideShowStrategy('show', elt, arg);
                    });
                    return runtime.findNext(this, ctx);
                }
            }
        }
    });

    _hyperscript.addCommand("trigger", function(parser, runtime, tokens) {
        if (tokens.matchToken('trigger')) {
            var eventName = parser.requireElement("dotOrColonPath", tokens);
            var details = parser.parseElement("namedArgumentList", tokens);

            var triggerCmd = {
                eventName: eventName,
                details: details,
                args: [eventName, details],
                op: function (context, eventNameStr, details) {
                    runtime.triggerEvent(context.me, eventNameStr, details ? details : {});
                    return runtime.findNext(triggerCmd, context);
                }
            };
            return triggerCmd
        }
    })

    _hyperscript.addCommand("take", function(parser, runtime, tokens) {
        if (tokens.matchToken('take')) {
            var classRef = tokens.requireTokenType(tokens, "CLASS_REF");

            if (tokens.matchToken("from")) {
                var from = parser.requireElement("target", tokens);
            } else {
                var from = parser.requireElement("implicitAllTarget")
            }

            if (tokens.matchToken("for")) {
                var forElt = parser.requireElement("target", tokens);
            } else {
                var forElt = parser.requireElement("implicitMeTarget")
            }

            var takeCmd = {
                classRef: classRef,
                from: from,
                forElt: forElt,
                args: [from, forElt],
                op: function (context, from, forElt) {
                    var clazz = this.classRef.value.substr(1)
                    runtime.forEach(from, function (target) {
                        target.classList.remove(clazz);
                    })
                    runtime.forEach(forElt, function (target) {
                        target.classList.add(clazz);
                    });
                    return runtime.findNext(this, context);
                }
            };
            return takeCmd
        }
    })

    function putInto(context, prop, valueToPut){
        if (prop) {
            var value = context[prop];
        } else {
            var value = context;
        }
        if (value instanceof Element || value instanceof HTMLDocument) {
            value.innerHTML = valueToPut;
        } else {
            if (prop) {
                context[prop] = valueToPut;
            } else {
                throw "Don't know how to put a value into " + typeof context;
            }
        }
    }

    _hyperscript.addCommand("put", function(parser, runtime, tokens) {
        if (tokens.matchToken('put')) {
            var value = parser.requireElement("expression", tokens);

            var operationToken = tokens.matchToken("into") ||
                tokens.matchToken("before") ||
                tokens.matchToken("after");

            if (operationToken == null && tokens.matchToken("at")) {
                operationToken = tokens.matchToken("start") ||
                    tokens.matchToken("end");
                tokens.requireToken("of");
            }

            if (operationToken == null) {
                parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
            }
            var target = parser.requireElement("target", tokens);

            var operation = operationToken.value;

            var symbolWrite = false;
            var root = null;
            var prop = null;
            if (target.type === "propertyAccess" && operation === "into") {
                prop = target.prop.value;
                root = target.root;
            } else if(target.type === "symbol" && operation === "into") {
                symbolWrite = true;
                prop = target.name;
            } else {
                root = target;
            }

            var putCmd = {
                target: target,
                operation: operation,
                symbolWrite: symbolWrite,
                value: value,
                args: [root, value],
                op: function (context, root, valueToPut) {
                    if (symbolWrite) {
                        putInto(context, prop, valueToPut);
                        context[target.name] = valueToPut;
                    } else {
                        if (operation === "into") {
                            runtime.forEach(root, function (elt) {
                                putInto(elt, prop, valueToPut);
                            })
                        } else if (operation === "before") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('beforebegin', valueToPut);
                            })
                        } else if (operation === "start") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('afterbegin', valueToPut);
                            })
                        } else if (operation === "end") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('beforeend', valueToPut);
                            })
                        } else if (operation === "after") {
                            runtime.forEach(root, function (elt) {
                                elt.insertAdjacentHTML('afterend', valueToPut);
                            })
                        }
                    }
                    return runtime.findNext(this, context);
                }
            };
            return putCmd
        }
    })

    _hyperscript.addCommand("transition", function(parser, runtime, tokens) {
        if (tokens.matchToken("transition")) {
            if (tokens.matchToken('element') || tokens.matchToken('elements')) {
                var targets = parser.parseElement("expression", tokens);
            } else {
                var targets = parser.parseElement("implicitMeTarget");
            }
            var properties = [];
            var from = [];
            var to = [];
            var currentToken = tokens.currentToken();
            while (!parser.commandBoundary(currentToken) && currentToken.value !== "using") {
                properties.push(tokens.requireTokenType("IDENTIFIER").value);
                if (tokens.matchToken("from")) {
                    from.push(parser.requireElement("stringLike", tokens));
                } else {
                    from.push(null);
                }
                tokens.requireToken("to");
                to.push(parser.requireElement("stringLike", tokens));
                currentToken = tokens.currentToken();
            }
            if (tokens.matchToken("using")) {
                var using = parser.requireElement("expression", tokens);
            }

            var transition = {
                to: to,
                args: [targets, from, to, using],
                op: function (context, targets, from, to, using) {
                    var promises = [];
                    runtime.forEach(targets, function(target){
                        var promise = new Promise(function (resolve, reject) {
                            var initialTransition = target.style.transition;
                            target.style.transition = using || _hyperscript.config.defaultTransition;
                            var internalData = runtime.getInternalData(target);
                            var computedStyles = getComputedStyle(target);

                            var initialStyles = {};
                            for (var i = 0; i < computedStyles.length; i++) {
                                var name = computedStyles[i];
                                var initialValue = computedStyles[name];
                                initialStyles[name] = initialValue;
                            }

                            // store intitial values
                            if (!internalData.initalStyles) {
                                internalData.initalStyles = initialStyles;
                            }

                            for (var i = 0; i < properties.length; i++) {
                                var property = properties[i];
                                var fromVal = from[i];
                                if (fromVal == 'computed' || fromVal == null) {
                                    target.style[property] = initialStyles[property];
                                } else {
                                    target.style[property] = fromVal;
                                }
                            }
                            // console.log("transition started", transition);
                            setTimeout(function () {
                                var autoProps = [];
                                for (var i = 0; i < properties.length; i++) {
                                    var property = properties[i];
                                    var toVal = to[i];
                                    if (toVal == 'initial') {
                                        var propertyValue = internalData.initalStyles[property];
                                        target.style[property] = propertyValue;
                                    } else {
                                        target.style[property] = toVal;
                                    }
                                    // console.log("set", property, "to", target.style[property], "on", target, "value passed in : ", toVal);
                                }
                                target.addEventListener('transitionend', function () {
                                    // console.log("transition ended", transition);
                                    target.style.transition = initialTransition;
                                    resolve();
                                }, {once:true})
                            }, 5);
                        });
                        promises.push(promise);
                    })
                    return Promise.all(promises).then(function(){
                        return runtime.findNext(transition, context);
                    })
                }
            };
            return transition
        }
    });

})()