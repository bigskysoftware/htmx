# htmx-quirks-mode

Reverts htmx 4.0 behavior to be closer to 2.0 behavior.

## Features

- Restores implicit attribute inheritance for select attributes
- Reverts default swap behavior to `innerHTML`

## Installation

```bash
npm install
```

## Testing

Run tests in Chrome (default):
```bash
npm test
```

Run tests in specific browsers:
```bash
npm run test:chrome
npm run test:firefox
npm run test:webkit
```

Run tests in all browsers:
```bash
npm run test:all
```

Open manual test page:
```bash
open test/test.html
```

## Inherited Attributes

The following attributes are inherited from parent elements in quirks mode:

- `hx-indicator`
- `hx-disabled-elt`
- `hx-include`
- `hx-target`
- `hx-boost`
- `hx-params`
- `hx-swap`
- `hx-encoding`
- `hx-confirm`
- `hx-sync`
- `hx-prompt`
- `hx-push-url`
- `hx-replace-url`
- `hx-select-oob`
- `hx-select`

## Build

Build the distribution files:
```bash
npm run build
```
