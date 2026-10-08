import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { validateSoldierBfMovePoints } from './validate-soldier-bf-move-points.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const [soldiers, canonical, endpoints, manifest, endpointBytes] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('canonical/soldier-bf-move-points.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
  readFile('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
]);
const args = { soldiers, canonical, endpoints, manifest, endpointSha256: createHash('sha256').update(endpointBytes).digest('hex') };
const result = validateSoldierBfMovePoints(args);
assert.equal(result.canonicalCount, 4);
assert.deepEqual(canonical.records.map(record => record.soldierId), [115, 5115, 118, 121]);
assert.equal(canonical.records[0].bfMovePoint, 3);
assert.equal(canonical.records[1].bfMovePoint, 3);
assert.equal(canonical.records[2].bfMovePoint, 3);
assert.equal(canonical.records[3].bfMovePoint, 3);

// Current migration scope is a separate Gate, not an owner-validator special case.
const assertCurrentMigrationScope = records => {
  assert.deepEqual(records.map(record => record.soldierId), [115, 5115, 118, 121]);
  const identity115 = soldiers.records.filter(record => record.entity === 'Soldier' && record.id === 115);
  assert.equal(identity115.length, 1);
  assert.equal(identity115[0].variant, 'NORMAL');
  const identity5115 = soldiers.records.filter(record => record.entity === 'Soldier' && record.id === 5115);
  assert.equal(identity5115.length, 1);
  assert.equal(identity5115[0].variant, 'SP');
  const identity118 = soldiers.records.filter(record => record.entity === 'Soldier' && record.id === 118);
  assert.equal(identity118.length, 1);
  assert.equal(identity118[0].variant, 'NORMAL');
  const identity121 = soldiers.records.filter(record => record.entity === 'Soldier' && record.id === 121);
  assert.equal(identity121.length, 1);
  assert.equal(identity121[0].variant, 'NORMAL');
};
assertCurrentMigrationScope(canonical.records);

// The core rule remains general: another already admitted Soldier can pass the owner validator.
const source129 = endpoints.records.find(record => record.ID === 129);
assert.ok(source129);
const record129 = {
  soldierId: 129,
  bfMovePoint: source129.BF_MovePoint,
  provenance: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=129/BF_MovePoint',
};
const widerPopulation = [...canonical.records, record129];
assert.equal(validateSoldierBfMovePoints({ ...args, canonical: { ...canonical, records: widerPopulation } }).canonicalCount, 5);
assert.throws(() => assertCurrentMigrationScope(widerPopulation));

// Owner-validator negative cases.
const withRecords = records => ({ ...canonical, records });
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([...canonical.records, structuredClone(canonical.records[0])]) }), /duplicate canonical Soldier ID/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], soldierId: 9999 }]) }), /not admitted by Soldier identity owner/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], bfMovePoint: 4 }]) }), /differs from pinned source/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], provenance: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=115/MoveType' }]) }), /provenance locator mismatch/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, endpointSha256: '0'.repeat(64) }), /evidence hash mismatch/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, manifest: { ...manifest, source: { ...manifest.source, commit: '0'.repeat(40) } } }), /repository\/commit mismatch/);

process.stdout.write('Soldier BF_MovePoint validation and [115,5115,118,121] migration scope: PASS\\n');
