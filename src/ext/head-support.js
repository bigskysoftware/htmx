//==========================================================
// head-support.js
//
// An extension to htmx 1.0 to add head tag merging.
//==========================================================
(function(){

    var api = null;

    function log() {
        //console.log(arguments);
    }

    function mergeHead(newContent) {

        if (newContent && newContent.indexOf('<head') > -1) {
            const htmlDoc = document.createElement("html");
            // remove svgs to avoid conflicts
            var contentWithSvgsRemoved = newContent.replace(/<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim, '');
            // extract head tag
            var headTag = contentWithSvgsRemoved.match(/(<head(\s[^>]*>|>)([\s\S]*?)<\/head>)/im);

            // if the  head tag exists...
            if (headTag) {

                var added = []
                var removed = []
                var kept = []


                htmlDoc.innerHTML = headTag;
                var newHeadTag = htmlDoc.querySelector("head");

                //
                var appendOnly = false;
                if (api.getAttributeValue(newHeadTag, "hx-swap-oob") === "beforeend") {
                    appendOnly = true;
                }

                // put all new head elements into a Map, by their outerHTML
                var srcToNewHeadNodes = new Map();
                var newHeadChildren = newHeadTag.children;
                for (let i = 0; i < newHeadChildren.length; i++) {
                    const newHeadChild = newHeadChildren[i];
                    srcToNewHeadNodes.set(newHeadChild.outerHTML, newHeadChild);
                }

                // iterate the existing head elements
                var currentHead = document.querySelector("head");
                var currentHeadChildren = currentHead.children;
                for (let i = 0; i < currentHeadChildren.length; i++) {
                    const currentHeadChild = currentHeadChildren[i];

                    // If the current head element is in the map
                    if (srcToNewHeadNodes.has(currentHeadChild.outerHTML)) {

                        // Remove it from the map, we aren't going to insert it and
                        // the current element can stay
                        log(currentHeadChild, " found in current head content, removing from Map");
                        srcToNewHeadNodes.delete(currentHeadChild.outerHTML);
                        kept.push(currentHeadChild);
                    } else {
                        // If the current head element is NOT in the map, remove it
                        if (appendOnly === false &&
                            api.getAttributeValue(currentHeadChild, "hx-preserve") !== "true" &&
                            api.triggerEvent(document.body, "htmx:removingHeadElement", {headElement: currentHeadChild}) !== false) {
                            log(currentHeadChild, " not found in new content, removing from head tag");
                            removed.push(currentHeadChild);
                        }
                    }
                }

                // remove all removed elements
                for (let i = 0; i < removed.length; i++) {
                    const removedElement = removed[i];
                    currentHead.removeChild(removedElement);
                }

                // The remaining elements in the Map are in the new content but
                // not in the old content, so add them (using a contextual fragment
                // so that script tags will evaluate)
                var remainder = srcToNewHeadNodes.keys();
                log("remainder: ", remainder);
                for (const remainderNodeSource of remainder) {
                    log("adding: ", remainderNodeSource);
                    var newElt = document.createRange().createContextualFragment(remainderNodeSource);
                    log(newElt);
                    if (api.triggerEvent(document.body, "htmx:addingHeadElement", {headElement: newElt}) !== false) {
                        currentHead.appendChild(newElt);
                        added.push(newElt);
                    }
                }

                api.triggerEvent(document.body, "htmx:afterHeadMerge", {added: added, kept: kept, removed: removed});
            }
        }
    }

    htmx.defineExtension("head-support", {
        init: function(apiRef) {
            // store a reference to the internal API.
            api = apiRef;

            htmx.on('htmx:afterSwap', function(evt){
                var serverResponse = evt.detail.xhr.response;
                if (api.triggerEvent(document.body, "htmx:beforeHeadMerge", evt.detail)) {
                    mergeHead(serverResponse);
                }
            })

            htmx.on('htmx:historyRestore', function(evt){
                if (api.triggerEvent(document.body, "htmx:beforeHeadMerge", evt.detail)) {
                    if (evt.detail.cacheMiss) {
                        mergeHead(evt.detail.serverResponse);
                    } else {
                        mergeHead(evt.detail.item.head);
                    }
                }
            })

            htmx.on('htmx:historyItemCreated', function(evt){
                var historyItem = evt.detail.item;
                historyItem.head = document.head.outerHTML;
            })
        }
    });

})()