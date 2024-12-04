---
layout: blog_post
nav: blog
---

### Server Sent Event Support

The latest release intercooler includes beta support for [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).  Server Sent Events (SSEs) are an HTML5 feature 
that allow a server to send information to the browser via a push mechanism, rather than using traditional client-based
polling (supported in intercooler via the `ic-poll` attribute.)

### Why Server Sent Events?

There are two major client-push technologies in HTML5: the popular [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
API and the less popular Server Sent Events.  Why is intercooler.js including support for the latter, a less popular technology?

In looking at both technologies, Server Sent Events dovetail more cleanly with the core intercooler.js REST-ful philosophy 
of encoding as much state as possible in the hyptertext itself: by responding only to 
[data messages](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Data-only_messages) 
(i.e. new HTML content, to be merged into the dom) or 
[named events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Named_events) 
triggered by the server, we keep the client side as stateless (outside of the hypertext) as possible.  Additionally,
Server Sent Events are text and use standard HTTP, again keeping with the intercooler.js philosophy of staying
as close as possible to the original vision of the web.

### Server-Side Implementation

The implementation of on the server side events is obviously platform dependent, but it is a very simple API at
the network level.  A server needs to support the [Event Stream Format](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format),
a very simple format that allows for two types of data to be transmitted: [Data Messages](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Data-only_messages) 
and [Named Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Named_events).

An example java implementation of a simple SSE server is available here:

[http://www.cs-repository.info/2016/08/server-sent-events.html](http://www.cs-repository.info/2016/08/server-sent-events.html)

And a simple PHP implementation is available from the Mozilla site:

[https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Sending_events_from_the_server](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Sending_events_from_the_server)

### intercooler.js SSE integration

You can take advantage of SSEs in intercooler by using the new `ic-sse-src` attribute, which points to a URL that satisfies
the Event Stream format:

    <div ic-sse-src="/my_sse_stream">
      This element is bound to the /my_sse_stream Server Sent Event stream
    </div>
    
When the client receives an SSE Data Message, the content of that message will be swapped into the body of the
element as HTML.  If the server were to send the following message:

    <div>New Contact Added!</div>
    
The result would be:

    <div ic-sse-src="/my_sse_stream">
      <div>New Contact Added!</div>
    </div>

If you wanted to make the new content appended to the divs existing, you could use the following intercooler:

    <div ic-sse-src="/my_sse_stream" ic-swap-style="append">
      This element is bound to the /my_sse_stream Server Sent Event stream
    </div>

in which case, if you received the event above, you would end up with:

    <div ic-sse-src="/my_sse_stream" ic-swap-style="append">
      This element is bound to the /my_sse_stream Server Sent Event stream
      <div>New Contact Added!</div>
    </div>

#### Named Events

But what about Named Events?  You can listen for named Server Sent Events by using the `sse:` prefix in the `ic-trigger-on`
attribute:

    <div ic-sse-src="/my_sse_stream">
      This element is bound to the /my_sse_stream Server Sent Event stream
      <span ic-get-from="/latest_info" ic-trigger-on="sse:info_updated">
        No Info Yet!
      </span>
    </div>

In this case when the Server Sent Event stream emits an event named `info_updated`, the inner span will issue a GET
request to the `/latest_info` URL

### Conclusion

And that's it!  Pretty simple and a nice, declarative way to add push notifications to your intercooler.js-based
web application.