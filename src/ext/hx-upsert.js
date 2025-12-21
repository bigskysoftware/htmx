//==========================================================
// hx-upsert.js
//
// An extension to add 'upsert' swap style that updates
// existing elements by ID and inserts new ones.
//
// Modifiers:
//   key:attr - attribute name for sorting (default: id)
//   sort - sort ascending
//   sort:desc - sort descending
//   prepend - prepend elements without keys (default: append)
//==========================================================
(() => {
    let api;
    
    htmx.registerExtension('upsert', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        handle_swap: (style, target, fragment, swapSpec) => {
            if (style === 'upsert') {
                let keyAttr = swapSpec.key || 'id';
                let desc = swapSpec.sort === 'desc';
                let firstChild = target.firstChild;
                
                let getKey = (el) => el.getAttribute(keyAttr) || el.id;
                
                let compare = (a, b) => {
                    let result = a.localeCompare(b, undefined, {numeric: true});
                    return desc ? -result : result;
                };
                
                for (let newEl of Array.from(fragment.children)) {
                    let id = newEl.id;
                    if (id) {
                        let existing = document.getElementById(id);
                        if (existing) {
                            existing.outerHTML = newEl.outerHTML
                            // api.morph(existing, newEl);
                            continue;
                        }
                    }
                    
                    let newKey = getKey(newEl);
                    if (!newKey) {
                        if (swapSpec.prepend) {
                            target.insertBefore(newEl, firstChild);
                        } else {
                            target.appendChild(newEl);
                        }
                        continue;
                    }
                    
                    let inserted = false;
                    for (let child of target.children) {
                        let childKey = getKey(child);
                        if (childKey && compare(newKey, childKey) < 0) {
                            target.insertBefore(newEl, child);
                            inserted = true;
                            break;
                        }
                    }
                    
                    if (!inserted) {
                        target.appendChild(newEl);
                    }
                }
                return true;
            }
            return false;
        }
    });
})();
