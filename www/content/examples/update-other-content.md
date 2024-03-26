+++
title = "Updating Other Content"
template = "demo.html"
+++

A question that often comes up when people are first working with htmx is: 

> "I need to update other content on the screen.  How do I do this?" 

There are multiple ways to do so, and in this example will walk you through some of them.

We'll use the following basic UI to discuss this concept: a simple table of contacts, and a form below it
to add new contacts to the table using [hx-post](@/attributes/hx-post.md).

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

The problem here is that when you submit a new contact in the form, you want the contact table above to refresh and
include the contact that was just added by the form.

What solutions to we have?

## Solution 1: Expand the Target {#expand}

The easiest solution here is to "expand the target" of the form to enclose both the table *and* the form.  For example, 
you could wrap the whole thing in a `div` and then target that `div` in the form:

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

Note that we are targeting the enclosing div using the [hx-target](@/attributes/hx-target.md) attribute.  You would need
to render both the table and the form in the response to the `POST` to `/contacts`.

This is a simple and reliable approach, although it might not feel particularly elegant.

## Solution 2: Out of Band Responses {#oob}

A more sophisticated approach to this problem would use [out of band swaps](@/attributes/hx-swap-oob.md) to swap in
updated content to the DOM.  

Using this approach, the HTML doesn't need to change from the original setup at all:

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

Instead of modifying something on the front end, in your response to the `POST` to `/contacts` you would include some additional content:

```html
<tr hx-swap-oob="beforeend:#contacts-table">
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

This content uses the [hx-swap-oob](@/attributes/hx-swap-oob.md) attribute to append itself to the `#contacts-table`, updating
the table after a contact is added successfully.

## Solution 3: Triggering Events {#events}

An even more sophisticated approach would be to trigger a client side event when a successful contact is created and
then listen for that event on the table, causing the table to refresh.

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

We have added a new end-point `/contacts/table` that re-renders the contacts table.  Our trigger for this request
is a custom event, `newContact`.  We listen for this event on the `body` because when it
is triggered by the response to the form, it will end up hitting the body due to event bubbling.

When a successful contact creation occurs during a POST to `/contacts`, the response includes 
an [HX-Trigger](@/headers/hx-trigger.md) response header that looks like this:

```txt
HX-Trigger:newContact
```

This will trigger the table to issue a `GET` to `/contacts/table` and this will render the newly added contact row  
(in addition to the rest of the table.)

Very clean, event driven programming!

## Solution 4: Using the Path Dependencies Extension {#path-deps}

A final approach is to use REST-ful path dependencies to refresh the table.  Intercooler.js, the predecessor 
to htmx, had [path-based dependencies](https://intercoolerjs.org/docs.html#dependencies) integrated into the 
library.  
 
htmx dropped this as a core feature, but supports an extension, [path deps](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/path-deps/README.md), that gives you 
similar functionality.
 
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

## Which should I use?

Generally I would recommend the first approach, expanding your target, especially if the elements that need to be 
updated are reasonably close to one another in the DOM.  It is simple and reliable.

After that, I would say it is a tossup between the custom event and an OOB swap approaches.  I would lean towards the custom event
approach because I like event-oriented systems, but that's a personal preference.  Which one you choose should be dictated by your
own software engineering tastes and which of the two matches up better with your server side technology of choice.

Finally, the path-deps approach is interesting, and if it fits well with your mental model and overall system architecture,
it can be a fun way to avoid explicit refreshing.  I would look at it last, however, unless the concept really grabs
you.
