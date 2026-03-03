# CFX HTMX
This repository is a modified version of the [official htmx repo](https://github.com/bigskysoftware/htmx). The modifications made, are specifically for making htmx compatible with the CitizenFX server builds.

**htmx version**: *1.9.10*

## Installation
1. download the [latest release](https://github.com/5m1Ly/cfx-htmx/releases/latest) htmx resource
1. place the resource folder somewhere in your fxserver project
1. add the resource to your server.cfg
1. add the following to your html head tag
    ```html
    <!-- HTMX -->
    <script type="text/javascript" src="https://cfx-nui-htmx/dist/htmx.js"></script>
    ```
1. once this is done you shoud be able to use htmx within your resources

## Contribution
If you want to contribute to the project you'll need to do at least one of two things. The first one being adding two comments above the lines you changed. These two comments would present themselves in the following way;
```js
// cfx-htmx
// the comment on the line above is there to mark a change specifically for the cfx version of htmx
// this comment and the one on the line above is there to explain why the change has been made 
```

The second thing is only nessesary when changing an existing line within the code which would then look like the example in the link below.

[src/htmx.js ln. 3387 > ln. 3391](https://github.com/5m1Ly/cfx-htmx/blob/a4672c9dfdc97b063be2c7f088a3fefbe056c81b/src/htmx.js#L3387C1-L3391C82)

## Usage
So for starters you'll need to call the `RegisterNUICallback` native. This native takes a path and a function. The function has two parameters the first one being the request body, the second one being a callback function which sends a response to the NUI.

> **_NOTE:_** the native `RegisterRawNuiCallback` could be used here for better usage of the cfx-htmx lib. This is because the first parameter of the function is the entire request object which also indecates the request method. However, sadly within the source code of fivem the request is eighter a **POST** or **GET** request by default. This makes the **hx-delete**, **hx-patch**, and **hx-put** attributes obsolete. On top of that all the requests made, that arn't a **POST** request, will be set to a **GET** request by default and therefor won't send a request body even if one is provided. To finish the sumup of the problems with this native, the callback (second parameter of the function) doesn't send an actual response to the NUI which is crucial for this library to function properly.
>
> I've been trying to setup the FiveM client myself to see if i can ivestigate the problem at it's core and maybe (even with the little knowledge i have on the code base, c++ and c) fix the native. That way this library can be used up to its full potential.
>
> I'm currently struggling to setup the FiveM development environment without the debugger trowing exeptions on startup, if anyone could help me out that would be awesome and they can contact me on discord by the username `5m1ly`.

```lua
RegisterNUICallback('htmx', function(body, callback)
    return callback("<span><p>hello world!</p></span>")
end)
```

Now create a element that makes the request

```html
<body>
    <div hx-get="/htmx"></div>
</body>
```

Uppon loading the html it will make a GET request to `https://<resource>/htmx`

## More information
for more information about htmx you can go to their [repo](https://github.com/bigskysoftware/htmx) or [website](https://htmx.org/)
htmx is the successor to [intercooler.js](http://intercoolerjs.org)

### installing as a node package

To install using npm:

```
npm install htmx.org --save
```

Note there is an old broken package called `htmx`.  This is `htmx.org`.

## website & docs

* <https://htmx.org>
* <https://htmx.org/docs>

## contributing
Want to contribute? Check out our [contribution guidelines](CONTRIBUTING.md)

No time? Then [become a sponsor](https://github.com/sponsors/bigskysoftware#sponsors)

### hacking guide

To develop htmx locally, you will need to install the development dependencies.

Run:

```
npm install
```

Then, run a web server in the root.

This is easiest with:

```
npx serve
```

You can then run the test suite by navigating to:

<http://0.0.0.0:3000/test/>

At this point you can modify `/src/htmx.js` to add features, and then add tests in the appropriate area under `/test`.

* `/test/index.html` - the root test page from which all other tests are included
* `/test/attributes` - attribute specific tests
* `/test/core` - core functionality tests
* `/test/core/regressions.js` - regression tests
* `/test/ext` - extension tests
* `/test/manual` - manual tests that cannot be automated

htmx uses the [mocha](https://mochajs.org/) testing framework, the [chai](https://www.chaijs.com/) assertion framework
and [sinon](https://sinonjs.org/releases/v9/fake-xhr-and-server/) to mock out AJAX requests.  They are all OK.

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*
