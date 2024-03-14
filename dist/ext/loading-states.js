;(function () {
	let loadingStatesUndoQueue = []

	function loadingStateContainer(target) {
		return htmx.closest(target, '[data-loading-states]') || document.body
	}

	function mayProcessUndoCallback(target, callback) {
		if (document.body.contains(target)) {
			callback()
		}
	}

	function mayProcessLoadingStateByPath(elt, requestPath) {
		const pathElt = htmx.closest(elt, '[data-loading-path]')
		if (!pathElt) {
			return true
		}

		return pathElt.getAttribute('data-loading-path') === requestPath
	}

	function queueLoadingState(sourceElt, targetElt, doCallback, undoCallback) {
		const delayElt = htmx.closest(sourceElt, '[data-loading-delay]')
		if (delayElt) {
			const delayInMilliseconds =
				delayElt.getAttribute('data-loading-delay') || 200
			const timeout = setTimeout(function () {
				doCallback()

				loadingStatesUndoQueue.push(function () {
					mayProcessUndoCallback(targetElt, undoCallback)
				})
			}, delayInMilliseconds)

			loadingStatesUndoQueue.push(function () {
				mayProcessUndoCallback(targetElt, function () { clearTimeout(timeout) })
			})
		} else {
			doCallback()
			loadingStatesUndoQueue.push(function () {
				mayProcessUndoCallback(targetElt, undoCallback)
			})
		}
	}

	function getLoadingStateElts(loadingScope, type, path) {
		return Array.from(htmx.findAll(loadingScope, "[" + type + "]")).filter(
			function (elt) { return mayProcessLoadingStateByPath(elt, path) }
		)
	}

	function getLoadingTarget(elt) {
		if (elt.getAttribute('data-loading-target')) {
			return Array.from(
				htmx.findAll(elt.getAttribute('data-loading-target'))
			)
		}
		return [elt]
	}

	htmx.defineExtension('loading-states', {
		onEvent: function (name, evt) {
			if (name === 'htmx:beforeRequest') {
				const container = loadingStateContainer(evt.target)

				const loadingStateTypes = [
					'data-loading',
					'data-loading-class',
					'data-loading-class-remove',
					'data-loading-disable',
					'data-loading-aria-busy',
				]

				let loadingStateEltsByType = {}

				loadingStateTypes.forEach(function (type) {
					loadingStateEltsByType[type] = getLoadingStateElts(
						container,
						type,
						evt.detail.pathInfo.requestPath
					)
				})

				loadingStateEltsByType['data-loading'].forEach(function (sourceElt) {
					getLoadingTarget(sourceElt).forEach(function (targetElt) {
						queueLoadingState(
							sourceElt,
							targetElt,
							function () {
								targetElt.style.display =
									sourceElt.getAttribute('data-loading') ||
									'inline-block' },
							function () { targetElt.style.display = 'none' }
						)
					})
				})

				loadingStateEltsByType['data-loading-class'].forEach(
					function (sourceElt) {
						const classNames = sourceElt
							.getAttribute('data-loading-class')
							.split(' ')

						getLoadingTarget(sourceElt).forEach(function (targetElt) {
							queueLoadingState(
								sourceElt,
								targetElt,
								function () {
									classNames.forEach(function (className) {
                                        targetElt.classList.add(className)
                                    })
                                },
								function() {
									classNames.forEach(function (className) {
                                        targetElt.classList.remove(className)
                                    })
                                }
							)
						})
					}
				)

				loadingStateEltsByType['data-loading-class-remove'].forEach(
					function (sourceElt) {
						const classNames = sourceElt
							.getAttribute('data-loading-class-remove')
							.split(' ')

						getLoadingTarget(sourceElt).forEach(function (targetElt) {
							queueLoadingState(
								sourceElt,
								targetElt,
								function () {
									classNames.forEach(function (className) {
                                        targetElt.classList.remove(className)
                                    })
                                },
								function() {
									classNames.forEach(function (className) {
                                        targetElt.classList.add(className)
                                    })
                                }
							)
						})
					}
				)

				loadingStateEltsByType['data-loading-disable'].forEach(
					function (sourceElt) {
						getLoadingTarget(sourceElt).forEach(function (targetElt) {
							queueLoadingState(
								sourceElt,
								targetElt,
								function() { targetElt.disabled = true },
                                function() { targetElt.disabled = false }
							)
						})
					}
				)

				loadingStateEltsByType['data-loading-aria-busy'].forEach(
					function (sourceElt) {
						getLoadingTarget(sourceElt).forEach(function (targetElt) {
							queueLoadingState(
								sourceElt,
								targetElt,
								function () { targetElt.setAttribute("aria-busy", "true") },
								function () { targetElt.removeAttribute("aria-busy") }
							)
						})
					}
				)
			}

			if (name === 'htmx:beforeOnLoad') {
				while (loadingStatesUndoQueue.length > 0) {
					loadingStatesUndoQueue.shift()()
				}
			}
		},
	})
})()
