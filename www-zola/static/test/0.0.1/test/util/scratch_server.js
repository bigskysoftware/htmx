var server = makeServer();
var autoRespond = localStorage.getItem('kt-scratch-autorespond') == "true";
server.autoRespond = autoRespond;
ready(function () {
    if (autoRespond) {
        byId("autorespond").setAttribute("checked", "true");
    }
})
function toggleAutoRespond() {
    if (server.autoRespond) {
        localStorage.removeItem('kt-scratch-autorespond');
        server.autoRespond = false;
    } else {
        localStorage.setItem('kt-scratch-autorespond', 'true');
        server.autoRespond = true;
    }
}
