---
title: "HX-Target"
description: "The element that will receive the response"
---

# HX-Target

The `HX-Target` header identifies the element that will receive the response.

This header is only included when a target is specified.

Format: `<tag>#<id>` (e.g. `div#results`) or just `<tag>` for elements without an ID.

## Syntax

The header is included as follows:

```http
HX-Target: div#results
```

## Usage

Return different content for different targets:

```python
target = request.headers.get('HX-Target')
if target == 'div#sidebar':
    return render_template('sidebar_content.html')
```
