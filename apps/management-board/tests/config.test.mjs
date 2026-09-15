import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localConfig, validateLocalConfig } from '../scripts/check-config.mjs';

test('configuration check rejects remote D1, foreign bindings, inherited secrets and public routing', () => {
  for (const change of [
    c => { c.d1_databases[0].remote = true; },
    c => { c.d1_databases[0].database_id = 'foreign-db'; },
    c => { c.vars.APP_ENV = 'production'; },
    c => { c.name = 'att-upsider-poc'; },
    c => { c.vars.SLACK_BOT_TOKEN = 'must-not-inherit'; },
    c => { c.unsafe = { bindings: [] }; },
    c => { c.workers_dev = true; },
    c => { c.assets.run_worker_first = false; },
  ]) { const config = structuredClone(localConfig); change(config); assert.throws(() => validateLocalConfig(config)); }
});
test('staging and production templates have distinct placeholders and are not deployable resources', () => {
  const configs = ['staging', 'production'].map(name => JSON.parse(readFileSync(new URL(`../config/${name}.json.example`, import.meta.url))));
  assert.notEqual(configs[0].name, configs[1].name);
  assert.notEqual(configs[0].d1_databases[0].database_id, configs[1].d1_databases[0].database_id);
  for (const config of configs) {
    assert.match(config.d1_databases[0].database_id, /^REPLACE_WITH_/);
    assert.equal(config.vars.APP_INSTANCE, config.name); assert.equal(config.workers_dev, false);
    assert.equal(config.assets.run_worker_first, true);
  }
});
