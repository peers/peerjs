module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      dev: {
        src: ['lib/exports.js'],
        dest: 'dist/peer.js'
      }
    },

    uglify: {
      prod: {
        options: { mangle: true },
        src: 'dist/peer.js',
        dest: 'dist/peer.min.js'
      }
    },

    copy: {
      dev: {
        files: [
          {
            src: 'dist/peer.min.js',
            dest: 'test/public/peer.min.js'
          }
        ]
      }
    },

    concat: {
      dev: {
        src: 'dist/peer.js',
        dest: 'dist/peer.js',
      },
      prod: {
        src: 'dist/peer.min.js',
        dest: 'dist/peer.min.js',
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['browserify', 'uglify', 'concat', 'copy']);
}