---
title: Active Search
description: Filter search results as you type
icon: "icon-[mdi--magnify]"
---

This example searches a contacts database as the user types.

We start with a search input and an empty table:

```html
<h3>
    Search Contacts
    <span class="htmx-indicator">Searching...</span>
</h3>
<input class="form-control" type="search"
       name="search" placeholder="Begin typing to search..."
       hx-post="/search"
       hx-trigger="input changed delay:500ms, keyup[key=='Enter'], load"
       hx-target="#search-results"
       hx-indicator=".htmx-indicator">

<table class="table">
    <thead>
    <tr>
        <th>First Name</th>
        <th>Last Name</th>
        <th>Email</th>
    </tr>
    </thead>
    <tbody id="search-results">
    </tbody>
</table>
```

The input issues a `POST` to `/search` on the [`input`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) event and sets the table body to the resulting content. The trigger modifiers work together:

- `delay:500ms` waits until the user stops typing before sending.
- `changed` skips requests when the value hasn't actually changed (e.g. arrow keys).
- `keyup[key=='Enter']` sends immediately on Enter, using an [event filter](/reference/attributes/hx-trigger#event-filters).
- `load` populates the table with all results on page load.

The `hx-indicator` attribute shows a loading message while the request is in flight.

<style>
#demo-content input[type="search"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d4d4d4;
  border-radius: 0.375rem;
  font-size: 0.925rem;
  outline: none;
  background: #fff;
  color: #171717;
  transition: border-color 0.15s;
}
#demo-content input[type="search"]:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
:is(.dark) #demo-content input[type="search"] {
  background: #262626;
  border-color: #525252;
  color: #e5e5e5;
}
:is(.dark) #demo-content input[type="search"]:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}
#demo-content table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
#demo-content th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  color: #737373;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e5e5;
}
:is(.dark) #demo-content th { color: #a3a3a3; border-bottom-color: #404040; }
#demo-content td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e5e5;
  font-size: 0.9rem;
}
:is(.dark) #demo-content td { border-bottom-color: #404040; }
#demo-content h3 { margin-top: 0; }
#demo-content .htmx-indicator {
  display: inline-block;
  font-size: 0.8rem;
  color: #737373;
  opacity: 0;
  transition: opacity 0.2s;
}
#demo-content .htmx-request .htmx-indicator,
#demo-content .htmx-request.htmx-indicator {
  opacity: 1;
}
:is(.dark) #demo-content .htmx-indicator { color: #a3a3a3; }
</style>

<script>
server.get("/init", (req) => searchUI());

server.post(/\/search.*/, (req) => {
  const search = req.params["search"] || "";
  const results = findContacts(search);
  return resultsUI(results);
});

const searchUI = () => `<h3>
  Search Contacts
  <span class="htmx-indicator">Searching...</span>
</h3>
<input type="search"
       name="search" placeholder="Begin typing to search..."
       hx-post="/search"
       hx-trigger="input changed delay:500ms, keyup[key=='Enter'], load"
       hx-target="#search-results"
       hx-indicator=".htmx-indicator">
<table>
  <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody id="search-results">
  </tbody>
</table>`;

const resultsUI = (contacts) =>
  contacts.map((c) =>
    `<tr><td>${c.first}</td><td>${c.last}</td><td>${c.email}</td></tr>`
  ).join("\n");

const contacts = [
  { first: "Venus",     last: "Grimes",    email: "venus.grimes@example.com" },
  { first: "Fletcher",  last: "Owen",      email: "fletcher.owen@example.com" },
  { first: "William",   last: "Hale",      email: "william.hale@example.com" },
  { first: "TaShya",    last: "Cash",      email: "tashya.cash@example.com" },
  { first: "Jakeem",    last: "Walker",    email: "jakeem.walker@example.com" },
  { first: "Malcolm",   last: "Trujillo",  email: "malcolm.trujillo@example.com" },
  { first: "Wynne",     last: "Rice",      email: "wynne.rice@example.com" },
  { first: "Jennifer",  last: "Russell",   email: "jennifer.russell@example.com" },
  { first: "Jena",      last: "Mathis",    email: "jena.mathis@example.com" },
  { first: "Alexandra", last: "Maynard",   email: "alexandra.maynard@example.com" },
  { first: "Timon",     last: "Small",     email: "timon.small@example.com" },
  { first: "Dora",      last: "Allen",     email: "dora.allen@example.com" },
  { first: "Freya",     last: "Dunn",      email: "freya.dunn@example.com" },
  { first: "Neil",      last: "Rodriguez", email: "neil.rodriguez@example.com" },
  { first: "Samuel",    last: "Davis",     email: "samuel.davis@example.com" },
  { first: "Felix",     last: "Boyle",     email: "felix.boyle@example.com" },
];

const findContacts = (str) => {
  const s = str.toLowerCase();
  return contacts.filter((c) =>
    c.first.toLowerCase().includes(s) ||
    c.last.toLowerCase().includes(s) ||
    c.email.toLowerCase().includes(s)
  );
};

server.start("/init");
</script>
