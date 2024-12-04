---
layout: blog_post
nav: blog
---

### Stupid Client Side Tricks

The primary focus of intercooler is, of course, on AJAX interactions with a server.  However, thanks to a few 
smaller features, intercooler allows developers, designers in particular, to take advantage of some pure 
client-side functionality in the browser using only HTML attributes.

Let's look at a few.

### Class Addition/Removal

One of the nicest CSS3 features for designers is the addition of [CSS Transitions](http://www.w3schools.com/css/css3_transitions.asp)
which allows for designers to control animations between various visual states in purely declarative CSS.  Unfortunately,
taking advantage of this feature requires programmatically adding or removing a class from an element, which typically
requires writing javascript.  

Fortunately, intercooler gives you tools for doing this using plain old HTML attributes: the [ic-add-class](http://intercoolerjs.org/attributes/ic-add-class.html)
and [ic-remove-class](http://intercoolerjs.org/attributes/ic-remove-class.html) attributes.  These attributes allow you
to add or remove a class to a given element after a specified delay, which lets you take advantage of CSS3 transitions,
and this works *even for content not loaded via AJAX*.

So you can use this trick (or any of the other tricks mentioned on this page) even if you aren't using intercooler for
AJAX integrations.

Here is an example of the `ic-add-class` attribute:

    <div ic-add-class="fancy:3s">
      This div will have the "fancy" class added to it 3 seconds after the page is loaded
    </div>
    
### Element Removal

A common action is to remove a DOM element after a certain amount of time: for example a user notification.  Intercooler has
a tag to support this: [ic-remove-after](http://intercoolerjs.org/attributes/ic-remove-after.html) which allows you to specify
a time period to wait before removing the element from the DOM.

This can be paired with the `ic-add-class` or `ic-remove-class` attribute to allow for a smooth element transition followed by
a removal from the DOM.

Here is an example of the attribute:

    <div ic-remove-after="5s">
      This div will be removed from the DOM five seconds after the initial load of the page
    </div>

Again, this attribute does not rely on AJAX: you can use it on plain old web pages that have none of intercoolers AJAX
functionality wired in.

### Client-Side Actions

The first two tricks are (I hope) pretty uncontroversial and obviously better than the alternative.  Client-side actions 
are more experimental and, I'm not afraid to admit, a bit more controversial.  First, let me give you an overview of
how they work and then an apology for them.

The [ic-action](http://intercoolerjs.org/attributes/ic-action.html) attribute allows you to specify a series of client
side actions that should be invoked when an element is triggered (as defined by the 
[ic-trigger-on](http://intercoolerjs.org/attributes/ic-trigger-on.html) attribute).  The syntax for the attribute allows
you to sequentially invoke methods (defined either on the element or globally) with a delay between them.

You can see a few examples and a complete explanation of the syntax [on the docs page for the attribute](http://intercoolerjs.org/attributes/ic-action.html),
but here is a simple example:

    <a ic-action="slideToggle" ic-target="#hidden-div">
      Toggler Div
    </a>
    <div id="hidden-div" style="display:none">
      This Content Is Hidden Initially
    </a>

Here we invoke the jQuery `slideToggle` method on the div below when a user clicks on the anchor.  We are taking
advantage of the [ic-target](http://intercoolerjs.org/attributes/ic-target.html) attribute to target the div,
and using the default trigger of a click on anchor tags.

The corresponding jQuery would look like this:

    <script>
      $(function() {
        $('#anchor-id).on('click', function(){
          $('#hidden-div').slideToggle()
        });
      })
    <script>
    
Now, I think we can agree that this isn't an insane amount of code that intercooler has saved us.  I don't want to 
minimize it entirely: we still reduced the amount of code by nearly half and removed the need for an explicit id on
the anchor tag.  Not nothing.  But still, not necessarily compelling.

What is compelling, in my opinion, is that the action that the element performs is now *on the DOM element in question*
rather than located in a script block: you can look at the anchor tag and immediately understand what it is doing.  And,
because the syntax for `ic-action` is invocation-only, you can't fall into the trap of having complicated logic in something
like an `onClick` handler.  Finally, you get to take advantage of the already existing attributes that intercooler provides,
such as `ic-target`.

While I don't expect it to be everyone's cup of tea, I've found that using `ic-action` cleans up my javascript quite a bit,
moving a lot of simple-but-noisy logic out of my `script` blocks which makes the remaining javascript that much easier
to understand and maintain.

### Documentation

Full documentation of the client-side functionality of intercooler can be [found here](http://intercoolerjs.org/docs.html#client-side).
I hope it helps you save you from writing a bit of javascript when you are doing web development, even if you don't end
up using the full AJAX functionality in intercooler.