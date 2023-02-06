(function () {

    function splitOnWhitespace(trigger) {
        return trigger.split(/\s+/);
    }

    function parseClassOperation(trimmedValue) {
        let split = splitOnWhitespace(trimmedValue);
        if (split.length > 1) {
            let operation = split[0];
            let classDef = split[1].trim();
            let cssClass;
            let delay;
            if (classDef.indexOf(":") > 0) {
                let splitCssClass = classDef.split(':');
                cssClass = splitCssClass[0];
                delay = htmx.parseInterval(splitCssClass[1]);
            } else {
                cssClass = classDef;
                delay = 100;
            }
            return {
                operation: operation,
                cssClass: cssClass,
                delay: delay
            }
        } else {
            return null;
        }
    }

    function performOperation(elt, classOperation, classList, currentRunTime) {
        setTimeout(function () {
            elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass);
        }, currentRunTime)
    }

    function toggleOperation(elt, classOperation, classList, currentRunTime) {
        setTimeout(function () {
            setInterval(function () {
                elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass);
            }, classOperation.delay);
        }, currentRunTime)
    }

    function processClassList(elt, classList) {
        let runs = classList.split("&");
        for (let i = 0; i < runs.length; i++) {
            let run = runs[i];
            let currentRunTime = 0;
            let classOperations = run.split(",");
            for (let j = 0; j < classOperations.length; j++) {
                let value = classOperations[j];
                let trimmedValue = value.trim();
                let classOperation = parseClassOperation(trimmedValue);
                if (classOperation) {
                    if (classOperation.operation === "toggle") {
                        toggleOperation(elt, classOperation, classList, currentRunTime);
                        currentRunTime = currentRunTime + classOperation.delay;
                    } else {
                        currentRunTime = currentRunTime + classOperation.delay;
                        performOperation(elt, classOperation, classList, currentRunTime);
                    }
                }
            }
        }
    }

    function maybeProcessClasses(elt) {
        if (elt.getAttribute) {
            let classList = elt.getAttribute("classes") || elt.getAttribute("data-classes");
            if (classList) {
                processClassList(elt, classList);
            }
        }
    }

    htmx.defineExtension('class-tools', {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode") {
                let elt = evt.detail.elt;
                maybeProcessClasses(elt);
                if (elt.querySelectorAll) {
                    let children = elt.querySelectorAll("[classes], [data-classes]");
                    for (let i = 0; i < children.length; i++) {
                        maybeProcessClasses(children[i]);
                    }
                }
            }
        }
    });
})();