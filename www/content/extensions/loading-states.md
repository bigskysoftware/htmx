+++
title = "loading-states"
+++

This extension allows you to easily manage loading states while a request is in flight, including disabling elements, and adding and removing CSS classes.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/loading-states.js"></script>
```

## Usage

Add the `hx-ext="loading-states"` attribute to the body tag or to any parent element containing your htmx attributes.

Add the following class to your stylesheet to make sure elements are hidden by default:

```css
[data-loading] {
  display: none;
}
```

## Supported attributes

- `data-loading`

  Shows the element. The default style is `inline-block`, but it's possible to use any display style by specifying it in the attribute value.

  ```html
  <div data-loading>loading</div>

  <div data-loading="block">loading</div>

  <div data-loading="flex">loading</div>
  ```

- `data-loading-class`

  Adds, then removes, CSS classes to the element:

  ```html
  <div class="transition-all ease-in-out duration-600" data-loading-class="bg-gray-100 opacity-80">
  ...
  </div>
  ```

- `data-loading-class-remove`

  Removes, then adds back, CSS classes from the element.

  ```html
  <div class="p-8 bg-gray-100 transition-all ease-in-out duration-600" data-loading-class-remove="bg-gray-100">
  ...
  </div>
  ```
- `data-loading-disable`

  Disables an element for the duration of the request.

  ```html
  <button data-loading-disable>Submit</button>
  ```

- `data-loading-aria-busy`

  Add [`aria-busy="true"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy) attribute to the element for the duration of the request

  ```html
  <button data-loading-aria-busy>Submit</button>
  ```

- `data-loading-delay`

  Some actions may update quickly and showing a loading state in these cases may be more of a distraction. This attribute ensures that the loading state changes are applied only after 200ms if the request is not finished. The default delay can be modified through the attribute value and expressed in milliseconds:

  ```html
  <button type="submit" data-loading-disable data-loading-delay="1000">Submit</button>
  ```

  You can place the `data-loading-delay` attribute directly on the element you want to disable, or in any parent element.

- `data-loading-target`

  Allows setting a different target to apply the loading states. The attribute value can be any valid CSS selector. The example below disables the submit button and shows the loading state when the form is submitted.

  ```html
  <form hx-post="/save"
    data-loading-target="#loading"
    data-loading-class-remove="hidden">

    <button type="submit" data-loading-disable>Submit</button>

  </form>

  <div id="loading" class="hidden">Loading ...</div>
  ```

- `data-loading-path`

  Allows filtering the processing of loading states only for specific requests based on the request path.

  ```html
  <form hx-post="/save">
    <button type="submit" data-loading-disable data-loading-path="/save">Submit</button>
  </form>
  ```

   You can place the `data-loading-path` attribute directly on the loading state element, or in any parent element.

  ```html
  <form hx-post="/save" data-loading-path="/save">
    <button type="submit" data-loading-disable>Submit</button>
  </form>
  ```

- `data-loading-states`

  This attribute is optional and it allows defining a scope for the loading states so only elements within that scope are processed.

  ```html
  <div data-loading-states>
    <div hx-get=""></div>
    <div data-loading>loading</div>
  </div>

  <div data-loading-states>
    <div hx-get=""></div>
    <div data-loading>loading</div>
  </div>

  <form data-loading-states hx-post="">
    <div data-loading>loading</div>
  </form>
  ```
