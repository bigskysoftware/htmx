/**
 * @typedef {Object} ArticleMeta
 * @property {string} [publishedTime]  ISO 8601
 * @property {string} [modifiedTime]   ISO 8601
 * @property {string[]} [authors]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} label
 * @property {string} [href]
 */

/**
 * @typedef {Object} JsonLdOpts
 * @property {string} title
 * @property {string} description
 * @property {string} image
 * @property {URL} url
 * @property {string} siteUrl
 * @property {ArticleMeta} [article]
 * @property {BreadcrumbItem[]} [breadcrumbs]
 */

/**
 * Build the JSON-LD structured-data payload for a page.
 * Returns an array of schemas: WebSite or Article, plus BreadcrumbList when breadcrumbs are provided.
 * @param {JsonLdOpts} opts
 */
export function buildJsonLd({ title, description, image, url, siteUrl, article, breadcrumbs }) {
    const desc = description.trim();
    const schemas = [];

    if (!article) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "htmx",
            "url": siteUrl,
            "description": desc,
        });
    } else {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": desc,
            "url": url.href,
            "image": new URL(image, url).href,
            ...(article.publishedTime && { "datePublished": article.publishedTime }),
            ...(article.modifiedTime && { "dateModified": article.modifiedTime }),
            ...(article.authors?.length && {
                "author": article.authors.map(name => ({ "@type": "Person", name }))
            }),
            ...(article.tags?.length && { "keywords": article.tags.join(", ") }),
            "publisher": { "@type": "Organization", "name": "htmx", "url": siteUrl },
        });
    }

    if (breadcrumbs?.length) {
        const allCrumbs = [{ label: 'Home', href: '/' }, ...breadcrumbs];
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": allCrumbs.map((crumb, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": crumb.label.replace(/<[^>]*>/g, ''),
                ...(crumb.href ? { "item": new URL(crumb.href, siteUrl).href } : {}),
            })),
        });
    }

    return schemas.length === 1 ? schemas[0] : schemas;
}
