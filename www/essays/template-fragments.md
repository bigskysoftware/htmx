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

When we click whichever button is being show, we want to replace the content in the `div` that surrounds the button
with an updated button, effectively flipping back and forth.  Without a template fragment feature in chill templates,
this would involve either splitting the buttons out to their own file, which reduces visibility of the feature, or
duplicating the button code in some other manner (maybe as strings hard coded in our controller).

Neither of these options are good ones.  To avoid these bad choices, chill templates has a `#fragment` directive that
allows you to specify a block of content within the template, and associate a name with it.  With this fragment defined,
you can now render either the entire template:

```java
  Contact c = getContact();
  ChillTemplates.render("/contacts/detail.html", "contact", c);
```

Or only the `archive-ui` fragment of the template

```java
  Contact c = getContact();
  ChillTemplates.render("/contacts/detail.html#archive-ui", "contact", c);
```

You can use the first option when rendering the entire contact page, and the second option when responding to the 
htmx requests to archive or unarchive a given contact.

With fragments, we are able to keep our UI together in a single file and see exactly what is going on with this feature,
without bouncing around to a bunch of different template files.

Fragments (and the ability to render them directly in controllers) appear to be a relatively rare feature in templating 
libraries and provide an excellent opportunity for improving the developer experience when working with htmx and other
hypermedia-oriented libraries. 

## Known Template Fragment Implementations

Here are some known implementations of the fragment concept.  Please let me know if you know of others so I can add
them to this list.

* Python
  * [Django Render Block Extension](https://pypi.org/project/django-render-block/) - render fragments (blocks) of templates in both
    other templates as well as in controllers
* Java
  * [Thymeleaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#fragment-specification-syntax) - 
    Supports fragments but does _not_ appear to support rendering them directly in controllers
  * [Chill Templates (currently in early alpha)](https://github.com/bigskysoftware/chill/tree/master/chill-script)