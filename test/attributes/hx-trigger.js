describe("hx-trigger attribute", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('non-default value works', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var form = make('<form hx-get="/test" hx-trigger="click">Click Me!</form>');
        form.click();
        form.innerHTML.should.equal("Click Me!");
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('changed modifier works', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var input = make('<input hx-trigger="click changed" hx-target="#d1" hx-get="/test" value="foo"/>');
        var div = make('<div id="d1"></div>');
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.value = "bar";
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 2");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 2");
    });

    it('once modifier works', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var input = make('<input hx-trigger="click once" hx-target="#d1" hx-get="/test" value="foo"/>');
        var div = make('<div id="d1"></div>');
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.value = "bar";
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
    });

    it('polling works', function(complete)
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            if (requests > 5) {
                complete();
                // cancel polling with a
                xhr.respond(286, {}, "Requests: " + requests);
            } else {
                xhr.respond(200, {}, "Requests: " + requests);
            }
        });
        this.server.autoRespond = true;
        this.server.autoRespondAfter = 0;
        make('<div hx-trigger="every 10ms" hx-get="/test"/>');
    });


    it('non-default value works w/ data-* prefix', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var form = make('<form data-hx-get="/test" data-hx-trigger="click">Click Me!</form>');
        form.click();
        form.innerHTML.should.equal("Click Me!");
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('works with multiple events', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var div = make('<div hx-trigger="load,click" hx-get="/test">Requests: 0</div>');
        div.innerHTML.should.equal("Requests: 0");
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 2");
    });

    var specExamples = {
        "": [{trigger: 'click'}],
        "every 1s": [{trigger: 'every', pollInterval: 1000}],
        "click": [{trigger: 'click'}],
        "customEvent": [{trigger: 'customEvent'}],
        "event changed": [{trigger: 'event', changed: true}],
        "event once": [{trigger: 'event', once: true}],
        "event delay:1s": [{trigger: 'event', delay: 1000}],
        "event throttle:1s": [{trigger: 'event', throttle: 1000}],
        "event changed once delay:1s": [{trigger: 'event', changed: true, once: true, delay: 1000}],
        "event1,event2": [{trigger: 'event1'}, {trigger: 'event2'}],
        "event1, event2": [{trigger: 'event1'}, {trigger: 'event2'}],
        "event1 once, event2 changed": [{trigger: 'event1', once: true}, {trigger: 'event2', changed: true}],
        "event1,": [{trigger: 'event1'}],
        ",event1": [{trigger: 'event1'}],
        "  ": [{trigger: 'click'}],
        ",": [{trigger: 'click'}]
    }

    for (var specString in specExamples) {
        it("parses " + specString, function()
        {
            var div = make("<div hx-trigger=" + specString + "></div>");
            var spec = htmx._('getTriggerSpecs')(div);
            spec.should.deep.equal(specExamples[specString]);
        });
    }

    it('sets default trigger for forms', function()
    {
        var form = make('<form></form>');
        var spec = htmx._('getTriggerSpecs')(form);
        spec.should.deep.equal([{trigger: 'submit'}]);
    })

    it('sets default trigger for form elements', function()
    {
        var form = make('<input></input>');
        var spec = htmx._('getTriggerSpecs')(form);
        spec.should.deep.equal([{trigger: 'change'}]);
    })

})
