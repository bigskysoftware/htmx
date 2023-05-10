+++
title = "Click to Load"
template = "demo.html"
+++

This example shows how to implement click-to-load the next page in a table of data.  The crux of the demo is
the final row:

```html
<tr id="replaceMe">
  <td colspan="3">
    <button class='btn' hx-get="/contacts/?page=2"
                        hx-target="#replaceMe"
                        hx-swap="outerHTML">
         Load More Agents... <img class="htmx-indicator" src="/img/bars.svg">
    </button>
  </td>
</tr>
```

This row contains a button that will replace the entire row with the next page of
results (which will contain a button to load the *next* page of results).  And so on.

{{ demoenv() }}

<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // data
    var dataStore = function(){
      var contactId = 9;
      function generateContact() {
        contactId++;
        var idHash = "";
        var possible = "ABCDEFG0123456789";
        for( var i=0; i < 15; i++ ) idHash += possible.charAt(Math.floor(Math.random() * possible.length));
        return { name: "Agent Smith", email: "void" + contactId + "@null.org", id: idHash }
      }
      return {
        contactsForPage : function(page) {
          var vals = [];
          for( var i=0; i < 10; i++ ){
            vals.push(generateContact());
          }
          return vals;
        }
      }
    }()

    // routes
    init("/demo", function(request, params){
        var contacts = dataStore.contactsForPage(1)
        return tableTemplate(contacts)
    });

    onGet(/\/contacts.*/, function(request, params){
        var page = parseInt(params['page']);
        var contacts = dataStore.contactsForPage(page)
        return rowsTemplate(page, contacts);
    });

    // templates
    function tableTemplate(contacts) {
        return `<table><thead><tr><th>Name</th><th>Email</th><th>ID</th></tr></thead><tbody>
                ${rowsTemplate(1, contacts)}
                </tbody></table>`
    }

    function rowsTemplate(page, contacts) {
      var txt = "";
      for (var i = 0; i < contacts.length; i++) {
        var c = contacts[i];
        txt += `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.id}</td></tr>\n`;
      }
      txt += loadMoreRow(page);
      return txt;
    }

    function loadMoreRow(page) {
      return `<tr id="replaceMe">
  <td colspan="3">
    <center>
      <button class='btn' hx-get="/contacts/?page=${page + 1}"
                       hx-target="#replaceMe"
                       hx-swap="outerHTML">
         Load More Agents... <img class="htmx-indicator" src="/img/bars.svg">
       </button>
    </center>
  </td>
</tr>`;
    }
</script>
