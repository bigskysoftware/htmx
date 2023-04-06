import htmx from "./htmx";

// add the class 'myClass' to the element with the id 'demo'
htmx.addClass(htmx.find("#demo"), "myClass");

// issue a GET to /example and put the response HTML into #myDiv
htmx.ajax("GET", "/example", "#myDiv");

// find the closest enclosing div of the element with the id 'demo'
htmx.closest(htmx.find("#demo"), "div");

// update the history cache size to 30
htmx.config.historyCacheSize = 30;

// override SSE event sources to not use credentials
htmx.createEventSource = function (url) {
    return new EventSource(url, { withCredentials: false });
};

// override WebSocket to use a specific protocol
htmx.createWebSocket = function (url) {
    return new WebSocket(url, ["wss"]);
};

// defines a silly extension that just logs the name of all events triggered
htmx.defineExtension("silly", {
    onEvent: function (name, evt) {
        console.log("Event " + name + " was triggered!");
    }
});

// find div with id my-div
var div = htmx.find("#my-div");

// find div with id another-div within that div
var anotherDiv = htmx.find(div, "#another-div");

// find all divs
var allDivs = htmx.findAll("div");

// find all paragraphs within a given div
var allParagraphsInMyDiv = htmx.findAll(htmx.find("#my-div"), "p");

htmx.logAll();

// remove this click listener from the body
htmx.off("click", myEventListener);

// remove this click listener from the given div
htmx.off("#my-div", "click", myEventListener);

// add a click listener to the body
var myEventListener = htmx.on("click", function (evt) {
    console.log(evt);
});

// add a click listener to the given div
var myEventListener = htmx.on("#my-div", "click", function (evt) {
    console.log(evt);
});

const MyLibrary: any = null;

htmx.onLoad(function (elt) {
    MyLibrary.init(elt);
});

// returns 3000
var milliseconds = htmx.parseInterval("3s");

// returns 3 - Caution
var milliseconds = htmx.parseInterval("3m");

document.body.innerHTML = "<div hx-get='/example'>Get it!</div>";
// process the newly added content
htmx.process(document.body);

// removes my-div from the DOM
htmx.remove(htmx.find("#my-div"));

// removes .myClass from my-div
htmx.removeClass(htmx.find("#my-div"), "myClass");

htmx.removeExtension("my-extension");

// takes the selected class from tab2"s siblings
htmx.takeClass(htmx.find("#tab2"), "selected");

// toggles the selected class on tab2
htmx.toggleClass(htmx.find("#tab2"), "selected");

// triggers the myEvent event on #tab2 with the answer 42
htmx.trigger(htmx.find("#tab2"), "myEvent", { answer: 42 });

// gets the values associated with this form
var values = htmx.values(htmx.find("#myForm"));
