/**
 * Custom htmx extensions — htmx 2.x style
 */

// Custom extension using old API
htmx.defineExtension('auto-save', {
    onEvent: function(name, evt) {
        if (name === 'htmx:beforeRequest') {
            showSaveIndicator();
        }
        if (name === 'htmx:afterRequest') {
            hideSaveIndicator();
        }
        if (name === 'htmx:sendError') {
            showSaveError();
        }
    }
});

htmx.defineExtension('confirm-modal', {
    onEvent: function(name, evt) {
        if (name === 'htmx:configRequest') {
            evt.detail.headers['X-Confirm'] = 'true';
        }
    }
});

// SSE event handling
document.addEventListener('htmx:sseBeforeMessage', function(e) {
    console.log('Incoming SSE:', e.detail);
});

document.addEventListener('htmx:sseMessage', function(e) {
    playNotificationSound();
});

document.addEventListener('htmx:sseClose', function(e) {
    showReconnecting();
});

// WS event handling
document.addEventListener('htmx:wsConfigSend', function(e) {
    e.detail.headers['X-WS-Auth'] = getWsToken();
});

document.addEventListener('htmx:wsAfterSend', function(e) {
    clearInput();
});

document.addEventListener('htmx:wsBeforeMessage', function(e) {
    if (isBlocked(e.detail.message)) {
        e.preventDefault();
    }
});

document.addEventListener('htmx:wsAfterMessage', function(e) {
    scrollToBottom();
});

// Old response header check
function handleResponse(xhr) {
    const afterSwapTrigger = xhr.getResponseHeader('HX-Trigger-After-Swap');
    const afterSettleTrigger = xhr.getResponseHeader('HX-Trigger-After-Settle');
    if (afterSwapTrigger) {
        processTrigger(afterSwapTrigger);
    }
    if (afterSettleTrigger) {
        processTrigger(afterSettleTrigger);
    }
}
