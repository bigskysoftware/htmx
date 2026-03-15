/**
 * @typedef {Object} Hyperscript
 */

(function (self, factory) {
    const _hyperscript = factory(self)

    if (typeof exports === 'object' && typeof exports['nodeName'] !== 'string') {
        module.exports = _hyperscript
    } else {
        self['_hyperscript'] = _hyperscript
        if ('document' in self) self['_hyperscript'].browserInit()
    }
})(typeof self !== 'undefined' ? self : this, (globalScope) => {

    'use strict';

    /**
     * @type {Object}
     * @property {DynamicConverter[]} dynamicResolvers
     *
     * @callback DynamicConverter
     * @param {String} str
     * @param {*} value
     * @returns {*}
     */
    const conversions = {
        dynamicResolvers: [
            function(str, value){
                if (str === "Fixed") {
                    return Number(value).toFixed();
                } else if (str.indexOf("Fixed:") === 0) {
                    let num = str.split(":")[1];
                    return Number(value).toFixed(parseInt(num));
                }
            }
        ],
        String: function (val) {
            if (val.toString) {
                return val.toString();
            } else {
                return "" + val;
            }
        },
        Int: function (val) {
            return parseInt(val);
        },
        Float: function (val) {
            return parseFloat(val);
        },
        Number: function (val) {
            return Number(val);
        },
        Date: function (val) {
            return new Date(val);
        },
        Array: function (val) {
            return Array.from(val);
        },
        JSON: function (val) {
            return JSON.stringify(val);
        },
        Object: function (val) {
            if (val instanceof String) {
                val = val.toString();
            }
            if (typeof val === "string") {
                return JSON.parse(val);
            } else {
                return Object.assign({}, val);
            }
        },
    }

    const config = {
        attributes: "_, script, data-script",
        defaultTransition: "all 500ms ease-in",
        disableSelector: "[disable-scripting], [data-disable-scripting]",
        hideShowStrategies: {},
        conversions,
    }

    class Lexer {
        static OP_TABLE = {
            "+": "PLUS",
            "-": "MINUS",
            "*": "MULTIPLY",
            "/": "DIVIDE",
            ".": "PERIOD",
            "..": "ELLIPSIS",
            "\\": "BACKSLASH",
            ":": "COLON",
            "%": "PERCENT",
            "|": "PIPE",
            "!": "EXCLAMATION",
            "?": "QUESTION",
            "#": "POUND",
            "&": "AMPERSAND",
            "$": "DOLLAR",
            ";": "SEMI",
            ",": "COMMA",
            "(": "L_PAREN",
            ")": "R_PAREN",
            "<": "L_ANG",
            ">": "R_ANG",
            "<=": "LTE_ANG",
            ">=": "GTE_ANG",
            "==": "EQ",
            "===": "EQQ",
            "!=": "NEQ",
            "!==": "NEQQ",
            "{": "L_BRACE",
            "}": "R_BRACE",
            "[": "L_BRACKET",
            "]": "R_BRACKET",
            "=": "EQUALS",
            "~": "TILDE",
        };

        /**
         * isValidCSSClassChar returns `true` if the provided character is valid in a CSS class.
         * @param {string} c
         * @returns boolean
         */
        static isValidCSSClassChar(c) {
            return Lexer.isAlpha(c) || Lexer.isNumeric(c) || c === "-" || c === "_" || c === ":";
        }

        /**
         * isValidCSSIDChar returns `true` if the provided character is valid in a CSS ID
         * @param {string} c
         * @returns boolean
         */
        static isValidCSSIDChar(c) {
            return Lexer.isAlpha(c) || Lexer.isNumeric(c) || c === "-" || c === "_" || c === ":";
        }

        /**
         * isWhitespace returns `true` if the provided character is whitespace.
         * @param {string} c
         * @returns boolean
         */
        static isWhitespace(c) {
            return c === " " || c === "\t" || Lexer.isNewline(c);
        }

        /**
         * positionString returns a string representation of a Token's line and column details.
         * @param {Token} token
         * @returns string
         */
        static positionString(token) {
            return "[Line: " + token.line + ", Column: " + token.column + "]";
        }

        /**
         * isNewline returns `true` if the provided character is a carriage return or newline
         * @param {string} c
         * @returns boolean
         */
        static isNewline(c) {
            return c === "\r" || c === "\n";
        }

        /**
         * isNumeric returns `true` if the provided character is a number (0-9)
         * @param {string} c
         * @returns boolean
         */
        static isNumeric(c) {
            return c >= "0" && c <= "9";
        }

        /**
         * isAlpha returns `true` if the provided character is a letter in the alphabet
         * @param {string} c
         * @returns boolean
         */
        static isAlpha(c) {
            return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
        }

        /**
         * @param {string} c
         * @param {boolean} [dollarIsOp]
         * @returns boolean
         */
        static isIdentifierChar(c, dollarIsOp) {
            return c === "_" || c === "$";
        }

        /**
         * @param {string} c
         * @returns boolean
         */
        static isReservedChar(c) {
            return c === "`" || c === "^";
        }

        /**
         * @param {Token[]} tokens
         * @returns {boolean}
         */
        static isValidSingleQuoteStringStart(tokens) {
            if (tokens.length > 0) {
                var previousToken = tokens[tokens.length - 1];
                if (
                    previousToken.type === "IDENTIFIER" ||
                    previousToken.type === "CLASS_REF" ||
                    previousToken.type === "ID_REF"
                ) {
                    return false;
                }
                if (previousToken.op && (previousToken.value === ">" || previousToken.value === ")")) {
                    return false;
                }
            }
            return true;
        }

        /**
         * @param {string} string
         * @param {boolean} [template]
         * @returns {Tokens}
         */
        static tokenize(string, template) {
            var tokens = /** @type {Token[]}*/ [];
            var source = string;
            var position = 0;
            var column = 0;
            var line = 1;
            var lastToken = "<START>";
            var templateBraceCount = 0;

            function inTemplate() {
                return template && templateBraceCount === 0;
            }

            while (position < source.length) {
                if ((currentChar() === "-" && nextChar() === "-" && (Lexer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "-"))
                    || (currentChar() === "/" && nextChar() === "/" && (Lexer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "/"))) {
                    consumeComment();
                } else if (currentChar() === "/" && nextChar() === "*" && (Lexer.isWhitespace(nextCharAt(2)) || nextCharAt(2) === "" || nextCharAt(2) === "*")) {
                    consumeCommentMultiline();
                } else {
                    if (Lexer.isWhitespace(currentChar())) {
                        tokens.push(consumeWhitespace());
                    } else if (
                        !possiblePrecedingSymbol() &&
                        currentChar() === "." &&
                        (Lexer.isAlpha(nextChar()) || nextChar() === "{" || nextChar() === "-")
                    ) {
                        tokens.push(consumeClassReference());
                    } else if (
                        !possiblePrecedingSymbol() &&
                        currentChar() === "#" &&
                        (Lexer.isAlpha(nextChar()) || nextChar() === "{")
                    ) {
                        tokens.push(consumeIdReference());
                    } else if (currentChar() === "[" && nextChar() === "@") {
                        tokens.push(consumeAttributeReference());
                    } else if (currentChar() === "@") {
                        tokens.push(consumeShortAttributeReference());
                    } else if (currentChar() === "*" && Lexer.isAlpha(nextChar())) {
                        tokens.push(consumeStyleReference());
                    } else if (inTemplate() && (Lexer.isAlpha(currentChar()) || currentChar() === "\\")) {
                        tokens.push(consumeTemplateIdentifier());
                    } else if (!inTemplate() && (Lexer.isAlpha(currentChar()) || Lexer.isIdentifierChar(currentChar()))) {
                        tokens.push(consumeIdentifier());
                    } else if (Lexer.isNumeric(currentChar())) {
                        tokens.push(consumeNumber());
                    } else if (!inTemplate() && (currentChar() === '"' || currentChar() === "`")) {
                        tokens.push(consumeString());
                    } else if (!inTemplate() && currentChar() === "'") {
                        if (Lexer.isValidSingleQuoteStringStart(tokens)) {
                            tokens.push(consumeString());
                        } else {
                            tokens.push(consumeOp());
                        }
                    } else if (Lexer.OP_TABLE[currentChar()]) {
                        if (lastToken === "$" && currentChar() === "{") {
                            templateBraceCount++;
                        }
                        if (currentChar() === "}") {
                            templateBraceCount--;
                        }
                        tokens.push(consumeOp());
                    } else if (inTemplate() || Lexer.isReservedChar(currentChar())) {
                        tokens.push(makeToken("RESERVED", consumeChar()));
                    } else {
                        if (position < source.length) {
                            throw Error("Unknown token: " + currentChar() + " ");
                        }
                    }
                }
            }

            return new Tokens(tokens, [], source);

            /**
             * @param {string} [type]
             * @param {string} [value]
             * @returns {Token}
             */
            function makeOpToken(type, value) {
                var token = makeToken(type, value);
                token.op = true;
                return token;
            }

            /**
             * @param {string} [type]
             * @param {string} [value]
             * @returns {Token}
             */
            function makeToken(type, value) {
                return {
                    type: type,
                    value: value || "",
                    start: position,
                    end: position + 1,
                    column: column,
                    line: line,
                };
            }

            function consumeComment() {
                while (currentChar() && !Lexer.isNewline(currentChar())) {
                    consumeChar();
                }
                consumeChar(); // Consume newline
            }

            function consumeCommentMultiline() {
                while (currentChar() && !(currentChar() === '*' && nextChar() === '/')) {
                    consumeChar();
                }
                consumeChar(); // Consume "*/"
                consumeChar();
            }

            /**
             * @returns Token
             */
            function consumeClassReference() {
                var classRef = makeToken("CLASS_REF");
                var value = consumeChar();
                if (currentChar() === "{") {
                    classRef.template = true;
                    value += consumeChar();
                    while (currentChar() && currentChar() !== "}") {
                        value += consumeChar();
                    }
                    if (currentChar() !== "}") {
                        throw Error("Unterminated class reference");
                    } else {
                        value += consumeChar(); // consume final curly
                    }
                } else {
                    while (Lexer.isValidCSSClassChar(currentChar()) || currentChar() === "\\") {
                        if (currentChar() === "\\") {
                            consumeChar();
                        }
                        value += consumeChar();
                    }
                }
                classRef.value = value;
                classRef.end = position;
                return classRef;
            }

            /**
             * @returns Token
             */
            function consumeAttributeReference() {
                var attributeRef = makeToken("ATTRIBUTE_REF");
                var value = consumeChar();
                while (position < source.length && currentChar() !== "]") {
                    value += consumeChar();
                }
                if (currentChar() === "]") {
                    value += consumeChar();
                }
                attributeRef.value = value;
                attributeRef.end = position;
                return attributeRef;
            }

            function consumeShortAttributeReference() {
                var attributeRef = makeToken("ATTRIBUTE_REF");
                var value = consumeChar();
                while (Lexer.isValidCSSIDChar(currentChar())) {
                    value += consumeChar();
                }
                if (currentChar() === '=') {
                    value += consumeChar();
                    if (currentChar() === '"' || currentChar() === "'") {
                        let stringValue = consumeString();
                        value += stringValue.value;
                    } else if(Lexer.isAlpha(currentChar()) ||
                        Lexer.isNumeric(currentChar()) ||
                        Lexer.isIdentifierChar(currentChar())) {
                        let id = consumeIdentifier();
                        value += id.value;
                    }
                }
                attributeRef.value = value;
                attributeRef.end = position;
                return attributeRef;
            }

            function consumeStyleReference() {
                var styleRef = makeToken("STYLE_REF");
                var value = consumeChar();
                while (Lexer.isAlpha(currentChar()) || currentChar() === "-") {
                    value += consumeChar();
                }
                styleRef.value = value;
                styleRef.end = position;
                return styleRef;
            }

            /**
             * @returns Token
             */
            function consumeIdReference() {
                var idRef = makeToken("ID_REF");
                var value = consumeChar();
                if (currentChar() === "{") {
                    idRef.template = true;
                    value += consumeChar();
                    while (currentChar() && currentChar() !== "}") {
                        value += consumeChar();
                    }
                    if (currentChar() !== "}") {
                        throw Error("Unterminated id reference");
                    } else {
                        consumeChar(); // consume final quote
                    }
                } else {
                    while (Lexer.isValidCSSIDChar(currentChar())) {
                        value += consumeChar();
                    }
                }
                idRef.value = value;
                idRef.end = position;
                return idRef;
            }

            /**
             * @returns Token
             */
            function consumeTemplateIdentifier() {
                var identifier = makeToken("IDENTIFIER");
                var value = consumeChar();
                var escd = value === "\\";
                if (escd) {
                    value = "";
                }
                while (Lexer.isAlpha(currentChar()) ||
                Lexer.isNumeric(currentChar()) ||
                Lexer.isIdentifierChar(currentChar()) ||
                currentChar() === "\\" ||
                currentChar() === "{" ||
                currentChar() === "}" ) {
                    if (currentChar() === "$" && escd === false) {
                        break;
                    } else if (currentChar() === "\\") {
                        escd = true;
                        consumeChar();
                    } else {
                        escd = false;
                        value += consumeChar();
                    }
                }
                if (currentChar() === "!" && value === "beep") {
                    value += consumeChar();
                }
                identifier.value = value;
                identifier.end = position;
                return identifier;
            }

            /**
             * @returns Token
             */
            function consumeIdentifier() {
                var identifier = makeToken("IDENTIFIER");
                var value = consumeChar();
                while (Lexer.isAlpha(currentChar()) ||
                Lexer.isNumeric(currentChar()) ||
                Lexer.isIdentifierChar(currentChar())) {
                    value += consumeChar();
                }
                if (currentChar() === "!" && value === "beep") {
                    value += consumeChar();
                }
                identifier.value = value;
                identifier.end = position;
                return identifier;
            }

            /**
             * @returns Token
             */
            function consumeNumber() {
                var number = makeToken("NUMBER");
                var value = consumeChar();

                // given possible XXX.YYY(e|E)[-]ZZZ consume XXX
                while (Lexer.isNumeric(currentChar())) {
                    value += consumeChar();
                }

                // consume .YYY
                if (currentChar() === "." && Lexer.isNumeric(nextChar())) {
                    value += consumeChar();
                }
                while (Lexer.isNumeric(currentChar())) {
                    value += consumeChar();
                }

                // consume (e|E)[-]
                if (currentChar() === "e" || currentChar() === "E") {
                    // possible scientific notation, e.g. 1e6 or 1e-6
                    if (Lexer.isNumeric(nextChar())) {
                        // e.g. 1e6
                        value += consumeChar();
                    } else if (nextChar() === "-") {
                        // e.g. 1e-6
                        value += consumeChar();
                        // consume the - as well since otherwise we would stop on the next loop
                        value += consumeChar();
                    }
                }

                // consume ZZZ
                while (Lexer.isNumeric(currentChar())) {
                    value += consumeChar();
                }
                number.value = value;
                number.end = position;
                return number;
            }

            /**
             * @returns Token
             */
            function consumeOp() {
                var op = makeOpToken();
                var value = consumeChar(); // consume leading char
                while (currentChar() && Lexer.OP_TABLE[value + currentChar()]) {
                    value += consumeChar();
                }
                op.type = Lexer.OP_TABLE[value];
                op.value = value;
                op.end = position;
                return op;
            }

            /**
             * @returns Token
             */
            function consumeString() {
                var string = makeToken("STRING");
                var startChar = consumeChar(); // consume leading quote
                string.template = startChar === "`";
                var value = "";
                while (currentChar() && currentChar() !== startChar) {
                    if (currentChar() === "\\") {
                        consumeChar(); // consume escape char and get the next one
                        let nextChar = consumeChar();
                        if (nextChar === "b") {
                            value += "\b";
                        } else if (nextChar === "f") {
                            value += "\f";
                        } else if (nextChar === "n") {
                            value += "\n";
                        } else if (nextChar === "r") {
                            value += "\r";
                        } else if (nextChar === "t") {
                            value += "\t";
                        } else if (nextChar === "v") {
                            value += "\v";
                        } else if (string.template && nextChar === "$") {
                            value += "\\$";
                        } else if (nextChar === "x") {
                            const hex = consumeHexEscape();
                            if (Number.isNaN(hex)) {
                                throw Error("Invalid hexadecimal escape at " + Lexer.positionString(string));
                            }
                            value += String.fromCharCode(hex);
                        } else {
                            value += nextChar;
                        }
                    } else {
                        value += consumeChar();
                    }
                }
                if (currentChar() !== startChar) {
                    throw Error("Unterminated string at " + Lexer.positionString(string));
                } else {
                    consumeChar(); // consume final quote
                }
                string.value = value;
                string.end = position;
                return string;
            }

            /**
             * @returns number
             */
            function consumeHexEscape() {
                const BASE = 16;
                if (!currentChar()) {
                    return NaN;
                }
                let result = BASE * Number.parseInt(consumeChar(), BASE);
                if (!currentChar()) {
                    return NaN;
                }
                result += Number.parseInt(consumeChar(), BASE);

                return result;
            }

            /**
             * @returns string
             */
            function currentChar() {
                return source.charAt(position);
            }

            /**
             * @returns string
             */
            function nextChar() {
                return source.charAt(position + 1);
            }

            function nextCharAt(number = 1) {
                return source.charAt(position + number);
            }

            /**
             * @returns string
             */
            function consumeChar() {
                lastToken = currentChar();
                position++;
                column++;
                return lastToken;
            }

            /**
             * @returns boolean
             */
            function possiblePrecedingSymbol() {
                return (
                    Lexer.isAlpha(lastToken) ||
                    Lexer.isNumeric(lastToken) ||
                    lastToken === ")" ||
                    lastToken === "\"" ||
                    lastToken === "'" ||
                    lastToken === "`" ||
                    lastToken === "}" ||
                    lastToken === "]"
                );
            }

            /**
             * @returns Token
             */
            function consumeWhitespace() {
                var whitespace = makeToken("WHITESPACE");
                var value = "";
                while (currentChar() && Lexer.isWhitespace(currentChar())) {
                    if (Lexer.isNewline(currentChar())) {
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

        /**
         * @param {string} string
         * @param {boolean} [template]
         * @returns {Tokens}
         */
        tokenize(string, template) {
            return Lexer.tokenize(string, template)
        }
    }

    /**
     * @typedef {Object} Token
     * @property {string} [type]
     * @property {string} value
     * @property {number} [start]
     * @property {number} [end]
     * @property {number} [column]
     * @property {number} [line]
     * @property {boolean} [op] `true` if this token represents an operator
     * @property {boolean} [template] `true` if this token is a template, for class refs, id refs, strings
     */

    class Tokens {
        constructor(tokens, consumed, source) {
            this.tokens = tokens
            this.consumed = consumed
            this.source = source

            this.consumeWhitespace(); // consume initial whitespace
        }

        get list() {
            return this.tokens
        }

        /** @type Token | null */
        _lastConsumed = null;

        consumeWhitespace() {
            while (this.token(0, true).type === "WHITESPACE") {
                this.consumed.push(this.tokens.shift());
            }
        }

        /**
         * @param {Tokens} tokens
         * @param {*} error
         * @returns {never}
         */
        raiseError(tokens, error) {
            Parser.raiseParseError(tokens, error);
        }

        /**
         * @param {string} value
         * @returns {Token}
         */
        requireOpToken(value) {
            var token = this.matchOpToken(value);
            if (token) {
                return token;
            } else {
                this.raiseError(this, "Expected '" + value + "' but found '" + this.currentToken().value + "'");
            }
        }

        /**
         * @param {string} op1
         * @param {string} [op2]
         * @param {string} [op3]
         * @returns {Token | void}
         */
        matchAnyOpToken(op1, op2, op3) {
            for (var i = 0; i < arguments.length; i++) {
                var opToken = arguments[i];
                var match = this.matchOpToken(opToken);
                if (match) {
                    return match;
                }
            }
        }

        /**
         * @param {string} op1
         * @param {string} [op2]
         * @param {string} [op3]
         * @returns {Token | void}
         */
        matchAnyToken(op1, op2, op3) {
            for (var i = 0; i < arguments.length; i++) {
                var opToken = arguments[i];
                var match = this.matchToken(opToken);
                if (match) {
                    return match;
                }
            }
        }

        /**
         * @param {string} value
         * @returns {Token | void}
         */
        matchOpToken(value) {
            if (this.currentToken() && this.currentToken().op && this.currentToken().value === value) {
                return this.consumeToken();
            }
        }

        /**
         * @param {string} type1
         * @param {string} [type2]
         * @param {string} [type3]
         * @param {string} [type4]
         * @returns {Token}
         */
        requireTokenType(type1, type2, type3, type4) {
            var token = this.matchTokenType(type1, type2, type3, type4);
            if (token) {
                return token;
            } else {
                this.raiseError(this, "Expected one of " + JSON.stringify([type1, type2, type3]));
            }
        }

        /**
         * @param {string} type1
         * @param {string} [type2]
         * @param {string} [type3]
         * @param {string} [type4]
         * @returns {Token | void}
         */
        matchTokenType(type1, type2, type3, type4) {
            if (
                this.currentToken() &&
                this.currentToken().type &&
                [type1, type2, type3, type4].indexOf(this.currentToken().type) >= 0
            ) {
                return this.consumeToken();
            }
        }

        /**
         * @param {string} value
         * @param {string} [type]
         * @returns {Token}
         */
        requireToken(value, type) {
            var token = this.matchToken(value, type);
            if (token) {
                return token;
            } else {
                this.raiseError(this, "Expected '" + value + "' but found '" + this.currentToken().value + "'");
            }
        }

        peekToken(value, peek, type) {
            peek = peek || 0;
            type = type || "IDENTIFIER";
            if(this.tokens[peek] && this.tokens[peek].value === value && this.tokens[peek].type === type){
                return this.tokens[peek];
            }
        }

        /**
         * @param {string} value
         * @param {string} [type]
         * @returns {Token | void}
         */
        matchToken(value, type) {
            if (this.follows.indexOf(value) !== -1) {
                return; // disallowed token here
            }
            type = type || "IDENTIFIER";
            if (this.currentToken() && this.currentToken().value === value && this.currentToken().type === type) {
                return this.consumeToken();
            }
        }

        /**
         * @returns {Token}
         */
        consumeToken() {
            var match = this.tokens.shift();
            this.consumed.push(match);
            this._lastConsumed = match;
            this.consumeWhitespace(); // consume any whitespace
            return match;
        }

        /**
         * @param {string | null} value
         * @param {string | null} [type]
         * @returns {Token[]}
         */
        consumeUntil(value, type) {
            /** @type Token[] */
            var tokenList = [];
            var currentToken = this.token(0, true);

            while (
                (type == null || currentToken.type !== type) &&
                (value == null || currentToken.value !== value) &&
                currentToken.type !== "EOF"
                ) {
                var match = this.tokens.shift();
                this.consumed.push(match);
                tokenList.push(currentToken);
                currentToken = this.token(0, true);
            }
            this.consumeWhitespace(); // consume any whitespace
            return tokenList;
        }

        /**
         * @returns {string}
         */
        lastWhitespace() {
            if (this.consumed[this.consumed.length - 1] && this.consumed[this.consumed.length - 1].type === "WHITESPACE") {
                return this.consumed[this.consumed.length - 1].value;
            } else {
                return "";
            }
        }

        consumeUntilWhitespace() {
            return this.consumeUntil(null, "WHITESPACE");
        }

        /**
         * @returns {boolean}
         */
        hasMore() {
            return this.tokens.length > 0;
        }

        /**
         * @param {number} n
         * @param {boolean} [dontIgnoreWhitespace]
         * @returns {Token}
         */
        token(n, dontIgnoreWhitespace) {
            var /**@type {Token}*/ token;
            var i = 0;
            do {
                if (!dontIgnoreWhitespace) {
                    while (this.tokens[i] && this.tokens[i].type === "WHITESPACE") {
                        i++;
                    }
                }
                token = this.tokens[i];
                n--;
                i++;
            } while (n > -1);
            if (token) {
                return token;
            } else {
                return {
                    type: "EOF",
                    value: "<<<EOF>>>",
                };
            }
        }

        /**
         * @returns {Token}
         */
        currentToken() {
            return this.token(0);
        }

        /**
         * @returns {Token | null}
         */
        lastMatch() {
            return this._lastConsumed;
        }

        /**
         * @returns {string}
         */
        static sourceFor = function () {
            return this.programSource.substring(this.startToken.start, this.endToken.end);
        }

        /**
         * @returns {string}
         */
        static lineFor = function () {
            return this.programSource.split("\n")[this.startToken.line - 1];
        }

        follows = [];

        pushFollow(str) {
            this.follows.push(str);
        }

        popFollow() {
            this.follows.pop();
        }

        clearFollows() {
            var tmp = this.follows;
            this.follows = [];
            return tmp;
        }

        restoreFollows(f) {
            this.follows = f;
        }
    }

    /**
     * @callback ParseRule
     * @param {Parser} parser
     * @param {Runtime} runtime
     * @param {Tokens} tokens
     * @param {*} [root]
     * @returns {ASTNode | undefined}
     *
     * @typedef {Object} ASTNode
     * @member {boolean} isFeature
     * @member {string} type
     * @member {any[]} args
     * @member {(this: ASTNode, ctx:Context, root:any, ...args:any) => any} op
     * @member {(this: ASTNode, context?:Context) => any} evaluate
     * @member {ASTNode} parent
     * @member {Set<ASTNode>} children
     * @member {ASTNode} root
     * @member {String} keyword
     * @member {Token} endToken
     * @member {ASTNode} next
     * @member {(context:Context) => ASTNode} resolveNext
     * @member {EventSource} eventSource
     * @member {(this: ASTNode) => void} install
     * @member {(this: ASTNode, context:Context) => void} execute
     * @member {(this: ASTNode, target: object, source: object, args?: Object) => void} apply
     *
     *
     */

    class Parser {
        /**
         *
         * @param {Runtime} runtime
         */
        constructor(runtime) {
            this.runtime = runtime

            this.possessivesDisabled = false

            /* ============================================================================================ */
            /* Core hyperscript Grammar Elements                                                            */
            /* ============================================================================================ */
            this.addGrammarElement("feature", function (parser, runtime, tokens) {
                if (tokens.matchOpToken("(")) {
                    var featureElement = parser.requireElement("feature", tokens);
                    tokens.requireOpToken(")");
                    return featureElement;
                }

                var featureDefinition = parser.FEATURES[tokens.currentToken().value || ""];
                if (featureDefinition) {
                    return featureDefinition(parser, runtime, tokens);
                }
            });

            this.addGrammarElement("command", function (parser, runtime, tokens) {
                if (tokens.matchOpToken("(")) {
                    const commandElement = parser.requireElement("command", tokens);
                    tokens.requireOpToken(")");
                    return commandElement;
                }

                var commandDefinition = parser.COMMANDS[tokens.currentToken().value || ""];
                let commandElement;
                if (commandDefinition) {
                    commandElement = commandDefinition(parser, runtime, tokens);
                } else if (tokens.currentToken().type === "IDENTIFIER") {
                    commandElement = parser.parseElement("pseudoCommand", tokens);
                }
                if (commandElement) {
                    return parser.parseElement("indirectStatement", tokens, commandElement);
                }

                return commandElement;
            });

            this.addGrammarElement("commandList", function (parser, runtime, tokens) {
                if (tokens.hasMore()) {
                    var cmd = parser.parseElement("command", tokens);
                    if (cmd) {
                        tokens.matchToken("then");
                        const next = parser.parseElement("commandList", tokens);
                        if (next) cmd.next = next;
                        return cmd;
                    }
                }
                return {
                    type: "emptyCommandListCommand",
                    op: function(context){
                        return runtime.findNext(this, context);
                    },
                    execute: function (context) {
                        return runtime.unifiedExec(this, context);
                    }
                }
            });

            this.addGrammarElement("leaf", function (parser, runtime, tokens) {
                var result = parser.parseAnyOf(parser.LEAF_EXPRESSIONS, tokens);
                // symbol is last so it doesn't consume any constants
                if (result == null) {
                    return parser.parseElement("symbol", tokens);
                }

                return result;
            });

            this.addGrammarElement("indirectExpression", function (parser, runtime, tokens, root) {
                for (var i = 0; i < parser.INDIRECT_EXPRESSIONS.length; i++) {
                    var indirect = parser.INDIRECT_EXPRESSIONS[i];
                    root.endToken = tokens.lastMatch();
                    var result = parser.parseElement(indirect, tokens, root);
                    if (result) {
                        return result;
                    }
                }
                return root;
            });

            this.addGrammarElement("indirectStatement", function (parser, runtime, tokens, root) {
                if (tokens.matchToken("unless")) {
                    root.endToken = tokens.lastMatch();
                    var conditional = parser.requireElement("expression", tokens);
                    var unless = {
                        type: "unlessStatementModifier",
                        args: [conditional],
                        op: function (context, conditional) {
                            if (conditional) {
                                return this.next;
                            } else {
                                return root;
                            }
                        },
                        execute: function (context) {
                            return runtime.unifiedExec(this, context);
                        },
                    };
                    root.parent = unless;
                    return unless;
                }
                return root;
            });

            this.addGrammarElement("primaryExpression", function (parser, runtime, tokens) {
                var leaf = parser.parseElement("leaf", tokens);
                if (leaf) {
                    return parser.parseElement("indirectExpression", tokens, leaf);
                }
                parser.raiseParseError(tokens, "Unexpected value: " + tokens.currentToken().value);
            });
        }

        use(plugin) {
            plugin(this)
            return this
        }

        /** @type {Object<string,ParseRule>} */
        GRAMMAR = {};

        /** @type {Object<string,ParseRule>} */
        COMMANDS = {};

        /** @type {Object<string,ParseRule>} */
        FEATURES = {};

        /** @type {string[]} */
        LEAF_EXPRESSIONS = [];
        /** @type {string[]} */
        INDIRECT_EXPRESSIONS = [];

        /**
         * @param {*} parseElement
         * @param {*} start
         * @param {Tokens} tokens
         */
        initElt(parseElement, start, tokens) {
            parseElement.startToken = start;
            parseElement.sourceFor = Tokens.sourceFor;
            parseElement.lineFor = Tokens.lineFor;
            parseElement.programSource = tokens.source;
        }

        /**
         * @param {string} type
         * @param {Tokens} tokens
         * @param {ASTNode?} root
         * @returns {ASTNode}
         */
        parseElement(type, tokens, root = undefined) {
            var elementDefinition = this.GRAMMAR[type];
            if (elementDefinition) {
                var start = tokens.currentToken();
                var parseElement = elementDefinition(this, this.runtime, tokens, root);
                if (parseElement) {
                    this.initElt(parseElement, start, tokens);
                    parseElement.endToken = parseElement.endToken || tokens.lastMatch();
                    var root = parseElement.root;
                    while (root != null) {
                        this.initElt(root, start, tokens);
                        root = root.root;
                    }
                }
                return parseElement;
            }
        }

        /**
         * @param {string} type
         * @param {Tokens} tokens
         * @param {string} [message]
         * @param {*} [root]
         * @returns {ASTNode}
         */
        requireElement(type, tokens, message, root) {
            var result = this.parseElement(type, tokens, root);
            if (!result) Parser.raiseParseError(tokens, message || "Expected " + type);
            // @ts-ignore
            return result;
        }

        /**
         * @param {string[]} types
         * @param {Tokens} tokens
         * @returns {ASTNode}
         */
        parseAnyOf(types, tokens) {
            for (var i = 0; i < types.length; i++) {
                var type = types[i];
                var expression = this.parseElement(type, tokens);
                if (expression) {
                    return expression;
                }
            }
        }

        /**
         * @param {string} name
         * @param {ParseRule} definition
         */
        addGrammarElement(name, definition) {
            this.GRAMMAR[name] = definition;
        }

        /**
         * @param {string} keyword
         * @param {ParseRule} definition
         */
        addCommand(keyword, definition) {
            var commandGrammarType = keyword + "Command";
            var commandDefinitionWrapper = function (parser, runtime, tokens) {
                const commandElement = definition(parser, runtime, tokens);
                if (commandElement) {
                    commandElement.type = commandGrammarType;
                    commandElement.execute = function (context) {
                        context.meta.command = commandElement;
                        return runtime.unifiedExec(this, context);
                    };
                    return commandElement;
                }
            };
            this.GRAMMAR[commandGrammarType] = commandDefinitionWrapper;
            this.COMMANDS[keyword] = commandDefinitionWrapper;
        }

        /**
         * @param {string} keyword
         * @param {ParseRule} definition
         */
        addFeature(keyword, definition) {
            var featureGrammarType = keyword + "Feature";

            /** @type {ParseRule} */
            var featureDefinitionWrapper = function (parser, runtime, tokens) {
                var featureElement = definition(parser, runtime, tokens);
                if (featureElement) {
                    featureElement.isFeature = true;
                    featureElement.keyword = keyword;
                    featureElement.type = featureGrammarType;
                    return featureElement;
                }
            };
            this.GRAMMAR[featureGrammarType] = featureDefinitionWrapper;
            this.FEATURES[keyword] = featureDefinitionWrapper;
        }

        /**
         * @param {string} name
         * @param {ParseRule} definition
         */
        addLeafExpression(name, definition) {
            this.LEAF_EXPRESSIONS.push(name);
            this.addGrammarElement(name, definition);
        }

        /**
         * @param {string} name
         * @param {ParseRule} definition
         */
        addIndirectExpression(name, definition) {
            this.INDIRECT_EXPRESSIONS.push(name);
            this.addGrammarElement(name, definition);
        }

        /**
         *
         * @param {Tokens} tokens
         * @returns string
         */
        static createParserContext(tokens) {
            var currentToken = tokens.currentToken();
            var source = tokens.source;
            var lines = source.split("\n");
            var line = currentToken && currentToken.line ? currentToken.line - 1 : lines.length - 1;
            var contextLine = lines[line];
            var offset = /** @type {number} */ (
                currentToken && currentToken.line ? currentToken.column : contextLine.length - 1);
            return contextLine + "\n" + " ".repeat(offset) + "^^\n\n";
        }

        /**
         * @param {Tokens} tokens
         * @param {string} [message]
         * @returns {never}
         */
        static raiseParseError(tokens, message) {
            message =
                (message || "Unexpected Token : " + tokens.currentToken().value) + "\n\n" + Parser.createParserContext(tokens);
            var error = new Error(message);
            error["tokens"] = tokens;
            throw error;
        }

        /**
         * @param {Tokens} tokens
         * @param {string} [message]
         */
        raiseParseError(tokens, message) {
            Parser.raiseParseError(tokens, message)
        }

        /**
         * @param {Tokens} tokens
         * @returns {ASTNode}
         */
        parseHyperScript(tokens) {
            var result = this.parseElement("hyperscript", tokens);
            if (tokens.hasMore()) this.raiseParseError(tokens);
            if (result) return result;
        }

        /**
         * @param {ASTNode | undefined} elt
         * @param {ASTNode} parent
         */
        setParent(elt, parent) {
            if (typeof elt === 'object') {
                elt.parent = parent;
                if (typeof parent === 'object') {
                    parent.children = (parent.children || new Set());
                    parent.children.add(elt)
                }
                this.setParent(elt.next, parent);
            }
        }

        /**
         * @param {Token} token
         * @returns {ParseRule}
         */
        commandStart(token) {
            return this.COMMANDS[token.value || ""];
        }

        /**
         * @param {Token} token
         * @returns {ParseRule}
         */
        featureStart(token) {
            return this.FEATURES[token.value || ""];
        }

        /**
         * @param {Token} token
         * @returns {boolean}
         */
        commandBoundary(token) {
            if (
                token.value == "end" ||
                token.value == "then" ||
                token.value == "else" ||
                token.value == "otherwise" ||
                token.value == ")" ||
                this.commandStart(token) ||
                this.featureStart(token) ||
                token.type == "EOF"
            ) {
                return true;
            }
            return false;
        }

        /**
         * @param {Tokens} tokens
         * @returns {(string | ASTNode)[]}
         */
        parseStringTemplate(tokens) {
            /** @type {(string | ASTNode)[]} */
            var returnArr = [""];
            do {
                returnArr.push(tokens.lastWhitespace());
                if (tokens.currentToken().value === "$") {
                    tokens.consumeToken();
                    var startingBrace = tokens.matchOpToken("{");
                    returnArr.push(this.requireElement("expression", tokens));
                    if (startingBrace) {
                        tokens.requireOpToken("}");
                    }
                    returnArr.push("");
                } else if (tokens.currentToken().value === "\\") {
                    tokens.consumeToken(); // skip next
                    tokens.consumeToken();
                } else {
                    var token = tokens.consumeToken();
                    returnArr[returnArr.length - 1] += token ? token.value : "";
                }
            } while (tokens.hasMore());
            returnArr.push(tokens.lastWhitespace());
            return returnArr;
        }

        /**
         * @param {ASTNode} commandList
         */
        ensureTerminated(commandList) {
            const runtime = this.runtime
            var implicitReturn = {
                type: "implicitReturn",
                op: function (context) {
                    context.meta.returned = true;
                    if (context.meta.resolve) {
                        context.meta.resolve();
                    }
                    return runtime.HALT;
                },
                execute: function (ctx) {
                    // do nothing
                },
            };

            var end = commandList;
            while (end.next) {
                end = end.next;
            }
            end.next = implicitReturn;
        }
    }

    class Runtime {
        /**
         *
         * @param {Lexer} [lexer]
         * @param {Parser} [parser]
         */
        constructor(lexer, parser) {
            this.lexer = lexer ?? new Lexer;
            this.parser = parser ?? new Parser(this)
                .use(hyperscriptCoreGrammar)
                .use(hyperscriptWebGrammar);
            this.parser.runtime = this
        }

        /**
         * @param {HTMLElement} elt
         * @param {string} selector
         * @returns boolean
         */
        matchesSelector(elt, selector) {
            // noinspection JSUnresolvedVariable
            var matchesFunction =
                // @ts-ignore
                elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector;
            return matchesFunction && matchesFunction.call(elt, selector);
        }

        /**
         * @param {string} eventName
         * @param {Object} [detail]
         * @returns {Event}
         */
        makeEvent(eventName, detail) {
            var evt;
            if (globalScope.Event && typeof globalScope.Event === "function") {
                evt = new Event(eventName, {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                });
                evt['detail'] = detail;
            } else {
                evt = document.createEvent("CustomEvent");
                evt.initCustomEvent(eventName, true, true, detail);
            }
            return evt;
        }

        /**
         * @param {Element} elt
         * @param {string} eventName
         * @param {Object} [detail]
         * @param {Element} [sender]
         * @returns {boolean}
         */
        triggerEvent(elt, eventName, detail, sender) {
            detail = detail || {};
            detail["sender"] = sender;
            var event = this.makeEvent(eventName, detail);
            var eventResult = elt.dispatchEvent(event);
            return eventResult;
        }

        /**
         * isArrayLike returns `true` if the provided value is an array or
         * something close enough to being an array for our purposes.
         *
         * @param {any} value
         * @returns {value is Array | NodeList | HTMLCollection | FileList}
         */
        isArrayLike(value) {
            return Array.isArray(value) ||
                (typeof NodeList !== 'undefined' && (value instanceof NodeList || value instanceof HTMLCollection || value instanceof FileList));
        }

        /**
         * isIterable returns `true` if the provided value supports the
         * iterator protocol.
         *
         * @param {any} value
         * @returns {value is Iterable}
         */
        isIterable(value) {
            return typeof value === 'object'
                && Symbol.iterator in value
                && typeof value[Symbol.iterator] === 'function';
        }

        /**
         * shouldAutoIterate returns `true` if the provided value
         * should be implicitly iterated over when accessing properties,
         * and as the target of some commands.
         *
         * Currently, this is when the value is an {ElementCollection}
         * or {isArrayLike} returns true.
         *
         * @param {any} value
         * @returns {value is (any[] | ElementCollection)}
         */
        shouldAutoIterate(value) {
            return value != null && value[shouldAutoIterateSymbol] ||
                this.isArrayLike(value);
        }

        /**
         * forEach executes the provided `func` on every item in the `value` array.
         * if `value` is a single item (and not an array) then `func` is simply called
         * once.  If `value` is null, then no further actions are taken.
         *
         * @template T
         * @param {T | Iterable<T>} value
         * @param {(item: T) => void} func
         */
        forEach(value, func) {
            if (value == null) {
                // do nothing
            } else if (this.isIterable(value)) {
                for (const nth of value) {
                    func(nth);
                }
            } else if (this.isArrayLike(value)) {
                for (var i = 0; i < value.length; i++) {
                    func(value[i]);
                }
            } else {
                func(value);
            }
        }

        /**
         * implicitLoop executes the provided `func` on:
         * - every item of {value}, if {value} should be auto-iterated
         *   (see {shouldAutoIterate})
         * - {value} otherwise
         *
         * @template T
         * @param {ElementCollection | T | T[]} value
         * @param {(item: T) => void} func
         */
        implicitLoop(value, func) {
            if (this.shouldAutoIterate(value)) {
                for (const x of value) func(x);
            } else {
                func(value);
            }
        }

        wrapArrays(args) {
            var arr = [];
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (Array.isArray(arg)) {
                    arr.push(Promise.all(arg));
                } else {
                    arr.push(arg);
                }
            }
            return arr;
        }

        unwrapAsyncs(values) {
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

        static HALT = {};
        HALT = Runtime.HALT;

        /**
         * @param {ASTNode} command
         * @param {Context} ctx
         */
        unifiedExec(command, ctx) {
            while (true) {
                try {
                    var next = this.unifiedEval(command, ctx);
                } catch (e) {
                    if (ctx.meta.handlingFinally) {
                        console.error(" Exception in finally block: ", e);
                        next = Runtime.HALT;
                    } else {
                        this.registerHyperTrace(ctx, e);
                        if (ctx.meta.errorHandler && !ctx.meta.handlingError) {
                            ctx.meta.handlingError = true;
                            ctx.locals[ctx.meta.errorSymbol] = e;
                            command = ctx.meta.errorHandler;
                            continue;
                        } else  {
                            ctx.meta.currentException = e;
                            next = Runtime.HALT;
                        }
                    }
                }
                if (next == null) {
                    console.error(command, " did not return a next element to execute! context: ", ctx);
                    return;
                } else if (next.then) {
                    next.then(resolvedNext => {
                        this.unifiedExec(resolvedNext, ctx);
                    }).catch(reason => {
                        this.unifiedExec({ // Anonymous command to simply throw the exception
                            op: function(){
                                throw reason;
                            }
                        }, ctx);
                    });
                    return;
                } else if (next === Runtime.HALT) {
                    if (ctx.meta.finallyHandler && !ctx.meta.handlingFinally) {
                        ctx.meta.handlingFinally = true;
                        command = ctx.meta.finallyHandler;
                    } else {
                        if (ctx.meta.onHalt) {
                            ctx.meta.onHalt();
                        }
                        if (ctx.meta.currentException) {
                            if (ctx.meta.reject) {
                                ctx.meta.reject(ctx.meta.currentException);
                                return;
                            } else {
                                throw ctx.meta.currentException;
                            }
                        } else {
                            return;
                        }
                    }
                } else {
                    command = next; // move to the next command
                }
            }
        }

        /**
         * @param {*} parseElement
         * @param {Context} ctx
         * @param {Boolean} shortCircuitOnValue
         * @returns {*}
         */
        unifiedEval(parseElement, ctx, shortCircuitOnValue) {
            /** @type any[] */
            var args = [ctx];
            var async = false;
            var wrappedAsyncs = false;

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
                        if (value) {
                            if (shortCircuitOnValue === true) {
                                break;
                            }
                        } else {
                            if (shortCircuitOnValue === false) {
                                break;
                            }
                        }
                    } else {
                        args.push(argument);
                    }
                }
            }
            if (async) {
                return new Promise((resolve, reject) => {
                    args = this.wrapArrays(args);
                    Promise.all(args)
                        .then(function (values) {
                            if (wrappedAsyncs) {
                                this.unwrapAsyncs(values);
                            }
                            try {
                                var apply = parseElement.op.apply(parseElement, values);
                                resolve(apply);
                            } catch (e) {
                                reject(e);
                            }
                        })
                        .catch(function (reason) {
                            reject(reason);
                        });
                });
            } else {
                if (wrappedAsyncs) {
                    this.unwrapAsyncs(args);
                }
                return parseElement.op.apply(parseElement, args);
            }
        }

        /**
         * @type {string[] | null}
         */
        _scriptAttrs = null;

        /**
         * getAttributes returns the attribute name(s) to use when
         * locating hyperscript scripts in a DOM element.  If no value
         * has been configured, it defaults to config.attributes
         * @returns string[]
         */
        getScriptAttributes() {
            if (this._scriptAttrs == null) {
                this._scriptAttrs = config.attributes.replace(/ /g, "").split(",");
            }
            return this._scriptAttrs;
        }

        /**
         * @param {Element} elt
         * @returns {string | null}
         */
        getScript(elt) {
            for (var i = 0; i < this.getScriptAttributes().length; i++) {
                var scriptAttribute = this.getScriptAttributes()[i];
                if (elt.hasAttribute && elt.hasAttribute(scriptAttribute)) {
                    return elt.getAttribute(scriptAttribute);
                }
            }
            if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
                return elt.innerText;
            }
            return null;
        }

        hyperscriptFeaturesMap = new WeakMap

        /**
         * @param {*} elt
         * @returns {Object}
         */
        getHyperscriptFeatures(elt) {
            var hyperscriptFeatures = this.hyperscriptFeaturesMap.get(elt);
            if (typeof hyperscriptFeatures === 'undefined') {
                if (elt) {
                    // in some rare cases, elt is null and this line crashes
                    this.hyperscriptFeaturesMap.set(elt, hyperscriptFeatures = {});
                }
            }
            return hyperscriptFeatures;
        }

        /**
         * @param {Object} owner
         * @param {Context} ctx
         */
        addFeatures(owner, ctx) {
            if (owner) {
                Object.assign(ctx.locals, this.getHyperscriptFeatures(owner));
                this.addFeatures(owner.parentElement, ctx);
            }
        }

        /**
         * @param {*} owner
         * @param {*} feature
         * @param {*} hyperscriptTarget
         * @param {*} event
         * @returns {Context}
         */
        makeContext(owner, feature, hyperscriptTarget, event) {
            return new Context(owner, feature, hyperscriptTarget, event, this)
        }

        /**
         * @returns string
         */
        getScriptSelector() {
            return this.getScriptAttributes()
                .map(function (attribute) {
                    return "[" + attribute + "]";
                })
                .join(", ");
        }

        /**
         * @param {any} value
         * @param {string} type
         * @returns {any}
         */
        convertValue(value, type) {
            var dynamicResolvers = conversions.dynamicResolvers;
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
            var converter = conversions[type];
            if (converter) {
                return converter(value);
            }

            throw "Unknown conversion : " + type;
        }

        /**
         * @param {string} src
         * @returns {ASTNode}
         */
        parse(src) {
            const lexer = this.lexer, parser = this.parser
            var tokens = lexer.tokenize(src);
            if (this.parser.commandStart(tokens.currentToken())) {
                var commandList = parser.requireElement("commandList", tokens);
                if (tokens.hasMore()) parser.raiseParseError(tokens);
                parser.ensureTerminated(commandList);
                return commandList;
            } else if (parser.featureStart(tokens.currentToken())) {
                var hyperscript = parser.requireElement("hyperscript", tokens);
                if (tokens.hasMore()) parser.raiseParseError(tokens);
                return hyperscript;
            } else {
                var expression = parser.requireElement("expression", tokens);
                if (tokens.hasMore()) parser.raiseParseError(tokens);
                return expression;
            }
        }

        /**
         *
         * @param {ASTNode} elt
         * @param {Context} ctx
         * @returns {any}
         */
        evaluateNoPromise(elt, ctx) {
            let result = elt.evaluate(ctx);
            if (result.next) {
                throw new Error(Tokens.sourceFor.call(elt) + " returned a Promise in a context that they are not allowed.");
            }
            return result;
        }

        /**
         * @param {string} src
         * @param {Partial<Context>} [ctx]
         * @param {Object} [args]
         * @returns {any}
         */
        evaluate(src, ctx, args) {
            class HyperscriptModule extends EventTarget {
                constructor(mod) {
                    super();
                    this.module = mod;
                }
                toString() {
                    return this.module.id;
                }
            }

            var body = 'document' in globalScope
                ? globalScope.document.body
                : new HyperscriptModule(args && args.module);
            ctx = Object.assign(this.makeContext(body, null, body, null), ctx || {});
            var element = this.parse(src);
            if (element.execute) {
                element.execute(ctx);
                if(typeof ctx.meta.returnValue !== 'undefined'){
                    return ctx.meta.returnValue;
                } else {
                    return ctx.result;
                }
            } else if (element.apply) {
                element.apply(body, body, args);
                return this.getHyperscriptFeatures(body);
            } else {
                return element.evaluate(ctx);
            }

            function makeModule() {
                return {}
            }
        }

        /**
         * @param {HTMLElement} elt
         */
        processNode(elt) {
            var selector = this.getScriptSelector();
            if (this.matchesSelector(elt, selector)) {
                this.initElement(elt, elt);
            }
            if (elt instanceof HTMLScriptElement && elt.type === "text/hyperscript") {
                this.initElement(elt, document.body);
            }
            if (elt.querySelectorAll) {
                this.forEach(elt.querySelectorAll(selector + ", [type='text/hyperscript']"), elt => {
                    this.initElement(elt, elt instanceof HTMLScriptElement && elt.type === "text/hyperscript" ? document.body : elt);
                });
            }
        }

        /**
         * @param {Element} elt
         * @param {Element} [target]
         */
        initElement(elt, target) {
            if (elt.closest && elt.closest(config.disableSelector)) {
                return;
            }
            var internalData = this.getInternalData(elt);
            if (!internalData.initialized) {
                var src = this.getScript(elt);
                if (src) {
                    try {
                        internalData.initialized = true;
                        internalData.script = src;
                        const lexer = this.lexer, parser = this.parser
                        var tokens = lexer.tokenize(src);
                        var hyperScript = parser.parseHyperScript(tokens);
                        if (!hyperScript) return;
                        hyperScript.apply(target || elt, elt);
                        setTimeout(() => {
                            this.triggerEvent(target || elt, "load", {
                                hyperscript: true,
                            });
                        }, 1);
                    } catch (e) {
                        this.triggerEvent(elt, "exception", {
                            error: e,
                        });
                        console.error(
                            "hyperscript errors were found on the following element:",
                            elt,
                            "\n\n",
                            e.message,
                            e.stack
                        );
                    }
                }
            }
        }

        internalDataMap = new WeakMap

        /**
         * @param {Element} elt
         * @returns {Object}
         */
        getInternalData(elt) {
            var internalData = this.internalDataMap.get(elt);
            if (typeof internalData === 'undefined') {
                this.internalDataMap.set(elt, internalData = {});
            }
            return internalData;
        }

        /**
         * @param {any} value
         * @param {string} typeString
         * @param {boolean} [nullOk]
         * @returns {boolean}
         */
        typeCheck(value, typeString, nullOk) {
            if (value == null && nullOk) {
                return true;
            }
            var typeName = Object.prototype.toString.call(value).slice(8, -1);
            return typeName === typeString;
        }

        getElementScope(context) {
            var elt = context.meta && context.meta.owner;
            if (elt) {
                var internalData = this.getInternalData(elt);
                var scopeName = "elementScope";
                if (context.meta.feature && context.meta.feature.behavior) {
                    scopeName = context.meta.feature.behavior + "Scope";
                }
                var elementScope = getOrInitObject(internalData, scopeName);
                return elementScope;
            } else {
                return {}; // no element, return empty scope
            }
        }

        /**
         * @param {string} str
         * @returns {boolean}
         */
        isReservedWord(str) {
            return ["meta", "it", "result", "locals", "event", "target", "detail", "sender", "body"].includes(str)
        }

        /**
         * @param {any} context
         * @returns {boolean}
         */
        isHyperscriptContext(context) {
            return context instanceof Context;
        }

        /**
         * @param {string} str
         * @param {Context} context
         * @returns {any}
         */
        resolveSymbol(str, context, type) {
            if (str === "me" || str === "my" || str === "I") {
                return context.me;
            }
            if (str === "it" || str === "its" || str === "result") {
                return context.result;
            }
            if (str === "you" || str === "your" || str === "yourself") {
                return context.you;
            } else {
                if (type === "global") {
                    return globalScope[str];
                } else if (type === "element") {
                    var elementScope = this.getElementScope(context);
                    return elementScope[str];
                } else if (type === "local") {
                    return context.locals[str];
                } else {
                    // meta scope (used for event conditionals)
                    if (context.meta && context.meta.context) {
                        var fromMetaContext = context.meta.context[str];
                        if (typeof fromMetaContext !== "undefined") {
                            return fromMetaContext;
                        }
                        // resolve against the `detail` object in the meta context as well
                        if (context.meta.context.detail) {
                            fromMetaContext = context.meta.context.detail[str];
                            if (typeof fromMetaContext !== "undefined") {
                                return fromMetaContext;
                            }
                        }
                    }
                    if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                        // local scope
                        var fromContext = context.locals[str];
                    } else {
                        // direct get from normal JS object or top-level of context
                        var fromContext = context[str];
                    }
                    if (typeof fromContext !== "undefined") {
                        return fromContext;
                    } else {
                        // element scope
                        var elementScope = this.getElementScope(context);
                        fromContext = elementScope[str];
                        if (typeof fromContext !== "undefined") {
                            return fromContext;
                        } else {
                            // global scope
                            return globalScope[str];
                        }
                    }
                }
            }
        }

        setSymbol(str, context, type, value) {
            if (type === "global") {
                globalScope[str] = value;
            } else if (type === "element") {
                var elementScope = this.getElementScope(context);
                elementScope[str] = value;
            } else if (type === "local") {
                context.locals[str] = value;
            } else {
                if (this.isHyperscriptContext(context) && !this.isReservedWord(str) && typeof context.locals[str] !== "undefined") {
                    // local scope
                    context.locals[str] = value;
                } else {
                    // element scope
                    var elementScope = this.getElementScope(context);
                    var fromContext = elementScope[str];
                    if (typeof fromContext !== "undefined") {
                        elementScope[str] = value;
                    } else {
                        if (this.isHyperscriptContext(context) && !this.isReservedWord(str)) {
                            // local scope
                            context.locals[str] = value;
                        } else {
                            // direct set on normal JS object or top-level of context
                            context[str] = value;
                        }
                    }
                }
            }
        }

        /**
         * @param {ASTNode} command
         * @param {Context} context
         * @returns {undefined | ASTNode}
         */
        findNext(command, context) {
            if (command) {
                if (command.resolveNext) {
                    return command.resolveNext(context);
                } else if (command.next) {
                    return command.next;
                } else {
                    return this.findNext(command.parent, context);
                }
            }
        }

        /**
         * @param {Object<string,any>} root
         * @param {string} property
         * @param {Getter} getter
         * @returns {any}
         *
         * @callback Getter
         * @param {Object<string,any>} root
         * @param {string} property
         */
        flatGet(root, property, getter) {
            if (root != null) {
                var val = getter(root, property);
                if (typeof val !== "undefined") {
                    return val;
                }

                if (this.shouldAutoIterate(root)) {
                    // flat map
                    var result = [];
                    for (var component of root) {
                        var componentValue = getter(component, property);
                        result.push(componentValue);
                    }
                    return result;
                }
            }
        }

        resolveProperty(root, property) {
            return this.flatGet(root, property, (root, property) => root[property] )
        }

        resolveAttribute(root, property) {
            return this.flatGet(root, property, (root, property) => root.getAttribute && root.getAttribute(property) )
        }

        /**
         *
         * @param {Object<string, any>} root
         * @param {string} property
         * @returns {string}
         */
        resolveStyle(root, property) {
            return this.flatGet(root, property, (root, property) => root.style && root.style[property] )
        }

        /**
         *
         * @param {Object<string, any>} root
         * @param {string} property
         * @returns {string}
         */
        resolveComputedStyle(root, property) {
            return this.flatGet(root, property, (root, property) => getComputedStyle(
                /** @type {Element} */ (root)).getPropertyValue(property) )
        }

        /**
         * @param {Element} elt
         * @param {string[]} nameSpace
         * @param {string} name
         * @param {any} value
         */
        assignToNamespace(elt, nameSpace, name, value) {
            let root
            if (typeof document !== "undefined" && elt === document.body) {
                root = globalScope;
            } else {
                root = this.getHyperscriptFeatures(elt);
            }
            var propertyName;
            while ((propertyName = nameSpace.shift()) !== undefined) {
                var newRoot = root[propertyName];
                if (newRoot == null) {
                    newRoot = {};
                    root[propertyName] = newRoot;
                }
                root = newRoot;
            }

            root[name] = value;
        }

        getHyperTrace(ctx, thrown) {
            var trace = [];
            var root = ctx;
            while (root.meta.caller) {
                root = root.meta.caller;
            }
            if (root.meta.traceMap) {
                return root.meta.traceMap.get(thrown, trace);
            }
        }

        registerHyperTrace(ctx, thrown) {
            var trace = [];
            var root = null;
            while (ctx != null) {
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
                    print: function (logger) {
                        logger = logger || console.error;
                        logger("hypertrace /// ");
                        var maxLen = 0;
                        for (var i = 0; i < trace.length; i++) {
                            maxLen = Math.max(maxLen, trace[i].meta.feature.displayName.length);
                        }
                        for (var i = 0; i < trace.length; i++) {
                            var traceElt = trace[i];
                            logger(
                                "  ->",
                                traceElt.meta.feature.displayName.padEnd(maxLen + 2),
                                "-",
                                traceElt.meta.owner
                            );
                        }
                    },
                };
                root.meta.traceMap.set(thrown, traceEntry);
            }
        }

        /**
         * @param {string} str
         * @returns {string}
         */
        escapeSelector(str) {
            return str.replace(/[:&()\[\]\/]/g, function (str) {
                return "\\" + str;
            });
        }

        /**
         * @param {any} value
         * @param {*} elt
         */
        nullCheck(value, elt) {
            if (value == null) {
                throw new Error("'" + elt.sourceFor() + "' is null");
            }
        }

        /**
         * @param {any} value
         * @returns {boolean}
         */
        isEmpty(value) {
            return value == undefined || value.length === 0;
        }

        /**
         * @param {any} value
         * @returns {boolean}
         */
        doesExist(value) {
            if(value == null){
                return false;
            }
            if (this.shouldAutoIterate(value)) {
                for (const elt of value) {
                    return true;
                }
                return false;
            }
            return true;
        }

        /**
         * @param {Node} node
         * @returns {Document|ShadowRoot}
         */
        getRootNode(node) {
            if (node && node instanceof Node) {
                var rv = node.getRootNode();
                if (rv instanceof Document || rv instanceof ShadowRoot) return rv;
            }
            return document;
        }

        /**
         *
         * @param {Element} elt
         * @param {ASTNode} onFeature
         * @returns {EventQueue}
         *
         * @typedef {{queue:Array, executing:boolean}} EventQueue
         */
        getEventQueueFor(elt, onFeature) {
            let internalData = this.getInternalData(elt);
            var eventQueuesForElt = internalData.eventQueues;
            if (eventQueuesForElt == null) {
                eventQueuesForElt = new Map();
                internalData.eventQueues = eventQueuesForElt;
            }
            var eventQueueForFeature = eventQueuesForElt.get(onFeature);
            if (eventQueueForFeature == null) {
                eventQueueForFeature = {queue:[], executing:false};
                eventQueuesForElt.set(onFeature, eventQueueForFeature);
            }
            return eventQueueForFeature;
        }

        beepValueToConsole(element, expression, value) {
            if (this.triggerEvent(element, "hyperscript:beep", {element, expression, value})) {
                var typeName;
                if (value) {
                    if (value instanceof ElementCollection) {
                        typeName = "ElementCollection";
                    } else if (value.constructor) {
                        typeName = value.constructor.name;
                    } else {
                        typeName = "unknown";
                    }
                } else {
                    typeName = "object (null)"
                }
                var logValue = value;
                if (typeName === "String") {
                    logValue = '"' + logValue + '"';
                } else if (value instanceof ElementCollection) {
                    logValue = Array.from(value);
                }
                console.log("///_ BEEP! The expression (" + Tokens.sourceFor.call(expression).replace("beep! ", "") + ") evaluates to:", logValue, "of type " + typeName);
            }
        }


        /** @type string | null */
            // @ts-ignore
        hyperscriptUrl = "document" in globalScope && document.currentScript ? document.currentScript.src : null;
    }


    function getCookiesAsArray() {
        let cookiesAsArray = document.cookie
            .split("; ")
            .map(cookieEntry => {
                let strings = cookieEntry.split("=");
                return {name: strings[0], value: decodeURIComponent(strings[1])}
            });
        return cookiesAsArray;
    }

    function clearCookie(name) {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    function clearAllCookies() {
        for (const cookie of getCookiesAsArray()) {
            clearCookie(cookie.name);
        }
    }

    const CookieJar = new Proxy({}, {
        get(target, prop) {
            if (prop === 'then' || prop === 'asyncWrapper') { // ignore special symbols
                return null;
            } else if (prop === 'length') {
                return getCookiesAsArray().length
            } else if (prop === 'clear') {
                return clearCookie;
            } else if (prop === 'clearAll') {
                return clearAllCookies;
            } else if (typeof prop === "string") {
                if (!isNaN(prop)) {
                    return getCookiesAsArray()[parseInt(prop)];

                } else {
                    let value = document.cookie
                        .split("; ")
                        .find((row) => row.startsWith(prop + "="))
                        ?.split("=")[1];
                    if(value) {
                        return decodeURIComponent(value);
                    }
                }
            } else if (prop === Symbol.iterator) {
                return getCookiesAsArray()[prop];
            }
        },
        set(target, prop, value) {
            var finalValue = null;
            if ('string' === typeof value) {
                finalValue = encodeURIComponent(value)
                finalValue += ";samesite=lax"
            } else {
                finalValue = encodeURIComponent(value.value);
                if (value.expires) {
                    finalValue+=";expires=" + value.maxAge;
                }
                if (value.maxAge) {
                    finalValue+=";max-age=" + value.maxAge;
                }
                if (value.partitioned) {
                    finalValue+=";partitioned=" + value.partitioned;
                }
                if (value.path) {
                    finalValue+=";path=" + value.path;
                }
                if (value.samesite) {
                    finalValue+=";samesite=" + value.path;
                }
                if (value.secure) {
                    finalValue+=";secure=" + value.path;
                }
            }
            document.cookie= prop + "=" + finalValue;
            return true;
        }
    })

    class Context {
        /**
         * @param {*} owner
         * @param {*} feature
         * @param {*} hyperscriptTarget
         * @param {*} event
         */
        constructor(owner, feature, hyperscriptTarget, event, runtime) {
            this.meta = {
                parser: runtime.parser,
                lexer: runtime.lexer,
                runtime,
                owner: owner,
                feature: feature,
                iterators: {},
                ctx: this
            }
            this.locals = {
                cookies:CookieJar
            };
            this.me = hyperscriptTarget,
                this.you = undefined
            this.result = undefined
            this.event = event;
            this.target = event ? event.target : null;
            this.detail = event ? event.detail : null;
            this.sender = event ? event.detail ? event.detail.sender : null : null;
            this.body = "document" in globalScope ? document.body : null;
            runtime.addFeatures(owner, this);
        }
    }

    class ElementCollection {
        constructor(css, relativeToElement, escape) {
            this._css = css;
            this.relativeToElement = relativeToElement;
            this.escape = escape;
            this[shouldAutoIterateSymbol] = true;
        }

        get css() {
            if (this.escape) {
                return Runtime.prototype.escapeSelector(this._css);
            } else {
                return this._css;
            }
        }

        get className() {
            return this._css.substr(1);
        }

        get id() {
            return this.className();
        }

        contains(elt) {
            for (let element of this) {
                if (element.contains(elt)) {
                    return true;
                }
            }
            return false;
        }

        get length() {
            return this.selectMatches().length;
        }

        [Symbol.iterator]() {
            let query = this.selectMatches();
            return query [Symbol.iterator]();
        }

        selectMatches() {
            let query = Runtime.prototype.getRootNode(this.relativeToElement).querySelectorAll(this.css);
            return query;
        }
    }

    /**
     * @type {symbol}
     */
    const shouldAutoIterateSymbol = Symbol()

    function getOrInitObject(root, prop) {
        var value = root[prop];
        if (value) {
            return value;
        } else {
            var newObj = {};
            root[prop] = newObj;
            return newObj;
        }
    }

    /**
     * parseJSON parses a JSON string into a corresponding value.  If the
     * value passed in is not valid JSON, then it logs an error and returns `null`.
     *
     * @param {string} jString
     * @returns any
     */
    function parseJSON(jString) {
        try {
            return JSON.parse(jString);
        } catch (error) {
            logError(error);
            return null;
        }
    }

    /**
     * logError writes an error message to the Javascript console.  It can take any
     * value, but msg should commonly be a simple string.
     * @param {*} msg
     */
    function logError(msg) {
        if (console.error) {
            console.error(msg);
        } else if (console.log) {
            console.log("ERROR: ", msg);
        }
    }

    // TODO: JSDoc description of what's happening here
    function varargConstructor(Cls, args) {
        return new (Cls.bind.apply(Cls, [Cls].concat(args)))();
    }

    // Grammar

    /**
     * @param {Parser} parser
     */
    function hyperscriptCoreGrammar(parser) {
        parser.addLeafExpression("parenthesized", function (parser, _runtime, tokens) {
            if (tokens.matchOpToken("(")) {
                var follows = tokens.clearFollows();
                try {
                    var expr = parser.requireElement("expression", tokens);
                } finally {
                    tokens.restoreFollows(follows);
                }
                tokens.requireOpToken(")");
                return expr;
            }
        });

        parser.addLeafExpression("string", function (parser, runtime, tokens) {
            var stringToken = tokens.matchTokenType("STRING");
            if (!stringToken) return;
            var rawValue = /** @type {string} */ (stringToken.value);
            /** @type {any[]} */
            var args;
            if (stringToken.template) {
                var innerTokens = Lexer.tokenize(rawValue, true);
                args = parser.parseStringTemplate(innerTokens);
            } else {
                args = [];
            }
            return {
                type: "string",
                token: stringToken,
                args: args,
                op: function (context) {
                    var returnStr = "";
                    for (var i = 1; i < arguments.length; i++) {
                        var val = arguments[i];
                        if (val !== undefined) {
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
                },
            };
        });

        parser.addGrammarElement("nakedString", function (parser, runtime, tokens) {
            if (tokens.hasMore()) {
                var tokenArr = tokens.consumeUntilWhitespace();
                tokens.matchTokenType("WHITESPACE");
                return {
                    type: "nakedString",
                    tokens: tokenArr,
                    evaluate: function (context) {
                        return tokenArr
                            .map(function (t) {
                                return t.value;
                            })
                            .join("");
                    },
                };
            }
        });

        parser.addLeafExpression("number", function (parser, runtime, tokens) {
            var number = tokens.matchTokenType("NUMBER");
            if (!number) return;
            var numberToken = number;
            var value = parseFloat(/** @type {string} */ (number.value));
            return {
                type: "number",
                value: value,
                numberToken: numberToken,
                evaluate: function () {
                    return value;
                },
            };
        });

        parser.addLeafExpression("idRef", function (parser, runtime, tokens) {
            var elementId = tokens.matchTokenType("ID_REF");
            if (!elementId) return;
            if (!elementId.value) return;
            // TODO - unify these two expression types
            if (elementId.template) {
                var templateValue = elementId.value.substring(2);
                var innerTokens = Lexer.tokenize(templateValue);
                var innerExpression = parser.requireElement("expression", innerTokens);
                return {
                    type: "idRefTemplate",
                    args: [innerExpression],
                    op: function (context, arg) {
                        return runtime.getRootNode(context.me).getElementById(arg);
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                const value = elementId.value.substring(1);
                return {
                    type: "idRef",
                    css: elementId.value,
                    value: value,
                    evaluate: function (context) {
                        return (
                            runtime.getRootNode(context.me).getElementById(value)
                        );
                    },
                };
            }
        });

        parser.addLeafExpression("classRef", function (parser, runtime, tokens) {
            var classRef = tokens.matchTokenType("CLASS_REF");

            if (!classRef) return;
            if (!classRef.value) return;

            // TODO - unify these two expression types
            if (classRef.template) {
                var templateValue = classRef.value.substring(2);
                var innerTokens = Lexer.tokenize(templateValue);
                var innerExpression = parser.requireElement("expression", innerTokens);
                return {
                    type: "classRefTemplate",
                    args: [innerExpression],
                    op: function (context, arg) {
                        return new ElementCollection("." + arg, context.me, true)
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                const css = classRef.value;
                return {
                    type: "classRef",
                    css: css,
                    evaluate: function (context) {
                        return new ElementCollection(css, context.me, true)
                    },
                };
            }
        });

        class TemplatedQueryElementCollection extends ElementCollection {
            constructor(css, relativeToElement, templateParts) {
                super(css, relativeToElement);
                this.templateParts = templateParts;
                this.elements = templateParts.filter(elt => elt instanceof Element);
            }

            get css() {
                let rv = "", i = 0
                for (const val of this.templateParts) {
                    if (val instanceof Element) {
                        rv += "[data-hs-query-id='" + i++ + "']";
                    } else rv += val;
                }
                return rv;
            }

            [Symbol.iterator]() {
                this.elements.forEach((el, i) => el.dataset.hsQueryId = i);
                const rv = super[Symbol.iterator]();
                this.elements.forEach(el => el.removeAttribute('data-hs-query-id'));
                return rv;
            }
        }

        parser.addLeafExpression("queryRef", function (parser, runtime, tokens) {
            var queryStart = tokens.matchOpToken("<");
            if (!queryStart) return;
            var queryTokens = tokens.consumeUntil("/");
            tokens.requireOpToken("/");
            tokens.requireOpToken(">");
            var queryValue = queryTokens
                .map(function (t) {
                    if (t.type === "STRING") {
                        return '"' + t.value + '"';
                    } else {
                        return t.value;
                    }
                })
                .join("");

            var template, innerTokens, args;
            if (/\$[^=]/.test(queryValue)) {
                template = true;
                innerTokens = Lexer.tokenize(queryValue, true);
                args = parser.parseStringTemplate(innerTokens);
            }

            return {
                type: "queryRef",
                css: queryValue,
                args: args,
                op: function (context, ...args) {
                    if (template) {
                        return new TemplatedQueryElementCollection(queryValue, context.me, args)
                    } else {
                        return new ElementCollection(queryValue, context.me)
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("attributeRef", function (parser, runtime, tokens) {
            var attributeRef = tokens.matchTokenType("ATTRIBUTE_REF");
            if (!attributeRef) return;
            if (!attributeRef.value) return;
            var outerVal = attributeRef.value;
            if (outerVal.indexOf("[") === 0) {
                var innerValue = outerVal.substring(2, outerVal.length - 1);
            } else {
                var innerValue = outerVal.substring(1);
            }
            var css = "[" + innerValue + "]";
            var split = innerValue.split("=");
            var name = split[0];
            var value = split[1];
            if (value) {
                // strip quotes
                if (value.indexOf('"') === 0) {
                    value = value.substring(1, value.length - 1);
                }
            }
            return {
                type: "attributeRef",
                name: name,
                css: css,
                value: value,
                op: function (context) {
                    var target = context.you || context.me;
                    if (target) {
                        return target.getAttribute(name);
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("styleRef", function (parser, runtime, tokens) {
            var styleRef = tokens.matchTokenType("STYLE_REF");
            if (!styleRef) return;
            if (!styleRef.value) return;
            var styleProp = styleRef.value.substr(1);
            if (styleProp.startsWith("computed-")) {
                styleProp = styleProp.substr("computed-".length);
                return {
                    type: "computedStyleRef",
                    name: styleProp,
                    op: function (context) {
                        var target = context.you || context.me;
                        if (target) {
                            return runtime.resolveComputedStyle(target, styleProp);
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                return {
                    type: "styleRef",
                    name: styleProp,
                    op: function (context) {
                        var target = context.you || context.me;
                        if (target) {
                            return runtime.resolveStyle(target, styleProp);
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            }
        });

        parser.addGrammarElement("objectKey", function (parser, runtime, tokens) {
            var token;
            if ((token = tokens.matchTokenType("STRING"))) {
                return {
                    type: "objectKey",
                    key: token.value,
                    evaluate: function () {
                        return token.value;
                    },
                };
            } else if (tokens.matchOpToken("[")) {
                var expr = parser.parseElement("expression", tokens);
                tokens.requireOpToken("]");
                return {
                    type: "objectKey",
                    expr: expr,
                    args: [expr],
                    op: function (ctx, expr) {
                        return expr;
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                var key = "";
                do {
                    token = tokens.matchTokenType("IDENTIFIER") || tokens.matchOpToken("-");
                    if (token) key += token.value;
                } while (token);
                return {
                    type: "objectKey",
                    key: key,
                    evaluate: function () {
                        return key;
                    },
                };
            }
        });

        parser.addLeafExpression("objectLiteral", function (parser, runtime, tokens) {
            if (!tokens.matchOpToken("{")) return;
            var keyExpressions = [];
            var valueExpressions = [];
            if (!tokens.matchOpToken("}")) {
                do {
                    var name = parser.requireElement("objectKey", tokens);
                    tokens.requireOpToken(":");
                    var value = parser.requireElement("expression", tokens);
                    valueExpressions.push(value);
                    keyExpressions.push(name);
                } while (tokens.matchOpToken(",") && !tokens.peekToken("}", 0, 'R_BRACE'));
                tokens.requireOpToken("}");
            }
            return {
                type: "objectLiteral",
                args: [keyExpressions, valueExpressions],
                op: function (context, keys, values) {
                    var returnVal = {};
                    for (var i = 0; i < keys.length; i++) {
                        returnVal[keys[i]] = values[i];
                    }
                    return returnVal;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("nakedNamedArgumentList", function (parser, runtime, tokens) {
            var fields = [];
            var valueExpressions = [];
            if (tokens.currentToken().type === "IDENTIFIER") {
                do {
                    var name = tokens.requireTokenType("IDENTIFIER");
                    tokens.requireOpToken(":");
                    var value = parser.requireElement("expression", tokens);
                    valueExpressions.push(value);
                    fields.push({ name: name, value: value });
                } while (tokens.matchOpToken(","));
            }
            return {
                type: "namedArgumentList",
                fields: fields,
                args: [valueExpressions],
                op: function (context, values) {
                    var returnVal = { _namedArgList_: true };
                    for (var i = 0; i < values.length; i++) {
                        var field = fields[i];
                        returnVal[field.name.value] = values[i];
                    }
                    return returnVal;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("namedArgumentList", function (parser, runtime, tokens) {
            if (!tokens.matchOpToken("(")) return;
            var elt = parser.requireElement("nakedNamedArgumentList", tokens);
            tokens.requireOpToken(")");
            return elt;
        });

        parser.addGrammarElement("symbol", function (parser, runtime, tokens) {
            /** @scope {SymbolScope} */
            var scope = "default";
            if (tokens.matchToken("global")) {
                scope = "global";
            } else if (tokens.matchToken("element") || tokens.matchToken("module")) {
                scope = "element";
                // optional possessive
                if (tokens.matchOpToken("'")) {
                    tokens.requireToken("s");
                }
            } else if (tokens.matchToken("local")) {
                scope = "local";
            }

            // TODO better look ahead here
            let eltPrefix = tokens.matchOpToken(":");
            let identifier = tokens.matchTokenType("IDENTIFIER");
            if (identifier && identifier.value) {
                var name = identifier.value;
                if (eltPrefix) {
                    name = ":" + name;
                }
                if (scope === "default") {
                    if (name.indexOf("$") === 0) {
                        scope = "global";
                    }
                    if (name.indexOf(":") === 0) {
                        scope = "element";
                    }
                }
                return {
                    type: "symbol",
                    token: identifier,
                    scope: scope,
                    name: name,
                    evaluate: function (context) {
                        return runtime.resolveSymbol(name, context, scope);
                    },
                };
            }
        });

        parser.addGrammarElement("implicitMeTarget", function (parser, runtime, tokens) {
            return {
                type: "implicitMeTarget",
                evaluate: function (context) {
                    return context.you || context.me;
                },
            };
        });

        parser.addLeafExpression("boolean", function (parser, runtime, tokens) {
            var booleanLiteral = tokens.matchToken("true") || tokens.matchToken("false");
            if (!booleanLiteral) return;
            const value = booleanLiteral.value === "true";
            return {
                type: "boolean",
                evaluate: function (context) {
                    return value;
                },
            };
        });

        parser.addLeafExpression("null", function (parser, runtime, tokens) {
            if (tokens.matchToken("null")) {
                return {
                    type: "null",
                    evaluate: function (context) {
                        return null;
                    },
                };
            }
        });

        parser.addLeafExpression("arrayLiteral", function (parser, runtime, tokens) {
            if (!tokens.matchOpToken("[")) return;
            var values = [];
            if (!tokens.matchOpToken("]")) {
                do {
                    var expr = parser.requireElement("expression", tokens);
                    values.push(expr);
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken("]");
            }
            return {
                type: "arrayLiteral",
                values: values,
                args: [values],
                op: function (context, values) {
                    return values;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("blockLiteral", function (parser, runtime, tokens) {
            if (!tokens.matchOpToken("\\")) return;
            var args = [];
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
                    var returnFunc = function () {
                        //TODO - push scope
                        for (var i = 0; i < args.length; i++) {
                            ctx.locals[args[i].value] = arguments[i];
                        }
                        return expr.evaluate(ctx); //OK
                    };
                    return returnFunc;
                },
            };
        });

        parser.addIndirectExpression("propertyAccess", function (parser, runtime, tokens, root) {
            if (!tokens.matchOpToken(".")) return;
            var prop = tokens.requireTokenType("IDENTIFIER");
            var propertyAccess = {
                type: "propertyAccess",
                root: root,
                prop: prop,
                args: [root],
                op: function (_context, rootVal) {
                    var value = runtime.resolveProperty(rootVal, prop.value);
                    return value;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
            return parser.parseElement("indirectExpression", tokens, propertyAccess);
        });

        parser.addIndirectExpression("of", function (parser, runtime, tokens, root) {
            if (!tokens.matchToken("of")) return;
            var newRoot = parser.requireElement("unaryExpression", tokens);
            // find the urroot
            var childOfUrRoot = null;
            var urRoot = root;
            while (urRoot.root) {
                childOfUrRoot = urRoot;
                urRoot = urRoot.root;
            }
            if (urRoot.type !== "symbol" && urRoot.type !== "attributeRef" && urRoot.type !== "styleRef" && urRoot.type !== "computedStyleRef") {
                parser.raiseParseError(tokens, "Cannot take a property of a non-symbol: " + urRoot.type);
            }
            var attribute = urRoot.type === "attributeRef";
            var style = urRoot.type === "styleRef" || urRoot.type === "computedStyleRef";
            if (attribute || style) {
                var attributeElt = urRoot
            }
            var prop = urRoot.name;

            var propertyAccess = {
                type: "ofExpression",
                prop: urRoot.token,
                root: newRoot,
                attribute: attributeElt,
                expression: root,
                args: [newRoot],
                op: function (context, rootVal) {
                    if (attribute) {
                        return runtime.resolveAttribute(rootVal, prop);
                    } else if (style) {
                        if (urRoot.type === "computedStyleRef") {
                            return runtime.resolveComputedStyle(rootVal, prop);
                        } else {
                            return runtime.resolveStyle(rootVal, prop);
                        }
                    } else {
                        return runtime.resolveProperty(rootVal, prop);
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };

            if (urRoot.type === "attributeRef") {
                propertyAccess.attribute = urRoot;
            }
            if (childOfUrRoot) {
                childOfUrRoot.root = propertyAccess;
                childOfUrRoot.args = [propertyAccess];
            } else {
                root = propertyAccess;
            }

            return parser.parseElement("indirectExpression", tokens, root);
        });

        parser.addIndirectExpression("possessive", function (parser, runtime, tokens, root) {
            if (parser.possessivesDisabled) {
                return;
            }
            var apostrophe = tokens.matchOpToken("'");
            if (
                apostrophe ||
                (root.type === "symbol" &&
                    (root.name === "my" || root.name === "its" || root.name === "your") &&
                    (tokens.currentToken().type === "IDENTIFIER" || tokens.currentToken().type === "ATTRIBUTE_REF" || tokens.currentToken().type === "STYLE_REF"))
            ) {
                if (apostrophe) {
                    tokens.requireToken("s");
                }

                var attribute, style, prop;
                attribute = parser.parseElement("attributeRef", tokens);
                if (attribute == null) {
                    style = parser.parseElement("styleRef", tokens);
                    if (style == null) {
                        prop = tokens.requireTokenType("IDENTIFIER");
                    }
                }
                var propertyAccess = {
                    type: "possessive",
                    root: root,
                    attribute: attribute || style,
                    prop: prop,
                    args: [root],
                    op: function (context, rootVal) {
                        if (attribute) {
                            // @ts-ignore
                            var value = runtime.resolveAttribute(rootVal, attribute.name);
                        } else if (style) {
                            var value
                            if (style.type === 'computedStyleRef') {
                                value = runtime.resolveComputedStyle(rootVal, style['name']);
                            } else {
                                value = runtime.resolveStyle(rootVal, style['name']);
                            }
                        } else {
                            var value = runtime.resolveProperty(rootVal, prop.value);
                        }
                        return value;
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
                return parser.parseElement("indirectExpression", tokens, propertyAccess);
            }
        });

        parser.addIndirectExpression("inExpression", function (parser, runtime, tokens, root) {
            if (!tokens.matchToken("in")) return;
            var target = parser.requireElement("unaryExpression", tokens);
            var propertyAccess = {
                type: "inExpression",
                root: root,
                args: [root, target],
                op: function (context, rootVal, target) {
                    var returnArr = [];
                    if (rootVal.css) {
                        runtime.implicitLoop(target, function (targetElt) {
                            var results = targetElt.querySelectorAll(rootVal.css);
                            for (var i = 0; i < results.length; i++) {
                                returnArr.push(results[i]);
                            }
                        });
                    } else if (rootVal instanceof Element) {
                        var within = false;
                        runtime.implicitLoop(target, function (targetElt) {
                            if (targetElt.contains(rootVal)) {
                                within = true;
                            }
                        });
                        if(within) {
                            return rootVal;
                        }
                    } else {
                        runtime.implicitLoop(rootVal, function (rootElt) {
                            runtime.implicitLoop(target, function (targetElt) {
                                if (rootElt === targetElt) {
                                    returnArr.push(rootElt);
                                }
                            });
                        });
                    }
                    return returnArr;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
            return parser.parseElement("indirectExpression", tokens, propertyAccess);
        });

        parser.addIndirectExpression("asExpression", function (parser, runtime, tokens, root) {
            if (!tokens.matchToken("as")) return;
            tokens.matchToken("a") || tokens.matchToken("an");
            var conversion = parser.requireElement("dotOrColonPath", tokens).evaluate(); // OK No promise
            var propertyAccess = {
                type: "asExpression",
                root: root,
                args: [root],
                op: function (context, rootVal) {
                    return runtime.convertValue(rootVal, conversion);
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
            return parser.parseElement("indirectExpression", tokens, propertyAccess);
        });

        parser.addIndirectExpression("functionCall", function (parser, runtime, tokens, root) {
            if (!tokens.matchOpToken("(")) return;
            var args = [];
            if (!tokens.matchOpToken(")")) {
                do {
                    args.push(parser.requireElement("expression", tokens));
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken(")");
            }

            if (root.root) {
                var functionCall = {
                    type: "functionCall",
                    root: root,
                    argExressions: args,
                    args: [root.root, args],
                    op: function (context, rootRoot, args) {
                        runtime.nullCheck(rootRoot, root.root);
                        var func = rootRoot[root.prop.value];
                        runtime.nullCheck(func, root);
                        if (func.hyperfunc) {
                            args.push(context);
                        }
                        return func.apply(rootRoot, args);
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                var functionCall = {
                    type: "functionCall",
                    root: root,
                    argExressions: args,
                    args: [root, args],
                    op: function (context, func, argVals) {
                        runtime.nullCheck(func, root);
                        if (func.hyperfunc) {
                            argVals.push(context);
                        }
                        var apply = func.apply(null, argVals);
                        return apply;
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            }
            return parser.parseElement("indirectExpression", tokens, functionCall);
        });

        parser.addIndirectExpression("attributeRefAccess", function (parser, runtime, tokens, root) {
            var attribute = parser.parseElement("attributeRef", tokens);
            if (!attribute) return;
            var attributeAccess = {
                type: "attributeRefAccess",
                root: root,
                attribute: attribute,
                args: [root],
                op: function (_ctx, rootVal) {
                    // @ts-ignore
                    var value = runtime.resolveAttribute(rootVal, attribute.name);
                    return value;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
            return attributeAccess;
        });

        parser.addIndirectExpression("arrayIndex", function (parser, runtime, tokens, root) {
            if (!tokens.matchOpToken("[")) return;
            var andBefore = false;
            var andAfter = false;
            var firstIndex = null;
            var secondIndex = null;

            if (tokens.matchOpToken("..")) {
                andBefore = true;
                firstIndex = parser.requireElement("expression", tokens);
            } else {
                firstIndex = parser.requireElement("expression", tokens);

                if (tokens.matchOpToken("..")) {
                    andAfter = true;
                    var current = tokens.currentToken();
                    if (current.type !== "R_BRACKET") {
                        secondIndex = parser.parseElement("expression", tokens);
                    }
                }
            }
            tokens.requireOpToken("]");

            var arrayIndex = {
                type: "arrayIndex",
                root: root,
                prop: firstIndex,
                firstIndex: firstIndex,
                secondIndex: secondIndex,
                args: [root, firstIndex, secondIndex],
                op: function (_ctx, root, firstIndex, secondIndex) {
                    if (root == null) {
                        return null;
                    }
                    if (andBefore) {
                        if (firstIndex < 0) {
                            firstIndex = root.length + firstIndex;
                        }
                        return root.slice(0, firstIndex + 1); // returns all items from beginning to firstIndex (inclusive)
                    } else if (andAfter) {
                        if (secondIndex != null) {
                            if (secondIndex < 0) {
                                secondIndex = root.length + secondIndex;
                            }
                            return root.slice(firstIndex, secondIndex + 1); // returns all items from firstIndex to secondIndex (inclusive)
                        } else {
                            return root.slice(firstIndex); // returns from firstIndex to end of array
                        }
                    } else {
                        return root[firstIndex];
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };

            return parser.parseElement("indirectExpression", tokens, arrayIndex);
        });

        // taken from https://drafts.csswg.org/css-values-4/#relative-length
        //        and https://drafts.csswg.org/css-values-4/#absolute-length
        //        (NB: we do not support `in` dues to conflicts w/ the hyperscript grammar)
        var STRING_POSTFIXES = [
            'em', 'ex', 'cap', 'ch', 'ic', 'rem', 'lh', 'rlh', 'vw', 'vh', 'vi', 'vb', 'vmin', 'vmax',
            'cm', 'mm', 'Q', 'pc', 'pt', 'px'
        ];
        parser.addGrammarElement("postfixExpression", function (parser, runtime, tokens) {
            var root = parser.parseElement("negativeNumber", tokens);

            let stringPosfix = tokens.matchAnyToken.apply(tokens, STRING_POSTFIXES) || tokens.matchOpToken("%");
            if (stringPosfix) {
                return {
                    type: "stringPostfix",
                    postfix: stringPosfix.value,
                    args: [root],
                    op: function (context, val) {
                        return "" + val + stringPosfix.value;
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            }

            var timeFactor = null;
            if (tokens.matchToken("s") || tokens.matchToken("seconds")) {
                timeFactor = 1000;
            } else if (tokens.matchToken("ms") || tokens.matchToken("milliseconds")) {
                timeFactor = 1;
            }
            if (timeFactor) {
                return {
                    type: "timeExpression",
                    time: root,
                    factor: timeFactor,
                    args: [root],
                    op: function (_context, val) {
                        return val * timeFactor;
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            }

            if (tokens.matchOpToken(":")) {
                var typeName = tokens.requireTokenType("IDENTIFIER");
                if (!typeName.value) return;
                var nullOk = !tokens.matchOpToken("!");
                return {
                    type: "typeCheck",
                    typeName: typeName,
                    nullOk: nullOk,
                    args: [root],
                    op: function (context, val) {
                        var passed = runtime.typeCheck(val, this.typeName.value, nullOk);
                        if (passed) {
                            return val;
                        } else {
                            throw new Error("Typecheck failed!  Expected: " + typeName.value);
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                return root;
            }
        });

        parser.addGrammarElement("logicalNot", function (parser, runtime, tokens) {
            if (!tokens.matchToken("not")) return;
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
                },
            };
        });

        parser.addGrammarElement("noExpression", function (parser, runtime, tokens) {
            if (!tokens.matchToken("no")) return;
            var root = parser.requireElement("unaryExpression", tokens);
            return {
                type: "noExpression",
                root: root,
                args: [root],
                op: function (_context, val) {
                    return runtime.isEmpty(val);
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addLeafExpression("some", function (parser, runtime, tokens) {
            if (!tokens.matchToken("some")) return;
            var root = parser.requireElement("expression", tokens);
            return {
                type: "noExpression",
                root: root,
                args: [root],
                op: function (_context, val) {
                    return !runtime.isEmpty(val);
                },
                evaluate(context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("negativeNumber", function (parser, runtime, tokens) {
            if (tokens.matchOpToken("-")) {
                var root = parser.requireElement("negativeNumber", tokens);
                return {
                    type: "negativeNumber",
                    root: root,
                    args: [root],
                    op: function (context, value) {
                        return -1 * value;
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            } else {
                return parser.requireElement("primaryExpression", tokens);
            }
        });

        parser.addGrammarElement("unaryExpression", function (parser, runtime, tokens) {
            tokens.matchToken("the"); // optional "the"
            return parser.parseAnyOf(
                ["beepExpression", "logicalNot", "relativePositionalExpression", "positionalExpression", "noExpression", "postfixExpression"],
                tokens
            );
        });

        parser.addGrammarElement("beepExpression", function (parser, runtime, tokens) {
            if (!tokens.matchToken("beep!")) return;
            var expression = parser.parseElement("unaryExpression", tokens);
            if (expression) {
                expression['booped'] = true;
                var originalEvaluate = expression.evaluate;
                expression.evaluate = function(ctx){
                    let value = originalEvaluate.apply(expression, arguments);
                    let element = ctx.me;
                    runtime.beepValueToConsole(element, expression, value);
                    return value;
                }
                return expression;
            }
        });

        var scanForwardQuery = function(start, root, match, wrap) {
            var results = root.querySelectorAll(match);
            for (var i = 0; i < results.length; i++) {
                var elt = results[i];
                if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
                    return elt;
                }
            }
            if (wrap) {
                return results[0];
            }
        }

        var scanBackwardsQuery = function(start, root, match, wrap) {
            var results = root.querySelectorAll(match);
            for (var i = results.length - 1; i >= 0; i--) {
                var elt = results[i];
                if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
                    return elt;
                }
            }
            if (wrap) {
                return results[results.length - 1];
            }
        }

        var scanForwardArray = function(start, array, match, wrap) {
            var matches = [];
            Runtime.prototype.forEach(array, function(elt){
                if (elt.matches(match) || elt === start) {
                    matches.push(elt);
                }
            })
            for (var i = 0; i < matches.length - 1; i++) {
                var elt = matches[i];
                if (elt === start) {
                    return matches[i + 1];
                }
            }
            if (wrap) {
                var first = matches[0];
                if (first && first.matches(match)) {
                    return first;
                }
            }
        }

        var scanBackwardsArray = function(start, array, match, wrap) {
            return scanForwardArray(start, Array.from(array).reverse(), match, wrap);
        }

        parser.addGrammarElement("relativePositionalExpression", function (parser, runtime, tokens) {
            var op = tokens.matchAnyToken("next", "previous");
            if (!op) return;
            var forwardSearch = op.value === "next";

            var thingElt = parser.parseElement("expression", tokens);

            if (tokens.matchToken("from")) {
                tokens.pushFollow("in");
                try {
                    var from = parser.requireElement("unaryExpression", tokens);
                } finally {
                    tokens.popFollow();
                }
            } else {
                var from = parser.requireElement("implicitMeTarget", tokens);
            }

            var inSearch = false;
            var withinElt;
            if (tokens.matchToken("in")) {
                inSearch = true;
                var inElt = parser.requireElement("unaryExpression", tokens);
            } else if (tokens.matchToken("within")) {
                withinElt = parser.requireElement("unaryExpression", tokens);
            } else {
                withinElt = document.body;
            }

            var wrapping = false;
            if (tokens.matchToken("with")) {
                tokens.requireToken("wrapping")
                wrapping = true;
            }

            return {
                type: "relativePositionalExpression",
                from: from,
                forwardSearch: forwardSearch,
                inSearch: inSearch,
                wrapping: wrapping,
                inElt: inElt,
                withinElt: withinElt,
                operator: op.value,
                args: [thingElt, from, inElt, withinElt],
                op: function (context, thing, from, inElt, withinElt) {

                    var css = thing.css;
                    if (css == null) {
                        throw "Expected a CSS value to be returned by " + Tokens.sourceFor.apply(thingElt);
                    }

                    if(inSearch) {
                        if (inElt) {
                            if (forwardSearch) {
                                return scanForwardArray(from, inElt, css, wrapping);
                            } else {
                                return scanBackwardsArray(from, inElt, css, wrapping);
                            }
                        }
                    } else {
                        if (withinElt) {
                            if (forwardSearch) {
                                return scanForwardQuery(from, withinElt, css, wrapping);
                            } else {
                                return scanBackwardsQuery(from, withinElt, css, wrapping);
                            }
                        }
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            }

        });

        parser.addGrammarElement("positionalExpression", function (parser, runtime, tokens) {
            var op = tokens.matchAnyToken("first", "last", "random");
            if (!op) return;
            tokens.matchAnyToken("in", "from", "of");
            var rhs = parser.requireElement("unaryExpression", tokens);
            const operator = op.value;
            return {
                type: "positionalExpression",
                rhs: rhs,
                operator: op.value,
                args: [rhs],
                op: function (context, rhsVal) {
                    if (rhsVal && !Array.isArray(rhsVal)) {
                        if (rhsVal.children) {
                            rhsVal = rhsVal.children;
                        } else {
                            rhsVal = Array.from(rhsVal);
                        }
                    }
                    if (rhsVal) {
                        if (operator === "first") {
                            return rhsVal[0];
                        } else if (operator === "last") {
                            return rhsVal[rhsVal.length - 1];
                        } else if (operator === "random") {
                            return rhsVal[Math.floor(Math.random() * rhsVal.length)];
                        }
                    }
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                },
            };
        });

        parser.addGrammarElement("mathOperator", function (parser, runtime, tokens) {
            var expr = parser.parseElement("unaryExpression", tokens);
            var mathOp,
                initialMathOp = null;
            mathOp = tokens.matchAnyOpToken("+", "-", "*", "/") || tokens.matchToken('mod');
            while (mathOp) {
                initialMathOp = initialMathOp || mathOp;
                var operator = mathOp.value;
                if (initialMathOp.value !== operator) {
                    parser.raiseParseError(tokens, "You must parenthesize math operations with different operators");
                }
                var rhs = parser.parseElement("unaryExpression", tokens);
                expr = {
                    type: "mathOperator",
                    lhs: expr,
                    rhs: rhs,
                    operator: operator,
                    args: [expr, rhs],
                    op: function (context, lhsVal, rhsVal) {
                        if (operator === "+") {
                            return lhsVal + rhsVal;
                        } else if (operator === "-") {
                            return lhsVal - rhsVal;
                        } else if (operator === "*") {
                            return lhsVal * rhsVal;
                        } else if (operator === "/") {
                            return lhsVal / rhsVal;
                        } else if (operator === "mod") {
                            return lhsVal % rhsVal;
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
                mathOp = tokens.matchAnyOpToken("+", "-", "*", "/") || tokens.matchToken('mod');
            }
            return expr;
        });

        parser.addGrammarElement("mathExpression", function (parser, runtime, tokens) {
            return parser.parseAnyOf(["mathOperator", "unaryExpression"], tokens);
        });

        function sloppyContains(src, container, value){
            if (container['contains']) {
                return container.contains(value);
            } else if (container['includes']) {
                return container.includes(value);
            } else {
                throw Error("The value of " + src.sourceFor() + " does not have a contains or includes method on it");
            }
        }
        function sloppyMatches(src, target, toMatch){
            if (target['match']) {
                return !!target.match(toMatch);
            } else if (target['matches']) {
                return target.matches(toMatch);
            } else {
                throw Error("The value of " + src.sourceFor() + " does not have a match or matches method on it");
            }
        }

        parser.addGrammarElement("comparisonOperator", function (parser, runtime, tokens) {
            var expr = parser.parseElement("mathExpression", tokens);
            var comparisonToken = tokens.matchAnyOpToken("<", ">", "<=", ">=", "==", "===", "!=", "!==");
            var operator = comparisonToken ? comparisonToken.value : null;
            var hasRightValue = true; // By default, most comparisons require two values, but there are some exceptions.
            var typeCheck = false;

            if (operator == null) {
                if (tokens.matchToken("is") || tokens.matchToken("am")) {
                    if (tokens.matchToken("not")) {
                        if (tokens.matchToken("in")) {
                            operator = "not in";
                        } else if (tokens.matchToken("a") || tokens.matchToken("an")) {
                            operator = "not a";
                            typeCheck = true;
                        } else if (tokens.matchToken("empty")) {
                            operator = "not empty";
                            hasRightValue = false;
                        } else {
                            if (tokens.matchToken("really")) {
                                operator = "!==";
                            } else {
                                operator = "!=";
                            }
                            // consume additional optional syntax
                            if (tokens.matchToken("equal")) {
                                tokens.matchToken("to");
                            }
                        }
                    } else if (tokens.matchToken("in")) {
                        operator = "in";
                    } else if (tokens.matchToken("a") || tokens.matchToken("an")) {
                        operator = "a";
                        typeCheck = true;
                    } else if (tokens.matchToken("empty")) {
                        operator = "empty";
                        hasRightValue = false;
                    } else if (tokens.matchToken("less")) {
                        tokens.requireToken("than");
                        if (tokens.matchToken("or")) {
                            tokens.requireToken("equal");
                            tokens.requireToken("to");
                            operator = "<=";
                        } else {
                            operator = "<";
                        }
                    } else if (tokens.matchToken("greater")) {
                        tokens.requireToken("than");
                        if (tokens.matchToken("or")) {
                            tokens.requireToken("equal");
                            tokens.requireToken("to");
                            operator = ">=";
                        } else {
                            operator = ">";
                        }
                    } else {
                        if (tokens.matchToken("really")) {
                            operator = "===";
                        } else {
                            operator = "==";
                        }
                        if (tokens.matchToken("equal")) {
                            tokens.matchToken("to");
                        }
                    }
                } else if (tokens.matchToken("equals")) {
                    operator = "==";
                } else if (tokens.matchToken("really")) {
                    tokens.requireToken("equals")
                    operator = "===";
                } else if (tokens.matchToken("exist") || tokens.matchToken("exists")) {
                    operator = "exist";
                    hasRightValue = false;
                } else if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                    operator = "match";
                } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                    operator = "contain";
                } else if (tokens.matchToken("includes") || tokens.matchToken("include")) {
                    operator = "include";
                } else if (tokens.matchToken("do") || tokens.matchToken("does")) {
                    tokens.requireToken("not");
                    if (tokens.matchToken("matches") || tokens.matchToken("match")) {
                        operator = "not match";
                    } else if (tokens.matchToken("contains") || tokens.matchToken("contain")) {
                        operator = "not contain";
                    } else if (tokens.matchToken("exist") || tokens.matchToken("exist")) {
                        operator = "not exist";
                        hasRightValue = false;
                    } else if (tokens.matchToken("include")) {
                        operator = "not include";
                    } else {
                        parser.raiseParseError(tokens, "Expected matches or contains");
                    }
                }
            }

            if (operator) {
                // Do not allow chained comparisons, which is dumb
                var typeName, nullOk, rhs
                if (typeCheck) {
                    typeName = tokens.requireTokenType("IDENTIFIER");
                    nullOk = !tokens.matchOpToken("!");
                } else if (hasRightValue) {
                    rhs = parser.requireElement("mathExpression", tokens);
                    if (operator === "match" || operator === "not match") {
                        rhs = rhs.css ? rhs.css : rhs;
                    }
                }
                var lhs = expr;
                expr = {
                    type: "comparisonOperator",
                    operator: operator,
                    typeName: typeName,
                    nullOk: nullOk,
                    lhs: expr,
                    rhs: rhs,
                    args: [expr, rhs],
                    op: function (context, lhsVal, rhsVal) {
                        if (operator === "==") {
                            return lhsVal == rhsVal;
                        } else if (operator === "!=") {
                            return lhsVal != rhsVal;
                        }
                        if (operator === "===") {
                            return lhsVal === rhsVal;
                        } else if (operator === "!==") {
                            return lhsVal !== rhsVal;
                        }
                        if (operator === "match") {
                            return lhsVal != null && sloppyMatches(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "not match") {
                            return lhsVal == null || !sloppyMatches(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "in") {
                            return rhsVal != null && sloppyContains(rhs, rhsVal, lhsVal);
                        }
                        if (operator === "not in") {
                            return rhsVal == null || !sloppyContains(rhs, rhsVal, lhsVal);
                        }
                        if (operator === "contain") {
                            return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "not contain") {
                            return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "include") {
                            return lhsVal != null && sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "not include") {
                            return lhsVal == null || !sloppyContains(lhs, lhsVal, rhsVal);
                        }
                        if (operator === "===") {
                            return lhsVal === rhsVal;
                        } else if (operator === "!==") {
                            return lhsVal !== rhsVal;
                        } else if (operator === "<") {
                            return lhsVal < rhsVal;
                        } else if (operator === ">") {
                            return lhsVal > rhsVal;
                        } else if (operator === "<=") {
                            return lhsVal <= rhsVal;
                        } else if (operator === ">=") {
                            return lhsVal >= rhsVal;
                        } else if (operator === "empty") {
                            return runtime.isEmpty(lhsVal);
                        } else if (operator === "not empty") {
                            return !runtime.isEmpty(lhsVal);
                        } else if (operator === "exist") {
                            return runtime.doesExist(lhsVal);
                        } else if (operator === "not exist") {
                            return !runtime.doesExist(lhsVal);
                        } else if (operator === "a") {
                            return runtime.typeCheck(lhsVal, typeName.value, nullOk);
                        } else if (operator === "not a") {
                            return !runtime.typeCheck(lhsVal, typeName.value, nullOk);
                        } else {
                            throw "Unknown comparison : " + operator;
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };
            }
            return expr;
        });

        parser.addGrammarElement("comparisonExpression", function (parser, runtime, tokens) {
            return parser.parseAnyOf(["comparisonOperator", "mathExpression"], tokens);
        });

        parser.addGrammarElement("logicalOperator", function (parser, runtime, tokens) {
            var expr = parser.parseElement("comparisonExpression", tokens);
            var logicalOp,
                initialLogicalOp = null;
            logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
            while (logicalOp) {
                initialLogicalOp = initialLogicalOp || logicalOp;
                if (initialLogicalOp.value !== logicalOp.value) {
                    parser.raiseParseError(tokens, "You must parenthesize logical operations with different operators");
                }
                var rhs = parser.requireElement("comparisonExpression", tokens);
                const operator = logicalOp.value;
                expr = {
                    type: "logicalOperator",
                    operator: operator,
                    lhs: expr,
                    rhs: rhs,
                    args: [expr, rhs],
                    op: function (context, lhsVal, rhsVal) {
                        if (operator === "and") {
                            return lhsVal && rhsVal;
                        } else {
                            return lhsVal || rhsVal;
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context, operator === "or");
                    },
                };
                logicalOp = tokens.matchToken("and") || tokens.matchToken("or");
            }
            return expr;
        });

        parser.addGrammarElement("logicalExpression", function (parser, runtime, tokens) {
            return parser.parseAnyOf(["logicalOperator", "mathExpression"], tokens);
        });

        parser.addGrammarElement("asyncExpression", function (parser, runtime, tokens) {
            if (tokens.matchToken("async")) {
                var value = parser.requireElement("logicalExpression", tokens);
                var expr = {
                    type: "asyncExpression",
                    value: value,
                    evaluate: function (context) {
                        return {
                            asyncWrapper: true,
                            value: this.value.evaluate(context), //OK
                        };
                    },
                };
                return expr;
            } else {
                return parser.parseElement("logicalExpression", tokens);
            }
        });

        parser.addGrammarElement("expression", function (parser, runtime, tokens) {
            tokens.matchToken("the"); // optional the
            return parser.parseElement("asyncExpression", tokens);
        });

        parser.addGrammarElement("assignableExpression", function (parser, runtime, tokens) {
            tokens.matchToken("the"); // optional the

            // TODO obviously we need to generalize this as a left hand side / targetable concept
            var expr = parser.parseElement("primaryExpression", tokens);
            if (expr && (
                expr.type === "symbol" ||
                expr.type === "ofExpression" ||
                expr.type === "propertyAccess" ||
                expr.type === "attributeRefAccess" ||
                expr.type === "attributeRef" ||
                expr.type === "styleRef" ||
                expr.type === "arrayIndex" ||
                expr.type === "possessive")
            ) {
                return expr;
            } else {
                parser.raiseParseError(
                    tokens,
                    "A target expression must be writable.  The expression type '" + (expr && expr.type) + "' is not."
                );
            }
            return expr;
        });

        parser.addGrammarElement("hyperscript", function (parser, runtime, tokens) {
            var features = [];

            if (tokens.hasMore()) {
                while (parser.featureStart(tokens.currentToken()) || tokens.currentToken().value === "(") {
                    var feature = parser.requireElement("feature", tokens);
                    features.push(feature);
                    tokens.matchToken("end"); // optional end
                }
            }
            return {
                type: "hyperscript",
                features: features,
                apply: function (target, source, args) {
                    // no op
                    for (const feature of features) {
                        feature.install(target, source, args);
                    }
                },
            };
        });

        var parseEventArgs = function (tokens) {
            var args = [];
            // handle argument list (look ahead 3)
            if (
                tokens.token(0).value === "(" &&
                (tokens.token(1).value === ")" || tokens.token(2).value === "," || tokens.token(2).value === ")")
            ) {
                tokens.matchOpToken("(");
                do {
                    args.push(tokens.requireTokenType("IDENTIFIER"));
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken(")");
            }
            return args;
        };

        parser.addFeature("on", function (parser, runtime, tokens) {
            if (!tokens.matchToken("on")) return;
            var every = false;
            if (tokens.matchToken("every")) {
                every = true;
            }
            var events = [];
            var displayName = null;
            do {
                var on = parser.requireElement("eventName", tokens, "Expected event name");

                var eventName = on.evaluate(); // OK No Promise

                if (displayName) {
                    displayName = displayName + " or " + eventName;
                } else {
                    displayName = "on " + eventName;
                }
                var args = parseEventArgs(tokens);

                var filter = null;
                if (tokens.matchOpToken("[")) {
                    filter = parser.requireElement("expression", tokens);
                    tokens.requireOpToken("]");
                }

                var startCount, endCount ,unbounded;
                if (tokens.currentToken().type === "NUMBER") {
                    var startCountToken = tokens.consumeToken();
                    if (!startCountToken.value) return;
                    startCount = parseInt(startCountToken.value);
                    if (tokens.matchToken("to")) {
                        var endCountToken = tokens.consumeToken();
                        if (!endCountToken.value) return;
                        endCount = parseInt(endCountToken.value);
                    } else if (tokens.matchToken("and")) {
                        unbounded = true;
                        tokens.requireToken("on");
                    }
                }

                var intersectionSpec, mutationSpec;
                if (eventName === "intersection") {
                    intersectionSpec = {};
                    if (tokens.matchToken("with")) {
                        intersectionSpec["with"] = parser.requireElement("expression", tokens).evaluate();
                    }
                    if (tokens.matchToken("having")) {
                        do {
                            if (tokens.matchToken("margin")) {
                                intersectionSpec["rootMargin"] = parser.requireElement("stringLike", tokens).evaluate();
                            } else if (tokens.matchToken("threshold")) {
                                intersectionSpec["threshold"] = parser.requireElement("expression", tokens).evaluate();
                            } else {
                                parser.raiseParseError(tokens, "Unknown intersection config specification");
                            }
                        } while (tokens.matchToken("and"));
                    }
                } else if (eventName === "mutation") {
                    mutationSpec = {};
                    if (tokens.matchToken("of")) {
                        do {
                            if (tokens.matchToken("anything")) {
                                mutationSpec["attributes"] = true;
                                mutationSpec["subtree"] = true;
                                mutationSpec["characterData"] = true;
                                mutationSpec["childList"] = true;
                            } else if (tokens.matchToken("childList")) {
                                mutationSpec["childList"] = true;
                            } else if (tokens.matchToken("attributes")) {
                                mutationSpec["attributes"] = true;
                                mutationSpec["attributeOldValue"] = true;
                            } else if (tokens.matchToken("subtree")) {
                                mutationSpec["subtree"] = true;
                            } else if (tokens.matchToken("characterData")) {
                                mutationSpec["characterData"] = true;
                                mutationSpec["characterDataOldValue"] = true;
                            } else if (tokens.currentToken().type === "ATTRIBUTE_REF") {
                                var attribute = tokens.consumeToken();
                                if (mutationSpec["attributeFilter"] == null) {
                                    mutationSpec["attributeFilter"] = [];
                                }
                                if (attribute.value.indexOf("@") == 0) {
                                    mutationSpec["attributeFilter"].push(attribute.value.substring(1));
                                } else {
                                    parser.raiseParseError(
                                        tokens,
                                        "Only shorthand attribute references are allowed here"
                                    );
                                }
                            } else {
                                parser.raiseParseError(tokens, "Unknown mutation config specification");
                            }
                        } while (tokens.matchToken("or"));
                    } else {
                        mutationSpec["attributes"] = true;
                        mutationSpec["characterData"] = true;
                        mutationSpec["childList"] = true;
                    }
                }

                var from = null;
                var elsewhere = false;
                if (tokens.matchToken("from")) {
                    if (tokens.matchToken("elsewhere")) {
                        elsewhere = true;
                    } else {
                        tokens.pushFollow("or");
                        try {
                            from = parser.requireElement("expression", tokens)
                        } finally {
                            tokens.popFollow();
                        }
                        if (!from) {
                            parser.raiseParseError(tokens, 'Expected either target value or "elsewhere".');
                        }
                    }
                }
                // support both "elsewhere" and "from elsewhere"
                if (from === null && elsewhere === false && tokens.matchToken("elsewhere")) {
                    elsewhere = true;
                }

                if (tokens.matchToken("in")) {
                    var inExpr = parser.parseElement('unaryExpression', tokens);
                }

                if (tokens.matchToken("debounced")) {
                    tokens.requireToken("at");
                    var timeExpr = parser.requireElement("unaryExpression", tokens);
                    // @ts-ignore
                    var debounceTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                } else if (tokens.matchToken("throttled")) {
                    tokens.requireToken("at");
                    var timeExpr = parser.requireElement("unaryExpression", tokens);
                    // @ts-ignore
                    var throttleTime = timeExpr.evaluate({}); // OK No promise TODO make a literal time expr
                }

                events.push({
                    execCount: 0,
                    every: every,
                    on: eventName,
                    args: args,
                    filter: filter,
                    from: from,
                    inExpr: inExpr,
                    elsewhere: elsewhere,
                    startCount: startCount,
                    endCount: endCount,
                    unbounded: unbounded,
                    debounceTime: debounceTime,
                    throttleTime: throttleTime,
                    mutationSpec: mutationSpec,
                    intersectionSpec: intersectionSpec,
                    debounced: undefined,
                    lastExec: undefined,
                });
            } while (tokens.matchToken("or"));

            var queueLast = true;
            if (!every) {
                if (tokens.matchToken("queue")) {
                    if (tokens.matchToken("all")) {
                        var queueAll = true;
                        var queueLast = false;
                    } else if (tokens.matchToken("first")) {
                        var queueFirst = true;
                    } else if (tokens.matchToken("none")) {
                        var queueNone = true;
                    } else {
                        tokens.requireToken("last");
                    }
                }
            }

            var start = parser.requireElement("commandList", tokens);
            parser.ensureTerminated(start);

            var errorSymbol, errorHandler;
            if (tokens.matchToken("catch")) {
                errorSymbol = tokens.requireTokenType("IDENTIFIER").value;
                errorHandler = parser.requireElement("commandList", tokens);
                parser.ensureTerminated(errorHandler);
            }

            if (tokens.matchToken("finally")) {
                var finallyHandler = parser.requireElement("commandList", tokens);
                parser.ensureTerminated(finallyHandler);
            }

            var onFeature = {
                displayName: displayName,
                events: events,
                start: start,
                every: every,
                execCount: 0,
                errorHandler: errorHandler,
                errorSymbol: errorSymbol,
                execute: function (/** @type {Context} */ ctx) {
                    let eventQueueInfo = runtime.getEventQueueFor(ctx.me, onFeature);
                    if (eventQueueInfo.executing && every === false) {
                        if (queueNone || (queueFirst && eventQueueInfo.queue.length > 0)) {
                            return;
                        }
                        if (queueLast) {
                            eventQueueInfo.queue.length = 0;
                        }
                        eventQueueInfo.queue.push(ctx);
                        return;
                    }
                    onFeature.execCount++;
                    eventQueueInfo.executing = true;
                    ctx.meta.onHalt = function () {
                        eventQueueInfo.executing = false;
                        var queued = eventQueueInfo.queue.shift();
                        if (queued) {
                            setTimeout(function () {
                                onFeature.execute(queued);
                            }, 1);
                        }
                    };
                    ctx.meta.reject = function (err) {
                        console.error(err.message ? err.message : err);
                        var hypertrace = runtime.getHyperTrace(ctx, err);
                        if (hypertrace) {
                            hypertrace.print();
                        }
                        runtime.triggerEvent(ctx.me, "exception", {
                            error: err,
                        });
                    };
                    start.execute(ctx);
                },
                install: function (elt, source) {
                    for (const eventSpec of onFeature.events) {
                        var targets;
                        if (eventSpec.elsewhere) {
                            targets = [document];
                        } else if (eventSpec.from) {
                            targets = eventSpec.from.evaluate(runtime.makeContext(elt, onFeature, elt, null));
                        } else {
                            targets = [elt];
                        }
                        runtime.implicitLoop(targets, function (target) {
                            // OK NO PROMISE

                            var eventName = eventSpec.on;
                            if (target == null) {
                                console.warn("'%s' feature ignored because target does not exists:", displayName, elt);
                                return;
                            }

                            if (eventSpec.mutationSpec) {
                                eventName = "hyperscript:mutation";
                                const observer = new MutationObserver(function (mutationList, observer) {
                                    if (!onFeature.executing) {
                                        runtime.triggerEvent(target, eventName, {
                                            mutationList: mutationList,
                                            observer: observer,
                                        });
                                    }
                                });
                                observer.observe(target, eventSpec.mutationSpec);
                            }

                            if (eventSpec.intersectionSpec) {
                                eventName = "hyperscript:intersection";
                                const observer = new IntersectionObserver(function (entries) {
                                    for (const entry of entries) {
                                        var detail = {
                                            observer: observer,
                                        };
                                        detail = Object.assign(detail, entry);
                                        detail["intersecting"] = entry.isIntersecting;
                                        runtime.triggerEvent(target, eventName, detail);
                                    }
                                }, eventSpec.intersectionSpec);
                                observer.observe(target);
                            }

                            var addEventListener = target.addEventListener || target.on;
                            addEventListener.call(target, eventName, function listener(evt) {
                                // OK NO PROMISE
                                if (typeof Node !== 'undefined' && elt instanceof Node && target !== elt && !elt.isConnected) {
                                    target.removeEventListener(eventName, listener);
                                    return;
                                }

                                var ctx = runtime.makeContext(elt, onFeature, elt, evt);
                                if (eventSpec.elsewhere && elt.contains(evt.target)) {
                                    return;
                                }
                                if (eventSpec.from) {
                                    ctx.result = target;
                                }

                                // establish context
                                for (const arg of eventSpec.args) {
                                    let eventValue = ctx.event[arg.value];
                                    if (eventValue !== undefined) {
                                        ctx.locals[arg.value] = eventValue;
                                    } else if ('detail' in ctx.event) {
                                        ctx.locals[arg.value] = ctx.event['detail'][arg.value];
                                    }
                                }

                                // install error handler if any
                                ctx.meta.errorHandler = errorHandler;
                                ctx.meta.errorSymbol = errorSymbol;
                                ctx.meta.finallyHandler = finallyHandler;

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
                                    while (true) {
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
                                        if (
                                            eventSpec.execCount < eventSpec.startCount ||
                                            eventSpec.execCount > eventSpec.endCount
                                        ) {
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
                                    if (
                                        eventSpec.lastExec &&
                                        Date.now() < (eventSpec.lastExec + eventSpec.throttleTime)
                                    ) {
                                        return;
                                    } else {
                                        eventSpec.lastExec = Date.now();
                                    }
                                }

                                // apply execute
                                onFeature.execute(ctx);
                            });
                        });
                    }
                },
            };
            parser.setParent(start, onFeature);
            return onFeature;
        });

        parser.addFeature("def", function (parser, runtime, tokens) {
            if (!tokens.matchToken("def")) return;
            var functionName = parser.requireElement("dotOrColonPath", tokens);
            var nameVal = functionName.evaluate(); // OK
            var nameSpace = nameVal.split(".");
            var funcName = nameSpace.pop();

            var args = [];
            if (tokens.matchOpToken("(")) {
                if (tokens.matchOpToken(")")) {
                    // empty args list
                } else {
                    do {
                        args.push(tokens.requireTokenType("IDENTIFIER"));
                    } while (tokens.matchOpToken(","));
                    tokens.requireOpToken(")");
                }
            }

            var start = parser.requireElement("commandList", tokens);

            var errorSymbol, errorHandler;
            if (tokens.matchToken("catch")) {
                errorSymbol = tokens.requireTokenType("IDENTIFIER").value;
                errorHandler = parser.parseElement("commandList", tokens);
            }

            if (tokens.matchToken("finally")) {
                var finallyHandler = parser.requireElement("commandList", tokens);
                parser.ensureTerminated(finallyHandler);
            }

            var functionFeature = {
                displayName:
                    funcName +
                    "(" +
                    args
                        .map(function (arg) {
                            return arg.value;
                        })
                        .join(", ") +
                    ")",
                name: funcName,
                args: args,
                start: start,
                errorHandler: errorHandler,
                errorSymbol: errorSymbol,
                finallyHandler: finallyHandler,
                install: function (target, source) {
                    var func = function () {
                        // null, worker
                        var ctx = runtime.makeContext(source, functionFeature, target, null);

                        // install error handler if any
                        ctx.meta.errorHandler = errorHandler;
                        ctx.meta.errorSymbol = errorSymbol;
                        ctx.meta.finallyHandler = finallyHandler;

                        for (var i = 0; i < args.length; i++) {
                            var name = args[i];
                            var argumentVal = arguments[i];
                            if (name) {
                                ctx.locals[name.value] = argumentVal;
                            }
                        }
                        ctx.meta.caller = arguments[args.length];
                        if (ctx.meta.caller) {
                            ctx.meta.callingCommand = ctx.meta.caller.meta.command;
                        }
                        var resolve,
                            reject = null;
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
                            return promise;
                        }
                    };
                    func.hyperfunc = true;
                    func.hypername = nameVal;
                    runtime.assignToNamespace(target, nameSpace, funcName, func);
                },
            };

            parser.ensureTerminated(start);

            // terminate error handler if any
            if (errorHandler) {
                parser.ensureTerminated(errorHandler);
            }

            parser.setParent(start, functionFeature);
            return functionFeature;
        });

        parser.addFeature("set", function (parser, runtime, tokens) {
            let setCmd = parser.parseElement("setCommand", tokens);
            if (setCmd) {
                if (setCmd.target.scope !== "element") {
                    parser.raiseParseError(tokens, "variables declared at the feature level must be element scoped.");
                }
                let setFeature = {
                    start: setCmd,
                    install: function (target, source) {
                        setCmd && setCmd.execute(runtime.makeContext(target, setFeature, target, null));
                    },
                };
                parser.ensureTerminated(setCmd);
                return setFeature;
            }
        });

        parser.addFeature("init", function (parser, runtime, tokens) {
            if (!tokens.matchToken("init")) return;

            var immediately = tokens.matchToken("immediately");

            var start = parser.requireElement("commandList", tokens);
            var initFeature = {
                start: start,
                install: function (target, source) {
                    let handler = function () {
                        start && start.execute(runtime.makeContext(target, initFeature, target, null));
                    };
                    if (immediately) {
                        handler();
                    } else {
                        setTimeout(handler, 0);
                    }
                },
            };

            // terminate body
            parser.ensureTerminated(start);
            parser.setParent(start, initFeature);
            return initFeature;
        });

        parser.addFeature("worker", function (parser, runtime, tokens) {
            if (tokens.matchToken("worker")) {
                parser.raiseParseError(
                    tokens,
                    "In order to use the 'worker' feature, include " +
                    "the _hyperscript worker plugin. See " +
                    "https://hyperscript.org/features/worker/ for " +
                    "more info."
                );
                return undefined
            }
        });

        parser.addFeature("behavior", function (parser, runtime, tokens) {
            if (!tokens.matchToken("behavior")) return;
            var path = parser.requireElement("dotOrColonPath", tokens).evaluate();
            var nameSpace = path.split(".");
            var name = nameSpace.pop();

            var formalParams = [];
            if (tokens.matchOpToken("(") && !tokens.matchOpToken(")")) {
                do {
                    formalParams.push(tokens.requireTokenType("IDENTIFIER").value);
                } while (tokens.matchOpToken(","));
                tokens.requireOpToken(")");
            }
            var hs = parser.requireElement("hyperscript", tokens);
            for (var i = 0; i < hs.features.length; i++) {
                var feature = hs.features[i];
                feature.behavior = path;
            }

            return {
                install: function (target, source) {
                    runtime.assignToNamespace(
                        globalScope.document && globalScope.document.body,
                        nameSpace,
                        name,
                        function (target, source, innerArgs) {
                            var internalData = runtime.getInternalData(target);
                            var elementScope = getOrInitObject(internalData, path + "Scope");
                            for (var i = 0; i < formalParams.length; i++) {
                                elementScope[formalParams[i]] = innerArgs[formalParams[i]];
                            }
                            hs.apply(target, source);
                        }
                    );
                },
            };
        });

        parser.addFeature("install", function (parser, runtime, tokens) {
            if (!tokens.matchToken("install")) return;
            var behaviorPath = parser.requireElement("dotOrColonPath", tokens).evaluate();
            var behaviorNamespace = behaviorPath.split(".");
            var args = parser.parseElement("namedArgumentList", tokens);

            var installFeature;
            return (installFeature = {
                install: function (target, source) {
                    runtime.unifiedEval(
                        {
                            args: [args],
                            op: function (ctx, args) {
                                var behavior = globalScope;
                                for (var i = 0; i < behaviorNamespace.length; i++) {
                                    behavior = behavior[behaviorNamespace[i]];
                                    if (typeof behavior !== "object" && typeof behavior !== "function")
                                        throw new Error("No such behavior defined as " + behaviorPath);
                                }

                                if (!(behavior instanceof Function))
                                    throw new Error(behaviorPath + " is not a behavior");

                                behavior(target, source, args);
                            },
                        },
                        runtime.makeContext(target, installFeature, target, null)
                    );
                },
            });
        });

        parser.addGrammarElement("jsBody", function (parser, runtime, tokens) {
            var jsSourceStart = tokens.currentToken().start;
            var jsLastToken = tokens.currentToken();

            var funcNames = [];
            var funcName = "";
            var expectFunctionDeclaration = false;
            while (tokens.hasMore()) {
                jsLastToken = tokens.consumeToken();
                var peek = tokens.token(0, true);
                if (peek.type === "IDENTIFIER" && peek.value === "end") {
                    break;
                }
                if (expectFunctionDeclaration) {
                    if (jsLastToken.type === "IDENTIFIER" || jsLastToken.type === "NUMBER") {
                        funcName += jsLastToken.value;
                    } else {
                        if (funcName !== "") funcNames.push(funcName);
                        funcName = "";
                        expectFunctionDeclaration = false;
                    }
                } else if (jsLastToken.type === "IDENTIFIER" && jsLastToken.value === "function") {
                    expectFunctionDeclaration = true;
                }
            }
            var jsSourceEnd = jsLastToken.end + 1;

            return {
                type: "jsBody",
                exposedFunctionNames: funcNames,
                jsSource: tokens.source.substring(jsSourceStart, jsSourceEnd),
            };
        });

        parser.addFeature("js", function (parser, runtime, tokens) {
            if (!tokens.matchToken("js")) return;
            var jsBody = parser.requireElement("jsBody", tokens);

            var jsSource =
                jsBody.jsSource +
                "\nreturn { " +
                jsBody.exposedFunctionNames
                    .map(function (name) {
                        return name + ":" + name;
                    })
                    .join(",") +
                " } ";
            var func = new Function(jsSource);

            return {
                jsSource: jsSource,
                function: func,
                exposedFunctionNames: jsBody.exposedFunctionNames,
                install: function () {
                    Object.assign(globalScope, func());
                },
            };
        });

        parser.addCommand("js", function (parser, runtime, tokens) {
            if (!tokens.matchToken("js")) return;
            // Parse inputs
            var inputs = [];
            if (tokens.matchOpToken("(")) {
                if (tokens.matchOpToken(")")) {
                    // empty input list
                } else {
                    do {
                        var inp = tokens.requireTokenType("IDENTIFIER");
                        inputs.push(inp.value);
                    } while (tokens.matchOpToken(","));
                    tokens.requireOpToken(")");
                }
            }

            var jsBody = parser.requireElement("jsBody", tokens);
            tokens.matchToken("end");

            var func = varargConstructor(Function, inputs.concat([jsBody.jsSource]));

            var command = {
                jsSource: jsBody.jsSource,
                function: func,
                inputs: inputs,
                op: function (context) {
                    var args = [];
                    inputs.forEach(function (input) {
                        args.push(runtime.resolveSymbol(input, context, 'default'));
                    });
                    var result = func.apply(globalScope, args);
                    if (result && typeof result.then === "function") {
                        return new Promise(function (resolve) {
                            result.then(function (actualResult) {
                                context.result = actualResult;
                                resolve(runtime.findNext(this, context));
                            });
                        });
                    } else {
                        context.result = result;
                        return runtime.findNext(this, context);
                    }
                },
            };
            return command;
        });

        parser.addCommand("async", function (parser, runtime, tokens) {
            if (!tokens.matchToken("async")) return;
            if (tokens.matchToken("do")) {
                var body = parser.requireElement("commandList", tokens);

                // Append halt
                var end = body;
                while (end.next) end = end.next;
                end.next = runtime.HALT;

                tokens.requireToken("end");
            } else {
                var body = parser.requireElement("command", tokens);
            }
            var command = {
                body: body,
                op: function (context) {
                    setTimeout(function () {
                        body.execute(context);
                    });
                    return runtime.findNext(this, context);
                },
            };
            parser.setParent(body, command);
            return command;
        });

        parser.addCommand("tell", function (parser, runtime, tokens) {
            var startToken = tokens.currentToken();
            if (!tokens.matchToken("tell")) return;
            var value = parser.requireElement("expression", tokens);
            var body = parser.requireElement("commandList", tokens);
            if (tokens.hasMore() && !parser.featureStart(tokens.currentToken())) {
                tokens.requireToken("end");
            }
            var slot = "tell_" + startToken.start;
            var tellCmd = {
                value: value,
                body: body,
                args: [value],
                resolveNext: function (context) {
                    var iterator = context.meta.iterators[slot];
                    if (iterator.index < iterator.value.length) {
                        context.you = iterator.value[iterator.index++];
                        return body;
                    } else {
                        // restore original me
                        context.you = iterator.originalYou;
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
                        originalYou: context.you,
                        index: 0,
                        value: value,
                    };
                    return this.resolveNext(context);
                },
            };
            parser.setParent(body, tellCmd);
            return tellCmd;
        });

        parser.addCommand("wait", function (parser, runtime, tokens) {
            if (!tokens.matchToken("wait")) return;
            var command;

            // wait on event
            if (tokens.matchToken("for")) {
                tokens.matchToken("a"); // optional "a"
                var events = [];
                do {
                    var lookahead = tokens.token(0);
                    if (lookahead.type === 'NUMBER' || lookahead.type === 'L_PAREN') {
                        events.push({
                            time: parser.requireElement('expression', tokens).evaluate() // TODO: do we want to allow async here?
                        })
                    } else {
                        events.push({
                            name: parser.requireElement("dotOrColonPath", tokens, "Expected event name").evaluate(),
                            args: parseEventArgs(tokens),
                        });
                    }
                } while (tokens.matchToken("or"));

                if (tokens.matchToken("from")) {
                    var on = parser.requireElement("expression", tokens);
                }

                // wait on event
                command = {
                    event: events,
                    on: on,
                    args: [on],
                    op: function (context, on) {
                        var target = on ? on : context.me;
                        if (!(target instanceof EventTarget))
                            throw new Error("Not a valid event target: " + this.on.sourceFor());
                        return new Promise((resolve) => {
                            var resolved = false;
                            for (const eventInfo of events) {
                                var listener = (event) => {
                                    context.result = event;
                                    if (eventInfo.args) {
                                        for (const arg of eventInfo.args) {
                                            context.locals[arg.value] =
                                                event[arg.value] || (event.detail ? event.detail[arg.value] : null);
                                        }
                                    }
                                    if (!resolved) {
                                        resolved = true;
                                        resolve(runtime.findNext(this, context));
                                    }
                                };
                                if (eventInfo.name){
                                    target.addEventListener(eventInfo.name, listener, {once: true});
                                } else if (eventInfo.time != null) {
                                    setTimeout(listener, eventInfo.time, eventInfo.time)
                                }
                            }
                        });
                    },
                };
                return command;
            } else {
                var time;
                if (tokens.matchToken("a")) {
                    tokens.requireToken("tick");
                    time = 0;
                } else {
                    time = parser.requireElement("expression", tokens);
                }

                command = {
                    type: "waitCmd",
                    time: time,
                    args: [time],
                    op: function (context, timeValue) {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                resolve(runtime.findNext(this, context));
                            }, timeValue);
                        });
                    },
                    execute: function (context) {
                        return runtime.unifiedExec(this, context);
                    },
                };
                return command;
            }
        });

        // TODO  - colon path needs to eventually become part of ruby-style symbols
        parser.addGrammarElement("dotOrColonPath", function (parser, runtime, tokens) {
            var root = tokens.matchTokenType("IDENTIFIER");
            if (root) {
                var path = [root.value];

                var separator = tokens.matchOpToken(".") || tokens.matchOpToken(":");
                if (separator) {
                    do {
                        path.push(tokens.requireTokenType("IDENTIFIER", "NUMBER").value);
                    } while (tokens.matchOpToken(separator.value));
                }

                return {
                    type: "dotOrColonPath",
                    path: path,
                    evaluate: function () {
                        return path.join(separator ? separator.value : "");
                    },
                };
            }
        });


        parser.addGrammarElement("eventName", function (parser, runtime, tokens) {
            var token;
            if ((token = tokens.matchTokenType("STRING"))) {
                return {
                    evaluate: function() {
                        return token.value;
                    },
                };
            }

            return parser.parseElement("dotOrColonPath", tokens);
        });

        function parseSendCmd(cmdType, parser, runtime, tokens) {
            var eventName = parser.requireElement("eventName", tokens);

            var details = parser.parseElement("namedArgumentList", tokens);
            if ((cmdType === "send" && tokens.matchToken("to")) ||
                (cmdType === "trigger" && tokens.matchToken("on"))) {
                var toExpr = parser.requireElement("expression", tokens);
            } else {
                var toExpr = parser.requireElement("implicitMeTarget", tokens);
            }

            var sendCmd = {
                eventName: eventName,
                details: details,
                to: toExpr,
                args: [toExpr, eventName, details],
                op: function (context, to, eventName, details) {
                    runtime.nullCheck(to, toExpr);
                    runtime.implicitLoop(to, function (target) {
                        runtime.triggerEvent(target, eventName, details, context.me);
                    });
                    return runtime.findNext(sendCmd, context);
                },
            };
            return sendCmd;
        }

        parser.addCommand("trigger", function (parser, runtime, tokens) {
            if (tokens.matchToken("trigger")) {
                return parseSendCmd("trigger", parser, runtime, tokens);
            }
        });

        parser.addCommand("send", function (parser, runtime, tokens) {
            if (tokens.matchToken("send")) {
                return parseSendCmd("send", parser, runtime, tokens);
            }
        });

        var parseReturnFunction = function (parser, runtime, tokens, returnAValue) {
            if (returnAValue) {
                if (parser.commandBoundary(tokens.currentToken())) {
                    parser.raiseParseError(tokens, "'return' commands must return a value.  If you do not wish to return a value, use 'exit' instead.");
                } else {
                    var value = parser.requireElement("expression", tokens);
                }
            }

            var returnCmd = {
                value: value,
                args: [value],
                op: function (context, value) {
                    var resolve = context.meta.resolve;
                    context.meta.returned = true;
                    context.meta.returnValue = value;
                    if (resolve) {
                        if (value) {
                            resolve(value);
                        } else {
                            resolve();
                        }
                    }
                    return runtime.HALT;
                },
            };
            return returnCmd;
        };

        parser.addCommand("return", function (parser, runtime, tokens) {
            if (tokens.matchToken("return")) {
                return parseReturnFunction(parser, runtime, tokens, true);
            }
        });

        parser.addCommand("exit", function (parser, runtime, tokens) {
            if (tokens.matchToken("exit")) {
                return parseReturnFunction(parser, runtime, tokens, false);
            }
        });

        parser.addCommand("halt", function (parser, runtime, tokens) {
            if (tokens.matchToken("halt")) {
                if (tokens.matchToken("the")) {
                    tokens.requireToken("event");
                    // optional possessive
                    if (tokens.matchOpToken("'")) {
                        tokens.requireToken("s");
                    }
                    var keepExecuting = true;
                }
                if (tokens.matchToken("bubbling")) {
                    var bubbling = true;
                } else if (tokens.matchToken("default")) {
                    var haltDefault = true;
                }
                var exit = parseReturnFunction(parser, runtime, tokens, false);

                var haltCmd = {
                    keepExecuting: true,
                    bubbling: bubbling,
                    haltDefault: haltDefault,
                    exit: exit,
                    op: function (ctx) {
                        if (ctx.event) {
                            if (bubbling) {
                                ctx.event.stopPropagation();
                            } else if (haltDefault) {
                                ctx.event.preventDefault();
                            } else {
                                ctx.event.stopPropagation();
                                ctx.event.preventDefault();
                            }
                            if (keepExecuting) {
                                return runtime.findNext(this, ctx);
                            } else {
                                return exit;
                            }
                        }
                    },
                };
                return haltCmd;
            }
        });

        parser.addCommand("log", function (parser, runtime, tokens) {
            if (!tokens.matchToken("log")) return;
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
                },
            };
            return logCmd;
        });

        parser.addCommand("beep!", function (parser, runtime, tokens) {
            if (!tokens.matchToken("beep!")) return;
            var exprs = [parser.parseElement("expression", tokens)];
            while (tokens.matchOpToken(",")) {
                exprs.push(parser.requireElement("expression", tokens));
            }
            var beepCmd = {
                exprs: exprs,
                args: [exprs],
                op: function (ctx, values) {
                    for (let i = 0; i < exprs.length; i++) {
                        const expr = exprs[i];
                        const val = values[i];
                        runtime.beepValueToConsole(ctx.me, expr, val);
                    }
                    return runtime.findNext(this, ctx);
                },
            };
            return beepCmd;
        });

        parser.addCommand("throw", function (parser, runtime, tokens) {
            if (!tokens.matchToken("throw")) return;
            var expr = parser.requireElement("expression", tokens);
            var throwCmd = {
                expr: expr,
                args: [expr],
                op: function (ctx, expr) {
                    runtime.registerHyperTrace(ctx, expr);
                    throw expr;
                },
            };
            return throwCmd;
        });

        var parseCallOrGet = function (parser, runtime, tokens) {
            var expr = parser.requireElement("expression", tokens);
            var callCmd = {
                expr: expr,
                args: [expr],
                op: function (context, result) {
                    context.result = result;
                    return runtime.findNext(callCmd, context);
                },
            };
            return callCmd;
        };
        parser.addCommand("call", function (parser, runtime, tokens) {
            if (!tokens.matchToken("call")) return;
            var call = parseCallOrGet(parser, runtime, tokens);
            if (call.expr && call.expr.type !== "functionCall") {
                parser.raiseParseError(tokens, "Must be a function invocation");
            }
            return call;
        });
        parser.addCommand("get", function (parser, runtime, tokens) {
            if (tokens.matchToken("get")) {
                return parseCallOrGet(parser, runtime, tokens);
            }
        });

        parser.addCommand("make", function (parser, runtime, tokens) {
            if (!tokens.matchToken("make")) return;
            tokens.matchToken("a") || tokens.matchToken("an");

            var expr = parser.requireElement("expression", tokens);

            var args = [];
            if (expr.type !== "queryRef" && tokens.matchToken("from")) {
                do {
                    args.push(parser.requireElement("expression", tokens));
                } while (tokens.matchOpToken(","));
            }

            if (tokens.matchToken("called")) {
                var target = parser.requireElement("symbol", tokens);
            }

            var command;
            if (expr.type === "queryRef") {
                command = {
                    op: function (ctx) {
                        var match,
                            tagname = "div",
                            id,
                            classes = [];
                        var re = /(?:(^|#|\.)([^#\. ]+))/g;
                        while ((match = re.exec(expr.css))) {
                            if (match[1] === "") tagname = match[2].trim();
                            else if (match[1] === "#") id = match[2].trim();
                            else classes.push(match[2].trim());
                        }

                        var result = document.createElement(tagname);
                        if (id !== undefined) result.id = id;
                        for (var i = 0; i < classes.length; i++) {
                            var cls = classes[i];
                            result.classList.add(cls)
                        }

                        ctx.result = result;
                        if (target){
                            runtime.setSymbol(target.name, ctx, target.scope, result);
                        }

                        return runtime.findNext(this, ctx);
                    },
                };
                return command;
            } else {
                command = {
                    args: [expr, args],
                    op: function (ctx, expr, args) {
                        ctx.result = varargConstructor(expr, args);
                        if (target){
                            runtime.setSymbol(target.name, ctx, target.scope, ctx.result);
                        }

                        return runtime.findNext(this, ctx);
                    },
                };
                return command;
            }
        });

        parser.addGrammarElement("pseudoCommand", function (parser, runtime, tokens) {

            let lookAhead = tokens.token(1);
            if (!(lookAhead && lookAhead.op && (lookAhead.value === '.' || lookAhead.value === "("))) {
                return null;
            }

            var expr = parser.requireElement("primaryExpression", tokens);

            var rootRoot = expr.root;
            var root = expr;
            while (rootRoot.root != null) {
                root = root.root;
                rootRoot = rootRoot.root;
            }

            if (expr.type !== "functionCall") {
                parser.raiseParseError(tokens, "Pseudo-commands must be function calls");
            }

            if (root.type === "functionCall" && root.root.root == null) {
                if (tokens.matchAnyToken("the", "to", "on", "with", "into", "from", "at")) {
                    var realRoot = parser.requireElement("expression", tokens);
                } else if (tokens.matchToken("me")) {
                    var realRoot = parser.requireElement("implicitMeTarget", tokens);
                }
            }

            /** @type {ASTNode} */

            var pseudoCommand
            if(realRoot){
                pseudoCommand = {
                    type: "pseudoCommand",
                    root: realRoot,
                    argExressions: root.argExressions,
                    args: [realRoot, root.argExressions],
                    op: function (context, rootRoot, args) {
                        runtime.nullCheck(rootRoot, realRoot);
                        var func = rootRoot[root.root.name];
                        runtime.nullCheck(func, root);
                        if (func.hyperfunc) {
                            args.push(context);
                        }
                        context.result = func.apply(rootRoot, args);
                        return runtime.findNext(pseudoCommand, context);
                    },
                    execute: function (context) {
                        return runtime.unifiedExec(this, context);
                    },
                }
            } else {
                pseudoCommand = {
                    type: "pseudoCommand",
                    expr: expr,
                    args: [expr],
                    op: function (context, result) {
                        context.result = result;
                        return runtime.findNext(pseudoCommand, context);
                    },
                    execute: function (context) {
                        return runtime.unifiedExec(this, context);
                    },
                };
            }

            return pseudoCommand;
        });

        /**
         * @param {Parser} parser
         * @param {Runtime} runtime
         * @param {Tokens} tokens
         * @param {*} target
         * @param {*} value
         * @returns
         */
        var makeSetter = function (parser, runtime, tokens, target, value) {

            var symbolWrite = target.type === "symbol";
            var attributeWrite = target.type === "attributeRef";
            var styleWrite = target.type === "styleRef";
            var arrayWrite = target.type === "arrayIndex";

            if (!(attributeWrite || styleWrite || symbolWrite) && target.root == null) {
                parser.raiseParseError(tokens, "Can only put directly into symbols, not references");
            }

            var rootElt = null;
            var prop = null;
            if (symbolWrite) {
                // rootElt is null
            } else if (attributeWrite || styleWrite) {
                rootElt = parser.requireElement("implicitMeTarget", tokens);
                var attribute = target;
            } else if(arrayWrite) {
                prop = target.firstIndex;
                rootElt = target.root;
            } else {
                prop = target.prop ? target.prop.value : null;
                var attribute = target.attribute;
                rootElt = target.root;
            }

            /** @type {ASTNode} */
            var setCmd = {
                target: target,
                symbolWrite: symbolWrite,
                value: value,
                args: [rootElt, prop, value],
                op: function (context, root, prop, valueToSet) {
                    if (symbolWrite) {
                        runtime.setSymbol(target.name, context, target.scope, valueToSet);
                    } else {
                        runtime.nullCheck(root, rootElt);
                        if (arrayWrite) {
                            root[prop] = valueToSet;
                        } else {
                            runtime.implicitLoop(root, function (elt) {
                                if (attribute) {
                                    if (attribute.type === "attributeRef") {
                                        if (valueToSet == null) {
                                            elt.removeAttribute(attribute.name);
                                        } else {
                                            elt.setAttribute(attribute.name, valueToSet);
                                        }
                                    } else {
                                        elt.style[attribute.name] = valueToSet;
                                    }
                                } else {
                                    elt[prop] = valueToSet;
                                }
                            });
                        }
                    }
                    return runtime.findNext(this, context);
                },
            };
            return setCmd;
        };

        parser.addCommand("default", function (parser, runtime, tokens) {
            if (!tokens.matchToken("default")) return;
            var target = parser.requireElement("assignableExpression", tokens);
            tokens.requireToken("to");

            var value = parser.requireElement("expression", tokens);

            /** @type {ASTNode} */
            var setter = makeSetter(parser, runtime, tokens, target, value);
            var defaultCmd = {
                target: target,
                value: value,
                setter: setter,
                args: [target],
                op: function (context, target) {
                    if (target) {
                        return runtime.findNext(this, context);
                    } else {
                        return setter;
                    }
                },
            };
            setter.parent = defaultCmd;
            return defaultCmd;
        });

        parser.addCommand("set", function (parser, runtime, tokens) {
            if (!tokens.matchToken("set")) return;
            if (tokens.currentToken().type === "L_BRACE") {
                var obj = parser.requireElement("objectLiteral", tokens);
                tokens.requireToken("on");
                var target = parser.requireElement("expression", tokens);

                var command = {
                    objectLiteral: obj,
                    target: target,
                    args: [obj, target],
                    op: function (ctx, obj, target) {
                        Object.assign(target, obj);
                        return runtime.findNext(this, ctx);
                    },
                };
                return command;
            }

            try {
                tokens.pushFollow("to");
                var target = parser.requireElement("assignableExpression", tokens);
            } finally {
                tokens.popFollow();
            }
            tokens.requireToken("to");
            var value = parser.requireElement("expression", tokens);
            return makeSetter(parser, runtime, tokens, target, value);
        });

        parser.addCommand("if", function (parser, runtime, tokens) {
            if (!tokens.matchToken("if")) return;
            var expr = parser.requireElement("expression", tokens);
            tokens.matchToken("then"); // optional 'then'
            var trueBranch = parser.parseElement("commandList", tokens);
            var nestedIfStmt = false;
            let elseToken = tokens.matchToken("else") || tokens.matchToken("otherwise");
            if (elseToken) {
                let elseIfIfToken = tokens.peekToken("if");
                nestedIfStmt = elseIfIfToken != null && elseIfIfToken.line === elseToken.line;
                if (nestedIfStmt) {
                    var falseBranch = parser.parseElement("command", tokens);
                } else {
                    var falseBranch = parser.parseElement("commandList", tokens);
                }
            }
            if (tokens.hasMore() && !nestedIfStmt) {
                tokens.requireToken("end");
            }

            /** @type {ASTNode} */
            var ifCmd = {
                expr: expr,
                trueBranch: trueBranch,
                falseBranch: falseBranch,
                args: [expr],
                op: function (context, exprValue) {
                    if (exprValue) {
                        return trueBranch;
                    } else if (falseBranch) {
                        return falseBranch;
                    } else {
                        return runtime.findNext(this, context);
                    }
                },
            };
            parser.setParent(trueBranch, ifCmd);
            parser.setParent(falseBranch, ifCmd);
            return ifCmd;
        });

        var parseRepeatExpression = function (parser, tokens, runtime, startedWithForToken) {
            var innerStartToken = tokens.currentToken();
            var identifier;
            if (tokens.matchToken("for") || startedWithForToken) {
                var identifierToken = tokens.requireTokenType("IDENTIFIER");
                identifier = identifierToken.value;
                tokens.requireToken("in");
                var expression = parser.requireElement("expression", tokens);
            } else if (tokens.matchToken("in")) {
                identifier = "it";
                var expression = parser.requireElement("expression", tokens);
            } else if (tokens.matchToken("while")) {
                var whileExpr = parser.requireElement("expression", tokens);
            } else if (tokens.matchToken("until")) {
                var isUntil = true;
                if (tokens.matchToken("event")) {
                    var evt = parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                    if (tokens.matchToken("from")) {
                        var on = parser.requireElement("expression", tokens);
                    }
                } else {
                    var whileExpr = parser.requireElement("expression", tokens);
                }
            } else {
                if (!parser.commandBoundary(tokens.currentToken()) &&
                    tokens.currentToken().value !== 'forever') {
                    var times = parser.requireElement("expression", tokens);
                    tokens.requireToken("times");
                } else {
                    tokens.matchToken("forever"); // consume optional forever
                    var forever = true;
                }
            }

            if (tokens.matchToken("index")) {
                var identifierToken = tokens.requireTokenType("IDENTIFIER");
                var indexIdentifier = identifierToken.value;
            } else if (tokens.matchToken("indexed")) {
                tokens.requireToken("by");
                var identifierToken = tokens.requireTokenType("IDENTIFIER");
                var indexIdentifier = identifierToken.value;
            }

            var loop = parser.parseElement("commandList", tokens);
            if (loop && evt) {
                // if this is an event based loop, wait a tick at the end of the loop so that
                // events have a chance to trigger in the loop condition o_O)))
                var last = loop;
                while (last.next) {
                    last = last.next;
                }
                var waitATick = {
                    type: "waitATick",
                    op: function () {
                        return new Promise(function (resolve) {
                            setTimeout(function () {
                                resolve(runtime.findNext(waitATick));
                            }, 0);
                        });
                    },
                };
                last.next = waitATick;
            }
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
                args: [whileExpr, times],
                op: function (context, whileValue, times) {
                    var iteratorInfo = context.meta.iterators[slot];
                    var keepLooping = false;
                    var loopVal = null;
                    if (this.forever) {
                        keepLooping = true;
                    } else if (this.until) {
                        if (evt) {
                            keepLooping = context.meta.iterators[slot].eventFired === false;
                        } else {
                            keepLooping = whileValue !== true;
                        }
                    } else if (whileExpr) {
                        keepLooping = whileValue;
                    } else if (times) {
                        keepLooping = iteratorInfo.index < times;
                    } else {
                        var nextValFromIterator = iteratorInfo.iterator.next();
                        keepLooping = !nextValFromIterator.done;
                        loopVal = nextValFromIterator.value;
                    }

                    if (keepLooping) {
                        if (iteratorInfo.value) {
                            context.result = context.locals[identifier] = loopVal;
                        } else {
                            context.result = iteratorInfo.index;
                        }
                        if (indexIdentifier) {
                            context.locals[indexIdentifier] = iteratorInfo.index;
                        }
                        iteratorInfo.index++;
                        return loop;
                    } else {
                        context.meta.iterators[slot] = null;
                        return runtime.findNext(this.parent, context);
                    }
                },
            };
            parser.setParent(loop, repeatCmd);
            var repeatInit = {
                name: "repeatInit",
                args: [expression, evt, on],
                op: function (context, value, event, on) {
                    var iteratorInfo = {
                        index: 0,
                        value: value,
                        eventFired: false,
                    };
                    context.meta.iterators[slot] = iteratorInfo;
                    if (value && value[Symbol.iterator]) {
                        iteratorInfo.iterator = value[Symbol.iterator]();
                    }
                    if (evt) {
                        var target = on || context.me;
                        target.addEventListener(
                            event,
                            function (e) {
                                context.meta.iterators[slot].eventFired = true;
                            },
                            { once: true }
                        );
                    }
                    return repeatCmd; // continue to loop
                },
                execute: function (context) {
                    return runtime.unifiedExec(this, context);
                },
            };
            parser.setParent(repeatCmd, repeatInit);
            return repeatInit;
        };

        parser.addCommand("repeat", function (parser, runtime, tokens) {
            if (tokens.matchToken("repeat")) {
                return parseRepeatExpression(parser, tokens, runtime, false);
            }
        });

        parser.addCommand("for", function (parser, runtime, tokens) {
            if (tokens.matchToken("for")) {
                return parseRepeatExpression(parser, tokens, runtime, true);
            }
        });

        parser.addCommand("continue", function (parser, runtime, tokens) {

            if (!tokens.matchToken("continue")) return;

            var command = {
                op: function (context) {

                    // scan for the closest repeat statement
                    for (var parent = this.parent ; true ; parent = parent.parent) {

                        if (parent == undefined) {
                            parser.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.")
                        }
                        if (parent.loop != undefined) {
                            return parent.resolveNext(context)
                        }
                    }
                }
            };
            return command;
        });

        parser.addCommand("break", function (parser, runtime, tokens) {

            if (!tokens.matchToken("break")) return;

            var command = {
                op: function (context) {

                    // scan for the closest repeat statement
                    for (var parent = this.parent ; true ; parent = parent.parent) {

                        if (parent == undefined) {
                            parser.raiseParseError(tokens, "Command `continue` cannot be used outside of a `repeat` loop.")
                        }
                        if (parent.loop != undefined) {
                            return runtime.findNext(parent.parent, context);
                        }
                    }
                }
            };
            return command;
        });

        parser.addGrammarElement("stringLike", function (parser, runtime, tokens) {
            return parser.parseAnyOf(["string", "nakedString"], tokens);
        });

        parser.addCommand("append", function (parser, runtime, tokens) {
            if (!tokens.matchToken("append")) return;
            var targetExpr = null;

            var value = parser.requireElement("expression", tokens);

            /** @type {ASTNode} */
            var implicitResultSymbol = {
                type: "symbol",
                evaluate: function (context) {
                    return runtime.resolveSymbol("result", context);
                },
            };

            if (tokens.matchToken("to")) {
                targetExpr = parser.requireElement("expression", tokens);
            } else {
                targetExpr = implicitResultSymbol;
            }

            var setter = null;
            if (targetExpr.type === "symbol" || targetExpr.type === "attributeRef" || targetExpr.root != null) {
                setter = makeSetter(parser, runtime, tokens, targetExpr, implicitResultSymbol);
            }

            var command = {
                value: value,
                target: targetExpr,
                args: [targetExpr, value],
                op: function (context, target, value) {
                    if (Array.isArray(target)) {
                        target.push(value);
                        return runtime.findNext(this, context);
                    } else if (target instanceof Element) {
                        if (value instanceof Element) {
                            target.insertAdjacentElement("beforeend", value); // insert at end, preserving existing content
                        } else {
                            target.insertAdjacentHTML("beforeend", value); // insert at end, preserving existing content
                        }
                        runtime.processNode(target);                   // process parent so any new content i
                        return runtime.findNext(this, context);
                    } else if(setter) {
                        context.result = (target || "") + value;
                        return setter;
                    } else {
                        throw Error("Unable to append a value!")
                    }
                },
                execute: function (context) {
                    return runtime.unifiedExec(this, context/*, value, target*/);
                },
            };

            if (setter != null) {
                setter.parent = command;
            }

            return command;
        });

        function parsePickRange(parser, runtime, tokens) {
            tokens.matchToken("at") || tokens.matchToken("from");
            const rv = { includeStart: true, includeEnd: false }

            rv.from = tokens.matchToken("start") ? 0 : parser.requireElement("expression", tokens)

            if (tokens.matchToken("to") || tokens.matchOpToken("..")) {
                if (tokens.matchToken("end")) {
                    rv.toEnd = true;
                } else {
                    rv.to = parser.requireElement("expression", tokens);
                }
            }

            if (tokens.matchToken("inclusive")) rv.includeEnd = true;
            else if (tokens.matchToken("exclusive")) rv.includeStart = false;

            return rv;
        }

        class RegExpIterator {
            constructor(re, str) {
                this.re = re;
                this.str = str;
            }

            next() {
                const match = this.re.exec(this.str);
                if (match === null) return { done: true };
                else return { value: match };
            }
        }

        class RegExpIterable {
            constructor(re, flags, str) {
                this.re = re;
                this.flags = flags;
                this.str = str;
            }

            [Symbol.iterator]() {
                return new RegExpIterator(new RegExp(this.re, this.flags), this.str);
            }
        }

        parser.addCommand("pick", (parser, runtime, tokens) => {
            if (!tokens.matchToken("pick")) return;

            tokens.matchToken("the");

            if (tokens.matchToken("item") || tokens.matchToken("items")
                || tokens.matchToken("character") || tokens.matchToken("characters")) {
                const range = parsePickRange(parser, runtime, tokens);

                tokens.requireToken("from");
                const root = parser.requireElement("expression", tokens);

                return {
                    args: [root, range.from, range.to],
                    op(ctx, root, from, to) {
                        if (range.toEnd) to = root.length;
                        if (!range.includeStart) from++;
                        if (range.includeEnd) to++;
                        if (to == null || to == undefined) to = from + 1;
                        ctx.result = root.slice(from, to);
                        return runtime.findNext(this, ctx);
                    }
                }
            }

            if (tokens.matchToken("match")) {
                tokens.matchToken("of");
                const re = parser.parseElement("expression", tokens);
                let flags = ""
                if (tokens.matchOpToken("|")) {
                    flags = tokens.requireTokenType("IDENTIFIER").value;
                }

                tokens.requireToken("from");
                const root = parser.parseElement("expression", tokens);

                return {
                    args: [root, re],
                    op(ctx, root, re) {
                        ctx.result = new RegExp(re, flags).exec(root);
                        return runtime.findNext(this, ctx);
                    }
                }
            }

            if (tokens.matchToken("matches")) {
                tokens.matchToken("of");
                const re = parser.parseElement("expression", tokens);
                let flags = "gu"
                if (tokens.matchOpToken("|")) {
                    flags = 'g' + tokens.requireTokenType("IDENTIFIER").value.replace('g', '');
                }

                tokens.requireToken("from");
                const root = parser.parseElement("expression", tokens);

                return {
                    args: [root, re],
                    op(ctx, root, re) {
                        ctx.result = new RegExpIterable(re, flags, root);
                        return runtime.findNext(this, ctx);
                    }
                }
            }
        });

        parser.addCommand("increment", function (parser, runtime, tokens) {
            if (!tokens.matchToken("increment")) return;
            var amountExpr;

            // This is optional.  Defaults to "result"
            var target = parser.parseElement("assignableExpression", tokens);

            // This is optional. Defaults to 1.
            if (tokens.matchToken("by")) {
                amountExpr = parser.requireElement("expression", tokens);
            }

            var implicitIncrementOp = {
                type: "implicitIncrementOp",
                target: target,
                args: [target, amountExpr],
                op: function (context, targetValue, amount) {
                    targetValue = targetValue ? parseFloat(targetValue) : 0;
                    amount = amountExpr ? parseFloat(amount) : 1;
                    var newValue = targetValue + amount;
                    context.result = newValue;
                    return newValue;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                }
            };

            return makeSetter(parser, runtime, tokens, target, implicitIncrementOp);
        });

        parser.addCommand("decrement", function (parser, runtime, tokens) {
            if (!tokens.matchToken("decrement")) return;
            var amountExpr;

            // This is optional.  Defaults to "result"
            var target = parser.parseElement("assignableExpression", tokens);

            // This is optional. Defaults to 1.
            if (tokens.matchToken("by")) {
                amountExpr = parser.requireElement("expression", tokens);
            }

            var implicitDecrementOp = {
                type: "implicitDecrementOp",
                target: target,
                args: [target, amountExpr],
                op: function (context, targetValue, amount) {
                    targetValue = targetValue ? parseFloat(targetValue) : 0;
                    amount = amountExpr ? parseFloat(amount) : 1;
                    var newValue = targetValue - amount;
                    context.result = newValue;
                    return newValue;
                },
                evaluate: function (context) {
                    return runtime.unifiedEval(this, context);
                }
            };

            return makeSetter(parser, runtime, tokens, target, implicitDecrementOp);
        });

        function parseConversionInfo(tokens, parser) {
            var type = "text";
            var conversion;
            tokens.matchToken("a") || tokens.matchToken("an");
            if (tokens.matchToken("json") || tokens.matchToken("Object")) {
                type = "json";
            } else if (tokens.matchToken("response")) {
                type = "response";
            } else if (tokens.matchToken("html")) {
                type = "html";
            } else if (tokens.matchToken("text")) {
                // default, ignore
            } else {
                conversion = parser.requireElement("dotOrColonPath", tokens).evaluate();
            }
            return {type, conversion};
        }

        parser.addCommand("fetch", function (parser, runtime, tokens) {
            if (!tokens.matchToken("fetch")) return;
            var url = parser.requireElement("stringLike", tokens);

            if (tokens.matchToken("as")) {
                var conversionInfo = parseConversionInfo(tokens, parser);
            }

            if (tokens.matchToken("with") && tokens.currentToken().value !== "{") {
                var args = parser.parseElement("nakedNamedArgumentList", tokens);
            } else {
                var args = parser.parseElement("objectLiteral", tokens);
            }

            if (conversionInfo == null && tokens.matchToken("as")) {
                conversionInfo = parseConversionInfo(tokens, parser);
            }

            var type = conversionInfo ? conversionInfo.type : "text";
            var conversion = conversionInfo ? conversionInfo.conversion : null

            /** @type {ASTNode} */
            var fetchCmd = {
                url: url,
                argExpressions: args,
                args: [url, args],
                op: function (context, url, args) {
                    var detail = args || {};
                    detail["sender"] = context.me;
                    detail["headers"] = detail["headers"] || {}
                    var abortController = new AbortController();
                    let abortListener = context.me.addEventListener('fetch:abort', function(){
                        abortController.abort();
                    }, {once: true});
                    detail['signal'] = abortController.signal;
                    runtime.triggerEvent(context.me, "hyperscript:beforeFetch", detail);
                    runtime.triggerEvent(context.me, "fetch:beforeRequest", detail);
                    args = detail;
                    var finished = false;
                    if (args.timeout) {
                        setTimeout(function () {
                            if (!finished) {
                                abortController.abort();
                            }
                        }, args.timeout);
                    }
                    return fetch(url, args)
                        .then(function (resp) {
                            let resultDetails = {response:resp};
                            runtime.triggerEvent(context.me, "fetch:afterResponse", resultDetails);
                            resp = resultDetails.response;

                            if (type === "response") {
                                context.result = resp;
                                runtime.triggerEvent(context.me, "fetch:afterRequest", {result:resp});
                                finished = true;
                                return runtime.findNext(fetchCmd, context);
                            }
                            if (type === "json") {
                                return resp.json().then(function (result) {
                                    context.result = result;
                                    runtime.triggerEvent(context.me, "fetch:afterRequest", {result});
                                    finished = true;
                                    return runtime.findNext(fetchCmd, context);
                                });
                            }
                            return resp.text().then(function (result) {
                                if (conversion) result = runtime.convertValue(result, conversion);

                                if (type === "html") result = runtime.convertValue(result, "Fragment");

                                context.result = result;
                                runtime.triggerEvent(context.me, "fetch:afterRequest", {result});
                                finished = true;
                                return runtime.findNext(fetchCmd, context);
                            });
                        })
                        .catch(function (reason) {
                            runtime.triggerEvent(context.me, "fetch:error", {
                                reason: reason,
                            });
                            throw reason;
                        }).finally(function(){
                            context.me.removeEventListener('fetch:abort', abortListener);
                        });
                },
            };
            return fetchCmd;
        });
    }

    function hyperscriptWebGrammar(parser) {
        parser.addCommand("settle", function (parser, runtime, tokens) {
            if (tokens.matchToken("settle")) {
                if (!parser.commandBoundary(tokens.currentToken())) {
                    var onExpr = parser.requireElement("expression", tokens);
                } else {
                    var onExpr = parser.requireElement("implicitMeTarget", tokens);
                }

                var settleCommand = {
                    type: "settleCmd",
                    args: [onExpr],
                    op: function (context, on) {
                        runtime.nullCheck(on, onExpr);
                        var resolve = null;
                        var resolved = false;
                        var transitionStarted = false;

                        var promise = new Promise(function (r) {
                            resolve = r;
                        });

                        // listen for a transition begin
                        on.addEventListener(
                            "transitionstart",
                            function () {
                                transitionStarted = true;
                            },
                            { once: true }
                        );

                        // if no transition begins in 500ms, cancel
                        setTimeout(function () {
                            if (!transitionStarted && !resolved) {
                                resolve(runtime.findNext(settleCommand, context));
                            }
                        }, 500);

                        // continue on a transition emd
                        on.addEventListener(
                            "transitionend",
                            function () {
                                if (!resolved) {
                                    resolve(runtime.findNext(settleCommand, context));
                                }
                            },
                            { once: true }
                        );
                        return promise;
                    },
                    execute: function (context) {
                        return runtime.unifiedExec(this, context);
                    },
                };
                return settleCommand;
            }
        });

        parser.addCommand("add", function (parser, runtime, tokens) {
            if (tokens.matchToken("add")) {
                var classRef = parser.parseElement("classRef", tokens);
                var attributeRef = null;
                var cssDeclaration = null;
                if (classRef == null) {
                    attributeRef = parser.parseElement("attributeRef", tokens);
                    if (attributeRef == null) {
                        cssDeclaration = parser.parseElement("styleLiteral", tokens);
                        if (cssDeclaration == null) {
                            parser.raiseParseError(tokens, "Expected either a class reference or attribute expression");
                        }
                    }
                } else {
                    var classRefs = [classRef];
                    while ((classRef = parser.parseElement("classRef", tokens))) {
                        classRefs.push(classRef);
                    }
                }

                if (tokens.matchToken("to")) {
                    var toExpr = parser.requireElement("expression", tokens);
                } else {
                    var toExpr = parser.requireElement("implicitMeTarget", tokens);
                }

                if (tokens.matchToken("when")) {
                    if (cssDeclaration) {
                        parser.raiseParseError(tokens, "Only class and properties are supported with a when clause")
                    }
                    var when = parser.requireElement("expression", tokens);
                }

                if (classRefs) {
                    return {
                        classRefs: classRefs,
                        to: toExpr,
                        args: [toExpr, classRefs],
                        op: function (context, to, classRefs) {
                            runtime.nullCheck(to, toExpr);
                            runtime.forEach(classRefs, function (classRef) {
                                runtime.implicitLoop(to, function (target) {
                                    if (when) {
                                        context.result = target;
                                        let whenResult = runtime.evaluateNoPromise(when, context);
                                        if (whenResult) {
                                            if (target instanceof Element) target.classList.add(classRef.className);
                                        } else {
                                            if (target instanceof Element) target.classList.remove(classRef.className);
                                        }
                                        context.result = null;
                                    } else {
                                        if (target instanceof Element) target.classList.add(classRef.className);
                                    }
                                });
                            });
                            return runtime.findNext(this, context);
                        },
                    };
                } else if (attributeRef) {
                    return {
                        type: "addCmd",
                        attributeRef: attributeRef,
                        to: toExpr,
                        args: [toExpr],
                        op: function (context, to, attrRef) {
                            runtime.nullCheck(to, toExpr);
                            runtime.implicitLoop(to, function (target) {
                                if (when) {
                                    context.result = target;
                                    let whenResult = runtime.evaluateNoPromise(when, context);
                                    if (whenResult) {
                                        target.setAttribute(attributeRef.name, attributeRef.value);
                                    } else {
                                        target.removeAttribute(attributeRef.name);
                                    }
                                    context.result = null;
                                } else {
                                    target.setAttribute(attributeRef.name, attributeRef.value);
                                }
                            });
                            return runtime.findNext(this, context);
                        },
                        execute: function (ctx) {
                            return runtime.unifiedExec(this, ctx);
                        },
                    };
                } else {
                    return {
                        type: "addCmd",
                        cssDeclaration: cssDeclaration,
                        to: toExpr,
                        args: [toExpr, cssDeclaration],
                        op: function (context, to, css) {
                            runtime.nullCheck(to, toExpr);
                            runtime.implicitLoop(to, function (target) {
                                target.style.cssText += css;
                            });
                            return runtime.findNext(this, context);
                        },
                        execute: function (ctx) {
                            return runtime.unifiedExec(this, ctx);
                        },
                    };
                }
            }
        });

        parser.addGrammarElement("styleLiteral", function (parser, runtime, tokens) {
            if (!tokens.matchOpToken("{")) return;

            var stringParts = [""]
            var exprs = []

            while (tokens.hasMore()) {
                if (tokens.matchOpToken("\\")) {
                    tokens.consumeToken();
                } else if (tokens.matchOpToken("}")) {
                    break;
                } else if (tokens.matchToken("$")) {
                    var opencurly = tokens.matchOpToken("{");
                    var expr = parser.parseElement("expression", tokens);
                    if (opencurly) tokens.requireOpToken("}");

                    exprs.push(expr)
                    stringParts.push("")
                } else {
                    var tok = tokens.consumeToken();
                    stringParts[stringParts.length-1] += tokens.source.substring(tok.start, tok.end);
                }

                stringParts[stringParts.length-1] += tokens.lastWhitespace();
            }

            return {
                type: "styleLiteral",
                args: [exprs],
                op: function (ctx, exprs) {
                    var rv = "";

                    stringParts.forEach(function (part, idx) {
                        rv += part;
                        if (idx in exprs) rv += exprs[idx];
                    });

                    return rv;
                },
                evaluate: function(ctx) {
                    return runtime.unifiedEval(this, ctx);
                }
            }
        })

        parser.addCommand("remove", function (parser, runtime, tokens) {
            if (tokens.matchToken("remove")) {
                var classRef = parser.parseElement("classRef", tokens);
                var attributeRef = null;
                var elementExpr = null;
                if (classRef == null) {
                    attributeRef = parser.parseElement("attributeRef", tokens);
                    if (attributeRef == null) {
                        elementExpr = parser.parseElement("expression", tokens);
                        if (elementExpr == null) {
                            parser.raiseParseError(
                                tokens,
                                "Expected either a class reference, attribute expression or value expression"
                            );
                        }
                    }
                } else {
                    var classRefs = [classRef];
                    while ((classRef = parser.parseElement("classRef", tokens))) {
                        classRefs.push(classRef);
                    }
                }

                if (tokens.matchToken("from")) {
                    var fromExpr = parser.requireElement("expression", tokens);
                } else {
                    if (elementExpr == null) {
                        var fromExpr = parser.requireElement("implicitMeTarget", tokens);
                    }
                }

                if (elementExpr) {
                    return {
                        elementExpr: elementExpr,
                        from: fromExpr,
                        args: [elementExpr, fromExpr],
                        op: function (context, element, from) {
                            runtime.nullCheck(element, elementExpr);
                            runtime.implicitLoop(element, function (target) {
                                if (target.parentElement && (from == null || from.contains(target))) {
                                    target.parentElement.removeChild(target);
                                }
                            });
                            return runtime.findNext(this, context);
                        },
                    };
                } else {
                    return {
                        classRefs: classRefs,
                        attributeRef: attributeRef,
                        elementExpr: elementExpr,
                        from: fromExpr,
                        args: [classRefs, fromExpr],
                        op: function (context, classRefs, from) {
                            runtime.nullCheck(from, fromExpr);
                            if (classRefs) {
                                runtime.forEach(classRefs, function (classRef) {
                                    runtime.implicitLoop(from, function (target) {
                                        target.classList.remove(classRef.className);
                                    });
                                });
                            } else {
                                runtime.implicitLoop(from, function (target) {
                                    target.removeAttribute(attributeRef.name);
                                });
                            }
                            return runtime.findNext(this, context);
                        },
                    };
                }
            }
        });

        parser.addCommand("toggle", function (parser, runtime, tokens) {
            if (tokens.matchToken("toggle")) {
                tokens.matchAnyToken("the", "my");
                if (tokens.currentToken().type === "STYLE_REF") {
                    let styleRef = tokens.consumeToken();
                    var name = styleRef.value.substr(1);
                    var visibility = true;
                    var hideShowStrategy = resolveHideShowStrategy(parser, tokens, name);
                    if (tokens.matchToken("of")) {
                        tokens.pushFollow("with");
                        try {
                            var onExpr = parser.requireElement("expression", tokens);
                        } finally {
                            tokens.popFollow();
                        }
                    } else {
                        var onExpr = parser.requireElement("implicitMeTarget", tokens);
                    }
                } else if (tokens.matchToken("between")) {
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
                            parser.raiseParseError(tokens, "Expected either a class reference or attribute expression");
                        }
                    } else {
                        var classRefs = [classRef];
                        while ((classRef = parser.parseElement("classRef", tokens))) {
                            classRefs.push(classRef);
                        }
                    }
                }

                if (visibility !== true) {
                    if (tokens.matchToken("on")) {
                        var onExpr = parser.requireElement("expression", tokens);
                    } else {
                        var onExpr = parser.requireElement("implicitMeTarget", tokens);
                    }
                }

                if (tokens.matchToken("for")) {
                    var time = parser.requireElement("expression", tokens);
                } else if (tokens.matchToken("until")) {
                    var evt = parser.requireElement("dotOrColonPath", tokens, "Expected event name");
                    if (tokens.matchToken("from")) {
                        var from = parser.requireElement("expression", tokens);
                    }
                }

                var toggleCmd = {
                    classRef: classRef,
                    classRef2: classRef2,
                    classRefs: classRefs,
                    attributeRef: attributeRef,
                    on: onExpr,
                    time: time,
                    evt: evt,
                    from: from,
                    toggle: function (on, classRef, classRef2, classRefs) {
                        runtime.nullCheck(on, onExpr);
                        if (visibility) {
                            runtime.implicitLoop(on, function (target) {
                                hideShowStrategy("toggle", target);
                            });
                        } else if (between) {
                            runtime.implicitLoop(on, function (target) {
                                if (target.classList.contains(classRef.className)) {
                                    target.classList.remove(classRef.className);
                                    target.classList.add(classRef2.className);
                                } else {
                                    target.classList.add(classRef.className);
                                    target.classList.remove(classRef2.className);
                                }
                            });
                        } else if (classRefs) {
                            runtime.forEach(classRefs, function (classRef) {
                                runtime.implicitLoop(on, function (target) {
                                    target.classList.toggle(classRef.className);
                                });
                            });
                        } else {
                            runtime.implicitLoop(on, function (target) {
                                if (target.hasAttribute(attributeRef.name)) {
                                    target.removeAttribute(attributeRef.name);
                                } else {
                                    target.setAttribute(attributeRef.name, attributeRef.value);
                                }
                            });
                        }
                    },
                    args: [onExpr, time, evt, from, classRef, classRef2, classRefs],
                    op: function (context, on, time, evt, from, classRef, classRef2, classRefs) {
                        if (time) {
                            return new Promise(function (resolve) {
                                toggleCmd.toggle(on, classRef, classRef2, classRefs);
                                setTimeout(function () {
                                    toggleCmd.toggle(on, classRef, classRef2, classRefs);
                                    resolve(runtime.findNext(toggleCmd, context));
                                }, time);
                            });
                        } else if (evt) {
                            return new Promise(function (resolve) {
                                var target = from || context.me;
                                target.addEventListener(
                                    evt,
                                    function () {
                                        toggleCmd.toggle(on, classRef, classRef2, classRefs);
                                        resolve(runtime.findNext(toggleCmd, context));
                                    },
                                    { once: true }
                                );
                                toggleCmd.toggle(on, classRef, classRef2, classRefs);
                            });
                        } else {
                            this.toggle(on, classRef, classRef2, classRefs);
                            return runtime.findNext(toggleCmd, context);
                        }
                    },
                };
                return toggleCmd;
            }
        });

        var HIDE_SHOW_STRATEGIES = {
            display: function (op, element, arg) {
                if (arg) {
                    element.style.display = arg;
                } else if (op === "toggle") {
                    if (getComputedStyle(element).display === "none") {
                        HIDE_SHOW_STRATEGIES.display("show", element, arg);
                    } else {
                        HIDE_SHOW_STRATEGIES.display("hide", element, arg);
                    }
                } else if (op === "hide") {
                    const internalData = parser.runtime.getInternalData(element);
                    if (internalData.originalDisplay == null) {
                        internalData.originalDisplay = element.style.display;
                    }
                    element.style.display = "none";
                } else {
                    const internalData = parser.runtime.getInternalData(element);
                    if (internalData.originalDisplay && internalData.originalDisplay !== 'none') {
                        element.style.display = internalData.originalDisplay;
                    } else {
                        element.style.removeProperty('display');
                    }
                }
            },
            visibility: function (op, element, arg) {
                if (arg) {
                    element.style.visibility = arg;
                } else if (op === "toggle") {
                    if (getComputedStyle(element).visibility === "hidden") {
                        HIDE_SHOW_STRATEGIES.visibility("show", element, arg);
                    } else {
                        HIDE_SHOW_STRATEGIES.visibility("hide", element, arg);
                    }
                } else if (op === "hide") {
                    element.style.visibility = "hidden";
                } else {
                    element.style.visibility = "visible";
                }
            },
            opacity: function (op, element, arg) {
                if (arg) {
                    element.style.opacity = arg;
                } else if (op === "toggle") {
                    if (getComputedStyle(element).opacity === "0") {
                        HIDE_SHOW_STRATEGIES.opacity("show", element, arg);
                    } else {
                        HIDE_SHOW_STRATEGIES.opacity("hide", element, arg);
                    }
                } else if (op === "hide") {
                    element.style.opacity = "0";
                } else {
                    element.style.opacity = "1";
                }
            },
        };

        var parseShowHideTarget = function (parser, runtime, tokens) {
            var target;
            var currentTokenValue = tokens.currentToken();
            if (currentTokenValue.value === "when" || currentTokenValue.value === "with" || parser.commandBoundary(currentTokenValue)) {
                target = parser.parseElement("implicitMeTarget", tokens);
            } else {
                target = parser.parseElement("expression", tokens);
            }
            return target;
        };

        var resolveHideShowStrategy = function (parser, tokens, name) {
            var configDefault = config.defaultHideShowStrategy;
            var strategies = HIDE_SHOW_STRATEGIES;
            if (config.hideShowStrategies) {
                strategies = Object.assign(strategies, config.hideShowStrategies); // merge in user provided strategies
            }
            name = name || configDefault || "display";
            var value = strategies[name];
            if (value == null) {
                parser.raiseParseError(tokens, "Unknown show/hide strategy : " + name);
            }
            return value;
        };

        parser.addCommand("hide", function (parser, runtime, tokens) {
            if (tokens.matchToken("hide")) {
                var targetExpr = parseShowHideTarget(parser, runtime, tokens);

                var name = null;
                if (tokens.matchToken("with")) {
                    name = tokens.requireTokenType("IDENTIFIER", "STYLE_REF").value;
                    if (name.indexOf("*") === 0) {
                        name = name.substr(1);
                    }
                }
                var hideShowStrategy = resolveHideShowStrategy(parser, tokens, name);

                return {
                    target: targetExpr,
                    args: [targetExpr],
                    op: function (ctx, target) {
                        runtime.nullCheck(target, targetExpr);
                        runtime.implicitLoop(target, function (elt) {
                            hideShowStrategy("hide", elt);
                        });
                        return runtime.findNext(this, ctx);
                    },
                };
            }
        });

        parser.addCommand("show", function (parser, runtime, tokens) {
            if (tokens.matchToken("show")) {
                var targetExpr = parseShowHideTarget(parser, runtime, tokens);

                var name = null;
                if (tokens.matchToken("with")) {
                    name = tokens.requireTokenType("IDENTIFIER", "STYLE_REF").value;
                    if (name.indexOf("*") === 0) {
                        name = name.substr(1);
                    }
                }
                var arg = null;
                if (tokens.matchOpToken(":")) {
                    var tokenArr = tokens.consumeUntilWhitespace();
                    tokens.matchTokenType("WHITESPACE");
                    arg = tokenArr
                        .map(function (t) {
                            return t.value;
                        })
                        .join("");
                }

                if (tokens.matchToken("when")) {
                    var when = parser.requireElement("expression", tokens);
                }

                var hideShowStrategy = resolveHideShowStrategy(parser, tokens, name);

                return {
                    target: targetExpr,
                    when: when,
                    args: [targetExpr],
                    op: function (ctx, target) {
                        runtime.nullCheck(target, targetExpr);
                        runtime.implicitLoop(target, function (elt) {
                            if (when) {
                                ctx.result = elt;
                                let whenResult = runtime.evaluateNoPromise(when, ctx);
                                if (whenResult) {
                                    hideShowStrategy("show", elt, arg);
                                } else {
                                    hideShowStrategy("hide", elt);
                                }
                                ctx.result = null;
                            } else {
                                hideShowStrategy("show", elt, arg);
                            }
                        });
                        return runtime.findNext(this, ctx);
                    },
                };
            }
        });

        parser.addCommand("take", function (parser, runtime, tokens) {
            if (tokens.matchToken("take")) {
                let classRef = null;
                let classRefs = [];
                while ((classRef = parser.parseElement("classRef", tokens))) {
                    classRefs.push(classRef);
                }

                var attributeRef = null;
                var replacementValue = null;

                let weAreTakingClasses = classRefs.length > 0;
                if (!weAreTakingClasses) {
                    attributeRef = parser.parseElement("attributeRef", tokens);
                    if (attributeRef == null) {
                        parser.raiseParseError(tokens, "Expected either a class reference or attribute expression");
                    }

                    if (tokens.matchToken("with")) {
                        replacementValue = parser.requireElement("expression", tokens);
                    }
                }

                if (tokens.matchToken("from")) {
                    var fromExpr = parser.requireElement("expression", tokens);
                }

                if (tokens.matchToken("for")) {
                    var forExpr = parser.requireElement("expression", tokens);
                } else {
                    var forExpr = parser.requireElement("implicitMeTarget", tokens);
                }

                if (weAreTakingClasses) {
                    var takeCmd = {
                        classRefs: classRefs,
                        from: fromExpr,
                        forElt: forExpr,
                        args: [classRefs, fromExpr, forExpr],
                        op: function (context, classRefs, from, forElt) {
                            runtime.nullCheck(forElt, forExpr);
                            runtime.implicitLoop(classRefs, function(classRef){
                                var clazz = classRef.className;
                                if (from) {
                                    runtime.implicitLoop(from, function (target) {
                                        target.classList.remove(clazz);
                                    });
                                } else {
                                    runtime.implicitLoop(classRef, function (target) {
                                        target.classList.remove(clazz);
                                    });
                                }
                                runtime.implicitLoop(forElt, function (target) {
                                    target.classList.add(clazz);
                                });
                            })
                            return runtime.findNext(this, context);
                        },
                    };
                    return takeCmd;
                } else {
                    var takeCmd = {
                        attributeRef: attributeRef,
                        from: fromExpr,
                        forElt: forExpr,
                        args: [fromExpr, forExpr, replacementValue],
                        op: function (context, from, forElt, replacementValue) {
                            runtime.nullCheck(from, fromExpr);
                            runtime.nullCheck(forElt, forExpr);
                            runtime.implicitLoop(from, function (target) {
                                if (!replacementValue) {
                                    target.removeAttribute(attributeRef.name);
                                } else {
                                    target.setAttribute(attributeRef.name, replacementValue)
                                }
                            });
                            runtime.implicitLoop(forElt, function (target) {
                                target.setAttribute(attributeRef.name, attributeRef.value || "")
                            });
                            return runtime.findNext(this, context);
                        },
                    };
                    return takeCmd;
                }
            }
        });

        function putInto(runtime, context, prop, valueToPut) {
            if (prop != null) {
                var value = runtime.resolveSymbol(prop, context);
            } else {
                var value = context;
            }
            if (value instanceof Element || value instanceof HTMLDocument) {
                while (value.firstChild) value.removeChild(value.firstChild);
                value.append(parser.runtime.convertValue(valueToPut, "Fragment"));
                runtime.processNode(value);
            } else {
                if (prop != null) {
                    runtime.setSymbol(prop, context, null, valueToPut);
                } else {
                    throw "Don't know how to put a value into " + typeof context;
                }
            }
        }

        parser.addCommand("put", function (parser, runtime, tokens) {
            if (tokens.matchToken("put")) {
                var value = parser.requireElement("expression", tokens);

                var operationToken = tokens.matchAnyToken("into", "before", "after");

                if (operationToken == null && tokens.matchToken("at")) {
                    tokens.matchToken("the"); // optional "the"
                    operationToken = tokens.matchAnyToken("start", "end");
                    tokens.requireToken("of");
                }

                if (operationToken == null) {
                    parser.raiseParseError(tokens, "Expected one of 'into', 'before', 'at start of', 'at end of', 'after'");
                }
                var target = parser.requireElement("expression", tokens);

                var operation = operationToken.value;

                var arrayIndex = false;
                var symbolWrite = false;
                var rootExpr = null;
                var prop = null;

                if (target.type === "arrayIndex" && operation === "into") {
                    arrayIndex = true;
                    prop = target.prop;
                    rootExpr = target.root;
                }  else if (target.prop && target.root && operation === "into") {
                    prop = target.prop.value;
                    rootExpr = target.root;
                } else if (target.type === "symbol" && operation === "into") {
                    symbolWrite = true;
                    prop = target.name;
                } else if (target.type === "attributeRef" && operation === "into") {
                    var attributeWrite = true;
                    prop = target.name;
                    rootExpr = parser.requireElement("implicitMeTarget", tokens);
                } else if (target.type === "styleRef" && operation === "into") {
                    var styleWrite = true;
                    prop = target.name;
                    rootExpr = parser.requireElement("implicitMeTarget", tokens);
                } else if (target.attribute && operation === "into") {
                    var attributeWrite = target.attribute.type === "attributeRef";
                    var styleWrite = target.attribute.type === "styleRef";
                    prop = target.attribute.name;
                    rootExpr = target.root;
                } else {
                    rootExpr = target;
                }

                var putCmd = {
                    target: target,
                    operation: operation,
                    symbolWrite: symbolWrite,
                    value: value,
                    args: [rootExpr, prop, value],
                    op: function (context, root, prop, valueToPut) {
                        if (symbolWrite) {
                            putInto(runtime, context, prop, valueToPut);
                        } else {
                            runtime.nullCheck(root, rootExpr);
                            if (operation === "into") {
                                if (attributeWrite) {
                                    runtime.implicitLoop(root, function (elt) {
                                        elt.setAttribute(prop, valueToPut);
                                    });
                                } else if (styleWrite) {
                                    runtime.implicitLoop(root, function (elt) {
                                        elt.style[prop] = valueToPut;
                                    });
                                } else if (arrayIndex) {
                                    root[prop] = valueToPut;
                                } else {
                                    runtime.implicitLoop(root, function (elt) {
                                        putInto(runtime, elt, prop, valueToPut);
                                    });
                                }
                            } else {
                                var op =
                                    operation === "before"
                                        ? Element.prototype.before
                                        : operation === "after"
                                            ? Element.prototype.after
                                            : operation === "start"
                                                ? Element.prototype.prepend
                                                : operation === "end"
                                                    ? Element.prototype.append
                                                    : Element.prototype.append; // unreachable

                                runtime.implicitLoop(root, function (elt) {
                                    op.call(
                                        elt,
                                        valueToPut instanceof Node
                                            ? valueToPut
                                            : runtime.convertValue(valueToPut, "Fragment")
                                    );
                                    // process any new content
                                    if (elt.parentElement) {
                                        runtime.processNode(elt.parentElement);
                                    } else {
                                        runtime.processNode(elt);
                                    }
                                });
                            }
                        }
                        return runtime.findNext(this, context);
                    },
                };
                return putCmd;
            }
        });

        function parsePseudopossessiveTarget(parser, runtime, tokens) {
            var targets;
            if (
                tokens.matchToken("the") ||
                tokens.matchToken("element") ||
                tokens.matchToken("elements") ||
                tokens.currentToken().type === "CLASS_REF" ||
                tokens.currentToken().type === "ID_REF" ||
                (tokens.currentToken().op && tokens.currentToken().value === "<")
            ) {
                parser.possessivesDisabled = true;
                try {
                    targets = parser.parseElement("expression", tokens);
                } finally {
                    delete parser.possessivesDisabled;
                }
                // optional possessive
                if (tokens.matchOpToken("'")) {
                    tokens.requireToken("s");
                }
            } else if (tokens.currentToken().type === "IDENTIFIER" && tokens.currentToken().value === "its") {
                var identifier = tokens.matchToken("its");
                targets = {
                    type: "pseudopossessiveIts",
                    token: identifier,
                    name: identifier.value,
                    evaluate: function (context) {
                        return runtime.resolveSymbol("it", context);
                    },
                };
            } else {
                tokens.matchToken("my") || tokens.matchToken("me"); // consume optional 'my'
                targets = parser.parseElement("implicitMeTarget", tokens);
            }
            return targets;
        }

        parser.addCommand("transition", function (parser, runtime, tokens) {
            if (tokens.matchToken("transition")) {
                var targetsExpr = parsePseudopossessiveTarget(parser, runtime, tokens);

                var properties = [];
                var from = [];
                var to = [];
                var currentToken = tokens.currentToken();
                while (
                    !parser.commandBoundary(currentToken) &&
                    currentToken.value !== "over" &&
                    currentToken.value !== "using"
                    ) {
                    if (tokens.currentToken().type === "STYLE_REF") {
                        let styleRef = tokens.consumeToken();
                        let styleProp = styleRef.value.substr(1);
                        properties.push({
                            type: "styleRefValue",
                            evaluate: function () {
                                return styleProp;
                            },
                        });
                    } else {
                        properties.push(parser.requireElement("stringLike", tokens));
                    }

                    if (tokens.matchToken("from")) {
                        from.push(parser.requireElement("expression", tokens));
                    } else {
                        from.push(null);
                    }
                    tokens.requireToken("to");
                    if (tokens.matchToken("initial")) {
                        to.push({
                            type: "initial_literal",
                            evaluate : function(){
                                return "initial";
                            }
                        });
                    } else {
                        to.push(parser.requireElement("expression", tokens));
                    }
                    currentToken = tokens.currentToken();
                }
                if (tokens.matchToken("over")) {
                    var over = parser.requireElement("expression", tokens);
                } else if (tokens.matchToken("using")) {
                    var usingExpr = parser.requireElement("expression", tokens);
                }

                var transition = {
                    to: to,
                    args: [targetsExpr, properties, from, to, usingExpr, over],
                    op: function (context, targets, properties, from, to, using, over) {
                        runtime.nullCheck(targets, targetsExpr);
                        var promises = [];
                        runtime.implicitLoop(targets, function (target) {
                            var promise = new Promise(function (resolve, reject) {
                                var initialTransition = target.style.transition;
                                if (over) {
                                    target.style.transition = "all " + over + "ms ease-in";
                                } else if (using) {
                                    target.style.transition = using;
                                } else {
                                    target.style.transition = config.defaultTransition;
                                }
                                var internalData = runtime.getInternalData(target);
                                var computedStyles = getComputedStyle(target);

                                var initialStyles = {};
                                for (var i = 0; i < computedStyles.length; i++) {
                                    var name = computedStyles[i];
                                    var initialValue = computedStyles[name];
                                    initialStyles[name] = initialValue;
                                }

                                // store initial values
                                if (!internalData.initialStyles) {
                                    internalData.initialStyles = initialStyles;
                                }

                                for (var i = 0; i < properties.length; i++) {
                                    var property = properties[i];
                                    var fromVal = from[i];
                                    if (fromVal === "computed" || fromVal == null) {
                                        target.style[property] = initialStyles[property];
                                    } else {
                                        target.style[property] = fromVal;
                                    }
                                }
                                //console.log("transition started", transition);

                                var transitionStarted = false;
                                var resolved = false;

                                target.addEventListener(
                                    "transitionend",
                                    function () {
                                        if (!resolved) {
                                            //console.log("transition ended", transition);
                                            target.style.transition = initialTransition;
                                            resolved = true;
                                            resolve();
                                        }
                                    },
                                    { once: true }
                                );

                                target.addEventListener(
                                    "transitionstart",
                                    function () {
                                        transitionStarted = true;
                                    },
                                    { once: true }
                                );

                                // it no transition has started in 100ms, continue
                                setTimeout(function () {
                                    if (!resolved && !transitionStarted) {
                                        //console.log("transition ended", transition);
                                        target.style.transition = initialTransition;
                                        resolved = true;
                                        resolve();
                                    }
                                }, 100);

                                setTimeout(function () {
                                    var autoProps = [];
                                    for (var i = 0; i < properties.length; i++) {
                                        var property = properties[i];
                                        var toVal = to[i];
                                        if (toVal === "initial") {
                                            var propertyValue = internalData.initialStyles[property];
                                            target.style[property] = propertyValue;
                                        } else {
                                            target.style[property] = toVal;
                                        }
                                        //console.log("set", property, "to", target.style[property], "on", target, "value passed in : ", toVal);
                                    }
                                }, 0);
                            });
                            promises.push(promise);
                        });
                        return Promise.all(promises).then(function () {
                            return runtime.findNext(transition, context);
                        });
                    },
                };
                return transition;
            }
        });

        parser.addCommand("measure", function (parser, runtime, tokens) {
            if (!tokens.matchToken("measure")) return;

            var targetExpr = parsePseudopossessiveTarget(parser, runtime, tokens);

            var propsToMeasure = [];
            if (!parser.commandBoundary(tokens.currentToken()))
                do {
                    propsToMeasure.push(tokens.matchTokenType("IDENTIFIER").value);
                } while (tokens.matchOpToken(","));

            return {
                properties: propsToMeasure,
                args: [targetExpr],
                op: function (ctx, target) {
                    runtime.nullCheck(target, targetExpr);
                    if (0 in target) target = target[0]; // not measuring multiple elts
                    var rect = target.getBoundingClientRect();
                    var scroll = {
                        top: target.scrollTop,
                        left: target.scrollLeft,
                        topMax: target.scrollTopMax,
                        leftMax: target.scrollLeftMax,
                        height: target.scrollHeight,
                        width: target.scrollWidth,
                    };

                    ctx.result = {
                        x: rect.x,
                        y: rect.y,
                        left: rect.left,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height,
                        bounds: rect,

                        scrollLeft: scroll.left,
                        scrollTop: scroll.top,
                        scrollLeftMax: scroll.leftMax,
                        scrollTopMax: scroll.topMax,
                        scrollWidth: scroll.width,
                        scrollHeight: scroll.height,
                        scroll: scroll,
                    };

                    runtime.forEach(propsToMeasure, function (prop) {
                        if (prop in ctx.result) ctx.locals[prop] = ctx.result[prop];
                        else throw "No such measurement as " + prop;
                    });

                    return runtime.findNext(this, ctx);
                },
            };
        });

        parser.addLeafExpression("closestExpr", function (parser, runtime, tokens) {
            if (tokens.matchToken("closest")) {
                if (tokens.matchToken("parent")) {
                    var parentSearch = true;
                }

                var css = null;
                if (tokens.currentToken().type === "ATTRIBUTE_REF") {
                    var attributeRef = parser.requireElement("attributeRefAccess", tokens, null);
                    css = "[" + attributeRef.attribute.name + "]";
                }

                if (css == null) {
                    var expr = parser.requireElement("expression", tokens);
                    if (expr.css == null) {
                        parser.raiseParseError(tokens, "Expected a CSS expression");
                    } else {
                        css = expr.css;
                    }
                }

                if (tokens.matchToken("to")) {
                    var to = parser.parseElement("expression", tokens);
                } else {
                    var to = parser.parseElement("implicitMeTarget", tokens);
                }

                var closestExpr = {
                    type: "closestExpr",
                    parentSearch: parentSearch,
                    expr: expr,
                    css: css,
                    to: to,
                    args: [to],
                    op: function (ctx, to) {
                        if (to == null) {
                            return null;
                        } else {
                            let result = [];
                            runtime.implicitLoop(to, function(to){
                                if (parentSearch) {
                                    result.push(to.parentElement ? to.parentElement.closest(css) : null);
                                } else {
                                    result.push(to.closest(css));
                                }
                            })
                            if (runtime.shouldAutoIterate(to)) {
                                return result;
                            } else {
                                return result[0];
                            }
                        }
                    },
                    evaluate: function (context) {
                        return runtime.unifiedEval(this, context);
                    },
                };

                if (attributeRef) {
                    attributeRef.root = closestExpr;
                    attributeRef.args = [closestExpr];
                    return attributeRef;
                } else {
                    return closestExpr;
                }
            }
        });

        parser.addCommand("go", function (parser, runtime, tokens) {
            if (tokens.matchToken("go")) {
                if (tokens.matchToken("back")) {
                    var back = true;
                } else {
                    tokens.matchToken("to");
                    if (tokens.matchToken("url")) {
                        var target = parser.requireElement("stringLike", tokens);
                        var url = true;
                        if (tokens.matchToken("in")) {
                            tokens.requireToken("new");
                            tokens.requireToken("window");
                            var newWindow = true;
                        }
                    } else {
                        tokens.matchToken("the"); // optional the
                        var verticalPosition = tokens.matchAnyToken("top", "middle", "bottom");
                        var horizontalPosition = tokens.matchAnyToken("left", "center", "right");
                        if (verticalPosition || horizontalPosition) {
                            tokens.requireToken("of");
                        }
                        var target = parser.requireElement("unaryExpression", tokens);

                        var plusOrMinus = tokens.matchAnyOpToken("+", "-");
                        if (plusOrMinus) {
                            tokens.pushFollow("px");
                            try {
                                var offset = parser.requireElement("expression", tokens);
                            } finally {
                                tokens.popFollow();
                            }
                        }
                        tokens.matchToken("px"); // optional px

                        var smoothness = tokens.matchAnyToken("smoothly", "instantly");

                        var scrollOptions = {
                            block: "start",
                            inline: "nearest"
                        };

                        if (verticalPosition) {
                            if (verticalPosition.value === "top") {
                                scrollOptions.block = "start";
                            } else if (verticalPosition.value === "bottom") {
                                scrollOptions.block = "end";
                            } else if (verticalPosition.value === "middle") {
                                scrollOptions.block = "center";
                            }
                        }

                        if (horizontalPosition) {
                            if (horizontalPosition.value === "left") {
                                scrollOptions.inline = "start";
                            } else if (horizontalPosition.value === "center") {
                                scrollOptions.inline = "center";
                            } else if (horizontalPosition.value === "right") {
                                scrollOptions.inline = "end";
                            }
                        }

                        if (smoothness) {
                            if (smoothness.value === "smoothly") {
                                scrollOptions.behavior = "smooth";
                            } else if (smoothness.value === "instantly") {
                                scrollOptions.behavior = "instant";
                            }
                        }
                    }
                }

                var goCmd = {
                    target: target,
                    args: [target, offset],
                    op: function (ctx, to, offset) {
                        if (back) {
                            window.history.back();
                        } else if (url) {
                            if (to) {
                                if (newWindow) {
                                    window.open(to);
                                } else {
                                    window.location.href = to;
                                }
                            }
                        } else {
                            runtime.implicitLoop(to, function (target) {

                                if (target === window) {
                                    target = document.body;
                                }

                                if(plusOrMinus) {
                                    // a scroll w/ an offset of some sort
                                    let boundingRect = target.getBoundingClientRect();

                                    let scrollShim = document.createElement("div");

                                    let actualOffset = plusOrMinus.value === "+" ? offset : offset * -1;

                                    let offsetX = scrollOptions.inline == "start" || scrollOptions.inline == "end" ? actualOffset : 0;

                                    let offsetY = scrollOptions.block == "start" || scrollOptions.block == "end" ? actualOffset : 0;

                                    scrollShim.style.position = "absolute";
                                    scrollShim.style.top = (boundingRect.top + window.scrollY + offsetY) + "px";
                                    scrollShim.style.left = (boundingRect.left + window.scrollX + offsetX) + "px";
                                    scrollShim.style.height = boundingRect.height + "px";
                                    scrollShim.style.width = boundingRect.width + "px";
                                    scrollShim.style.zIndex = "" + Number.MIN_SAFE_INTEGER;
                                    scrollShim.style.opacity = "0";

                                    document.body.appendChild(scrollShim);
                                    setTimeout(function () {
                                        document.body.removeChild(scrollShim);
                                    }, 100);

                                    target = scrollShim;
                                }

                                target.scrollIntoView(scrollOptions);
                            });
                        }
                        return runtime.findNext(goCmd, ctx);
                    },
                };
                return goCmd;
            }
        });

        config.conversions.dynamicResolvers.push(function (str, node) {
            if (!(str === "Values" || str.indexOf("Values:") === 0)) {
                return;
            }
            var conversion = str.split(":")[1];
            /** @type Object<string,string | string[]> */
            var result = {};

            var implicitLoop = parser.runtime.implicitLoop.bind(parser.runtime);

            implicitLoop(node, function (/** @type HTMLInputElement */ node) {
                // Try to get a value directly from this node
                var input = getInputInfo(node);

                if (input !== undefined) {
                    result[input.name] = input.value;
                    return;
                }

                // Otherwise, try to query all child elements of this node that *should* contain values.
                if (node.querySelectorAll != undefined) {
                    /** @type {NodeListOf<HTMLInputElement>} */
                    var children = node.querySelectorAll("input,select,textarea");
                    children.forEach(appendValue);
                }
            });

            if (conversion) {
                if (conversion === "JSON") {
                    return JSON.stringify(result);
                } else if (conversion === "Form") {
                    /** @ts-ignore */
                    // TODO: does this work with multiple inputs of the same name?
                    return new URLSearchParams(result).toString();
                } else {
                    throw "Unknown conversion: " + conversion;
                }
            } else {
                return result;
            }

            /**
             * @param {HTMLInputElement} node
             */
            function appendValue(node) {
                var info = getInputInfo(node);

                if (info == undefined) {
                    return;
                }

                // If there is no value already stored in this space.
                if (result[info.name] == undefined) {
                    result[info.name] = info.value;
                    return;
                }

                if (Array.isArray(result[info.name]) && Array.isArray(info.value)) {
                    result[info.name] = [].concat(result[info.name], info.value);
                    return;
                }
            }

            /**
             * @param {HTMLInputElement} node
             * @returns {{name:string, value:string | string[]} | undefined}
             */
            function getInputInfo(node) {
                try {
                    /** @type {{name: string, value: string | string[]}}*/
                    var result = {
                        name: node.name,
                        value: node.value,
                    };

                    if (result.name == undefined || result.value == undefined) {
                        return undefined;
                    }

                    if (node.type == "radio" && node.checked == false) {
                        return undefined;
                    }

                    if (node.type == "checkbox") {
                        if (node.checked == false) {
                            result.value = undefined;
                        } else if (typeof result.value === "string") {
                            result.value = [result.value];
                        }
                    }

                    if (node.type == "select-multiple") {
                        /** @type {NodeListOf<HTMLSelectElement>} */
                        var selected = node.querySelectorAll("option[selected]");

                        result.value = [];
                        for (var index = 0; index < selected.length; index++) {
                            result.value.push(selected[index].value);
                        }
                    }
                    return result;
                } catch (e) {
                    return undefined;
                }
            }
        });

        config.conversions["HTML"] = function (value) {
            var toHTML = /** @returns {string}*/ function (/** @type any*/ value) {
                if (value instanceof Array) {
                    return value
                        .map(function (item) {
                            return toHTML(item);
                        })
                        .join("");
                }

                if (value instanceof HTMLElement) {
                    return value.outerHTML;
                }

                if (value instanceof NodeList) {
                    var result = "";
                    for (var i = 0; i < value.length; i++) {
                        var node = value[i];
                        if (node instanceof HTMLElement) {
                            result += node.outerHTML;
                        }
                    }
                    return result;
                }

                if (value.toString) {
                    return value.toString();
                }

                return "";
            };

            return toHTML(value);
        };

        config.conversions["Fragment"] = function (val) {
            var frag = document.createDocumentFragment();
            parser.runtime.implicitLoop(val, function (val) {
                if (val instanceof Node) frag.append(val);
                else {
                    var temp = document.createElement("template");
                    temp.innerHTML = val;
                    frag.append(temp.content);
                }
            });
            return frag;
        };
    }


    // Public API

    const runtime_ = new Runtime(), lexer_ = runtime_.lexer, parser_ = runtime_.parser

    /**
     *
     * @param {string} src
     * @param {Partial<Context>} [ctx]
     */
    function run(src, ctx) {
        return runtime_.evaluate(src, ctx)
    }

    function browserInit() {
        /** @type {HTMLScriptElement[]} */
        var scripts = Array.from(globalScope.document.querySelectorAll("script[type='text/hyperscript'][src]"))
        Promise.all(
            scripts.map(function (script) {
                return fetch(script.src)
                    .then(function (res) {
                        return res.text();
                    });
            })
        )
            .then(script_values => script_values.forEach(sc => _hyperscript(sc)))
            .then(() => ready(function () {
                mergeMetaConfig();
                runtime_.processNode(document.documentElement);

                document.dispatchEvent(new Event("hyperscript:ready"));

                globalScope.document.addEventListener("htmx:load", function (/** @type {CustomEvent} */ evt) {
                    runtime_.processNode(evt.detail.elt);
                });
            }));

        function ready(fn) {
            if (document.readyState !== "loading") {
                setTimeout(fn);
            } else {
                document.addEventListener("DOMContentLoaded", fn);
            }
        }

        function getMetaConfig() {
            /** @type {HTMLMetaElement} */
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
                Object.assign(config, metaConfig);
            }
        }
    }

    /**
     * @typedef {Object} HyperscriptAPI
     *
     * @property {Object} config
     * @property {string} config.attributes
     * @property {string} config.defaultTransition
     * @property {string} config.disableSelector
     * @property {typeof conversions} config.conversions
     *
     * @property {Object} internals
     * @property {Lexer} internals.lexer
     * @property {typeof Lexer} internals.Lexer
     * @property {Parser} internals.parser
     * @property {typeof Parser} internals.Parser
     * @property {Runtime} internals.runtime
     * @property {typeof Runtime} internals.Runtime
     *
     * @property {typeof ElementCollection} ElementCollection
     *
     * @property {(keyword: string, definition: ParseRule) => void} addFeature
     * @property {(keyword: string, definition: ParseRule) => void} addCommand
     * @property {(keyword: string, definition: ParseRule) => void} addLeafExpression
     * @property {(keyword: string, definition: ParseRule) => void} addIndirectExpression
     *
     * @property {(src: string, ctx?: Partial<Context>) => any} evaluate
     * @property {(src: string) => ASTNode} parse
     * @property {(node: Element) => void} processNode
     *
     * @property {() => void} browserInit
     *
     *
     * @typedef {HyperscriptAPI & ((src: string, ctx?: Partial<Context>) => any)} Hyperscript
     */

    /**
     * @type {Hyperscript}
     */
    const _hyperscript = Object.assign(
        run,
        {
            config,

            use(plugin) { plugin(_hyperscript) },

            internals: {
                lexer: lexer_, parser: parser_, runtime: runtime_,
                Lexer, Tokens, Parser, Runtime,
            },
            ElementCollection,

            addFeature:            parser_.addFeature.bind(parser_),
            addCommand:            parser_.addCommand.bind(parser_),
            addLeafExpression:     parser_.addLeafExpression.bind(parser_),
            addIndirectExpression: parser_.addIndirectExpression.bind(parser_),

            evaluate:    runtime_.evaluate.bind(runtime_),
            parse:       runtime_.parse.bind(runtime_),
            processNode: runtime_.processNode.bind(runtime_),
            version: "0.9.14",
            browserInit,
        }
    )

    return _hyperscript
})