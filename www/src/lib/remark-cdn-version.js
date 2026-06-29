/**
 * Remark plugin: replace a __VERSION__ token with the current htmx version,
 * giving CDN/npm snippets across all docs a single source of truth
 * (www/src/data/integrity.json, generated from package.json).
 *
 * Runs on the markdown AST, before syntax highlighting, so the token is a
 * single text value rather than split across highlight spans. Touched node
 * types: `code`/`inlineCode` (fenced + inline snippets), `html` (raw HTML in
 * .md), and `mdxJsx*Element` string attributes (raw `<a href>` links in .mdx).
 * Prose `text` nodes are intentionally left alone.
 *
 * JSX `<Code>` blocks in .mdx are not markdown nodes and are unaffected; those
 * interpolate `${integrity.version}` directly.
 *
 * @param {{ version: string, token?: string }} options
 */
export function remarkCdnVersion({version, token = '__VERSION__'} = {}) {
    if (!version) throw new Error('remarkCdnVersion: version is required');
    const sub = (s) => typeof s === 'string' ? s.split(token).join(version) : s;
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
