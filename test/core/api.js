describe("Core htmx API test", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('onLoad is called... onLoad', function(){
        // also tests on/off
        this.server.respondWith("GET", "/test", "<div id='d1' hx-get='/test'></div>")
        var helper = htmx.onLoad(function (elt) {
            elt.setAttribute("foo", "bar");
        });
        try {
            var div = make("<div id='d1' hx-get='/test' hx-swap='outerHTML'></div>");
            div.click();
            this.server.respond();
            byId("d1").getAttribute("foo").should.equal("bar");
        } finally {
            htmx.off("htmx:load", helper);
        }
    });

    it('triggers properly', function () {
        var div = make("<div/>");
        var myEventCalled = false;
        var detailStr = "";
        htmx.on("myEvent", function(evt){
            myEventCalled = true;
            detailStr = evt.detail.str;
        })
        htmx.trigger(div, "myEvent", {str:"foo"})

        myEventCalled.should.equal(true);
        detailStr.should.equal("foo");
    });

    it('triggers properly w/ selector', function () {
        var div = make("<div id='div1'/>");
        var myEventCalled = false;
        var detailStr = "";
        htmx.on("myEvent", function(evt){
            myEventCalled = true;
            detailStr = evt.detail.str;
        })
        htmx.trigger("#div1", "myEvent", {str:"foo"})

        myEventCalled.should.equal(true);
        detailStr.should.equal("foo");
    });

    it('triggers with no details properly', function () {
        var div = make("<div/>");
        var myEventCalled = false;
        htmx.on("myEvent", function(evt){
            myEventCalled = true;
        })
        htmx.trigger(div, "myEvent")
        myEventCalled.should.equal(true);
    });

    it('should find properly', function(){
        var div = make("<div id='d1' class='c1 c2'>");
        div.should.equal(htmx.find("#d1"));
        div.should.equal(htmx.find(".c1"));
        div.should.equal(htmx.find(".c2"));
        div.should.equal(htmx.find(".c1.c2"));
    });

    it('should find properly from elt', function(){
        var div = make("<div><a id='a1'></a><a id='a2'></a></div>");
        htmx.find(div, "a").id.should.equal('a1');
    });

    it('should find all properly', function(){
        var div = make("<div class='c1 c2 c3'><div class='c1 c2'><div class='c1'>");
        htmx.findAll(".c1").length.should.equal(3);
        htmx.findAll(".c2").length.should.equal(2);
        htmx.findAll(".c3").length.should.equal(1);
    });

    it('should find all properly from elt', function(){
        var div = make("<div><div class='c1 c2 c3'><div class='c1 c2'><div class='c1'></div>");
        htmx.findAll(div, ".c1").length.should.equal(3);
        htmx.findAll(div, ".c2").length.should.equal(2);
        htmx.findAll(div,".c3").length.should.equal(1);
    });

    it('should find closest element properly', function () {
        var div = make("<div><a id='a1'></a><a id='a2'></a></div>");
        var a = htmx.find(div, "a");
        htmx.closest(a, "div").should.equal(div);
    });

    it('should remove element properly', function () {
        var div = make("<div><a></a></div>");
        var a = htmx.find(div, "a");
        htmx.remove(a);
        div.innerHTML.should.equal("");
    });

    it('should remove element properly w/ selector', function () {
        var div = make("<div><a id='a1'></a></div>");
        var a = htmx.find(div, "a");
        htmx.remove("#a1");
        div.innerHTML.should.equal("");
    });

    it('should add class properly', function () {
        var div = make("<div></div>");
        div.classList.contains("foo").should.equal(false);
        htmx.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
    });


    it('should add class properly w/ selector', function () {
        var div = make("<div id='div1'></div>");
        div.classList.contains("foo").should.equal(false);
        htmx.addClass("#div1", "foo");
        div.classList.contains("foo").should.equal(true);
    });

    it('should add class properly after delay', function (done) {
        var div = make("<div></div>");
        div.classList.contains("foo").should.equal(false);
        htmx.addClass(div, "foo", 10);
        div.classList.contains("foo").should.equal(false);
        setTimeout(function () {
            div.classList.contains("foo").should.equal(true);
            done();
        }, 20);
    });

    it('should remove class properly', function () {
        var div = make("<div></div>");
        htmx.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        htmx.removeClass(div, "foo");
        div.classList.contains("foo").should.equal(false);
    });

    it('should remove class properly w/ selector', function () {
        var div = make("<div id='div1'></div>");
        htmx.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        htmx.removeClass("#div1", "foo");
        div.classList.contains("foo").should.equal(false);
    });

    it('should add class properly after delay', function (done) {
        var div = make("<div></div>");
        htmx.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        htmx.removeClass(div, "foo", 10);
        div.classList.contains("foo").should.equal(true);
        setTimeout(function () {
            div.classList.contains("foo").should.equal(false);
            done();
        }, 20);
    });

    it('should toggle class properly', function () {
        var div = make("<div></div>");
        div.classList.contains("foo").should.equal(false);
        htmx.toggleClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        htmx.toggleClass(div, "foo");
        div.classList.contains("foo").should.equal(false);
    });

    it('should toggle class properly w/ selector', function () {
        var div = make("<div id='div1'></div>");
        div.classList.contains("foo").should.equal(false);
        htmx.toggleClass("#div1", "foo");
        div.classList.contains("foo").should.equal(true);
        htmx.toggleClass("#div1", "foo");
        div.classList.contains("foo").should.equal(false);
    });

    it('should take class properly', function () {
        var div1 = make("<div></div>");
        var div2 = make("<div></div>");
        var div3 = make("<div></div>");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(false);

        htmx.takeClass(div1, "foo");

        div1.classList.contains("foo").should.equal(true);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(false);

        htmx.takeClass(div2, "foo");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(true);
        div3.classList.contains("foo").should.equal(false);

        htmx.takeClass(div3, "foo");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(true);
    });

    it('should take class properly w/ selector', function () {
        var div1 = make("<div id='div1'></div>");
        var div2 = make("<div id='div2'></div>");
        var div3 = make("<div id='div3'></div>");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(false);

        htmx.takeClass("#div1", "foo");

        div1.classList.contains("foo").should.equal(true);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(false);

        htmx.takeClass("#div2", "foo");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(true);
        div3.classList.contains("foo").should.equal(false);

        htmx.takeClass("#div3", "foo");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(true);
    });

    it('logAll works', function () {
        var initialLogger = htmx.config.logger
        try {
            htmx.logAll();
        } finally {
            htmx.config.logger = initialLogger;
        }
    });

    it('eval can be suppressed', function () {
        var calledEvent = false;
        var handler = htmx.on("htmx:evalDisallowedError", function(){
            calledEvent = true;
        });
        try {
            htmx.config.allowEval = false;
            should.equal(htmx._("tokenizeString"), undefined);
        } finally {
            htmx.config.allowEval = true;
            htmx.off("htmx:evalDisallowedError", handler);
        }
        calledEvent.should.equal(true);
    });

    it('ajax api works', function()
    {
        this.server.respondWith("GET", "/test", "foo!");
        var div = make("<div></div>");
        htmx.ajax("GET", "/test", div)
        this.server.respond();
        div.innerHTML.should.equal("foo!");
    });

    it('ajax api works by ID', function()
    {
        this.server.respondWith("GET", "/test", "foo!");
        var div = make("<div id='d1'></div>");
        htmx.ajax("GET", "/test", "#d1")
        this.server.respond();
        div.innerHTML.should.equal("foo!");
    });

    it('ajax returns a promise', function(done)
    {
        this.server.respondWith("GET", "/test", "foo!");
        var div = make("<div id='d1'></div>");
        var promise = htmx.ajax("GET", "/test", "#d1");
        this.server.respond();
        div.innerHTML.should.equal("foo!");
        promise.then(function(){
            done();
        })
    });



})
