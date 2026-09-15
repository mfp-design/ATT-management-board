import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export function validateLocalConfig(config) {
  assert.equal(config.name, 'att-management-board-local');
  assert.equal(config.vars.APP_ENV, 'local');
  assert.equal(config.vars.APP_INSTANCE, config.name);
  assert.equal(config.vars.SYSTEM_EMAIL, 'info@mfp-design.jp');
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.d1_databases.length, 1);
  const db = config.d1_databases[0];
  assert.equal(db.binding, 'DB');
  assert.equal(db.database_name, 'att-management-board-local-db');
  assert.equal(db.database_id, '00000000-0000-0000-0000-000000000014');
  assert.equal(db.remote, false);
  assert.equal(config.account_id, undefined);
  assert.equal(config.env, undefined);
  assert.equal(config.services, undefined);
  assert.equal(config.unsafe, undefined);
  assert.deepEqual(Object.keys(config.vars).sort(), ['APP_ENV', 'APP_INSTANCE', 'SYSTEM_EMAIL']);
}
export const localConfig = JSON.parse(readFileSync(new URL('../wrangler.json', import.meta.url)));
validateLocalConfig(localConfig);
console.log('Local environment configuration verified.');
