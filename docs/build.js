const fs = require('fs');
const handlebars = require('handlebars');
const reference = require('reference');

const file = fs.readFileSync('./api.json');

const template = handlebars.compile(
  fs.readFileSync('./template.html', { encoding: 'utf8' })
);
fs.writeFileSync(
  './index.html',
  template({ html: reference(file, { anchor: true }) })
);
