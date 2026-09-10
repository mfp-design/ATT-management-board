// Fixed PoC module PoC bundler for Cloudflare's single-file web editor.
// Not a general JavaScript bundler. Fail on new imports rather than hiding them.
import { readFileSync, writeFileSync } from 'node:fs';
const output = process.argv[2];
if (!output) throw Error('Usage: node tools/upsider-poc/build-worker.mjs /absolute/output.mjs');
const parts = ['parse-notification.mjs','classification.mjs','corrections.mjs','worker.mjs'].map(name => {
  let source = readFileSync(new URL(name,import.meta.url),'utf8');
  source = source.replace(/^import \{[^\n]+\} from '\.\/(?:parse-notification|classification|corrections)\.mjs';\n/gm,'');
  if (/^import\s/m.test(source)) throw Error(`Unsupported import in ${name}`);
  source = source.replace(/^export (const|async function|function) /gm,'$1 ');
  return `// ${name}\n${source}`;
});
writeFileSync(output, parts.join('\n'));
