const fs = require('fs');
const path = require('path');

const selfPath = path.join(__dirname, 'app-runtime.js');
const appJsSource = fs.readFileSync(selfPath, 'utf8');

const mod = require(selfPath);
const { buildDocument, defaultState } = mod;

const html = buildDocument(defaultState(), appJsSource);
const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('wrote', outPath, html.length, 'bytes');
