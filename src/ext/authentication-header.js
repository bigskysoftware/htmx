htmx.defineExtension('authentication-header', {

	transformRequest: function(xhr) {
		
		if (window.sessionStorage) {
			let auth = window.sessionStorage.getItem("Authentication")
			if (auth != "") {
				xhr.setRequestHeader("Authentication", auth)
			}
		}
		return xhr
	},

	transformResponse: function(message, xhr, elt) {

		if (window.sessionStorage) {
			let auth = xhr.getResponseHeader("Authentication")
			if (auth != "") {
				window.sessionStorage.setItem("Authentication", auth)
			}
		}

		return message
	}
});
