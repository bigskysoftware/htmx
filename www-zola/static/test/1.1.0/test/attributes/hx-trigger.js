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
        div.innerHTML.should.equal("");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("");
        input.value = "bar";
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Requests: 1");
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

    it('once modifier works with multiple triggers', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var input = make('<input hx-trigger="click once, foo" hx-target="#d1" hx-get="/test" value="foo"/>');
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
        htmx.trigger(input, "foo");
        this.server.respond();
        div.innerHTML.should.equal("Requests: 2");
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

    it("parses spec strings", function()
    {
        var specExamples = {
            "": [{trigger: 'click'}],
            "every 1s": [{trigger: 'every', pollInterval: 1000}],
            "click": [{trigger: 'click'}],
            "customEvent": [{trigger: 'customEvent'}],
            "event changed": [{trigger: 'event', changed: true}],
            "event once": [{trigger: 'event', once: true}],
            "event delay:1s": [{trigger: 'event', delay: 1000}],
            "event throttle:1s": [{trigger: 'event', throttle: 1000}],
            "event delay:1s, foo": [{trigger: 'event', delay: 1000}, {trigger: 'foo'}],
            "event throttle:1s, foo": [{trigger: 'event', throttle: 1000}, {trigger: 'foo'}],
            "event changed once delay:1s": [{trigger: 'event', changed: true, once: true, delay: 1000}],
            "event1,event2": [{trigger: 'event1'}, {trigger: 'event2'}],
            "event1, event2": [{trigger: 'event1'}, {trigger: 'event2'}],
            "event1 once, event2 changed": [{trigger: 'event1', once: true}, {trigger: 'event2', changed: true}],
            "event1,": [{trigger: 'event1'}],
            "  ": [{trigger: 'click'}],
        }

        for (var specString in specExamples) {
            var div = make("<div hx-trigger='" + specString + "'></div>");
            var spec = htmx._('getTriggerSpecs')(div);
            spec.should.deep.equal(specExamples[specString], "Found : " + JSON.stringify(spec) + ", expected : " + JSON.stringify(specExamples[specString]) + " for spec: " + specString);
        }
    });

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

    it('filters properly with false filter spec', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var form = make('<form hx-get="/test" hx-trigger="evt[foo]">Not Called</form>');
        form.click();
        form.innerHTML.should.equal("Not Called");
        var event = htmx._("makeEvent")('evt');
        form.dispatchEvent(event);
        this.server.respond();
        form.innerHTML.should.equal("Not Called");
    })

    it('filters properly with true filter spec', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var form = make('<form hx-get="/test" hx-trigger="evt[foo]">Not Called</form>');
        form.click();
        form.innerHTML.should.equal("Not Called");
        var event = htmx._("makeEvent")('evt');
        event.foo = true;
        form.dispatchEvent(event);
        this.server.respond();
        form.innerHTML.should.equal("Called!");
    })

    it('filters properly compound filter spec', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var div = make('<div hx-get="/test" hx-trigger="evt[foo&&bar]">Not Called</div>');
        var event = htmx._("makeEvent")('evt');
        event.foo = true;
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Not Called");
        event.bar = true;
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Called!");
    })

    it('can refer to target element in condition', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var div = make('<div hx-get="/test" hx-trigger="evt[target.classList.contains(\'doIt\')]">Not Called</div>');
        var event = htmx._("makeEvent")('evt');
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Not Called");
        div.classList.add("doIt");
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Called!");
    })

    it('can refer to target element in condition w/ equality', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var div = make('<div hx-get="/test" hx-trigger="evt[target.id==\'foo\']">Not Called</div>');
        var event = htmx._("makeEvent")('evt');
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Not Called");
        div.id = "foo";
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Called!");
    })

    it('negative condition', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var div = make('<div hx-get="/test" hx-trigger="evt[!target.classList.contains(\'disabled\')]">Not Called</div>');
        div.classList.add("disabled");
        var event = htmx._("makeEvent")('evt');
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Not Called");
        div.classList.remove("disabled");
        div.dispatchEvent(event);
        this.server.respond();
        div.innerHTML.should.equal("Called!");
    })

    it('global function call works', function(){
        window.globalFun = function(evt) {
            return evt.bar;
        }
        try {
            this.server.respondWith("GET", "/test", "Called!");
            var div = make('<div hx-get="/test" hx-trigger="evt[globalFun(event)]">Not Called</div>');
            var event = htmx._("makeEvent")('evt');
            event.bar = false;
            div.dispatchEvent(event);
            this.server.respond();
            div.innerHTML.should.equal("Not Called");
            event.bar = true;
            div.dispatchEvent(event);
            this.server.respond();
            div.innerHTML.should.equal("Called!");
        } finally {
            delete window.globalFun;
        }
    })

    it('global property event filter works', function(){
        window.foo =  {
            bar:false
        }
        try {
            this.server.respondWith("GET", "/test", "Called!");
            var div = make('<div hx-get="/test" hx-trigger="evt[foo.bar]">Not Called</div>');
            var event = htmx._("makeEvent")('evt');
            div.dispatchEvent(event);
            this.server.respond();
            div.innerHTML.should.equal("Not Called");
            foo.bar = true;
            div.dispatchEvent(event);
            this.server.respond();
            div.innerHTML.should.equal("Called!");
        } finally {
            delete window.foo;
        }
    })

    it('global variable filter works', function(){
        try {
            this.server.respondWith("GET", "/test", "Called!");
            var div = make('<div hx-get="/test" hx-trigger="evt[foo]">Not Called</div>');
            var event = htmx._("makeEvent")('evt');
            div.dispatchEvent(event);
            this.server.respond();
            div.innerHTML.should.equal("Not Called");
            foo = true;
            div.dispatchEvent(event);
            this.server.respond();
            div.innerHTML.should.equal("Called!");
        } finally {
            delete window.foo;
        }
    })

    it('bad condition issues error', function(){
        this.server.respondWith("GET", "/test", "Called!");
        var div = make('<div hx-get="/test" hx-trigger="evt[a.b]">Not Called</div>');
        var errorEvent = null;
        var handler = htmx.on("htmx:eventFilter:error", function (event) {
            errorEvent = event;
        });
        try {
            var event = htmx._("makeEvent")('evt');
            div.dispatchEvent(event);
            should.not.equal(null, errorEvent);
            should.not.equal(null, errorEvent.detail.source);
            console.log(errorEvent.detail.source);
        } finally {
            htmx.off("htmx:eventFilter:error", handler);
        }
    })

    it('from clause works', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var div2 = make('<div id="d2"></div>');
        var div1 = make('<div hx-trigger="click from:#d2" hx-get="/test">Requests: 0</div>');
        div1.innerHTML.should.equal("Requests: 0");
        div1.click();
        this.server.respond();
        div1.innerHTML.should.equal("Requests: 0");
        div2.click();
        this.server.respond();
        div1.innerHTML.should.equal("Requests: 1");
    });

    it('from clause works with body selector', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var div1 = make('<div hx-trigger="click from:body" hx-get="/test">Requests: 0</div>');
        div1.innerHTML.should.equal("Requests: 0");
        document.body.click();
        this.server.respond();
        div1.innerHTML.should.equal("Requests: 1");
    });

    it('multiple triggers with from clauses mixed in work', function()
    {
        var requests = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            requests++;
            xhr.respond(200, {}, "Requests: " + requests);
        });
        var div2 = make('<div id="d2"></div>');
        var div1 = make('<div hx-trigger="click from:#d2, click" hx-get="/test">Requests: 0</div>');
        div1.innerHTML.should.equal("Requests: 0");
        div1.click();
        this.server.respond();
        div1.innerHTML.should.equal("Requests: 1");
        div2.click();
        this.server.respond();
        div1.innerHTML.should.equal("Requests: 2");
    });

})
