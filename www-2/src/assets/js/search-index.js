import {Document, Charset} from 'flexsearch';

/**
 * Generic search index web component wrapping FlexSearch.
 *
 * @example Basic usage (zero config)
 * <search-index src="/search.json"></search-index>
 *
 * @example With options
 * <search-index
 *   src="/search.json"
 *   fields="title,description"
 *   highlight="<mark>$1</mark>"
 *   preload
 * ></search-index>
 *
 * @attr {string} src - URL to fetch search data from (required)
 * @attr {string} fields - Comma-separated fields to search (default: all strings except id/url)
 * @attr {string} highlight - Highlight template, $1 = matched text
 * @attr {number} limit - Default result limit (default: 50)
 * @attr {string} tokenize - strict | forward | reverse | full (default: forward)
 * @attr {boolean} suggest - Enable fuzzy matching (default: true)
 * @attr {boolean} preload - Load index on connect
 */
class SearchIndex extends HTMLElement {
    constructor() {
        super();
        this.index = null;
        this.loadingPromise = null;
        this.rawData = [];
        this.schema = new Set();
    }

    static get observedAttributes() {
        return ['src', 'highlight', 'limit', 'suggest', 'tokenize', 'fields'];
    }

    // Property accessors
    get src() {
        return this.getAttribute('src');
    }
    set src(value) {
        if (value) this.setAttribute('src', value);
        else this.removeAttribute('src');
    }

    get fields() {
        const attr = this.getAttribute('fields');
        return attr ? attr.split(',').map(f => f.trim()) : null;
    }
    set fields(value) {
        if (value) this.setAttribute('fields', value.join(','));
        else this.removeAttribute('fields');
    }

    get highlight() {
        return this.getAttribute('highlight');
    }
    set highlight(value) {
        if (value) this.setAttribute('highlight', value);
        else this.removeAttribute('highlight');
    }

    get limit() {
        return Number(this.getAttribute('limit')) || 50;
    }
    set limit(value) {
        this.setAttribute('limit', String(value));
    }

    get suggest() {
        return this.hasAttribute('suggest') ? this.getAttribute('suggest') !== 'false' : true;
    }
    set suggest(value) {
        this.toggleAttribute('suggest', value);
    }

    get preload() {
        return this.hasAttribute('preload');
    }
    set preload(value) {
        this.toggleAttribute('preload', value);
    }

    get ready() {
        return this.index !== null;
    }

