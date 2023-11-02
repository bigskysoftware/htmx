describe('Core htmx extension tests', function() {
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function() {
        this.server.restore();
        clearWorkArea();
    });

    it('should support event cancellation by returning false', function() {
        htmx.defineExtension('ext-prevent-request', {
            onEvent: function(name, evt) {
                if (name === 'htmx:beforeRequest') {
                    return false;
                }
            }
        });

        this.server.respondWith('GET', '/test', 'clicked!');
        var div = make('<div hx-get="/test" hx-ext="ext-prevent-request">Click Me!</div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('Click Me!');
    });

    it('should support event cancellation with preventDefault', function() {
        htmx.defineExtension('ext-prevent-request', {
            onEvent: function(name, evt) {
                if (name === 'htmx:beforeRequest') {
                    evt.preventDefault();
                    if (IsIE11()) {
                        // IE11 doesn't set defaultPrevented to true on custom events it seems, so use a
                        // return false instead to cancel the event
                        return false
                    }
                }
            }
        });

        this.server.respondWith('GET', '/test', 'clicked!');
        var div = make('<div hx-get="/test" hx-ext="ext-prevent-request">Click Me!</div>')
        div.click();
        this.server.respond();
        div.innerHTML.should.equal('Click Me!');
    });
});
