describe("local-vars extension", function() {
    beforeEach(function () {
        localStorage.setItem("mylocalvar1","99");
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        localStorage.clear();
        clearWorkArea();
    });

    it('Local variables are set/unset properly', function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            var myvars = xhr.requestHeaders["Local-Vars"];
            if (myvars) {
                var myvars = JSON.parse(myvars);
                // check Get Local Vars
                if (myvars.mylocalvar1 && (myvars.mylocalvar2 === undefined)) {
                    var answer = {
                    "mylocalvar1": (Number(myvars.mylocalvar1) + 1),
                    "mylocalvar2": "bye!"
                    };
                    // xhr.responseHeaders["Local-Vars"] = JSON.stringify(answer);
                    xhr.respond(200, {"Local-Vars": JSON.stringify(answer)}, "OK");
                    return;
                }
            }
            xhr.respond(200, {}, "ERROR");
        });

        var btn = make('<button hx-post="/test" hx-ext="local-vars" include-local-vars="mylocalvar1 mylocalvar2">Click Me!</button>')
        btn.click();
        this.server.respond();
                
        // Check for Set Local Vars 
        localStorage.getItem("mylocalvar1").should.equal("100");
        localStorage.getItem("mylocalvar2").should.equal("bye!");
    });

});