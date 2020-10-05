describe("Core htmx tokenizer tests", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    function tokenize(str) {
        return htmx._("tokenizeString")(str);
    }

    function tokenizeTest(str, result) {
        return tokenize(str).should.deep.equal(result);
    }

    it('tokenizes properly', function()
    {
        tokenizeTest("", []);
        tokenizeTest("  ", [" ", " "]);
        tokenizeTest("(", ["("]);
        tokenizeTest("()", ["(", ")"]);
        tokenizeTest("(,)", ["(", ",", ")"]);
        tokenizeTest(" ( ) ", [" ", "(", " ", ")", " "]);
        tokenizeTest(" && ) ", [" ", "&", "&", " ", ")", " "]);
        tokenizeTest(" && ) 'asdf'", [" ", "&", "&", " ", ")", " ", "'asdf'"]);
        tokenizeTest(" && ) ',asdf'", [" ", "&", "&", " ", ")", " ", "',asdf'"]);
        tokenizeTest('",asdf"', ['",asdf"']);
        tokenizeTest('&& ) ",asdf"', ["&", "&", " ", ")", " ", '",asdf"']);
    });

    it('generates conditionals property', function()
    {
        var tokens = tokenize("[code==4||(code==5&&foo==true)]");
        var conditional = htmx._("maybeGenerateConditional")(tokens);
        console.log(conditional);
        var func = eval(conditional);
        console.log(func({code: 5, foo: true}));
        console.log(func({code: 4, foo: false}));
        console.log(func({code: 3, foo: false}));
    });




})
