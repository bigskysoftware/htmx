var server = makeServer();
var autoRespond = localStorage.getItem('hx-scratch-autorespond') == "true";
server.autoRespond = autoRespond;
ready(function () {
    if (autoRespond) {
        byId("autorespond").setAttribute("checked", "true");
    }
})
function toggleAutoRespond() {
    if (server.autoRespond) {
        localStorage.removeItem('hx-scratch-autorespond');
        server.autoRespond = false;
    } else {
        localStorage.setItem('hx-scratch-autorespond', 'true');
        server.autoRespond = true;
    }
}
