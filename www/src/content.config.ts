import {defineCollection, z} from "astro:content";
import type {Loader} from "astro/loaders";
import {glob, file} from "astro/loaders";
import {slugify} from "./lib/utils.ts";
import {aggregateCollectionMarkdown} from "./lib/content.ts";
import yaml from "js-yaml";

/**
 * Wraps a glob() loader so that the collection's `full` entry (if present)
 * has its body replaced with the concatenated markdown of every other file
 * in the collection — turning `<collection>/full` into a real single-page
 * view. The synthesised markdown is pre-rendered to HTML via the loader's
 * own markdown renderer (which applies the site-wide rehype/shiki config),
 * so Astro's `render(entry)` / `<Content />` just serves the result.
 */
function withAggregateFull(collection: string, base: Loader): Loader {
    return {
        name: `${base.name}-with-aggregate`,
        load: async (ctx) => {
            await base.load(ctx);
            const id = `${collection}/full`;
            const stub = ctx.store.get(id);
            if (!stub) return;
            const data = await ctx.parseData({ id, data: stub.data });
            const body = await aggregateCollectionMarkdown(collection);
            const rendered = await ctx.renderMarkdown(body);
            // Replace the glob-loaded entry with a rendered-only entry.
            // Keeping the entry's filePath would make Astro re-render from
            // disk (which only contains the frontmatter stub).
            ctx.store.delete(id);
            ctx.store.set({
                id,
                data,
                body,
                rendered,
                digest: ctx.generateDigest(body),
            });
        },
        schema: base.schema,
    };
}

const home = defineCollection({
    loader: glob({base: "./src/content", pattern: "index.mdx"}),
    schema: z.object({
        title: z.string(),
        description: z.string(),
    }).strict(),
});

const about = defineCollection({
    loader: glob({base: "./src/content", pattern: "about.mdx"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
    }).strict(),
});

const docs = defineCollection({
    loader: withAggregateFull('docs', glob({base: "./src/content", pattern: "docs{.md,.mdx,/**/*.md,/**/*.mdx}"})),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        thumbnail: z.string().optional(),
        keywords: z.array(z.string()).optional(),
    }).strict(),
});

const reference = defineCollection({
    loader: glob({base: "./src/content/reference", pattern: "{*.md,**/*.md}"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        thumbnail: z.string().optional(),
        hidden: z.boolean().optional(),
    }).strict(),
});

const extensions = defineCollection({
    loader: glob({base: "./src/content/extensions", pattern: "{*.md,*.mdx,**/*.md,**/*.mdx}"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        thumbnail: z.string().optional(),
        category: z.enum(['Networking', 'Performance', 'UX', 'Swap behaviors', 'Compatibility']).optional(),
        icon: z.string().optional(),
    }).strict(),
});

const patterns = defineCollection({
    loader: glob({base: "./src/content/patterns", pattern: "{*.md,*.mdx,**/*.md,**/*.mdx}"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        thumbnail: z.string().optional(),
        icon: z.string().optional(),
        soon: z.boolean().optional(),
    }).strict(),
});

const essays = defineCollection({
    loader: glob({base: "./src/content/essays", pattern: ["{*.md,*.mdx,**/*.md,**/*.mdx}", "!index.mdx"]}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
                created: z.date().optional(),
        modified: z.date().optional(),
        authors: z.array(z.string()).min(1),
        tags: z.array(z.enum(['foundations', 'the-case-for-hypermedia', 'case-studies', 'guides', 'simplicity', 'counterpoints'])).optional(),
        keywords: z.array(z.string()).optional(),
    }).strict(),
});

const interviews = defineCollection({
    loader: glob({base: "./src/content/interviews", pattern: "{*.md,*.mdx,**/*.md,**/*.mdx}"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        created: z.date().optional(),
        modified: z.date().optional(),
        authors: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
    }).strict(),
});

const sponsors = defineCollection({
    loader: file('src/content/sponsors.yaml', {
        parser: (fileContent) => (yaml.load(fileContent) as any[]).map((sponsor) => (
            {
                ...sponsor,
                id: slugify(sponsor.name),
                url: sponsor.tracking !== false
                    ? `${sponsor.url}?utm_source=htmx&utm_medium=sponsorship&utm_campaign=${sponsor.tier}-sponsor-${new Date().getFullYear()}`
                    : sponsor.url,
            }))
    }),
    schema: z.object({
        id: z.string(), // generated from `name`
        name: z.string(),
        url: z.string().url(),
        github: z.string().optional(),
        image: z.string(),
        tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
        tracking: z.boolean().default(true),
    }).strict(),
});

const community = defineCollection({
    loader: file('src/content/community.yaml', {
        parser: (fileContent) => (yaml.load(fileContent) as any[]).map((item) => ({...item, id: slugify(item.name)}))
    }),
    schema: z.object({
        id: z.string(), // generated from `name`
        name: z.string(),
        description: z.string(),
        iconClass: z.string(),
        url: z.string(),
    }).strict(),
})


const team = defineCollection({
    loader: file('src/content/team.yaml', {
        parser: (fileContent) => (yaml.load(fileContent) as any[]).map((member) => ({
            ...member,
            id: slugify(member.name)
        }))
    }),
    schema: ({image}) => z.object({
        id: z.string(), // generated from `name`
        name: z.string(),
        image: image(),
        github: z.string().optional(),
        url: z.string().url().optional(),
        content: z.string(),
    }).passthrough(),
})



export const collections = {
    home,
    about,
    docs,
    reference,
    extensions,
    patterns,
    essays,
    interviews,
    sponsors,
    community,
    team,
};

