VARIANTS =
    {
    'zepto' =>
 '<script src="lib/zepto-1.2.0.min.js"></script>
  <script src="lib/zepto.data-1.2.0.js"></script>
  <script>
    //override on to transform standard namespaces
    (function($) {
      var zeptoOn = $.fn.on;
      $.fn.on = function(arg1, arg2, arg3, arg4){
        arg1 = arg1.split(".").reverse().join(":");
        zeptoOn.call(this, arg1, arg2, arg3, arg4);
      };
    })(Zepto);
  </script>
  <script type="text/javascript" src="lib/zepto.mockjax-1.2.0.js"></script>',

    'jQuery1' =>
 '<script src="lib/jquery-1.10.2.js"></script>
  <script type="text/javascript" src="lib/jquery.mockjax-2.2.1.js"></script>',

    'jQuery2' =>
 '<script src="lib/jquery-2.2.4.js"></script>
  <script type="text/javascript" src="lib/jquery.mockjax-2.2.1.js"></script>'
}

VARIANTS.each do |name, script|
  output = ''
  in_script = false
  File.open('unit_tests.html').each do |line|
    if in_script
      if line.include? "<!--END HEADER-->"
        output += script
        in_script = false
      end
    else
      if line.include? "<!--BEGIN HEADER-->"
        in_script = true
      else
        output += line
      end
    end
  end
  File.write("#{name}_unit_tests.html", output)
end

