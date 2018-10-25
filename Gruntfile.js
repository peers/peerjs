module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    browserify: {
      dev: {
        src: ["dist/exports.js"],
        dest: "dist/peer.js"
      }
    },

    uglify: {
      prod: {
        options: { mangle: true },
        src: "dist/peer.js",
        dest: "dist/peer.min.js"
      }
    },

    copy: {
      dev: {
        files: [
          {
            src: "dist/peer.min.js",
            dest: "./test/public/peer.min.js"
          }
        ]
      }
    },

    concat: {
      dev: {
        src: "dist/peer.js",
        dest: "dist/peer.js"
      },
      prod: {
        src: "dist/peer.min.js",
        dest: "dist/peer.min.js"
      }
    },
    ts: {
      default: {
        src: ["./lib/**/*.ts", "!node_modules/**"],
        tsconfig: "./tsconfig.json"
      },
      options: {
        failOnTypeErrors: false
      }
    }
  });

  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-ts");

  grunt.registerTask("default", [
    "ts",
    "browserify",
    "uglify",
    "concat",
    "copy"
  ]);
};
