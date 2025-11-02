describe('__extractFilter unit tests', function() {

    it('returns event name and null when no filter', function () {
        let [event, filter] = htmx.__extractFilter('click')
        assert.equal(event, 'click')
        assert.equal(filter, null)
    })

    it('extracts filter from brackets', function () {
        let [event, filter] = htmx.__extractFilter('click[ctrlKey]')
        assert.equal(event, 'click')
        assert.equal(filter, 'ctrlKey')
    })

    it('handles empty brackets', function () {
        let [event, filter] = htmx.__extractFilter('click[]')
        assert.equal(event, 'click')
        assert.equal(filter, '')
    })

    it('handles complex filter expression', function () {
        let [event, filter] = htmx.__extractFilter('keydown[key==\'Enter\']')
        assert.equal(event, 'keydown')
        assert.equal(filter, 'key==\'Enter\'')
    })

    it('returns only first bracket match', function () {
        let [event, filter] = htmx.__extractFilter('click[foo][bar]')
        assert.equal(event, 'click')
        assert.equal(filter, 'foo')
    })

    it('handles event name with spaces before bracket', function () {
        let [event, filter] = htmx.__extractFilter('my event[filter]')
        assert.equal(event, 'my event')
        assert.equal(filter, 'filter')
    })

    it('handles filter with spaces', function () {
        let [event, filter] = htmx.__extractFilter('click[a && b]')
        assert.equal(event, 'click')
        assert.equal(filter, 'a && b')
    })

    it('returns original string when only opening bracket', function () {
        let [event, filter] = htmx.__extractFilter('click[')
        assert.equal(event, 'click[')
        assert.equal(filter, null)
    })

    it('returns original string when only closing bracket', function () {
        let [event, filter] = htmx.__extractFilter('click]')
        assert.equal(event, 'click]')
        assert.equal(filter, null)
    })

    it('handles empty string', function () {
        let [event, filter] = htmx.__extractFilter('')
        assert.equal(event, '')
        assert.equal(filter, null)
    })

});