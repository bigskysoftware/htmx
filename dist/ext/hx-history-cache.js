(() => {
    let api;

    const INDEX_KEY = 'htmx-history-index';

    function cfg() {
        return htmx.config.historyCache;
    }

    function prefix(attr) {
        return htmx.config.prefix ? attr.replace('hx-', htmx.config.prefix) : attr;
    }

    function canUseStorage() {
        try {
            sessionStorage.setItem('__htmx_test__', '1');
            sessionStorage.removeItem('__htmx_test__');
            return true;
        } catch (_) { return false; }
    }

    function genId() {
        return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    }

    function getHistoryTarget() {
        return htmx.find(`[${prefix('hx-history-elt')}]`) || document.body;
    }

    const ATTR_VALUE   = 'data-htmx-history-value';
    const ATTR_CHECKED = 'data-htmx-history-checked';
    const ATTR_SCROLL  = 'data-htmx-history-scroll';

    function annotateState(root) {
        root.querySelectorAll('input, textarea, select').forEach(el => {
            let type = el.type?.toLowerCase();
            if (type === 'file' || type === 'password') return;
            if (type === 'checkbox' || type === 'radio') {
                if (el.checked) el.setAttribute(ATTR_CHECKED, '1');
            } else if (el.tagName === 'SELECT' && el.multiple) {
                let selected = Array.from(el.options).filter(o => o.selected).map(o => o.value);
                if (selected.length) el.setAttribute(ATTR_VALUE, JSON.stringify(selected));
            } else if (el.value) {
                el.setAttribute(ATTR_VALUE, el.value);
            }
        });
        root.querySelectorAll('*').forEach(el => {
            if (el.scrollTop > 0 || el.scrollLeft > 0)
                el.setAttribute(ATTR_SCROLL, `${el.scrollTop},${el.scrollLeft}`);
        });
    }

    function restoreAnnotations(root) {
        root.querySelectorAll(`[${ATTR_CHECKED}]`).forEach(el => {
            el.checked = true;
            el.removeAttribute(ATTR_CHECKED);
        });
        root.querySelectorAll(`[${ATTR_VALUE}]`).forEach(el => {
            let raw = el.getAttribute(ATTR_VALUE);
            if (el.tagName === 'SELECT' && el.multiple) {
                let values = JSON.parse(raw);
                Array.from(el.options).forEach(o => { o.selected = values.includes(o.value); });
            } else {
                el.value = raw;
            }
            el.removeAttribute(ATTR_VALUE);
        });
        root.querySelectorAll(`[${ATTR_SCROLL}]`).forEach(el => {
            let [top, left] = el.getAttribute(ATTR_SCROLL).split(',').map(Number);
            el.scrollTop = top;
            el.scrollLeft = left;
            el.removeAttribute(ATTR_SCROLL);
        });
    }

    function cleanContent(elt) {
        let clone = elt.cloneNode(true);
        clone.querySelectorAll('.htmx-request').forEach(el => el.classList.remove('htmx-request'));
        clone.querySelectorAll('[disabled][data-disabled-by-htmx]').forEach(el => {
            el.removeAttribute('disabled');
            el.removeAttribute('data-disabled-by-htmx');
        });
        return clone.innerHTML;
    }

    // --- sessionStorage index (LRU list of htmxIds) ---

    function readIndex() {
        try { return JSON.parse(sessionStorage.getItem(INDEX_KEY)) || []; } catch { return []; }
    }

    function writeIndex(index) {
        sessionStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }

    function saveToSessionStorage(htmxId, content, head) {
        if (cfg().size <= 0) return false;
        let index = readIndex().filter(id => id !== htmxId);
        // evict oldest until we're under the limit (leaving room for our new entry)
        while (index.length >= cfg().size) {
            sessionStorage.removeItem('htmx-history-' + index.shift());
        }
        // try to write, evicting more if sessionStorage is full
        let data = JSON.stringify({ content, head });
        while (true) {
            try {
                sessionStorage.setItem('htmx-history-' + htmxId, data);
                index.push(htmxId);
                writeIndex(index);
                return true;
            } catch (e) {
                if (index.length === 0) return false;
                sessionStorage.removeItem('htmx-history-' + index.shift());
            }
        }
    }

    function getFromSessionStorage(htmxId) {
        try { return JSON.parse(sessionStorage.getItem('htmx-history-' + htmxId)); } catch { return null; }
    }

    // --- two-tier save/get ---

    function saveCurrentPage() {
        if (htmx.find(`[${prefix('hx-history')}="false"]`)) return;

        let target = getHistoryTarget();
        annotateState(target);
        let head = document.head.outerHTML;
        let scroll = window.scrollY;
        let title = document.title;

        let detail = { target, head };
        if (api.triggerHtmxEvent(document, 'htmx:history:cache:before:save', detail) === false) return;
        let content = cleanContent(target);
        head = detail.head;

        // Reuse existing htmxId if this entry already fell back to sessionStorage
        let existingId = history.state?.htmxId;

        if (existingId) {
            // Already using sessionStorage for this entry — update it there
            history.replaceState({ ...history.state, scroll, title }, '', location.href);
            if (canUseStorage()) saveToSessionStorage(existingId, content, head);
        } else {
            // Tier 1: try storing content directly in history.state
            try {
                history.replaceState({
                    ...history.state,
                    htmxContent: { content, head },
                    scroll,
                    title
                }, '', location.href);
            } catch (e) {
                // Tier 2: overflow — mint an htmxId, store content in sessionStorage
                let htmxId = genId();
                history.replaceState({
                    ...history.state,
                    htmxId,
                    htmxContent: undefined,
                    scroll,
                    title
                }, '', location.href);
                if (canUseStorage()) saveToSessionStorage(htmxId, content, head);
            }
        }

        api.triggerHtmxEvent(document, 'htmx:history:cache:after:save', { content, head, scroll, title });
    }

    function getCachedContent() {
        let state = history.state;
        if (!state) return null;

        // Tier 1: content directly in history.state
        if (state.htmxContent) return state.htmxContent;

        // Tier 2: htmxId points to sessionStorage
        if (state.htmxId && canUseStorage()) return getFromSessionStorage(state.htmxId);

        return null;
    }

    async function restoreFromCache(item) {
        // Let head extension merge stylesheets/blocking scripts before body swap
        let detail = { head: item.head, ready: null };
        api.triggerHtmxEvent(document, 'htmx:history:cache:before:restore', detail);
        if (detail.ready) await detail.ready;

        // Swap body — pass deferred scripts on ctx so htmx_after_swap picks them up
        let ctx = {
            sourceElement: document.body,
            target: getHistoryTarget(),
            swap: cfg().swapStyle,
            text: item.content,
            transition: false,
            _deferredHeadScripts: detail._deferredHeadScripts
        };
        await htmx.swap(ctx);

        let state = history.state;
        document.title = state?.title || document.title;
        requestAnimationFrame(() => {
            window.scrollTo(0, state?.scroll || 0);
            restoreAnnotations(getHistoryTarget());
            api.triggerHtmxEvent(document, 'htmx:history:cache:after:restore', { item });
        });
    }

    htmx.registerExtension('history-cache', {
        init: (internalAPI) => {
            api = internalAPI;
            htmx.config.historyCache            ??= {};
            htmx.config.historyCache.size          ??= 10;
            htmx.config.historyCache.refreshOnMiss ??= false;
            htmx.config.historyCache.disable       ??= false;
            htmx.config.historyCache.swapStyle     ??= 'innerHTML';
        },

        htmx_before_history_update: (elt, detail) => {
            if (cfg().disable) return;
            saveCurrentPage();
        },

        htmx_before_history_restore: (elt, detail) => {
            if (cfg().disable) return;
            let item = getCachedContent();
            if (!item) {
                let missDetail = { path: detail.path, refreshOnMiss: cfg().refreshOnMiss };
                api.triggerHtmxEvent(document, 'htmx:history:cache:miss', missDetail);
                if (missDetail.refreshOnMiss) { location.reload(); return false; }
                return;
            }

            let hitDetail = { path: detail.path, item };
            if (api.triggerHtmxEvent(document, 'htmx:history:cache:hit', hitDetail) === false) return;

            detail.cancelled = true;
            restoreFromCache(hitDetail.item);
            return false;
        }
    });
})();
