describe("refresh-href extension", function(){
    it('refreshes a missing href on initialization', function () {
        var link = make('<a hx-get="/test?qs#frag" hx-ext="refresh-href">link</a>');
        link.href.should.equal(location.protocol + "//" + location.host + '/test?qs#frag');
    });

    it('refreshes an empty href on initialization', function () {
        var link = make('<a hx-get="/test?qs#frag" href hx-ext="refresh-href">link</a>');
        link.href.should.equal(location.protocol + "//" + location.host + '/test?qs#frag');
    });

    it('refreshes an empty string href on initialization', function () {
        var link = make('<a hx-get="/test?qs#frag" href="" hx-ext="refresh-href">link</a>');
        link.href.should.equal(location.protocol + "//" + location.host + '/test?qs#frag');
    });

    it('refreshes an existing href on initialization', function () {
        var link = make('<a hx-get="/test?qs#frag" href="original" hx-ext="refresh-href">link</a>');
        link.href.should.equal(location.protocol + "//" + location.host + '/test?qs#frag');
    });

    it('does not refresh on init if event removed', function () {
        var link = make('<a hx-get="/test" hx-ext="refresh-href" refresh-href="mouseover">link</a>');
        link.href.should.equal('');
    });

    it('refreshes href on event', function () {
        var host = location.protocol + "//" + location.host;

        var param = make('<input name="param" value="val" />');
        var link = make('<a hx-get="/test?qs#frag" hx-ext="refresh-href" hx-include="[name=\'param\']">link</a>');
        link.href.should.equal(host + '/test?qs&param=val#frag');

        param.value = "someNewValue";
        link.href.should.equal(host + '/test?qs&param=val#frag'); // still same

        const event = new MouseEvent('mouseover', {});
        link.dispatchEvent(event);
        link.href.should.equal(host + '/test?qs&param=someNewValue#frag'); // refreshed
    });
});