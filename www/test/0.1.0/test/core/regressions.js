describe("Core htmx Regression Tests", function(){

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

    it ('Handles https://github.com/bigskysoftware/htmx/issues/4 properly', function() {
        this.server.respondWith("GET", "/index2a.php",
            "<div id='message' hx-swap-oob='true'>I came from message oob swap I should be second</div>" +
            "<div id='message2' hx-swap-oob='true'>I came from a message2 oob swap I should be third  but I am in the wrong spot</div>" +
            "I'm page2 content (non-swap) I should be first")

        var h1 = make("<h1 hx-get='/index2a.php' hx-target='#page2' hx-trigger='click'>Kutty CLICK ME</h1>" +
            "<div id='page2' ></div>" +
            "<div id='message'></div>" +
            "<div id='message2'></div>")
        h1.click();
        this.server.respond();
        htmx.find("#page2").innerHTML.should.equal("I'm page2 content (non-swap) I should be first")
        htmx.find("#message").innerHTML.should.equal("I came from message oob swap I should be second")
        htmx.find("#message2").innerHTML.should.equal("I came from a message2 oob swap I should be third  but I am in the wrong spot")
    });

    it ('Handles https://github.com/bigskysoftware/htmx/issues/33 "empty values" properly', function() {
        this.server.respondWith("POST", "/htmx.php", function (xhr) {
            xhr.respond(200, {}, xhr.requestBody);
        });

        var form = make('<form hx-trigger="click" hx-post="/htmx.php">\n' +
            '<input type="text" name="variable" value="">\n' +
            '<button type="submit">Submit</button>\n' +
            '</form>')
        form.click();
        this.server.respond();
        form.innerHTML.should.equal("variable=")
    });

    it ('name=id doesnt cause an error', function(){
        this.server.respondWith("GET", "/test", "Foo<form><input name=\"id\"/></form>")
        var div = make('<div hx-get="/test">Get It</div>')
        div.click();
        this.server.respond();
        div.innerText.should.contain("Foo")
    });

    it ('empty id doesnt cause an error', function(){
        this.server.respondWith("GET", "/test", "Foo\n<div id=''></div>")
        var div = make('<div hx-get="/test">Get It</div>')
        div.click();
        this.server.respond();
        div.innerText.should.contain("Foo")
    });
    
    it ('id with dot in value doesnt cause an error', function(){
        this.server.respondWith("GET", "/test", "Foo <div id='ViewModel.Test'></div>");
        var div = make('<div hx-get="/test">Get It</div>');
        div.click();
        this.server.respond();
        div.innerText.should.contain("Foo");
    });

})
