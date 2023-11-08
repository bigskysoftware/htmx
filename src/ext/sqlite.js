/*

Extension to use SQLite database backend for Htmx over:
- HTTP as a range requests (used when hx-db starts with http:)
- OPFS

Specify databases with hx-db attributes.
Specify queries with hx-sql attributes (will use closest hx-db).

Requires sqlite-wasm-http bundled and served from same host where your application is,
since Web Workers don't work with cross-domain requests.
This can be done with webpack, for example:

webpack.config:
    module.exports = {
        entry: "./index.js",
        resolve: {
            extensions: [".js"],
        },
        output: {
            filename: "sqlite-wasm-http-[name].js",
            clean: true,
            asyncChunks: false,
        }
    };

package.json:
    {
        "devDependencies": {
            "webpack": "^5.89.0",
            "webpack-cli": "^5.1.4"
        },
        "dependencies": {
            "sqlite-wasm-http": "^1.1.2"
        }
    }

index.js:
    import {createSQLiteHTTPPool} from 'sqlite-wasm-http';
    window.createSQLiteHTTPPool = createSQLiteHTTPPool;


And include in your HTML:
<script src="sqlite-wasm-http-main.js"></script>

*/

(function(){
    var api;
    var httpBackendConfig;

    // lot's of copying from htmx source. It should probably export some of this stuff as functions in internal API?
    var getParameters = function (elt) {
        var results = api.getInputValues(elt, 'post');
        var rawParameters = results.values;
        var expressionVars = api.getExpressionVars(elt);
        var allParameters = api.mergeObjects(rawParameters, expressionVars);
        var filteredParameters = api.filterValues(allParameters, elt);
        return filteredParameters;
    };

    // lot's of copying from htmx source. It should probably export some of this stuff as functions in internal API?
    var swapAndSettle = function(data, elt, responseInfo) {
        var target = api.getTarget(elt);
        if (target == null || target == api.DUMMY_ELT) {
            api.triggerErrorEvent(elt, 'htmx:targetError', {target: api.getAttributeValue(elt, "hx-target")});
            return;
        }

        var shouldSwap = data.length > 0;
        var beforeSwapDetails = {shouldSwap: shouldSwap, target: target, elt: elt};
        if (!api.triggerEvent(target, 'htmx:beforeSwap', beforeSwapDetails)) return;
        target = beforeSwapDetails.target;
        
        responseInfo.target = target;
        responseInfo.failed = false;
        responseInfo.successful = true;

        var serverResponse = JSON.stringify(data);
        if (beforeSwapDetails.shouldSwap) {
            api.withExtensions(elt, function (extension) {
                serverResponse = extension.transformResponse(serverResponse, undefined, elt);
            });

            var swapSpec = api.getSwapSpecification(elt, undefined);

            target.classList.add(htmx.config.swappingClass);

            var doSwap = function () {
                try {
                    var activeElt = document.activeElement;
                    var selectionInfo = {};
                    try {
                        selectionInfo = {
                            elt: activeElt,
                            start: activeElt ? activeElt.selectionStart : null,
                            end: activeElt ? activeElt.selectionEnd : null
                        };
                    } catch (e) {
                        // safari issue - see https://github.com/microsoft/playwright/issues/5894
                    }

                    var settleInfo = api.makeSettleInfo(target);
                    api.selectAndSwap(swapSpec.swapStyle, target, elt, serverResponse, settleInfo, undefined);

                    if (selectionInfo.elt &&
                        !api.bodyContains(selectionInfo.elt) &&
                        api.getRawAttribute(selectionInfo.elt, "id")) {
                        var newActiveElt = document.getElementById(api.getRawAttribute(selectionInfo.elt, "id"));
                        var focusOptions = { preventScroll: swapSpec.focusScroll !== undefined ? !swapSpec.focusScroll : !htmx.config.defaultFocusScroll };
                        if (newActiveElt) {
                            if (selectionInfo.start && newActiveElt.setSelectionRange) {
                                try {
                                    newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end);
                                } catch (e) {
                                    // the setSelectionRange method is present on fields that don't support it, so just let this fail
                                }
                            }
                            newActiveElt.focus(focusOptions);
                        }
                    }

                    target.classList.remove(htmx.config.swappingClass);
                    settleInfo.elts.forEach(function (elt) {
                        if (elt.classList) {
                            elt.classList.add(htmx.config.settlingClass);
                        }
                        api.triggerEvent(elt, 'htmx:afterSwap', responseInfo);
                    });

                    var doSettle = function () {
                        settleInfo.tasks.forEach(function (task) {
                            task.call();
                        });
                        settleInfo.elts.forEach(function (elt) {
                            if (elt.classList) {
                                elt.classList.remove(htmx.config.settlingClass);
                            }
                            api.triggerEvent(elt, 'htmx:afterSettle', responseInfo);
                        });
                    }

                    if (swapSpec.settleDelay > 0) {
                        setTimeout(doSettle, swapSpec.settleDelay)
                    } else {
                        doSettle();
                    }
                } catch (e) {
                    api.triggerErrorEvent(elt, 'htmx:swapError', responseInfo);
                    throw e;
                }
            };

            var shouldTransition = htmx.config.globalViewTransitions
            if(swapSpec.hasOwnProperty('transition')){
                shouldTransition = swapSpec.transition;
            }

            if(shouldTransition &&
                api.triggerEvent(elt, 'htmx:beforeTransition', responseInfo) &&
                typeof Promise !== "undefined" && document.startViewTransition){
                var settlePromise = new Promise(function (_resolve, _reject) {
                    settleResolve = _resolve;
                    settleReject = _reject;
                });
                var innerDoSwap = doSwap;
                doSwap = function() {
                    document.startViewTransition(function () {
                        innerDoSwap();
                        return settlePromise;
                    });
                }
            }


            if (swapSpec.swapDelay > 0) {
                setTimeout(doSwap, swapSpec.swapDelay)
            } else {
                doSwap();
            }
        }
    };

    htmx.defineExtension('sqlite', {
        init: function (internalAPI) {
            api = internalAPI;
            httpBackendConfig = {
                maxPageSize: 4096,    // this is the current default SQLite page size
                timeout: 10000,       // 10s
                cacheSize: 4096       // 4 MB
            };
        },
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode") {
                let elt = evt.detail.elt;

                if (elt.hasAttribute('hx-sql')) {
                    var triggerSpecs = api.getTriggerSpecs(elt);
                    triggerSpecs.forEach(function(triggerSpec) {
                        var nodeData = api.getInternalData(elt);
                        api.addTriggerHandler(elt, triggerSpec, nodeData, function (elt, evt) {
                            if (htmx.closest(elt, htmx.config.disableSelector)) {
                                cleanUpElement(elt);
                                return;
                            }
                            
                            var binds = getParameters(elt);
                            Object.keys(binds).forEach(k => {
                                binds['$' + k] = binds[k];
                                delete binds[k];
                            });

                            var sql = elt.getAttribute('hx-sql');
                            if (sql == "") {
                                sql = elt.value;
                            }

                            let dbURI = htmx.closest(elt, '[hx-db]').getAttribute('hx-db');
                            let isHttp = dbURI.startsWith('http:');

                            const httpBackend = sqliteWasmHttp.createHttpBackend(httpBackendConfig);
                            var result = [];
                            sqliteWasmHttp.createSQLiteThread(isHttp ? { http: httpBackend } : {})
                                .then(db => { db('open', {
                                    filename: encodeURI(dbURI.replace(/^http:/, 'file:')),
                                    vfs: isHttp ? 'http' : 'opfs'
                                }); return db; } )
                                .then(db => db('exec', {
                                    sql: sql,
                                    bind: binds,
                                    rowMode: "object",
                                    callback: data => {
                                        if (data.row) {
                                            result.push(data.row);
                                        } else {
                                            var responseInfo = { elt: elt, xhr: { response: result }, target: api.getTarget(elt) };
                                            if (!api.triggerEvent(elt, 'htmx:beforeOnLoad', responseInfo)) return;

                                            db('close', {})
                                                .then(() => db.close())
                                                .then(() => httpBackend.close());

                                            swapAndSettle(result, elt, responseInfo);
                                        }
                                    }}));
                        })
                    });
                }
            }
        }
    });

})();
