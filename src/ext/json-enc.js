htmx.defineExtension("json-enc", {
  onEvent: function (name, evt) {
    if (name === "htmx:configRequest") {
      evt.detail.headers["Content-Type"] = "application/json";
    }
  },

  encodeParameters: function (xhr, parameters, elt) {
    xhr.overrideMimeType("text/json");
    for (const key in parameters) {
      const tryNum = parseFloat(parameters[key]);
      if (parameters[key] == tryNum) {
        parameters[key] = tryNum;
      }
    }
    return JSON.stringify(parameters);
  },
});
