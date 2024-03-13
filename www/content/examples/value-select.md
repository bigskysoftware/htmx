+++
title = "Cascading Selects"
template = "demo.html"
+++

In this example we show how to make the values in one `select` depend on the value selected in another `select`.

To begin we start with a default value for the `make` select: Audi.  We render the `model` select for this make.  We
then have the `make` select trigger a `GET` to `/models` to retrieve the models options and target the `models` select.

Here is the code:

```html
<div>
    <label >Make</label>
    <select name="make" hx-get="/models" hx-target="#models" hx-indicator=".htmx-indicator">
      <option value="audi">Audi</option>
      <option value="toyota">Toyota</option>
      <option value="bmw">BMW</option>
    </select>
  </div>
  <div>
    <label>Model</label>
    <select id="models" name="model">
      <option value="a1">A1</option>
      ...
    </select>
    <img class="htmx-indicator" width="20" src="/img/bars.svg">
</div>
```

When a request is made to the `/models` end point, we return the models for that make:

```html
<option value='325i'>325i</option>
<option value='325ix'>325ix</option>
<option value='X5'>X5</option> 
```

And they become available in the `model` select.

{{ demoenv() }}

<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params){
      return formTemplate();
    });
    
    onGet(/models.*/, function (request, params) {
        var make = dataStore.findMake(params['make']);
        return modelOptionsTemplate(make['models']);
    });
    
    // templates
    function formTemplate() {
      return `  <h3>Pick A Make/Model</h3>              
<form>
  <div>
    <label >Make</label>
    <select name="make" hx-get="/models" hx-target="#models" hx-indicator=".htmx-indicator">
      <option value="audi">Audi</option>
      <option value="toyota">Toyota</option>
      <option value="bmw">BMW</option>
    </select>
  </div>
  <div>
    <label>Model</label>
    <select id="models" name="model">
      <option value="a1">A1</option>
      <option value="a3">A3</option>
      <option value="a6">A6</option>
    </select>
    <img class="htmx-indicator" width="20" src="/img/bars.svg">    
  </div>
</form>`;
    }

    function modelOptionsTemplate(make) {
      return make.map(function(val) {
        return "<option value='" + val + "'>" + val +"</option>";
      }).join("\n");
    }

    var dataStore = function(){
      var data = {
        audi : { models : ["A1", "A4", "A6"] },
        toyota : { models : ["Landcruiser", "Tacoma", "Yaris"] },
        bmw : { models : ["325i", "325ix", "X5"] }
      };
      return {
        findMake : function(make) {
          return data[make];
        }
      }
    }()
</script>
