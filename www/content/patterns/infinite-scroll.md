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

[//]: # ({{ demo_environment&#40;&#41; }})

[//]: # ()
[//]: # (<script>)

[//]: # (    server.autoRespondAfter = 1000; // longer response for more drama)

[//]: # ()
[//]: # (    //=========================================================================)

[//]: # (    // Fake Server Side Code)

[//]: # (    //=========================================================================)

[//]: # ()
[//]: # (    // data)

[//]: # (    var dataStore = function&#40;&#41;{)

[//]: # (      var contactId = 9;)

[//]: # (      function generateContact&#40;&#41; {)

[//]: # (        contactId++;)

[//]: # (        var idHash = "";)

[//]: # (        var possible = "ABCDEFG0123456789";)

[//]: # (        for&#40; var i=0; i < 10; i++ &#41; idHash += possible.charAt&#40;Math.floor&#40;Math.random&#40;&#41; * possible.length&#41;&#41;;)

[//]: # (        return { name: "Agent Smith", email: "void" + contactId + "@null.org", id: idHash })

[//]: # (      })

[//]: # (      return {)

[//]: # (        contactsForPage : function&#40;page&#41; {)

[//]: # (          var vals = [];)

[//]: # (          for&#40; var i=0; i < 20; i++ &#41;{)

[//]: # (            vals.push&#40;generateContact&#40;&#41;&#41;;)

[//]: # (          })

[//]: # (          return vals;)

[//]: # (        })

[//]: # (      })

[//]: # (    }&#40;&#41;)

[//]: # (    )
[//]: # (    // routes)

[//]: # (    init&#40;"/demo", function&#40;request, params&#41;{)

[//]: # (      var contacts = dataStore.contactsForPage&#40;1&#41;)

[//]: # (      return tableTemplate&#40;contacts&#41;)

[//]: # (    }&#41;;)

[//]: # (    )
[//]: # (    onGet&#40;/\/contacts.*/, function&#40;request, params&#41;{)

[//]: # (      var page = parseInt&#40;params['page']&#41;;)

[//]: # (      var contacts = dataStore.contactsForPage&#40;page&#41;)

[//]: # (      return rowsTemplate&#40;page, contacts&#41;;)

[//]: # (    }&#41;;)

[//]: # (    )
[//]: # (    // templates)

[//]: # (    function tableTemplate&#40;contacts&#41; {)

[//]: # (      return `<table hx-indicator=".htmx-indicator"><thead><tr><th>Name</th><th>Email</th><th>ID</th></tr></thead><tbody>)

[//]: # (              ${rowsTemplate&#40;1, contacts&#41;})

[//]: # (              </tbody></table><center><img class="htmx-indicator" width="60" src="/img/bars.svg" alt="Loading..."></center>`)

[//]: # (    })

[//]: # ()
[//]: # (    function rowsTemplate&#40;page, contacts&#41; {)

[//]: # (      var txt = "";)

[//]: # (      var trigger_attributes = "";)

[//]: # ()
[//]: # (      for &#40;var i = 0; i < contacts.length; i++&#41; {)

[//]: # (        var c = contacts[i];)

[//]: # ()
[//]: # (        if &#40;i == &#40;contacts.length - 1&#41;&#41; {)

[//]: # (         trigger_attributes = ` hx-get="/contacts/?page=${page + 1}" hx-trigger="revealed" hx-swap="afterend"`)

[//]: # (        })

[//]: # ()
[//]: # (        txt += "<tr" + trigger_attributes +"><td>" + c.name + "</td><td>" + c.email + "</td><td>" + c.id + "</td></tr>\n";)

[//]: # (      })

[//]: # (      return txt;)

[//]: # (    })

[//]: # (</script>)