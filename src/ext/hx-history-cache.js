(() => {
    let api;

    const CACHE_KEY = 'htmx-history-cache';
    const PATH_KEY  = 'htmx-history-cache-current-path';

    let currentPathForHistory = location.pathname + location.search;

    function cfg() {
        return htmx.config.historyCache;
    }

    function prefix(attr) {
        return htmx.config.prefix ? attr.replace('hx-', htmx.config.prefix) : attr;
    }

    function normalizePath(path) {
        try { path = new URL(path, location.href).pathname + new URL(path, location.href).search; } catch (_) {}
        return path.replace(/\/$/, '') || '/';
    }

    function currentPath() {
        return currentPathForHistory
            || (canUseStorage() && sessionStorage.getItem(PATH_KEY))
            || location.pathname + location.search;
    }

    function setCurrentPath(path) {
        currentPathForHistory = path;
        if (canUseStorage()) sessionStorage.setItem(PATH_KEY, path);
    }

    function canUseStorage() {
        try {
            sessionStorage.setItem('__htmx_test__', '1');
            sessionStorage.removeItem('__htmx_test__');
            return true;
        } catch (_) { return false; }
    }

    function getHistoryTarget() {
        return htmx.find(`[${prefix('hx-history-elt')}]`) || document.body;
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

    function readCache() {
        try { return JSON.parse(sessionStorage.getItem(CACHE_KEY)) || []; } catch (_) { return []; }
    }

    function writeCache(cache) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    function saveToCache(url) {
        if (!canUseStorage()) return;
        if (cfg().size <= 0) { sessionStorage.removeItem(CACHE_KEY); return; }
        let target = getHistoryTarget();
        if (htmx.find(`[${prefix('hx-history')}="false"]`)) return;

        let cache = readCache();
        let detail = { path: url, target, cache };
        if (api.triggerHtmxEvent(document, 'htmx:history:cache:before:save', detail) === false) return;
        // respect mutations to path and target from event handlers
        url = detail.path;
        target = detail.target;
        cache = detail.cache;

        cache = cache.filter(e => e.url !== url);
        let item = { url, content: cleanContent(target), head: document.head.outerHTML, title: document.title, scroll: window.scrollY };
        cache.push(item);

        while (cache.length > cfg().size) cache.shift();

        let saved = false;
        while (!saved && cache.length > 0) {
            try {
                writeCache(cache);
                saved = true;
            } catch (error) {
                cache.shift();
            }
        }

        if (saved) api.triggerHtmxEvent(document, 'htmx:history:cache:after:save', { path: url, item, cache: readCache() });
    }

    function getFromCache(url) {
        return readCache().find(e => e.url === url) || null;
    }

    async function restoreFromCache(path, item) {
        await htmx.swap({
            sourceElement: document.body,
            target: getHistoryTarget(),
            swap: cfg().swapStyle,
            text: item.content,
            transition: false
        });
        document.title = item.title;
        requestAnimationFrame(() => window.scrollTo(0, item.scroll));
        api.triggerHtmxEvent(document, 'htmx:history:cache:restored', { path, item, head: item.head });
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
            saveToCache(normalizePath(currentPath()));
            // track the path that is about to be pushed/replaced so we have it after popstate
            setCurrentPath(normalizePath(detail.history.path));
        },

        htmx_before_restore_history: (elt, detail) => {
            if (cfg().disable) return;
            saveToCache(normalizePath(currentPath()));
            setCurrentPath(normalizePath(detail.path));
            let normalizedPath = normalizePath(detail.path);
            let item = getFromCache(normalizedPath);
            if (!item) {
                // cache miss — fire event, then let core handle the fetch
                let missDetail = { path: normalizedPath, refreshOnMiss: cfg().refreshOnMiss };
                api.triggerHtmxEvent(document, 'htmx:history:cache:miss', missDetail);
                if (missDetail.refreshOnMiss) { location.reload(); return false; }
                return;
            }
            // fire hit event synchronously, before deciding whether to cancel core
            let hitDetail = { path: normalizedPath, item };
            if (api.triggerHtmxEvent(document, 'htmx:history:cache:hit', hitDetail) === false) {
                // cache:hit was cancelled — let core handle the fetch (with proper abort signal)
                return;
            }
            // user accepted cache — cancel core, restore from cache
            detail.cancelled = true;
            restoreFromCache(normalizedPath, hitDetail.item);
            return false;
        }
    });
})();
