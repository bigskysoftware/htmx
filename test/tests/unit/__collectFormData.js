describe('__collectFormData unit tests', function() {

    before(function() {
        // Define a form-associated custom element for testing
        if (!customElements.get('test-input')) {
            class TestInput extends HTMLElement {
                static formAssociated = true;

                constructor() {
                    super();
                    this._internals = this.attachInternals();
                    this._value = '';
                }

                connectedCallback() {
                    this._value = this.getAttribute('value') || '';
                    this._internals.setFormValue(this._value);
                }

                get value() {
                    return this._value;
                }

                set value(val) {
                    this._value = val;
                    this._internals.setFormValue(val);
                }
            }
            customElements.define('test-input', TestInput);
        }
    });

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

    it('collects form-associated custom element value', function () {
        let form = createProcessedHTML('<form><test-input name="custom" value="test-value"></test-input></form>');
        let formData = htmx.__collectFormData(form, form, null);
        assert.equal(formData.get('custom'), 'test-value');
    });

    it('collects both regular and custom element values', function () {
        let form = createProcessedHTML('<form><input name="regular" value="reg-val"><test-input name="custom" value="cust-val"></test-input></form>');
        let formData = htmx.__collectFormData(form, form, null);
        assert.equal(formData.get('regular'), 'reg-val');
        assert.equal(formData.get('custom'), 'cust-val');
    });

    it('collects custom element with form attribute outside form', function () {
        createProcessedHTML('<form id="myform"><input name="inside" value="in"></form><test-input form="myform" name="outside" value="out"></test-input>');
        let form = document.getElementById('myform');
        let formData = htmx.__collectFormData(form, form, null);
        assert.equal(formData.get('inside'), 'in');
        assert.equal(formData.get('outside'), 'out');
    });

    it('does not duplicate custom element in hx-include', function () {
        let container = createProcessedHTML('<div><form><test-input name="custom" value="val"></test-input></form></div>');
        let form = container.querySelector('form');
        form.setAttribute('hx-include', 'test-input[name="custom"]');
        let formData = htmx.__collectFormData(form, form, null);
        assert.deepEqual(formData.getAll('custom'), ['val']);
    });

    it('collects multiple custom elements with same name', function () {
        let form = createProcessedHTML('<form><test-input name="items" value="a"></test-input><test-input name="items" value="b"></test-input></form>');
        let formData = htmx.__collectFormData(form, form, null);
        assert.deepEqual(formData.getAll('items'), ['a', 'b']);
    });
});