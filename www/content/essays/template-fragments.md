+++
title = "Template Fragments"
date = 2022-08-03
updated = 2023-03-18
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

Template fragments are a relatively rare Server Side Rendering (SSR) template library feature that allow you to render a
_fragment_ or partial bit of the content within a template, rather than the entire template.  This feature is very handy in 
[Hypermedia Driven Applications](@/essays/hypermedia-driven-applications.md) because it allows you to decompose a particular
view for partial updates _internally_ without pulling fragments of the template out to separate files for rendering,
creating a large number of individual template files.  

By keeping all the HTML in a single file, it is also easier to reason about how a feature works.  This follows the
[Locality of Behavior](@/essays/locality-of-behaviour.md) design principle.

## Motivation

Let's look at how template fragments, in an obscure templating language for java called
[chill templates](https://github.com/bigskysoftware/chill/tree/master/chill-script), can help us build an HDA.

Here is a simple chill template, `/contacts/detail.html` that displays a contact:

##### /contacts/detail.html
```html
<html>
    <body>
        <div hx-target="this">
          #if contact.archived
          <button hx-patch="/contacts/${contact.id}/unarchive">Unarchive</button>
          #else
          <button hx-delete="/contacts/${contact.id}">Archive</button>
          #end
        </div>
        <h3>Contact</h3>
        <p>${contact.email}</p>
    </body>
</html>
```

In the template we have an archiving feature where, depending on the archive state of the contact, we either display an "Archive"
or an "Unarchive" button, both powered by htmx and issuing HTTP requests to different end points.

When we click whichever of the two buttons is being shown, we want to replace the content in the `div` that surrounds 
the button with an updated button.  (Note the `hx-target="this"` on the div, so we are targeting that div's innerHTML for
replacement.)  This will effectively flip the back and forth between "Archive" and "Unarchive".  

Now, unfortunately, if we wanted to render only the buttons and not the rest of this template, this would typically involve
splitting the buttons out to their own template file and including it in this template, like so:

##### /contacts/detail.html
```html
<html>
    <body>
        <div hx-target="this">
          #include archive-ui.html
        </div>
        <h3>Contact</h3>
        <p>${contact.email}</p>
    </body>
</html>
```

##### /contacts/archive-ui.html
```html
#if contact.archived
<button hx-patch="/contacts/${contact.id}/unarchive">Unarchive</button>
#else
<button hx-delete="/contacts/${contact.id}">Archive</button>
#end
```

Now we have two templates.  We can now render the `archive-ui.html` template separately, but this split reduces the 
visibility of the archiving feature: it is less obvious what is going on when you are looking just at the `detail.html` 
template.  

When pushed to extremes, decomposing templates like this can lead to quite a few small template fragments which, in
total, become difficult to manage and to reason about.

### Template Fragments To The Rescue

To address this issue, chill templates has a `#fragment` directive.  This directive allows you to specify a block of 
content within a template and render _just that bit of content_:

##### /contacts/detail.html Using a Fragment
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

With this fragment defined in our template, we can now render either the entire template:

```java
  Contact c = getContact();
  ChillTemplates.render("/contacts/detail.html", "contact", c);
```

Or we can render only the `archive-ui` _fragment_ of the template

```java
  Contact c = getContact();
  ChillTemplates.render("/contacts/detail.html#archive-ui", "contact", c);
```

We would use the first option when we want to render the entire detail page for the contact.

We would use the second option when we handled the archive/unarchive actions and wished only to rerender the buttons.

Note that, with fragments, we are able to keep our UI together in a single file and see exactly what is going on with 
the feature, without bouncing around between different template files.  This provides a cleaner and more obvious
implementation of the feature.

## Known Template Fragment Implementations

Fragments (and the ability to render them directly in controllers) appear to be a relatively rare feature in templating
libraries and provide an excellent opportunity for improving the developer experience when working with htmx and other
hypermedia-oriented libraries.

Here are some known implementations of the fragment concept:

* Go
  * [Standard Library (use block actions)](https://pkg.go.dev/text/template) [[demo]](https://gist.github.com/benpate/f92b77ea9b3a8503541eb4b9eb515d8a)
* Java
  * [Thymeleaf](https://www.thymeleaf.org/doc/tutorials/3.0/usingthymeleaf.html#fragment-specification-syntax)
  * [Chill Templates (currently in early alpha)](https://github.com/bigskysoftware/chill/tree/master/chill-script)
  * [Quarkus Qute](https://quarkus.io/guides/qute-reference#fragments)
  * [JStachio (mustache)](https://jstach.io/doc/jstachio/current/apidocs/#mustache_fragments)
* PHP
  * [Latte](https://latte.nette.org/en/template-inheritance#toc-blocks) - Use the 3rd parameter to only render 1 block from the template -  `$Latte_Engine->render('path/to/template.latte', [ 'foo' => 'bar' ], 'content');`
  * [Laravel Blade](https://laravel.com/docs/10.x/blade#rendering-blade-fragments) - includes built-in support for template fragments as of v9.x
  * [Twig](https://twig.symfony.com/doc/3.x/api.html#rendering-templates) - `$template->renderBlock('block_name', ['the' => 'variables', 'go' => 'here']);`
* Python
  * [Django Render Block Extension](https://pypi.org/project/django-render-block/) - see [example code for htmx](https://github.com/spookylukey/django-htmx-patterns/blob/master/inline_partials.rst)
  * [jinja2-fragments package](https://github.com/sponsfreixes/jinja2-fragments)
  * [jinja_partials package](https://github.com/mikeckennedy/jinja_partials) ([discussion](https://github.com/mikeckennedy/jinja_partials/issues/1) on motivation)
  * [chameleon_partials package](https://github.com/mikeckennedy/chameleon_partials)
  * [htmlgenerator](https://github.com/basxsoftwareassociation/htmlgenerator)
  * [django-template-partials](https://pypi.org/project/django-template-partials/) ([repository](https://github.com/carltongibson/django-template-partials))
* .NET
  * [Giraffe.ViewEngine.Htmx](https://github.com/bit-badger/Giraffe.Htmx/tree/main/src/ViewEngine.Htmx)
* Rust
  * [MiniJinja](https://docs.rs/minijinja/latest/minijinja/struct.State.html#method.render_block)

Please [let me know](/discord) if you know of others, so I can add them to this list.
