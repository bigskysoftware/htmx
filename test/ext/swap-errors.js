describe("swap-error extension", function () {
  beforeEach(function () {
    this.server = makeServer();
    clearWorkArea();
  });
  afterEach(function () {
    this.server.restore();
    clearWorkArea();
  });

  it(" test les erreursr", function () {
    this.server.respondWith("GET", "/test", function (xhr) {
      xhr.respond(400, { "HX-SWAP-ERRORS": 1 }, "SWAPPED");
    });
    var btn = make(
      '<button hx-get="/test" hx-ext="swap-errors">Click Me!</button>'
    );
    btn.click();
    this.server.respond();
    btn.innerHTML.should.equal("SWAPPED");
  });
});
