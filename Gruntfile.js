module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    umd: {
      intercooler: {
        options: {
          src: 'src/intercooler.js',
          dest: 'www/release/intercooler-<%= pkg.version %>.js',
          // amdModuleId if commented out defaults to the filename without the `.js`, since Intercooler keeps copies of
          //  older Intercoolers in its www/release directory, keep this commented to prevent conflicts with older ones.
          // amdModuleId: 'intercooler', // The `require('intercooler')` id used to import, lower-case name is usual
          objectToExport: 'Intercooler',
          globalAlias: 'Intercooler', // Always force an Intercooler object
          deps: {
              'default': [{jquery: '$'}],
              amd: [{jquery: '$'}],
              cjs: [{jquery: '$'}],
              global: [{jQuery: '$'}] // Capital Q because that is how jQuery is in the global scope unlike the others
          }
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %>  <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'www/release/intercooler-<%= pkg.version %>.js',
        dest: 'www/release/intercooler-<%= pkg.version %>.min.js'
      }
    },
    "regex-replace": {
      "update-test-ref": { //specify a target with any name
        src: ['www/release/unit-tests-<%= pkg.version %>.html',
              'www/release/jQuery1_unit-tests-<%= pkg.version %>.html',
              'www/release/jQuery2_unit-tests-<%= pkg.version %>.html',
              'www/release/zepto_unit-tests-<%= pkg.version %>.html'],
        actions: [
          {
            name: 'lib ref',
            search: "../src/intercooler.js",
            replace: './intercooler-<%= pkg.version %>.js',
            flags: 'g'
          }
        ]
      },
      "update-test-ref-2": { //specify a target with any name
        src: ['www/release/unit-tests-<%= pkg.version %>.min.html'],
        actions: [
          {
            name: 'lib ref',
            search: "../src/intercooler.js",
            replace: './intercooler-<%= pkg.version %>.min.js',
            flags: 'g'
          }
        ]
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-regex-replace');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('dist', "Copy Distribution files", function () {
    grunt.file.copy('www/release/intercooler-' + grunt.config.get('pkg').version + '.js', 'dist/intercooler.js');
    grunt.file.copy('www/release/intercooler-' + grunt.config.get('pkg').version + '.min.js', 'dist/intercooler.min.js');
  });

  grunt.registerTask('release', "Releases a new version of the library", function () {
    grunt.file.copy("src/intercooler-debugger.js", 'www/release/intercooler-debugger.js');

    grunt.file.copy("test/lib/blanket.min.js", 'www/release/blanket.min.js');

    grunt.file.copy("test/lib/jquery.mockjax-2.2.1.js", 'www/release/lib/jquery.mockjax-2.2.1.js');
    grunt.file.copy("test/lib/jquery-1.10.2.js", 'www/release/lib/jquery-1.10.2.js');
    grunt.file.copy("test/lib/jquery-2.2.4.js", 'www/release/lib/jquery-2.2.4.js');
    grunt.file.copy("test/lib/jquery-3.1.1.js", 'www/release/lib/jquery-3.1.1.js');

    grunt.file.copy("test/lib/zepto.mockjax-1.2.0.js", 'www/release/lib/zepto.mockjax-1.2.0.js');
    grunt.file.copy("test/lib/zepto.data-1.2.0.js", 'www/release/lib/zepto.data-1.2.0.js');
    grunt.file.copy("test/lib/zepto-1.2.0.min.js", 'www/release/lib/zepto-1.2.0.min.js');

    grunt.file.copy("test/unit_tests.html", 'www/release/unit-tests-' + grunt.config.get('pkg').version + '.html');
    grunt.file.copy("test/unit_tests.html", 'www/release/unit-tests-' + grunt.config.get('pkg').version + '.min.html');
    grunt.file.copy("test/jQuery2_unit_tests.html", 'www/release/jQuery2_unit-tests-' + grunt.config.get('pkg').version + '.html');
    grunt.file.copy("test/jQuery1_unit_tests.html", 'www/release/jQuery1_unit-tests-' + grunt.config.get('pkg').version + '.html');
    grunt.file.copy("test/zepto_unit_tests.html", 'www/release/zepto_unit-tests-' + grunt.config.get('pkg').version + '.html');

    grunt.task.run('umd:intercooler');
    grunt.task.run('uglify');
    grunt.task.run('regex-replace');
    grunt.task.run('dist');
  });

  // Default task(s).
  grunt.registerTask('default', ['release']);

};
