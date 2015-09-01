module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      build: ['public/javascripts/app.js']
    },
    jshint: {
      files: ['Gruntfile.js', 'source/javascripts/**/*.js'],
      options: {
        globals: {
          console: true,
          "jQuery": true
        }
      }
    },
    browserify: {
      dev: {
        options: {
          browserifyOptions: {
            debug: true
          }
        },
        files: {
          'public/javascripts/app.js': 'source/javascripts/app.js'
        }
      }
    },
    watch: {
      options: {
        atBegin: true
      },
      dev: {
        files: ['source/javascripts/**/*.js'],
        tasks: ['jshint', 'browserify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'browserify']);

};
