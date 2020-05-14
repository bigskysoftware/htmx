---
layout: demo_layout.njk
---
        
## Dependent Select


{% include demo_ui.html.liquid %}

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
    <select name="make" kt-get="/models" kt-target="#models" kt-indicator=".kutty-indicator">
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
    <img class="kutty-indicator" width="20" src="/img/bars.svg">    
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
        toyota : { models : ["Landcruiser", "Landcruiser", "Landcruiser"] },
        bmw : { models : ["325i", "325ix", "X5"] }
      };
      return {
        findMake : function(make) {
          return data[make];
        }
      }
    }()
</script>
