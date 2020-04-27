/* Test Utilities */
function byId(id) {
    return document.getElementById(id);
}

function make(htmlStr) {
    let range = document.createRange();
    let fragment = range.createContextualFragment(htmlStr);
    let wa = getWorkArea();
    for (let i = fragment.children.length - 1; i >= 0; i--) {
        const child = fragment.children[i];
        HTMx.processElement(child);
        wa.appendChild(child);
    }
    return wa.lastChild;
}

function getWorkArea() {
    return byId("work-area");
}

function clearWorkArea() {
    getWorkArea().innerHTML = "";
}
