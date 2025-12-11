//==========================================================
// hx-upsert.js
//
// An extension to add 'upsert' swap style that updates
// existing elements by ID and inserts new ones.
//
// Modifiers:
//   key:attr - attribute name for matching (default: id or data-upsert-key)
//   sort     - sort all elements by key (default: response order)
//   append   - append unmatched new elements (default)
//   prepend  - prepend unmatched new elements
//==========================================================
(() => {
    let api;
    
    htmx.registerExtension('upsert', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        handle_swap: (style, target, fragment, swapSpec) => {
            if (style === 'upsert') {
                let keyAttr = swapSpec.key;
                let existingMap = new Map();
                let newMap = new Map();
                let unkeyed = [];
                
                // Helper to get key from element
                let getKey = (el) => {
                    if (keyAttr) return el.getAttribute(keyAttr);
                    return el.id || el.getAttribute('data-upsert-key');
                };
                
                // Collect existing elements by key
                for (let child of target.children) {
                    let key = getKey(child);
                    if (key) existingMap.set(key, child);
                }
                
                // Process new elements
                for (let newChild of Array.from(fragment.children)) {
                    let key = getKey(newChild);
                    if (key) {
                        newMap.set(key, newChild);
                    } else {
                        unkeyed.push(newChild);
                    }
                }
                
                // Build result fragment with clones of existing + new elements
                let resultFragment = document.createDocumentFragment();
                let result = [];
                
                if (swapSpec.sort) {
                    // Sort by key: merge existing and new, then sort
                    let allElements = new Map();
                    for (let [key, existing] of existingMap) {
                        allElements.set(key, {el: existing, isExisting: true});
                    }
                    for (let [key, newEl] of newMap) {
                        allElements.set(key, {el: newEl, isExisting: false});
                    }
                    
                    let sorted = Array.from(allElements.entries())
                        .sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}));
                    result = sorted.map(([_, {el, isExisting}]) => 
                        isExisting ? el.cloneNode(true) : el
                    );
                    // Add unkeyed elements
                    if (swapSpec.prepend) {
                        result.unshift(...unkeyed);
                    } else {
                        result.push(...unkeyed);
                    }
                } else {
                    // Default: preserve existing, append/prepend new
                    for (let [key, existing] of existingMap) {
                        if (newMap.has(key)) {
                            result.push(newMap.get(key));
                            newMap.delete(key);
                        } else {
                            result.push(existing.cloneNode(true));
                        }
                    }
                    // Add remaining new elements + unkeyed
                    let toAdd = [...newMap.values(), ...unkeyed];
                    if (swapSpec.prepend) {
                        result.unshift(...toAdd);
                    } else {
                        result.push(...toAdd);
                    }
                }
                
                // Build fragment with clones, morph will compare and update live DOM
                resultFragment.append(...result);
                api.morph(target, resultFragment, true);
                
                return true;
            }
            
            return false;
        }
    });
})();
