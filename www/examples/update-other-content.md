---
layout: demo_layout.njk
---

## Updating Other Content

A common question that comes up when working with htmx is: "I need to update other content on the screen.  How 
do I do this?"  There are multiple ways to do so, and in this example will walk you through some of them.

We'll use the following basic UI to discuss this concept: a simple table of contacts and a form to add new contacts on the page.  

The problem here is that, when you submit a new contact in the form, you want the contact table above to refresh.

```html
<h2>Contacts</h2>
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th></th>
    </tr>
  </thead>
  <tbody id="contacts-table">
    ...
  </tbody>
</table>
<h2>Add A Contact</h2>
<form hx-post="/contacts">
  <label>
    Name
        <input name="name" type="text">  
  </label>
  <label>
    Email
        <input name="email" type="email">  
  </label>
</form>
```

What solutions to we have?

### <a name="expand"></a> [Solution 1: Expand the Target](#expand)

The easiest solution here is to "expand the target" of the form to enclose both the table and the form.  For example
you could wrap the whole thing in a `div` and target that div:

```html
<div id="table-and-form">
    <h2>Contacts</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="contacts-table">
        ...
      </tbody>
    </table>
    <h2>Add A Contact</h2>
    <form hx-post="/contacts" hx-target="#table-and-form">
      <label>
        Name
            <input name="name" type="text">  
      </label>
      <label>
        Email
            <input name="email" type="email">  
      </label>
    </form>
</div>
```

Note that we are targeting the enclosing div using the [hx-target](/attributes/hx-target) attribute.

This is a simple and reliable approach, although it might not feel the most elegant.

###  <a name="oob"></a> [Solution 2: Out of Band Responses](#oob)

A more sophisticated approach to this problem would use [out of band swaps](/attributes/hx-swap-oob/) to swap in
updated content to the DOM.  

The HTML doesn't need to change from the original setup:

```html
<h2>Contacts</h2>
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th></th>
    </tr>
  </thead>
  <tbody id="contacts-table">
    ...
  </tbody>
</table>
<h2>Add A Contact</h2>
<form hx-post="/contacts">
  <label>
    Name
        <input name="name" type="text">  
  </label>
  <label>
    Email
        <input name="email" type="email">  
  </label>
</form>
```

However, in your response to the `POST` to `/contacts` you would respond with some additional content:

```html
<tr hx-oob-swap="beforeend:#contacts-table">
    <td>Joe Smith</td>
    <td>joe@smith.com</td>
</tr>
<form hx-post="/contacts">
  <label>
    Name
        <input name="name" type="text">  
  </label>
  <label>
    Email
        <input name="email" type="email">  
  </label>
</form>
```

We use the [hx-oob-swap](/attributes/hx-oob-swap) attribute to append some new content into the `#contacts-table`.

Note that because we are using table rows here, we must enable template fragment parsing (thus sacrificing IE11 compatibility)

```javascript
  htmx.config.useTemplateFragments = true;
```

###  <a name="events"></a> [Solution 3: Triggering Events](#events)

An even more sophisticated approach would be to trigger a client side event when a successful contact is created and
then listen for that event on the table, causing it to refresh.

```html
<h2>Contacts</h2>
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th></th>
    </tr>
  </thead>
  <tbody id="contacts-table" hx-get="/contacts/table" hx-trigger="newContact from:body">
    ...
  </tbody>
</table>
<h2>Add A Contact</h2>
<form hx-post="/contacts">
  <label>
    Name
        <input name="name" type="text">  
  </label>
  <label>
    Email
        <input name="email" type="email">  
  </label>
</form>
```

We have added a new end point `/contacts/table` that re-renders the contacts table.  We have a trigger on a custom
event and we listen for the event on the body of the page.

When a successful contact creation occurs during a POST to `/contacts`, the response includes an [HX-Trigger](https://htmx.org/headers/hx-trigger/) response header that looks like this:

```text
HX-Trigger:newContact
```

This will trigger the table it issue a `GET` to `/contacts/table` and refresh the table.  Very clean, event
driven programming!

###  <a name="path-deps"></a>[Solution 4: Using the Path Dependencies Extension](#path-deps)

A final solution is to use REST-ful path dependencies to refresh the table.  Intercooler.js, the predecessor 
 to htmx, had [path-based dependencies](https://intercoolerjs.org/docs.html#dependencies) integrated into the 
 library.  htmx dropped this as a core feature, but supports an extension, [path deps](/extensions/path-deps/),
 that gives similar functionality.
 
 Updating our example to use the extension would involve loading the extension javascript and then
 annotating our HTML like so:
 
 ```html
 <h2>Contacts</h2>
 <table class="table">
   <thead>
     <tr>
       <th>Name</th>
       <th>Email</th>
       <th></th>
     </tr>
   </thead>
   <tbody id="contacts-table" hx-get="/contacts/table" hx-ext="path-deps"  hx-trigger="path-deps" path-deps="/contacts">
     ...
   </tbody>
 </table>
 <h2>Add A Contact</h2>
 <form hx-post="/contacts">
   <label>
     Name
         <input name="name" type="text">  
   </label>
   <label>
     Email
         <input name="email" type="email">  
   </label>
 </form>
 ```

Now, when the form posts to the `/contacts` URL, the `path-deps` extension will detect that and trigger an `path-deps`
event on the contacts table, therefore triggering a request.

The advantage here is that you don't need to do anything fancy with response headers.  The downside is that a request
will be issued on every `POST`, even if a contact was not successfully created.

### Which should I use?

I would recommend the first approach, expanding your target, if the elements that need to be updated are reasonably 
close to one another in the DOM.  It is simple and reliable.

After that, I would say it is a tossup between a custom event and an OOB swap.  I would lean towards the custom event
because I like event-oriented systems, but that's a personal preference.  Which one you choose should be dictated by you
own software engineering tastes and what your server-side technology makes easy.

Finally, the path-deps approach is interesting, and if it fits well with your mental model and overall system architecture,
it can be a fun way to avoid explicit refreshing.  I would look at it last, however, unless the concept really grabs
you.