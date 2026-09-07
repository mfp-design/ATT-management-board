const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const selfPath = path.join(projectRoot, 'src', 'app-runtime.js');
const appJsSource = fs.readFileSync(selfPath, 'utf8');

const mod = require(selfPath);
const { buildDocument, defaultState } = mod;

const html = buildDocument(defaultState(), appJsSource);
const outPath = path.join(projectRoot, 'public', 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('wrote', outPath, html.length, 'bytes');
