if (typeof installFetchMock !== 'undefined') {
  installFetchMock()
}

//================================================================================
// Code to prevent accidental navigation
//================================================================================

let linkNavPreventer = (e) => {
  let anchor = e.target.closest('a');

  if (!anchor || !anchor.href) return;
  if (e.defaultPrevented) return;
  if (e.button !== 0) return; // Not left click
  if (e.ctrlKey || e.metaKey || e.shiftKey) return; // Modifier keys
  if (anchor.download) return;
  if (anchor.href.startsWith('javascript:')) return;
  if (anchor.href.startsWith('#')) return; // Hash only

  e.preventDefault();
  console.warn('Navigation prevented:', anchor.href, new Error().stack);
};

let submitPreventer = (e) => {
  if (e.defaultPrevented) return;
  e.preventDefault();
  console.warn('Form submission prevented:', e, new Error().stack);
};

//================================================================================
// Test life cycle helpers
//================================================================================

// can be enabled for a test by calling debug(this)
let testDebugging = false;

const savedUrl = window.location.href;

function setupTest(test) {
  if (test) {
    console.log("RUNNING TEST: ", test.title);
  }
  if (!playground().hasAttribute("data-is-navsafe")) {
    // Catch anchor navigations
    playground().addEventListener('click', linkNavPreventer);
    // Catch form submissions
    playground().addEventListener('submit', submitPreventer);
    playground().setAttribute("data-is-navsafe", 'true')
  }
}

function cleanupTest() {
    let pg = playground()
    if (pg && !testDebugging) {
        pg.innerHTML = ''
    }
    testDebugging = false;
    if (typeof fetchMock !== 'undefined' && fetchMock.reset) {
        // Check for pending requests before cleaning up
        if (fetchMock.pendingRequests && fetchMock.pendingRequests.length > 0) {
            console.warn(`WARNING: Test is leaving ${fetchMock.pendingRequests.length} request(s) in flight. Tests should wait for all requests to complete.`);
        }
        fetchMock.reset()
    }
    history.replaceState(null, '', savedUrl);
}

function debug(test) {
    test.timeout(0);
    testDebugging = true;
}

//================================================================================
// HTML creation helpers
//================================================================================

// This function processes the content immediately (rather than waiting for the mutation observer)
// Prefer using this function for testing!
function createProcessedHTML(innerHTML) {
  let pg = playground();
  if (pg) {
    pg.innerHTML = innerHTML
    htmx.process(pg)
  }
  return pg.childNodes[0]
}

// This function waits for the mutation observer to process the new content
function createHTMLNoProcessing(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const elt = div.firstElementChild;
    playground().appendChild(elt);
    return elt
}

// This function creates a disconnected node
function createDisconnectedHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const elt = div.firstElementChild;
    return elt
}

//================================================================================
// Fetch mock response helpers
//================================================================================

function mockResponse(action, pattern, response, options = {}) {
  fetchMock.mockResponse(action, pattern, response, options);
}

function mockFailure(action, pattern, message = 'Network failure') {
  fetchMock.mockFailure(action, pattern, message);
}

function mockStreamResponse(url) {
  const controllers = [];
  const enc = new TextEncoder();

  // Return a fresh stream each time the URL is fetched
  fetchMock.mockResponse('GET', url, () => {
    let ctrl;
    const body = new ReadableStream({ start(c) { ctrl = c; controllers.push(c); } });
    const response = new MockResponse(body, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
    response.body = body;
    return response;
  });

  return {
    send(data, event, id) {
      // Send to the most recent active controller
      const ctrl = controllers[controllers.length - 1];
      if (!ctrl) return;
      let msg = (event ? `event: ${event}\n` : '') + (id ? `id: ${id}\n` : '') + `data: ${data}\n\n`;
      ctrl.enqueue(enc.encode(msg));
    },
    close: () => {
      // Close the most recent controller
      const ctrl = controllers[controllers.length - 1];
      if (ctrl) ctrl.close();
    },
    error: (e) => {
      const ctrl = controllers[controllers.length - 1];
      if (ctrl) ctrl.error(e);
    }
  };
}

function lastFetch() {
    let lastCall = fetchMock.getLastCall();
    assert.isNotNull(lastCall, "No fetch call was made!")
    return lastCall;
}

//======================================================================
// General test helper utilities
//======================================================================

function waitForEvent(eventName, timeout = 200) {
  return htmx.forEvent(eventName, testDebugging ? 0 : timeout);
}

function forRequest(timeout = 200) {
  return waitForEvent("htmx:finally:request", timeout);
}

function playground() {
  return htmx.find("#test-playground");
}

function find(selector) {
  return htmx.find(playground(), selector)
}

// ==============================================================================
// Assertion Helpers
// ==============================================================================

function assertPropertyIs(css, property, content) {
  let elt = find(css);
  if (!elt) {
    assert.fail("Could not find element with css '" + css + "' in :\n\n" + playground().innerHTML + "\n\n")
  }
  assert.equal(elt[property], content)
}

function assertTextContentIs(css, content) {
  assertPropertyIs(css, 'textContent', content)
}
