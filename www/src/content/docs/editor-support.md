---
title: "Editor Support"
description: "htmx editor tooling: the JetBrains web-types file, the VS Code extension, and LSP-based editors."
---

htmx attributes are normal HTML attributes, so every editor can edit an htmx page with no setup. Editor tooling adds
attribute completion, hover documentation, and links to the reference pages on this site.

htmx ships one first-party integration, for JetBrains IDEs. The other entries on this page are community projects.

## JetBrains IDEs

htmx ships a [web-types](https://github.com/JetBrains/web-types) file. Web-types is the JetBrains metadata format for
web libraries. IntelliJ IDEA, WebStorm, PyCharm, PhpStorm and the other IntelliJ-based IDEs read it.

The file describes:

* Every htmx 4 attribute, such as [`hx-get`](/reference/attributes/hx-get),
  [`hx-trigger`](/reference/attributes/hx-trigger) and [`hx-config`](/reference/attributes/hx-config)
* The attributes that the bundled extensions add, such as `hx-sse:connect`, `hx-ws:send` and `hx-live`
* The [`<hx-partial>`](/reference/tags/hx-partial) element

Each entry carries a description and a link to its reference page, so hover documentation works inside the IDE.

### Installing With npm

If you install htmx with npm, the IDE finds the file on its own. The `htmx.org` package points at it through the
`web-types` field in its `package.json`:

```shell
npm install htmx.org
```

If completion does not appear, restart the IDE.

### Installing Without npm

If you load htmx from a CDN, download the file into your project:

```shell
curl -O https://four.htmx.org/js/editors/jetbrains/htmx.web-types.json
```

Then add a `web-types` field to your own `package.json`:

```json
{
  "web-types": "./htmx.web-types.json"
}
```

The field also accepts an array of paths, so a project can register more than one file.

### The Community Plugin

[HTMX Support](https://plugins.jetbrains.com/plugin/20588-htmx-support) is a community plugin for the same IDEs. Its
last release is from June 2024, so it does not know the htmx 4 attributes. Use the web-types file instead.

## VS Code

The [HTMX Toolkit](https://marketplace.visualstudio.com/items?itemName=atoolz.htmx-vscode-toolkit) extension adds htmx
support to Visual Studio Code:

* Attribute completion for the htmx attributes
* Hover documentation with links to this site
* Snippets for common htmx patterns
* Support for htmx 2.x and 4.x

To install it, search for **HTMX Toolkit** in the VS Code Extensions panel. The source code is at
[atoolz/htmx-vscode-toolkit](https://github.com/atoolz/htmx-vscode-toolkit).

## LSP-Based Editors

[htmx-lsp](https://github.com/ThePrimeagen/htmx-lsp) is a community language server. It gives attribute completion to
any editor with an LSP client, such as Neovim, Helix and Emacs.

In Neovim you can install it with Mason and configure it with `lspconfig`:

```lua
local lspconfig = require('lspconfig')
lspconfig.htmx.setup{}
```

Its README calls the project a work in progress, and the last commit is from October 2025. The completions therefore
predate htmx 4. See [What's New in htmx 4](/docs/whats-new-in-htmx-4) for the attributes that changed.

## AI Coding Assistants

The npm package ships four agent skills in `dist/skills/`:

| Skill                       | Purpose                                                       |
|-----------------------------|---------------------------------------------------------------|
| `htmx-guidance`             | Writing htmx 4 markup, attributes, events and swap strategies |
| `htmx-debugging`            | Diagnosing requests that do not fire and swaps that misbehave |
| `htmx-extension-authoring`  | Writing and debugging htmx 4 extensions                       |
| `htmx-upgrade-from-htmx2`   | Migrating a codebase from htmx 2.x to 4.x                     |

Copy the files into the skills directory of your coding agent. The skills are plain markdown, so you can also paste
one into a prompt.
