describe("Core htmx Parameter Handling", function() {
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
        var vals = htmx._('getInputValues')(input).values;
        vals['foo'].should.equal('bar');
    })

    it('Input includes value on get', function () {
        var input = make('<input name="foo" value="bar"/>');
        var vals = htmx._('getInputValues')(input, "get").values;
        vals['foo'].should.equal('bar');
    })

    it('Input includes form', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>');
        var input = byId('i1');
        var vals = htmx._('getInputValues')(input).values;
        vals['foo'].should.equal('bar');
        vals['do'].should.equal('rey');
    })

    it('Input doesnt include form on get', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>');
        var input = byId('i1');
        var vals = htmx._('getInputValues')(input, 'get').values;
        vals['foo'].should.equal('bar');
        should.equal(vals['do'], undefined);
    })

    it('non-input includes form', function () {
        var form = make('<form><div id="d1"/><input id="i2" name="do" value="rey"/></form>');
        var div = byId('d1');
        var vals = htmx._('getInputValues')(div, "post").values;
        vals['do'].should.equal('rey');
    })

    it('non-input doesnt include form on get', function () {
        var form = make('<form><div id="d1"/><input id="i2" name="do" value="rey"/></form>');
        var div = byId('d1');
        var vals = htmx._('getInputValues')(div, "get").values;
        should.equal(vals['do'], undefined);
    })

    it('Basic form works on get', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>');
        var vals = htmx._('getInputValues')(form, 'get').values;
        vals['foo'].should.equal('bar');
        vals['do'].should.equal('rey');
    })

    it('Basic form works on non-get', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/></form>');
        var vals = htmx._('getInputValues')(form, 'post').values;
        vals['foo'].should.equal('bar');
        vals['do'].should.equal('rey');
    })

    it('Double values are included as array', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var vals = htmx._('getInputValues')(form).values;
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('Double values are included as array in correct order', function () {
        var form = make('<form><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey1"/><input id="i3" name="do" value="rey2"/></form>');
        var vals = htmx._('getInputValues')(byId("i3")).values;
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey1', 'rey2']);
    })

    it('hx-include works with form', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#f1"></div>');
        var vals = htmx._('getInputValues')(div).values;
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('hx-include works with input', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#i1"></div>');
        var vals = htmx._('getInputValues')(div).values;
        vals['foo'].should.equal('bar');
        should.equal(vals['do'], undefined);
    })

    it('hx-include works with two inputs', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#i1, #i2"></div>');
        var vals = htmx._('getInputValues')(div).values;
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('hx-include works with two inputs, plus form', function () {
        var form = make('<form id="f1"><input id="i1" name="foo" value="bar"/><input id="i2" name="do" value="rey"/><input id="i2" name="do" value="rey"/></form>');
        var div = make('<div hx-include="#i1, #i2, #f1"></div>');
        var vals = htmx._('getInputValues')(div).values;
        vals['foo'].should.equal('bar');
        vals['do'].should.deep.equal(['rey', 'rey']);
    })

    it('correctly URL escapes values', function () {
        htmx._("urlEncode")({}).should.equal("");``
        htmx._("urlEncode")({"foo": "bar"}).should.equal("foo=bar");
        htmx._("urlEncode")({"foo": "bar", "do" : "rey"}).should.equal("foo=bar&do=rey");
        htmx._("urlEncode")({"foo": "bar", "do" : ["rey", "blah"]}).should.equal("foo=bar&do=rey&do=blah");
    });

});

