describe("Core kutty Regression Tests", function(){

    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('SVGs process properly in IE11', function()
    {
        var btn = make('<svg onclick="document.getElementById(\'contents\').classList.toggle(\'show\')" class="hamburger" viewBox="0 0 100 80" width="25" height="25" style="margin-bottom:-5px">\n' +
            '<rect width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>\n' +
            '<rect y="30" width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>\n' +
            '<rect y="60" width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>\n' +
            '</svg>')
    });

    it ('Handles https://github.com/bigskysoftware/kutty/issues/4 properly', function() {
        this.server.respondWith("GET", "/index2a.php",
            "<div id='message' kt-swap-oob='true'>I came from message oob swap I should be second</div>" +
            "<div id='message2' kt-swap-oob='true'>I came from a message2 oob swap I should be third  but I am in the wrong spot</div>" +
            "I'm page2 content (non-swap) I should be first")

        var h1 = make("<h1 kt-get='/index2a.php' kt-target='#page2' kt-trigger='click'>Kutty CLICK ME</h1>" +
            "<div id='page2' ></div>" +
            "<div id='message'></div>" +
            "<div id='message2'></div>")
        h1.click();
        this.server.respond();
        kutty.find("#page2").innerHTML.should.equal("I'm page2 content (non-swap) I should be first")
        kutty.find("#message").innerHTML.should.equal("I came from message oob swap I should be second")
        kutty.find("#message2").innerHTML.should.equal("I came from a message2 oob swap I should be third  but I am in the wrong spot")
    });

})
