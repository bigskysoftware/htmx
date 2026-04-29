//==========================================================
// hx-nonce.js
//
// Security extension that gates htmx attribute processing
// behind CSP nonces, protecting against HTML injection
// attacks on sites that already use CSP script nonces.
//
// How it works:
//   - Reads the page-load nonce from the first script[nonce]
//     element (browsers expose this via .nonce property, not
//     the attribute, to prevent CSS exfiltration attacks).
//     config.nonce is intentionally NOT supported — the nonce
//     must come from an actual script tag to prevent JS-based
//     forgery before the extension initialises.
//   - Before each element is initialized, cancels init if the
//     element's hx-nonce doesn't match the page nonce — covers
//     hx-get/post/etc and hx-boost via htmx:before:init
//   - Before each hx-on: node is bound, cancels if hx-nonce
//     doesn't match — covers hx-on: via htmx:before:on:init
//   - Before each swap, reads the partial response's own CSP
//     nonce, validates fragment elements against it, then
//     rewrites valid ones to the page nonce so they survive
//     subsequent process() calls
//   - At request time, blocks boosted form submissions where
//     an unnnonced submitter overrode formAction
//
// Always-on: enforcement is unconditional once the extension
// is loaded. If no page nonce is detected, all htmx processing
// is blocked — a missing nonce means misconfiguration or active
// attack (e.g. nonce stripped by injected content). Fail closed.
//
// Safe eval: set config.safeEval:true to also replace
// htmx's eval with nonce-based script injection, enabling
// htmx JS features (hx-on:, hx-vals js:, hx-confirm js:,
// trigger filters) on pages with no unsafe-eval CSP.
// Requires pageNonce to be present — silently skipped if not.
//
// Usage:
//   <meta name="htmx-config" content='extensions:"hx-nonce"'>
//   <meta name="htmx-config" content='extensions:"hx-nonce",safeEval:true'>
//   <script src="hx-nonce.js"></script>
//
//   Server stamps hx-nonce on every hx- bearing element:
//   <button hx-post="/save" hx-nonce="<csp-nonce>">Save</button>
//==========================================================
(() => {

    let pageNonce = null;
    let internalApi = null;

    // Get nonce value from element using api.attributeValue for prefix support
    function getNonce(elt) {
        return internalApi?.attributeValue(elt, 'hx-nonce');
    }

    // Check nonce on element — strips and blocks if invalid, used by both init hooks
    function checkNonce(elt) {
        if (!pageNonce) return false;
        if (getNonce(elt) !== pageNonce) {
            stripHxAttributes(elt);
            return false;
        }
    }

    // Extract nonce value from a CSP header string.
    // Anchors to script-src or default-src to avoid matching nonces
    // in other directives (e.g. img-src) which would extract the wrong value.
    function extractNonceFromCSP(csp) {
        return csp?.match(/(?:script-src|default-src)[^;]*'nonce-([^']+)'/i)?.[1] ?? null;
    }

    // Escape a string for use in a RegExp
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Rewrite all occurrences of responseNonce to pageNonce in raw HTML text,
    // covering both hx-nonce="..." / hx-nonce='...' and script nonce="..." / nonce='...'.
    // Uses a backreference to ensure open/close quotes match.
    // Only rewrites exact nonce value matches — won't touch other attribute values.
    function rewriteNoncesInText(text, responseNonce) {
        let escaped = escapeRegex(responseNonce);
        return text.replace(
            new RegExp(`(nonce=)(["'])${escaped}\\2`, 'gi'),
            (_, attr, quote) => `${attr}${quote}${pageNonce}${quote}`
        );
    }

    // Strip all hx- attributes from an element and fire a
    // security event so the app can log/audit the violation.
    function stripHxAttributes(elt) {
        for (let attr of [...elt.attributes]) {
            if (attr.name.startsWith('hx-') || (htmx.config.prefix && attr.name.startsWith(htmx.config.prefix))) {
                elt.removeAttribute(attr.name);
            }
        }
        htmx.trigger(elt, 'htmx:security:strip', { reason: 'nonce-mismatch' });
    }

    htmx.registerExtension('hx-nonce', {

        init: (api) => {
            internalApi = api;
            // Read page nonce from first nonced script tag.
            // Must use .nonce property — browsers blank the nonce
            // attribute value to prevent CSS attribute selector
            // exfiltration attacks, but .nonce remains readable via JS.
            pageNonce = document.querySelector('script[nonce]')?.nonce || null;

            if (!pageNonce) {
                // No nonce found — fail closed. Loading hx-nonce signals
                // intent to enforce. A missing nonce is misconfiguration
                // or an active attack stripping the nonce from the page.
                // Block all htmx by returning false from every hook.
                console.error('hx-nonce: no page nonce found — blocking all htmx. Add a nonce to your script tags.');
                return;
            }

            // Safe eval: replace Function/AsyncFunction constructors with
            // nonce-based script injection so htmx JS features work without
            // unsafe-eval CSP. Gated on config.safeEval since it requires
            // the server to also set up per-response CSP nonces.
            if (htmx.config.safeEval) {
                let counter = 0;
                function makeNoncedConstructor(isAsync) {
                    return function(...keys) {
                        let body = keys.pop();
                        return {
                            call: (thisArg, ...values) => {
                                if (getNonce(thisArg) !== pageNonce) {
                                    htmx.trigger(thisArg, 'htmx:security:violation', { reason: 'nonce-mismatch-at-eval' });
                                    return;
                                }
                                let fn = `__htmx_eval_${++counter}`;
                                let asyncPrefix = isAsync ? 'async ' : '';
                                let script = document.createElement('script');
                                script.nonce = pageNonce;
                                script.textContent = `window.${fn} = ${asyncPrefix}function(${keys.join(',')}) { ${body} }`;
                                document.head.appendChild(script);
                                script.remove();
                                let r = window[fn].call(thisArg, ...values);
                                delete window[fn];
                                return r;
                            }
                        };
                    };
                }
                api.initEvalFunctions(makeNoncedConstructor(false), makeNoncedConstructor(true));
            }
        },

        htmx_before_init: checkNonce,

        htmx_before_on_init: checkNonce,

        // Fires after ctx.text is set (htmx:after:request), before fragment
        // parsing. Rewrite response nonces to pageNonce in the raw HTML so
        // both hx-nonce attributes and script nonce attributes are promoted
        // in one pass before the DOM is built.
        htmx_after_request: (elt, detail) => {
            if (!pageNonce) return false;
            let csp = detail.ctx?.response?.headers?.get('Content-Security-Policy');
            let responseNonce = extractNonceFromCSP(csp);
            if (responseNonce && responseNonce !== pageNonce) {
                detail.ctx.text = rewriteNoncesInText(detail.ctx.text, responseNonce);
            }
        },

        // Block boosted form submissions where an unnnonced
        // submitter overrode formAction.
        htmx_config_request: (elt, detail) => {
            if (!pageNonce) return false;

            let ctx = detail.ctx;
            let submitter = ctx.sourceEvent?.submitter;

            if (!elt._htmx?.boosted || !submitter?.getAttribute('formaction')) return;

            if (getNonce(submitter) !== pageNonce) {
                htmx.trigger(elt, 'htmx:security:violation', {
                    reason: 'unnnonced-submitter',
                    submitter,
                    ctx
                });
                detail.cancelled = true;
                return false;
            }
        }
    });

})();
