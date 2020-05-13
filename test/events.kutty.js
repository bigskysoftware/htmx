describe("kutty Events", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("writes the tests for events", function () {
        //TODO event testing
    });
});

