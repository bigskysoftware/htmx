describe("server-sent-events extension", function () {
  beforeEach(function () {
    this.server = makeServer();
    clearWorkArea();
  });
  this.afterEach(function () {
    clearWorkArea();
  });

  xit("reuses eventsources");

  xit("newly swapped elements attach to existing event sources");
})
