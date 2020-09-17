describe("Core htmx internals Tests", function() {

    it("makeFragment works with janky stuff", function(){
        htmx._("makeFragment")("<html></html>").tagName.should.equal("BODY");
        htmx._("makeFragment")("<html><body></body></html>").tagName.should.equal("BODY");

        //NB - the tag name should be the *parent* element hosting the HTML since we use the fragment children
        // for the swap
        htmx._("makeFragment")("<td></td>").tagName.should.equal("TR");
        htmx._("makeFragment")("<thead></thead>").tagName.should.equal("TABLE");
        htmx._("makeFragment")("<col></col>").tagName.should.equal("COLGROUP");
        htmx._("makeFragment")("<tr></tr>").tagName.should.equal("TBODY");
    })

    it("set header works with non-ASCII values", function(){
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/dummy");
        htmx._("safelySetHeaderValue")(xhr, "Example", "привет");
        // unfortunately I can't test the value :/
        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    })

});