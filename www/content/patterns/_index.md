+++
title = "Patterns"
insert_anchor_links = "heading"
+++

## Server-side Integration Examples

A list of [GitHub repositories showing examples of integration](@/server-examples.md) with a wide variety of
server-side languages and platforms, including JavaScript, Python, Java, and many others.

## UI Patterns

Below are a set of UX patterns implemented in htmx with minimal HTML and styling.

You can copy and paste them and then adjust them for your needs.

| Pattern                                                                     | Description                                                                                                                                        |
|-----------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| [Click To Edit](@/patterns/click-to-edit.md)                                | Demonstrates inline editing of a data object                                                                                                       |
| [Bulk Update](@/patterns/bulk-update.md)                                    | Demonstrates bulk updating of multiple rows of data                                                                                                |
| [Click To Load](@/patterns/click-to-load.md)                                | Demonstrates clicking to load more rows in a table                                                                                                 |
| [Delete Row](@/patterns/delete-row.md)                                      | Demonstrates row deletion in a table                                                                                                               |
| [Edit Row](@/patterns/edit-row.md)                                          | Demonstrates how to edit rows in a table                                                                                                           |
| [Lazy Loading](@/patterns/lazy-load.md)                                     | Demonstrates how to lazy load content                                                                                                              |
| [Inline Validation](@/patterns/inline-validation.md)                        | Demonstrates how to do inline field validation                                                                                                     |
| [Infinite Scroll](@/patterns/infinite-scroll.md)                            | Demonstrates infinite scrolling of a page                                                                                                          |
| [Active Search](@/patterns/active-search.md)                                | Demonstrates the active search box pattern                                                                                                         |
| [Progress Bar](@/patterns/progress-bar.md)                                  | Demonstrates a job-runner like progress bar                                                                                                        |
| [Value Select](@/patterns/value-select.md)                                  | Demonstrates making the values of a select dependent on another select                                                                             |
| [Animations](@/patterns/animations.md)                                      | Demonstrates various animation techniques                                                                                                          |
| [File Upload](@/patterns/file-upload.md)                                    | Demonstrates how to upload a file via ajax with a progress bar                                                                                     |
| [Preserving File Inputs after Form Errors](@/patterns/file-upload-input.md) | Demonstrates how to preserve file inputs after form errors                                                                                         |
| [Reset User Input](@/patterns/reset-user-input.md)                          | Demonstrates how to reset form inputs after submission                                                                                             |
| [Dialogs - Browser](@/patterns/dialogs.md)                                  | Demonstrates the prompt and confirm dialogs                                                                                                        |
| [Dialogs - UIKit](@/patterns/modal-uikit.md)                                | Demonstrates modal dialogs using UIKit                                                                                                             |
| [Dialogs - Bootstrap](@/patterns/modal-bootstrap.md)                        | Demonstrates modal dialogs using Bootstrap                                                                                                         |
| [Dialogs - Custom](@/patterns/modal-custom.md)                              | Demonstrates modal dialogs from scratch                                                                                                            |
| [Tabs (Using HATEOAS)](@/patterns/tabs-hateoas.md)                          | Demonstrates how to display and select tabs using HATEOAS principles                                                                               |
| [Tabs (Using JavaScript)](@/patterns/tabs-javascript.md)                    | Demonstrates how to display and select tabs using JavaScript                                                                                       |
| [Keyboard Shortcuts](@/patterns/keyboard-shortcuts.md)                      | Demonstrates how to create keyboard shortcuts for htmx enabled elements                                                                            |
| [Drag & Drop / Sortable](@/patterns/sortable.md)                            | Demonstrates how to use htmx with the Sortable.js plugin to implement drag-and-drop reordering                                                     |
| [Updating Other Content](@/patterns/update-other-content.md)                | Demonstrates how to update content beyond just the target elements                                                                                 |
| [Confirm](@/patterns/confirm.md)                                            | Demonstrates how to implement a custom confirmation dialog with htmx                                                                               |
| [Async Authentication](@/patterns/async-auth.md)                            | Demonstrates how to handle async authentication tokens in htmx                                                                                     |
| [Web Components](@/patterns/web-components.md)                              | Demonstrates how to integrate htmx with web components and shadow DOM                                                                              |
| [(Experimental) moveBefore()-powered hx-preserve](/patterns/move-before)    | htmx will use the experimental [`moveBefore()`](https://cr-status.appspot.com/feature/5135990159835136) API for moving elements, if it is present. |

## Migrating from Hotwire / Turbo ?

For common practices see the [Hotwire / Turbo to htmx Migration Guide](@/migration-guide-hotwire-turbo.md).
