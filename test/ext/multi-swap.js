describe("multi-swap extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('swap only one element with default innerHTML', function () {
        this.server.respondWith("GET", "/test", '<html><body><div class="dummy"><div id="a">New A</div></div></html>');
        var content = make('<div>Foo <div id="a">Old A</div></div>');
        var btn = make('<button hx-get="/test" hx-ext="multi-swap" hx-swap="multi:#a">Click Me!</button>');
        btn.click();
        this.server.respond();
        should.equal(content.innerHTML, 'Foo <div id="a">New A</div>');
    });

    it('swap multiple elements with outerHTML, beforeend, afterend, beforebegin and delete methods', function () {
        this.server.respondWith("GET", "/test",
            '<html><body><div class="abc">' +
            '<div id="a">New A</div> foo ' +
            '<div id="b"><b>New B</b></div> bar ' +
            '<div id="c">New C</div> dummy ' +
            '<div id="d">New D</div> lorem ' +
            '<div id="e">TO DELETE</div>' +
            '</div></html>'
        );
        var content = make(
            '<div>Foo ' +
            '   <div id="a">Old A</div> A ' +
            '   <div id="b">Old B</div> B ' +
            '   <div id="c">Old C</div> C ' +
            '   <div id="d">Old D</div> D ' +
            '   <div id="e">Old E</div> E ' +
            '</div>'
        );
        var btn = make('<button hx-get="/test" hx-ext="multi-swap" hx-swap="multi:#a:outerHTML,#b:beforeend,#c:afterend,#d:beforebegin,#e:delete">Click Me!</button>');
        btn.click();
        this.server.respond();
        should.equal(content.outerHTML,
            '<div>Foo ' +
            '   <div id="a">New A</div> A ' +
            '   <div id="b">Old B<b>New B</b></div> B ' +
            '   <div id="c">Old C</div>New C C ' +
            '   New D<div id="d">Old D</div> D ' +
            '    E ' +
            '</div>'
        );
    });
});
