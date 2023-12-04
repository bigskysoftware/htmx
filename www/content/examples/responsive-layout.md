+++
title = "Reponsive layout"
template = "demo.html"
+++

This example shows how to serve different versions of the page depending on the window size.

The common pattern in to transform table-based view into the card based-view at small breakpoints.
This is usually implemented using tricky css with media-breakpoints if content is similar enough.
Otherwise the content layout is manipulated client-side via javascript.

The pragmatic solution is to design two different partial documents and lazy-load them from the base page.

This solution is "good enough": is not tracking the dynamic window resize, but users rarely resize browser window there and back all day
(It's the designers thingie to showcase their css kung-fu).

Works best if you already lazy-load your partial content or poll for periodic updates.

* The base template

```html
<div
  hx-get="/content"
  hx-trigger="load"
  hx-vals="js:{width: window.innerWidth}">
</div>
```

<style>
  .demo-card {
    border: 1px solid;
    border-radius: 3px;
    padding: 8px;
  }
</style>

* Table partial response
```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Joe Smith</td>
      <td>joe@smith.org</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>`
```

* Cards partial response
```html
<ul>
  <li>
    <div>
      <p>Joe Smith</p>
      <p>joe@smith.org</p>
      <p>Active</p>
    </div>
  </li>
  ...
</ul>
```

*Resize browser window and reload page to see effect. Cards view kicks in at width <= 720 px*

{{ demoenv() }}

<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    var contacts = [
      { name: "Joe Smith", email: "joe@smith.org", status: "Active" },
      { name: "Angie MacDowell", email: "angie@macdowell.org", status: "Active" },
      { name: "Fuqua Tarkenton", email: "fuqua@tarkenton.org", status: "Active" },
      { name: "Kim Yee", email: "kim@yee.org", status: "Inactive" }
    ];

    init("/init", function(request, params){
        return '<div hx-get="/content" hx-trigger="load" hx-vals="js:{width: window.innerWidth}"></div>'
    });

    onGet(/\/content.*/, function(request, params){
      var width = parseInt(params['width']);

      if (width <= 720) {
        return renderList();
      } else {
        return renderTable();
      }
    });

    function rowTemplate(contact) {
      return `<tr>
      <td>${contact.name}</td>
      <td>${contact.email}</td>
      <td>${contact.status}</td>
      </tr>`;
    }

    function renderTable() {
      var rows = "";
      for (var i = 0; i < contacts.length; i++) {
        rows += rowTemplate(contacts[i]);
      }

      return `
<table class="table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>`;
    }

    function cardTemplate(contact) {
    return `
  <li>
    <div class="demo-card">
      <p><b>${contact.name}</b></p>
      <p>${contact.email}</p>
      <p><i>${contact.status}</i></p>
    </div>
  </li>`;
    }

function renderList() {
      var rows = "";
      for (var i = 0; i < contacts.length; i++) {
        rows += cardTemplate(contacts[i]);
      }

      return `
  <ul>${rows}</ul>
      `;


    }

</script>
