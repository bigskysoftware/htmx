describe("Core kutty internals Tests", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("makeFragment works with janky stuff", function(){
        kutty._("makeFragment")("<html></html>").tagName.should.equal("BODY");
        kutty._("makeFragment")("<html><body></body></html>").tagName.should.equal("BODY");

        //NB - the tag name should be the *parent* element hosting the HTML since we use the fragment children
        // for the swap
        kutty._("makeFragment")("<td></td>").tagName.should.equal("TR");
        kutty._("makeFragment")("<thead></thead>").tagName.should.equal("TABLE");
        kutty._("makeFragment")("<col></col>").tagName.should.equal("COLGROUP");
        kutty._("makeFragment")("<tr></tr>").tagName.should.equal("TBODY");
    })

});