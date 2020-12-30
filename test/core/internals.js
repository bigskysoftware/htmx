const { should } = require("chai");

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

    it("handles parseInterval correctly", function() {
        htmx._("parseInterval")("1ms").should.equal(1);
        htmx._("parseInterval")("300ms").should.equal(300);
        htmx._("parseInterval")("1s").should.equal(1000)
        htmx._("parseInterval")("1.5s").should.equal(1500)
        htmx._("parseInterval")("2s").should.equal(2000)

/*        should(htmx.parseInterval(null)).be.undefined
        should(htmx.parseInterval("")).be.undefined
        should(htmx.parseInterval("false")).be.undefined
        should(htmx.parseInterval("true")).be.undefined
*/
    })

});