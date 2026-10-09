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
// The current target is derived from admitted Soldier identities and exact pinned endpoint facts.
const identityRows = soldiers.records.filter(record => record.entity === 'Soldier');
const requiredIds = [];
for (const identity of identityRows) {
  const matchingIdentityRows = identityRows.filter(record => record.id === identity.id);
  assert.equal(matchingIdentityRows.length, 1, `Soldier identity must be unique for ID=${identity.id}`);
  assert.equal(typeof identity.variant, 'string');
  assert.ok(identity.variant.length > 0, `Soldier variant must be explicit for ID=${identity.id}`);

  const sourceRows = endpoints.records.filter(record => record.ID === identity.id);
  assert.equal(sourceRows.length, 1, `pinned endpoint row must occur exactly once for ID=${identity.id}`);
  const sourceRow = sourceRows[0];
  assert.equal(Object.hasOwn(sourceRow, 'BF_MovePoint'), true, `BF_MovePoint must be explicit for ID=${identity.id}`);
  assert.equal(typeof sourceRow.BF_MovePoint, 'number', `BF_MovePoint must be numeric for ID=${identity.id}`);
  assert.equal(Number.isFinite(sourceRow.BF_MovePoint), true, `BF_MovePoint must be finite for ID=${identity.id}`);
  requiredIds.push(identity.id);
}
assert.equal(new Set(requiredIds).size, requiredIds.length, 'required Soldier IDs must be unique');

const result = validateSoldierBfMovePoints(args);

// General owner acceptance: the validator accepts the complete current source-backed fact set.
assert.equal(result.canonicalCount, requiredIds.length);
assert.equal(result.fieldCoverage, requiredIds.length);

// Exact full-population scope: canonical IDs must match the current admitted, source-backed target.
const assertCurrentMigrationScope = records => {
  const actualIds = records.map(record => record.soldierId);
  const actualIdSet = new Set(actualIds);
  assert.equal(actualIds.length, actualIdSet.size, 'canonical migration scope must not contain duplicate IDs');
  assert.equal(actualIds.length, requiredIds.length, 'canonical migration scope must have the exact target count');
  for (const id of requiredIds) {
    assert.equal(actualIdSet.has(id), true, `canonical migration scope is missing Soldier ID=${id}`);
  }
};
assertCurrentMigrationScope(canonical.records);

for (const record of canonical.records) {
  const sourceRow = endpoints.records.find(row => row.ID === record.soldierId);
  assert.equal(record.bfMovePoint, sourceRow.BF_MovePoint, `canonical/source field parity for ID=${record.soldierId}`);
  assert.equal(record.provenance, `${manifest.artifacts.soldierInfoEndpoints.repoPreservedPath}#ID=${record.soldierId}/BF_MovePoint`);
}

// The former canonical-outside positive fixture was specific to partial migration.
// The full current target has no eligible outside fixture; owner acceptance above uses
// the actual complete population. These independent mutations exercise exact scope rejection.
assert.throws(() => assertCurrentMigrationScope(canonical.records.slice(1)), /target count/);
const duplicatedPopulation = [...canonical.records, structuredClone(canonical.records[0])];
assert.throws(() => assertCurrentMigrationScope(duplicatedPopulation), /duplicate IDs/);
const extraRecord = { ...structuredClone(canonical.records[0]), soldierId: 9999 };
assert.throws(() => assertCurrentMigrationScope([...canonical.records, extraRecord]), /target count/);
const substitutedPopulation = [...canonical.records.slice(1), extraRecord];
assert.throws(() => assertCurrentMigrationScope(substitutedPopulation), /target count|missing Soldier ID/);

// Owner-validator negative cases.
const withRecords = records => ({ ...canonical, records });
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([...canonical.records, structuredClone(canonical.records[0])]) }), /duplicate canonical Soldier ID/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], soldierId: 9999 }]) }), /not admitted by Soldier identity owner/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], bfMovePoint: 4 }]) }), /differs from pinned source/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, canonical: withRecords([{ ...canonical.records[0], provenance: 'evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json#ID=115/MoveType' }]) }), /provenance locator mismatch/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, endpointSha256: '0'.repeat(64) }), /evidence hash mismatch/);
assert.throws(() => validateSoldierBfMovePoints({ ...args, manifest: { ...manifest, source: { ...manifest.source, commit: '0'.repeat(40) } } }), /repository\/commit mismatch/);

process.stdout.write(`Soldier BF_MovePoint validation and full-population migration scope: PASS (${result.canonicalCount}/${requiredIds.length})\\n`);