    connectedCallback() {
        if (this.preload) {
            this.load().catch(err => console.error('<search-index>: preload failed', err));
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        // Reset index if configuration changes
        if (['src', 'tokenize', 'fields'].includes(name) && this.index) {
            this.clear();
        }
    }

    async load() {
        if (this.loadingPromise) return this.loadingPromise;
        if (this.index) return Promise.resolve();

        const src = this.src;
        if (!src) {
            throw new Error('<search-index>: "src" attribute is required');
        }

        this.setAttribute('data-loading', '');
        this.removeAttribute('data-error');

        this.loadingPromise = (async () => {
            try {
                const response = await fetch(src);
                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.statusText}`);
                }
                const data = await response.json();
                this.rawData = data.results || [];

                if (this.rawData.length === 0) {
                    console.warn('<search-index>: No results in data');
                    return;
                }

                // Build schema from ALL results (not just first one)
                this.schema = this._buildSchema(this.rawData);

                // Determine searchable fields
                const searchableFields = this._getSearchableFields();

                // Create FlexSearch index
                this.index = new Document({
                    document: {
                        id: 'id',
                        index: searchableFields,
                        store: Array.from(this.schema)  // Always store everything
                    },
                    tokenize: this.getAttribute('tokenize') || 'forward',
                    charset: Charset.LatinBalance,
                    optimize: true,
                    cache: true
                });

                // Populate index
                for (const result of this.rawData) {
                    this.index.add(result);
                }

                this.dispatchEvent(new CustomEvent('load', {
                    detail: {
                        count: this.rawData.length,
                        fields: searchableFields,
                        schema: Array.from(this.schema)
                    },
                    bubbles: true
                }));
            } catch (error) {
                console.error('<search-index>:', error);
                this.setAttribute('data-error', '');
                this.dispatchEvent(new CustomEvent('error', {
                    detail: {error},
                    bubbles: true
                }));
                throw error;
            } finally {
                this.removeAttribute('data-loading');
                this.loadingPromise = null;
            }
        })();

        return this.loadingPromise;
    }

    async search(query, options = {}) {
        await this.load();

        if (!this.index) return [];

        const trimmedQuery = query?.trim();
        if (!trimmedQuery) {
            this.removeAttribute('data-searched');
            this.removeAttribute('data-empty');
            return [];
        }

        this.setAttribute('data-searching', '');

        const searchOptions = {
            limit: options.limit ?? this.limit,
            suggest: options.suggest ?? this.suggest,
            enrich: true,
            ...options
        };

        const searchResults = this.index.search(trimmedQuery, searchOptions);

        // Build lookup map from rawData (preserves nested objects like meta)
        const dataMap = new Map(this.rawData.map(item => [item.id, item]));

        // Deduplicate results across fields
        const seen = new Set();
        const results = [];

        for (const fieldResult of searchResults) {
            for (const match of fieldResult.result || []) {
                const id = typeof match === 'object' ? (match.id ?? match.doc?.id) : match;
                if (id == null || seen.has(id)) continue;
                seen.add(id);

                const doc = dataMap.get(id);
                if (!doc) continue;

                // Highlight text fields if configured
                const tpl = this.highlight;
                if (tpl) {
                    results.push(this._highlight(doc, trimmedQuery, tpl));
                } else {
                    results.push(doc);
                }
            }
        }

        // Sort results to prioritize exact case matches in title
        results.sort((a, b) => {
            const aTitle = a.title?.replace(/<[^>]*>/g, '') || '';
            const bTitle = b.title?.replace(/<[^>]*>/g, '') || '';
            const aExact = aTitle.includes(trimmedQuery);
            const bExact = bTitle.includes(trimmedQuery);
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
        });

        this.removeAttribute('data-searching');
        this.setAttribute('data-searched', '');
        this.toggleAttribute('data-empty', results.length === 0);

        this.dispatchEvent(new CustomEvent('search', {
            detail: {query: trimmedQuery, results, count: results.length},
            bubbles: true
        }));

        return results;
    }

    _highlight(doc, query, template) {
        const terms = query.split(/\s+/).filter(Boolean);
        if (!terms.length) return doc;

        const pattern = new RegExp(
            `(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
            'gi'
        );
        const wrap = (str) => typeof str === 'string' ? str.replace(pattern, template) : str;

        return {
            ...doc,
            title: wrap(doc.title),
            description: wrap(doc.description)
        };
    }

    clear() {
        this.index = null;
        this.loadingPromise = null;
        this.rawData = [];
        this.schema.clear();
        this.removeAttribute('data-loading');
        this.removeAttribute('data-searched');
        this.removeAttribute('data-empty');
        this.removeAttribute('data-error');
    }

    update(doc) {
        if (!this.index) throw new Error('Index not loaded');
        this.index.update(doc);
    }

    remove(id) {
        if (!this.index) throw new Error('Index not loaded');
        this.index.remove(id);
    }

    add(doc) {
        if (!this.index) throw new Error('Index not loaded');
        this.index.add(doc);
        this.rawData.push(doc);
        // Update schema with new fields
        Object.keys(doc).forEach(key => this.schema.add(key));
    }

    getData() {
        return [...this.rawData];
    }

    getSchema() {
        return Array.from(this.schema);
    }

    // Private: Build complete schema from ALL results
    _buildSchema(results) {
        const schema = new Set();
        for (const result of results) {
            Object.keys(result).forEach(key => schema.add(key));
        }
        return schema;
    }

    // Private: Determine which fields should be searchable
    _getSearchableFields() {
        // If explicitly configured, use that
        const explicitFields = this.fields;
        if (explicitFields) {
            return explicitFields;
        }

        // Default: search all string fields except id/url
        const firstResult = this.rawData[0];
        return Array.from(this.schema).filter(key => {
            if (['id', 'url'].includes(key)) return false;
            // Check if field is string in first result (performance optimization)
            return typeof firstResult[key] === 'string';
        });
    }
}

customElements.define('search-index', SearchIndex);
