// Visual reference only: synthetic records, never production data.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const app = require(path.join(root, 'src/app-runtime.js'));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8'));
const out = process.argv[2];
if (!out) throw new Error('Pass a temporary output directory');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), app.buildDocument(data, fs.readFileSync(path.join(root, 'src/app-runtime.js'), 'utf8')));
console.log(out);
