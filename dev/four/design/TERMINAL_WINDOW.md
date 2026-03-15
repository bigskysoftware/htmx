# Design Spec: The Smart Terminal Window

This document outlines the visual and technical specification for the primary code/demo container used in the documentation.

## 1. Visual Structure

The component mimics a retro OS window (Mac System 6 / Windows 3.1 hybrid) but adapted for modern content.

```text
+---------------------------------------------------------------+
| [v]  MyWindow.html                       ( )  ( )  ( )        |  <-- Header Bar
+---------------------------------------------------------------+
|                                                               |
|   (Content Area: Code or Rendered HTML)                       |
|                                                               |
+---------------------------------------------------------------+
```

### 1.1 Header Bar
*   **Height:** Fixed (e.g., `h-8` or `h-10`).
*   **Background:** Neutral-100 (Light) / Neutral-800 (Dark).
*   **Border:** Bottom border `1px solid` (Neutral-300 / Neutral-700).
*   **Elements:**
    *   **Left:**
        *   **Collapse Toggle:** A chevron (`v` or `>`) indicating state.
        *   **Title:** Filename or Window Title (font-chicago).
    *   **Right:**
        *   **Window Controls:** Three muted circles (Gray/Gray/Gray) purely for aesthetic, moved to the right to clear space for the title.

### 1.2 Content Area
*   **Background:** Depends on mode (Editor Black for code, White/Gray for UI).
*   **Font:** `JetBrains Mono` for code.

## 2. Interaction Logic (CSS-First)

We rely on **HTML checkboxes** and **Tailwind selectors** to manage state without JavaScript.

### 2.1 Collapsible State
*   **Mechanism:** A hidden `<input type="checkbox" class="peer">` immediately preceding the window container.
*   **Trigger:** The Header Bar is a `<label>` for this checkbox.
*   **Styles:**
    *   `peer-checked`: Shows the content body.
    *   `peer-not-checked`: Hides the content body (height: 0, overflow: hidden).
    *   *Default:* Most windows are checked (open) by default. Alternative installation methods are unchecked (closed).

### 2.2 The "Flip" (View Source)
*   **Goal:** Hovering a "Client" window reveals the HTML source code.
*   **Mechanism:** Tailwind `group` and `group-hover`.
*   **Structure:**
    ```html
    <div class="group relative ...">
        <!-- Layer 1: Rendered Result (Visible by default) -->
        <div class="group-hover:invisible ...">
            <button>Click Me</button>
        </div>

        <!-- Layer 2: Source Code (Hidden by default) -->
        <div class="invisible group-hover:visible absolute inset-0 bg-neutral-900 ...">
            <pre><code>&lt;button&gt;Click Me&lt;/button&gt;</code></pre>
        </div>
    </div>
    ```

### 2.3 Polyglot Server Dropdown
*   **Goal:** Allow users to switch between server implementations (Python, Node, Go) without page reloads.
*   **Mechanism:** "Radio Button Hack".
*   **Structure:**
    *   Place 3 hidden radio inputs at the top of the component: `radio-py`, `radio-node`, `radio-go`.
    *   **The Switcher:** A styled dropdown (or tab row) inside the Header Bar where labels target these IDs.
    *   **The Content:**
        *   Code blocks have classes like `code-py`, `code-node`.
        *   Use CSS: `#radio-py:checked ~ .content .code-node { display: none }`.
        *   Use CSS: `#radio-py:checked ~ .content .code-py { display: block }`.

## 3. Server vs. Client Variants

### 3.1 The Client Window ("The Renderer")
*   **Vibe:** Lightweight, passive.
*   **Default View:** The actual rendered HTML widget (Buttons, forms, etc.).
*   **Hover View:** The HTML source code.
*   **Header Title:** Usually `index.html` or the specific component name.

### 3.2 The Server Window ("The Authority")
*   **Vibe:** Heavy, anchored, dark.
*   **Default View:** A stylized "Server Rack" visualization or a Database Icon. It should feel stable.
*   **Hover View:** The Backend Code (Route handler).
*   **Header Title:** `server.py` (changes dynamically if Polyglot is used).
*   **Polyglot:** Includes the language switcher dropdown in the header.

## 4. Implementation Notes

*   **Shiki Integration:** The inner code blocks are generated via Shiki. Ensure the `shiki-transformers.js` injects the necessary classes to work with the `peer-checked` logic if the transformer wraps the code.
*   **Accessibility:** Ensure the hidden checkboxes/radios do not break keyboard navigation. The Labels must be focusable or the Inputs must be visually hidden but functionally accessible.
