/**
 * remark-code-tabs
 *
 * Groups consecutive code fences into tabbed code windows.
 *
 * variant="CSS"    — outer implementation switch (optional)
 * tab="styles.css" — file tab label (optional, defaults to language)
 *
 * With variants:
 *   html variant="CSS" tab="demo.html"
 *   css  variant="CSS" tab="styles.css"
 *   html variant="TailwindCSS" tab="demo.html"
 *
 * Flat (no variant):
 *   html tab="CSS"
 *   html tab="TailwindCSS"
 */

const LABELS = {
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    ts: 'TypeScript',
    py: 'Python',
    json: 'JSON',
    http: 'HTTP',
    bash: 'Bash',
    sh: 'Shell',
    sql: 'SQL',
};

const ICONS = {
    html: 'icon-[devicon--html5]',
    css: 'icon-[devicon--css3]',
    js: 'icon-[devicon--javascript]',
    ts: 'icon-[devicon--typescript]',
    py: 'icon-[devicon--python]',
    json: 'icon-[devicon--json]',
    http: 'icon-[devicon--markdown]',
    bash: 'icon-[devicon--bash]',
    sh: 'icon-[devicon--bash]',
    sql: 'icon-[devicon--microsoftsqlserver]',
};

const FALLBACK_ICON = 'icon-[mdi--file-code-outline]';

// Optional icons for outer variant tabs, matched heuristically from the label.
const VARIANT_ICONS = {
    css: 'icon-[devicon--css3]',
    tailwind: 'icon-[devicon--tailwindcss]',
    tailwindcss: 'icon-[devicon--tailwindcss]',
    javascript: 'icon-[devicon--javascript]',
    js: 'icon-[devicon--javascript]',
    typescript: 'icon-[devicon--typescript]',
    ts: 'icon-[devicon--typescript]',
    python: 'icon-[devicon--python]',
    py: 'icon-[devicon--python]',
    json: 'icon-[devicon--json]',
    go: 'icon-[devicon--go]',
    rust: 'icon-[devicon--rust]',
};

function variantIcon(name) {
    const norm = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (VARIANT_ICONS[norm]) return VARIANT_ICONS[norm];
    for (const [key, icon] of Object.entries(VARIANT_ICONS)) {
        if (norm.startsWith(key)) return icon;
    }
    return null;
}

// Self-contained CSS for code-tabs layout, appearance, and interactions.
// Uses native nesting and light-dark() — no build-time preprocessing needed.
const CODE_GROUP_CSS = `/* Layout for remark-code-tabs. Skin (colors, borders, backgrounds) lives in input.css. */
.code-tabs{margin-block:1.5rem}
.code-tabs__variants{display:flex;gap:.25rem}
.code-tabs__variants label{display:inline-flex;align-items:center;gap:.375rem;padding:.375rem .75rem;font-size:.8125rem;font-weight:500;cursor:pointer}
.code-tabs__variant{display:none}
.code-tabs__editor{position:relative;margin-top:.75rem;overflow:hidden}
.code-tabs__editor pre>div:first-of-type{display:none}
.code-tabs__editor pre>button{top:.625rem;right:.5rem}
.code-tabs__files{display:flex;align-items:center;gap:.25rem;padding:.375rem .5rem}
.code-tabs__files label{display:inline-flex;align-items:center;gap:.375rem;padding:.25rem .625rem;font-size:.75rem;font-weight:500;cursor:pointer}
.code-tabs__panel{display:none}
.code-tabs__panel pre{margin:0;border:0;border-radius:0}
`

const META_RE = /\b(variant|tab)="([^"]*)"/g;

function parseMeta(meta) {
    const tokens = {};
    for (const m of String(meta ?? '').matchAll(META_RE)) tokens[m[1]] = m[2];
    const clean = String(meta ?? '').replace(META_RE, ' ').replace(/\s+/g, ' ').trim();
    return { variant: tokens.variant, tab: tokens.tab, clean };
}

function el(tag, props, children = []) {
    return {
        type: `codeTabs${tag}`,
        data: { hName: tag, hProperties: props },
        children,
    };
}

