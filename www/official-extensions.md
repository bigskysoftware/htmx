---
layout: layout.njk
title: </> htmx - high power tools for html
---

## Official Extensions

The following extensions are tested against htmx and are considered officially supported.

### <a name="debug">[`debug`](#debug)

#### Description

This extension includes log all htmx events for the element it is on with the `"DEBUG:"` prefix.

#### Usage

```html
<button hx-ext="debug">Debug Me...</button>
```

#### Source

```javascript
htmx.defineExtension('debug', {
    onEvent : function(name, evt) {
        if(console.debug){
            console.debug(name, evt);
        } else if(console) {
            console.log("DEBUG:", name, evt);
        } else {
            throw "NO CONSOLE SUPPORTED"
        }
    }
});
```

### <a name="rails-method">[`rails-method`](#rails-method)

#### Description

This extension includes the rails `_method` parameter in non-`GET` or `POST` requests.

#### Usage

```html
<body hx-ext="rails-method">
 ...
</body>
```

#### Source

```javascript
htmx.defineExtension('rails-method', {
    onEvent : function(name, evt) {
        if(name === "configRequest.htmx"){
            var methodOverride = evt.detail.headers['X-HTTP-Method-Override'];
            if(methodOverride){
                evt.detail.parameters['_method'] = methodOverride;
            }
        }
    }
});
```