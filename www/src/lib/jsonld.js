/**
 * @typedef {Object} ArticleMeta
 * @property {Date|string} [publishedTime]
 * @property {Date|string} [modifiedTime]
 * @property {string[]} [authors]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} JsonLdOpts
 * @property {string} title
 * @property {string} description
 * @property {string} image
 * @property {URL} url
 * @property {string} siteUrl
 * @property {ArticleMeta} [article]
 */

const toIso = (d) => d ? new Date(d).toISOString() : undefined;

/**
 * Build the JSON-LD structured-data payload for a page.
 * Returns a WebSite schema by default; an Article schema when `article` is provided.
 * @param {JsonLdOpts} opts
 */
export function buildJsonLd({ title, description, image, url, siteUrl, article }) {
    const desc = description.trim();
    if (!article) {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "htmx",
            "url": siteUrl,
            "description": desc,
        };
    }

    const publishedIso = toIso(article.publishedTime);
    const modifiedIso = toIso(article.modifiedTime);

    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": desc,
        "url": url.href,
        "image": new URL(image, url).href,
        ...(publishedIso && { "datePublished": publishedIso }),
        ...(modifiedIso && { "dateModified": modifiedIso }),
        ...(article.authors?.length && {
            "author": article.authors.map(name => ({ "@type": "Person", name }))
        }),
        ...(article.tags?.length && { "keywords": article.tags.join(", ") }),
        "publisher": { "@type": "Organization", "name": "htmx", "url": siteUrl },
    };
}
