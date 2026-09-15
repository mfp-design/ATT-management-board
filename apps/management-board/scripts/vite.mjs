import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import './check-config.mjs';
const mode = process.argv[2];
if (!['dev', 'build', 'preview'].includes(mode)) throw Error('Choose dev, build or preview');
const localEnv = { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: '.wrangler/logs' };
delete localEnv.CLOUDFLARE_ENV;
delete localEnv.CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH;
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), mode], {
  cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit',
  env: localEnv,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
