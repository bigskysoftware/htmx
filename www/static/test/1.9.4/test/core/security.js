describe("security options", function() {

    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it("can disable a single elt", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-disable hx-get="/test">Initial</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Initial");
    })

    it("can disable a parent elt", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        var div = make('<div hx-disable><button id="b1" hx-get="/test">Initial</button></div>')
        var btn = byId("b1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Initial");
    })

    it("can disable a single elt dynamically", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button id="b1" hx-get="/test">Initial</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");

        this.server.respondWith("GET", "/test", "Clicked a second time");

        btn.setAttribute("hx-disable", "")
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    })

    it("can disable a single elt dynamically & enable it back", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button id="b1" hx-get="/test">Initial</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");

        this.server.respondWith("GET", "/test", "Clicked a second time");

        btn.setAttribute("hx-disable", "")
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");

        btn.removeAttribute("hx-disable")
        htmx.process(btn)
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked a second time");
    })

    it("can disable a single parent elt dynamically", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        var div = make('<div><button id="b1" hx-get="/test">Initial</button></div>')
        var btn = byId("b1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");

        this.server.respondWith("GET", "/test", "Clicked a second time");

        div.setAttribute("hx-disable", "")
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    })

    it("can disable a single parent elt dynamically & enable it back", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        var div = make('<div><button id="b1" hx-get="/test">Initial</button></div>')
        var btn = byId("b1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");

        this.server.respondWith("GET", "/test", "Clicked a second time");

        div.setAttribute("hx-disable", "")
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");

        div.removeAttribute("hx-disable")
        htmx.process(div)
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked a second time");
    })
});