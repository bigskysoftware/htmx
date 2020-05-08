---
layout: layout.njk
title: </> kutty - UX Patterns
---

## Implementing A Click To Edit UI

This pattern shows an inline click-to-edit UI for a contact. When you click the button below the current UI will
 be replaced with an editing UI, without a full browser refresh. You can then update the user information 
 or cancel the edit.

### Demo

<script>
    var server = sinon.fakeServer.create();
    server.fakeHTTPMethods = true;
    server.getHTTPMethod = function(xhr) {
        return xhr.requestHeaders['X-HTTP-Method-Override'] || xhr.method;
    };
    server.autoRespond=true;
    
    var contact = {
      "firstName" : "Joe",
      "lastName" : "Blow",
      "email" : "joe@blow.com"
     };
    
    function parseParams(str) {
          var re = /([^&=]+)=?([^&]*)/g;
          var decode = function (str) {
            return decodeURIComponent(str.replace(/\+/g, ' '));
          };
          var params = {}, e;
          if (str) {
            if (str.substr(0, 1) == '?') {
              str = str.substr(1);
            }
            while (e = re.exec(str)) {
              var k = decode(e[1]);
              var v = decode(e[2]);
              if (params[k] !== undefined) {
                if (!$.isArray(params[k])) {
                  params[k] = [params[k]];
                }
                params[k].push(v);
              } else {
                params[k] = v;
              }
            }
          }
          return params;
        }
        
    server.respondWith("PUT", "/contact/1", function(request){
        var params = parseParams(request.requestBody);
        contact.firstName = params['firstName'];
        contact.lastName = params['lastName'];
        contact.email = params['email'];
        request.respond(200, {}, renderDisplay(contact));
        });
    
    server.respondWith("GET", "/contact/1/edit", function(request){
        request.respond(200, {}, renderForm(contact));
        });
    
    server.respondWith("GET", "/contact/1", function(request){
        request.respond(200, {}, renderDisplay(contact));
     });
    
    function renderForm(contact) {
      return `<form class="uk-form-stacked" kt-put="/contact/1" kt-target="#contact-div">
                <div>
                  <label class="uk-form-label">First Name</label>
                  <input type="text" class="uk-form-controls" name="firstName" value="${contact.firstName}">
                </div>
                <div>
                  <label class="uk-form-label">Last Name</label>
                  <input type="text" class="uk-form-controls" name="lastName" value="${contact.lastName}">
                </div>
                <div>
                  <label class="uk-form-label">Email address</label>
                  <input type="email" class="uk-form-controls" name="email" value="${contact.email}">
                </div>
                <button class="uk-button uk-button-primary">Submit</button>
                <button kt-get="/contact/1" 
                        kt-target="#contact-div" 
                        class="uk-button uk-button-danger">Cancel</button>
              </form>`;
     }
     
     function renderDisplay(contact) {
       return `    <div><strong>First Name</strong>: ${contact.firstName}</div>
                   <div><strong>Last Name</strong>: ${contact.lastName}</div>
                   <div><strong>Email</strong>: ${contact.email}</div>
                   <button kt-target="#contact-div" kt-get="/contact/1/edit" class="btn btn-default">
                     Click To Edit
                   </button>
               `;
     } 
</script>


<div id="contact-div">
</div>

<script>
  document.getElementById("contact-div").innerHTML = renderDisplay(contact)
</script>

### Code

#### Display HTML

```html
  <div id="contact-div">
    <div><strong>First Name</strong>: Joe</div>
    <div><strong>Last Name</strong>: Smith</div>
    <div><strong>Email</strong>: joesmith@example.com</div>
    <button kt-target="#contact-div" kt-get="/contact/1/edit" class="btn btn-default">
      Click To Edit
    </button>
  </div>
```

#### Edit HTML

```html
    <form class="uk-form-stacked" kt-put="/contact/1" kt-target="#contact-div">
      <div>
        <label class="uk-form-label">First Name</label>
        <input type="text" class="uk-form-controls" name="firstName" value="${mockUser.firstName}">
      </div>
      <div>
        <label class="uk-form-label">Last Name</label>
        <input type="text" class="uk-form-controls" name="lastName" value="${mockUser.lastName}">
      </div>
      <div>
        <label class="uk-form-label">Email address</label>
        <input type="email" class="uk-form-controls" name="email" value="${mockUser.email}">
      </div>
      <button class="uk-button uk-button-primary">Submit</button>
      <button kt-get"/contact/1" kt-target="#contact-div" class="uk-button uk-button-danger">Cancel</button>
    </form>
```

### Explanation

The 'Click To Edit' button uses [kt-get](/attributes/kt-get) to issue a `GET` to `/contact/1/edit`, and targets the div 
surrounding the entire Contact UI using [kt-target](/attributes/kt-target).

The server returns a form that replaces the content of the div. The form uses the [kt-put](/attributes/kt-put) to issue a 
`PUT` to `/contact/1` and targets the same enclosing div.

The 'Cancel' button uses [kt-get](/attributes/kt-get)  to issue a `GET` to `/contact/1` and targets the same div. 



