htmx.registerExtension('json-enc', features => {
    features.addEncoding('application/json', parameters => {
        return {
            contentType: 'application/json',
            body: JSON.stringify(parameters)
        }
    })
})
