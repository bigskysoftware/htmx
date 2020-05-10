---
layout: layout.njk
title: </> kutty - Attributes
---

## Attribute Reference

| Attribute | Description |
|-----------|-------------|
| [kt-boost](/attributes/kt-boost) | converts anchors and forms to use AJAX requests
| [kt-classes](/attributes/kt-classes) | timed modification of classes on an element
| [kt-confirm](/attributes/kt-confirm) | shows a confim() dialog before issuing a request
| [kt-delete](/attributes/kt-delete) | issue a `DELETE` to the specified URL
| [kt-error-url](/attributes/kt-error-url) | a URL to send client-side errors to
| [kt-get](/attributes/kt-get) | issue a `GET` to the specified URL
| [kt-include](/attributes/kt-include) | include additional data in AJAX requests
| [kt-indicator](/attributes/kt-indicator) | the element to put the `kutty-request` class on during the AJAX request
| [kt-patch](/attributes/kt-patch) | TODO - Description
| [kt-params](/attributes/kt-params) | filter the parameters that will be submitted with a request
| [kt-post](/attributes/kt-post) | TODO - Description
| kt-prompt | TODO - Description
| kt-push-url | TODO - Description
| [kt-put](/attributes/kt-put) | TODO - Description
| kt-select | TODO - Description
| kt-sse-src | TODO - Description
| [kt-swap](/attributes/kt-swap) | TODO - Description
| kt-swap-oob | TODO - Description
| kt-target | TODO - Description
| kt-trigger | TODO - Description

## CSS Class Reference

| Attribute | Description |
|-----------|-------------|
| kutty-request | TODO
| kutty-indicator | TODO
| kutty-history-elt | TODO
| kutty-swapping | TODO
| kutty-settling | TODO


## HTTP Header Reference

### Request Headers 
| Header | Description |
|-------|-------------|
| X-HTTP-Method-Override | TODO - Description
| X-KT-Request | TODO - Description
| X-KT-Trigger-Id | TODO - Description
| X-KT-Trigger-Name | TODO - Description
| X-KT-Target-Id | TODO - Description
| X-KT-Current-URL | TODO - Description
| X-KT-Prompt | TODO - Description
| X-KT-Event-Target | TODO - Description
| X-KT-Active-Element | TODO - Description
| X-KT-Active-Element-Value | TODO - Description

### Response Headers
| Header | Description |
|-------|-------------|
| X-KT-Trigger | TODO - Description
| X-KT-Push | TODO - Description

## Event Reference

| Event | Description |
|-------|-------------|
| afterOnLoad.kutty | TODO - Description
| afterSettle.kutty | TODO - Description
| afterSettle.kutty | TODO - Description
| afterSwap.kutty | TODO - Description
| beforeOnLoad.kutty | TODO - Description
| beforeRequest.kutty | TODO - Description
| beforeSwap.kutty | TODO - Description
| historyCacheMiss.kutty | TODO - Description
| historyCacheMissLoad.kutty | TODO - Description
| historyRestore.kutty | TODO - Description
| historyUpdate.kutty | TODO - Description
| initSSE.kutty | TODO - Description
| load.kutty | TODO - Description
| noSSESourceError.kutty | TODO - Description
| onLoadError.kutty | TODO - Description
| oobErrorNoTarget.kutty | TODO - Description
| prompt.kutty | TODO - Description
| responseError.kutty | TODO - Description
| sendError.kutty | TODO - Description
| sseError.kutty | TODO - Description
| swapError.kutty | TODO - Description
| values.kutty | TODO - Description
