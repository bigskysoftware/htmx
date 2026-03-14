import {defineCollection, z} from "astro:content";
import {glob, file} from "astro/loaders";
import {slugify} from "./lib/utils.ts";
import yaml from "js-yaml";

const about = defineCollection({
    loader: glob({base: "./src/content/about", pattern: "{*.md,*.mdx}"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
    }).strict(),
});

const pages = defineCollection({
    loader: glob({base: "./src/content", pattern: "{index,essays/index,interviews/index,podcasts/index,memes/index}.mdx"}),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        breadcrumbs: z.array(z.object({
            label: z.string(),
            href: z.string().optional(),
        })).optional(),
            }).strict(),
});

const docs = defineCollection({
    loader: glob({base: "./src/content", pattern: "docs{.md,.mdx,/**/*.md,/**/*.mdx}"}),
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

const patterns = defineCollection({
    loader: glob({base: "./src/content/patterns", pattern: "{*.md,*.mdx,**/*.md,**/*.mdx}"}),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        thumbnail: z.string().optional(),
        icon: z.string().optional(),
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
    schema: z.object({
        id: z.string(), // generated from `name`
        name: z.string(),
        image: z.string(),
        github: z.string().optional(),
        url: z.string().url().optional(),
        content: z.string(),
    }).passthrough(),
})



export const collections = {
    pages,
    about,
    docs,
    reference,
    patterns,
    essays,
    interviews,
    sponsors,
    community,
team,
};

