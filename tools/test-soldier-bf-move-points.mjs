import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { validateSoldierIdentity, readSoldier340Evidence } from './validate-soldier-identity.mjs';
import { selectPublicSoldierIdentities } from './validate-sp-soldier-relation.mjs';
import { validateSoldierBfMovePoints } from './validate-soldier-bf-move-points.mjs';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const [soldiers, canonical, endpoints, manifest, endpointBytes, spPopulationBytes, privateIdentityBytes, soldier340Bytes, relations] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('canonical/soldier-bf-move-points.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
  readFile('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  readFile('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
  readFile('evidence/source/configdata/ConfigDataSoldierInfo.records-hero-15-normal-identities.v1.json'),
  readSoldier340Evidence(process.cwd()),
  read('canonical/sp-soldier-normal-relations.v1.json'),
]);
const args = { soldiers, canonical, endpoints, manifest, endpointSha256: createHash('sha256').update(endpointBytes).digest('hex') };
// The preserved full table was compared against the pinned Legacy blob byte source.
assert.equal(createHash('sha256').update(spPopulationBytes).digest('hex'),
  'ba41a6a37c873a5cc6196bd3135d2b656896e808741cd2b1df56a555ab888500');
const spSoldierInfo = JSON.parse(spPopulationBytes.toString('utf8'));
assert.equal(spSoldierInfo.records.length, 56);
const expectedEndpoints = spSoldierInfo.records.flatMap(({ ID, NormalSoliderId }) =>
  [['SP', ID], ['NORMAL', NormalSoliderId]]);
const endpointKeys = rows => rows.map(([variant, id]) => `${variant}:${id}`).sort();
assert.equal(new Set(endpointKeys(expectedEndpoints)).size, 112);
const requiredIds = expectedEndpoints.map(([, id]) => id);
assert.equal(new Set(requiredIds).size, 112);
for (const id of requiredIds) {
  const sourceRows = endpoints.records.filter(record => record.ID === id);
  assert.equal(sourceRows.length, 1, `pinned endpoint row must occur exactly once for ID=${id}`);
  assert.ok(Number.isFinite(sourceRows[0].BF_MovePoint), `BF_MovePoint must be explicit and finite for ID=${id}`);
}
const synthetic = { entity: 'Soldier', id: 999999, variant: 'NORMAL', provenance: 'test-only' };
const extended = { ...soldiers, records: [...soldiers.records, synthetic] };
const selectionInputs = { soldiers: extended, relations, soldierInfo: endpoints, spPopulationBytes, manifest };
const publicIdentities = selectPublicSoldierIdentities(selectionInputs);
assert.deepEqual(endpointKeys(publicIdentities.records.map(({ variant, id }) => [variant, id])),
  endpointKeys(expectedEndpoints));
assert.deepEqual(validateSoldierBfMovePoints(args), validateSoldierBfMovePoints({ ...args, soldiers: publicIdentities }));
assert.deepEqual(validateSoldierBfMovePoints({ ...args, soldiers: extended }), validateSoldierBfMovePoints(args));
assert.throws(() => validateSoldierIdentity({ canonical: extended, soldierInfo: endpoints, spPopulationBytes, privateIdentityBytes, soldier340Bytes, manifest }), /not source-derived/);

const swapped = structuredClone(relations);
swapped.records.find(row => row.spSoldierId === 5203).normalSoldierId = 216;
swapped.records.find(row => row.spSoldierId === 5216).normalSoldierId = 203;
assert.throws(() => selectPublicSoldierIdentities({ ...selectionInputs, relations: swapped }), /canonical relation set differs/);
const swappedSource = structuredClone(spSoldierInfo);
swappedSource.records.find(row => row.ID === 5203).NormalSoliderId = 216;
swappedSource.records.find(row => row.ID === 5216).NormalSoliderId = 203;
assert.throws(() => selectPublicSoldierIdentities({
  ...selectionInputs, relations: swapped, spPopulationBytes: Buffer.from(JSON.stringify(swappedSource)),
}), /preserved evidence SHA-256 mismatch/);

for (const records of [
  extended.records.filter(row => row.id !== 203),
  extended.records.map(row => row.id === 203 ? { ...row, variant: 'SP' } : row),
  [...extended.records, extended.records.find(row => row.id === 203)],
]) {
  assert.throws(() => selectPublicSoldierIdentities({ ...selectionInputs, soldiers: { ...extended, records } }),
    /NORMAL target canonical identity missing|public Soldier endpoints/);
}
const nonTarget = structuredClone(relations);
nonTarget.records.find(row => row.spSoldierId === 5203).normalSoldierId = synthetic.id;
assert.throws(() => selectPublicSoldierIdentities({ ...selectionInputs, relations: nonTarget }), /canonical relation set differs/);

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

process.stdout.write(`Soldier BF_MovePoint pinned public endpoints and separate registration guard: PASS (${result.canonicalCount}/${requiredIds.length})\\n`);
