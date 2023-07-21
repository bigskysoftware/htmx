htmx.registerExtension('json-enc', {
    encodings: {
        'application/json': parameters => ({
            contentType: 'application/json',
            body: JSON.stringify(parameters)
        })
    }
})
