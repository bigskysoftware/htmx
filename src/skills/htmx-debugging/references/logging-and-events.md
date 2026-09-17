# Logging and Event Monitoring

## Enable Debug Logging

Errors and warnings flow to `console.error` / `console.warn` by default. To also surface every event htmx dispatches:

```html
<meta name="htmx-config" content='{"logAll": true}'>
```

or in the console:

```js
htmx.config.logAll = true;
```

Observability tools (Sentry, DataDog RUM, LogRocket, etc.) capture `console.*` automatically, so htmx logs flow into your existing pipeline without any extra setup.

## Event Monitoring Snippet

Paste this in the console to monitor the request/swap lifecycle:

```js
['htmx:config:request', 'htmx:before:request', 'htmx:after:request',
 'htmx:before:swap', 'htmx:after:swap', 'htmx:finally:swap', 'htmx:error', 'htmx:finally:request']
.forEach(evt => document.body.addEventListener(evt, e => {
    console.log(evt, e.detail?.ctx?.request?.action, e.detail?.ctx?.response?.status, e.detail);
}));
```

To monitor what events a specific element is firing:

```js
monitorEvents(htmx.find("#theElement"));
```
