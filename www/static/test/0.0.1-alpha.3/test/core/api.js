describe("Core kutty API test", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('version is correct', function(){
      kutty.version.should.equal("0.0.1");
    });

    it('onLoad is called... onLoad', function(){
        // also tests on/off
        this.server.respondWith("GET", "/test", "<div id='d1' kt-get='/test'></div>")
        var helper = kutty.onLoad(function (elt) {
            elt.setAttribute("foo", "bar");
        });
        try {
            var div = make("<div id='d1' kt-get='/test' kt-swap='outerHTML'></div>");
            div.click();
            this.server.respond();
            byId("d1").getAttribute("foo").should.equal("bar");
        } finally {
            kutty.off("load.kutty", helper);
        }
    });

    it('triggers properly', function () {
        var div = make("<div/>");
        var myEventCalled = false;
        var detailStr = "";
        kutty.on("myEvent", function(evt){
            myEventCalled = true;
            detailStr = evt.detail.str;
        })
        kutty.trigger(div, "myEvent", {str:"foo"})

        myEventCalled.should.equal(true);
        detailStr.should.equal("foo");
    });

    it('should find properly', function(){
        var div = make("<div id='d1' class='c1 c2'>");
        div.should.equal(kutty.find("#d1"));
        div.should.equal(kutty.find(".c1"));
        div.should.equal(kutty.find(".c2"));
        div.should.equal(kutty.find(".c1.c2"));
    });

    it('should find properly from elt', function(){
        var div = make("<div><a id='a1'></a><a id='a2'></a></div>");
        kutty.find(div, "a").id.should.equal('a1');
    });

    it('should find all properly', function(){
        var div = make("<div class='c1 c2 c3'><div class='c1 c2'><div class='c1'>");
        kutty.findAll(".c1").length.should.equal(3);
        kutty.findAll(".c2").length.should.equal(2);
        kutty.findAll(".c3").length.should.equal(1);
    });

    it('should find all properly from elt', function(){
        var div = make("<div><div class='c1 c2 c3'><div class='c1 c2'><div class='c1'></div>");
        kutty.findAll(div, ".c1").length.should.equal(3);
        kutty.findAll(div, ".c2").length.should.equal(2);
        kutty.findAll(div,".c3").length.should.equal(1);
    });

    it('should find closest element properly', function () {
        var div = make("<div><a id='a1'></a><a id='a2'></a></div>");
        var a = kutty.find(div, "a");
        kutty.closest(a, "div").should.equal(div);
    });

    it('should remove element properly', function () {
        var div = make("<div><a></a></div>");
        var a = kutty.find(div, "a");
        kutty.remove(a);
        div.innerHTML.should.equal("");
    });

    it('should add class properly', function () {
        var div = make("<div></div>");
        div.classList.contains("foo").should.equal(false);
        kutty.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
    });

    it('should add class properly after delay', function (done) {
        var div = make("<div></div>");
        div.classList.contains("foo").should.equal(false);
        kutty.addClass(div, "foo", 10);
        div.classList.contains("foo").should.equal(false);
        setTimeout(function () {
            div.classList.contains("foo").should.equal(true);
            done();
        }, 20);
    });

    it('should remove class properly', function () {
        var div = make("<div></div>");
        kutty.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        kutty.removeClass(div, "foo");
        div.classList.contains("foo").should.equal(false);
    });

    it('should add class properly after delay', function (done) {
        var div = make("<div></div>");
        kutty.addClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        kutty.removeClass(div, "foo", 10);
        div.classList.contains("foo").should.equal(true);
        setTimeout(function () {
            div.classList.contains("foo").should.equal(false);
            done();
        }, 20);
    });

    it('should toggle class properly', function () {
        var div = make("<div></div>");
        div.classList.contains("foo").should.equal(false);
        kutty.toggleClass(div, "foo");
        div.classList.contains("foo").should.equal(true);
        kutty.toggleClass(div, "foo");
        div.classList.contains("foo").should.equal(false);
    });

    it('should take class properly', function () {
        var div1 = make("<div></div>");
        var div2 = make("<div></div>");
        var div3 = make("<div></div>");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(false);

        kutty.takeClass(div1, "foo");

        div1.classList.contains("foo").should.equal(true);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(false);

        kutty.takeClass(div2, "foo");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(true);
        div3.classList.contains("foo").should.equal(false);

        kutty.takeClass(div3, "foo");

        div1.classList.contains("foo").should.equal(false);
        div2.classList.contains("foo").should.equal(false);
        div3.classList.contains("foo").should.equal(true);
    });


})
