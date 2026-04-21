/**
 * Main application JS — htmx 2.x event handlers and utilities
 */

// Request lifecycle
htmx.on('htmx:beforeRequest', function(e) {
    NProgress.start();
});

htmx.on('htmx:afterRequest', function(e) {
    NProgress.done();
});

htmx.on('htmx:afterSwap', function(e) {
    // Re-initialize tooltips after swap
    initTooltips(e.detail.elt);
});

htmx.on('htmx:afterSettle', function(e) {
    // Focus first input in swapped content
    const input = e.detail.elt.querySelector('input:not([type=hidden])');
    if (input) input.focus();
});

// Error handling
htmx.on('htmx:responseError', function(e) {
    showToast('Request failed: ' + e.detail.xhr.status, 'error');
});

htmx.on('htmx:sendError', function(e) {
    showToast('Network error — please check your connection', 'error');
});

htmx.on('htmx:timeout', function(e) {
    showToast('Request timed out', 'warning');
});

// Config modification
htmx.on('htmx:configRequest', function(e) {
    // Add auth header to all requests
    e.detail.headers['Authorization'] = 'Bearer ' + getAuthToken();
});

// History events
htmx.on('htmx:pushedIntoHistory', function(e) {
    analytics.trackPageView(e.detail.path);
});

htmx.on('htmx:historyCacheMiss', function(e) {
    console.warn('History cache miss for', e.detail.path);
});

htmx.on('htmx:historyRestore', function(e) {
    reinitializePage();
});

// Validation
htmx.on('htmx:validation:validate', function(e) {
    const form = e.detail.elt;
    if (!customValidate(form)) {
        e.preventDefault();
    }
});

htmx.on('htmx:validation:halted', function(e) {
    shakeElement(e.detail.elt);
});

// XHR progress (file uploads)
htmx.on('htmx:xhr:progress', function(e) {
    const pct = (e.detail.loaded / e.detail.total) * 100;
    updateProgressBar(pct);
});

// Load event
htmx.on('htmx:load', function(e) {
    initComponents(e.detail.elt);
});

// DOM utility helpers using old htmx API
function showLoading(el) {
    htmx.addClass(el, 'loading');
    htmx.addClass(el, 'opacity-50');
}

function hideLoading(el) {
    htmx.removeClass(el, 'loading');
    htmx.removeClass(el, 'opacity-50');
}

function flashElement(el) {
    htmx.addClass(el, 'flash');
    setTimeout(function() {
        htmx.removeClass(el, 'flash');
    }, 1000);
}

function removeStale(el) {
    const container = htmx.closest(el, '.container');
    htmx.remove(el);
    if (container && container.children.length === 0) {
        htmx.remove(container);
    }
}

function toggleActive(el) {
    htmx.toggleClass(el, 'active');
}

// Extension registration
htmx.defineExtension('analytics', {
    onEvent: function(name, evt) {
        if (name === 'htmx:afterSwap') {
            trackSwap(evt.detail);
        }
    }
});

// Config
htmx.config.defaultSwapStyle = 'innerHTML';
htmx.config.globalViewTransitions = true;
htmx.config.historyCacheSize = 30;
htmx.config.allowNestedOobSwaps = true;
htmx.config.scrollBehavior = 'smooth';
htmx.config.withCredentials = true;
htmx.config.wsReconnectDelay = 'full-jitter';
