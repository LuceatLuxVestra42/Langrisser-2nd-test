import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadPublicSoldierPopulation } from './validate-sp-soldier-relation.mjs';
import { validateSoldierIdentity, readSoldier340Evidence, verifySoldier340Fields } from './validate-soldier-identity.mjs';

const read = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [canonical, soldierInfo, spPopulationBytes, privateIdentityBytes, soldier340Bytes, manifest] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  readFile('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
  readFile('evidence/source/configdata/ConfigDataSoldierInfo.records-hero-15-normal-identities.v1.json'),
  readSoldier340Evidence(process.cwd()),
  read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
]);
const args = { canonical, soldierInfo, spPopulationBytes, privateIdentityBytes, soldier340Bytes, manifest };
const result = validateSoldierIdentity(args);
assert.equal(createHash('sha256').update(spPopulationBytes).digest('hex'),
  'ba41a6a37c873a5cc6196bd3135d2b656896e808741cd2b1df56a555ab888500');
const spSoldierInfo = JSON.parse(spPopulationBytes.toString('utf8'));
const existingKeys = spSoldierInfo.records.flatMap(({ ID, NormalSoliderId }) => [`SP:${ID}`, `NORMAL:${NormalSoliderId}`]);
const privateKeys = ['NORMAL:806', 'NORMAL:817', 'NORMAL:819', 'NORMAL:340'];
const keys = rows => rows.map(({ variant, id }) => `${variant}:${id}`).sort();
assert.equal(new Set(existingKeys).size, 112);
assert.equal(result.privateNormalIdentityCount, 4);
assert.equal(result.totalIdentityCount, 116);
assert.deepEqual(keys(canonical.records), [...existingKeys, ...privateKeys].sort());
const publicPopulation = await loadPublicSoldierPopulation();
assert.deepEqual(keys(publicPopulation.identities.records), existingKeys.sort());
assert.equal(result.spIdentityCount, spSoldierInfo.records.length);
assert.equal(result.normalEndpointIdentityCount, new Set(spSoldierInfo.records.map(row => row.NormalSoliderId)).size);
assert.equal(canonical.records.some(row => row.variant === 'SP' && row.id === 5115), true);
assert.equal(canonical.records.some(row => row.variant === 'NORMAL' && row.id === 115), true);

const changedCommit = structuredClone(manifest);
changedCommit.source.commit = '0000000000000000000000000000000000000000';
assert.throws(() => validateSoldierIdentity({ ...args, manifest: changedCommit }), /pinned source commit mismatch/);
const failsCanonical = (mutate, reason) => {
  const changed = structuredClone(canonical);
  mutate(changed.records);
  assert.throws(() => validateSoldierIdentity({ ...args, canonical: changed }), reason);
};
failsCanonical(rows => { rows.find(row => row.id === 340).variant = 'SP'; }, /NORMAL 340 namespace mismatch/);
failsCanonical(rows => { rows.push({ ...rows.find(row => row.id === 340) }); }, /duplicate canonical Soldier identity NORMAL:340/);

// Recheck the retained projection when the original pinned SoldierInfo file is supplied.
if (process.argv[2]) {
  const bytes = await readFile(process.argv[2]);
  const evidence = JSON.parse(soldier340Bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), evidence.source.sha256);
  const original = JSON.parse(bytes);
  assert.equal(original.filter(row => row.ID === 340).length, 1);
  function compareSourceRecord({ recordLocator, rawFields }) {
    assert.match(recordLocator, /^\/\d+$/);
    const row = original[Number(recordLocator.slice(1))];
    verifySoldier340Fields(row);
    assert.deepEqual({ ID: row.ID, Rank: row.Rank, Useable: row.Useable }, rawFields);
  }
  const [record] = evidence.records;
  compareSourceRecord(record);
  const wrongLocator = { ...structuredClone(record), recordLocator: '/80' };
  assert.throws(() => compareSourceRecord(wrongLocator), /expected SoldierInfo ID 340, found 339/);
  console.log('Pinned SoldierInfo: /81 matched; /80 rejected (expected ID 340, found 339)');
}

const locate = rows => rows.find(row => row.id === 806);
failsCanonical(rows => { locate(rows).id = 999999; }, /not source-derived/);
failsCanonical(rows => { rows.push({ ...locate(rows), id: 999999 }); }, /not source-derived/);
failsCanonical(rows => { rows.splice(rows.indexOf(locate(rows)), 1); }, /canonical identity set differs/);
failsCanonical(rows => { rows.push({ ...locate(rows) }); }, /duplicate canonical Soldier identity/);
failsCanonical(rows => { locate(rows).variant = 'SP'; }, /not source-derived/);
failsCanonical(rows => { locate(rows).provenance = locate(rows).provenance.replace('806', '817'); }, /private NORMAL identity schema or provenance/);
failsCanonical(rows => { locate(rows).Rank = 3; }, /private NORMAL identity schema or provenance/);
for (const mutate of [
  row => { row.rawFields.Rank = 2; },
  row => { row.rawFields.Useable = false; },
  row => { row.recordLocator = '/162'; },
]) {
  const changed = JSON.parse(privateIdentityBytes.toString('utf8'));
  mutate(changed.records[0]);
  assert.throws(() => validateSoldierIdentity({ ...args, privateIdentityBytes: Buffer.from(JSON.stringify(changed)) }),
    /preserved evidence SHA-256 mismatch.*hero-15-normal-identities/);
}
process.stdout.write('Soldier identity population regression: PASS (116 identities, public endpoints 112, private NORMAL 4; pinned source and negative cases)\n');
