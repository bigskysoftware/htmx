//==========================================================
// hx-upsert.js
//
// An extension to add 'upsert' swap style that updates
// existing elements by ID and inserts new ones.
//
// Modifiers:
//   key:attr - attribute name for matching (default: id or data-upsert-key)
//   sort     - sort all elements by key ascending (default: response order)
//   sort:desc - sort all elements by key descending
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
                let existingUnkeyed = [];
                let newMap = new Map();
                let newUnkeyed = [];
                
                // Helper to get key from element
                let getKey = (el) => {
                    if (keyAttr) return el.getAttribute(keyAttr);
                    return el.id || el.getAttribute('data-upsert-key');
                };
                
                // Collect existing elements by key and unkeyed
                for (let child of target.children) {
                    let key = getKey(child);
                    if (key) existingMap.set(key, child);
                    else existingUnkeyed.push(child);
                }
                
                // Process new elements
                for (let newChild of Array.from(fragment.children)) {
                    let key = getKey(newChild);
                    if (key) {
                        newMap.set(key, newChild);
                    } else {
                        newUnkeyed.push(newChild);
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
                    
                    let sortDir = swapSpec.sort === 'desc' ? -1 : 1;
                    let sorted = Array.from(allElements.entries())
                        .sort((a, b) => sortDir * a[0].localeCompare(b[0], undefined, {numeric: true}));
                    result = sorted.map(([_, {el, isExisting}]) => 
                        isExisting ? el.cloneNode(true) : el
                    );
                    // Add unkeyed elements (existing first, then new)
                    if (swapSpec.prepend) {
                        result.unshift(...newUnkeyed, ...existingUnkeyed);
                    } else {
                        result.push(...existingUnkeyed, ...newUnkeyed);
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
                    let toAdd = [...newMap.values(), ...newUnkeyed];
                    if (swapSpec.prepend) {
                        result.unshift(...toAdd, ...existingUnkeyed);
                    } else {
                        result.push(...existingUnkeyed, ...toAdd);
                    }
                }
                
                // Add temp IDs for morph matching
                let tempIdSet = new Set();
                for (let i = 0; i < result.length; i++) {
                    let newEl = result[i];
                    let key = getKey(newEl);
                    if (key && existingMap.has(key)) {
                        let existing = existingMap.get(key);
                        if (!existing.id && !newEl.id) {
                            let tempId = 'htmx-upsert-' + Math.random().toString(36).substr(2, 9);
                            existing.id = tempId;
                            newEl.id = tempId;
                            tempIdSet.add(tempId);
                        }
                    }
                }
                
                resultFragment.append(...result);
                api.morph(target, resultFragment, true);
                
                // Remove temp IDs from live DOM
                for (let tempId of tempIdSet) {
                    let el = target.querySelector('#' + tempId);
                    if (el) el.removeAttribute('id');
                }
                
                return true;
            }
            
            return false;
        }
    });
})();
