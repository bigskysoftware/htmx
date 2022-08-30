---
layout: layout.njk
tags: posts
title: Template Fragments
---

# Template Fragments

Template fragments are a relatively rare Server Side Rendering (SSR) template library feature that allow you to render a
_fragment_ or partial bit of the content of a template, rather than the entire template.  This feature is very handy in 
[Hypermedia Driven Applications](/essays/hypermedia-driven-applications) because it allows you to decompose a particular
view for partial updates without creating a large number of individual files.  

By keeping all the HTML in a single file, it is also easier to reason about how a feature works.  This follows the
[Locality of Behavior](/essays/locality-of-behaviour/) design principle.

## Example Template Fragment

Let's look at an example implementation of template fragments, in an obscure templating language for java called
[chill templates](https://github.com/bigskysoftware/chill/tree/master/chill-script).

Here is a simple chill template, `/contacts/detail.html` that displays a contact:

```html
<html>
    <body>
        <div hx-target="this">
            #fragment archive-ui
                #if contact.archived
                <button hx-patch="/contacts/${contact.id}/unarchive">Unarchive</button>
                #else
                <button hx-delete="/contacts/${contact.id}">Archive</button>
                #end
            #end
        </div>
        <h3>Contact</h3>
        <p>${contact.email}</p>
    </body>
</html>
```

In the template we have an archiving feature where, depending on the archive state of the contact, we either display an "Archive"
or an "Unarchive" button.

When we click whichever of the two buttons is being show, we want to replace the content in the `div` that surrounds the button
with an updated button, effectively flipping back and forth.  

Without template fragments, this would involve splitting the buttons out to their own template file.  This, in turn, reduces 
the visibility of the feature.  

Chill templates, however, has a `#fragment` directive which allows you to specify a block of content within a template.  

### Using The Template Fragment

With this fragment defined, you can now render either the entire template:

```java
  Contact c = getContact();
  ChillTemplates.render("/contacts/detail.html", "contact", c);
```

Or we can render only the `archive-ui` fragment of the template

```java
  Contact c = getContact();
  ChillTemplates.render("/contacts/detail.html#archive-ui", "contact", c);
```

The first option would be used when we want to render the entire page, when we show the detail page for the contact.

The second option would be used when we handle the archive/unarchive actions and wish only to rerender the buttons.

Note that, with fragments, we are able to keep our UI together in a single file and see exactly what is going on with 
the feature, without bouncing around between different template files.  This provides a cleaner and more obvious
implementation of the feature.

## Known Template Fragment Implementations

Fragments (and the ability to render them directly in controllers) appear to be a relatively rare feature in templating
libraries and provide an excellent opportunity for improving the developer experience when working with htmx and other
hypermedia-oriented libraries.

Here are some known implementations of the fragment concept:

* Python
  * [Django Render Block Extension](https://pypi.org/project/django-render-block/)
* Java
  * [Thymeleaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#fragment-specification-syntax)
  * [Chill Templates (currently in early alpha)](https://github.com/bigskysoftware/chill/tree/master/chill-script)

Please [let me know](/discord) if you know of others, so I can add them to this list.