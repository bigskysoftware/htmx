/**
 * Remark plugin: replace a __VERSION__ token in code blocks with the current
 * htmx version, giving CDN/npm snippets across all docs a single source of
 * truth (www/src/data/integrity.json, generated from package.json).
 *
 * Runs on the markdown AST, before syntax highlighting, so the token is a
 * single text value rather than split across highlight spans. Only `code`
 * (fenced) and `inlineCode` nodes are touched, never prose.
 *
 * JSX `<Code>` blocks in .mdx are not markdown nodes and are unaffected; those
 * interpolate `${integrity.version}` directly.
 *
 * @param {{ version: string, token?: string }} options
 */
export function remarkCdnVersion({version, token = '__VERSION__'} = {}) {
    if (!version) throw new Error('remarkCdnVersion: version is required');
    return function (tree) {
        replace(tree, version, token);
    };
}

function replace(node, version, token) {
    if ((node.type === 'code' || node.type === 'inlineCode') && typeof node.value === 'string') {
        node.value = node.value.split(token).join(version);
    }
    if (node.children) for (const child of node.children) replace(child, version, token);
}
