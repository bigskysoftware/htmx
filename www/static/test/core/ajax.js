describe("Core htmx AJAX Tests", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    // bootstrap test
    it('issues a GET request on click and swaps content', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    });

    it('processes inner content properly', function()
    {
        this.server.respondWith("GET", "/test", '<a hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div hx-get="/test"></div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('<a hx-get="/test2">Click Me</a>');
        var a = div.querySelector('a');
        a.click();
        this.server.respond();
        a.innerHTML.should.equal('Clicked!');
    });

    it('handles swap outerHTML properly', function()
    {
        this.server.respondWith("GET", "/test", '<a id="a1" hx-get="/test2">Click Me</a>');
        this.server.respondWith("GET", "/test2", "Clicked!");

        var div = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>')
        div.click();
        should.equal(byId("d1"), div);
        this.server.respond();
        should.equal(byId("d1"), null);
        byId("a1").click();
        this.server.respond();
        byId("a1").innerHTML.should.equal('Clicked!');
    });

    it('handles beforebegin properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="beforebegin">*</div>')
        var parent = div.parentElement;
        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("1*");

        byId("a1").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("**");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("*2*");

        byId("a2").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("***");
    });

    it('handles afterbegin properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="afterbegin">*</div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("1*");

        div.click();
        this.server.respond();
        div.innerText.should.equal("21*");

        div.click();
        this.server.respond();
        div.innerText.should.equal("321*");
    });

    it('handles afterbegin properly with no initial content', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="afterbegin"></div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("1");

        div.click();
        this.server.respond();
        div.innerText.should.equal("21");

        div.click();
        this.server.respond();
        div.innerText.should.equal("321");
    });

    it('handles afterend properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, '<a id="a' + i + '" hx-get="/test2" hx-swap="innerHTML">' + i + '</a>');
        });
        this.server.respondWith("GET", "/test2", "*");

        var div = make('<div hx-get="/test" hx-swap="afterend">*</div>')
        var parent = div.parentElement;
        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("*1");

        byId("a1").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("**");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*");
        removeWhiteSpace(parent.innerText).should.equal("*2*");

        byId("a2").click();
        this.server.respond();
        removeWhiteSpace(parent.innerText).should.equal("***");
    });

    it('handles beforeend properly', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="beforeend">*</div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("*1");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*12");

        div.click();
        this.server.respond();
        div.innerText.should.equal("*123");
    });

    it('handles beforeend properly with no initial content', function()
    {
        var i = 0;
        this.server.respondWith("GET", "/test", function(xhr){
            i++;
            xhr.respond(200, {}, "" + i);
        });

        var div = make('<div hx-get="/test" hx-swap="beforeend"></div>')

        div.click();
        this.server.respond();
        div.innerText.should.equal("1");

        div.click();
        this.server.respond();
        div.innerText.should.equal("12");

        div.click();
        this.server.respond();
        div.innerText.should.equal("123");
    });

    it('handles hx-target properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-get="/test" hx-target="#s1">Click Me!</button>');
        var target = make('<span id="s1">Initial</span>');
        btn.click();
        target.innerHTML.should.equal("Initial");
        this.server.respond();
        target.innerHTML.should.equal("Clicked!");
    });

    it('handles 204 NO CONTENT responses properly', function()
    {
        this.server.respondWith("GET", "/test", [204, {}, "No Content!"]);

        var btn = make('<button hx-get="/test">Click Me!</button>');
        btn.click();
        btn.innerHTML.should.equal("Click Me!");
        this.server.respond();
        btn.innerHTML.should.equal("Click Me!");
    });

    it('handles 304 NOT MODIFIED responses properly', function()
    {
        this.server.respondWith("GET", "/test-1", [200, {}, "Content for Tab 1"]);
        this.server.respondWith("GET", "/test-2", [200, {}, "Content for Tab 2"]);

        var target = make('<div id="target"></div>')
        var btn1 = make('<button hx-get="/test-1" hx-target="#target">Tab 1</button>');
        var btn2 = make('<button hx-get="/test-2" hx-target="#target">Tab 2</button>');

        btn1.click();
        target.innerHTML.should.equal("");
        this.server.respond();
        target.innerHTML.should.equal("Content for Tab 1");

        btn2.click();
        this.server.respond();
        target.innerHTML.should.equal("Content for Tab 2");

        this.server.respondWith("GET", "/test-1", [304, {}, "Content for Tab 1"]);
        this.server.respondWith("GET", "/test-2", [304, {}, "Content for Tab 2"]);

        btn1.click();
        this.server.respond();
        target.innerHTML.should.equal("Content for Tab 1");

        btn2.click();
        this.server.respond();
        target.innerHTML.should.equal("Content for Tab 2");
    });

    it('handles hx-trigger with non-default value', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");

        var form = make('<form hx-get="/test" hx-trigger="click">Click Me!</form>');
        form.click();
        form.innerHTML.should.equal("Click Me!");
        this.server.respond();
        form.innerHTML.should.equal("Clicked!");
    });

    it('handles hx-trigger with load event', function()
    {
        this.server.respondWith("GET", "/test", "Loaded!");
        var div = make('<div hx-get="/test" hx-trigger="load">Load Me!</div>');
        div.innerHTML.should.equal("Load Me!");
        this.server.respond();
        div.innerHTML.should.equal("Loaded!");
    });

    it('sets the content type of the request properly', function (done) {
        this.server.respondWith("GET", "/test", function(xhr){
            xhr.respond(200, {}, "done");
            xhr.overriddenMimeType.should.equal("text/html");
            done();
        });
        var div = make('<div hx-get="/test">Click Me!</div>');
        div.click();
        this.server.respond();
    });

    it('issues two requests when clicked twice before response', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "click " + i);
            i++
        });
        var div = make('<div hx-get="/test"></div>');
        div.click();
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("click 1");
        this.server.respond();
        div.innerHTML.should.equal("click 2");
    });

    it('issues two requests when clicked three times before response', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "click " + i);
            i++
        });
        var div = make('<div hx-get="/test"></div>');
        div.click();
        div.click();
        div.click();
        this.server.respondAll();
        div.innerHTML.should.equal("click 2");
    });

    it('properly handles hx-select for basic situation', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", "<div id='d1'>foo</div><div id='d2'>bar</div>");
        var div = make('<div hx-get="/test" hx-select="#d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
    });

    it('properly handles hx-select for full html document situation', function()
    {
        this.server.respondWith("GET", "/test", "<html><body><div id='d1'>foo</div><div id='d2'>bar</div></body></html>");
        var div = make('<div hx-get="/test" hx-select="#d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
    });

    it('properly settles attributes on interior elements', function(done)
    {
        this.server.respondWith("GET", "/test", "<div hx-get='/test'><div width='bar' id='d1'></div></div>");
        var div = make("<div hx-get='/test' hx-swap='outerHTML settle:10ms'><div id='d1'></div></div>");
        div.click();
        this.server.respond();
        should.equal(byId("d1").getAttribute("width"), null);
        setTimeout(function () {
            should.equal(byId("d1").getAttribute("width"), "bar");
            done();
        }, 20);
    });

    it('properly settles attributes elements with single quotes in id', function(done)
    {
        this.server.respondWith("GET", "/test", "<div hx-get='/test'><div width='bar' id=\"d1'\"></div></div>");
        var div = make("<div hx-get='/test' hx-swap='outerHTML settle:10ms'><div id=\"d1'\"></div></div>");
        div.click();
        this.server.respond();
        should.equal(byId("d1'").getAttribute("width"), null);
        setTimeout(function () {
            should.equal(byId("d1'").getAttribute("width"), "bar");
            done();
        }, 20);
    });

    it('properly settles attributes elements with double quotes in id', function(done)
    {
        this.server.respondWith("GET", "/test", "<div hx-get='/test'><div width='bar' id='d1\"'></div></div>");
        var div = make("<div hx-get='/test' hx-swap='outerHTML settle:10ms'><div id='d1\"'></div></div>");
        div.click();
        this.server.respond();
        should.equal(byId("d1\"").getAttribute("width"), null);
        setTimeout(function () {
            should.equal(byId("d1\"").getAttribute("width"), "bar");
            done();
        }, 20);
    });

    it('properly handles multiple select input', function()
    {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            '<select id="multiSelect" name="multiSelect" multiple="multiple">'+
            '<option id="m1" value="m1">m1</option>'+
            '<option id="m2" value="m2">m2</option>'+
            '<option id="m3" value="m3">m3</option>'+
            '<option id="m4" value="m4">m4</option>'+
            '</select>'+
            '</form>');

        form.click();
        this.server.respond();
        values.should.deep.equal({});

        byId("m1").selected = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({multiSelect:"m1"});

        byId("m1").selected = true;
        byId("m3").selected = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({multiSelect:["m1", "m3"]});
    });

    it('properly handles multiple select input when "multiple" attribute is empty string', function()
    {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            '<select name="multiSelect" id="id_question_list" multiple="" tabindex="-1" aria-hidden="true">' +
            '<option id="m1" value="m1">m1</option>'+
            '<option id="m2" value="m2">m2</option>'+
            '<option id="m3" value="m3">m3</option>'+
            '<option id="m4" value="m4">m4</option>'+
            '</select>' +
            '</form>');

        form.click();
        this.server.respond();
        values.should.deep.equal({});

        byId("m1").selected = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({multiSelect:"m1"});

        byId("m1").selected = true;
        byId("m3").selected = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({multiSelect:["m1", "m3"]});
    });

    it('properly handles two multiple select inputs w/ same name', function()
    {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            '<select id="multiSelect" name="multiSelect" multiple="multiple">'+
            '<option id="m1" value="m1">m1</option>'+
            '<option id="m2" value="m2">m2</option>'+
            '<option id="m3" value="m3">m3</option>'+
            '<option id="m4" value="m4">m4</option>'+
            '</select>'+
            '<select id="multiSelect" name="multiSelect" multiple="multiple">'+
            '<option id="m5" value="m5">m1</option>'+
            '<option id="m6" value="m6">m2</option>'+
            '<option id="m7" value="m7">m3</option>'+
            '<option id="m8" value="m8">m4</option>'+
            '</select>'+
            '</form>');

        form.click();
        this.server.respond();
        values.should.deep.equal({});

        byId("m1").selected = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({multiSelect:"m1"});

        byId("m1").selected = true;
        byId("m3").selected = true;
        byId("m7").selected = true;
        byId("m8").selected = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({multiSelect:["m1", "m3", "m7", "m8"]});
    });

    it('properly handles multiple email input', function()
    {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            '<input id="multiEmail" name="multiEmail" multiple>'+
            '</form>');

        form.click();
        this.server.respond();
        values.should.deep.equal({multiEmail: ''});

        byId("multiEmail").value = 'foo@example.com';
        form.click();
        this.server.respond();
        values.should.deep.equal({multiEmail:"foo@example.com"});

        byId("multiEmail").value = 'foo@example.com,bar@example.com';
        form.click();
        this.server.respond();
        values.should.deep.equal({multiEmail:"foo@example.com,bar@example.com"});
    });

    it('properly handles checkbox inputs', function()
    {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        var form = make('<form hx-post="/test" hx-trigger="click">' +
            '<input id="cb1" name="c1" value="cb1" type="checkbox">'+
            '<input id="cb2" name="c1" value="cb2" type="checkbox">'+
            '<input id="cb3" name="c1" value="cb3" type="checkbox">'+
            '<input id="cb4" name="c2" value="cb4"  type="checkbox">'+
            '<input id="cb5" name="c2" value="cb5"  type="checkbox">'+
            '<input id="cb6" name="c3" value="cb6"  type="checkbox">'+
            '</form>');

        form.click();
        this.server.respond();
        values.should.deep.equal({});

        byId("cb1").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:"cb1"});

        byId("cb1").checked = true;
        byId("cb2").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:["cb1", "cb2"]});

        byId("cb1").checked = true;
        byId("cb2").checked = true;
        byId("cb3").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:["cb1", "cb2", "cb3"]});

        byId("cb1").checked = true;
        byId("cb2").checked = true;
        byId("cb3").checked = true;
        byId("cb4").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:["cb1", "cb2", "cb3"], c2:"cb4"});

        byId("cb1").checked = true;
        byId("cb2").checked = true;
        byId("cb3").checked = true;
        byId("cb4").checked = true;
        byId("cb5").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:["cb1", "cb2", "cb3"], c2:["cb4", "cb5"]});

        byId("cb1").checked = true;
        byId("cb2").checked = true;
        byId("cb3").checked = true;
        byId("cb4").checked = true;
        byId("cb5").checked = true;
        byId("cb6").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:["cb1", "cb2", "cb3"], c2:["cb4", "cb5"], c3:"cb6"});

        byId("cb1").checked = true;
        byId("cb2").checked = false;
        byId("cb3").checked = true;
        byId("cb4").checked = false;
        byId("cb5").checked = true;
        byId("cb6").checked = true;
        form.click();
        this.server.respond();
        values.should.deep.equal({c1:["cb1", "cb3"], c2:"cb5", c3:"cb6"});

    });

    it('text nodes dont screw up settling via variable capture', function()
    {
        this.server.respondWith("GET", "/test", "<div id='d1' hx-trigger='click consume' hx-get='/test2'></div>fooo");
        this.server.respondWith("GET", "/test2", "clicked");
        var div = make("<div hx-get='/test'/>");
        div.click();
        this.server.respond();
        byId("d1").click();
        this.server.respond();
        byId("d1").innerHTML.should.equal("clicked");
    });

    it('script nodes evaluate', function()
    {
        var globalWasCalled = false;
        window.callGlobal = function() {
            globalWasCalled = true;
        }
        try {
            this.server.respondWith("GET", "/test", "<div></div><script type='text/javascript'>callGlobal()</script>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            globalWasCalled.should.equal(true);
        } finally {
            delete window.callGlobal;
        }
    });

    it('stand alone script nodes evaluate', function()
    {
        var globalWasCalled = false;
        window.callGlobal = function() {
            globalWasCalled = true;
        }
        try {
            this.server.respondWith("GET", "/test", "<script type='text/javascript'>callGlobal()</script>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            globalWasCalled.should.equal(true);
        } finally {
            delete window.callGlobal;
        }
    });

    it('script nodes can define global functions', function()
    {
        try {
            window.foo = {}
            this.server.respondWith("GET", "/test", "<script type='text/javascript'>foo.bar = function() { return 42 }</script>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            foo.bar().should.equal(42);
        } finally {
            delete foo;
        }
    });

    it('child script nodes evaluate when children', function()
    {
        var globalWasCalled = false;
        window.callGlobal = function() {
            globalWasCalled = true;
        }
        try {
            this.server.respondWith("GET", "/test", "<div><script type='text/javascript'>callGlobal()</script></div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            globalWasCalled.should.equal(true);
        } finally {
            delete window.callGlobal;
        }
    });

    it('child script nodes evaluate when first child', function()
    {
        var globalWasCalled = false;
        window.callGlobal = function() {
            globalWasCalled = true;
        }
        try {
            this.server.respondWith("GET", "/test", "<script type='text/javascript'>callGlobal()</script><div></div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            globalWasCalled.should.equal(true);
        } finally {
            delete window.callGlobal;
        }
    });

    it('child script nodes evaluate when not explicitly marked javascript', function()
    {
        var globalWasCalled = false;
        window.callGlobal = function() {
            globalWasCalled = true;
        }
        try {
            this.server.respondWith("GET", "/test", "<div><script>callGlobal()</script></div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            globalWasCalled.should.equal(true);
        } finally {
            delete window.callGlobal;
        }
    });

    it('script nodes do not evaluate when explicitly marked as something other than javascript', function()
    {
        var globalWasCalled = false;
        window.callGlobal = function() {
            globalWasCalled = true;
        }
        try {
            this.server.respondWith("GET", "/test", "<div><script type='text/samplescript'>callGlobal()</script></div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            globalWasCalled.should.equal(false);
        } finally {
            delete window.callGlobal;
        }
    });

    it('script nodes evaluate after swap', function()
    {
        window.callGlobal = function() {
            console.log("Here...");
            window.tempVal = byId("d1").innerText
        }
        try {
            this.server.respondWith("GET", "/test", "<div><script>callGlobal()</script><div id='d1'>After settle...</div> </div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            window.tempVal.should.equal("After settle...");
        } finally {
            delete window.callGlobal;
            delete window.tempVal;
        }
    });

    it('script node exceptions do not break rendering', function()
    {
        this.skip("Rendering does not break, but the exception bubbles up and mocha reports it");
        this.server.respondWith("GET", "/test", "clicked<script type='text/javascript'>throw 'foo';</script>");
        var div = make("<div hx-get='/test'></div>");
        div.click();
        this.server.respond();
        div.innerText.should.equal("clicked");
        console.log(div.innerText);
        console.log("here");
    });

    it('allows empty verb values', function()
    {
        var path = null;
        var div = make("<div hx-get=''/>");
        htmx.on(div, "htmx:configRequest", function (evt) {
            path = evt.detail.path;
            return false;
        });
        div.click();
        this.server.respond();
        path.should.not.be.null;
    });

    it('allows blank verb values', function()
    {
        var path = null;
        var div = make("<div hx-get/>");
        htmx.on(div, "htmx:configRequest", function (evt) {
            path = evt.detail.path;
            return false;
        });
        div.click();
        this.server.respond();
        path.should.not.be.null;
    });

    it('input values are not settle swapped (causes flicker)', function()
    {
        this.server.respondWith("GET", "/test", "<input id='i1' value='bar'/>");
        var input = make("<input id='i1' hx-get='/test' value='foo' hx-swap='outerHTML settle:50' hx-trigger='click'/>");
        input.click();
        this.server.respond();
        input = byId('i1');
        input.value.should.equal('bar');
    });

    it('autofocus attribute works properly', function()
    {
        this.server.respondWith("GET", "/test", "<input id='i2' value='bar' autofocus/>");
        var input = make("<input id='i1' hx-get='/test' value='foo' hx-swap='afterend' hx-trigger='click'/>");
        input.focus();
        input.click();
        document.activeElement.should.equal(input);
        this.server.respond();
        var input2 = byId('i2');
        document.activeElement.should.equal(input2);
    });

    it('autofocus attribute works properly w/ child', function()
    {
        this.server.respondWith("GET", "/test", "<div><input id='i2' value='bar' autofocus/></div>");
        var input = make("<input id='i1' hx-get='/test' value='foo' hx-swap='afterend' hx-trigger='click'/>");
        input.focus();
        input.click();
        document.activeElement.should.equal(input);
        this.server.respond();
        var input2 = byId('i2');
        document.activeElement.should.equal(input2);
    });

    it('autofocus attribute works properly w/ true value', function()
    {
        this.server.respondWith("GET", "/test", "<div><input id='i2' value='bar' autofocus='true'/></div>");
        var input = make("<input id='i1' hx-get='/test' value='foo' hx-swap='afterend' hx-trigger='click'/>");
        input.focus();
        input.click();
        document.activeElement.should.equal(input);
        this.server.respond();
        var input2 = byId('i2');
        document.activeElement.should.equal(input2);
    });

   it('multipart/form-data encoding works', function()
    {
        this.server.respondWith("POST", "/test", function(xhr){
            should.equal(xhr.requestHeaders['Content-Type'], undefined);
            if (xhr.requestBody.get) { //IE 11 does not support
                xhr.requestBody.get("i1").should.equal('foo');
            }
            xhr.respond(200, {}, "body: " + xhr.requestBody);
        });
        var form = make("<form hx-post='/test' hx-encoding='multipart/form-data' hx-trigger='click'>" +
            "<input name='i1'  id='i1' value='foo'/>" +
            "</form>");
        form.focus();
        form.click();
        this.server.respond();
    });

    it('removed elements do not issue requests', function()
    {
        var count = 0;
        this.server.respondWith("GET", "/test", function (xhr) {
            count++;
            xhr.respond(200, {}, "");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        htmx.remove(btn);
        btn.click();
        this.server.respond();
        count.should.equal(0);
    });

    it('title tags update title', function()
    {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "<title class=''>htmx rocks!</title>Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Clicked!");
        window.document.title.should.equal("htmx rocks!");
    });

    it('svg title tags do not update title', function()
    {
        var originalTitle = window.document.title
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "<svg class=''><title>" + originalTitle + "UPDATE" + "</title></svg>Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        if (supportsSvgTitles()) { // IE 11
            btn.innerText.should.equal("Clicked!");
        }
        window.document.title.should.equal(originalTitle);
    });

    it('first title tag outside svg title tags updates title', function()
    {
        var originalTitle = window.document.title
        var newTitle = originalTitle + "!!!";
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "<title class=''>" + newTitle + "</title><svg class=''><title>foo</title></svg>Clicked!<title class=''>x</title>");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        if (supportsSvgTitles()) { // IE 11
            btn.innerText.should.equal("Clicked!");
        }
        window.document.title.should.equal(newTitle);
    });

    it('title update does not URL escape', function()
    {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "<title>&lt;/> htmx rocks!</title>Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Clicked!");
        window.document.title.should.equal("</> htmx rocks!");
    });

    it('by default 400 content is not swapped', function()
    {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(400, {}, "Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Click Me!");
    });

    it('400 content can be swapped if configured to do so', function()
    {
        var handler = htmx.on("htmx:beforeSwap", function (event) {
            if (event.detail.xhr.status === 400) {
                event.detail.shouldSwap = true;
            }
        });

        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(400, {}, "Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Clicked!");
        htmx.off("htmx:beforeSwap", handler);
    });

    it('400 content can be retargeted if configured to do so', function()
    {
        var handler = htmx.on("htmx:beforeSwap", function (event) {
            if (event.detail.xhr.status === 400) {
                event.detail.shouldSwap = true;
                event.detail.target = byId('d1')
            }
        });

        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(400, {}, "Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        var div = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div.innerText.should.equal("Clicked!");
        htmx.off("htmx:beforeSwap", handler);
    });

    it('errors are triggered only on 400+', function()
    {
        var errors = 0;
        var handler = htmx.on("htmx:responseError", function(){
            errors++;
        })
        this.server.respondWith("GET", "/test1", function (xhr) {
            xhr.respond(204, {}, "Clicked!");
        });
        this.server.respondWith("GET", "/test2", function (xhr) {
            xhr.respond(400, {}, "Clicked!");
        });
        var btn1 = make('<button hx-get="/test1">Click Me!</button>')
        var btn2 = make('<button hx-get="/test2">Click Me!</button>')
        btn1.click();
        btn2.click();
        this.server.respond();
        this.server.respond();
        errors.should.equal(1);
        htmx.off("htmx:responseError", handler);
    });


    it('content can be modified if configured to do so', function()
    {
        var handler = htmx.on("htmx:beforeSwap", function (event) {
            if (event.detail.xhr.status === 400) {
                event.detail.shouldSwap = true;
                event.detail.serverResponse = event.detail.serverResponse + "!!";
            }
        });

        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(400, {}, "Clicked!");
        });
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Clicked!!!");
        htmx.off("htmx:beforeSwap", handler);
    });

    it('scripts w/ src attribute are properly loaded', function(done)
    {
        try {
            this.server.respondWith("GET", "/test", "<script id='setGlobalScript' src='setGlobal.js'></script>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            byId("setGlobalScript").addEventListener("load", function () {
                window.globalWasCalled.should.equal(true);
                delete window.globalWasCalled;
                done();
            })
        } finally {
            delete window.globalWasCalled;
        }
    });

    it('should load tags with colon in their names', function() {
        this.server.respondWith('GET', '/test', '<with:colon id="foobar">Foobar</with:colon>');

        var btn = make('<button hx-get="/test">Give me colons!</button>');
        btn.click();
        this.server.respond();

        btn.innerHTML.should.equal('<with:colon id="foobar">Foobar</with:colon>');
    });

    it('properly handles clicked submit button with a value inside a htmx form', function () {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form hx-post="/test">' +
            '<input type="text" name="t1" value="textValue">' +
            '<button id="submit" type="submit" name="b1" value="buttonValue">button</button>' +
            '</form>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: 'buttonValue'});
    })

    it('properly handles clicked submit input with a value inside a htmx form', function () {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form hx-post="/test">' +
            '<input type="text" name="t1" value="textValue">' +
            '<input id="submit" type="submit" name="b1" value="buttonValue">' +
            '</form>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: 'buttonValue'});
    })

    it('properly handles clicked submit button with a value inside a non-htmx form', function () {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form>' +
            '<input type="text" name="t1" value="textValue">' +
            '<button id="submit" type="submit" name="b1" value="buttonValue" hx-post="/test">button</button>' +
            '</form>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: 'buttonValue'});
    })

    it('properly handles clicked submit input with a value inside a non-htmx form', function () {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form>' +
            '<input type="text" name="t1" value="textValue">' +
            '<input id="submit" type="submit" name="b1" value="buttonValue" hx-post="/test">' +
            '</form>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: 'buttonValue'});
    })

    it('properly handles clicked submit button with a value outside a htmx form', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form id="externalForm" hx-post="/test">' +
            '<input type="text" name="t1" value="textValue">' +
            '</form>' +
            '<button id="submit" form="externalForm" type="submit" name="b1" value="buttonValue">button</button>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: 'buttonValue'});
    })

    it('properly handles clicked submit input with a value outside a htmx form', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form id="externalForm" hx-post="/test">' +
            '<input type="text" name="t1" value="textValue">' +
            '</form>' +
            '<input id="submit" form="externalForm" type="submit" name="b1" value="buttonValue">');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: 'buttonValue'});
    })

    it('properly handles clicked submit button with a value stacking with regular input', function () {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form hx-post="/test">' +
            '<input type="hidden" name="action" value="A">' +
            '<button id="btnA" type="submit">A</button>' +
            '<button id="btnB" type="submit" name="action" value="B">B</button>' +
            '<button id="btnC" type="submit" name="action" value="C">C</button>' +
            '</form>');

        byId("btnA").click();
        this.server.respond();
        values.should.deep.equal({action: 'A'});

        byId("btnB").click();
        this.server.respond();
        values.should.deep.equal({action: ['A', 'B']});

        byId("btnC").click();
        this.server.respond();
        values.should.deep.equal({action: ['A', 'C']});
    })

    it('properly handles clicked submit input with a value stacking with regular input', function () {
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form hx-post="/test">' +
            '<input type="hidden" name="action" value="A">' +
            '<input id="btnA" type="submit">A</input>' +
            '<input id="btnB" type="submit" name="action" value="B">B</input>' +
            '<input id="btnC" type="submit" name="action" value="C">C</input>' +
            '</form>');

        byId("btnA").click();
        this.server.respond();
        values.should.deep.equal({action: 'A'});

        byId("btnB").click();
        this.server.respond();
        values.should.deep.equal({action: ['A', 'B']});

        byId("btnC").click();
        this.server.respond();
        values.should.deep.equal({action: ['A', 'C']});
    })

    it('properly handles clicked submit button with a value inside a form, referencing another form', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form id="externalForm" hx-post="/test">' +
            '<input type="text" name="t1" value="textValue">' +
            '<input type="hidden" name="b1" value="inputValue">' +
            '</form>' +
            '<form hx-post="/test2">' +
            '<button id="submit" form="externalForm" type="submit" name="b1" value="buttonValue">button</button>' +
            '</form>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: ['inputValue', 'buttonValue']});
    })

    it('properly handles clicked submit input with a value inside a form, referencing another form', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form id="externalForm" hx-post="/test">' +
            '<input type="text" name="t1" value="textValue">' +
            '<input type="hidden" name="b1" value="inputValue">' +
            '</form>' +
            '<form hx-post="/test2">' +
            '<input id="submit" form="externalForm" type="submit" name="b1" value="buttonValue">' +
            '</form>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: ['inputValue', 'buttonValue']});
    })

    it('properly handles inputs external to form', function () {
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }
        var values;
        this.server.respondWith("Post", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(204, {}, "");
        });

        make('<form id="externalForm" hx-post="/test">' +
            '   <input type="hidden" name="b1" value="inputValue">' +
            '</form>' +
            '<input type="text" name="t1" value="textValue" form="externalForm">' +
            '<select name="s1" form="externalForm">' +
            '   <option value="someValue"></option>' +
            '   <option value="selectValue" selected></option>' +
            '</select>' +
            '<button id="submit" form="externalForm" type="submit" name="b1" value="buttonValue">button</button>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({t1: 'textValue', b1: ['inputValue', 'buttonValue'], s1: "selectValue"});
    })

    it('handles form post with button formmethod dialog properly', function () {
        var values;
        this.server.respondWith("POST", "/test", function (xhr) {
            values = getParameters(xhr);
            xhr.respond(200, {}, "");
        });

        make('<dialog><form hx-post="/test"><button id="submit" formmethod="dialog" name="foo" value="bar">submit</button></form></dialog>');

        byId("submit").click();
        this.server.respond();
        values.should.deep.equal({ foo: 'bar' });
    })

    it('handles form get with button formmethod dialog properly', function () {
        var responded = false;
        this.server.respondWith("GET", "/test", function (xhr) {
            responded = true;
            xhr.respond(200, {}, "");
        });

        make('<dialog><form hx-get="/test"><button id="submit" formmethod="dialog">submit</button></form></dialog>');

        byId("submit").click();
        this.server.respond();
        responded.should.equal(true);
    })

    it("can associate submit buttons from outside a form with the current version of the form after swap", function(){
        if (!supportsFormAttribute()) {
            this._runnable.title += " - Skipped as IE11 doesn't support form attribute"
            this.skip()
            return
        }
        const template = '<form ' +
              'id="hello" ' +
              'hx-target="#hello" ' +
              'hx-select="#hello" ' +
              'hx-swap="outerHTML" ' +
              'hx-post="/test">\n' +
              '<input id="input" type="text" name="name" />\n' +
              '<button name="value" type="submit">Submit</button>\n' +
              '</form>\n' +
              '<button id="outside" name="outside" form="hello" type="submit">Outside</button>';

        var values
        this.server.respondWith("/test", function (xhr) {
          values = getParameters(xhr);
          xhr.respond(200, {}, template);
        });
        make(template);
        const button = byId("outside");
        button.focus();
        button.click();
        this.server.respond();
        values.should.deep.equal({name: "", outside: ""});
        button.focus();
        button.click();
        this.server.respond();
        values.should.deep.equal({name: "", outside: ""});
    })
})