function html(value) {
    return { type: 'html', value };
}

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fileRadio(groupId, vi, fi, label, icon, checked) {
    const id = `${groupId}-v${vi}-f${fi}`;
    return `<label for="${id}"><input type="radio" name="${groupId}-v${vi}" id="${id}" class="sr-only"${checked ? ' checked' : ''}><i class="${icon} size-3.5" aria-hidden="true"></i>${escapeHtml(label)}</label>`;
}

function variantRadio(groupId, vi, name, checked) {
    const id = `${groupId}-variant-${vi}`;
    const icon = variantIcon(name);
    const iconHtml = icon ? `<i class="${icon} size-3.5" aria-hidden="true"></i>` : '';
    return `<label for="${id}"><input type="radio" name="${groupId}-variant" id="${id}" class="sr-only"${checked ? ' checked' : ''}>${iconHtml}${escapeHtml(name)}</label>`;
}

export default function remarkCodeTabs() {
    return (tree) => {
        const children = tree.children ?? [];
        if (!children.length) return;

        const rules = [];
        const out = [];
        let groupId = 0;
        let i = 0;

        while (i < children.length) {
            const node = children[i];
            if (node.type !== 'code') {
                out.push(node);
                i++;
                continue;
            }

            const first = parseMeta(node.meta);
            if (!first.variant && !first.tab) {
                out.push(node);
                i++;
                continue;
            }

            // Collect the contiguous run of variant-tagged code nodes.
            const run = [];
            while (i < children.length && children[i].type === 'code') {
                const info = parseMeta(children[i].meta);
                if (!info.variant && !info.tab) break;
                run.push({ node: children[i], ...info });
                i++;
            }
            out.push(buildGroup(run, `cg${groupId++}`, rules));
        }

        if (rules.length) {
            rules.unshift(CODE_GROUP_CSS);
            out.push(html(`<style>${rules.join('')}</style>`));
        }
        tree.children = out;
    };
}

function buildGroup(run, gid, rules) {
    // Group the run by variant, preserving author order.
    const variants = [];
    for (const item of run) {
        let v = variants.find((x) => x.name === item.variant);
        if (!v) {
            v = { name: item.variant, files: [] };
            variants.push(v);
        }
        v.files.push(item);
    }

    // Only show variant bar when there are multiple variants.
    const variantBar = variants.length > 1
        ? variants
            .map((v, vi) => variantRadio(gid, vi, v.name, vi === 0))
            .join('\n')
        : '';

    if (variants.length > 1) {
        variants.forEach((v, vi) => {
            rules.push(`#${gid}:has(#${gid}-variant-${vi}:checked) .code-tabs__variant[data-variant="${vi}"]{display:block}`);
        });
    } else {
        // Single variant: always visible, no radio needed.
        rules.push(`#${gid} .code-tabs__variant[data-variant="0"]{display:block}`);
    }

    const sections = variants.map((v, vi) => {
        const fileBar = v.files
            .map((f, fi) => {
                const label = f.tab || LABELS[f.node.lang] || f.node.lang || 'Code';
                const icon = variantIcon(label) || ICONS[f.node.lang] || FALLBACK_ICON;
                return fileRadio(gid, vi, fi, label, icon, fi === 0);
            })
            .join('\n');

        v.files.forEach((f, fi) => {
            f.node.meta = f.clean || null;
            const fileLabel = escapeHtml(String(f.tab || LABELS[f.node.lang] || f.node.lang || ''));
            rules.push(`#${gid}:has(#${gid}-v${vi}-f${fi}:checked) .code-tabs__variant[data-variant="${vi}"] .code-tabs__panel[data-file="${fileLabel}"]{display:block}`);
        });

        const panels = v.files.map((f, fi) => {
            const fileLabel = escapeHtml(String(f.tab || LABELS[f.node.lang] || f.node.lang || ''));
            return el('div', { class: 'code-tabs__panel', 'data-file': fileLabel }, [f.node]);
        });

        return el('section', { class: 'code-tabs__variant', 'data-variant': String(vi) }, [
            el('div', { class: 'code-tabs__editor' }, [
                html(`<div class="code-tabs__files">\n${fileBar}\n</div>`),
                ...panels,
            ]),
        ]);
    });

    const variantBarNode = variantBar
        ? [html(`<div class="code-tabs__variants">\n${variantBar}\n</div>`)]
        : [];

    return el('div', { class: 'code-tabs', id: gid }, [
        ...variantBarNode,
        ...sections,
    ]);
}
