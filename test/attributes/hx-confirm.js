describe("hx-confirm attribute", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('prompts using window.confirm when hx-confirm is set', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var confirm = sinon.stub(window, "confirm");
        confirm.returns(true);
        try {
            var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
            btn.click();
            confirm.calledOnce.should.equal(true);
            this.server.respond();
            btn.innerHTML.should.equal("Clicked!");
        } finally {
            confirm.restore()
        }
    })

    it('stops the request if confirm is cancelled', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var confirm = sinon.stub(window, "confirm");
        confirm.returns(false);
        try {
            var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
            btn.click();
            confirm.calledOnce.should.equal(true);
            this.server.respond();
            btn.innerHTML.should.equal("Click Me!");
        } finally {
            confirm.restore()
        }
    })

    it('uses the value of hx-confirm as the prompt', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var confirm = sinon.stub(window, "confirm");
        confirm.returns(false);
        try {
            var btn = make('<button hx-get="/test" hx-confirm="Sure?">Click Me!</button>')
            btn.click();
            confirm.firstCall.args[0].should.equal("Sure?");
            this.server.respond();
            btn.innerHTML.should.equal("Click Me!");
        } finally {
            confirm.restore()
        }
    })

    it('should prompt when htmx:confirm handler calls issueRequest', function () {
        var confirm = sinon.stub(window, "confirm");
        try {
            var btn = make('<button hx-get="/test" hx-confirm="Surely?">Click Me!</button>')
            var handler = htmx.on("htmx:confirm", function (evt) {
                evt.preventDefault();
                evt.detail.issueRequest();
            });
            btn.click();
            confirm.calledOnce.should.equal(true);
        } finally {
            htmx.off("htmx:confirm", handler);
        }
    })

    it('should include the question in htmx:confirm event', function () {
        var stub = sinon.stub();
        try {
            var btn = make('<button hx-get="/test" hx-confirm="Surely?">Click Me!</button>')
            var handler = htmx.on("htmx:confirm", stub);
            btn.click();
            stub.calledOnce.should.equal(true);
            stub.firstCall.args[0].detail.should.have.property("question", "Surely?");
        } finally {
            htmx.off("htmx:confirm", handler);
        }
    })


});