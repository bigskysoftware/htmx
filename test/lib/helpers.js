if (typeof installFetchMock !== 'undefined') {
  installFetchMock()
}

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

// can be enabled for a test by calling debug(this)
let testDebugging = false;

// Helper to initialize content in test playground
function initHTML(innerHTML) {
  let pg = playground();
  if (pg) {
    pg.innerHTML = innerHTML
    htmx.process(pg)
  }
  return pg.childNodes[0]
}

function cleanupTest() {
  let pg = playground()
  if (pg && !testDebugging) {
    pg.innerHTML = ''
  }
  testDebugging = false;
  if (typeof fetchMock !== 'undefined' && fetchMock.reset) {
    fetchMock.reset()
  }
  history.replaceState(null, '', savedUrl);
}

function mockResponse(action, pattern, response) {
  fetchMock.mockResponse(action, pattern, response);
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

function waitForEvent(eventName, timeout = 2000) {
  return htmx.forEvent(eventName, testDebugging ? 0 : timeout);
}

function htmxSwappedEvent() {
  return waitForEvent("htmx:after:swap");
}

function playground() {
  return htmx.find("#test-playground");
}

function findElt(selector) {
  return htmx.find(selector, playground())
}

function invokeAction(cssOrElt, action) {
  let elt;
  if (typeof cssOrElt === "string") {
    elt = findElt(cssOrElt);
  } else {
    elt = cssOrElt
  }
  if (!elt) {
    assert.fail("Could not find element to " + action + " with css '" + cssOrElt + "' in :\n\n" + playground().innerHTML + "\n\n")
  }
  elt[action]();
}

async function clickAndWait(cssOrElt) {
  invokeAction(cssOrElt, "click");
  await htmxSwappedEvent()
}

function click(cssOrElt) {
  invokeAction(cssOrElt, "click");
}

async function submitAndWait(cssOrElt) {
  invokeAction(cssOrElt, "requestSubmit");
  await htmxSwappedEvent()
}

function submit(cssOrElt) {
  invokeAction(cssOrElt, "requestSubmit");
}

function debug(test) {
  test.timeout(0);
  testDebugging = true;
}

function lastFetch() {
  let lastCall = fetchMock.getLastCall();
  assert.isNotNull(lastCall, "No fetch call was made!")
  return lastCall;
}

// TODO - use the playground here
function parseHTML(html, appendToBody = false) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const elt = div.firstElementChild;
  if (appendToBody) {
    document.body.appendChild(elt);
  }
  return elt;
}

// ==============================================================================
// Assertion Helpers
// ==============================================================================

function assertPropertyIs(css, property, content) {
  let elt = findElt(css);
  if (!elt) {
    assert.fail("Could not find element with css '" + css + "' in :\n\n" + playground().innerHTML + "\n\n")
  }
  assert.equal(elt[property], content)
}

function assertTextContentIs(css, content) {
  assertPropertyIs(css, 'textContent', content)
}
