var fs = require('fs');
var handlebars = require('handlebars');
var reference = require('reference');

var file = fs.readFileSync('./api.json');

var template = handlebars.compile(fs.readFileSync('./template.html', {encoding: 'utf8'}));
fs.writeFile('./index.html', template({html: reference(file, {anchor: true})}));
