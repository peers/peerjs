var markdown = require('markdown').markdown;
var handlebars = require('handlebars');
var fs = require('fs');

var data = {
  apiHTML: markdown.toHTML(fs.readFileSync('./api.md', {encoding: 'utf8'})),
  //startHTML: fs.readFileSync('./start.md', {encoding: 'utf8'})
};

var templateFile = fs.readFileSync('./template.html', {encoding: 'utf8'});
var template = handlebars.compile(templateFile);

fs.writeFile('./index.html', template(data));
