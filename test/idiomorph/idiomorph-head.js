describe("Tests to ensure that the head tag merging works correctly", function() {

    beforeEach(function () {
        clearWorkArea();
    });

    it('adds a new element correctly', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title>Foo</title></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><title>Foo</title><meta name='foo' content='bar'></head></html>");

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(2);
        originalHead.childNodes[0].outerHTML.should.equal("<title>Foo</title>");
        originalHead.childNodes[1].outerHTML.should.equal("<meta name=\"foo\" content=\"bar\">");
    });

    it('removes a new element correctly', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title>Foo</title><meta name='foo' content='bar'></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><title>Foo</title></head></html>");
        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(1);
        originalHead.childNodes[0].outerHTML.should.equal("<title>Foo</title>");
    });

    it('preserves an element correctly', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title>Foo</title></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><title>Foo</title></head></html>");

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(1);
        originalHead.childNodes[0].outerHTML.should.equal("<title>Foo</title>");
    });

    it('head elements are preserved in order', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title>Foo</title><meta name='foo' content='bar'></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><meta name='foo' content='bar'><title>Foo</title></head></html>");

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(2);
        originalHead.childNodes[0].outerHTML.should.equal("<title>Foo</title>");
        originalHead.childNodes[1].outerHTML.should.equal("<meta name=\"foo\" content=\"bar\">");
    });

    it('morph style reorders head', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title>Foo</title><meta name='foo' content='bar'></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><meta name='foo' content='bar'><title>Foo</title></head></html>", {head:{style:'morph'}});

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(2);
        originalHead.childNodes[0].outerHTML.should.equal("<meta name=\"foo\" content=\"bar\">");
        originalHead.childNodes[1].outerHTML.should.equal("<title>Foo</title>");
    });

    it('append style appends to head', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title>Foo</title></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><meta name='foo' content='bar'></head></html>", {head:{style:'append'}});

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(2);
        originalHead.childNodes[0].outerHTML.should.equal("<title>Foo</title>");
        originalHead.childNodes[1].outerHTML.should.equal("<meta name=\"foo\" content=\"bar\">");
    });

    it('im-preserve preserves', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title im-preserve='true'>Foo</title></head></html>", "text/html");
        let originalHead = document.head;
        htmx.morph(document, "<html><head><meta name='foo' content='bar'></head></html>");

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(2);
        originalHead.childNodes[0].outerHTML.should.equal("<title im-preserve=\"true\">Foo</title>");
        originalHead.childNodes[1].outerHTML.should.equal("<meta name=\"foo\" content=\"bar\">");
    });

    it('im-re-append re-appends', function () {
        let parser = new DOMParser();
        let document = parser.parseFromString("<html><head><title im-re-append='true'>Foo</title></head></html>", "text/html");
        let originalHead = document.head;
        let originalTitle = originalHead.children[0];
        htmx.morph(document, "<html><head><title im-re-append='true'>Foo</title><meta name='foo' content='bar'></head></html>");

        originalHead.should.equal(document.head);
        originalHead.childNodes.length.should.equal(2);
        originalHead.childNodes[0].outerHTML.should.equal("<title im-re-append=\"true\">Foo</title>");
        originalHead.childNodes[0].should.not.equal(originalTitle); // original title should have been removed in place of a new, reappended title
        originalHead.childNodes[1].outerHTML.should.equal("<meta name=\"foo\" content=\"bar\">");
    });

});
