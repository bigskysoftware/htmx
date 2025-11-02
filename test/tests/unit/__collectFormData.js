describe('__collectFormData unit tests', function() {

    it('collects text input from form', function () {
        let form = createProcessedHTML('<form><input type="text" name="foo" value="bar"></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('foo'), 'bar')
    })

    it('collects multiple inputs from form', function () {
        let form = createProcessedHTML('<form><input name="a" value="1"><input name="b" value="2"></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('a'), '1')
        assert.equal(formData.get('b'), '2')
    })

    it('collects textarea from form', function () {
        let form = createProcessedHTML('<form><textarea name="msg">hello</textarea></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('msg'), 'hello')
    })

    it('collects select from form', function () {
        let form = createProcessedHTML('<form><select name="choice"><option value="a">A</option><option value="b" selected>B</option></select></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('choice'), 'b')
    })

    it('collects checked checkbox', function () {
        let form = createProcessedHTML('<form><input type="checkbox" name="agree" value="yes" checked></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('agree'), 'yes')
    })

    it('excludes unchecked checkbox', function () {
        let form = createProcessedHTML('<form><input type="checkbox" name="agree" value="yes"></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('agree'), null)
    })

    it('collects checked radio button', function () {
        let form = createProcessedHTML('<form><input type="radio" name="color" value="red" checked><input type="radio" name="color" value="blue"></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('color'), 'red')
    })

    it('excludes unchecked radio buttons', function () {
        let form = createProcessedHTML('<form><input type="radio" name="color" value="red"><input type="radio" name="color" value="blue"></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('color'), null)
    })

    it('collects multiple select values', function () {
        let form = createProcessedHTML('<form><select name="items" multiple><option value="a" selected>A</option><option value="b" selected>B</option><option value="c">C</option></select></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.deepEqual(formData.getAll('items'), ['a', 'b'])
    })

    it('excludes disabled inputs', function () {
        let form = createProcessedHTML('<form><input name="a" value="1"><input name="b" value="2" disabled></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('a'), '1')
        assert.equal(formData.get('b'), null)
    })

    it('excludes inputs without name attribute', function () {
        let form = createProcessedHTML('<form><input value="1"><input name="b" value="2"></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('b'), '2')
    })

    it('collects element value when no form provided', function () {
        let input = createProcessedHTML('<input name="foo" value="bar">')
        let formData = htmx.__collectFormData(input, null, null)
        assert.equal(formData.get('foo'), 'bar')
    })

    it('collects submitter value', function () {
        let form = createProcessedHTML('<form><input name="a" value="1"><button name="submit" value="go">Go</button></form>')
        let submitter = form.querySelector('button')
        let formData = htmx.__collectFormData(form, form, submitter)
        assert.equal(formData.get('a'), '1')
        assert.equal(formData.get('submit'), 'go')
    })

    it('collects hx-include elements', function () {
        createProcessedHTML('<input id="extra" name="extra" value="included"><form hx-include="#extra"><input name="a" value="1"></form>')
        let form = document.querySelector('form')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal(formData.get('a'), '1')
        assert.equal(formData.get('extra'), 'included')
    })

    it('does not duplicate elements in hx-include', function () {
        let container = createProcessedHTML('<div><form><input name="a" value="1"></form></div>')
        let form = container.querySelector('form')
        form.setAttribute('hx-include', 'input[name="a"]')
        let formData = htmx.__collectFormData(form, form, null)
        assert.deepEqual(formData.getAll('a'), ['1'])
    })

    it('handles empty form', function () {
        let form = createProcessedHTML('<form></form>')
        let formData = htmx.__collectFormData(form, form, null)
        assert.equal([...formData.keys()].length, 0)
    })

    it('handles element without name or form', function () {
        let div = createProcessedHTML('<div></div>')
        let formData = htmx.__collectFormData(div, null, null)
        assert.equal([...formData.keys()].length, 0)
    })

});