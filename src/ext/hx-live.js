htmxLive = (()=>{

    class HtmxLive {
        #mutationObserver = new MutationObserver((records) => this.#onMutation(records));
        #dependencies = []
        #actionSelector = "[hx-live]"

        constructor() {
            this.#initInternals()
        }

        observe(elt, properties, prototype) {
            if (!elt.__htmxLiveObserved) {
                elt.__htmxLiveObserved = true
                for (const property of properties) {
                    let descriptor = Object.getOwnPropertyDescriptor(prototype, property);
                    Object.defineProperty(elt, property, {
                        get() {
                            return descriptor.get.call(this);
                        },
                        set(newValue) {
                            descriptor.set.call(this, newValue);
                            htmxLive.updated(this)
                        }
                    });
                }

            }
        }

        #process(elt) {
            if (elt.matches) {
                if (elt.matches(this.#actionSelector)) {
                    this.#init(elt)
                }
                if (elt.matches('input')) {
                    this.observeInput(elt);
                }
                if (elt.matches('select')) {
                    this.observeSelect(elt);
                }
            }
            if (elt.querySelectorAll) {
                elt.querySelectorAll(this.#actionSelector).forEach((elt) => this.#init(elt))
                elt.querySelectorAll('input').forEach((elt) => this.observeInput(elt))
                elt.querySelectorAll('select').forEach((elt) => this.observeSelect(elt))
            }
        }

        observeSelect(elt) {
            this.observe(elt, ['value', 'disabled'], HTMLSelectElement.prototype)
        }

        observeInput(elt) {
            this.observe(elt, ['value', 'checked', 'disabled'],  HTMLInputElement.prototype)
        }

        #init(elt) {
            if (!elt.__htmxLiveCode) {
                elt.__htmxLiveCode = true
                let liveCode = elt.getAttribute("hx-live");
                let tokenizer = new Tokenizer(liveCode);
                let parser = new Parser(tokenizer.tokenize());
                let features = parser.parseFeatures();
                for (const feature of features) {
                    feature.install(elt);
                }
            }
        }

        registerDependency(bindFeature) {
            this.#dependencies.push(bindFeature)
        }

        #onMutation(records) {

            for (let record of records) {
                if(record.addedNodes.length > 0) {
                    this.#process(document.documentElement)
                    break
                }
            }

            let toRefresh = []
            outer:
            for (const dependency of this.#dependencies) {
                for (let record of records) {
                    if (dependency.dependsOn(record.target)) {
                        toRefresh.push(dependency);
                        break outer;
                    }
                    for (const elt of record.addedNodes) {
                        if (dependency.dependsOn(elt)) {
                            toRefresh.push(dependency)
                            break outer;
                        }
                    }
                    for (const elt of record.removedNodes) {
                        if (dependency.dependsOn(elt)) {
                            toRefresh.push(dependency)
                            break outer;
                        }
                    }
                }
            }
            setTimeout(() => {
                for (const dependency of toRefresh) {
                    dependency.refresh()
                }
            })
        }

        updated(elt) {
            let toRefresh = []
            for (const dependency of this.#dependencies) {
                if (dependency.dependsOn(elt)) {
                    toRefresh.push(dependency)
                }
            }
            for (const dependency of toRefresh) {
                dependency.refresh()
            }
        }

        #initInternals() {
            document.addEventListener("DOMContentLoaded", () => {
                document.addEventListener("input", (evt) => {
                    this.updated(evt.target);
                })
                this.#mutationObserver.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                })
                this.#process(document.body)
            })
        }
    }

    let htmxLive = new HtmxLive();

    class Tokenizer {
        WHITESPACE = /\s/
        SYNTAX = /[.()<>[\]+\-*\/]/
        ALPHA = /[a-zA-Z]/
        NUMERIC = /[0-9]/

        constructor(src) {
            this.src = src
            this.offset = 0
            this.prev = ''
        }

        tokenize() {
            let tokens = []
            while (this.more()) {
                let token = this.nextToken()
                if(token) tokens.push(token)
            }
            return tokens
        }

        more() {
            return this.offset < this.src.length;
        }

        peek(off = 0) {
            return this.src[this.offset + off]
        }

        match(thing, char = this.peek()) {
            if (this.more()) {
                if(thing.test) {
                    return thing.test(char)
                } else {
                    return thing === char
                }
            }
        }

        consume() {
            this.prev = this.peek()
            this.offset++
            return this.prev
        }

        nextToken() {
            // consume whitespace
            if (this.match(this.WHITESPACE)) {
                return this.consumeWhitespace();
            } else if (!this.ALPHA.test(this.prev) &&
                this.match('.') &&
                this.match(this.ALPHA, this.peek(1))) {
                return this.consumeClass();
            } else if (this.match(this.SYNTAX)) {
                return this.consumeSyntax();
            } else if ("#" === this.peek()) {
                return this.consumeId();
            } else if (this.match(this.ALPHA)) {
                return this.consumeSymbol();
            } else if (this.match(this.NUMERIC)) {
                return this.consumeNumber();
            } else if (this.match('"') || this.match("'")) {
                return this.consumeString();
            } else {
                throw "Unknown token : " + this.peek()
            }
        }

        consumeSyntax() {
            return {type:'syntax', val: this.consume()}
        }

        consumeWhitespace() {
            while (this.match(this.WHITESPACE)) {
                this.consume();
            }
            return null
        }

        consumeId() {
            let token = this.consume()
            while (this.validCss(this.peek())) {
                token += this.consume();
            }
            return {type:"id", val:token}
        }

        consumeSymbol() {
            let token = this.consume()
            while (this.match(this.ALPHA)) {
                token += this.consume();
            }
            return {type:"sym", val:token}
        }

        consumeString() {
            let start = this.consume()
            let val = ""
            while (!this.match(start) && this.more()) {
                val += this.consume();
            }
            if(this.consume() !== start) throw "Unterminated string!";
            return {type:"str", val:val}
        }

        consumeNumber() {
            let token = this.consume()
            while (this.match(this.NUMERIC)) {
                token += this.consume();
            }
            if (this.match(".")) {
                token += this.consume();
                while (this.match(this.NUMERIC)) {
                    token += this.consume();
                }
                return {type:"num", val:Number.parseFloat(token)};
            } else {
                return {type:"num", val:Number.parseInt(token)};
            }
        }

        consumeClass() {
            let token = this.consume()
            while (this.validCss(this.peek())) {
                token += this.consume();
            }
            return {type:"class", val:token}
        }

        validCss(c) {
            return this.match(this.ALPHA, c) || this.match(this.NUMERIC, c) || c === "-" || c === "_" || c === ":";
        }
    }

    //========================================================================================
    // Live Features
    //========================================================================================
    class BindFeature {
        constructor(lhs, rhs) {
            this.lhs = lhs
            this.rhs = rhs
            this.cssDependences = []
            rhs.deps(this.cssDependences)
        }

        install(elt) {
            this.elt = elt
            htmxLive.registerDependency(this)
        }

        async refresh() {
            let runtime = {"this": this.elt}
            this.elt[this.lhs.property.val] = await this.rhs.eval(runtime)
        }

        dependsOn(elt) {
            for (const css of this.cssDependences) {
                if (elt.matches?.(css)) {
                    return true
                }
            }
            return false
        }
    }

    class OnFeature {
        constructor(event, commands) {
            this.event = event
            this.commands = commands
        }
        install(elt) {
            this.elt = elt
            elt.addEventListener(this.event.val, async (evt) => {
                let runtime = {}
                for (const command of this.commands) {
                    await command.execute(runtime)
                }
            })
        }
    }

    class Bindable {
        constructor(property) {
            this.property = property
        }
    }

    //========================================================================================
    // Commands
    //========================================================================================

    class CallCommand {
        constructor(functionCall) {
            this.call = functionCall
        }
        execute(runtime) {
            this.call.eval(runtime)
        }
    }

    //========================================================================================
    // Expressions
    //========================================================================================
    class AdditiveExpression {
        constructor(token, lhs, rhs) {
            this.token = token
            this.lhs = lhs
            this.rhs = rhs
        }

        async eval(runtime) {
            let result = await this.lhs.eval(runtime) + await this.rhs.eval(runtime);
            return result
        }

        deps(deps) {
            this.lhs.deps?.(deps);
            this.rhs.deps?.(deps);
        }
    }

    class StringLiteral {
        constructor(token) {
            this.token = token
        }

        async eval(runtime) {
            return this.token.val
        }
    }

    class IdLiteral {
        constructor(token) {
            this.token = token
        }

        async eval(runtime) {
            return htmx.find(this.token.val)
        }

        deps(deps) {
            deps.push(this.token.val);
        }
    }

    class Identifier {
        constructor(token) {
            this.token = token
        }

        async eval(runtime) {
            return runtime[this.token.val] || window[this.token.val]
        }
    }

    class PropertyAccess {
        constructor(root, property) {
            this.root = root
            this.property = property
        }

        async eval(runtime) {
            let root = await this.root.eval(runtime);
            return root[this.property.val]
        }

        deps(deps) {
            this.root?.deps(deps);
        }
    }

    class FunctionCall {
        constructor(root, args) {
            this.root = root
            this.rootRoot = root.root
            this.args = args
        }

        async eval(runtime) {
            let rootRoot = null;
            let func;
            if (this.rootRoot) {
                rootRoot = await this.rootRoot.eval(runtime);
                func = rootRoot[this.root.property.val].bind(rootRoot);
            } else {
                func = await this.root.eval(runtime)
            }
            let args = []
            for (const arg of this.args) {
                args.push(await arg.eval(runtime))
            }
            return func.call(rootRoot, args)
        }

        deps(deps) {
            this.root?.deps(deps);
        }
    }


    //========================================================================================
    // Parser
    //========================================================================================
    class Parser {
        constructor(tokens) {
            this.tokens = tokens
            this.current = 0
        }

        moreTokens() {
            return this.current < this.tokens.length
        }

        matchAndConsume(term, type = "sym") {
            if (this.match(term, type)) {
                return this.consumeToken()
            }
        }

        match(term, type) {
            return (this.currentToken().val === term || term === null) &&
                (this.currentToken().type === type || type === null);
        }

        require(term, type = "sym") {
            let match = this.matchAndConsume(term, type);
            if (!match) throw "Expected: " + (term ? term : type) + " found " + JSON.stringify(this.currentToken());
            return match
        }

        currentToken() {
            let token = this.tokens[this.current];
            return token || {type:null, val:null};
        }

        consumeToken() {
            this.lastToken = this.currentToken();
            this.current++
            return this.lastToken
        }

        //======================================================
        //  Entry Point
        //======================================================
        parseFeatures() {
            let features = []
            while (this.moreTokens()) {
                features.push(this.parseFeature())
            }
            return features
        }

        parseFeature() {
            let bind = this.parseBind();
            if(bind){
                return bind;
            }
            let on = this.parseOn();
            if(on){
                return on;
            }
            throw "Unknown token: " + JSON.stringify(this.currentToken());
        }

        parseBind() {
            if (this.matchAndConsume("bind")) {
                let lhs = this.parseBindable();
                this.require("to");
                let rhs = this.parseExpression();
                return new BindFeature(lhs, rhs)
            }
        }

        parseOn() {
            if (this.matchAndConsume("on")) {
                let event = this.require(null, "sym");
                let commands = this.parseCommands();
                return new OnFeature(event, commands)
            }
        }

        parseBindable() {
            let property = this.require(null, "sym");
            return new Bindable(property)
        }

        //======================================================
        //  Commands
        //======================================================

        parseCommands() {
            let commands = []
            while (this.moreTokens() && !this.endOfCommands()) {
                commands.push(this.parseCommand())
            }
            return commands
        }

        endOfCommands() {
            return this.matchAndConsume("end", "sym") ||
                this.match("on") ||
                this.match("bind");
        }

        parseCommand() {
            let call = this.callCommand()
            if(call) {
                return call
            }
            throw "Unknown token: " + JSON.stringify(this.currentToken());
        }

        callCommand() {
            if (this.matchAndConsume("call")) {
                let expression = this.parseExpression();
                if (expression instanceof FunctionCall) {
                    return new CallCommand(expression)
                }
            }
        }

        //======================================================
        //  Expressions
        //======================================================

        parseExpression() {
            return this.parseAdditiveExpression();
        }

        parseAdditiveExpression() {
            let lhs = this.parseIndirectExpression();
            while (this.matchAndConsume("+", "syntax") || this.matchAndConsume("+", "syntax")) {
                let rhs = this.parseIndirectExpression()
                lhs = new AdditiveExpression(this.lastToken, lhs, rhs)
            }
            return lhs;
        }

        parseIndirectExpression() {
            let root = this.parsePrimaryExpression();
            while (true) {
                if (this.matchAndConsume(".", "syntax")) {
                    let property = this.require(null, "sym");
                    root = new PropertyAccess(root, property)
                } else if (this.matchAndConsume("(", "syntax")) {
                    let args = []
                    if (!this.match(")")) {
                        do {
                            args.push(this.parseExpression());
                        } while (this.matchAndConsume(",", "syntax"))
                    }
                    this.require(")", "syntax")
                    root = new FunctionCall(root, args);
                } else {
                    break
                }
            }
            return root
        }

        parsePrimaryExpression() {
            if (this.currentToken()?.type === "str") {
                return new StringLiteral(this.consumeToken());
            }
            if (this.currentToken()?.type === "id") {
                return new IdLiteral(this.consumeToken());
            }
            if (this.currentToken()?.type === "sym") {
                return new Identifier(this.consumeToken());
            }
            if (this.matchAndConsume("(", "syntax")) {
                let expr = this.parseExpression();
                this.require(")", "syntax");
                return expr;
            }
            throw "Unknown token: " + JSON.stringify(this.currentToken());
        }

    }

    return htmxLive
})()