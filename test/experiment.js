var foo = (()=> {
    class Foo {
        #field1
        constructor() {
            this.#field1 = 10
        }

        foo() {
            return this.#method2()
        }

        #method2() {
            return this.#method1()
        }

        #method1() {
            return this.#field1
        }
    }

    return new Foo()
})