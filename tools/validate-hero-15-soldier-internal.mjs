import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadHero15SoldierInputs, OUTPUT, renderHero15SoldierInternal, SCOPE } from './hero-15-soldier-internal-consumer.mjs';

export function validateHero15SoldierProjection({ relations, soldiers }, text) {
  const expected = relations.records.filter(row => row.heroId === 15);
  assert.equal(expected.length, 14);
  assert.equal(new Set(expected.map(row => row.soldierId)).size, 14);
  const identityIds = soldiers.records.filter(row => row.entity === 'Soldier').map(row => row.id);
  assert.equal(new Set(identityIds).size, identityIds.length);
  const generated = JSON.parse(text);
  assert.deepEqual(generated, JSON.parse(renderHero15SoldierInternal({ relations, soldiers })));
  assert.equal(generated.scope, SCOPE);
  assert.equal(generated.records.filter(r => r.evidenceClass === 'A').length, 7);
  assert.equal(generated.records.filter(r => r.evidenceClass === 'B').length, 7);
  for (const row of generated.records) {
    assert.equal(row.heroId, 15);
    assert.ok(row.evidencePoolLocator.includes(`#heroId=15&soldierId=${row.soldierId}`));
    assert.ok(Array.isArray(row.provenance) && row.provenance.length > 0);
    assert.equal(row.soldierIdentity.entity, 'Soldier');
    assert.equal(row.soldierIdentity.id, row.soldierId);
  }
  assert.equal(text, `${JSON.stringify(generated, null, 2)}\n`);
}

export async function validateFromRoot(root = process.cwd()) {
  const inputs = await loadHero15SoldierInputs(root);
  validateHero15SoldierProjection(inputs, await readFile(resolve(root, OUTPUT), 'utf8'));
  console.log('Hero 15 Soldier internal projection: PASS (14 relations, 7 A / 7 B, exact Soldier endpoints)');
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('tools/validate-hero-15-soldier-internal.mjs')) await validateFromRoot();
