import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateNormalSoldierBaseStats } from './validate-normal-soldier-base-stats.mjs';

const read = async path => JSON.parse(await readFile(resolve(path), 'utf8'));
const [soldiers, relations, stats, evidence, endpoints, manifest] = await Promise.all([
  read('canonical/soldiers.v1.json'), read('canonical/sp-soldier-normal-relations.v1.json'),
  read('canonical/normal-soldier-base-stats.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-normal-soldier-base-stats.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-normal-soldier-base-stats.source-manifest.v1.json'),
]);
const args = { soldiers, relations, stats, evidence, endpoints, manifest, endpointSha256: manifest.artifact.preservedEndpointSha256, evidenceSha256: manifest.artifact.preservedSha256 };
assert.equal(validateNormalSoldierBaseStats(args).canonicalCount, 56);
const mutate = (key, change) => { const copy = structuredClone(args); change(copy[key]); return copy; };
const fails = (key, change, pattern) => assert.throws(() => validateNormalSoldierBaseStats(mutate(key, change)), pattern);

fails('stats', x => x.records.pop(), /canonical ID set mismatch/);
fails('stats', x => x.records.push(structuredClone(x.records[0])), /duplicate canonical record/);
fails('stats', x => { x.records[0].id = 999999; }, /canonical ID set mismatch/);
fails('stats', x => { x.records[0].id = 136; }, /canonical ID set mismatch/);
for (const [field, re] of [['hp', /canonical hp differs/], ['attack', /canonical attack differs/], ['defense', /canonical defense differs/], ['magicDefense', /canonical magicDefense differs/]]) {
  fails('stats', x => { x.records[0].baseStats[field] += 1; }, re);
}
fails('evidence', x => { x.records = x.records.slice(1); }, /claim-scoped evidence ID set mismatch/);
fails('evidence', x => { x.records[0].HP_INI += 1; }, /evidence HP_INI differs/);
fails('endpoints', x => { x.records = x.records.filter(row => row.ID !== 115); }, /pinned endpoint evidence population mismatch/);
fails('endpoints', x => { x.records.find(row => row.ID === 115).HP_INI += 1; }, /evidence HP_INI differs from pinned source for 115/);
fails('stats', x => { x.records[0].provenance += '/wrong'; }, /provenance locator mismatch/);
fails('stats', x => { x.records[0].baseStats.hp = '46'; }, /canonical hp malformed/);
fails('stats', x => { x.records[0].baseStats.unsupported = 1; }, /canonical baseStats schema mismatch/);
assert.throws(() => validateNormalSoldierBaseStats({ ...args, evidenceSha256: '0'.repeat(64) }), /selected evidence hash\/path mismatch/);
fails('manifest', x => { x.artifact.sourceSha256 = '0'.repeat(64); }, /pinned source sourceSha256 mismatch/);
fails('relations', x => { x.records[0].normalSoldierId = 136; }, /relation target set malformed or duplicated|relation target is not in NORMAL identity owner|NORMAL identity set differs/);
process.stdout.write('NORMAL Soldier base stats negatives: PASS (missing/duplicate/wrong/non-target IDs; each stat; missing/changed source row; provenance; nonnumeric/extra field; source hash; relation target)\n');
