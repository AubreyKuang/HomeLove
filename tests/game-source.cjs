const {readFileSync} = require('node:fs');
const {join} = require('node:path');

// Load the game scripts in the same order as the browser for tests that
// exercise selected functions without a DOM.
module.exports = html => Array.from(html.matchAll(/<script src="(js\/[^"?]+)/g), ([, path]) =>
  readFileSync(join(__dirname, '..', path), 'utf8')
).join('\n');
