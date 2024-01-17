+++
title = "Model/View/Controller (MVC)"
date = 2023-01-16
updated = 2023-01-16
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

A common objection I see to using htmx and hypermedia is something along the lines of:

> The problem with returning HTML (and not JSON) from your server is that you'd probably also like to serve mobile
> apps and don't want to duplicate your API

I have already outlined in [another essay](@/essays/splitting-your-apis.md) that I think you should split your JSON API & your
hypermedia API up into separate components.

In that essay I explicitly recommend "duplicating" (to an extent) your API, in order to
disentangle your "churny" web application API endpoints that return HTML from your
stable, regular & expressive JSON Data API.

In looking back at conversations I've had around this idea with people, I think that I have been assuming familiarity
with a pattern that, perhaps, many people are as deeply familiar with as I am: the 
[Model/View/Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) (MVC) 
pattern.

## An MVC Intro

I was a little shocked to discover [in a recent podcast](https://www.youtube.com/watch?v=9H5VK9vJ-aw) that many younger 
web developers just don't have much experience with MVC.

This is perhaps due to the Front-end/Back-end split that occurred when Single Page Applications became the norm.  

MVC is a simple pattern that predates the web and can be used in programs nearly any program that offer a graphical interface.

The rough idea is as follows:

* A "Model" layer contains your ["Domain Model"](https://en.wikipedia.org/wiki/Domain_model).  This layer contains the 
  domain logic specific to the application.  So, for example, a contact management application will have contact-related 
  logic in this layer.  It will not have references to visual elements in it, and should be relatively "pure".

* A "View" layer contains the "view" or visual elements that are presented to the user.  This layer often (although not always)
  works with model values to present visual information to the user. 

* Finally, a "Controller" layer, which coordinates these two layers: for example it might receive an update from a user,
  update a Model and then pass the updated model to a View to display an update user interface to the user.

There are a lot of variations, but that's the rough idea.

Nearly on in web development, a lot of server side frameworks explicitly adopted the MVC pattern.  The framework
that I'm most familiar with is [Ruby On Rails](https://rubyonrails.org/), which has documentation on each of these
topics: [Models](https://guides.rubyonrails.org/active_record_basics.html) that are persisted to the database, 
[Views](https://guides.rubyonrails.org/action_view_overview.html) for generating HTML views from Models, and 
[Controllers](https://guides.rubyonrails.org/action_controller_overview.html) that coorindate between the two.

The rough idea, in Rails, is:

* Models collect your application logic and database accesses
* Views take Models and generate HTML via a templating langauge (this is where HTML escaping is done, btw)
* Controllers take HTTP Requests and typically perform some action with a Model and then pass that Model on to a 
  View (or redirect, etc.)

This is fairly standard, if "shallow" implementation of an Object-Oriented MVC pattern, using the underlying HTML, HTTP Request
lifecycle.

### Fat Model/Skinny Controller

A concept that came up a lot in the Rails community was the notion of 
["Fat Model, Skinny Controller"](https://riptutorial.com/ruby-on-rails/example/9609/fat-model--skinny-controller).  The
idea here is that your Controllers should be relatively simple, only maybe invoking 
a method on the Model and then immediately handing the result on to a View.  The Model, on the other hand, could
be much "thicker" with lots of domain specific logic.

Let's keep that idea in mind as we work through a simple example of the MVC pattern.

## An MVC-Style Web Application

Let's take a look at one of my favorite examples, an online Contacts application.  Here is a Controller method
for that application that displays a given page of Contacts by generating an HTML page:

```python
@app.route("/contacts")
def contacts():
    contacts = Contact.all(page=request.args.get('page', default=0, type=int))
    return render_template("index.html", contacts=contacts)
```

Here I'm using [Python](https://www.python.org/) and Flask (https://flask.palletsprojects.com/en/3.0.x/), since I use
those in my [Hypermedia Systems](https://hypermedia.systems/) book.

Here you can see that the controller is very "thin": it simply looks up contacts via the `Contact` Model object, passing
a `page` argument in.

It then hands the paged collection of contacts on to the `index.html` template to render them to 
an HTML page to send back to the user.

The `Contact` Model, on the other hand may be relatively "fat" internally: it could have a bunch of domain logic 
internally that does a database lookup, pages the data somehow, maybe applies some transformations or business rules, etc.

### Creating A JSON Data API Controller

Now, if you have this relatively well-developed model that encapsulates your domain, you can create a _different_ API
end point/Controller that does the same thing, but for JSON:

```python
@app.route("/api/v1/contacts")
def contacts():
    contacts = Contact.all(page=request.args.get('page', default=0, type=int))
    return jsonify(contacts=contacts)
```

### But You Are Duplicating Code!

Looking at these two controller functions, you may think "This is stupid, the methods are nearly identical".

And you're right, at this point they are.

However, let's consider two potential additions to our system.

#### Rate Limiting Our JSON API

First, let's add rate limiting to the JSON API to prevent DDOS or bad clients from swamping our system.  We'll add the
[Flask-Limiter](https://flask-limiter.readthedocs.io/en/stable/) extension and use that:

```python
@app.route("/api/v1/contacts")
@limiter.limit("1 per second")
def contacts():
    contacts = Contact.all(page=request.args.get('page', default=0, type=int))
    return jsonify(contacts=contacts)
```

Now, we don't want that limit applying to our web application, we just want it for our JSON Data API.  Because we've
split the two up, we can achieve that.

#### Adding A Graph To Our Web Application

Let's consider another change: we want to add a graph to the `index.html` template above that is expensive to compute.

Because we do not want to block the rendering of the `index.html` template, we will use the 
[Lazy Loading](@/examples/lazy-load.md) pattern and create a new endpoint, `/graph`, to generate the HTML for that
graph:

```python
@app.route("/graph")
def graph():
    graphInfo = Contact.computeGraphInfo(page=request.args.get('page', default=0, type=int))
    return render_template("graph.html", info=graphInfo)
```

Here, again, our Controller delegates out to the Model and then hands the results on to a View.

Now, the thing to note here is that we've added a new endpoint to our web application API, but _we haven't added it to our JSON Data API_.  So
we are not committing to other clients that this (specialized) endpoint will be around.  

And, since we are using
 [Hypermedia As The Engine of Application State](@/essays/hateoas.md), we are free, in our web app, to remove or refactor this URL
later on.

So, we get the [flexibility we want](@/essays/hypermedia-apis-vs-data-apis.md) for our hypermedia API, and the 
[features](@/essays/hypermedia-apis-vs-data-apis.md) we want for our JSON Data API.

And, because our domain logic has been collected in a Model, we can vary these two APIs flexibly while still achieving
a significant amount of code reuse.  Our two APIs are decoupled, while our domain logic remains centralized.

(This also gets at why [why I tend not to use content negotiation](@/essays/why-tend-not-to-use-content-negotiation.md) and return HTML & JSON from the same endpoint.)

## MVC Frameworks

Many older web frameworks such as [Spring](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/mvc.html),
[ASP.NET](https://dotnet.microsoft.com/en-us/apps/aspnet/mvc), Rails have very strong MVC concepts that allow you to split 
your logic out in this manner extremely effectively.

Django has a variation on the idea called [MVT](https://www.askpython.com/django/django-mvt-architecture).

This strong support for MVC is one reason why these frameworks pair very well with htmx.

And, while the examples above are obviously biased towards [Object-Oriented](https://www.azquotes.com/picture-quotes/quote-object-oriented-programming-is-an-exceptionally-bad-idea-which-could-only-have-originated-edsger-dijkstra-7-85-25.jpg)
programming, the same ideas can be applied in a functional context as well.

## Conclusion

I hope that, if it is new to you, that gives you to a good feel for the concept of MVC and shows how that, by adopting that 
organizational principle in your web applications, you can effectively decouple your API needs while at the same time avoiding
significant duplication of code.
