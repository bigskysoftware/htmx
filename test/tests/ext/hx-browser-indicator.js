describe("hx-browser-indicator extension", function () {
  let extBackup;

  before(async () => {
    extBackup = backupExtensions();
    clearExtensions();
    htmx.config.extensions = "browser-indicator";
    htmx.__approvedExt = "browser-indicator";

    let script = document.createElement("script");
    script.src = "../src/ext/hx-browser-indicator.js";
    await new Promise((resolve) => {
      script.onload = resolve;
      document.head.appendChild(script);
    });
  });

  after(() => {
    restoreExtensions(extBackup);
  });

  beforeEach(() => {
    setupTest(this.currentTest);
  });

  afterEach(() => {
    htmx.config.boostBrowserIndicator = false;
    cleanupTest();
  });

  it("preserves the current entry history state across the indicator (per-element)", async function () {
    history.replaceState({ htmx: true, sentinel: 42 }, "");
    mockResponse("GET", "/page2", "loaded");
    let btn = createProcessedHTML(
      '<button hx-get="/page2" hx-target="this" hx-browser-indicator="true">go</button>',
    );
    btn.click();
    await forRequest();
    assert.deepEqual(history.state, { htmx: true, sentinel: 42 });
  });

  it("preserves the current entry history state across the indicator (boosted)", async function () {
    htmx.config.boostBrowserIndicator = true;
    history.replaceState({ htmx: true, sentinel: 7 }, "");
    mockResponse("GET", "/page2", "loaded");
    createProcessedHTML(
      '<div hx-target:inherited="this" hx-swap:inherited="innerHTML" hx-boost:inherited="true"><a id="a1" href="/page2" hx-push-url="false">go</a></div>',
    );
    find("#a1").click();
    await forRequest();
    assert.deepEqual(history.state, { htmx: true, sentinel: 7 });
  });
});
