/**
 * Module dependencies.
 */

var fs = require('fs')
  , package = JSON.parse(fs.readFileSync(__dirname+ '/../package.json'))
  , uglify = require('uglify-js');

/**
 * License headers.
 *
 * @api private
 */

var template = '/*! peerjs.%ext% build:' + package.version + ', %type%. Copyright(c) 2013 Michelle Bu <michelle@michellebu.com> */'
  , prefix = '\n(function(exports){\n'
  , development = template.replace('%type%', 'development').replace('%ext%', 'js')
  , production = template.replace('%type%', 'production').replace('%ext%', 'min.js')
  , suffix = '\n})(this);\n';

/**
 * If statements, these allows you to create serveride & client side compatible
 * code using specially designed `if` statements that remove serverside
 * designed code from the source files
 *
 * @api private
 */

var starttagIF = '// if node'
  , endtagIF = '// end node';

/**
 * The modules that are required to create a base build of BinaryJS client.
 *
 * @const
 * @type {Array}
 * @api private
 */

var base = [
    '../deps/js-binarypack/lib/bufferbuilder.js'
  , '../deps/js-binarypack/lib/binarypack.js'
  , '../deps/EventEmitter/EventEmitter.js'
  , '../deps/reliable/lib/reliable.js'
  , 'adapter.js' 
  , 'util.js'
  , 'peer.js'
  , 'dataconnection.js'
  , 'mediaconnection.js'
  , 'negotiator.js'
  , 'socket.js'

];


/**
 * @param {Array} transports The transports that needs to be bundled.
 * @param {Object} [options] Options to configure the building process.
 * @param {Function} callback Last argument should always be the callback
 * @callback {String|Boolean} err An optional argument, if it exists than an error
 *    occurred during the build process.
 * @callback {String} result The result of the build process.
 * @api public
 */

var builder = module.exports = function () {
    var options, callback, error = null
    , args = Array.prototype.slice.call(arguments, 0)
    , settings = {
        minify: true
      , node: false
      , custom: []
      };

  // Fancy pancy argument support this makes any pattern possible mainly
  // because we require only one of each type
  args.forEach(function (arg) {
    var type = Object.prototype.toString.call(arg)
        .replace(/\[object\s(\w+)\]/gi , '$1' ).toLowerCase();

    switch (type) {
      case 'object':
        return options = arg;
      case 'function':
        return callback = arg;
    }
  });

  // Add defaults
  options = options || {};

  // Merge the data
  for(var option in options) {
    settings[option] = options[option];
  }

  var files = [];
  base.forEach(function (file) {
    files.push(__dirname + '/../lib/' + file);
  });

  var results = {};
  files.forEach(function (file) {
    fs.readFile(file, function (err, content) {
      if (err) error = err;
      results[file] = content;

      // check if we are done yet, or not.. Just by checking the size of the result
      // object.
      if (Object.keys(results).length !== files.length) return;


      // concatinate the file contents in order
      var code = development
        , ignore = 0;
        
      code += prefix;

      files.forEach(function (file) {
        code += results[file];
      });

      // check if we need to add custom code
      if (settings.custom.length) {
        settings.custom.forEach(function (content) {
          code += content;
        });
      }

      if (!settings.node) {
        code = code.split('\n').filter(function (line) {
          // check if there are tags in here
          var start = line.indexOf(starttagIF) >= 0
            , end = line.indexOf(endtagIF) >= 0
            , ret = ignore;

          // ignore the current line
          if (start) {
            ignore++;
            ret = ignore;
          }

          // stop ignoring the next line
          if (end) {
            ignore--;
          }

          return ret == 0;
        }).join('\n');
      }

      code += suffix;
      
      // check if we need to process it any further
      if (settings.minify) {
        var ast = uglify.parser.parse(code);
        ast = uglify.uglify.ast_mangle(ast);
        ast = uglify.uglify.ast_squeeze(ast);

        code = production + uglify.uglify.gen_code(ast, { ascii_only: true });
      }

      callback(error, code);
    })
  })
};

/**
 * @type {String}
 * @api public
 */

builder.version = package.version;

/**
 * Command line support, this allows us to generate builds without having
 * to load it as module.
 */

if (!module.parent){
  // the first 2 are `node` and the path to this file, we don't need them
  var args = process.argv.slice(2);
  // build a development build
  builder(args.length ? args : false, { minify:false }, function (err, content) {
    if (err) return console.error(err);
		console.log(__dirname);
    fs.write(
        fs.openSync(__dirname + '/../dist/peer.js', 'w')
      , content
      , 0
      , 'utf8'
    );
    console.log('Successfully generated the development build: peer.js');
  });

  // and build a production build
  builder(args.length ? args : false, function (err, content) {
    if (err) return console.error(err);

    fs.write(
        fs.openSync(__dirname + '/../dist/peer.min.js', 'w')
      , content
      , 0
      , 'utf8'
    );
    console.log('Successfully generated the production build: peer.min.js');
  });
}
