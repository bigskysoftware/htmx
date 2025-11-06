/**
 * Mock implementation of the Fetch API for testing
 */

class MockResponse {
    constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.ok = this.status >= 200 && this.status < 300;
        this.statusText = init.statusText || '';
        this.headers = new Map(Object.entries(init.headers || {}));
        this.url = init.url || '';
        this.type = init.type || 'basic';
    }

    async json() {
        if (typeof this.body === 'string') {
            return JSON.parse(this.body);
        }
        return this.body;
    }

    async text() {
        if (typeof this.body === 'string') {
            return this.body;
        }
        return JSON.stringify(this.body);
    }

    async blob() {
        return new Blob([await this.text()]);
    }

    async arrayBuffer() {
        const text = await this.text();
        const encoder = new TextEncoder();
        return encoder.encode(text).buffer;
    }

    clone() {
        return new MockResponse(this.body, {
            status: this.status,
            statusText: this.statusText,
            headers: Object.fromEntries(this.headers),
            url: this.url,
            type: this.type
        });
    }
}

class FetchMock {
    constructor() {
        this.reset();
    }

    reset() {
        // Abort all pending requests before clearing
        if (this.pendingRequests) {
            this.pendingRequests.forEach(({ controller }) => {
                if (controller && !controller.signal.aborted) {
                    controller.abort();
                }
            });
        }
        this.calls = [];
        this.responses = [];
        this.pendingRequests = [];
    }

    // Record a fetch call
    recordCall(url, options) {
        this.calls.push({ url, request: options });
    }

    // Get all recorded calls
    getCalls() {
        return this.calls;
    }

    // Get the last call
    getLastCall() {
        return this.calls[this.calls.length - 1];
    }

    // Mock a response for a specific URL pattern
    mockResponse(method, urlPattern, response, options = {}) {
        let upperCasedMethod = method.toUpperCase();
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].indexOf(upperCasedMethod) < 0) {
            throw Error("Invalid HTTP method: " + method)
        }
        if (typeof response === 'string') {
            let str = response;
            response = new MockResponse(str, options);
        }
        this.responses.push({
            method: upperCasedMethod,
            urlPattern: typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern,
            response,
            request: options,
            once: options.once || false,
            used: false
        });
    }

    // Mock a successful JSON response
    mockJsonResponse(method, urlPattern, data, status = 200) {
        this.mockResponse(method, urlPattern, new MockResponse(data, {
            status,
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    // Mock an error response
    mockErrorResponse(method, urlPattern, status = 500, message = 'Server Error') {
        this.mockResponse(method, urlPattern, new MockResponse({ error: message }, { status }));
    }

    // Mock a network error
    mockNetworkError(method, urlPattern, error = new Error('Network Error')) {
        this.mockResponse(method, urlPattern, Promise.reject(error));
    }

    // Mock a network failure (simpler alias)
    mockFailure(method, urlPattern, message = 'Network failure') {
        this.mockNetworkError(method, urlPattern, new Error(message));
    }

    // Find matching response
    findResponse(method, url) {
        for (let i = this.responses.length - 1; i >= 0; i--) {
            const mock = this.responses[i];
            if (mock.method === method && mock.urlPattern.test(url)) {
                if (mock.once) {
                    if (!mock.used) {
                        mock.used = true;
                        return typeof mock.response === 'function' ? mock.response() : mock.response;
                    }
                } else {
                    return typeof mock.response === 'function' ? mock.response() : mock.response;
                }
            }
        }
        console.error("no response configured for ", url, " available responses: ", this.responses);
        return "NO RESPONSE CONFIGURED FOR " + url;
    }

    // Wait for all pending requests to complete
    async waitForRequests() {
        if (this.pendingRequests.length === 0) {
            return Promise.resolve();
        }
        await Promise.all(this.pendingRequests.map(req => req.promise));
    }

    // The actual fetch mock function
    fetch(url, options = {}) {
        this.recordCall(url, options);
        options.method = options.method.toUpperCase()
        const response = this.findResponse(options.method, url);

        // Create an AbortController for this request
        const controller = new AbortController();

        // Create a tracking object for this request
        const pendingRequest = { controller, promise: null };

        // Create a promise to track this request
        const requestPromise = new Promise((resolve, reject) => {
            // Check if already aborted
            if (controller.signal.aborted) {
                reject(new DOMException('The operation was aborted', 'AbortError'));
                return;
            }

            // Listen for abort
            controller.signal.addEventListener('abort', () => {
                reject(new DOMException('The operation was aborted', 'AbortError'));
            });

            // Process the response
            Promise.resolve(response instanceof Promise ? response : response)
                .then(result => {
                    if (!controller.signal.aborted) {
                        resolve(result);
                    }
                })
                .catch(error => {
                    if (!controller.signal.aborted) {
                        reject(error);
                    }
                });
        })
        .finally(() => {
            // Remove from pending requests when done
            const index = this.pendingRequests.indexOf(pendingRequest);
            if (index > -1) {
                this.pendingRequests.splice(index, 1);
            }
        });

        // Store the promise in the tracking object
        pendingRequest.promise = requestPromise;

        // Track this pending request
        this.pendingRequests.push(pendingRequest);

        return requestPromise;
    }
}

// Create a global instance
const fetchMock = new FetchMock();

// Install the mock globally
function installFetchMock() {
    globalThis.fetch = fetchMock.fetch.bind(fetchMock);
}

// Uninstall the mock and restore original fetch
let originalFetch;
function uninstallFetchMock() {
    if (originalFetch) {
        globalThis.fetch = originalFetch;
    }
}

// Save original fetch before installing
if (typeof globalThis.fetch !== 'undefined') {
    originalFetch = globalThis.fetch;
}