/**
 * Remark plugin: replace CDN tokens (__VERSION__, __SRI_MIN__, and friends)
 * with values from www/src/data/integrity.json, giving CDN/npm snippets across
 * all docs a single source of truth. The token map lives in cdn-tokens.js.
 *
 * Runs on the markdown AST, before syntax highlighting, so each token is a
 * single text value rather than split across highlight spans. Touched node
 * types: `code`/`inlineCode` (fenced + inline snippets), `html` (raw HTML in
 * .md), and `mdxJsx*Element` string attributes (raw `<a href>` links in .mdx).
 * Prose `text` nodes are intentionally left alone: markdown reads `__x__` as
 * emphasis, so a token in prose would render as bold text.
 *
 * @param {{ tokens: Record<string, string> }} options
 */
import { substituteTokens } from './cdn-tokens.js';

export function remarkCdnVersion({tokens} = {}) {
    if (!tokens || !Object.keys(tokens).length) {
        throw new Error('remarkCdnVersion: tokens is required');
    }
    const sub = (s) => substituteTokens(s, tokens);
    return function (tree) {
        replace(tree, sub);
    };
}

function replace(node, sub) {
    if (node.type === 'code' || node.type === 'inlineCode' || node.type === 'html') {
        node.value = sub(node.value);
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        for (const attr of node.attributes || []) {
            if (attr.type === 'mdxJsxAttribute') attr.value = sub(attr.value);
        }
    }
    if (node.children) for (const child of node.children) replace(child, sub);
}
