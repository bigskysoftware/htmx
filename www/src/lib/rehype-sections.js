/**
 * Rehype plugin: wrap each heading and its content in a <section>.
 * Gives sticky headers proper containing blocks so they unstick naturally.
 *
 * @param {{ split?: string }} options
 */
export function rehypeSections({split = 'h2'} = {}) {
    return function (tree) {
        wrap(tree, split);
    };
}

function wrap(node, tag) {
    if (!node.children) return;
    for (const child of node.children) wrap(child, tag);

    if (!node.children.some(c => c.type === 'element' && c.tagName === tag)) return;

    const out = [];
    let section = null;

    for (const child of node.children) {
        if (child.type === 'element' && child.tagName === tag) {
            if (section) out.push(section);
            section = {
                type: 'element',
                tagName: 'section',
                properties: {},
                children: [child],
            };
        } else if (section) {
            section.children.push(child);
        } else {
            out.push(child);
        }
    }
    if (section) out.push(section);

    node.children = out;
}
