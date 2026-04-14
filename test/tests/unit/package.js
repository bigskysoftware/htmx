describe('package.json', function () {

    it('has no production dependencies (htmx must stay dependency-free)', async function () {
        // bypass fetchMock — it intercepts all fetch() calls
        let pkg = await (await originalFetch('/package.json')).json();
        let prodFields = ['dependencies', 'peerDependencies', 'optionalDependencies'];
        for (let field of prodFields) {
            let deps = pkg[field];
            if (deps) {
                Object.keys(deps).should.deep.equal([],
                    `package.json.${field} must be empty, found: ${Object.keys(deps).join(', ')}`);
            }
        }
    })

})