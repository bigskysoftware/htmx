//==========================================================
// hx-csp.js
//
// CSP enforcement extension for htmx.
//
// Provides three layers of Content Security Policy integration:
//
// 1. Nonce gating — gates htmx attribute processing behind CSP
//    nonces to prevent HTML injection attacks. Every htmx element
//    must carry an hx-nonce attribute matching the page nonce or
//    its htmx attributes are stripped. Fail closed if no page
//    nonce is found.
//    Nonce source: script[nonce].nonce property on page load.
//
// 2. Trusted Types — creates an 'htmx' TT policy (passthrough —
//    trust established by the nonce gate). Add trusted-types htmx
//    to your CSP to enforce that only htmx touches DOM sinks.
//    Fail closed if policy creation is blocked by CSP.
//
// 3. Safe eval — set config.safeEval:true to replace htmx's
//    Function/AsyncFunction with nonce-based script injection,
//    enabling hx-on:/hx-vals js:/hx-confirm js: without
//    unsafe-eval in your CSP.
//
// Usage:
//   <meta name="htmx-config" content='extensions:"hx-csp"'>
//   <meta name="htmx-config" content='extensions:"hx-csp",safeEval:true'>
//   <script src="hx-csp.js"></script>
//
//   Server stamps hx-nonce on every htmx element:
//   <button hx-post="/save" hx-nonce="<csp-nonce>">Save</button>
//==========================================================
(() => {

    let pageNonce = null;
    let ttPolicy = null;
    let internalApi = null;

    function getNonce(elt) {
        return internalApi?.attributeValue(elt, 'hx-nonce');
    }

    function checkNonce(elt) {
        if (!pageNonce) return false;
        let eltNonce = getNonce(elt);
        if (eltNonce !== pageNonce && stripHxAttributes(elt, eltNonce)) return false;
    }

    // Anchors to script-src/default-src to avoid matching nonces in other CSP directives
    function extractNonceFromCSP(csp) {
        return csp?.match(/(?:script-src|default-src)[^;]*'nonce-([^']+)'/i)?.[1] ?? null;
    }

    // Fallback: parse raw response HTML and extract nonce from meta CSP tag in <head>.
    // Only used for full-page responses with no CSP header.
    function extractNonceFromMetaTag(text) {
        let doc = Document.parseHTMLUnsafe(ttPolicy.createHTML(text));
        let meta = doc.head?.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return extractNonceFromCSP(meta?.content);
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Rewrites responseNonce → replacement in raw HTML before DOM parsing,
    // covering hx-nonce and script nonce attributes in one pass.
    // Pass replacement='' to strip nonce attributes entirely (stolen-nonce scrub).
    function rewriteNoncesInText(text, responseNonce, replacement = pageNonce) {
        let escaped = escapeRegex(responseNonce);
        return text.replace(
            new RegExp(`(nonce=)(["'])${escaped}\\2`, 'gi'),
            (_, attr, quote) => replacement ? `${attr}${quote}${replacement}${quote}` : ''
        );
    }

    // Strips all hx- attributes, fires htmx:security:strip, returns true if anything stripped.
    function stripHxAttributes(elt, eltNonce) {
        let stripped = [];
        for (let attr of [...elt.attributes]) {
            if (attr.name.startsWith('hx-') || (htmx.config.prefix && attr.name.startsWith(htmx.config.prefix))) {
                stripped.push(attr.name);
                elt.removeAttribute(attr.name);
            }
        }
        if (!stripped.length) return false;
        let tag = elt.tagName?.toLowerCase();
        let id = elt.id ? `#${elt.id}` : '';
        let reason = eltNonce == null ? 'missing-nonce' : 'nonce-mismatch';
        console.error(`htmx: [hx-csp] blocked <${tag}${id}> — ${eltNonce == null ? 'no hx-nonce attribute' : 'nonce mismatch (possible injection)'}`, { elt, reason });
        htmx.trigger(elt, 'htmx:security:strip', { reason, stripped });
        return true;
    }

    htmx.registerExtension('hx-csp', {

        init: (api) => {
            internalApi = api;

            // .nonce property stays readable after browsers blank the attribute
            // to prevent CSS exfiltration attacks.
            pageNonce = document.querySelector('script[nonce]')?.nonce || null;

            if (!pageNonce) {
                console.error('htmx: [hx-csp] no page nonce found — blocking all htmx. Add a nonce to your script tags.');
                return;
            }

            // Passthrough TT policy — trust established by nonce gate.
            // Fail closed if 'htmx' is not in the trusted-types CSP whitelist.
            try {
                ttPolicy = typeof trustedTypes !== 'undefined'
                    ? trustedTypes.createPolicy('htmx', { createHTML: s => s, createScript: s => s })
                    : { createHTML: s => s, createScript: s => s };
            } catch (e) {
                console.error("htmx: [hx-csp] TrustedTypes policy 'htmx' blocked — add 'htmx' to trusted-types CSP directive. Blocking all htmx.");
                pageNonce = null;
                return;
            }

            let syncFn, asyncFn;
            if (htmx.config.safeEval) {
                // Replaces htmx's new Function() eval with nonce-based script injection,
                // enabling hx-on:/hx-vals js:/hx-confirm js: without unsafe-eval in CSP.
                let counter = 0;
                function makeNoncedConstructor(isAsync) {
                    return function(...keys) {
                        let body = keys.pop();
                        return {
                            call: (thisArg, ...values) => {
                                if (getNonce(thisArg) !== pageNonce) {
                                    let tag = thisArg?.tagName?.toLowerCase();
                                    let id = thisArg?.id ? `#${thisArg.id}` : '';
                                    console.error(`htmx: [hx-csp] blocked eval on <${tag}${id}> — nonce mismatch`, { elt: thisArg });
                                    htmx.trigger(thisArg, 'htmx:security:violation', { reason: 'nonce-mismatch-at-eval' });
                                    return;
                                }
                                let fn = `__htmx_eval_${++counter}`;
                                let script = document.createElement('script');
                                script.nonce = pageNonce;
                                script.textContent = ttPolicy.createScript(`window.${fn} = ${isAsync ? 'async ' : ''}function(${keys.join(',')}) { ${body} }`);
                                document.head.appendChild(script);
                                script.remove();
                                let r = window[fn].call(thisArg, ...values);
                                delete window[fn];
                                return r;
                            }
                        };
                    };
                }
                syncFn = makeNoncedConstructor(false);
                asyncFn = makeNoncedConstructor(true);
            }

            api.initSecurity(ttPolicy, syncFn, asyncFn);
        },

        htmx_before_init: checkNonce,

        htmx_before_on_init: checkNonce,

        // Rewrites response nonces to pageNonce in raw HTML before fragment parsing.
        // Always scrubs stolen pageNonce. Only promotes response nonce for verified same-origin.
        htmx_after_request: (elt, detail) => {
            if (!pageNonce) return false;
            let ctx = detail.ctx;

            // Always scrub stolen pageNonce from any response — the server cannot know the
            // page nonce, so its presence indicates a stolen-nonce injection attempt.
            ctx.text = rewriteNoncesInText(ctx.text, pageNonce, '');

            // Only promote response nonce for verified same-origin responses
            let responseURL = ctx?.response?.raw?.url;
            if (!responseURL) return;  // can't verify origin — scrub only, no promotion
            try { if (new URL(responseURL).origin !== location.origin) return; }
            catch (_) { return; }

            let responseNonce = extractNonceFromCSP(ctx?.response?.headers?.get('Content-Security-Policy'))
                             ?? extractNonceFromMetaTag(ctx?.text);
            if (responseNonce && responseNonce !== pageNonce) {
                ctx.text = rewriteNoncesInText(ctx.text, responseNonce);
            }
        },

        // Blocks boosted form submissions where an unnonced submitter overrides formaction.
        // Also blocks js:/javascript: action URLs — entity encoding doesn't neutralise these
        // so they may survive template rendering and execute unexpectedly.
        htmx_config_request: (elt, detail) => {
            if (!pageNonce) return false;
            let action = detail.ctx?.request?.action;
            if (action && /^(js|javascript):/i.test(action)) {
                console.error(`htmx: [hx-csp] blocked js:/javascript: action URL on <${elt.tagName.toLowerCase()}${elt.id ? '#'+elt.id : ''}>`, { elt });
                htmx.trigger(elt, 'htmx:security:violation', { reason: 'javascript-url', action, ctx: detail.ctx });
                detail.cancelled = true;
                return false;
            }
            let submitter = detail.ctx?.sourceEvent?.submitter;
            if (!elt._htmx?.boosted || !submitter?.getAttribute('formaction')) return;
            if (getNonce(submitter) !== pageNonce) {
                let id = submitter?.id ? `#${submitter.id}` : '';
                console.error(`htmx: [hx-csp] blocked boosted form — unnonced submitter${id} overrode formaction`);
                htmx.trigger(elt, 'htmx:security:violation', { reason: 'unnonced-submitter', submitter, ctx: detail.ctx });
                detail.cancelled = true;
                return false;
            }
        }
    });

})();
