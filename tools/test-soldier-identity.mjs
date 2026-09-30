import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSoldierIdentity } from './validate-soldier-identity.mjs';

const read = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [canonical, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-sp-soldier-endpoints.v1.json'),
  read('evidence/source/configdata/ConfigDataSPSoldierInfo.records-all-sp-soldiers.v1.json'),
  read('evidence/source/configdata/sp-soldier-population.source-manifest.v1.json'),
]);
const result = validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest });
assert.equal(result.spIdentityCount, spSoldierInfo.records.length);
assert.equal(result.normalEndpointIdentityCount, new Set(spSoldierInfo.records.map(row => row.NormalSoliderId)).size);
assert.equal(canonical.records.some(row => row.variant === 'SP' && row.id === 5115), true);
assert.equal(canonical.records.some(row => row.variant === 'NORMAL' && row.id === 115), true);

const changedCommit = structuredClone(manifest);
changedCommit.source.commit = '0000000000000000000000000000000000000000';
assert.throws(() => validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest: changedCommit }), /pinned source commit mismatch/);
process.stdout.write(`Soldier identity population regression: PASS (${result.spIdentityCount} SP identities; ${result.normalEndpointIdentityCount} NORMAL endpoint identities; pinned source enforced)\\n`);
