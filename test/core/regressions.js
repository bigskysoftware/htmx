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


})
