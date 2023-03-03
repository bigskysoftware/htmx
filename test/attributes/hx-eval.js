describe("hx-eval attribute", function(){

    it('executes the script', function(){
      var btn = make('<button hx-eval="this.innerText=\'Clicked!\'">Click Me!</button>')
      btn.innerHTML.should.equal("Click Me!");
      btn.click();
      btn.innerHTML.should.equal("Clicked!");
    });

    it('executes the script with the data-* prefix', function(){
      var btn = make('<button data-hx-eval="this.innerText=\'Clicked!\'">Click Me!</button>')
      btn.innerHTML.should.equal("Click Me!");
      btn.click();
      btn.innerHTML.should.equal("Clicked!");
    });
})

