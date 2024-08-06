+++
title = "File Upload"
template = "demo.html"
+++

In this example we show how to create a file upload form that will be submitted via ajax, along
with a progress bar.

We will show two different implementation, one in pure javascript (using some utility methods in htmx) and one in [hyperscript](https://hyperscript.org)

First the pure javascript version.

* We have a form of type `multipart/form-data` so that the file will be properly encoded
* We post the form to `/upload`
* We have a `progress` element
* We listen for the `htmx:xhr:progress` event and update the `value` attribute of the progress bar based on the `loaded` and `total` properties in the event detail.

```html
    <form id='form' hx-encoding='multipart/form-data' hx-post='/upload'
        hx-on::xhr:progress="htmx.find('#progress').setAttribute('value',event.detail.loaded/event.detail.total * 100)"
        >
        <input type='file' name='file'>
        <button>
            Upload
        </button>
        <progress id='progress' value='0' max='100'></progress>
    </form>
```

The Hyperscript version is very similar, except:
 
 * Hyperscript offers nicer syntax (although the htmx API is pretty nice too!)

```html
    <form hx-encoding='multipart/form-data' hx-post='/upload'
          _='on htmx:xhr:progress(loaded, total) set #progress.value to (loaded/total)*100'>
        <input type='file' name='file'>
        <button>
            Upload
        </button>
        <progress id='progress' value='0' max='100'></progress>
    </form>
```

Note that hyperscript allows you to destructure properties from `details` directly into variables
