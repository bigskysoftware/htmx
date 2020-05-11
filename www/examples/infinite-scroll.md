---
layout: demo_layout.njk
---
        
## Kutty Pattern: Infinite scroll

The infinite scroll pattern provides a way to load content dynamically on user scrolling action.

Let's focus on the final row:

```html
<tr kt-get="/contacts/?page=2"
    kt-trigger="revealed"
    kt-swap="afterend">
  <td>Agent Smith</td>
  <td>void29@null.org</td>
  <td>55F49448C0</td>
</tr>
```

This row (or the last element of your content) contains a listener which, when scrolled into view, will trigger a request. The result is then appended after it.
The last element of the results will itself contain the listener to load the *next* page of results, and so on.

{% include demo_ui.html.liquid %}

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
        for( var i=0; i < 10; i++ ) idHash += possible.charAt(Math.floor(Math.random() * possible.length));
        return { name: "Agent Smith", email: "void" + contactId + "@null.org", id: idHash }
      }
      return {
        contactsForPage : function(page) {
          var vals = [];
          for( var i=0; i < 20; i++ ){
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
      var trigger_attributes = "";

      for (var i = 0; i < contacts.length; i++) {
        var c = contacts[i];

        if (i == (contacts.length - 1)) {
         trigger_attributes = ` kt-get="/contacts/?page=${page + 1}" kt-trigger="revealed" kt-swap="afterend"`
        }

        txt += "<tr" + trigger_attributes +"><td>" + c.name + "</td><td>" + c.email + "</td><td>" + c.id + "</td></tr>\n";
      }
      return txt;
    }
</script>



