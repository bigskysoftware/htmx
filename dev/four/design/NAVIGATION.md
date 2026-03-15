# Navigation Design: The Omni-Header System

**Goal:** Unify global navigation, local wayfinding (breadcrumbs), and mobile usability into a single, cohesive "Command Bar" that fits the retro-futurist brand.

**Core Concept:** The Header *is* the Breadcrumb.

Instead of stacking a "Nav Bar" on top of a "Breadcrumb Bar," we merge them. The space traditionally used for static navigation links transforms into a dynamic path indicator when the user dives into content.

---

## 1. The Component: "The Command Bar"

### Desktop State A: Top-Level (Landing Page)
Standard navigation menu. Clean, simple.
```text
+-----------------------------------------------------------------------+
|  [Logo htmx]   Docs   Reference   Patterns   Essays      [Search] [Git] |
+-----------------------------------------------------------------------+
```

### Desktop State B: Deep Content (e.g., /docs/intro)
The nav links disappear. The "Current Section" becomes the root of a breadcrumb.
```text
+-----------------------------------------------------------------------+
|  [Logo]  /  [Docs v]  /  Getting Started  /  Installation   [Search]  |
+-----------------------------------------------------------------------+
              ^
              This is a Dropdown.
```

*   **The Switcher:** Clicking `[Docs v]` opens a dropdown menu listing the other roots (Reference, Patterns, Essays).
*   **The Path:** The rest of the breadcrumb shows location.
*   **Visuals:**
    *   Font: `ChicagoFLF` for the Root (`Docs`), `Inter` for the path.
    *   Separator: A simple slash `/` or chevron `>`.

### Mobile State
We prioritize **Section Switching** and **Current Context**.

**Landing:**
```text
+-----------------------------------------------------------------------+
|  [Logo]         [=] (Menu)                                            |
+-----------------------------------------------------------------------+
```

**Deep Content:**
```text
+-----------------------------------------------------------------------+
|  [Logo] / [Docs v] / Install... [=]                                   |
+-----------------------------------------------------------------------+
```
*   **Space Saving:** If the path is long, we truncate the middle items (`...`).
*   **The Dropdown:** Tapping `[Docs v]` instantly lets the user jump to "Reference" or "Patterns" without opening the full sidebar menu.
*   **The Menu `[=]`:** Opens the **Context Sidebar** (the tree for the current section).

---

## 2. The Context Sidebar (Desktop & Mobile Drawer)

Since the "Section Switching" is now handled by the Header, the Sidebar becomes purely about **Local Context**.

*   **Content:** Only shows the navigation tree for the *current* root (e.g., only the Docs tree, or only the Reference tree).
*   **No Switcher:** We remove the "Collection Switcher" from the sidebar entirely. It was redundant.
*   **Visuals:**
    *   **Desktop:** Fixed to the left. 1px border right.
    *   **Mobile:** Slide-over drawer triggered by the Hamburger `[=]`.

---

## 3. Interaction Model (The "System" Logic)

1.  **"I want to go to Reference."**
    *   *From Docs:* Click `[Docs v]` in header -> Select "Reference".
    *   *Result:* Header changes to `[Logo] / [Reference v]`. Sidebar updates to show Reference tree.

2.  **"I want to find a specific attribute."**
    *   *From Docs:* Click `[Docs v]` -> Select "Reference". Sidebar loads Reference tree. Click "Attributes" in Sidebar.

3.  **"I want to go Home."**
    *   Click `[Logo]`. Header resets to State A.

---

## 4. Implementation Details (Astro)

*   **Layout:** A single `Layout.astro` manages the state.
*   **CSS-Only Dropdown:** The `[Root v]` dropdown is implemented using the `<details>`/`<summary>` pattern or the `group-hover` pattern (for desktop) / checkbox hack (for mobile) to avoid complex JS.
*   **Transition:** Use **View Transitions** (built into Astro) to morph the Header from "Links" to "Breadcrumb" smoothly. The "Docs" link in State A should visually slide into the `[Docs v]` position in State B.

## 5. Visual Polish (The "Retro" Touch)

*   **The Bar:** 1px bottom border (`border-neutral-800`).
*   **The Dropdown:** Looks like a standard OS menu dropdown (white/black box, 1px border, sharp shadow).
*   **Active State:** The current page in the breadcrumb is bold/highlighted.
