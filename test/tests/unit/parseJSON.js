describe('parseJSON unit tests', function() {

    // Basic JSON5-lite functionality
    it('parses unquoted keys', function () {
        assert.deepEqual(htmx.parseJSON('{timeout: 5000}'), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('{cache: "no-cache"}'), {cache: "no-cache"})
    })

    it('auto-wraps unwrapped object in braces', function () {
        assert.deepEqual(htmx.parseJSON('timeout: 5000'), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('cache: "no-cache"'), {cache: "no-cache"})
    })

    it('handles multiple unquoted keys', function () {
        assert.deepEqual(htmx.parseJSON('timeout: 5000, cache: "no-cache"'), {timeout: 5000, cache: "no-cache"})
        assert.deepEqual(htmx.parseJSON('{timeout: 5000, cache: "no-cache"}'), {timeout: 5000, cache: "no-cache"})
    })

    // Backward compatibility with standard JSON
    it('parses standard JSON with quoted keys', function () {
        assert.deepEqual(htmx.parseJSON('{"timeout": 5000}'), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('{"timeout": 5000, "cache": "no-cache"}'), {timeout: 5000, cache: "no-cache"})
    })

    it('parses strict JSON with linebreaks', function () {
        assert.deepEqual(htmx.parseJSON('{\n  "key": "value"\n}'), {key: "value"})
        assert.deepEqual(
            htmx.parseJSON('{\n  "nested": {\n    "key": "value"\n  }\n}'),
            {nested: {key: "value"}}
        )
    })

    it('parses strict JSON with complex multiline formatting', function () {
        const json = `{
    "timeout": 5000,
    "headers": {
        "Accept": "application/json"
    }
}`
        assert.deepEqual(htmx.parseJSON(json), {
            timeout: 5000,
            headers: {Accept: "application/json"}
        })
    })

    // Value types
    it('parses numeric values', function () {
        assert.deepEqual(htmx.parseJSON('timeout: 5000'), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('count: 0'), {count: 0})
        assert.deepEqual(htmx.parseJSON('pi: 3.14'), {pi: 3.14})
        assert.deepEqual(htmx.parseJSON('negative: -42'), {negative: -42})
    })

    it('parses string values', function () {
        assert.deepEqual(htmx.parseJSON('cache: "no-cache"'), {cache: "no-cache"})
        assert.deepEqual(htmx.parseJSON('method: "POST"'), {method: "POST"})
        assert.deepEqual(htmx.parseJSON('empty: ""'), {empty: ""})
    })

    it('parses boolean values', function () {
        assert.deepEqual(htmx.parseJSON('validate: true'), {validate: true})
        assert.deepEqual(htmx.parseJSON('validate: false'), {validate: false})
        assert.deepEqual(htmx.parseJSON('flag1: true, flag2: false'), {flag1: true, flag2: false})
    })

    it('parses null values', function () {
        assert.deepEqual(htmx.parseJSON('value: null'), {value: null})
        assert.deepEqual(htmx.parseJSON('{value: null}'), {value: null})
    })

    it('parses arrays', function () {
        assert.deepEqual(htmx.parseJSON('items: [1, 2, 3]'), {items: [1, 2, 3]})
        assert.deepEqual(htmx.parseJSON('names: ["a", "b", "c"]'), {names: ["a", "b", "c"]})
        assert.deepEqual(htmx.parseJSON('empty: []'), {empty: []})
        assert.deepEqual(htmx.parseJSON('mixed: [1, "two", true, null]'), {mixed: [1, "two", true, null]})
    })

    // Nested objects
    it('parses nested objects with unquoted keys', function () {
        assert.deepEqual(htmx.parseJSON('streams: {reconnect: true}'), {streams: {reconnect: true}})
        assert.deepEqual(htmx.parseJSON('{streams: {reconnect: true, delay: 50}}'), {streams: {reconnect: true, delay: 50}})
    })

    it('parses deeply nested objects', function () {
        assert.deepEqual(
            htmx.parseJSON('custom: {nested: {deep: "value"}}'),
            {custom: {nested: {deep: "value"}}}
        )
    })

    it('parses nested objects in unwrapped format', function () {
        assert.deepEqual(
            htmx.parseJSON('timeout: 5000, streams: {reconnect: true, reconnectDelay: 50}'),
            {timeout: 5000, streams: {reconnect: true, reconnectDelay: 50}}
        )
    })

    // Whitespace handling
    it('handles various whitespace patterns', function () {
        assert.deepEqual(htmx.parseJSON('  timeout: 5000  '), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('timeout:5000'), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('timeout : 5000'), {timeout: 5000})
        assert.deepEqual(htmx.parseJSON('  {  timeout  :  5000  }  '), {timeout: 5000})
    })

    it('handles whitespace around commas', function () {
        assert.deepEqual(htmx.parseJSON('a: 1,b: 2,c: 3'), {a: 1, b: 2, c: 3})
        assert.deepEqual(htmx.parseJSON('a: 1 , b: 2 , c: 3'), {a: 1, b: 2, c: 3})
        assert.deepEqual(htmx.parseJSON('a:1,  b:2,  c:3'), {a: 1, b: 2, c: 3})
    })

    // Key naming edge cases
    it('parses keys with underscores', function () {
        assert.deepEqual(htmx.parseJSON('my_key: "value"'), {my_key: "value"})
        assert.deepEqual(htmx.parseJSON('_private: true'), {_private: true})
        assert.deepEqual(htmx.parseJSON('__dunder__: 42'), {__dunder__: 42})
    })

    it('parses keys with dollar signs', function () {
        assert.deepEqual(htmx.parseJSON('$special: "value"'), {$special: "value"})
        assert.deepEqual(htmx.parseJSON('key$: 123'), {key$: 123})
        assert.deepEqual(htmx.parseJSON('$_combo: true'), {$_combo: true})
    })

    it('parses keys with numbers (not at start)', function () {
        assert.deepEqual(htmx.parseJSON('key123: "value"'), {key123: "value"})
        assert.deepEqual(htmx.parseJSON('item2: 42'), {item2: 42})
        assert.deepEqual(htmx.parseJSON('test_123: true'), {test_123: true})
    })

    it('parses camelCase and mixed case keys', function () {
        assert.deepEqual(htmx.parseJSON('myKey: "value"'), {myKey: "value"})
        assert.deepEqual(htmx.parseJSON('thisIsALongKey: 123'), {thisIsALongKey: 123})
        assert.deepEqual(htmx.parseJSON('XMLHttpRequest: true'), {XMLHttpRequest: true})
    })

    // Keys that must be quoted (start with numbers or contain special chars)
    it('requires quotes for keys starting with numbers', function () {
        assert.deepEqual(htmx.parseJSON('{"123": "value"}'), {"123": "value"})
    })

    it('requires quotes for keys with hyphens', function () {
        assert.deepEqual(htmx.parseJSON('{"my-key": "value"}'), {"my-key": "value"})
        assert.deepEqual(htmx.parseJSON('{"x-custom-header": "value"}'), {"x-custom-header": "value"})
    })

    it('requires quotes for keys with spaces', function () {
        assert.deepEqual(htmx.parseJSON('{"my key": "value"}'), {"my key": "value"})
    })

    it('requires quotes for keys with dots', function () {
        assert.deepEqual(htmx.parseJSON('{"my.key": "value"}'), {"my.key": "value"})
    })

    // Mixed quoted and unquoted keys
    it('handles mixed quoted and unquoted keys', function () {
        assert.deepEqual(
            htmx.parseJSON('timeout: 5000, "x-custom": "value"'),
            {timeout: 5000, "x-custom": "value"}
        )
        assert.deepEqual(
            htmx.parseJSON('{myKey: "value", "my-key": "other"}'),
            {myKey: "value", "my-key": "other"}
        )
    })

    // Empty and minimal inputs
    it('parses empty object', function () {
        assert.deepEqual(htmx.parseJSON('{}'), {})
        assert.deepEqual(htmx.parseJSON('  {}  '), {})
    })

    // Special characters in string values
    it('handles special characters in string values', function () {
        assert.deepEqual(htmx.parseJSON('path: "/api/test"'), {path: "/api/test"})
        assert.deepEqual(htmx.parseJSON('html: "<div>test</div>"'), {html: "<div>test</div>"})
        assert.deepEqual(htmx.parseJSON('escaped: "quote: \\"test\\""'), {escaped: 'quote: "test"'})
    })

    it('handles unicode in string values', function () {
        assert.deepEqual(htmx.parseJSON('emoji: "😀"'), {emoji: "😀"})
        assert.deepEqual(htmx.parseJSON('chinese: "你好"'), {chinese: "你好"})
    })

    // Complex real-world examples
    it('parses complex hx-config examples', function () {
        assert.deepEqual(
            htmx.parseJSON('timeout: 5000, cache: "no-cache", validate: false'),
            {timeout: 5000, cache: "no-cache", validate: false}
        )
    })

    it('parses nested config for streams', function () {
        assert.deepEqual(
            htmx.parseJSON('streams: {reconnect: true, reconnectDelay: 50, maxRetries: 5}'),
            {streams: {reconnect: true, reconnectDelay: 50, maxRetries: 5}}
        )
    })

    it('parses config with + prefix for merging', function () {
        assert.deepEqual(
            htmx.parseJSON('"+headers": {"X-Custom": "value"}'),
            {"+headers": {"X-Custom": "value"}}
        )
    })

    it('parses multiple nested objects', function () {
        assert.deepEqual(
            htmx.parseJSON('timeout: 1000, headers: {Accept: "application/json"}, streams: {reconnect: true}'),
            {timeout: 1000, headers: {Accept: "application/json"}, streams: {reconnect: true}}
        )
    })

    // Arrays of objects
    it('parses arrays of objects with unquoted keys', function () {
        assert.deepEqual(
            htmx.parseJSON('items: [{id: 1, name: "a"}, {id: 2, name: "b"}]'),
            {items: [{id: 1, name: "a"}, {id: 2, name: "b"}]}
        )
    })

    // Edge cases with nested structures
    it('handles nested arrays in objects', function () {
        assert.deepEqual(
            htmx.parseJSON('config: {items: [1, 2, 3], names: ["a", "b"]}'),
            {config: {items: [1, 2, 3], names: ["a", "b"]}}
        )
    })

    it('handles objects in arrays in objects', function () {
        assert.deepEqual(
            htmx.parseJSON('data: {list: [{id: 1}, {id: 2}]}'),
            {data: {list: [{id: 1}, {id: 2}]}}
        )
    })

    // Very long keys
    it('handles long key names', function () {
        const longKey = 'thisIsAVeryLongKeyNameThatSomeoneDecidedToUseForSomeReason'
        assert.deepEqual(
            htmx.parseJSON(`${longKey}: "value"`),
            {[longKey]: "value"}
        )
    })

    // Multiple levels of nesting
    it('handles 4+ levels of nesting', function () {
        assert.deepEqual(
            htmx.parseJSON('a: {b: {c: {d: {e: "deep"}}}}'),
            {a: {b: {c: {d: {e: "deep"}}}}}
        )
    })

    // Whitespace handling with deep nesting
    it('handles deeply nested relaxed JSON with whitespace', function () {
        const json = `{
            level1: {
                level2: {
                    level3: {
                        level4: {
                            deep: "value"
                        }
                    }
                }
            }
        }`
        assert.deepEqual(htmx.parseJSON(json), {
            level1: {
                level2: {
                    level3: {
                        level4: {
                            deep: "value"
                        }
                    }
                }
            }
        })
    })

    it('handles mixed quoted/unquoted with whitespace', function () {
        const json = `{
            timeout: 5000,
            "x-custom": "header",
            nested: {
                key1: "value1",
                "key-2": "value2"
            }
        }`
        assert.deepEqual(htmx.parseJSON(json), {
            timeout: 5000,
            "x-custom": "header",
            nested: {
                key1: "value1",
                "key-2": "value2"
            }
        })
    })

    it('handles unwrapped deeply nested with whitespace', function () {
        const json = `
            level1: {
                level2: {
                    level3: "deep"
                },
                sibling: true
            }
        `
        assert.deepEqual(htmx.parseJSON(json), {
            level1: {
                level2: {
                    level3: "deep"
                },
                sibling: true
            }
        })
    })

    it('handles complex realistic multiline config', function () {
        const json = `
            streams: {
                reconnect: true,
                reconnectDelay: 50,
                reconnectMaxDelay: 10000
            },
            headers: {
                Accept: "application/json",
                "Content-Type": "text/html"
            },
            timeout: 5000
        `
        assert.deepEqual(htmx.parseJSON(json), {
            streams: {
                reconnect: true,
                reconnectDelay: 50,
                reconnectMaxDelay: 10000
            },
            headers: {
                Accept: "application/json",
                "Content-Type": "text/html"
            },
            timeout: 5000
        })
    })

    // Reserved JavaScript words as keys
    it('handles JavaScript reserved words as keys', function () {
        assert.deepEqual(htmx.parseJSON('class: "test"'), {class: "test"})
        assert.deepEqual(htmx.parseJSON('return: 42'), {return: 42})
        assert.deepEqual(htmx.parseJSON('if: true'), {if: true})
        assert.deepEqual(htmx.parseJSON('function: "fn"'), {function: "fn"})
        assert.deepEqual(htmx.parseJSON('var: "value"'), {var: "value"})
        assert.deepEqual(htmx.parseJSON('const: "constant"'), {const: "constant"})
        assert.deepEqual(htmx.parseJSON('let: "variable"'), {let: "variable"})
    })

    // Escaped characters in keys (must be quoted)
    it('handles escaped quotes in string values', function () {
        assert.deepEqual(
            htmx.parseJSON('message: "He said \\"hello\\""'),
            {message: 'He said "hello"'}
        )
    })

    it('handles backslashes in string values', function () {
        assert.deepEqual(
            htmx.parseJSON('path: "C:\\\\Users\\\\test"'),
            {path: "C:\\Users\\test"}
        )
    })

    // Special numeric values
    it('handles scientific notation', function () {
        assert.deepEqual(htmx.parseJSON('big: 1e10'), {big: 1e10})
        assert.deepEqual(htmx.parseJSON('small: 1e-10'), {small: 1e-10})
        assert.deepEqual(htmx.parseJSON('scientific: 3.14e2'), {scientific: 3.14e2})
    })

    it('handles very large numbers', function () {
        assert.deepEqual(htmx.parseJSON('huge: 999999999999999'), {huge: 999999999999999})
    })

    it('handles very small decimals', function () {
        assert.deepEqual(htmx.parseJSON('tiny: 0.000000001'), {tiny: 0.000000001})
    })

    // Edge case: keys at different positions
    it('parses unquoted key after comma in nested object', function () {
        assert.deepEqual(
            htmx.parseJSON('{outer: {first: 1, second: 2}}'),
            {outer: {first: 1, second: 2}}
        )
    })

    it('parses unquoted key at start of object', function () {
        assert.deepEqual(
            htmx.parseJSON('{first: 1}'),
            {first: 1}
        )
    })

    // Realistic htmx use cases
    it('parses timeout config', function () {
        assert.deepEqual(htmx.parseJSON('timeout: 5000'), {timeout: 5000})
    })

    it('parses action override', function () {
        assert.deepEqual(htmx.parseJSON('action: "/api/endpoint"'), {action: "/api/endpoint"})
    })

    it('parses method override', function () {
        assert.deepEqual(htmx.parseJSON('method: "PUT"'), {method: "PUT"})
    })

    it('parses headers with unquoted object keys', function () {
        assert.deepEqual(
            htmx.parseJSON('headers: {Accept: "application/json", Authorization: "Bearer token"}'),
            {headers: {Accept: "application/json", Authorization: "Bearer token"}}
        )
    })

    it('parses etag config', function () {
        assert.deepEqual(htmx.parseJSON('etag: true'), {etag: true})
    })

    it('parses validate config', function () {
        assert.deepEqual(htmx.parseJSON('validate: false'), {validate: false})
    })

    // String values with colons
    it('handles colons in string values', function () {
        assert.deepEqual(
            htmx.parseJSON('url: "http://example.com"'),
            {url: "http://example.com"}
        )
        assert.deepEqual(
            htmx.parseJSON('time: "12:30:45"'),
            {time: "12:30:45"}
        )
    })

    // String values with curly braces
    it('handles curly braces in string values', function () {
        assert.deepEqual(
            htmx.parseJSON('template: "{name}"'),
            {template: "{name}"}
        )
        assert.deepEqual(
            htmx.parseJSON('pattern: "{{value}}"'),
            {pattern: "{{value}}"}
        )
    })

    // Mixed everything
    it('handles complex mixed structure', function () {
        assert.deepEqual(
            htmx.parseJSON('timeout: 5000, headers: {Accept: "application/json"}, validate: false, items: [1, 2, 3], nested: {deep: {value: true}}'),
            {timeout: 5000, headers: {Accept: "application/json"}, validate: false, items: [1, 2, 3], nested: {deep: {value: true}}}
        )
    })

    // Tab and newline characters (from JSON.parse)
    it('handles escaped tabs and newlines in strings', function () {
        assert.deepEqual(
            htmx.parseJSON('text: "line1\\nline2"'),
            {text: "line1\nline2"}
        )
        assert.deepEqual(
            htmx.parseJSON('text: "col1\\tcol2"'),
            {text: "col1\tcol2"}
        )
    })

    // Edge case: Single property no spaces
    it('parses minimal single property', function () {
        assert.deepEqual(htmx.parseJSON('a:1'), {a: 1})
        assert.deepEqual(htmx.parseJSON('x:true'), {x: true})
        assert.deepEqual(htmx.parseJSON('s:"v"'), {s: "v"})
    })

    // Error cases - these should throw
    it('throws on invalid JSON after transformation', function () {
        assert.throws(() => htmx.parseJSON('invalid json {'))
        assert.throws(() => htmx.parseJSON('key: value without quotes'))
        assert.throws(() => htmx.parseJSON('{a: 1, b: 2'))  // missing closing brace
        assert.throws(() => htmx.parseJSON('a: 1, b: 2}'))  // extra closing brace after auto-wrap
    })

    it('throws on trailing commas', function () {
        assert.throws(() => htmx.parseJSON('a: 1,'))
        assert.throws(() => htmx.parseJSON('{a: 1, b: 2,}'))
    })

    it('throws on undefined/unquoted string values', function () {
        assert.throws(() => htmx.parseJSON('key: unquoted'))
        assert.throws(() => htmx.parseJSON('key: some-value'))
    })

    // Config option tests
    it('respects config.relaxedJSON = false', function () {
        const originalValue = htmx.config.relaxedJSON
        try {
            htmx.config.relaxedJSON = false

            // Should require strict JSON
            assert.throws(() => htmx.parseJSON('timeout: 5000'))
            assert.throws(() => htmx.parseJSON('{timeout: 5000}'))

            // Should work with proper JSON
            assert.deepEqual(htmx.parseJSON('{"timeout": 5000}'), {timeout: 5000})
        } finally {
            htmx.config.relaxedJSON = originalValue
        }
    })

    it('defaults to relaxed JSON when config is true', function () {
        const originalValue = htmx.config.relaxedJSON
        try {
            htmx.config.relaxedJSON = true

            // Should parse relaxed syntax
            assert.deepEqual(htmx.parseJSON('timeout: 5000'), {timeout: 5000})
            assert.deepEqual(htmx.parseJSON('{timeout: 5000}'), {timeout: 5000})
        } finally {
            htmx.config.relaxedJSON = originalValue
        }
    })

    it('defaults to relaxed JSON when config is not set', function () {
        const originalValue = htmx.config.relaxedJSON
        try {
            delete htmx.config.relaxedJSON

            // Should default to relaxed (undefined !== false)
            assert.deepEqual(htmx.parseJSON('timeout: 5000'), {timeout: 5000})
            assert.deepEqual(htmx.parseJSON('{timeout: 5000}'), {timeout: 5000})
        } finally {
            htmx.config.relaxedJSON = originalValue
        }
    })

})
