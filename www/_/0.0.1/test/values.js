describe("HTMx Value Handling", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('Input includes value', function () {
        var input = make('<input name="foo" value="bar"/>');
        var vals = HTMx._('getInputValues')(input);
        vals['foo'].should.equal('bar');
    })

    it('Input includes form', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>');
        var input = byId('i1');
        var vals = HTMx._('getInputValues')(input);
        vals['foo'].should.equal('bar');
        vals['do'].should.equal('rey');
    })

    it('Basic form works', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>');
        var vals = HTMx._('getInputValues')(form);
        vals['foo'].should.equal('bar');
        vals['do'].should.equal('rey');
    })

    it('Double values are included as array', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var vals = HTMx._('getInputValues')(form);
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('hx-include works with form', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#f1"></div>');
        var vals = HTMx._('getInputValues')(div);
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('hx-include works with input', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#i1"></div>');
        var vals = HTMx._('getInputValues')(div);
        vals['foo'].should.equal('bar');
        should.equal(vals['do'], undefined);
    })

    it('hx-include works with two inputs', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#i1, #i2"></div>');
        var vals = HTMx._('getInputValues')(div);
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('hx-include works with two inputs, plus form', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#i1, #i2, #f1"></div>');
        var vals = HTMx._('getInputValues')(div);
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('correctly URL escapes values', function () {
        HTMx._("urlEncode")({}).should.equal("");
        HTMx._("urlEncode")({"foo": "bar"}).should.equal("foo=bar");
        HTMx._("urlEncode")({"foo": "bar", "do" : "rey"}).should.equal("foo=bar&do=rey");
        HTMx._("urlEncode")({"foo": "bar", "do" : ["rey", "blah"]}).should.equal("foo=bar&do=rey&do=blah");
    });

});

