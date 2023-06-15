describe("Core morphing tests", function(){

    beforeEach(function() {
        clearWorkArea();
    });

    it('morphs outerHTML as content properly when argument is null', function()
    {
        let initial = make("<button>Foo</button>");
        htmx.morph(initial, null, {morphStyle:'outerHTML'});
        initial.isConnected.should.equal(false);
    });

    it('morphs outerHTML as content properly when argument is single node', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<button>Bar</button>";
        let final = make(finalSrc);
        htmx.morph(initial, final, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
    });

    it('morphs outerHTML as content properly when argument is string', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<button>Bar</button>";
        htmx.morph(initial, finalSrc, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
    });

    it('morphs outerHTML as content properly when argument is an HTMLElementCollection', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<div><button>Bar</button></div>";
        let final = make(finalSrc).children;
        htmx.morph(initial, final, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
    });

    it('morphs outerHTML as content properly when argument is an Array', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<div><button>Bar</button></div>";
        let final = [...make(finalSrc).children];
        htmx.morph(initial, final, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
    });

    it('morphs outerHTML as content properly when argument is HTMLElementCollection with siblings', function()
    {
        let parent = make("<div><button>Foo</button></div>");
        let initial = parent.querySelector("button");
        let finalSrc = "<p>Foo</p><button>Bar</button><p>Bar</p>";
        let final = makeElements(finalSrc);
        htmx.morph(initial, final, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
        initial.parentElement.innerHTML.should.equal("<p>Foo</p><button>Bar</button><p>Bar</p>");
    });

    it('morphs outerHTML as content properly when argument is an Array with siblings', function()
    {
        let parent = make("<div><button>Foo</button></div>");
        let initial = parent.querySelector("button");
        let finalSrc = "<p>Foo</p><button>Bar</button><p>Bar</p>";
        let final = [...makeElements(finalSrc)];
        htmx.morph(initial, final, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
        initial.parentElement.innerHTML.should.equal("<p>Foo</p><button>Bar</button><p>Bar</p>");
    });

    it('morphs outerHTML as content properly when argument is string', function()
    {
        let parent = make("<div><button>Foo</button></div>");
        let initial = parent.querySelector("button");
        let finalSrc = "<p>Foo</p><button>Bar</button><p>Bar</p>";
        htmx.morph(initial, finalSrc, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
        initial.parentElement.innerHTML.should.equal("<p>Foo</p><button>Bar</button><p>Bar</p>");
    });

    it('morphs outerHTML as content properly when argument is string with multiple siblings', function()
    {
        let parent = make("<div><button>Foo</button></div>");
        let initial = parent.querySelector("button");
        let finalSrc = "<p>Doh</p><p>Foo</p><button>Bar</button><p>Bar</p><p>Ray</p>";
        htmx.morph(initial, finalSrc, {morphStyle:'outerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button>Bar</button>");
        initial.parentElement.innerHTML.should.equal("<p>Doh</p><p>Foo</p><button>Bar</button><p>Bar</p><p>Ray</p>");
    });

    it('morphs innerHTML as content properly when argument is null', function()
    {
        let initial = make("<div>Foo</div>");
        htmx.morph(initial, null, {morphStyle:'innerHTML'});
        initial.outerHTML.should.equal("<div></div>");
    });

    it('morphs innerHTML as content properly when argument is single node', function()
    {
        let initial = make("<div>Foo</div>");
        let finalSrc = "<button>Bar</button>";
        let final = make(finalSrc);
        htmx.morph(initial, final, {morphStyle:'innerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<div><button>Bar</button></div>");
    });

    it('morphs innerHTML as content properly when argument is string', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<button>Bar</button>";
        htmx.morph(initial, finalSrc, {morphStyle:'innerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button><button>Bar</button></button>");
    });

    it('morphs innerHTML as content properly when argument is an HTMLElementCollection', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<div><button>Bar</button></div>";
        let final = make(finalSrc).children;
        htmx.morph(initial, final, {morphStyle:'innerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button><button>Bar</button></button>");
    });

    it('morphs innerHTML as content properly when argument is an Array', function()
    {
        let initial = make("<button>Foo</button>");
        let finalSrc = "<div><button>Bar</button></div>";
        let final = [...make(finalSrc).children];
        htmx.morph(initial, final, {morphStyle:'innerHTML'});
        if (initial.outerHTML !== "<button>Bar</button>") {
            console.log("HTML after morph: " + initial.outerHTML);
            console.log("Expected:         " + finalSrc);
        }
        initial.outerHTML.should.equal("<button><button>Bar</button></button>");
    });

    it('morphs innerHTML as content properly when argument is empty array', function()
    {
        let initial = make("<div>Foo</div>");
        htmx.morph(initial, [], {morphStyle:'innerHTML'});
        initial.outerHTML.should.equal("<div></div>");
    });

    it('ignores active element when ignoreActive set to true', function()
    {
        let initialSource = "<div><div id='d1'>Foo</div><input id='i1'></div>";
        getWorkArea().innerHTML = initialSource;
        let i1 = document.getElementById('i1');
        i1.focus();
        let d1 = document.getElementById('d1');
        i1.value = "asdf";
        let finalSource = "<div><div id='d1'>Bar</div><input id='i1'></div>";
        htmx.morph(getWorkArea(), finalSource, {morphStyle:'innerHTML', ignoreActive:true});
        d1.innerText.should.equal("Bar")
        i1.value.should.equal("asdf")
    });

    it('can morph a body tag properly', function()
    {
        let initial = parseHTML("<body>Foo</body>");
        let finalSrc = '<body foo="bar">Foo</body>';
        let final = parseHTML(finalSrc);
        htmx.morph(initial.body, final.body);
        initial.body.outerHTML.should.equal(finalSrc);

    });

    it('can morph a full document properly', function()
    {
        let initial = parseHTML("<html><body>Foo</body></html>");
        let finalSrc = '<html foo="bar"><head></head><body foo="bar">Foo</body></html>';
        htmx.morph(initial, finalSrc);
        initial.documentElement.outerHTML.should.equal(finalSrc);
    });

})
