//==========================================================
// hx-head.js
//
// An extension to add head tag merging.
//==========================================================
(function () {

    let api

    // Appends a new head node, returning a promise for render-critical resources
    // (blocking scripts, stylesheets) or null for fire-and-forget resources.
    function appendNode(newNode) {
        let newElt = document.createElement(newNode.tagName)
        for (const attr of newNode.attributes) newElt.setAttribute(attr.name, attr.value)
        newElt.textContent = newNode.textContent

        // stylesheet: await CSSOM or content will flash unstyled
        if (newNode.tagName === "LINK" && newNode.rel === "stylesheet") {
            return new Promise(resolve => {
                newElt.onload = resolve
                newElt.onerror = resolve  // failed stylesheet shouldn't block swap
                document.head.appendChild(newElt)
            })
        }

        // blocking external script (no async/defer, not a module): must init before swap
        if (newNode.tagName === "SCRIPT" && newNode.src && !newNode.async && !newNode.defer && newNode.type !== "module") {
            return new Promise((resolve, reject) => {
                newElt.onload = resolve
                newElt.onerror = reject
                document.head.appendChild(newElt)
            })
        }

        // meta, title, base, preload/prefetch/icon links, async scripts: fire-and-forget
        document.head.appendChild(newElt)
        if (newNode._preloadHint) newElt.addEventListener("load", () => newNode._preloadHint.remove(), {once: true})
        return null
    }

    async function mergeHead(newContent, defaultMergeStrategy) {

        if (newContent && newContent.indexOf('<head') > -1) {
            const htmlDoc = document.createElement("html")
            // remove svgs to avoid conflicts
            let contentWithSvgsRemoved = newContent.replace(/<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim, '')
            // extract head tag
            let headTag = contentWithSvgsRemoved.match(/(<head(\s[^>]*>|>)([\s\S]*?)<\/head>)/im)

            // if the  head tag exists...
            if (headTag) {

                let added = []
                let toRemove = []
                let removed = []
                let preserved = []
                let nodesToAppend = []
                let deferred = []

                htmlDoc.innerHTML = headTag
                let newHeadTag = htmlDoc.querySelector("head")
                let currentHead = document.head

                if (newHeadTag == null) {
                    return []
                }

                // put all new head elements into a Map, by their outerHTML
                // title is excluded - core htmx handles document.title updates
                let srcToNewHeadNodes = new Map()
                for (const newHeadChild of newHeadTag.children) {
                    if (newHeadChild.tagName !== "TITLE") {
                        srcToNewHeadNodes.set(newHeadChild.outerHTML, newHeadChild)
                    }
                }

                let responseHasTitle = !!newHeadTag.querySelector("title")

                // determine merge strategy
                let mergeStrategy = api.attributeValue(newHeadTag, "hx-head") || defaultMergeStrategy

                // get the current head
                for (const currentHeadElt of currentHead.children) {

                    // If the current head element is in the map
                    let inNewContent = srcToNewHeadNodes.has(currentHeadElt.outerHTML)
                    let isReAppended = currentHeadElt.getAttribute("hx-head") === "re-eval"
                    let isPreserved = api.attributeValue(currentHeadElt, "hx-preserve") === "true"
                    if (inNewContent || isPreserved) {
                        if (isReAppended) {
                            // remove the current version and let the new version replace it and re-execute
                            toRemove.push(currentHeadElt)
                        } else {
                            // this element already exists and should not be re-appended, so remove it from
                            // the new content map, preserving it in the DOM
                            srcToNewHeadNodes.delete(currentHeadElt.outerHTML)
                            preserved.push(currentHeadElt)
                        }
                    } else {
                        let isTitle = currentHeadElt.tagName === "TITLE"
                        let shouldRemoveTitle = isTitle && (mergeStrategy !== "append" || (!responseHasTitle && htmx.config.head?.clearTitle))
                        if ((!isTitle && mergeStrategy !== "append") || shouldRemoveTitle) {
                            // in merge mode: remove non-title elements not in new content, and title if present
                            // in append mode: only remove title if response has no title and clearTitle is set
                            toRemove.push(currentHeadElt)
                        } else if (isReAppended) {
                            // append mode: only re-eval marked elements
                            toRemove.push(currentHeadElt)
                            nodesToAppend.push(currentHeadElt)
                        }
                    }
                }

                // Push the remaining new head elements in the Map into the
                // nodes to append to the head tag
                nodesToAppend.push(...srcToNewHeadNodes.values())

                // defer scripts need the swapped DOM to exist, so split them out
                for (const newNode of nodesToAppend) {
                    if (newNode.tagName === "SCRIPT" && (newNode.defer || newNode.type === "module")) {
                        deferred.push(newNode)
                        if (newNode.src) {
                            let hint = document.createElement("link")
                            hint.rel = newNode.type === "module" ? "modulepreload" : "preload"
                            hint.as = "script"
                            hint.href = newNode.src
                            document.head.appendChild(hint)
                            newNode._preloadHint = hint
                        }
                    } else {
                        if (api.triggerHtmxEvent(document.body, "htmx:head:before:add", {headElement: newNode}) !== false) {
                            await appendNode(newNode)
                            added.push(newNode)
                        }
                    }
                }

                // remove all removed elements, after we have appended the new elements to avoid
                // additional network requests for things like style sheets
                for (const removedElement of toRemove) {
                    if (api.triggerHtmxEvent(document.body, "htmx:head:before:remove", {headElement: removedElement}) !== false) {
                        currentHead.removeChild(removedElement)
                        removed.push(removedElement)
                    }
                }

                api.triggerHtmxEvent(document.body, "htmx:head:after:merge", {
                    added: added,
                    kept: preserved,
                    removed: removed
                })

                return deferred
            }
        }
        return []
    }

    htmx.registerExtension("hx-head", {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_before_response: (elt, detail) => {
            let ctx = detail.ctx
            let target = ctx.target
            // TODO - is there a better way to handle this?  it used to be based on if the element was boosted
            let defaultMergeStrategy = target === document.body ? "merge" : "append";
            if (api.triggerHtmxEvent(document.body, "htmx:head:before:merge", detail)) {
                let realText = ctx.response.raw.text.bind(ctx.response.raw)
                ctx.response.raw.text = async () => {
                    let text = await realText()
                    ctx._deferredHeadScripts = await mergeHead(text, defaultMergeStrategy)
                    return text
                }
            }
        },
        htmx_after_swap: (elt, detail) => {
            for (const node of detail.ctx._deferredHeadScripts || []) appendNode(node)
        },
        htmx_history_cache_before_restore: (elt, detail) => {
            if (detail.head) {
                // mergeHead awaits stylesheets/blocking scripts, returns deferred scripts.
                // Set detail.ready so history-cache awaits before swapping body.
                // Stash deferred scripts on detail so history-cache copies them onto the swap ctx
                // so htmx_after_swap picks them up.
                detail.ready = mergeHead(detail.head, 'merge').then(deferred => {
                    detail._deferredHeadScripts = deferred;
                });
            }
        },
        htmx_history_cache_after_restore: (elt, detail) => {
            for (const node of detail._deferredHeadScripts || []) appendNode(node)
        }
    })

})();
