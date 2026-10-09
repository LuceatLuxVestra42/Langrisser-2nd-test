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
assert.equal(result.canonicalCount, 25);
assert.deepEqual(canonical.records.map(record => record.soldierId), [115, 5115, 118, 121, 129, 130, 132, 203, 210, 216, 225, 231, 237, 244, 245, 248, 311, 314, 320, 324, 326, 402, 410, 413, 419]);
assert.equal(canonical.records[0].bfMovePoint, 3);
assert.equal(canonical.records[1].bfMovePoint, 3);
assert.equal(canonical.records[2].bfMovePoint, 3);
assert.equal(canonical.records[3].bfMovePoint, 3);
assert.equal(canonical.records[4].bfMovePoint, 3);
assert.equal(canonical.records[5].bfMovePoint, 3);
assert.equal(canonical.records[6].bfMovePoint, 3);
assert.equal(canonical.records[7].bfMovePoint, 3);
assert.equal(canonical.records[8].bfMovePoint, 3);
assert.equal(canonical.records[9].bfMovePoint, 3);
assert.equal(canonical.records[10].bfMovePoint, 3);
assert.equal(canonical.records[11].bfMovePoint, 3);
assert.equal(canonical.records[12].bfMovePoint, 3);
assert.equal(canonical.records[13].bfMovePoint, 3);
assert.equal(canonical.records[14].bfMovePoint, 3);
assert.equal(canonical.records[15].bfMovePoint, 4);
assert.equal(canonical.records[16].bfMovePoint, 5);
assert.equal(canonical.records[17].bfMovePoint, 5);
assert.equal(canonical.records[18].bfMovePoint, 5);
assert.equal(canonical.records[19].bfMovePoint, 5);
assert.equal(canonical.records[20].bfMovePoint, 5);
assert.equal(canonical.records[21].bfMovePoint, 5);
assert.equal(canonical.records[22].bfMovePoint, 5);
assert.equal(canonical.records[23].bfMovePoint, 5);
assert.equal(canonical.records[24].bfMovePoint, 5);

// Current migration scope is a separate Gate, not an owner-validator special case.
const assertCurrentMigrationScope = records => {
  assert.deepEqual(records.map(record => record.soldierId), [115, 5115, 118, 121, 129, 130, 132, 203, 210, 216, 225, 231, 237, 244, 245, 248, 311, 314, 320, 324, 326, 402, 410, 413, 419]);
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
  for (const id of [129, 130, 132, 203, 210, 216, 225, 231, 237, 244, 245, 248, 311, 314, 320, 324, 326, 402, 410, 413, 419]) {
    const identity = soldiers.records.filter(record => record.entity === 'Soldier' && record.id === id);
    assert.equal(identity.length, 1);
    assert.equal(identity[0].variant, 'NORMAL');
  }
};
assertCurrentMigrationScope(canonical.records);

// The core rule remains general: another admitted Soldier outside the current migration
// scope must pass owner validation, while the migration scope Gate still rejects it.
const canonicalIds = new Set(canonical.records.map(record => record.soldierId));
const outsideIdentity = soldiers.records.find(identity =>
  identity.entity === 'Soldier'
  && !canonicalIds.has(identity.id)
  && soldiers.records.filter(row => row.entity === 'Soldier' && row.id === identity.id).length === 1
  && endpoints.records.filter(row => row.ID === identity.id).length === 1
  && Object.hasOwn(endpoints.records.find(row => row.ID === identity.id), 'BF_MovePoint')
);
assert.ok(outsideIdentity, 'an admitted Soldier with exact pinned evidence outside migration scope is required');
const outsideIdentityRows = soldiers.records.filter(row => row.entity === 'Soldier' && row.id === outsideIdentity.id);
assert.equal(outsideIdentityRows.length, 1, 'selected fixture identity must be admitted exactly once');
assert.equal(outsideIdentityRows[0], outsideIdentity);
assert.equal(canonicalIds.has(outsideIdentity.id), false, 'selected fixture must remain outside canonical scope');
const outsideEvidenceRows = endpoints.records.filter(row => row.ID === outsideIdentity.id);
assert.equal(outsideEvidenceRows.length, 1, 'selected fixture must have exactly one pinned endpoint row');
const outsideSource = outsideEvidenceRows[0];
assert.equal(Object.hasOwn(outsideSource, 'BF_MovePoint'), true, 'selected fixture must explicitly contain BF_MovePoint');
assert.equal(typeof outsideSource.BF_MovePoint, 'number');
assert.equal(Number.isFinite(outsideSource.BF_MovePoint), true);
const outsideRecord = {
  soldierId: outsideIdentity.id,
  bfMovePoint: outsideSource.BF_MovePoint,
  provenance: `evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=${outsideIdentity.id}/BF_MovePoint`,
};
assert.equal(outsideRecord.provenance, `${manifest.artifacts.soldierInfoEndpoints.repoPreservedPath}#ID=${outsideIdentity.id}/BF_MovePoint`);
const widerPopulation = [...canonical.records, outsideRecord];
assert.equal(validateSoldierBfMovePoints({ ...args, canonical: { ...canonical, records: widerPopulation } }).canonicalCount, canonical.records.length + 1);
assert.throws(() => assertCurrentMigrationScope(widerPopulation));

// Owner-validator negative cases.
const withRecords = records => ({ ...canonical, records });
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([...canonical.records, structuredClone(canonical.records[0])]) }), /duplicate canonical Soldier ID/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], soldierId: 9999 }]) }), /not admitted by Soldier identity owner/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], bfMovePoint: 4 }]) }), /differs from pinned source/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], provenance: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=115/MoveType' }]) }), /provenance locator mismatch/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, endpointSha256: '0'.repeat(64) }), /evidence hash mismatch/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, manifest: { ...manifest, source: { ...manifest.source, commit: '0'.repeat(40) } } }), /repository\/commit mismatch/);

process.stdout.write('Soldier BF_MovePoint validation and [115,5115,118,121,129,130,132,203,210,216,225,231,237,244,245,248,311,314,320,324,326,402,410,413,419] migration scope: PASS\\n');
