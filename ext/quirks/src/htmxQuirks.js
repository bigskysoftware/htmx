var htmxQuirks = (()=>{

    function useHtmxTwoStyleInheritance() {
        let originalAttributeValue = htmx.__attributeValue.bind(htmx);
        htmx.__attributeValue = function (elt, name, defaultVal) {
            if (inheritedAttributes.includes(name)) {
                let value = getClosestAttributeValue(elt, name);
                return value !== null && value !== undefined ? value : defaultVal;
            } else {
                return originalAttributeValue(elt, name, defaultVal)
            }
        };
    }

    function enableAllQuirks() {
        useHtmxTwoStyleInheritance()
    }

    //====================================================================
    // Attribute Inheritance stuff
    //====================================================================

    // Attribute inheritance logic
    const inheritedAttributes = [
        'hx-indicator',
        'hx-disabled-elt',
        'hx-include',
        'hx-target',
        'hx-boost',
        'hx-params',
        'hx-swap',
        'hx-encoding',
        'hx-confirm',
        'hx-sync',
        'hx-prompt',
        'hx-push-url',
        'hx-replace-url',
        'hx-select-oob',
        'hx-select'
    ]

    function getRawAttribute(elt, name) {
        if (elt instanceof Element) {
            return elt.getAttribute(name)
        }
        return null
    }

    /**
     * @param {Element} elt
     * @param {string} qualifiedName
     * @returns {string|null}
     */
    function getAttributeValue(elt, qualifiedName) {
        let value = getRawAttribute(elt, qualifiedName);
        if (value !== null) {
            return value;
        }
        return getRawAttribute(elt, 'data-' + qualifiedName);
    }

    /**
     * @param {Node} elt
     * @returns {Node | null}
     */
    function parentElt(elt) {
        const parent = elt.parentElement
        if (!parent && elt.parentNode instanceof ShadowRoot) return elt.parentNode
        return parent
    }

    function getClosestMatch(elt, condition) {
        while (elt && !condition(elt)) {
            elt = parentElt(elt)
        }

        return elt || null
    }

    /**
     * @param {Element} initialElement
     * @param {Element} ancestor
     * @param {string} attributeName
     * @returns {string|null}
     */
    function getAttributeValueWithDisinheritance(initialElement, ancestor, attributeName) {
        const attributeValue = getAttributeValue(ancestor, attributeName)
        const disinherit = getAttributeValue(ancestor, 'hx-disinherit')
        var inherit = getAttributeValue(ancestor, 'hx-inherit')
        if (initialElement !== ancestor) {
            // no longer necessary: just use htmx 4 :)
            // if (htmx.config.disableInheritance) {
            //     if (inherit && (inherit === '*' || inherit.split(' ').indexOf(attributeName) >= 0)) {
            //         return attributeValue
            //     } else {
            //         return null
            //     }
            // }
            if (disinherit && (disinherit === '*' || disinherit.split(' ').indexOf(attributeName) >= 0)) {
                return 'unset'
            }
        }
        return attributeValue
    }

    function getClosestAttributeValue(elt, attributeName) {
        let closestAttr = null
        getClosestMatch(elt, function(e) {
            closestAttr = getAttributeValueWithDisinheritance(elt, asElement(e), attributeName)
            return closestAttr !== null
        })
        if (closestAttr !== 'unset') {
            return closestAttr
        }
    }

    function asElement(elt) {
        return elt instanceof Element ? elt : null
    }


    return {
        enableAllQuirks,
        useInnerHTMLAsDefaultSwapStrategy,
        useHtmxTwoStyleInheritance
    }
})()
