var server = makeServer()
var autoRespond = sessionStorage.getItem('hx-scratch-autorespond') == 'true'
server.autoRespond = autoRespond
ready(function() {
  if (autoRespond) {
    byId('autorespond').setAttribute('checked', 'true')
  }
})
function toggleAutoRespond() {
  if (server.autoRespond) {
    sessionStorage.removeItem('hx-scratch-autorespond')
    server.autoRespond = false
  } else {
    sessionStorage.setItem('hx-scratch-autorespond', 'true')
    server.autoRespond = true
  }
}
