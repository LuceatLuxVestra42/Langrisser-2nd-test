import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSoldierIdentity } from './validate-soldier-identity.mjs';

const read = async (path) => JSON.parse(await readFile(resolve(path), 'utf8'));
const [canonical, soldierInfo, spSoldierInfo, manifest] = await Promise.all([
  read('canonical/soldiers.v1.json'),
  read('evidence/source/configdata/ConfigDataSoldierInfo.records-identity-115.v1.json'),
  read('evidence/source/configdata/ConfigDataSPSoldierInfo.record-5115.v1.json'),
  read('evidence/source/configdata/soldier-identity-115.source-manifest.v1.json'),
]);
validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest });

const wrongIdentity = structuredClone(canonical);
wrongIdentity.records[0].id = 116;
assert.throws(
  () => validateSoldierIdentity({ canonical: wrongIdentity, soldierInfo, spSoldierInfo, manifest }),
  /canonical identity must exactly match NORMAL Soldier 115/,
  'mismatched canonical ID must fail',
);

const wrongCommit = structuredClone(manifest);
wrongCommit.source.commit = '0000000000000000000000000000000000000000';
assert.throws(
  () => validateSoldierIdentity({ canonical, soldierInfo, spSoldierInfo, manifest: wrongCommit }),
  /source commit does not match the pinned snapshot/,
  'un-pinned evidence commit must fail',
);
process.stdout.write('NORMAL Soldier identity negative cases: PASS (canonical ID mismatch; source commit mismatch rejected)\\n');
