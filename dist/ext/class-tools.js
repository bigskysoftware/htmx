(function(){

    function splitOnWhitespace(trigger) {
        return trigger.split(/\s+/);
    }

    function parseClassOperation(trimmedValue) {
        var split = splitOnWhitespace(trimmedValue);
        if (split.length > 1) {
            var operation = split[0];
            var classDef = split[1].trim();
            var cssClass;
            var delay;
            if (classDef.indexOf(":") > 0) {
                var splitCssClass = classDef.split(':');
                cssClass = splitCssClass[0];
                delay = parseInterval(splitCssClass[1]);
            } else {
                cssClass = classDef;
                delay = 100;
            }
            return {
                operation:operation,
                cssClass:cssClass,
                delay:delay
            }
        } else {
            return null;
        }
    }

    function processClassList(elt, classList) {
        var runs = classList.split("&");
        for (var i = 0; i < runs.length; i++) {
            var run = runs[i];
            var currentRunTime = 0;
            var classOperations = run.split(",");
            for (var j = 0; j < classOperations.length; j++) {
                var value = classOperations[j];
                var trimmedValue = value.trim();
                var classOperation = parseClassOperation(trimmedValue);
                if (classOperation) {
                    if (classOperation.operation === "toggle") {
                        setTimeout(function () {
                            setInterval(function () {
                                elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass);
                            }, classOperation.delay);
                        }, currentRunTime);
                        currentRunTime = currentRunTime + classOperation.delay;
                    } else {
                        currentRunTime = currentRunTime + classOperation.delay;
                        setTimeout(function () {
                            elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass);
                        }, currentRunTime);
                    }
                }
            }
        }
    }

    htmx.defineExtension('class-tools', {
        onEvent: function (name, evt) {
            if (name === "processedNode.htmx") {
                var elt = evt.detail.elt;
                var classList = elt.getAttribute("classes") || elt.getAttribute("data-classes");
                if (classList) {
                    processClassList(elt, classList);
                }
            }
        }
    });
})();
