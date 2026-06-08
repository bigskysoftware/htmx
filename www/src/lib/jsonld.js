/**
 * @typedef {Object} ArticleMeta
 * @property {string} [publishedTime]  ISO 8601
 * @property {string} [modifiedTime]   ISO 8601
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

    return {
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
    };
}
