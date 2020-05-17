---
layout: demo_layout.njk
---
        
## Bulk Update

This demo shows how to implement a common pattern where rows are selected and then bulk updated.  This is 
accomplished by putting a form around a table, with checkboxes in the table, and then including the checked
values in `POST`'s to two different endpoints: `activate` and `deactivate`:

```html
<div hx-include="#checked-contacts" hx-target="#tbody">
  <a class="btn" hx-put="/activate">Activate</a>
  <a class="btn" hx-put="/deactivate">Deactivate</a>
</div>

<form id="checked-contacts">
    <table>
      <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
      </tr>
      </thead>
      <tbody id="tbody">
        <tr class="">
          <td><input type='checkbox' name='ids' value='0'></td>
          <td>Joe Smith</td>
          <td>joe@smith.org</td>
          <td>Active</td>
        </tr>
        ...
      </tbody>
    </table>
</form>
```

The server will either activate or deactivate the checked users and then rerender the `tbody` tag with
updated rows.  It will apply the class `activate` or `deactivate` to rows that have been mutated.  This allows
us to use a bit of CSS to flash a color helping the user see what happened:

```css
  .htmx-settling tr.deactivate td {
    background: lightcoral;
  }
  .htmx-settling tr.activate td {
    background: darkseagreen;
  }
  tr td {
    transition: all 1.2s;
  }
```

You can see a working examle of this code below.

<style scoped="">
  .htmx-settling tr.deactivate td {
    background: lightcoral;
  }
  .htmx-settling tr.activate td {
    background: darkseagreen;
  }
  tr td {
    transition: all 1.2s;
  }
</style>

{% include demo_ui.html.liquid %}

<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // data
    var dataStore = function(){
      var data = [
        { name: "Joe Smith", email: "joe@smith.org", status: "Active" },
        { name: "Angie MacDowell", email: "angie@macdowell.org", status: "Active" },
        { name: "Fuqua Tarkenton", email: "fuqua@tarkenton.org", status: "Active" },
        { name: "Kim Yee", email: "kim@yee.org", status: "Inactive" }
      ];
      return {
        findContactById : function(id) {
          return data[id];
        },
        allContacts : function() {
          return data;
        }
      }
    }()
    
    function getIds(params) {
      if(params['ids']) {
        if(Array.isArray(params['ids'])) {
          return params['ids'].map(x => parseInt(x))
        } else {
          return [parseInt(params['ids'])];
        }
      } else {
        return [];
      }
    }

    // routes
    init("/demo", function(request){
        return displayUI(dataStore.allContacts());
    });

    onPut("/activate", function(request, params){
        var ids = getIds(params);
        for (var i = 0; i < ids.length; i++) {
          dataStore.findContactById(ids[i])['status'] = 'Active';
        }
        return displayTable(ids, dataStore.allContacts(), 'activate');
    });

    onPut("/deactivate", function (req, params) {
        var ids = getIds(params);
        for (var i = 0; i < ids.length; i++) {
          dataStore.findContactById(ids[i])['status'] = 'Inactive';
        }
        return displayTable(ids, dataStore.allContacts(), 'deactivate');
    });

    // templates
    function displayUI(contacts) {
      return `<div hx-include="#checked-contacts" hx-target="#tbody">
                  <a class="btn" hx-put="/activate">Activate</a>
                  <a class="btn" hx-put="/deactivate">Deactivate</a>
              </div>
            
              <form id="checked-contacts">
                <table>
                  <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                  </thead>
                  <tbody id="tbody">
                    ${displayTable([], contacts, "")}
                  </tbody>
                </table>
              </form>`
    }
    
    function displayTable(ids, contacts, action) {
      var txt = "";
      for (var i = 0; i < contacts.length; i++) {
        var c = contacts[i];
        txt += `\n<tr class="${ids.includes(i) ? action : ""}">
                  <td><input type='checkbox' name='ids' value='${i}'></td><td>${c.name}</td><td>${c.email}</td><td>${c.status}</td>
                </tr>`
      }
      return txt;
    }
</script>
