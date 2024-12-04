<center>
  <img src="http://i.imgur.com/CQh4tnm.png">
</center>

## htmx

intercooler 2.0 (renamed to htmx 1.0) has been released.  It is smaller, more expressive and no longer has a 
dependency on jQuery.

You can view the new website here:

[http://htmx.org](http://htmx.org)

And the new repo here:

[https://github.com/bigskysoftware/htmx](https://github.com/bigskysoftware/htmx)

---

## Introduction

Intercooler is a small (6.74KB gzipped) [jQuery](https://jquery.com/) or [zepto.js](http://intercoolerjs.org/docs.html#zepto) based library that allows you to add AJAX to 
your application using HTML attributes.

Here is an example:

```html
    <!-- When this button is clicked an AJAX POST request is sent to /example and the 
         response content is swapped in to the body of the button -->
    <button ic-post-to="/example">
        Click Me!
    </button>
```

Despite this simplicity, intercooler supports quite a bit of functionality:

* It allows you to [specify the UI event](http://intercoolerjs.org/docs.html#triggers) that triggers the AJAX request
* It makes [progress indicators](http://intercoolerjs.org/docs.html#progress) very simple to add
* It supports many [custom HTTP response headers](http://intercoolerjs.org/docs.html#responses) for things like client-side redirection
* It has a [REST-ful dependency mechanism](http://intercoolerjs.org/docs.html#dependencies)
* It has simple [AJAX history & back-button support](http://intercoolerjs.org/docs.html#history)
* It provides a [rich event model](http://intercoolerjs.org/docs.html#events)
* [And much more...](http://intercoolerjs.org/docs.html)

These features allow you to build modern web applications with little fuss, using a simple and intuitive REST-ful architecture that ensures good performance, excellent user experience and a minimum of complexity.

It also is very easy to incrementally retrofit intercooler into existing web applications to add AJAX functionality where
it is most valuable.

Full documentation is available on the [main intercooler website](http://intercoolerjs.org/)

## Installing

Intercooler can be downloaded or hot-linked [from the downloads page](http://intercoolerjs.org/download.html).

Or installed via bower:

```javascript
     "dependencies": {
        "intercooler-js" : "1.2.0"
      }
```

Intercooler depends on [jQuery](https://jquery.com/) v1.10.0 or higher.

## License

Intercooler is licenced under the [MIT License](https://raw.githubusercontent.com/LeadDyno/intercooler-js/master/LICENSE)

## Official Theme Music

[Rober Parker](https://robertparkerofficial.bandcamp.com/)

## Contributing

To contribute a change to intercooler:

* Fork the main intercooler repository
* Create a new feature branch based on the `development` branch with a reasonably descriptive name (e.g. `fix_http_get_parameter_overriding`)
* Implement your fix
* Add a test to `/test/unit_tests.html`.  (It's pretty easy!)
* Create a pull request for that branch against `development` in the main repository

Thank you to [all the contributors](https://github.com/LeadDyno/intercooler-js/graphs/contributors)!

🕊️🕊️🕊️
