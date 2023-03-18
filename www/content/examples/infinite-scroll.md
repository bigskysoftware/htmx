+++
title = "Infinite Scroll"
template = "demo.html"
+++
        
The infinite scroll pattern provides a way to load content dynamically on user scrolling action.

Let's focus on the final row (or the last element of your content):

```html
<tr hx-get="/contacts/?page=2"
    hx-trigger="revealed"
    hx-swap="afterend">
  <td>Agent Smith</td>
  <td>void29@null.org</td>
  <td>55F49448C0</td>
</tr>
```

This last element contains a listener which, when scrolled into view, will trigger a request. The result is then appended after it.
The last element of the results will itself contain the listener to load the *next* page of results, and so on.

> `revealed` - triggered when an element is scrolled into the viewport (also useful for lazy-loading). If you are using `overflow` in css like `overflow-y: scroll` you should use `intersect once` instead of `revealed`.

{{ demoenv() }}

<script>
    server.autoRespondAfter = 1000; // longer response for more drama

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
      return `<table hx-indicator=".htmx-indicator"><thead><tr><th>Name</th><th>Email</th><th>ID</th></tr></thead><tbody>
              ${rowsTemplate(1, contacts)}
              </tbody></table><center><img class="htmx-indicator" width="60" src="/img/bars.svg"></center>`
    }

    function rowsTemplate(page, contacts) {
      var txt = "";
      var trigger_attributes = "";

      for (var i = 0; i < contacts.length; i++) {
        var c = contacts[i];

        if (i == (contacts.length - 1)) {
         trigger_attributes = ` hx-get="/contacts/?page=${page + 1}" hx-trigger="revealed" hx-swap="afterend"`
        }

        txt += "<tr" + trigger_attributes +"><td>" + c.name + "</td><td>" + c.email + "</td><td>" + c.id + "</td></tr>\n";
      }
      return txt;
    }
</script>



