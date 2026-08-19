/**
 * Tokens substituted into docs content, with integrity.json as the single
 * source of truth. Two consumers must agree on this map:
 *
 *   - remark-cdn-version.js, for rendered HTML pages.
 *   - content.js, for the raw-markdown export routes (/*.md, /llms-full.txt).
 *
 * Tokens are chosen to survive markdown parsing inside code fences, inline
 * code, and raw HTML. Prose is deliberately not substituted.
 *
 * @param {{version: string, min: string, full: string, esmMin: string, esm: string}} integrity
 */
export function cdnTokens(integrity) {
    return {
        __VERSION__: integrity.version,
        __SRI_MIN__: integrity.min,
        __SRI_FULL__: integrity.full,
        __SRI_ESM_MIN__: integrity.esmMin,
        __SRI_ESM__: integrity.esm,
    };
}

/**
 * Replace every token in a string. Non-strings pass through untouched.
 * @param {string} value
 * @param {Record<string, string>} tokens
 */
export function substituteTokens(value, tokens) {
    if (typeof value !== 'string') return value;
    for (const [token, replacement] of Object.entries(tokens)) {
        value = value.split(token).join(replacement);
    }
    return value;
}
